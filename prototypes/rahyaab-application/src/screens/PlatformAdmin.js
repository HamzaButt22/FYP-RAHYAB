// RahYaab platform admin (FR-7): overview + statistics + anonymised export, schools, individual subscriptions,
// RIASEC questions and career fields.
import React,{useCallback,useEffect,useState} from 'react';
import {View,Pressable,Linking} from 'react-native';
import {T,Btn,Card,Field,Row,Err,Ok,Chips,Loading} from '../ui';
import {C} from '../theme';
import {api} from '../api';
import {ChangePassword} from './Profile';

const SECTIONS=[['overview','📊 Overview'],['schools','🏫 Schools'],['students','🎓 Students'],['questions','❓ Questions'],['fields','🎯 Fields'],['account','👤 Account']];
const inDays=d=>{const x=new Date();x.setDate(x.getDate()+d);return x.toISOString().slice(0,10)};
const lines=s=>s.split('\n').map(x=>x.trim()).filter(Boolean);

export default function PlatformAdmin({onLogout}){
 const [sec,setSec]=useState('overview');
 return(<View>
  <T s={28} w="900">RahYaab admin 🛠️</T>
  <View style={{flexDirection:'row',flexWrap:'wrap',marginVertical:10}}>{SECTIONS.map(([k,l])=>
   <Pressable key={k} accessibilityRole="tab" accessibilityState={{selected:sec===k}} onPress={()=>setSec(k)} style={{paddingVertical:8,paddingHorizontal:12,margin:3,borderRadius:16,backgroundColor:sec===k?C.pri:C.card2}}><T s={14} w="800" c={sec===k?'#fff':C.mu}>{l}</T></Pressable>)}</View>
  {sec==='overview'&&<Overview/>}{sec==='schools'&&<Schools/>}{sec==='students'&&<Individuals/>}
  {sec==='questions'&&<Questions/>}{sec==='fields'&&<Fields/>}
  {sec==='account'&&<View><ChangePassword title="Change my password" onDone={()=>{}}/><Btn ghost title="Log out" color={C.er} onPress={onLogout}/></View>}
 </View>);
}

const KV=({k,v})=><Row style={{marginTop:6}}><T c={C.mu} s={14} style={{flex:1}}>{k}</T><T w="800" s={14}>{String(v)}</T></Row>;

function Overview(){
 const [s,setS]=useState(null),[err,setErr]=useState(''),[exp,setExp]=useState(null);
 useEffect(()=>{api.adminStats().then(setS).catch(x=>setErr(x.message))},[]);
 const doExport=async()=>{setErr('');try{const r=await api.createExport();const url=api.absolute(r.download_path);setExp({...r,url});Linking.openURL(url).catch(()=>{})}catch(x){setErr(x.message)}};
 if(!s)return err?<Err>{err}</Err>:<Loading/>;
 return(<View>
  <Card color={C.pri}><T s={18} w="800">Usage</T>
   <KV k="Students" v={s.users.STUDENT}/><KV k="School admins" v={s.users.SCHOOL_ADMIN}/><KV k="Schools" v={s.schools}/>
   <KV k="Individual students (active subscription)" v={`${s.individual_students} (${s.individual_active_subscriptions})`}/>
   <KV k="Assessments completed / in progress / stopped" v={`${s.assessments.COMPLETED} / ${s.assessments.IN_PROGRESS} / ${s.assessments.ABANDONED}`}/>
   <KV k="Completion rate" v={`${Math.round(s.completion_rate*100)}%`}/>
   <KV k="Flagged as rushed" v={`${s.flagged_assessments}${Object.keys(s.flags).length?' ('+Object.entries(s.flags).map(([k,v])=>`${k} ${v}`).join(', ')+')':''}`}/>
   <KV k="Ratings: useful / accurate" v={`${s.feedback.useful_avg??'–'} / ${s.feedback.accurate_avg??'–'} (n=${s.feedback.n})`}/>
   <KV k="Password emails" v={s.email}/>
  </Card>
  <Card><T s={18} w="800">Per school</T>{s.per_school.map(p=><KV key={p.org_id} k={p.school} v={`${p.completed} done / ${p.students} students`}/>)}{!s.per_school.length&&<T c={C.mu}>No schools yet.</T>}</Card>
  <Card color={C.ok}><T s={18} w="800">Anonymised export (FR-7.4)</T>
   <T c={C.mu} s={13} style={{marginVertical:6}}>A ZIP of CSV files without names, logins, emails, school names or comments. The download link works once, for 5 minutes. Keep the files inside the research team.</T>
   <Err>{err}</Err>
   <Btn title="Create export" color={C.ok} fg="#14113C" onPress={doExport}/>
   {exp&&<T s={13} selectable style={{marginTop:6}}>{exp.assessments} assessments. If the download did not open: {exp.url}</T>}
  </Card>
 </View>);
}

