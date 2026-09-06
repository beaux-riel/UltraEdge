import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import { createSecureStorageAdapter } from './supabase';
import { runLocalPlanOperation } from './localPlanStorage';
import { LiveRoom, LiveSnapshot, PendingReport, nextReportRevision } from './liveRaceModel';
const KEY='@ultraedge/live-rooms-v1';
export interface LiveCache { rooms:LiveRoom[]; pending:PendingReport[]; actorId:string|null; lastSync:Record<string,string>; }
let client:SupabaseClient|undefined;
function connection(){
 const url=process.env.EXPO_PUBLIC_SUPABASE_URL||''; const key=process.env.EXPO_PUBLIC_SUPABASE_KEY||process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY||'';
 if(!url||!key)throw new Error('Live collaboration is not configured in this build.');
 return client??=createClient(url,key,{global:{fetch:async(input,init)=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);const abort=()=>controller.abort();init?.signal?.addEventListener('abort',abort);try{return await fetch(input,{...init,signal:controller.signal});}finally{clearTimeout(timer);init?.signal?.removeEventListener('abort',abort);}}},auth:{storage:createSecureStorageAdapter(),storageKey:'ultraedge-live-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
}
export async function readLiveCache():Promise<LiveCache>{const raw=await AsyncStorage.getItem(KEY);return raw?JSON.parse(raw):{rooms:[],pending:[],actorId:null,lastSync:{}};}
async function editCache(change:(c:LiveCache)=>LiveCache){return runLocalPlanOperation(async()=>{const next=change(await readLiveCache());await AsyncStorage.setItem(KEY,JSON.stringify(next));return next;});}
async function identify(){
 const c=connection(); let {data:{session},error}=await c.auth.getSession();if(error)throw error;
 if(!session){const result=await c.auth.signInAnonymously();if(result.error)throw result.error;session=result.data.session;}
 if(!session)throw new Error('Could not establish a private device identity.');
 const cache=await readLiveCache();
 if(cache.actorId&&cache.actorId!==session.user.id)throw new Error('This device identity changed. Recover or discard saved reports before reconnecting.');
 await editCache(c=>({...c,actorId:session!.user.id}));return session.user.id;
}
async function rpc<T>(action:string,args:object={}):Promise<T>{const {data,error}=await connection().rpc('ue_live',{action,args});if(error)throw error;return data as T;}
export async function createLiveRoom(snapshot:LiveSnapshot,name:string){await identify();const {id}=await rpc<{id:string}>('create',{snapshot,localId:snapshot.event.id,name});return syncLiveRoom(id);}
export async function joinLiveRoom(code:string,name:string){await identify();const {id}=await rpc<{id:string}>('join',{code:code.trim(),name});return syncLiveRoom(id);}
let syncing:Promise<LiveRoom>|null=null;
let maintenance=false;
async function exclusive<T>(work:()=>Promise<T>):Promise<T>{
 if(maintenance)throw new Error('Another sharing change is finishing. Please retry.');
 maintenance=true;try{await syncing?.catch(()=>{});return await work();}finally{maintenance=false;}
}
export async function syncLiveRoom(id:string):Promise<LiveRoom>{
 if(maintenance)throw new Error('Sharing access is being updated.');
 if(syncing){await syncing.catch(()=>{});return syncLiveRoom(id);}
 const work=async()=>{
  const actor=await identify();
  // Check current membership before uploading. Revoked access leaves unsent reports intact locally.
  let room=await rpc<LiveRoom>('read',{roomId:id});
  await editCache(c=>({...c,rooms:[...c.rooms.filter(r=>r.id!==id),room]}));
  const pending=(await readLiveCache()).pending.filter(r=>r.roomId===id);
  for(const report of pending){
   if(report.authorId!==actor)throw new Error('Pending report belongs to another device identity.');
   await rpc('report',report);
   await editCache(c=>({...c,pending:c.pending.filter(r=>r.requestId!==report.requestId)}));
  }
  room=await rpc<LiveRoom>('read',{roomId:id});
  await editCache(c=>({...c,rooms:[...c.rooms.filter(r=>r.id!==id),room],lastSync:{...c.lastSync,[id]:new Date().toISOString()}}));return room;
 };
 syncing=work();try{return await syncing;}finally{syncing=null;}
}
export async function queueLiveReport(room:LiveRoom,checkpointId:string,kind:'in'|'out',at:string|null){
 return editCache(c=>{
  if(!c.actorId)throw new Error('Join the race online before recording offline.');
  if(!room.snapshot.checkpoints.some(cp=>cp.id===checkpointId))throw new Error('Checkpoint no longer exists.');
  if(at&&(!Number.isFinite(Date.parse(at))||Date.parse(at)<Date.parse(room.snapshot.startAt)||Date.parse(at)>Date.now()+60000))throw new Error('Record a time between race start and now.');
  const fresh=c.rooms.find(r=>r.id===room.id)??room;
  return {...c,pending:[...c.pending,{requestId:Crypto.randomUUID(),roomId:room.id,authorId:c.actorId,checkpointId,kind,at,revision:nextReportRevision(fresh,c.pending,c.actorId,checkpointId,kind)}]};
 });
}
export async function publishLiveRoom(room:LiveRoom,snapshot:LiveSnapshot){await identify();await rpc('publish',{roomId:room.id,revision:room.revision,snapshot});return syncLiveRoom(room.id);}
export async function removeLiveAccess(room:LiveRoom,userId?:string){
 await exclusive(async()=>{await identify();const action=userId?'revoke':room.ownerId===(await readLiveCache()).actorId?'close':'leave';await rpc(action,{roomId:room.id,userId});if(!userId)await dropRoomCache(room.id);});
 return userId?syncLiveRoom(room.id):null;
}
async function dropRoomCache(id:string){await editCache(c=>({...c,rooms:c.rooms.filter(r=>r.id!==id),pending:c.pending.filter(r=>r.roomId!==id),lastSync:Object.fromEntries(Object.entries(c.lastSync).filter(([key])=>key!==id))}));}
export async function forgetLiveRoom(id:string){await exclusive(()=>dropRoomCache(id));}
export async function discardPendingReports(id:string){await editCache(c=>({...c,pending:c.pending.filter(r=>r.roomId!==id)}));}

export async function recoverLiveRooms(){await identify();const list=await rpc<{id:string}[]>('list');for(const item of list)await syncLiveRoom(item.id);}
export const abuseReasons = ['harassment','hate','sexual_content','threats','other'] as const;
export type AbuseReason = typeof abuseReasons[number];
export async function reportLiveAbuse(room:LiveRoom,userId:string,reason:AbuseReason,details:string){
 if(!abuseReasons.includes(reason)||details.trim().length>1000)throw new Error('Choose a reason and keep details under 1,000 characters.');
 await identify();
 return rpc<{id:string}>('abuse_report',{roomId:room.id,userId,reason,details:details.trim(),requestId:Crypto.randomUUID()});
}
export async function blockLiveUser(room:LiveRoom,userId:string){
 await exclusive(async()=>{
  await identify();
  const {removedRoomIds}=await rpc<{removedRoomIds:string[]}>('block_user',{roomId:room.id,userId});
  await editCache(c=>({...c,rooms:c.rooms.filter(saved=>!removedRoomIds.includes(saved.id)).map(saved=>({...saved,members:saved.members.filter(member=>member.id!==userId),reports:saved.reports.filter(report=>report.authorId!==userId)})),pending:c.pending.filter(report=>!removedRoomIds.includes(report.roomId)),lastSync:Object.fromEntries(Object.entries(c.lastSync).filter(([id])=>!removedRoomIds.includes(id)))}));
 });
}
export async function deleteLiveIdentity(){await exclusive(async()=>{
 const {data:{session},error}=await connection().auth.getSession();
 if(error)throw error;
 if(!session)throw new Error('No active collaboration identity was found. Keep the app installed and retry when connected.');
 await rpc('delete_identity');
 let sessionCleanupFailed=false;
 try{const result=await connection().auth.signOut({scope:'local'});sessionCleanupFailed=!!result.error;}catch{sessionCleanupFailed=true;}
 try{await editCache(()=>({rooms:[],pending:[],actorId:null,lastSync:{}}));}
 catch{throw new Error('Server collaboration data was deleted, but this phone could not clear its saved copy. Check device storage and remove saved offline copies before sharing again.');}
 if(sessionCleanupFailed)throw new Error('Server collaboration data was deleted, but this phone could not clear its saved session. Restart and retry before sharing again.');
});}
