import React from 'react';
import {Alert,TouchableOpacity,Text} from 'react-native';
import LiveRacePanel from '../components/LiveRacePanel';
import {readLiveCache,deleteLiveIdentity,reportLiveAbuse,blockLiveUser} from '../lib/liveRaceSync';
const {act,create}=require('react-test-renderer');
jest.mock('../theme',()=>({useTheme:()=>({theme:{colors:{}}})}));
jest.mock('../components/ui',()=>{
 const {Text,TouchableOpacity}=require('react-native');
 return {Body:Text,BodySmall:Text,H2:Text,H3:Text,Button:({children,...props}:any)=><TouchableOpacity {...props}><Text>{children}</Text></TouchableOpacity>};
});
jest.mock('../components/StructuredTimeInput',()=>({DateTimeInput:()=>null}));
jest.mock('../lib/liveRaceModel',()=>({liveProjection:()=>null}));
jest.mock('../lib/liveRaceSync',()=>({
 readLiveCache:jest.fn(),deleteLiveIdentity:jest.fn(),syncLiveRoom:jest.fn(),
 reportLiveAbuse:jest.fn(),blockLiveUser:jest.fn(),abuseReasons:['harassment','hate','sexual_content','threats','other'],
}));
const room={id:'room',ownerId:'owner',revision:1,snapshot:{event:{name:'Fictional race'},checkpoints:[],logistics:[]},members:[{id:'owner',name:'Runner'},{id:'crew',name:'Crew'}],reports:[]};
let tree:any;
const button=(label:string)=>tree.root.findAllByType(TouchableOpacity).find((node:any)=>[node.findByType(Text).props.children].flat().join('')===label);
const press=async(label:string)=>{await act(async()=>{await button(label).props.onPress();});};
const confirm=async()=>{const calls=(Alert.alert as jest.Mock).mock.calls;await act(async()=>{await calls[calls.length-1][2][1].onPress();});};
beforeEach(()=>{
 jest.clearAllMocks();jest.spyOn(Alert,'alert').mockImplementation(()=>{});
 (readLiveCache as jest.Mock).mockResolvedValue({rooms:[room],pending:[],actorId:'crew',lastSync:{}});
});
afterEach(async()=>{if(tree)await act(async()=>tree.unmount());tree=null;jest.restoreAllMocks();});
test('deletion is discoverable without cached identity and within an open room',async()=>{
 (readLiveCache as jest.Mock).mockResolvedValueOnce({rooms:[],pending:[],actorId:null,lastSync:{}});
 await act(async()=>{tree=create(<LiveRacePanel/>);});await press('Join / open a live team race');
 expect(button('Delete my collaboration data')).toBeTruthy();
 await press('Done');await press('Join / open a live team race');await press('Fictional race');
 expect(button('Delete my collaboration data')).toBeTruthy();
 await press('Delete my collaboration data');expect(deleteLiveIdentity).not.toHaveBeenCalled();
 expect((Alert.alert as jest.Mock).mock.calls.at(-1)[1]).toContain('If the server request fails');
});
test('failed deletion shows the error without claiming success',async()=>{
 (deleteLiveIdentity as jest.Mock).mockRejectedValue(new Error('offline; retry'));
 await act(async()=>{tree=create(<LiveRacePanel/>);});await press('Join / open a live team race');
 await press('Delete my collaboration data');await confirm();
 expect(Alert.alert).toHaveBeenLastCalledWith('Live race','offline; retry');
 expect(button('Fictional race')).toBeTruthy();
});
test('report receipt is explicitly queue storage, not human review',async()=>{
 (reportLiveAbuse as jest.Mock).mockResolvedValue({id:'receipt'});
 await act(async()=>{tree=create(<LiveRacePanel/>);});await press('Join / open a live team race');await press('Fictional race');
 await press('Report Runner');
 const reportButton=tree.root.findAllByType(TouchableOpacity).find((node:any)=>JSON.stringify(node.findByType(Text).props.children).includes('harassment'));
 await act(async()=>reportButton.props.onPress());expect(reportLiveAbuse).not.toHaveBeenCalled();await confirm();
 expect(reportLiveAbuse).toHaveBeenCalledWith(room,'owner','harassment','');
 expect(Alert.alert).toHaveBeenLastCalledWith('Report received',expect.stringContaining('not confirmation of human review'));
});
test('blocking confirms loss of unsent observations before invoking the server',async()=>{
 (blockLiveUser as jest.Mock).mockResolvedValue(undefined);
 await act(async()=>{tree=create(<LiveRacePanel/>);});await press('Join / open a live team race');await press('Fictional race');
 await press('Block Runner');expect(blockLiveUser).not.toHaveBeenCalled();
 expect((Alert.alert as jest.Mock).mock.calls.at(-1)[1]).toContain('Unsent observations');await confirm();
 expect(blockLiveUser).toHaveBeenCalledWith(room,'owner');
});