function Schools(){
 const [list,setList]=useState(null),[err,setErr]=useState(''),[secret,setSecret]=useState(null),[f,setF]=useState({name:'',until:inDays(365),adminName:'',adminLogin:''});
 const load=useCallback(()=>api.orgs().then(r=>setList(r.orgs)).catch(x=>setErr(x.message)),[]);
 useEffect(()=>{load()},[load]);
 const add=async()=>{setErr('');try{const r=await api.createOrg({name:f.name,subscription_until:f.until,admin:{name:f.adminName,login:f.adminLogin.trim()}});
  setSecret(r.admin);setF({name:'',until:inDays(365),adminName:'',adminLogin:''});load()}catch(x){setErr(x.message)}};
 const setUntil=async(o,until)=>{setErr('');try{await api.updateOrg(o.org_id,{subscription_until:until});load()}catch(x){setErr(x.message)}};
 return(<View>
  {secret&&<Card color={C.warn}><T s={18} w="800">School admin account</T><T s={18} w="900" selectable>Login: {secret.login}</T><T s={18} w="900" selectable>Temporary password: {secret.temporary_password}</T>
   <T c={C.mu} s={13}>Give it to the school privately. It is shown only now; they choose their own password at first login.</T><Btn ghost title="Done" color={C.warn} onPress={()=>setSecret(null)}/></Card>}
  <Err>{err}</Err>
  <Card color={C.pri}><T s={18} w="800">Add a school</T>
   <Field placeholder="School name" value={f.name} onChangeText={v=>setF(s=>({...s,name:v}))}/>
   <Field placeholder="Subscription end date (YYYY-MM-DD)" value={f.until} onChangeText={v=>setF(s=>({...s,until:v}))}/>
   <Field placeholder="School admin's name" value={f.adminName} onChangeText={v=>setF(s=>({...s,adminName:v}))} autoCapitalize="words"/>
   <Field placeholder="School admin's login (email or username)" value={f.adminLogin} onChangeText={v=>setF(s=>({...s,adminLogin:v}))}/>
   <Btn title="Add school" disabled={!f.name||!f.adminName||!f.adminLogin} onPress={add}/>
  </Card>
  {list===null?<Loading/>:list.map(o=><Card key={o.org_id} color={o.subscription_active?C.ok:C.er}>
   <T s={17} w="800">{o.name}</T>
   <T c={C.mu} s={13}>{o.students} students · {o.admins} admin · {o.completed} completed · subscription {o.subscription_active?'active until '+o.subscription_until:'not active'}</T>
   <Row style={{marginTop:4}}><Btn ghost title="Extend 1 year" color={C.ok} onPress={()=>setUntil(o,inDays(365))} style={{flex:1,marginRight:4}}/><Btn ghost title="End today" color={C.er} onPress={()=>setUntil(o,inDays(-1))} style={{flex:1,marginLeft:4}}/></Row>
  </Card>)}
 </View>);
}

