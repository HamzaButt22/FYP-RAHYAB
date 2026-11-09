import React,{useState,useRef} from 'react';
import {View} from 'react-native';
import {T,Btn,Row} from '../ui';
import {C} from '../theme';
// Three balloon types with different mean burst points (4, 10, 20 pumps). Burst point is random, uniform 1..2m-1.
const TY=[{m:4,c:'#FF6B7A'},{m:10,c:'#FFB347'},{m:20,c:'#A78BFA'}],ORD=[0,1,2,0,1,2];
const lim=m=>1+Math.floor(Math.random()*(2*m-1));
export default function Bart({onDone}){
 const [i,setI]=useState(0),[n,setN]=useState(0),[pts,setPts]=useState(0),[L,setL]=useState(()=>lim(TY[ORD[0]].m)),[msg,setMsg]=useState('Pump the balloon!');
 const res=useRef([]),gaps=useRef([]),last=useRef(Date.now()),t=TY[ORD[i]];
 const end=(popped,k)=>{
  res.current.push({m:t.m,pumps:k,popped});
  const np=popped?pts:pts+k;setPts(np);setMsg(popped?'💥 Pop! No points for that balloon.':'💰 Banked '+k+' points!');
  if(i===ORD.length-1)return onDone({balloons:res.current,gaps:gaps.current,points:np});
  setI(i+1);setN(0);setL(lim(TY[ORD[i+1]].m));last.current=Date.now()};
 const pump=()=>{const now=Date.now();gaps.current.push(now-last.current);last.current=now;if(n+1>=L)end(true,n+1);else setN(n+1)};
 const size=60+n*160/(2*t.m);
 return(<View style={{alignItems:'center'}}>
  <Row style={{alignSelf:'stretch'}}><T w="800">Balloon {i+1} of {ORD.length}</T><T w="800" c={C.warn}>⭐ {pts}</T></Row>
  <View style={{height:300,justifyContent:'center',alignItems:'center'}}>
   <View style={{width:size,height:size*1.15,borderRadius:size/2,backgroundColor:t.c,alignItems:'center',justifyContent:'center'}}><T s={22} w="900">{n}</T></View>
   <View style={{width:3,height:30,backgroundColor:'#ffffff55'}}/>
  </View>
  <T c={C.mu} style={{marginBottom:10}}>{msg}</T>
  <Btn title="🎈 Pump" onPress={pump} color={t.c} style={{alignSelf:'stretch'}}/>
  <Btn title={'💰 Bank '+n+' points'} ghost disabled={!n} onPress={()=>end(false,n)} color={C.ok} style={{alignSelf:'stretch'}}/>
 </View>);
}
