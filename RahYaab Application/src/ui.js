import React from 'react';
import {View,Text,Pressable,ScrollView,TextInput} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {C} from './theme';

export const T=({s=16,w='500',c=C.tx,style,children})=><Text style={[{fontSize:s,fontWeight:w,color:c},style]}>{children}</Text>;
export const Screen=({children})=>(
 <SafeAreaView edges={['top','left','right']} style={{flex:1,backgroundColor:C.bg}}>
  <ScrollView contentContainerStyle={{padding:20,paddingBottom:40}} keyboardShouldPersistTaps="handled">{children}</ScrollView>
 </SafeAreaView>);
export const Card=({color,style,children})=><View style={[{backgroundColor:C.card,borderRadius:22,padding:16,marginBottom:14,borderTopWidth:color?5:0,borderTopColor:color},style]}>{children}</View>;
export const Row=({children,style})=><View style={[{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},style]}>{children}</View>;
export const Btn=({title,onPress,color=C.pri,fg='#fff',ghost,disabled,style})=>(
 <Pressable disabled={disabled} onPress={onPress} style={({pressed})=>[{backgroundColor:ghost?'transparent':color,borderWidth:ghost?2:0,borderColor:color,borderRadius:16,paddingVertical:14,paddingHorizontal:20,alignItems:'center',opacity:disabled?.4:1,transform:[{scale:pressed?.96:1}],marginVertical:4},style]}>
  <T w="800" c={ghost?color:fg}>{title}</T>
 </Pressable>);
export const Bar=({v,color=C.pri})=><View style={{height:10,borderRadius:5,backgroundColor:'#ffffff1f',overflow:'hidden'}}><View style={{width:`${Math.max(0,Math.min(100,v))}%`,height:'100%',backgroundColor:color,borderRadius:5}}/></View>;
export const Labeled=({label,v,color})=><View style={{marginVertical:7}}><Row><T s={14} c={C.mu}>{label}</T><T s={14} w="800">{v}</T></Row><Bar v={v} color={color}/></View>;
export const Field=p=><TextInput placeholderTextColor={C.mu} autoCapitalize="none" {...p} style={{backgroundColor:C.card2,color:C.tx,borderRadius:14,padding:14,fontSize:16,marginVertical:6}}/>;

// ---- shared bits added with the server-backed app
export const Err=({children})=>children?<T c={C.er} s={14} style={{marginVertical:4}}>{children}</T>:null;
export const Ok=({children})=>children?<T c={C.ok} s={14} style={{marginVertical:4}}>{children}</T>:null;
export const Chips=({options,value,onChange,color=C.pri})=>(
 <View style={{flexDirection:'row',flexWrap:'wrap',marginVertical:4}}>{options.map(([v,l])=>{const on=value===v;return(
  <Pressable key={String(v)} accessibilityRole="radio" accessibilityState={{checked:on}} onPress={()=>onChange(on?null:v)}
   style={{paddingVertical:9,paddingHorizontal:14,borderRadius:20,margin:4,backgroundColor:on?color:C.card2}}>
   <T s={14} w="700" c={on?'#fff':C.mu}>{l}</T></Pressable>)})}</View>);
export const Check=({value,onChange,children})=>(
 <Pressable accessibilityRole="checkbox" accessibilityState={{checked:!!value}} onPress={()=>onChange(!value)} style={{flexDirection:'row',alignItems:'flex-start',marginVertical:8}}>
  <View style={{width:26,height:26,borderRadius:7,borderWidth:2,borderColor:value?C.ok:C.mu,backgroundColor:value?C.ok:'transparent',alignItems:'center',justifyContent:'center',marginRight:10,marginTop:1}}>{value&&<T s={16} w="900" c="#14113C">✓</T>}</View>
  <View style={{flex:1}}><T s={15}>{children}</T></View></Pressable>);
export const Loading=({text='Loading…'})=><View style={{alignItems:'center',marginVertical:40}}><T c={C.mu}>{text}</T></View>;
