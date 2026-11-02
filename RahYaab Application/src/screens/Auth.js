// Log in, register (individual students), forgot password, reset with a code, and the server address (FR-1.1-1.3).
import React,{useState} from 'react';
import {View,Pressable} from 'react-native';
import {T,Btn,Card,Field,Screen,Err,Ok,Chips,Check} from '../ui';
import {C} from '../theme';
import {api,serverUrl,setServerUrl,builtInServer,httpAllowed} from '../api';
import {checkServer,normalizeServerUrl} from '../world';

export const GENDERS=[['female','Female'],['male','Male'],['other','Other'],['prefer_not_to_say','Prefer not to say']];
const GRADES=[[9,'9'],[10,'10'],[11,'11'],[12,'12']];

export default function Auth({onSession}){
 const [mode,setMode]=useState('login'),[err,setErr]=useState(''),[ok,setOk]=useState(''),[busy,setBusy]=useState(false);
 const [f,setF]=useState({login:'',password:'',name:'',email:'',grade:null,age:'',gender:null,school_name:'',code:'',new_password:'',agree:false});
 const set=k=>v=>setF(s=>({...s,[k]:v}));
 const go=m=>{setMode(m);setErr('');setOk('')};
 const run=async fn=>{setBusy(true);setErr('');try{await fn()}catch(x){setErr(x.message||String(x))}finally{setBusy(false)}};

 const login=()=>run(async()=>{const r=await api.login(f.login.trim(),f.password);await onSession(r.token,r.user)});
 const register=()=>run(async()=>{
  if(!f.agree)throw new Error('Please read and accept how RahYaab uses your data.');
  if(!f.grade)throw new Error('Choose your grade.');
  const r=await api.register({name:f.name,email:f.email.trim(),password:f.password,grade:f.grade,age:f.age?Number(f.age):null,gender:f.gender,school_name:f.school_name||null});
  await onSession(r.token,r.user)});
 const forgot=()=>run(async()=>{const r=await api.forgot(f.email.trim());setOk(r.message);setF(s=>({...s,login:f.email.trim()}))});
 const reset=()=>run(async()=>{const r=await api.resetWithCode(f.login.trim(),f.code.trim(),f.new_password);setOk(r.message);setMode('login');setF(s=>({...s,password:'',code:'',new_password:''}))});

 return(<Screen>
  <View style={{alignItems:'center',marginVertical:20}}><T s={64}>🧭</T><T s={36} w="900">RahYaab</T><T c={C.mu}>Play, discover, find your path.</T></View>
  {mode==='login'&&<Card color={C.pri}>
   <T s={22} w="800">Welcome back</T>
   <Field placeholder="Email or username" value={f.login} onChangeText={set('login')} autoComplete="username"/>
   <Field placeholder="Password" value={f.password} onChangeText={set('password')} secureTextEntry autoComplete="password"/>
   <Err>{err}</Err><Ok>{ok}</Ok>
   <Btn title={busy?'Logging in…':'Log in'} disabled={busy||!f.login||!f.password} onPress={login} style={{marginTop:10}}/>
   <Btn ghost title="Forgot password?" color={C.mu} onPress={()=>go('forgot')}/>
   <Btn ghost title="Create an account" onPress={()=>go('register')}/>
  </Card>}

  {mode==='register'&&<Card color={C.pri}>
   <T s={22} w="800">Create your account</T>
   <T c={C.mu} s={13}>For students who use RahYaab on their own. School students: your school gives you a login.</T>
   <Field placeholder="Full name" value={f.name} onChangeText={set('name')} autoCapitalize="words"/>
   <Field placeholder="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address" autoComplete="email"/>
   <Field placeholder="Password (8+ characters, letters and numbers)" value={f.password} onChangeText={set('password')} secureTextEntry autoComplete="new-password"/>
   <T s={14} w="700" style={{marginTop:8}}>Grade</T><Chips options={GRADES} value={f.grade} onChange={set('grade')}/>
   <Field placeholder="Age (optional)" value={f.age} onChangeText={v=>set('age')(v.replace(/\D/g,'').slice(0,2))} keyboardType="number-pad"/>
   <T s={14} w="700" style={{marginTop:8}}>Gender (optional)</T><Chips options={GENDERS} value={f.gender} onChange={set('gender')}/>
   <Field placeholder="School (optional)" value={f.school_name} onChangeText={set('school_name')} autoCapitalize="words"/>
   <Card style={{backgroundColor:C.card2,marginTop:8}}>
    <T s={14} w="800">How RahYaab uses your data</T>
    <T s={13} c={C.mu} style={{marginTop:4}}>We store your name, email, grade and the optional details above, your game choices and your answers, to make your career guidance report. Only you can see your results. Researchers may study the data only without names. You can ask RahYaab to delete your account.</T>
   </Card>
   <Check value={f.agree} onChange={set('agree')}>I have read this. If I am under 18, a parent or guardian knows I am using RahYaab.</Check>
   <Err>{err}</Err>
   <Btn title={busy?'Creating…':'Register'} disabled={busy} onPress={register} style={{marginTop:10}}/>
   <Btn ghost title="I already have an account" onPress={()=>go('login')}/>
  </Card>}

  {mode==='forgot'&&<Card color={C.warn}>
   <T s={22} w="800">Forgot your password?</T>
   <T s={15} w="800" style={{marginTop:10}}>🏫 School students</T>
   <T c={C.mu} s={14}>Ask your school admin for a reset code, then tap "I have a code".</T>
   <T s={15} w="800" style={{marginTop:12}}>✉️ Everyone else</T>
   <T c={C.mu} s={14}>Enter the email of your account. We send a reset code to it.</T>
   <Field placeholder="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address"/>
   <Err>{err}</Err><Ok>{ok}</Ok>
   <Btn title={busy?'Sending…':'Email me a code'} disabled={busy||!f.email} onPress={forgot}/>
   <Btn title="I have a code" color={C.warn} fg="#14113C" onPress={()=>go('code')}/>
   <Btn ghost title="Back to log in" color={C.mu} onPress={()=>go('login')}/>
  </Card>}

  {mode==='code'&&<Card color={C.warn}>
   <T s={22} w="800">Choose a new password</T>
   <Field placeholder="Email or username" value={f.login} onChangeText={set('login')}/>
   <Field placeholder="Reset code (like ABCD-EF23)" value={f.code} onChangeText={v=>set('code')(v.toUpperCase())} autoCapitalize="characters"/>
   <Field placeholder="New password" value={f.new_password} onChangeText={set('new_password')} secureTextEntry autoComplete="new-password"/>
   <Err>{err}</Err>
   <Btn title={busy?'Saving…':'Change password'} disabled={busy||!f.login||!f.code||!f.new_password} onPress={reset}/>
   <Btn ghost title="Back to log in" color={C.mu} onPress={()=>go('login')}/>
  </Card>}

  <ServerPanel/>
 </Screen>);
}

