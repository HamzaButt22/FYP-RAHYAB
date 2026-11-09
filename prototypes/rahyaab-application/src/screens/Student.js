import React,{useState} from 'react';
import {View} from 'react-native';
import {T,Btn,Card,Row} from '../ui';
import {C,GAMES} from '../theme';
import {api,D} from '../store';

export function Home({u,go}){
 const [err,setErr]=useState(''),mine=D.db.asm.filter(a=>a.sid===u.id).reverse(),last=mine.find(a=>a.status==='COMPLETED'),best=api.best(u.id),on=api.active(u);
 return(<View>
  <T s={30} w="900">Hi {u.name.split(' ')[0]} 👋</T>
  <T c={C.mu} style={{marginBottom:16}}>Let’s find the career that fits you.</T>
  <Card color={C.pri}>
   <T s={20} w="800">🚀 Your assessment</T>
   <T c={C.mu} style={{marginVertical:6}}>5 short games and a 24-question interest quiz. About 15 minutes.</T>
   <T c={on?C.ok:C.er} w="800">{on?'● Subscription active':'● Subscription inactive'}</T>
   {!!err&&<T c={C.er}>{err}</T>}
   <Btn title="Start assessment" onPress={()=>{try{go('assess',{id:api.start(u)})}catch(x){setErr(String(x))}}} style={{marginTop:8}}/>
  </Card>
  {last&&<Card color={C.ok}><T s={18} w="800">📊 Latest report</T><T c={C.mu} style={{marginVertical:4}}>Interest code: {last.ri.code}</T><Btn title="View my report" color={C.ok} fg="#14113C" onPress={()=>go('result',{id:last.id})}/></Card>}
  <Card>
   <T s={18} w="800" style={{marginBottom:8}}>🏆 Best game scores</T>
   <View style={{flexDirection:'row',flexWrap:'wrap'}}>{GAMES.map(g=><View key={g.k} style={{width:'33%',alignItems:'center',marginVertical:6}}><T s={26}>{g.emoji}</T><T w="900" c={g.color}>{best[g.k]??'–'}</T></View>)}</View>
  </Card>
 </View>);
}
export function Practice({go}){return(<View>
 <T s={28} w="900">Games 🎮</T><T c={C.mu} style={{marginBottom:14}}>Practise any game. Your scores are tracked.</T>
 {GAMES.map(g=><Card key={g.k} color={g.color}>
  <Row style={{justifyContent:'flex-start'}}><T s={40}>{g.emoji}</T><View style={{marginLeft:12}}><T s={18} w="800">{g.name}</T><T c={C.mu} s={13}>{g.skill}</T></View></Row>
  <Btn title="Play" color={g.color} fg="#14113C" onPress={()=>go('practice',{k:g.k})} style={{marginTop:8}}/>
 </Card>)}</View>)}
export function History({u,go}){
 const L=D.db.asm.filter(a=>a.sid===u.id).reverse();
 return(<View><T s={28} w="900" style={{marginBottom:14}}>History 🕘</T>{!L.length&&<T c={C.mu}>No assessments yet. Start one from Home.</T>}
  {L.map(a=><Card key={a.id}><Row><View><T w="800">{new Date(a.at).toLocaleDateString()}</T><T c={C.mu} s={13}>{a.status==='COMPLETED'?'Completed · '+a.ri.code:'In progress'}</T></View>{a.status==='COMPLETED'&&<Btn title="View" onPress={()=>go('result',{id:a.id})}/>}</Row></Card>)}</View>);
}
