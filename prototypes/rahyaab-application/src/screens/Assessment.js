// The official assessment: consent -> Part 1 Adventure (levels 1-6) -> Part 2 RIASEC questions -> results.
// Everything is saved on the server as it happens, so a student can stop and continue later (FR-2.3, FR-4.3).
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {View,Pressable} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {T,Btn,Card,Bar,Row,Err,Check,Loading} from '../ui';
import {C} from '../theme';
import {api} from '../api';
import {needsGuardian} from '../logic/consent';
import {firstUnanswered,missingCount,progress} from '../logic/questionnaire';

const pendingKey=uid=>`rahyaab_pending_game_${uid}`;
const ADV='#4CC9F0';

// ------------------------------------------------------------------ controller
export default function Assessment({u,onPlay,onResult,onExit}){
 const [a,setA]=useState(undefined),[err,setErr]=useState('');
 const load=useCallback(async()=>{
  setErr('');
  try{
   const list=(await api.assessments()).assessments;
   let open=list.find(x=>x.status==='IN_PROGRESS')||null;
   if(open&&!open.game.done){ // a finished game whose link did not reach the server yet: retry now
    const p=JSON.parse(await AsyncStorage.getItem(pendingKey(u.user_id))||'null');
    if(p&&p.aid===open.assessment_id){try{open=await api.linkGame(p.aid,p.sid);await AsyncStorage.removeItem(pendingKey(u.user_id))}catch(e){if(e.status&&e.status!==0)await AsyncStorage.removeItem(pendingKey(u.user_id))}}
   }
   setA(open);
  }catch(x){setErr(x.message);setA(null)}
 },[u.user_id]);
 useEffect(()=>{load()},[load]);
 if(a===undefined)return <Loading/>;
 if(err&&a===null)return <View><Err>{err}</Err><Btn title="Try again" onPress={load}/><Btn ghost title="Back" color={C.mu} onPress={onExit}/></View>;
 if(!a)return <Consent u={u} onStarted={setA} onExit={onExit}/>;
 if(!a.game.done)return <GameStep a={a} onPlay={()=>onPlay(a)} onExit={onExit}/>;
 return <Questionnaire a={a} onDone={onResult} onExit={onExit}/>;
}

// Called by App.js when the Adventure finished on the server (module onComplete).
export async function linkFinishedGame(u,aid,sid){
 await AsyncStorage.setItem(pendingKey(u.user_id),JSON.stringify({aid,sid}));
 const r=await api.linkGame(aid,sid);
 await AsyncStorage.removeItem(pendingKey(u.user_id));
 return r;
}

// ------------------------------------------------------------------ consent (FR-1.4)
function Consent({u,onStarted,onExit}){
 const [agree,setAgree]=useState(false),[guardian,setGuardian]=useState(false),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 const g=needsGuardian(u);
 const start=async()=>{setBusy(true);setErr('');try{onStarted(await api.startAssessment({accepted:true,guardian:g?guardian:false}))}catch(x){setErr(x.message)}setBusy(false)};
 return(<View>
  <T s={28} w="900">Before you start 📝</T>
  <Card color={C.pri} style={{marginTop:10}}>
   <T s={17} w="800">What happens</T>
   <T c={C.mu} style={{marginTop:4}}>Part 1: an adventure game with 6 levels (about 20-30 minutes). Part 2: 24 short questions about what you enjoy (about 5 minutes). You can stop and continue later.</T>
   <T s={17} w="800" style={{marginTop:12}}>What we collect and why</T>
   <T c={C.mu} style={{marginTop:4}}>• Your choices and timings in the game, and your answers - to describe your personality style and interests.{'\n'}• Your grade - to suggest pathways for your stage.{'\n'}Your game data is stored without your name. Only you can see your results{u.org?'; your school admin sees only whether you finished':''}. Researchers may study the data only without names.</T>
   <T s={17} w="800" style={{marginTop:12}}>Good to know</T>
   <T c={C.mu} style={{marginTop:4}}>There are no right or wrong answers, and nothing here is a test you pass or fail. Results are guidance, not a final career decision.</T>
  </Card>
  <Check value={agree} onChange={setAgree}>I understand and agree to take part.</Check>
  {g&&<Check value={guardian} onChange={setGuardian}>My parent or guardian knows about RahYaab and agrees.</Check>}
  {u.org&&<T c={C.mu} s={13}>Your school ({u.org.name}) has agreed to RahYaab for its students.</T>}
  <Err>{err}</Err>
  <Btn title={busy?'Starting…':'Start'} disabled={busy||!agree||(g&&!guardian)} onPress={start} style={{marginTop:8}}/>
  <Btn ghost title="Not now" color={C.mu} onPress={onExit}/>
 </View>);
}

