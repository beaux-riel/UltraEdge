import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity } from 'react-native';
const { act, create } = require('react-test-renderer');
jest.mock('@react-native-community/datetimepicker',()=> 'NativeDateTimePicker');
jest.mock('../theme',()=>({useTheme:()=>({theme:{colors:{}}})}));
jest.mock('../components/ui',()=>{
 const {Text,TouchableOpacity}=require('react-native');const React=require('react');
 return {BodySmall:Text,Button:({children,...props}:any)=>React.createElement(TouchableOpacity,props,React.createElement(Text,null,children))};
});
import { DurationInput, DateTimeInput } from '../components/StructuredTimeInput';
function DurationHarness({clock=false}:{clock?:boolean}){const [value,set]=useState('');return <View><DurationInput label="Time" clock={clock} value={value} onChange={set}/><Text testID="value">{value}</Text></View>;}
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;});
test('accepts multi-day duration using numeric fields and flags impossible minutes and clock hours',async()=>{
 let tree:any;await act(async()=>{tree=create(<DurationHarness/>);});
 await act(async()=>{tree.root.findByProps({accessibilityLabel:'Time hours'}).props.onChangeText('30hours');});
 await act(async()=>{tree.root.findByProps({accessibilityLabel:'Time minutes'}).props.onChangeText('15');});
 expect(tree.root.findByProps({testID:'value'}).props.children).toBe('30:15');
 expect(tree.root.findAllByProps({accessibilityRole:'alert'})).toHaveLength(0);
 await act(async()=>{tree.root.findByProps({accessibilityLabel:'Time minutes'}).props.onChangeText('99');});
 expect(tree.root.findAllByProps({accessibilityRole:'alert'}).length).toBeGreaterThan(0);
 await act(async()=>{tree.update(<DurationHarness clock/>);});
 await act(async()=>{tree.root.findByProps({accessibilityLabel:'Time minutes'}).props.onChangeText('15');});
 expect(tree.root.findAllByProps({accessibilityRole:'alert'}).length).toBeGreaterThan(0);
 await act(async()=>{tree.unmount();});
});
test('actual time uses native date and time pickers instead of a prose field',async()=>{
 let tree:any;const onChange=jest.fn();await act(async()=>{tree=create(<DateTimeInput label="Actual time" value="2027-08-14T02:15" onChange={onChange}/>);});
 expect(tree.root.findAllByType(TextInput)).toHaveLength(0);
 const select=tree.root.findAllByType(TouchableOpacity).find((n:any)=>n.findAllByType(Text).some((t:any)=>t.props.children==='Select date'));
 await act(async()=>{select.props.onPress();});
 const picker=tree.root.findByType('NativeDateTimePicker');
 expect(picker.props.value.getDate()).toBe(14);
 await act(async()=>{picker.props.onChange({type:'set'},new Date(2027,7,15,2,15));});
 expect(onChange).toHaveBeenCalledWith('2027-08-15T02:15');
 await act(async()=>{tree.unmount();});
});
