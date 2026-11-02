// Practice: intro -> mini-game -> score card. Scores are saved on this phone only (not part of the assessment).
import React,{useState} from 'react';
import {View} from 'react-native';
import {T,Btn,Card,Bar,Row} from '../ui';
import {C,GAMES} from '../theme';
import {GAME} from '../games';
import {scoreGame} from '../scoring';
import {practice} from '../store';

export function Play({k,uid,onExit}){
 const [ph,setPh]=useState('intro'),[res,setRes]=useState(null);
 const g=GAMES.find(x=>x.k===k),G=GAME[k];
 if(ph==='game')return <G onDone={raw=>{const sc=scoreGame[k](raw);practice.save(uid,k,sc.score);setRes(sc);setPh('score')}}/>;
 if(ph==='score')return(<View>
  <Card color={g.color} style={{alignItems:'center'}}>
   <T s={54}>{g.emoji}</T><T c={C.mu}>{g.name} practice score</T><T s={64} w="900" c={g.color}>{res.score}</T><T s={20} w="800">{res.label}</T>
   <View style={{alignSelf:'stretch',marginVertical:12}}><Bar v={res.score} color={g.color}/></View>
   {res.stats.map(([a,b])=><Row key={a} style={{alignSelf:'stretch',marginVertical:3}}><T c={C.mu} s={14}>{a}</T><T w="800" s={14}>{String(b)}</T></Row>)}
  </Card>
  <Btn title="Play again" color={g.color} fg="#14113C" onPress={()=>setPh('intro')}/>
  <Btn title="Done" ghost color={C.mu} onPress={onExit}/>
 </View>);
 return(<View>
  <T w="800" c={C.mu}>Practice</T>
  <Card color={g.color} style={{alignItems:'center',marginTop:10}}>
   <T s={72}>{g.emoji}</T><T s={26} w="900">{g.name}</T><T c={g.color} w="800" style={{marginBottom:8}}>{g.skill}</T><T c={C.mu} style={{textAlign:'center'}}>{g.how}</T>
  </Card>
  <Btn title="Start" color={g.color} fg="#14113C" onPress={()=>setPh('game')}/>
  <Btn title="Exit" ghost color={C.mu} onPress={onExit}/>
 </View>);
}
