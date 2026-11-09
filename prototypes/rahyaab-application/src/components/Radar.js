// Radar chart of the five traits (FR-6.1). Unmeasured traits are drawn at the centre and marked in the labels.
import React from 'react';
import {View} from 'react-native';
import Svg,{Circle,Line,Polygon,Text as SvgText} from 'react-native-svg';
import {radarPoints} from '../logic/radar';
import {C} from '../theme';

export default function Radar({traits,size=260}){
 const cx=size/2,cy=size/2,r=size/2-42;
 const rings=[25,50,75,100].map(v=>radarPoints(traits.map(()=>v),cx,cy,r));
 const axes=radarPoints(traits.map(()=>100),cx,cy,r);
 const labels=radarPoints(traits.map(()=>124),cx,cy,r);
 const pts=radarPoints(traits.map(t=>t.measured?t.score:0),cx,cy,r);
 const desc=traits.map(t=>`${t.name}: ${t.measured?t.score+' ('+t.level+')':'not measured'}`).join(', ');
 return(<View accessible accessibilityLabel={`Personality chart. ${desc}`} style={{alignItems:'center'}}>
  <Svg width={size} height={size}>
   {rings.map((ring,k)=><Polygon key={k} points={ring.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="#ffffff22" strokeWidth={1}/>)}
   {axes.map((p,k)=><Line key={k} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#ffffff22"/>)}
   <Polygon points={pts.map(p=>`${p.x},${p.y}`).join(' ')} fill={C.pri+'66'} stroke={C.pri} strokeWidth={2}/>
   {pts.map((p,k)=><Circle key={k} cx={p.x} cy={p.y} r={4} fill={traits[k].measured?C.pri:C.mu}/>)}
   {labels.map((p,k)=><SvgText key={k} x={p.x} y={p.y+4} fill={C.mu} fontSize={11} fontWeight="700" textAnchor="middle">{traits[k].key}{traits[k].measured?'':' ?'}</SvgText>)}
  </Svg>
 </View>);
}