function Individuals(){
 const [q,setQ]=useState(''),[list,setList]=useState(null),[err,setErr]=useState(''),[secret,setSecret]=useState(null);
 const load=useCallback(()=>api.users('individual',q).then(r=>setList(r.users)).catch(x=>setErr(x.message)),[q]);
 useEffect(()=>{load()},[load]);
 const upd=async(u,d)=>{setErr('');try{await api.updateUser(u.user_id,d);load()}catch(x){setErr(x.message)}};
 const code=async u=>{try{const r=await api.resetCode(u.user_id);setSecret(`${u.login}: ${r.code}`)}catch(x){setErr(x.message)}};
 return(<View>
  <Field placeholder="Search name or email" value={q} onChangeText={setQ}/>
  {secret&&<Card color={C.warn}><T s={18} w="900" selectable>Reset code {secret}</T><T c={C.mu} s={13}>Works once, for 24 hours.</T><Btn ghost title="Done" color={C.warn} onPress={()=>setSecret(null)}/></Card>}
  <Err>{err}</Err>
  {list===null?<Loading/>:!list.length?<T c={C.mu}>No individual students found.</T>:list.map(u=><Card key={u.user_id} color={u.subscription.active?C.ok:C.mu}>
   <T s={16} w="800">{u.name}{u.status!=='ACTIVE'?' · disabled':''}</T><T c={C.mu} s={13}>{u.login} · grade {u.grade} · {u.subscription.active?'active until '+u.subscription.until:'not active'}</T>
   <Row style={{marginTop:4}}>
    <Btn ghost title="Activate 1 year" color={C.ok} onPress={()=>upd(u,{subscription_until:inDays(365)})} style={{flex:1,marginRight:3}}/>
    <Btn ghost title="Reset code" color={C.warn} onPress={()=>code(u)} style={{flex:1,marginHorizontal:3}}/>
    <Btn ghost title={u.status==='ACTIVE'?'Disable':'Enable'} color={C.mu} onPress={()=>upd(u,{status:u.status==='ACTIVE'?'DISABLED':'ACTIVE'})} style={{flex:1,marginLeft:3}}/>
   </Row></Card>)}
 </View>);
}

const TYPES=[['R','R'],['I','I'],['A','A'],['S','S'],['E','E'],['C','C']];
function Questions(){
 const [d,setD]=useState(null),[err,setErr]=useState(''),[f,setF]=useState({code:null,text:''}),[edit,setEdit]=useState(null);
 const load=useCallback(()=>api.adminItems().then(setD).catch(x=>setErr(x.message)),[]);
 useEffect(()=>{load()},[load]);
 const run=async fn=>{setErr('');try{await fn();load()}catch(x){setErr(x.message)}};
 if(!d)return err?<Err>{err}</Err>:<Loading/>;
 return(<View>
  <T c={C.mu} s={13}>Version {d.version}. Students see the questions without their type. Each type keeps at least 2 active questions. Old results keep the version they used.</T>
  <Err>{err}</Err>
  <Card color={C.pri}><T s={18} w="800">Add a question</T><Chips options={TYPES} value={f.code} onChange={v=>setF(s=>({...s,code:v}))}/>
   <Field placeholder="e.g. Build a robot" value={f.text} onChangeText={v=>setF(s=>({...s,text:v}))}/>
   <Btn title="Add" disabled={!f.code||!f.text} onPress={()=>run(async()=>{await api.addItem(f);setF({code:null,text:''})})}/></Card>
  {d.items.map(it=><Card key={it.item_id} color={it.active?C.pri:C.mu}>
   {edit?.id===it.item_id?<View><Field value={edit.text} onChangeText={v=>setEdit(s=>({...s,text:v}))}/>
     <Row><Btn title="Save" onPress={()=>run(async()=>{await api.updateItem(it.item_id,{text:edit.text});setEdit(null)})} style={{flex:1,marginRight:4}}/><Btn ghost title="Cancel" color={C.mu} onPress={()=>setEdit(null)} style={{flex:1,marginLeft:4}}/></Row></View>
   :<View><T s={15} w="700">{it.code} · {it.text}{it.active?'':' (hidden)'}</T>
     <Row style={{marginTop:4}}><Btn ghost title="Edit" color={C.mu} onPress={()=>setEdit({id:it.item_id,text:it.text})} style={{flex:1,marginRight:4}}/>
      <Btn ghost title={it.active?'Hide':'Show'} color={it.active?C.er:C.ok} onPress={()=>run(()=>api.updateItem(it.item_id,{active:!it.active}))} style={{flex:1,marginLeft:4}}/></Row></View>}
  </Card>)}
 </View>);
}

