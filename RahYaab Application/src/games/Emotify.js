import React,{useState,useRef,useEffect} from 'react';
import {View,Animated} from 'react-native';
import {T,Btn,Card} from '../ui';
import {C} from '../theme';
import {FACES,STORIES} from '../data';
const sh=a=>[...a].sort(()=>Math.random()-.5);
export default function Emo({onDone}){
 const rounds=useRef(Array.from({length:8},()=>{const c=FACES[Math.floor(Math.random()*FACES.length)];return{c,o:sh([c,...sh(FACES.filter(f=>f!==c)).slice(0,3)])}})).current;
 const [ph,setPh]=useState('faces'),[i,setI]=useState(0),res=useRef({faces:[],stories:[]}),st=useRef(Date.now()),w=useRef(new Animated.Value(100)).current;
 const ans=o=>{res.current.faces.push({ok:!!o&&o[0]===rounds[i].c[0],ms:o?Date.now()-st.current:3000,timeout:!o});if(i===7){setPh('stories');setI(0)}else setI(i+1)};
 useEffect(()=>{if(ph!=='faces')return;st.current=Date.now();w.setValue(100);Animated.timing(w,{toValue:0,duration:3000,useNativeDriver:false}).start();const id=setTimeout(()=>ans(null),3000);return()=>{clearTimeout(id);w.stopAnimation()}},[i,ph]);
 if(ph==='stories'){const [q,o,sc]=STORIES[i];return(<View>
  <T w="800" c={C.mu}>Story {i+1} of {STORIES.length}</T>
  <Card color="#FF5CA8" style={{marginTop:10}}><T s={19} w="700">{q}</T></Card>
  {o.map((x,k)=><Btn key={k} title={x} color={C.card2} onPress={()=>{res.current.stories.push(sc[k]);if(i===STORIES.length-1)onDone(res.current);else setI(i+1)}}/>)}
 </View>)}
 const r=rounds[i];
 return(<View style={{alignItems:'center'}}>
  <T w="800" c={C.mu}>Face {i+1} of 8: what are they feeling?</T>
  <T s={110} style={{marginVertical:16}}>{r.c[0]}</T>
  <View style={{alignSelf:'stretch',height:8,borderRadius:4,backgroundColor:'#ffffff1f',overflow:'hidden',marginBottom:16}}>
   <Animated.View style={{height:8,backgroundColor:'#FF5CA8',width:w.interpolate({inputRange:[0,100],outputRange:['0%','100%']})}}/>
  </View>
  {r.o.map(f=><Btn key={f[1]} title={f[1]} color={C.card2} onPress={()=>ans(f)} style={{alignSelf:'stretch'}}/>)}
 </View>);
}
