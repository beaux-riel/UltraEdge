import AsyncStorage from '@react-native-async-storage/async-storage';
import {LiveRoom} from '../lib/liveRaceModel';
import {emptyOperations} from '../lib/raceOperations';
const mockRpc=jest.fn();
const mockSignOut=jest.fn();
const mockGetSession=jest.fn();
jest.mock('expo-crypto',()=>({randomUUID:()=>require('crypto').randomUUID()}));
jest.mock('../lib/supabase',()=>({createSecureStorageAdapter:()=>({})}));
jest.mock('@supabase/supabase-js',()=>({createClient:()=>({auth:{getSession:()=>mockGetSession(),signOut:(...args:unknown[])=>mockSignOut(...args)},rpc:(...args:unknown[])=>mockRpc(...args)})}));
import {queueLiveReport,syncLiveRoom,readLiveCache,deleteLiveIdentity,reportLiveAbuse,blockLiveUser} from '../lib/liveRaceSync';
const key='@ultraedge/live-rooms-v1';
const room:LiveRoom={id:'room',ownerId:'runner',revision:1,invite:null,serverTime:'2026-01-01T08:00:00Z',snapshot:{event:{id:'race'} as any,checkpoints:[{id:'half'} as any],startAt:'2026-01-01T08:00:00Z',operations:emptyOperations('race'),logistics:[]},members:[],reports:[]};
beforeEach(async()=>{process.env.EXPO_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.EXPO_PUBLIC_SUPABASE_KEY='test';jest.clearAllMocks();mockGetSession.mockResolvedValue({data:{session:{user:{id:'runner'}}},error:null});mockSignOut.mockResolvedValue({error:null});await AsyncStorage.clear();await AsyncStorage.setItem(key,JSON.stringify({rooms:[room],actorId:'runner',pending:[],lastSync:{}}));});
test('offline reports persist; reconnect sends each independently and acknowledges only successes',async()=>{
 await queueLiveReport(room,'half','in','2026-01-01T13:00:00Z');await queueLiveReport(room,'half','in','2026-01-01T13:10:00Z');
 expect((await readLiveCache()).pending.map(r=>r.revision)).toEqual([0,1]);
 mockRpc.mockImplementation(async(_,{action}:any)=>action==='read'?{data:room,error:null}:{data:null,error:{message:'offline'}});
 await expect(syncLiveRoom('room')).rejects.toEqual({message:'offline'});expect((await readLiveCache()).pending).toHaveLength(2);
 mockRpc.mockImplementation(async(_,{action}:any)=>({data:action==='read'?room:{revision:1},error:null}));
 await syncLiveRoom('room');expect((await readLiveCache()).pending).toHaveLength(0);expect((await readLiveCache()).lastSync.room).toBeTruthy();
});
test('lost local acknowledgement retries the same operation id',async()=>{
 await queueLiveReport(room,'half','in','2026-01-01T13:00:00Z');const operation=(await readLiveCache()).pending[0];const requests:string[]=[];
 mockRpc.mockImplementation(async(_,{action,args}:any)=>{if(action==='report')requests.push(args.requestId);return {data:action==='read'?room:{revision:1},error:null};});
 const original=(AsyncStorage.setItem as jest.Mock).getMockImplementation()!;let fail=true;
 const spy=jest.spyOn(AsyncStorage,'setItem').mockImplementation(async(k,v)=>{if(k===key&&fail&&JSON.parse(v).pending.length===0){fail=false;throw new Error('disk error');}return original(k,v);});
 await expect(syncLiveRoom('room')).rejects.toThrow('disk error');spy.mockImplementation(original);
 await syncLiveRoom('room');expect(requests).toEqual([operation.requestId,operation.requestId]);expect((await readLiveCache()).pending).toHaveLength(0);
});
test('revoked access does not upload or silently discard offline evidence',async()=>{
 await queueLiveReport(room,'half','in','2026-01-01T13:00:00Z');mockRpc.mockResolvedValue({data:null,error:{code:'42501',message:'revoked'}});
 await expect(syncLiveRoom('room')).rejects.toMatchObject({code:'42501'});expect(mockRpc).toHaveBeenCalledTimes(1);expect((await readLiveCache()).pending).toHaveLength(1);
});
test('forget waits for an in-flight sync so it cannot resurrect the removed cache',async()=>{
 const {forgetLiveRoom}=require('../lib/liveRaceSync');
 let release!:()=>void,entered!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});const started=new Promise<void>(resolve=>{entered=resolve;});let first=true;
 mockRpc.mockImplementation(async()=>{if(first){first=false;entered();await gate;}return {data:room,error:null};});
 const sync=syncLiveRoom('room');await started;const forgetting=forgetLiveRoom('room');release();await sync;await forgetting;expect((await readLiveCache()).rooms).toEqual([]);
});
test('failed server guest deletion preserves cached rooms and pending observations',async()=>{
 await queueLiveReport(room,'half','in','2026-01-01T13:00:00Z');const before=await readLiveCache();
 mockRpc.mockResolvedValue({data:null,error:{message:'offline'}});
 await expect(deleteLiveIdentity()).rejects.toMatchObject({message:'offline'});
 expect(await readLiveCache()).toEqual(before);expect(mockSignOut).not.toHaveBeenCalled();
});
test('successful guest deletion clears collaboration cache only after server acknowledgement',async()=>{
 mockRpc.mockResolvedValue({data:{},error:null});await deleteLiveIdentity();
 expect(mockRpc).toHaveBeenCalledWith('ue_live',{action:'delete_identity',args:{}});
 expect(mockSignOut).toHaveBeenCalledWith({scope:'local'});
 expect(await readLiveCache()).toEqual({rooms:[],pending:[],actorId:null,lastSync:{}});
});
test('deletion without an active session never creates a fresh guest',async()=>{
 mockGetSession.mockResolvedValue({data:{session:null},error:null});
 await expect(deleteLiveIdentity()).rejects.toThrow('No active collaboration identity');expect(mockRpc).not.toHaveBeenCalled();
});
test('session cleanup error distinguishes completed server deletion',async()=>{
 mockRpc.mockResolvedValue({data:{},error:null});mockSignOut.mockResolvedValue({error:new Error('storage')});
 await expect(deleteLiveIdentity()).rejects.toThrow('Server collaboration data was deleted');expect((await readLiveCache()).rooms).toEqual([]);
});
test('thrown sign-out still clears cache after acknowledged server deletion',async()=>{
 await queueLiveReport(room,'half','in','2026-01-01T13:00:00Z');
 mockRpc.mockResolvedValue({data:{},error:null});mockSignOut.mockRejectedValue(new Error('storage'));
 await expect(deleteLiveIdentity()).rejects.toThrow('Server collaboration data was deleted');
 expect(await readLiveCache()).toEqual({rooms:[],pending:[],actorId:null,lastSync:{}});
});
test('cache cleanup failure explicitly reports already completed server deletion',async()=>{
 mockRpc.mockResolvedValue({data:{},error:null});
 const original=(AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
 jest.spyOn(AsyncStorage,'setItem').mockRejectedValueOnce(new Error('disk full'));
 await expect(deleteLiveIdentity()).rejects.toThrow('Server collaboration data was deleted, but this phone could not clear its saved copy');
 (AsyncStorage.setItem as jest.Mock).mockImplementation(original);
});
test('abuse reports submit only explicit bounded details and failures are not success receipts',async()=>{
 await expect(reportLiveAbuse(room,'crew','hate','x'.repeat(1001))).rejects.toThrow('1,000');expect(mockRpc).not.toHaveBeenCalled();
 mockRpc.mockResolvedValue({data:null,error:{message:'offline'}});
 await expect(reportLiveAbuse(room,'crew','harassment',' Details ')).rejects.toMatchObject({message:'offline'});
 expect(mockRpc).toHaveBeenCalledWith('ue_live',{action:'abuse_report',args:expect.objectContaining({roomId:'room',userId:'crew',reason:'harassment',details:'Details',requestId:expect.any(String)})});
 expect((await readLiveCache()).pending).toEqual([]);
});
test('blocking purges departed rooms and their pending reports only after acknowledgement',async()=>{
 await queueLiveReport(room,'half','in','2026-01-01T13:00:00Z');
 mockRpc.mockResolvedValue({data:null,error:{message:'offline'}});
 await expect(blockLiveUser(room,'crew')).rejects.toMatchObject({message:'offline'});expect((await readLiveCache()).pending).toHaveLength(1);
 mockRpc.mockResolvedValue({data:{removedRoomIds:['room']},error:null});await blockLiveUser(room,'crew');
 expect((await readLiveCache()).rooms).toEqual([]);expect((await readLiveCache()).pending).toEqual([]);
});
