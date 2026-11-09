import React,{useState,useRef,useEffect} from 'react';
import {View,Pressable} from 'react-native';
import {T,Btn,Card,Bar} from '../ui';
import {C} from '../theme';
const EASY=10,HARD=26; // taps needed within 4 seconds
export default function EH({onDone}){
 const [r,setR]=useState(0),[ph,setPh]=useState('pick'),[hard,setHard]=useState(false),[taps,setTaps]=useState(0),[left,setLeft]=useState(40),[msg,setMsg]=useState('');
 const pts=useRef(0),log=useRef([]),need=hard?HARD:EASY;
 useEffect(()=>{if(ph!=='task')return;const id=setInterval(()=>setLeft(x=>x-1),100);return()=>clearInterval(id)},[ph]);
 useEffect(()=>{if(ph!=='task'||(taps<need&&left>0))return;const ok=taps>=need;log.current.push({hard,ok});if(ok)pts.current+=hard?4:1;setMsg(ok?'✅ Done! +'+(hard?4:1)+' points':'❌ Time ran out');setPh('res')},[taps,left]);
 const pick=h=>{setHard(h);setTaps(0);setLeft(40);setPh('task')};
 const next=()=>{if(r===7)return onDone({log:log.current,points:pts.current});setR(r+1);setPh('pick')};
 return(<View>
  <T w="800" c={C.mu}>Round {r+1} of 8   ⭐ {pts.current}</T>
  {ph==='pick'&&<View style={{marginTop:10}}>
   <Card color={C.ok}><T s={20} w="800">🙂 Easy task</T><T c={C.mu} style={{marginVertical:6}}>Tap {EASY} times in 4 seconds. Worth 1 point.</T><Btn title="Choose easy" color={C.ok} fg="#14113C" onPress={()=>pick(false)}/></Card>
   <Card color={C.er}><T s={20} w="800">🔥 Hard task</T><T c={C.mu} style={{marginVertical:6}}>Tap {HARD} times in 4 seconds. Worth 4 points.</T><Btn title="Choose hard" color={C.er} onPress={()=>pick(true)}/></Card>
  </View>}
  {ph==='task'&&<View style={{alignItems:'center'}}>
   <T s={18} w="800" style={{marginTop:10}}>{hard?'Hard':'Easy'}: tap {need} times!  ⏱ {(left/10).toFixed(1)}s</T>
   <Pressable onPress={()=>setTaps(t=>t+1)} style={({pressed})=>({width:220,height:220,borderRadius:110,marginVertical:24,backgroundColor:hard?C.er:C.ok,alignItems:'center',justifyContent:'center',transform:[{scale:pressed?.93:1}]})}>
    <T s={54} w="900" c="#14113C">{taps}</T>
   </Pressable>
   <View style={{alignSelf:'stretch'}}><Bar v={taps/need*100} color={C.warn}/></View>
  </View>}
  {ph==='res'&&<View style={{marginTop:10}}><Card><T s={20} w="800">{msg}</T></Card><Btn title={r===7?'Finish':'Next round'} onPress={next}/></View>}
 </View>);
}
