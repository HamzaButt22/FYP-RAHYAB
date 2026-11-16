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
