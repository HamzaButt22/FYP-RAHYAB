import React,{useState,useRef} from 'react';
import {View} from 'react-native';
import {T,Btn,Card,Bar,Row} from '../ui';
import {C,GAMES} from '../theme';
import {GAME} from '../games';
import {scoreGame} from '../scoring';
import {api} from '../store';
import {RQ,LV} from '../data';

// Intro -> game -> score card, for one game (practice) or all games (assessment)
export function Play({keys,uid,onAll,onExit}){
 const [i,setI]=useState(0),[ph,setPh]=useState('intro'),[res,setRes]=useState(null),raws=useRef({});
 const k=keys[i],g=GAMES.find(x=>x.k===k),G=GAME[k],last=i===keys.length-1;
 if(ph==='game')return <G onDone={raw=>{raws.current[k]=raw;const sc=scoreGame[k](raw);api.saveScore(uid,k,sc);setRes(sc);setPh('score')}}/>;
 if(ph==='score')return(<View>
  <Card color={g.color} style={{alignItems:'center'}}>
   <T s={54}>{g.emoji}</T><T c={C.mu}>{g.name} score</T><T s={64} w="900" c={g.color}>{res.score}</T><T s={20} w="800">{res.label}</T>
   <View style={{alignSelf:'stretch',marginVertical:12}}><Bar v={res.score} color={g.color}/></View>
   {res.stats.map(([a,b])=><Row key={a} style={{alignSelf:'stretch',marginVertical:3}}><T c={C.mu} s={14}>{a}</T><T w="800" s={14}>{String(b)}</T></Row>)}
  </Card>
  <Btn title={last?(keys.length>1?'Finish games':'Done'):'Next game'} color={g.color} fg="#14113C" onPress={()=>{if(last)onAll(raws.current);else{setI(i+1);setPh('intro')}}}/>
 </View>);
 return(<View>
  <T w="800" c={C.mu}>{keys.length>1?'Game '+(i+1)+' of '+keys.length:'Practice'}</T>
  <Card color={g.color} style={{alignItems:'center',marginTop:10}}>
   <T s={72}>{g.emoji}</T><T s={26} w="900">{g.name}</T><T c={g.color} w="800" style={{marginBottom:8}}>{g.skill}</T><T c={C.mu} style={{textAlign:'center'}}>{g.how}</T>
  </Card>
  <Btn title="Start" color={g.color} fg="#14113C" onPress={()=>setPh('game')}/>
  <Btn title="Exit" ghost color={C.mu} onPress={onExit}/>
 </View>);
}

export function Riasec({onDone}){
 const [i,setI]=useState(0),[a,setA]=useState([]);
 const pick=v=>{const x=[...a];x[i]=v;setA(x);if(i===RQ.length-1)onDone(x);else setI(i+1)};
 return(<View>
  <T w="800" c={C.mu}>Interests · {i+1} of {RQ.length}</T>
  <View style={{marginVertical:10}}><Bar v={(i+1)/RQ.length*100} color={C.warn}/></View>
  <Card color={C.pri}><T c={C.mu} s={14}>How much would you enjoy this?</T><T s={24} w="900" style={{marginTop:6}}>{RQ[i][1]}</T></Card>
  {LV.map((t,k)=><Btn key={k} title={t} color={[C.er,'#FF9F6B',C.warn,'#7BE0A0',C.ok][k]} fg="#14113C" onPress={()=>pick(k+1)}/>)}
  <Btn title="Back" ghost color={C.mu} disabled={!i} onPress={()=>setI(i-1)}/>
 </View>);
}
