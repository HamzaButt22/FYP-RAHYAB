import React,{useState} from 'react';
import {View} from 'react-native';
import {T,Btn,Card,Row,Bar,Labeled} from '../ui';
import {C,GAMES,BFC} from '../theme';
import {BFN,RN} from '../data';
import {api} from '../store';
export default function Results({id,onBack}){
 const a=api.asm(id),[open,setOpen]=useState(null);let recs,err;try{recs=api.recommend(id)}catch(x){err=String(x)}
 const top=[...GAMES].sort((x,y)=>a.g[y.k].score-a.g[x.k].score)[0],H=t=><T s={20} w="800" style={{marginVertical:8}}>{t}</T>;
 return(<View>
  <T s={28} w="900">Your report 🎉</T>
  <T c={C.mu} style={{marginBottom:10}}>Guidance, not a prediction. Strongest game: {top.emoji} {top.name}.</T>
  {H('🎮 Game scores')}
  {GAMES.map(g=>{const s=a.g[g.k];return<Card key={g.k} color={g.color}>
   <Row><T s={17} w="800">{g.emoji} {g.name}</T><T s={22} w="900" c={g.color}>{s.score}</T></Row>
   <T c={C.mu} s={13} style={{marginBottom:6}}>{s.label}</T><Bar v={s.score} color={g.color}/>
   {s.stats.map(([k,v])=><Row key={k} style={{marginTop:4}}><T s={13} c={C.mu}>{k}</T><T s={13} w="700">{String(v)}</T></Row>)}
  </Card>})}
  {H('🧩 Big Five personality')}
  <Card>{Object.keys(BFN).map(k=><Labeled key={k} label={BFN[k]} v={a.bf[k]} color={BFC[k]}/>)}</Card>
  {H('🧭 Interests (RIASEC): '+a.ri.code)}
  <Card>{Object.keys(RN).map(k=><Labeled key={k} label={RN[k]} v={a.ri.p[k]} color={C.pri}/>)}</Card>
  {H('🎯 Best-fit career fields')}
  {!!err&&<T c={C.er}>{err}</T>}
  {recs&&recs.map((r,i)=><Card key={r.name} color={C.warn}>
   <Row><T s={18} w="800" style={{flex:1}}>{i+1}. {r.name}</T><T s={22} w="900" c={C.warn}>{r.pct}%</T></Row>
   <T c={C.mu} s={13} style={{marginVertical:6}}>{r.why}</T>
   <T w="700">Skills to build</T><T c={C.mu}>{r.skills.join(' · ')}</T>
   <Btn ghost color={C.warn} title={open===i?'Hide roadmap':'Show roadmap'} onPress={()=>setOpen(open===i?null:i)}/>
   {open===i&&r.road.map(([s,d],k)=><View key={s} style={{marginTop:8}}><T w="800">{k+1}. {s}</T><T c={C.mu} s={13}>{d}</T></View>)}
  </Card>)}
  <Btn title="Back to home" onPress={onBack}/>
 </View>);
}