const EMPTY={name:'',riasec_code:'',bigfive_ideal:'',description:'',skills:'',p910:'',p1112:''};
const toForm=f=>({name:f.name,riasec_code:f.riasec_code,bigfive_ideal:f.bigfive_ideal,description:f.description,skills:f.skills.join('\n'),p910:f.pathways['9-10'].join('\n'),p1112:f.pathways['11-12'].join('\n')});
const toBody=f=>({name:f.name,riasec_code:f.riasec_code.toUpperCase(),bigfive_ideal:f.bigfive_ideal,description:f.description,skills:lines(f.skills),pathways:{'9-10':lines(f.p910),'11-12':lines(f.p1112)}});
function Fields(){
 const [d,setD]=useState(null),[err,setErr]=useState(''),[ok,setOk]=useState(''),[form,setForm]=useState(null);
 const load=useCallback(()=>api.adminFields().then(setD).catch(x=>setErr(x.message)),[]);
 useEffect(()=>{load()},[load]);
 const save=async()=>{setErr('');setOk('');try{if(form.id)await api.updateField(form.id,toBody(form));else await api.addField(toBody(form));setForm(null);setOk('Saved. New results use the new version; old results stay as they were.');load()}catch(x){setErr(x.message)}};
 if(!d)return err?<Err>{err}</Err>:<Loading/>;
 const set=k=>v=>setForm(s=>({...s,[k]:v}));
 if(form)return(<Card color={C.warn}>
  <T s={18} w="800">{form.id?'Edit field':'New field'}</T>
  <Field placeholder="Field name" value={form.name} onChangeText={set('name')}/>
  <Field placeholder="Interest code: 3 letters, main first (e.g. IRC)" value={form.riasec_code} onChangeText={v=>set('riasec_code')(v.toUpperCase().slice(0,3))} autoCapitalize="characters"/>
  <Field placeholder="Typical personality O C E A N, 1-3 each (e.g. 32221)" value={form.bigfive_ideal} onChangeText={v=>set('bigfive_ideal')(v.replace(/[^1-3]/g,'').slice(0,5))} keyboardType="number-pad"/>
  <Field placeholder="Short description" value={form.description} onChangeText={set('description')} multiline/>
  <Field placeholder="Skills (one per line)" value={form.skills} onChangeText={set('skills')} multiline/>
  <Field placeholder="Pathway for grades 9-10 (one step per line)" value={form.p910} onChangeText={set('p910')} multiline/>
  <Field placeholder="Pathway for grades 11-12 (one step per line)" value={form.p1112} onChangeText={set('p1112')} multiline/>
  <Err>{err}</Err>
  <Btn title="Save field" color={C.warn} fg="#14113C" onPress={save}/><Btn ghost title="Cancel" color={C.mu} onPress={()=>{setForm(null);setErr('')}}/>
 </Card>);
 return(<View>
  <T c={C.mu} s={13}>Version {d.version}. Recommendations use the active fields.</T><Ok>{ok}</Ok><Err>{err}</Err>
  <Btn title="Add a field" onPress={()=>setForm({...EMPTY})}/>
  {d.fields.map(f=><Card key={f.field_id} color={f.active?C.warn:C.mu}>
   <T s={16} w="800">{f.name}{f.active?'':' (hidden)'}</T><T c={C.mu} s={13}>{f.riasec_code} · OCEAN {f.bigfive_ideal} · {f.skills.length} skills</T>
   <Row style={{marginTop:4}}><Btn ghost title="Edit" color={C.mu} onPress={()=>setForm({...toForm(f),id:f.field_id})} style={{flex:1,marginRight:4}}/>
    <Btn ghost title={f.active?'Hide':'Show'} color={f.active?C.er:C.ok} onPress={async()=>{try{await api.updateField(f.field_id,{active:!f.active});load()}catch(x){setErr(x.message)}}} style={{flex:1,marginLeft:4}}/></Row>
  </Card>)}
 </View>);
}
