// Results (FR-5, FR-6): Big Five (radar + levels + descriptions), RIASEC profile, suggested fields with
// explanation, skills and grade-tailored pathways, the calculation behind each, disclaimer, quality note, rating.
import React,{useEffect,useState} from 'react';
import {View,Pressable} from 'react-native';
import {T,Btn,Card,Row,Bar,Field,Err,Ok,Loading} from '../ui';
import {C,BFC} from '../theme';
import {api} from '../api';
import Radar from '../components/Radar';

const LEVEL_COLOR={High:C.ok,Moderate:C.warn,Low:'#4CC9F0'};
const H=({children})=><T s={20} w="800" style={{marginTop:14,marginBottom:8}}>{children}</T>;

export default function Report({id,onBack,onRetake}){
 const [r,setR]=useState(null),[err,setErr]=useState('');
 useEffect(()=>{api.result(id).then(setR).catch(x=>setErr(x.message))},[id]);
 if(err)return <View><Err>{err}</Err><Btn title="Back" onPress={onBack}/></View>;
 if(!r)return <Loading text="Loading your results…"/>;
 const band=r.grade_band==='9-10'?'grades 9-10':'grades 11-12';
 return(<View>
  <T s={28} w="900">Your results 🎉</T>
  <T c={C.mu} style={{marginBottom:6}}>{r.completed_at?new Date(r.completed_at).toLocaleDateString():''} · These may help you explore; they are not a final decision.</T>
  {r.quality?.message&&<Card color={C.warn}><T s={14}>{r.quality.message}</T></Card>}

  <H>🧩 Your personality style</H>
  <Card>
   <Radar traits={r.bigfive.traits}/>
   {r.bigfive.traits.map(t=><View key={t.key} style={{marginTop:12}}>
    <Row><T s={16} w="800">{t.name}</T>{t.measured?<View style={{backgroundColor:LEVEL_COLOR[t.level],borderRadius:10,paddingHorizontal:10,paddingVertical:2}}><T s={13} w="800" c="#14113C">{t.level}</T></View>:<T s={13} c={C.warn}>Not enough data</T>}</Row>
    {t.measured&&<View style={{marginVertical:5}}><Bar v={t.score} color={BFC[t.key]}/></View>}
    <T s={14} c={C.mu}>{t.description}</T>
   </View>)}
   <T s={12} c={C.mu} style={{marginTop:10}}>From how you played the Adventure. Scoring: {r.bigfive.model_version}.</T>
  </Card>

  <H>🧭 Your interests: {r.riasec.code}</H>
  <Card>{r.riasec.types.map(t=><View key={t.key} style={{marginVertical:6}}>
   <Row><T s={15} w="800">{t.name} {r.riasec.code.includes(t.key)?'⭐':''}</T><T s={15} w="900">{t.score}</T></Row>
   <View style={{marginVertical:4}}><Bar v={t.score} color={C.pri}/></View><T s={13} c={C.mu}>{t.about}</T>
  </View>)}</Card>

  <H>🎯 Fields that may suit you</H>
  {r.recommendations.map((f,i)=><Field_ key={f.name} f={f} i={i} band={band}/>)}

  <Card style={{backgroundColor:C.card2}}><T s={14} w="800">Please remember</T><T s={13} c={C.mu} style={{marginTop:4}}>{r.disclaimer}</T></Card>
  <Feedback id={id} initial={r.feedback}/>
  <Btn title="Back to home" onPress={onBack}/>
  {onRetake&&<Btn ghost title="Take the assessment again" color={C.mu} onPress={onRetake}/>}
 </View>);
}

function Field_({f,i,band}){
 const [open,setOpen]=useState(null);
 const tr=f.trace;
 return(<Card color={C.warn}>
  <Row><T s={18} w="800" style={{flex:1}}>{i+1}. {f.name}</T><T s={22} w="900" c={C.warn}>{f.pct}%</T></Row>
  {!!f.description&&<T s={13} c={C.mu} style={{marginTop:4}}>{f.description}</T>}
  <T s={14} style={{marginVertical:8}}>{f.why}</T>
  <T w="700">Skills to build</T><T c={C.mu} s={14}>{f.skills.join(' · ')}</T>
  <Row style={{marginTop:6}}>
   <Btn ghost color={C.warn} title={open==='path'?'Hide pathway':'Pathway for '+band} onPress={()=>setOpen(open==='path'?null:'path')} style={{flex:1,marginRight:4}}/>
   <Btn ghost color={C.mu} title={open==='how'?'Hide':'How was this worked out?'} onPress={()=>setOpen(open==='how'?null:'how')} style={{flex:1,marginLeft:4}}/>
  </Row>
  {open==='path'&&f.pathways.map((p,k)=><T key={k} s={14} style={{marginTop:6}}>{k+1}. {p}</T>)}
  {open==='how'&&<View style={{marginTop:6}}>
   <T s={13} c={C.mu}>Interest match {Math.round(tr.interest_match*100)}% × {tr.weights.interests} + personality fit {Math.round(tr.personality_fit*100)}% × {tr.weights.personality} = {f.pct}%</T>
   <T s={13} c={C.mu}>Field interests {tr.field_code}: {tr.letters.map(l=>`${l.code} ${l.your_score} (weight ${l.weight})`).join(', ')}</T>
   <T s={13} c={C.mu}>Personality (yours / typical): {tr.traits.map(t=>`${t.key} ${t.yours}/${t.typical}`).join(', ')}</T>
  </View>}
 </Card>);
}

const Stars=({value,onChange,label})=><View style={{marginVertical:6}}>
 <T s={14} w="700">{label}</T>
 <Row style={{justifyContent:'flex-start'}}>{[1,2,3,4,5].map(n=><Pressable key={n} accessibilityRole="button" accessibilityLabel={`${label} ${n} of 5`} onPress={()=>onChange(n)} style={{padding:6}}><T s={30} c={n<=value?C.warn:'#ffffff33'}>★</T></Pressable>)}</Row>
</View>;

// FR-6.6: rate how useful and how accurate the results feel (for the project's evaluation)
function Feedback({id,initial}){
 const [useful,setUseful]=useState(initial?.useful||0),[accurate,setAccurate]=useState(initial?.accurate||0),[comment,setComment]=useState(initial?.comment||'');
 const [msg,setMsg]=useState(initial?'Thanks for your rating!':''),[err,setErr]=useState('');
 const send=async()=>{setErr('');try{await api.feedback(id,{useful,accurate,comment:comment||null});setMsg('Thanks for your rating!')}catch(x){setErr(x.message)}};
 return(<Card color={C.pri}>
  <T s={18} w="800">How did this feel?</T>
  <Stars label="How useful are these results?" value={useful} onChange={setUseful}/>
  <Stars label="How well do they describe you?" value={accurate} onChange={setAccurate}/>
  <Field placeholder="Anything else? (optional)" value={comment} onChangeText={setComment} multiline maxLength={500}/>
  <Err>{err}</Err><Ok>{msg}</Ok>
  <Btn title="Send rating" disabled={!useful||!accurate} onPress={send}/>
 </Card>);
}