// ------------------------------------------------------------------ part 1 (FR-2.1)
function GameStep({a,onPlay,onExit}){
 return(<View>
  <Steps n={1}/>
  <Card color={ADV}>
   <T s={40}>🗺️</T><T s={24} w="900">The Adventure</T>
   <T c={C.mu} style={{marginVertical:8}}>Six game levels: explore a valley, plan in a workshop, meet villagers, escape a vault, lead an expedition and help a town in a flood. Each level starts with a short briefing that explains the goal and the controls.</T>
   <T c={C.mu}>Play the way you normally would. There is no single right way.</T>
   <T s={13} c={C.warn} style={{marginTop:8}}>Turn your phone sideways when the level starts.</T>
  </Card>
  <Btn title="Play levels 1-6" color={ADV} fg="#14113C" onPress={onPlay}/>
  <Btn ghost title="Later" color={C.mu} onPress={onExit}/>
 </View>);
}

const Steps=({n})=><Row style={{marginBottom:12}}>{['Adventure','Questions','Results'].map((s,i)=>(
 <View key={s} style={{flex:1,alignItems:'center'}}><View style={{width:30,height:30,borderRadius:15,backgroundColor:i+1<=n?C.pri:C.card2,alignItems:'center',justifyContent:'center'}}><T w="900" s={14}>{i+1<n?'✓':i+1}</T></View><T s={12} c={i+1===n?C.tx:C.mu} w="700">{s}</T></View>))}</Row>;

// ------------------------------------------------------------------ part 2: RIASEC questions (FR-4)
const COLORS=[C.er,'#FF9F6B',C.warn,'#7BE0A0',C.ok];
export function Questionnaire({a,onDone,onExit}){
 const [items,setItems]=useState(null),[scale,setScale]=useState([]),[answers,setAnswers]=useState(a.riasec_answers||{}),[i,setI]=useState(0);
 const [unsaved,setUnsaved]=useState({}),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 const shownAt=useRef(Date.now()),timings=useRef({});
 useEffect(()=>{(async()=>{try{const r=await api.riasecItems();setItems(r.items);setScale(r.scale);const f=firstUnanswered(r.items,a.riasec_answers||{});setI(f<0?r.items.length-1:f)}catch(x){setErr(x.message)}})()},[a.assessment_id]);
 useEffect(()=>{shownAt.current=Date.now()},[i]);
 const flush=async(extra={})=>{ // save everything not yet on the server
  const pend={...unsaved,...extra};if(!Object.keys(pend).length)return true;
  const t={};Object.keys(pend).forEach(k=>{if(timings.current[k]!=null)t[k]=timings.current[k]});
  try{await api.saveAnswers(a.assessment_id,pend,t);setUnsaved({});return true}catch(x){setUnsaved(pend);setErr(x.status===0?'Not saved yet (no connection). Your answers will be saved when you continue.':x.message);return false}
 };
 if(!items)return err?<View><Err>{err}</Err><Btn title="Back" onPress={onExit}/></View>:<Loading/>;
 const it=items[i],missing=missingCount(items,answers),allSaved=!Object.keys(unsaved).length;
 const pick=async v=>{
  const k=String(it.item_id);timings.current[k]=Date.now()-shownAt.current;
  setAnswers(s=>({...s,[k]:v}));setErr('');
  const okSaved=await flush({[k]:v});
  if(okSaved&&i<items.length-1)setI(i+1);
 };
 const submit=async()=>{setBusy(true);setErr('');try{if(await flush()){await api.submit(a.assessment_id);onDone(a.assessment_id)}}catch(x){setErr(x.message)}setBusy(false)};
 return(<View>
  <Steps n={2}/>
  <Row><T w="800" c={C.mu}>Question {i+1} of {items.length}</T><T s={13} c={allSaved?C.ok:C.warn}>{allSaved?'✓ Saved':'Not saved yet'}</T></Row>
  <View style={{marginVertical:10}}><Bar v={progress(items,answers)*100} color={C.warn}/></View>
  <Card color={C.pri}><T c={C.mu} s={14}>How much would you enjoy this?</T><T s={24} w="900" style={{marginTop:6}}>{it.text}</T></Card>
  {scale.map((t,k)=>{const sel=answers[String(it.item_id)]===k+1;return(
   <Btn key={k} title={(sel?'✓ ':'')+t} color={COLORS[k]} fg="#14113C" onPress={()=>pick(k+1)} style={sel?{borderWidth:3,borderColor:'#fff'}:null}/>)})}
  <Row style={{marginTop:6}}>
   <Btn title="‹ Back" ghost color={C.mu} disabled={!i} onPress={()=>setI(i-1)} style={{flex:1,marginRight:6}}/>
   <Btn title="Next ›" ghost color={C.mu} disabled={i>=items.length-1||!answers[String(it.item_id)]} onPress={()=>setI(i+1)} style={{flex:1,marginLeft:6}}/>
  </Row>
  <Err>{err}</Err>
  {missing===0?<Btn title={busy?'Working out your results…':'See my results'} disabled={busy} onPress={submit} style={{marginTop:8}}/>
   :<T c={C.mu} s={13} style={{textAlign:'center',marginTop:8}}>{missing} question{missing>1?'s':''} left. Your answers are saved as you go.</T>}
  <Btn ghost title="Continue later" color={C.mu} onPress={async()=>{await flush();onExit()}}/>
 </View>);
}
