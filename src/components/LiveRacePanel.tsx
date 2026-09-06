import React,{useEffect,useState,useRef} from 'react';
import {View,Modal,ScrollView,TextInput,Alert,Share,AppState,Keyboard} from 'react-native';
import {Body,BodySmall,H2,H3,Button} from './ui';
import {useTheme} from '../theme';
import {LiveRoom,LiveSnapshot,liveProjection} from '../lib/liveRaceModel';
import {readLiveCache,createLiveRoom,joinLiveRoom,syncLiveRoom,queueLiveReport,publishLiveRoom,removeLiveAccess,discardPendingReports,forgetLiveRoom,recoverLiveRooms,deleteLiveIdentity,LiveCache} from '../lib/liveRaceSync';
import {clockLabel,parseLocalRaceTime,projectedDistance} from '../lib/raceOperations';
interface Props { snapshot?:()=>LiveSnapshot; }
export default function LiveRacePanel({snapshot}:Props){
 const {theme:{colors}}=useTheme();const [open,setOpen]=useState(false);const [cache,setCache]=useState<LiveCache>({rooms:[],pending:[],actorId:null,lastSync:{}});
 const [roomId,setRoomId]=useState<string|null>(null);const [name,setName]=useState('');const [code,setCode]=useState('');const [at,setAt]=useState('');const [busy,setBusy]=useState(false);const [status,setStatus]=useState('');const active=useRef(false);const polling=useRef(false);
 const room=cache.rooms.find(r=>r.id===roomId);const projection=room?liveProjection(room):null;
 const refreshCache=async()=>{const value=await readLiveCache();if(active.current)setCache(value);};
 const sync=async(id:string)=>{if(polling.current)return;polling.current=true;try{await syncLiveRoom(id);if(active.current)setStatus('Connected — team updates checked every 10 seconds while open.');}catch(e){if(active.current)setStatus(`Not synced: ${e instanceof Error?e.message:(e as {message?:string})?.message??'Connection unavailable. Saved reports will retry.'}`);}finally{polling.current=false;await refreshCache();}};
 useEffect(()=>{active.current=open;if(open)refreshCache();return()=>{active.current=false;};},[open]);
 useEffect(()=>{if(!open||!roomId)return;sync(roomId);const timer=setInterval(()=>{if(AppState.currentState==='active')sync(roomId);},10000);const sub=AppState.addEventListener('change',state=>{if(state==='active')sync(roomId);});return()=>{clearInterval(timer);sub.remove();};},[open,roomId]);
 const work=async(fn:()=>Promise<void>)=>{if(busy)return;setBusy(true);try{await fn();await refreshCache();}catch(e){Alert.alert('Live race',e instanceof Error?e.message:(e as {message?:string})?.message??'Please try again.');}finally{setBusy(false);}};
 const field=(label:string,value:string,set:(v:string)=>void)=><View style={{gap:6}}><BodySmall>{label}</BodySmall><TextInput accessibilityLabel={label} testID={`live-${label}`} value={value} onChangeText={set} autoCapitalize="none" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} style={{borderWidth:1,borderColor:colors.border,borderRadius:8,padding:12,minHeight:48,color:colors.bark}}/></View>;
 const record=async(cp:string,kind:'in'|'out',remove=false)=>{if(!room)return;await queueLiveReport(room,cp,kind,remove?null:at.trim()?parseLocalRaceTime(at):new Date().toISOString());await refreshCache();setStatus('Saved on this device; waiting to sync.');void sync(room.id);};
 const confirm=(title:string,detail:string,fn:()=>Promise<void>)=>Alert.alert(title,detail,[{text:'Cancel',style:'cancel'},{text:'Continue',onPress:()=>work(fn)}]);
 return <><Button variant="tertiary" onPress={()=>setOpen(true)}>{snapshot?'Live team sharing':'Join / open a live team race'}</Button><Modal visible={open} presentationStyle="pageSheet" animationType="slide" onRequestClose={()=>setOpen(false)}><View style={{flex:1,paddingTop:24,backgroundColor:colors.surface}}><View style={{paddingHorizontal:20,gap:8}}><H2>Live team race</H2><Button variant="tertiary" onPress={()=>setOpen(false)}>Done</Button></View><ScrollView keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:20,gap:16,paddingBottom:60}}>
 {!room?<>
 <Body>Share a private race with your crew. Only joined team members can read it or record times.</Body>
 <BodySmall>Team access is saved securely on this phone. Keep the app installed to retain access; a new phone needs a new crew invitation. Race timing, crew names and vehicle/cargo labels are shared. Phone numbers, emails, personal notes and route files are excluded.</BodySmall>
 {field('Your team display name',name,setName)}
 {snapshot&&<Button disabled={busy||!name.trim()} onPress={()=>confirm('Share this race?','Publish the current timing and logistics plan. Existing local time reports stay local; use this live room for team observations.',async()=>{const result=await createLiveRoom(snapshot(),name.trim());setRoomId(result.id);})}>Create / open shared race</Button>}
 {field('Private invitation code',code,setCode)}<Button disabled={busy||!name.trim()||!code.trim()} onPress={()=>work(async()=>{const result=await joinLiveRoom(code,name.trim());setRoomId(result.id);})}>Join team race</Button>
 <Button disabled={busy} variant="tertiary" onPress={()=>work(recoverLiveRooms)}>Reload my team races</Button>
 {cache.actorId&&<Button disabled={busy} variant="tertiary" onPress={()=>confirm('Delete collaboration identity and data?','Deletes all team rooms you own and your reports/memberships, and clears unsent reports on this device. Your local race plans remain.',deleteLiveIdentity)}>Delete my collaboration data</Button>}
 {cache.rooms.map(r=><Button key={r.id} variant="tertiary" onPress={()=>setRoomId(r.id)}>{r.snapshot.event.name}</Button>)}
 </>:<>
 <Button variant="tertiary" onPress={()=>setRoomId(null)}>All shared races</Button><H3>{room.snapshot.event.name}</H3>
 <BodySmall>{status||'Showing saved team plan.'}</BodySmall><BodySmall>Last successful sync: {cache.lastSync[room.id]?clockLabel(Date.parse(cache.lastSync[room.id])):'Not yet'} • {cache.pending.filter(p=>p.roomId===room.id).length} pending reports</BodySmall>
 <Button disabled={busy} onPress={()=>sync(room.id)}>Sync now</Button>
 <BodySmall>You report as {room.ownerId===cache.actorId?'runner':'crew'}. Each person’s observations are kept. Crew reports are averaged first, then weighted equally with the runner. Corrections only change your own reports.</BodySmall>
 {room.ownerId===cache.actorId&&<>
 <Button disabled={busy} onPress={()=>Share.share({message:`UltraEdge team invitation: ${room.invite}\nOpen Events → Join / open a live team race and enter this private code.`})}>Share crew invitation</Button>
 {snapshot&&<Button disabled={busy} onPress={()=>confirm('Publish current local plan?','Update the shared timing and logistics. Team observations are retained. Use this when you change stops or the race start locally.',async()=>{await publishLiveRoom(room,snapshot());})}>Publish local plan updates</Button>}
 </>}
 <BodySmall>Plan revision {room.revision}. Times below use this phone’s timezone; all phones calculate from the same absolute race start. Estimates use course distance, not terrain or GPS.</BodySmall>
 {projection?<Body>Projected finish {clockLabel(projection.finish)}{'\n'}Best {clockLabel(projection.bestFinish)} / Slow {clockLabel(projection.slowFinish)}</Body>:<Body>Timing reports conflict or the plan is incomplete. Check the individual observations before using ETAs.</Body>}
 {projection&&<BodySmall>Estimated now: {(['best','arrival','slow'] as const).map(s=>`${s==='arrival'?'Expected':s==='best'?'Best':'Slow'} ${projectedDistance(projection,room.snapshot.event.total_distance!,Date.now(),s).toFixed(1)} ${room.snapshot.event.distance_unit==='miles'?'mi':'km'}`).join(' • ')} — not GPS tracking</BodySmall>}
 {field('Observation time (blank = now; YYYY-MM-DDTHH:MM)',at,setAt)}
 {room.snapshot.checkpoints.map(cp=>{const row=projection?.rows.find(r=>r.id===cp.id);return <View key={cp.id} style={{gap:8,borderTopWidth:1,borderColor:colors.border,paddingTop:12}}><H3>{cp.name}</H3>{row&&<><Body>In {clockLabel(row.arrival)} • Out {clockLabel(row.departure)}</Body><BodySmall>Best {clockLabel(row.best)} / Slow {clockLabel(row.slow)} • {row.stop} min planned stop</BodySmall></>}
 <View style={{flexDirection:'row',gap:8}}>{(['in','out'] as const).map(kind=><Button key={kind} disabled={busy} onPress={()=>work(()=>record(cp.id,kind))}>Record {kind}</Button>)}</View>
 {room.reports.filter(r=>r.checkpointId===cp.id&&r.at).map(r=><View key={`${r.authorId}:${r.kind}`}><BodySmall>{room.members.find(m=>m.id===r.authorId)?.name??'Former member'} {r.kind}: {clockLabel(Date.parse(r.at!))}</BodySmall>{r.authorId===cache.actorId&&<Button disabled={busy} variant="tertiary" onPress={()=>work(()=>record(cp.id,r.kind,true))}>Remove my {r.kind}</Button>}</View>)}
 {cache.pending.filter(r=>r.roomId===room.id&&r.checkpointId===cp.id).map(r=><BodySmall key={r.requestId}>Pending {r.kind}: {r.at?clockLabel(Date.parse(r.at)):'remove report'} — saved only on this device</BodySmall>)}
 </View>;})}
 <H3>Team logistics</H3>{room.snapshot.logistics.map((line,i)=><BodySmall key={i}>{line}</BodySmall>)}
 <H3>Team access</H3>{room.members.map(m=><View key={m.id}><BodySmall>{m.name}{m.id===room.ownerId?' • runner / owner':''}</BodySmall>{room.ownerId===cache.actorId&&m.id!==cache.actorId&&<Button variant="tertiary" disabled={busy} onPress={()=>confirm('Remove team member?','Their existing reports remain in the history. The invitation code changes to prevent rejoining with the old code.',async()=>{await removeLiveAccess(room,m.id);})}>Remove {m.name}</Button>}</View>)}
 {!!cache.pending.filter(r=>r.roomId===room.id).length&&<Button variant="tertiary" onPress={()=>confirm('Discard unsent reports?','This removes all pending observations for this race from this device. Synced observations remain.',async()=>{await discardPendingReports(room.id);})}>Discard pending reports</Button>}
 <Button disabled={busy} variant="tertiary" onPress={()=>confirm(room.ownerId===cache.actorId?'Stop sharing?':'Leave team race?',room.ownerId===cache.actorId?'Delete the shared room and its reports for everyone. Your local race remains.':'Remove your team access and saved copy on this device.',async()=>{await removeLiveAccess(room);setRoomId(null);})}>{room.ownerId===cache.actorId?'Stop sharing and delete team room':'Leave team race'}</Button>
 <Button variant="tertiary" onPress={()=>confirm('Remove saved copy from this device?','Also discards unsent reports. This does not revoke server access or stop sharing; use the controls above when online.',async()=>{await forgetLiveRoom(room.id);setRoomId(null);})}>Remove offline copy</Button>
 </>}
 </ScrollView></View></Modal></>;
}
