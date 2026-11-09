import React,{useEffect,useState} from 'react';
import {View,Pressable,ActivityIndicator} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {C,GAMES} from './src/theme';
import {T,Row,Screen} from './src/ui';
import {api} from './src/store';
import Auth from './src/screens/Auth';
import Admin from './src/screens/Admin';
import Results from './src/screens/Results';
import {Home,Practice,History} from './src/screens/Student';
import {Play,Riasec} from './src/screens/Flow';

const TABS=[['home','🏠','Home'],['games','🎮','Games'],['history','🕘','History']];

export default function App(){
 const [ready,setReady]=useState(false),[,f]=useState(0),re=()=>f(n=>n+1),[tab,setTab]=useState('home'),[view,setView]=useState(null);
 useEffect(()=>{api.load().then(()=>setReady(true))},[]);
 if(!ready)return <View style={{flex:1,backgroundColor:C.bg,justifyContent:'center'}}><ActivityIndicator color={C.pri} size="large"/></View>;
 const u=api.me(),go=(n,p)=>setView({n,...p}),back=()=>setView(null);
 if(!u)return <SafeAreaProvider><StatusBar style="light"/><Auth re={re}/></SafeAreaProvider>;
 let body;
 if(u.role!=='STUDENT')body=<Admin u={u} re={re}/>;
 else if(view?.n==='assess')body=<Play keys={GAMES.map(g=>g.k)} uid={u.id} onExit={back} onAll={raws=>{api.finishGames(view.id,raws);setView({n:'riasec',id:view.id})}}/>;
 else if(view?.n==='riasec')body=<Riasec onDone={ans=>{api.submitRiasec(view.id,ans);setView({n:'result',id:view.id})}}/>;
 else if(view?.n==='practice')body=<Play key={view.k} keys={[view.k]} uid={u.id} onExit={back} onAll={back}/>;
 else if(view?.n==='result')body=<Results id={view.id} onBack={back}/>;
 else body=tab==='games'?<Practice go={go}/>:tab==='history'?<History u={u} go={go}/>:<Home u={u} go={go}/>;
 const showTabs=u.role==='STUDENT'&&!view;
 return(<SafeAreaProvider><StatusBar style="light"/>
  <View style={{flex:1,backgroundColor:C.bg}}>
   <Screen>
    <Row style={{marginBottom:16}}><T s={20} w="900">🧭 RahYaab</T><Pressable onPress={()=>{api.logout();setView(null);setTab('home');re()}}><T c={C.mu} w="700">Log out</T></Pressable></Row>
    {body}
   </Screen>
   {showTabs&&<SafeAreaView edges={['bottom']} style={{backgroundColor:C.card}}>
    <Row style={{justifyContent:'space-around',paddingTop:8}}>{TABS.map(([k,e,l])=>
     <Pressable key={k} onPress={()=>setTab(k)} style={{alignItems:'center',padding:6,opacity:tab===k?1:.55}}><T s={22}>{e}</T><T s={12} w="800" c={tab===k?C.pri:C.mu}>{l}</T></Pressable>)}</Row>
   </SafeAreaView>}
  </View>
 </SafeAreaProvider>);
}
