// Part 1 of the assessment: the RahYaab Adventure (levels 1-6), full screen, using the student's own login
// for every game upload (the server only accepts the student's own game data).
import React,{useCallback,useEffect,useMemo,useRef} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import {RahYaabGameScreen} from '../features/rahyaab-game';
import {scopedStorage,worldConfig} from '../world';
import {T,Btn,Card,Screen} from '../ui';
import {C} from '../theme';
import {serverUrl} from '../api';
import {tokenStore} from '../api/session';

const lock=o=>ScreenOrientation.lockAsync(o).catch(()=>{}); // some tablets/iOS versions ignore locks: the game then uses its portrait layout
export const portrait=()=>lock(ScreenOrientation.OrientationLock.PORTRAIT_UP);

export default function World({u,onFinished,onExit}){
 const config=useMemo(()=>{
  const c=worldConfig(serverUrl(),process.env.EXPO_PUBLIC_RAHYAAB_ALLOW_HTTP,__DEV__);
  return c&&{...c,getAuthHeaders:async()=>{const t=await tokenStore.get();return t?{Authorization:`Bearer ${t}`}:{}}};
 },[]);
 const storage=useMemo(()=>scopedStorage(AsyncStorage,u.user_id),[u.user_id]);
 const finished=useRef(null);
 useEffect(()=>()=>{portrait()},[]); // whatever happens, the rest of the app is portrait again
 const orient=useCallback(o=>lock(o==='landscape'?ScreenOrientation.OrientationLock.LANDSCAPE:ScreenOrientation.OrientationLock.PORTRAIT_UP),[]);
 const done=useCallback(res=>{finished.current=res.sessionId},[]); // only called after the server scored the session
 const exit=useCallback(reason=>{portrait();if(reason==='completed'&&finished.current)onFinished(finished.current);else onExit()},[onFinished,onExit]);

 if(!config)return(<Screen>
  <Card color={C.er}><T s={20} w="800">The game is not available right now</T>
   <T c={C.mu} style={{marginVertical:8}}>No RahYaab server address is set. Log out and use "Server" on the login screen, or ask your school.</T></Card>
  <Btn title="Back" onPress={onExit}/>
 </Screen>);
 return <RahYaabGameScreen config={config} player={{displayName:u.name,playerId:u.player_id}} storage={storage}
  initialTrack="bigfive" onRequestOrientation={orient} onComplete={done} onExit={exit} exitLabel="Back to RahYaab"/>;
}
