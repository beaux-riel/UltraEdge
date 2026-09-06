/* Uses disposable guest identities and a synthetic room; no service-role key. */
const {createClient}=require('@supabase/supabase-js');const fs=require('fs');const assert=require('assert/strict');const {randomUUID}=require('crypto');
for(const line of fs.readFileSync('.env','utf8').split('\n')){const m=/^([A-Z_]+)=(.*)$/.exec(line);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'');}
const clients=[];let passed=0;
async function call(c,action,args={},fail=false){const r=await c.rpc('ue_live',{action,args});if(fail){assert(r.error,`Expected ${action} denied`);return;}if(r.error)throw new Error(`${action}: ${r.error.message}`);return r.data;}
function pass(name){passed++;console.log('PASS',name);}
(async()=>{
 try{
  for(let i=0;i<3;i++){const c=createClient(process.env.EXPO_PUBLIC_SUPABASE_URL,process.env.EXPO_PUBLIC_SUPABASE_KEY||process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});const {error}=await c.auth.signInAnonymously();if(error)throw error;clients.push(c);}
  const [owner,crew,outsider]=clients;
  const start=Date.now()-12*3600000;const iso=m=>new Date(start+m*60000).toISOString();
  const snapshot={event:{id:'qa-'+randomUUID(),name:'Disposable live collaboration QA',total_distance:100,target_time:'10:00',distance_unit:'km'},checkpoints:[{id:'half',name:'Half',order_index:0,distance_from_start:50},{id:'finish',name:'Finish',order_index:1,distance_from_start:100}],operations:{id:'qa',variation:10,startAt:iso(0),stops:{half:30},duties:[],vehicles:[],cargo:[],reports:[]},startAt:iso(0),logistics:[]};
  await call(owner,'create',{localId:'bad-'+randomUUID(),snapshot:{...snapshot,event:{...snapshot.event,name:{bad:true}}},name:'QA'},true);pass('malformed shared display data rejected');
  const {id}=await call(owner,'create',{localId:snapshot.event.id,snapshot,name:'QA Runner'});let room=await call(owner,'read',{roomId:id});
  await call(outsider,'read',{roomId:id},true);pass('nonmember cannot read room');
  assert((await outsider.from('ue_live_rooms').select('*')).error);pass('direct table access denied');
  await call(crew,'join',{code:room.invite,name:'QA Crew'});await call(crew,'publish',{roomId:id,revision:1,snapshot},true);pass('crew cannot edit plan');
  const op={roomId:id,requestId:randomUUID(),checkpointId:'half',kind:'in',at:iso(300),revision:0};
  await call(owner,'report',op);await call(owner,'report',op);room=await call(owner,'read',{roomId:id});assert.equal(room.reports.length,1);assert.equal(room.reports[0].revision,1);pass('duplicate network retry counted once');
  await call(owner,'report',{...op,requestId:randomUUID(),at:iso(310)},true);pass('stale correction rejected');
  await call(crew,'report',{...op,requestId:randomUUID(),at:iso(310),authorId:room.ownerId});room=await call(owner,'read',{roomId:id});assert.equal(room.reports.length,2);assert.equal(new Set(room.reports.map(r=>r.authorId)).size,2);pass('author identity cannot be forged; both reports retained');
  await call(owner,'report',{...op,kind:'out',requestId:randomUUID(),at:iso(290)},true);pass('departure before arrival rejected');
  await call(owner,'report',{...op,requestId:randomUUID(),checkpointId:'missing'},true);pass('missing checkpoint rejected');
  await call(owner,'publish',{roomId:id,snapshot},true);pass('missing plan revision rejected');
  await call(owner,'publish',{roomId:id,revision:1,snapshot});await call(owner,'publish',{roomId:id,revision:1,snapshot},true);pass('plan version conflicts rejected');
  const crewId=room.members.find(m=>m.id!==room.ownerId).id;const oldInvite=room.invite;
  await call(owner,'revoke',{roomId:id,userId:crewId});await call(crew,'read',{roomId:id},true);await call(crew,'join',{code:oldInvite,name:'QA Crew'},true);pass('revocation blocks reads and rotates invite');
  room=await call(owner,'read',{roomId:id});await call(outsider,'join',{code:room.invite,name:'QA Other'});await call(outsider,'leave',{roomId:id});await call(outsider,'read',{roomId:id},true);pass('leave removes access');
  await call(owner,'close',{roomId:id});await call(owner,'read',{roomId:id},true);pass('close deletes shared room');
 }finally{
  for(const c of clients){await call(c,'delete_identity');c.auth.stopAutoRefresh();}console.log('PASS disposable guest identities removed');
 }
 console.log(`${passed} live backend checks passed`);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
