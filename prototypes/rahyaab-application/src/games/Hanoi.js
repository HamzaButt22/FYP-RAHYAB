import React,{useState,useRef,useEffect} from 'react';
import {View,Pressable} from 'react-native';
import {T,Row} from '../ui';
import {C} from '../theme';
const COL=['','#FF6B7A','#FFC857','#2EE6A8','#4CC9F0'];
export default function Hanoi({onDone}){
 const [p,setP]=useState([[4,3,2,1],[],[]]),[sel,setSel]=useState(null),[moves,setMoves]=useState(0),[left,setLeft]=useState(120);
 const t0=useRef(Date.now()),first=useRef(null),bad=useRef(0),over=useRef(false);
 const fin=(pg,mv)=>{if(over.current)return;over.current=true;onDone({moves:mv,bad:bad.current,first:first.current??Date.now()-t0.current,solved:pg[2].length===4,onTarget:pg[2].length})};
 useEffect(()=>{const id=setInterval(()=>setLeft(x=>x-1),1000);return()=>clearInterval(id)},[]);
 useEffect(()=>{if(left<=0)fin(p,moves)},[left]);
 const tap=i=>{
  if(sel===null){if(p[i].length)setSel(i);return}
  if(sel===i){setSel(null);return}
  const d=p[sel][p[sel].length-1],t=p[i][p[i].length-1];
  if(t&&t<d){bad.current++;setSel(null);return}
  const np=p.map(x=>[...x]);np[sel].pop();np[i].push(d);
  if(first.current===null)first.current=Date.now()-t0.current;
  setP(np);setSel(null);setMoves(moves+1);
  if(np[2].length===4)fin(np,moves+1)};
 return(<View>
  <Row><T w="800">Moves {moves}</T><T w="800" c={left<20?C.er:C.tx}>⏱ {left}s</T></Row>
  <T c={C.mu} style={{marginVertical:10}}>Tap a peg to lift its top disk, then tap where to drop it. Goal: the whole stack on the green peg.</T>
  <Row>{[0,1,2].map(i=>(
   <Pressable key={i} onPress={()=>tap(i)} style={{flex:1,height:270,margin:4,borderRadius:18,backgroundColor:sel===i?'#4CC9F055':'#ffffff12',alignItems:'center',justifyContent:'flex-end',paddingBottom:6}}>
    <View style={{position:'absolute',bottom:0,width:8,height:250,borderRadius:4,backgroundColor:i===2?'#2EE6A8':'#ffffff33'}}/>
    {[...p[i]].reverse().map(d=><View key={d} style={{width:`${30+d*17}%`,height:30,borderRadius:10,marginTop:4,backgroundColor:COL[d]}}/>)}
   </Pressable>))}</Row>
 </View>);
}
