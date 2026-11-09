// School admin: own school's students (add, reset code, enable/disable) and statistics. No student results.
import React,{useCallback,useEffect,useState} from 'react';
import {View} from 'react-native';
import {T,Btn,Card,Field,Row,Err,Chips,Loading} from '../ui';
import {C} from '../theme';
import {api} from '../api';
import {ChangePassword} from './Profile';

const GRADES=[[9,'9'],[10,'10'],[11,'11'],[12,'12']];

export default function SchoolAdmin({u}){
 const [list,setList]=useState(null),[stats,setStats]=useState(null),[err,setErr]=useState(''),[secret,setSecret]=useState(null);
 const [f,setF]=useState({name:'',login:'',grade:null}),[ferr,setFerr]=useState('');
 const load=useCallback(async()=>{setErr('');try{setList((await api.schoolStudents()).students);setStats(await api.schoolStats())}catch(x){setErr(x.message)}},[]);
 useEffect(()=>{load()},[load]);
 const add=async()=>{setFerr('');try{const r=await api.addStudent({name:f.name,login:f.login.trim(),grade:f.grade});
  setSecret({title:`Account for ${r.student.name}`,lines:[`Login: ${r.student.login}`,`Temporary password: ${r.temporary_password}`],note:r.message});setF({name:'',login:'',grade:null});load()}catch(x){setFerr(x.message)}};
 const code=async s=>{try{const r=await api.resetCode(s.user_id);setSecret({title:`Reset code for ${s.name}`,lines:[`Login: ${s.login}`,`Code: ${r.code}`],note:r.message})}catch(x){setErr(x.message)}};
 const toggle=async s=>{try{await api.updateStudent(s.user_id,{status:s.status==='ACTIVE'?'DISABLED':'ACTIVE'});load()}catch(x){setErr(x.message)}};
 return(<View>
  <T s={28} w="900">{u.org?.name} 🏫</T>
  <Card color={u.subscription.active?C.ok:C.er} style={{marginTop:10}}><T w="800">Subscription: {u.subscription.active?`active until ${u.subscription.until}`:'not active - contact RahYaab'}</T></Card>
  {secret&&<Card color={C.warn}><T s={18} w="800">{secret.title}</T>{secret.lines.map(l=><T key={l} s={20} w="900" style={{marginTop:6}} selectable>{l}</T>)}
   <T c={C.mu} s={13} style={{marginTop:6}}>{secret.note} It is shown only now.</T><Btn ghost title="Done" color={C.warn} onPress={()=>setSecret(null)}/></Card>}
  <Err>{err}</Err>
  {stats&&<Card color={C.pri}><T s={18} w="800">📊 Statistics</T>
   {[['Students',stats.students],['Finished the assessment',`${stats.students_completed} (${Math.round(stats.completion_rate*100)}%)`],['Assessments completed',stats.assessments_completed],
     ['Flagged as rushed',stats.flagged],['Average usefulness rating',stats.feedback.useful_avg??'–'],['By grade',Object.entries(stats.by_grade).map(([g,n])=>`${g}: ${n}`).join(' · ')||'–']]
    .map(([k,v])=><Row key={k} style={{marginTop:6}}><T c={C.mu} s={14}>{k}</T><T w="800" s={14}>{String(v)}</T></Row>)}</Card>}
  <Card color={C.pri}>
   <T s={18} w="800">Add a student</T>
   <Field placeholder="Full name" value={f.name} onChangeText={v=>setF(s=>({...s,name:v}))} autoCapitalize="words"/>
   <Field placeholder="Login (username like ali.raza, or email)" value={f.login} onChangeText={v=>setF(s=>({...s,login:v}))}/>
   <Chips options={GRADES} value={f.grade} onChange={v=>setF(s=>({...s,grade:v}))}/>
   <Err>{ferr}</Err>
   <Btn title="Add student" disabled={!f.name||!f.login||!f.grade} onPress={add}/>
  </Card>
  <Card><T s={18} w="800">Students ({list?list.length:'…'})</T>
   {list===null&&<Loading/>}{list&&!list.length&&<T c={C.mu}>No students yet.</T>}
   {list&&list.map(s=><View key={s.user_id} style={{marginTop:12,paddingTop:10,borderTopWidth:1,borderTopColor:'#ffffff14'}}>
    <T w="800">{s.name} · Grade {s.grade}{s.status!=='ACTIVE'?' · disabled':''}</T>
    <T c={C.mu} s={13}>{s.login} · {s.assessments_completed?`✅ finished ${s.assessments_completed}×`:s.assessment_in_progress?'⏳ in progress':'not started'}</T>
    <Row style={{marginTop:4}}>
     <Btn ghost title="Reset code" color={C.warn} onPress={()=>code(s)} style={{flex:1,marginRight:4}}/>
     <Btn ghost title={s.status==='ACTIVE'?'Disable':'Enable'} color={C.mu} onPress={()=>toggle(s)} style={{flex:1,marginLeft:4}}/>
    </Row></View>)}
  </Card>
  <ChangePassword title="Change my password" onDone={()=>{}}/>
 </View>);
}
