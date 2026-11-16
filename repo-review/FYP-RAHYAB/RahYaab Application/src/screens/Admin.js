import React,{useState} from 'react';
import {View} from 'react-native';
import {T,Btn,Card,Field} from '../ui';
import {C} from '../theme';
import {api,D} from '../store';
export default function Admin({u,re}){
 const ins=D.db.insts.find(i=>i.id===u.inst),[f,setF]=useState({name:'',email:'',pw:'',grade:''}),[err,setErr]=useState(''),set=k=>v=>setF({...f,[k]:v});
 const S=D.db.users.filter(x=>x.inst===u.inst&&x.role==='STUDENT');
 const st=x=>{const m=D.db.asm.filter(a=>a.sid===x.id),c=m.find(a=>a.status==='COMPLETED');return c?'✅ Completed · '+c.ri.code:m.length?'⏳ In progress':'Not started'};
 return(<View>
  <T s={28} w="900">{ins.name} 🏫</T>
  <Card color={ins.sub==='ACTIVE'?C.ok:C.er} style={{marginTop:10}}><T w="800">Subscription: {ins.sub==='ACTIVE'?'Active':'Expired'}</T><Btn ghost title={ins.sub==='ACTIVE'?'Mark expired (demo)':'Reactivate (demo)'} color={C.mu} onPress={()=>{api.toggleInst(ins.id);re()}}/></Card>
  <Card color={C.pri}>
   <T s={18} w="800">Add a student</T>
   <Field placeholder="Full name" value={f.name} onChangeText={set('name')} autoCapitalize="words"/>
   <Field placeholder="Email" value={f.email} onChangeText={set('email')} keyboardType="email-address"/>
   <Field placeholder="Temporary password" value={f.pw} onChangeText={set('pw')}/>
   <Field placeholder="Grade (9 to 12)" value={f.grade} onChangeText={set('grade')} keyboardType="number-pad"/>
   {!!err&&<T c={C.er}>{err}</T>}
   <Btn title="Add student" onPress={()=>{try{api.addStudent(f);setF({name:'',email:'',pw:'',grade:''});setErr('');re()}catch(x){setErr(String(x))}}}/>
  </Card>
  <Card><T s={18} w="800">Students ({S.length})</T>{!S.length&&<T c={C.mu}>No students yet.</T>}
   {S.map(x=><View key={x.id} style={{marginTop:10}}><T w="800">{x.name} · Grade {x.grade}</T><T c={C.mu} s={13}>{x.email}</T><T s={13}>{st(x)}</T></View>)}
  </Card>
 </View>);
}
