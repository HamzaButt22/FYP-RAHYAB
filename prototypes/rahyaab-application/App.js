import React,{useCallback,useEffect,useState} from 'react';
import {View,Pressable,ActivityIndicator} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {C} from './src/theme';
import {T,Row,Screen,Btn,Card,Err} from './src/ui';
import {api,loadSettings,setOnSessionExpired} from './src/api';
import {tokenStore} from './src/api/session';
import Auth from './src/screens/Auth';
import {Home,Practice,History} from './src/screens/Student';
import {Play} from './src/screens/Flow';
import Assessment,{linkFinishedGame} from './src/screens/Assessment';
import Report from './src/screens/Report';
import Profile,{ChangePassword} from './src/screens/Profile';
import World,{portrait} from './src/screens/World';
import SchoolAdmin from './src/screens/SchoolAdmin';
import PlatformAdmin from './src/screens/PlatformAdmin';

const STUDENT_TABS=[['home','🏠','Home'],['games','🎮','Practice'],['history','🕘','History'],['profile','👤','Profile']];

export default function App(){
 const [ready,setReady]=useState(false),[u,setU]=useState(null),[tab,setTab]=useState('home'),[view,setView]=useState(null),[note,setNote]=useState('');
 const signOut=useCallback(async(msg='')=>{await tokenStore.clear();setU(null);setView(null);setTab('home');setNote(msg)},[]);
 useEffect(()=>{(async()=>{
  portrait(); // the app is portrait; only Adventure gameplay switches to landscape
  await loadSettings();
  setOnSessionExpired(()=>signOut('Your session ended. Please log in again.'));
  if(await tokenStore.get()){try{setU(await api.me())}catch(e){if(e.status===401)await tokenStore.clear();else setNote(e.message)}}
  setReady(true);
 })()},[signOut]);
 const onSession=async(token,user)=>{await tokenStore.set(token);setNote('');setU(user)};
 const onUser=async(user,token)=>{if(token)await tokenStore.set(token);setU(user)};
 const logout=async()=>{try{await api.logout()}catch(e){/* token is removed anyway */}await signOut()};
 const go=(n,p)=>setView({n,...p}),back=()=>setView(null);

 if(!ready)return <View style={{flex:1,backgroundColor:C.bg,justifyContent:'center'}}><ActivityIndicator color={C.pri} size="large"/></View>;
 if(!u)return <SafeAreaProvider><StatusBar style="light"/>{!!note&&<SafeAreaView edges={['top']} style={{backgroundColor:C.bg}}><T c={C.warn} s={14} style={{textAlign:'center',padding:8}}>{note}</T></SafeAreaView>}<Auth onSession={onSession}/></SafeAreaProvider>;

 // the game runs full screen: no header, tabs or scrolling around it
 if(u.role==='STUDENT'&&view?.n==='world')return(<SafeAreaProvider><StatusBar style="light"/>
  <World key={u.user_id} u={u} onExit={back} onFinished={async sid=>{
   try{await linkFinishedGame(u,view.aid,sid);setView({n:'assess'})}
   catch(e){setView({n:'linkError',msg:e.message})}}}/></SafeAreaProvider>);

 let body;
 if(u.must_change_password)body=<ChangePassword onDone={onUser} intro="You logged in with a temporary password. Choose your own password to continue."/>;
 else if(u.role==='SCHOOL_ADMIN')body=<SchoolAdmin u={u}/>;
 else if(u.role==='PLATFORM_ADMIN')body=<PlatformAdmin u={u} onLogout={logout}/>;
 else if(view?.n==='assess')body=<Assessment u={u} onExit={back}
  onPlay={async a=>{try{setU(await api.me())}catch(e){/* keep the current profile */}go('world',{aid:a.assessment_id})}}
  onResult={id=>go('result',{id,fresh:true})}/>;
 else if(view?.n==='linkError')body=<Card color={C.warn}><T s={18} w="800">Your game is finished and saved on the server</T>
  <T c={C.mu} style={{marginVertical:6}}>We could not add it to your assessment yet ({view.msg}). It will be added automatically when you continue.</T>
  <Btn title="Continue" onPress={()=>go('assess')}/></Card>;
 else if(view?.n==='result')body=<Report id={view.id} onBack={()=>{back();setTab('home')}} onRetake={()=>go('assess')}/>;
 else if(view?.n==='practice')body=<Play key={view.k} k={view.k} uid={u.user_id} onExit={back}/>;
 else body=tab==='games'?<Practice go={go}/>:tab==='history'?<History go={go}/>:tab==='profile'?<Profile u={u} onUser={onUser} onLogout={logout}/>:<Home key={String(view)} u={u} go={go}/>;
 const showTabs=u.role==='STUDENT'&&!view&&!u.must_change_password;
 return(<SafeAreaProvider><StatusBar style="light"/>
  <View style={{flex:1,backgroundColor:C.bg}}>
   <Screen>
    <Row style={{marginBottom:16}}><T s={20} w="900">🧭 RahYaab</T><Pressable onPress={logout} accessibilityRole="button"><T c={C.mu} w="700">Log out</T></Pressable></Row>
    {!!note&&<Err>{note}</Err>}
    {body}
   </Screen>
   {showTabs&&<SafeAreaView edges={['bottom']} style={{backgroundColor:C.card}}>
    <Row style={{justifyContent:'space-around',paddingTop:8}}>{STUDENT_TABS.map(([k,e,l])=>
     <Pressable key={k} accessibilityRole="tab" accessibilityState={{selected:tab===k}} onPress={()=>setTab(k)} style={{alignItems:'center',padding:6,opacity:tab===k?1:.55}}><T s={22}>{e}</T><T s={12} w="800" c={tab===k?C.pri:C.mu}>{l}</T></Pressable>)}</Row>
   </SafeAreaView>}
  </View>
 </SafeAreaProvider>);
}
