import React,{useState} from 'react';
import {View} from 'react-native';
import {T,Btn,Card,Field,Screen} from '../ui';
import {C} from '../theme';
import {api} from '../store';
export default function Auth({re}){
 const [m,setM]=useState('login'),[f,setF]=useState({email:'',pw:'',name:'',grade:''}),[err,setErr]=useState(''),[ok,setOk]=useState(''),reg=m==='register',set=k=>v=>setF({...f,[k]:v});
 const go=()=>{try{if(reg){api.register(f);setM('login');setErr('');setOk('Account created! Log in now.');return}api.login(f.email,f.pw);re()}catch(x){setErr(String(x));setOk('')}};
 return(<Screen>
  <View style={{alignItems:'center',marginVertical:24}}><T s={64}>🧭</T><T s={36} w="900">RahYaab</T><T c={C.mu}>Play, discover, find your path.</T></View>
  <Card color={C.pri}>
   <T s={22} w="800">{reg?'Create your account':'Welcome back'}</T>
   {reg&&<Field placeholder="Full name" value={f.name} onChangeText={set('name')} autoCapitalize="words"/>}
   <Field placeholder="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address"/>
   <Field placeholder="Password" value={f.pw} onChangeText={set('pw')} secureTextEntry/>
   {reg&&<Field placeholder="Grade (9 to 12)" value={f.grade} onChangeText={set('grade')} keyboardType="number-pad"/>}
   {!!err&&<T c={C.er}>{err}</T>}{!!ok&&<T c={C.ok}>{ok}</T>}
   <Btn title={reg?'Register':'Log in'} onPress={go} style={{marginTop:10}}/>
   <Btn ghost title={reg?'I already have an account':'Create an account'} onPress={()=>{setM(reg?'login':'register');setErr('');setOk('')}}/>
  </Card>
  <T c={C.mu} s={13} style={{textAlign:'center'}}>Demo institution admin: admin@demo.edu / admin123</T>
 </Screen>);
}
