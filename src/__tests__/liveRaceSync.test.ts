import AsyncStorage from '@react-native-async-storage/async-storage';
import {LiveRoom} from '../lib/liveRaceModel';
import {emptyOperations} from '../lib/raceOperations';
const mockRpc=jest.fn();
jest.mock('expo-crypto',()=>({randomUUID:()=>require('crypto').randomUUID()}));
jest.mock('../lib/supabase',()=>({createSecureStorageAdapter:()=>({})}));
jest.mock('@supabase/supabase-js',()=>({createClient:()=>({auth:{getSession:async()=>({data:{session:{user:{id:'runner'}}},error:null})},rpc:(...args:unknown[])=>mockRpc(...args)})}));
import {queueLiveReport,syncLiveRoom,readLiveCache} from '../lib/liveRaceSync';
const key='@ultraedge/live-rooms-v1';
const room:LiveRoom={id:'room',ownerId:'runner',revision:1,invite:null,serverTime:'2026-01-01T08:00:00Z',snapshot:{event:{id:'race'} as any,checkpoints:[{id:'half'} as any],startAt:'2026-01-01T08:00:00Z',operations:emptyOperations('race'),logistics:[]},members:[],reports:[]};
beforeEach(async()=>{process.env.EXPO_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.EXPO_PUBLIC_SUPABASE_KEY='test';jest.clearAllMocks();await AsyncStorage.clear();await AsyncStorage.setItem(key,JSON.stringify({rooms:[room],actorId:'runner',pending:[],lastSync:{}}));});
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
