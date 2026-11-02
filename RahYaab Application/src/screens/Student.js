// Student home, practice games and history (FR-6.5).
import React,{useCallback,useEffect,useState} from 'react';
import {View} from 'react-native';
import {T,Btn,Card,Row,Err,Loading} from '../ui';
import {C,GAMES} from '../theme';
import {api} from '../api';
import {practice} from '../store';

const ADV='#4CC9F0';

export function Home({u,go}){
 const [list,setList]=useState(null),[best,setBest]=useState({}),[err,setErr]=useState('');
 const load=useCallback(()=>{api.assessments().then(r=>setList(r.assessments)).catch(x=>{setErr(x.message);setList([])});practice.best(u.user_id).then(setBest)},[u.user_id]);
 useEffect(()=>{load()},[load]);
 const open=list?.find(a=>a.status==='IN_PROGRESS'),last=list?.find(a=>a.status==='COMPLETED'),sub=u.subscription;
 return(<View>
  <T s={30} w="900">Hi {u.name.split(' ')[0]} 👋</T>
  <T c={C.mu} style={{marginBottom:16}}>Let's find the career that fits you.</T>
  <Card color={C.pri}>
   <T s={20} w="800">🚀 Your assessment</T>
   <T c={C.mu} style={{marginVertical:6}}>An adventure game (6 levels) and 24 short questions about what you enjoy. You can stop and carry on later.</T>
   <T c={sub.active?C.ok:C.er} w="800">{sub.active?`● Subscription active${sub.until?' until '+sub.until:''}`:'● Subscription not active'}</T>
   {!sub.active&&<T c={C.mu} s={13}>{sub.source==='school'?'Ask your school about RahYaab access.':'Contact RahYaab to activate your subscription.'}</T>}
   <Err>{err}</Err>
   {list===null?<Loading/>:<Btn title={open?(open.game.done?'Continue: questions':'Continue: the adventure'):(last?'Take it again':'Start assessment')} disabled={!sub.active&&!open} onPress={()=>go('assess')} style={{marginTop:8}}/>}
  </Card>
  {last&&<Card color={C.ok}><T s={18} w="800">📊 Latest results</T><T c={C.mu} style={{marginVertical:4}}>Interest code {last.holland_code}{last.top_field?' · may suit: '+last.top_field:''}</T><Btn title="View my results" color={C.ok} fg="#14113C" onPress={()=>go('result',{id:last.assessment_id})}/></Card>}
  <Card>
   <T s={18} w="800" style={{marginBottom:8}}>🏆 Best practice scores</T>
   <View style={{flexDirection:'row',flexWrap:'wrap'}}>{GAMES.map(g=><View key={g.k} style={{width:'33%',alignItems:'center',marginVertical:6}}><T s={26}>{g.emoji}</T><T w="900" c={g.color}>{best[g.k]??'–'}</T></View>)}</View>
  </Card>
 </View>);
}

export function Practice({go}){return(<View>
 <T s={28} w="900">Practice games 🎮</T>
 <T c={C.mu} style={{marginBottom:14}}>Just for fun and practice: these scores stay on your phone and are not part of your assessment.</T>
 {GAMES.map(g=><Card key={g.k} color={g.color}>
  <Row style={{justifyContent:'flex-start'}}><T s={40}>{g.emoji}</T><View style={{marginLeft:12}}><T s={18} w="800">{g.name}</T><T c={C.mu} s={13}>{g.skill}</T></View></Row>
  <Btn title="Play" color={g.color} fg="#14113C" onPress={()=>go('practice',{k:g.k})} style={{marginTop:8}}/>
 </Card>)}</View>)}

const STATUS={COMPLETED:'Completed',IN_PROGRESS:'In progress',ABANDONED:'Stopped'};
export function History({go}){
 const [list,setList]=useState(null),[err,setErr]=useState('');
 useEffect(()=>{api.assessments().then(r=>setList(r.assessments)).catch(x=>setErr(x.message))},[]);
 return(<View><T s={28} w="900" style={{marginBottom:14}}>History 🕘</T>
  <Err>{err}</Err>{list===null&&!err&&<Loading/>}
  {list&&!list.length&&<T c={C.mu}>No assessments yet. Start one from Home.</T>}
  {list&&list.map(a=><Card key={a.assessment_id}><Row>
   <View style={{flex:1}}><T w="800">{new Date(a.completed_at||a.started_at).toLocaleDateString()}</T>
    <T c={C.mu} s={13}>{STATUS[a.status]}{a.holland_code?' · '+a.holland_code:''}{a.top_field?' · '+a.top_field:''}</T></View>
   {a.status==='COMPLETED'&&<Btn title="View" onPress={()=>go('result',{id:a.assessment_id})}/>}
   {a.status==='IN_PROGRESS'&&<Btn title="Continue" onPress={()=>go('assess')}/>}
  </Row></Card>)}
 </View>);
}
