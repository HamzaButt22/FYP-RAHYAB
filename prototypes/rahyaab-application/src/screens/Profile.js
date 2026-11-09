// View and edit the profile (FR-1.5), change password, log out. Also the forced change of a temporary password.
import React,{useState} from 'react';
import {View} from 'react-native';
import {T,Btn,Card,Field,Err,Ok,Chips,Row} from '../ui';
import {C} from '../theme';
import {api} from '../api';
import {GENDERS} from './Auth';

const GRADES=[[9,'9'],[10,'10'],[11,'11'],[12,'12']];

export default function Profile({u,onUser,onLogout}){
 const student=u.role==='STUDENT';
 const [f,setF]=useState({name:u.name,grade:u.grade,age:u.age==null?'':String(u.age),gender:u.gender,school_name:u.school_name||''});
 const [msg,setMsg]=useState(''),[err,setErr]=useState('');
 const set=k=>v=>setF(s=>({...s,[k]:v}));
 const save=async()=>{setErr('');setMsg('');try{
  const body={name:f.name,age:f.age?Number(f.age):null,gender:f.gender};
  if(student)body.grade=f.grade;
  if(!u.org)body.school_name=f.school_name||null;
  onUser(await api.saveProfile(body));setMsg('Saved.')}catch(x){setErr(x.message)}};
 return(<View>
  <T s={28} w="900">My profile 👤</T>
  <Card style={{marginTop:10}}>
   <Row><T c={C.mu}>Login</T><T w="800">{u.login}</T></Row>
   {u.org&&<Row style={{marginTop:4}}><T c={C.mu}>School</T><T w="800">{u.org.name}</T></Row>}
   <Row style={{marginTop:4}}><T c={C.mu}>Subscription</T><T w="800" c={u.subscription.active?C.ok:C.er}>{u.subscription.active?`active${u.subscription.until?' until '+u.subscription.until:''}`:'not active'}</T></Row>
  </Card>
  <Card color={C.pri}>
   <Field placeholder="Full name" value={f.name} onChangeText={set('name')} autoCapitalize="words"/>
   {student&&<><T s={14} w="700" style={{marginTop:6}}>Grade</T><Chips options={GRADES} value={f.grade} onChange={v=>v&&set('grade')(v)}/></>}
   <Field placeholder="Age (optional)" value={f.age} onChangeText={v=>set('age')(v.replace(/\D/g,'').slice(0,2))} keyboardType="number-pad"/>
   <T s={14} w="700" style={{marginTop:6}}>Gender (optional)</T><Chips options={GENDERS} value={f.gender} onChange={set('gender')}/>
   {!u.org&&student&&<Field placeholder="School (optional)" value={f.school_name} onChangeText={set('school_name')}/>}
   <Err>{err}</Err><Ok>{msg}</Ok>
   <Btn title="Save profile" onPress={save}/>
  </Card>
  <ChangePassword onDone={onUser} title="Change password"/>
  <Btn ghost title="Log out" color={C.er} onPress={onLogout}/>
 </View>);
}

export function ChangePassword({onDone,title='Choose your own password',intro}){
 const [cur,setCur]=useState(''),[pw,setPw]=useState(''),[pw2,setPw2]=useState(''),[err,setErr]=useState(''),[msg,setMsg]=useState('');
 const go=async()=>{setErr('');setMsg('');
  if(pw!==pw2)return setErr('The two new passwords are different.');
  try{const r=await api.changePassword(cur,pw);await onDone(r.user,r.token);setMsg('Password changed.');setCur('');setPw('');setPw2('')}catch(x){setErr(x.message)}};
 return(<Card color={C.warn}>
  <T s={18} w="800">{title}</T>{intro&&<T c={C.mu} s={14} style={{marginTop:4}}>{intro}</T>}
  <Field placeholder="Current password" value={cur} onChangeText={setCur} secureTextEntry autoComplete="password"/>
  <Field placeholder="New password (8+ characters, letters and numbers)" value={pw} onChangeText={setPw} secureTextEntry autoComplete="new-password"/>
  <Field placeholder="Repeat new password" value={pw2} onChangeText={setPw2} secureTextEntry autoComplete="new-password"/>
  <Err>{err}</Err><Ok>{msg}</Ok>
  <Btn title="Change password" color={C.warn} fg="#14113C" disabled={!cur||!pw||!pw2} onPress={go}/>
 </Card>);
}