// The address of the RahYaab server. Always visible, so a changed address cannot go unnoticed.
function ServerPanel(){
 const [open,setOpen]=useState(false),[url,setUrl]=useState(serverUrl()||''),[msg,setMsg]=useState(null),[busy,setBusy]=useState(false),[cur,setCur]=useState(serverUrl());
 const test=async()=>{setBusy(true);setMsg({ok:null,msg:'Testing…'});try{const u=normalizeServerUrl(url);setMsg(await checkServer(u,{allowHttp:httpAllowed()}))}catch(x){setMsg({ok:false,msg:String(x.message||x)})}setBusy(false)};
 const save=async()=>{try{const s=await setServerUrl(url);setCur(serverUrl());setMsg({ok:true,msg:s?'Saved.':'Using the address built into the app.'})}catch(x){setMsg({ok:false,msg:String(x.message||x)})}};
 return(<View style={{marginTop:8}}>
  <Pressable onPress={()=>setOpen(!open)} accessibilityRole="button"><T c={C.mu} s={13} style={{textAlign:'center'}}>🔌 Server: {cur||'not set'} · {open?'close':'change'}</T></Pressable>
  {open&&<Card style={{marginTop:8}}>
   <T s={13} c={C.mu}>Only change this if your school or RahYaab told you to. Built into this app: {builtInServer()||'none'}</T>
   <Field placeholder="http://192.168.1.7:5000" value={url} onChangeText={setUrl} keyboardType="url" autoCorrect={false}/>
   {msg&&<T s={14} c={msg.ok===null?C.mu:msg.ok?C.ok:C.er}>{msg.ok?'✅ ':msg.ok===false?'⚠️ ':''}{msg.msg}</T>}
   <Btn ghost title="Test connection" color="#4CC9F0" disabled={busy||!url.trim()} onPress={test}/>
   <Btn title="Save" color="#4CC9F0" fg="#14113C" onPress={save}/>
  </Card>}
 </View>);
}
