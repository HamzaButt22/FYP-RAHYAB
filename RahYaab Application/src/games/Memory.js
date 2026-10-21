import React,{useState,useRef,useEffect} from 'react';
import {View} from 'react-native';
import {T,Btn,Card,Row} from '../ui';
import {C} from '../theme';
const gen=n=>{const a=[];while(a.length<n){const d=1+Math.floor(Math.random()*9);if(d!==a[a.length-1])a.push(d)}return a};
const mq=()=>{const a=10+Math.floor(Math.random()*40),b=10+Math.floor(Math.random()*40),s=a+b;return{t:a+' + '+b,s,o:[s,s+10,s-1,s+2].sort(()=>Math.random()-.5)}};
export default function Mem({onDone}){ // Digit span (grows by 1 after each correct list, ends after 2 misses) + 5 quick sums
 const [ph,setPh]=useState('show'),[len,setLen]=useState(3),[seq,setSeq]=useState(()=>gen(3)),[k,setK]=useState(-1),[inp,setInp]=useState([]),[bad,setBad]=useState(0),[q,setQ]=useState(0);
 const peak=useRef(2),math=useRef([]),qs=useRef(Array.from({length:5},mq)).current,st=useRef(Date.now());
 useEffect(()=>{if(ph!=='show')return;let j=-1;const id=setInterval(()=>{j++;if(j>=seq.length){clearInterval(id);setK(-1);setInp([]);setPh('input')}else setK(j)},900);return()=>clearInterval(id)},[ph,seq]);
 const toMath=()=>{st.current=Date.now();setPh('math')};
 const press=d=>{const n=[...inp,d];setInp(n);if(n.length<len)return;
  if(n.every((x,i)=>x===seq[i])){peak.current=len;if(len>=10)return toMath();setLen(len+1);setSeq(gen(len+1));setPh('show')}
  else{const b=bad+1;setBad(b);if(b>=2)return toMath();setSeq(gen(len));setPh('show')}};
 const ans=v=>{math.current.push({ok:v===qs[q].s,ms:Date.now()-st.current});st.current=Date.now();if(q===4)onDone({peak:peak.current,math:math.current});else setQ(q+1)};
 if(ph==='math'){const m=qs[q];return(<View>
  <T w="800" c={C.mu}>Quick sum {q+1} of 5</T>
  <Card color={C.ok} style={{marginVertical:12}}><T s={40} w="900" style={{textAlign:'center'}}>{m.t}</T></Card>
  {m.o.map(v=><Btn key={v} title={String(v)} color={C.card2} onPress={()=>ans(v)}/>)}
 </View>)}
 if(ph==='show')return(<View style={{alignItems:'center'}}><T w="800" c={C.mu}>Remember these {len} digits</T><T s={130} w="900" c={C.ok} style={{marginTop:40}}>{k<0?'…':seq[k]}</T></View>);
 return(<View>
  <T w="800" c={C.mu}>Tap the digits in order ({inp.length}/{len})</T>
  <Row style={{justifyContent:'center',marginVertical:18}}>{seq.map((_,i)=><T key={i} s={30} c={i<inp.length?C.ok:C.mu}>{i<inp.length?'●':'○'} </T>)}</Row>
  <View style={{flexDirection:'row',flexWrap:'wrap'}}>{[1,2,3,4,5,6,7,8,9].map(d=><View key={d} style={{width:'33.33%',padding:4}}><Btn title={String(d)} color={C.card2} onPress={()=>press(d)}/></View>)}</View>
 </View>);
}
