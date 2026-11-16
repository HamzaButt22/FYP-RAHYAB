// ALL assessment formulas live here. Every score is 0-100. Tune the weights as you collect real data.
import {RQ,FIELDS} from './data';
const cl=(x,a=0,b=100)=>Math.max(a,Math.min(b,x)),av=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0,r=Math.round;
const band=s=>s>=75?'Excellent':s>=55?'Good':s>=35?'Developing':'Needs practice';

export const scoreGame={
 // BART. Adjusted average pumps = average pumps on BANKED balloons only (popped ones are excluded).
 // ratio = pumps / balloon's mean burst point (1.0 is the statistical optimum). Risk tolerance = ratio / 1.5 * 100.
 bart(raw){
  const B=raw.balloons,bk=B.filter(b=>!b.popped),adj=av(bk.map(b=>b.pumps)),ratio=bk.length?av(bk.map(b=>b.pumps/b.m)):1.5;
  const pop=B.filter(b=>b.popped).length/B.length*100,gap=av(raw.gaps.filter(g=>g<3000))/1000,score=r(cl(ratio/1.5*100));
  return{score,label:ratio<.6?'Careful':ratio<=1.2?'Calculated risk-taker':'Bold',
   stats:[['Points banked',raw.points],['Adjusted average pumps',adj.toFixed(1)],['Balloons popped',B.filter(b=>b.popped).length+' of '+B.length],['Seconds between pumps',gap.toFixed(1)]],f:{pop}}},
 // Tower of Hanoi (4 disks, best = 15 moves). Pause before first move has the heaviest weight.
 // planning = 0.45*pause + 0.35*efficiency + 0.2*solved; x0.7 if fast first move (<2s) AND more than 30 moves (impulsive).
 hanoi(raw){
  const eff=raw.solved?cl(15/raw.moves*100):raw.onTarget/4*50,pause=raw.moves?Math.min(raw.first/1000,10)*10:0;
  let s=.45*pause+.35*eff+.2*(raw.solved?100:0);if(raw.first<2000&&raw.moves>30)s*=.7;
  return{score:r(cl(s)),label:band(s),stats:[['Solved',raw.solved?'Yes':'No'],['Moves (best is 15)',raw.moves],['Time before first move',(raw.first/1000).toFixed(1)+' s'],['Invalid tries',raw.bad]],f:{}}},
 // Emotify. Perception per face = 0.7 if right + 0.3*speed (3s limit). Management = story points / 2. EI = 0.5*P + 0.5*M.
 emo(raw){
  const F=raw.faces,per=av(F.map(x=>x.ok?.7+.3*(1-x.ms/3000):0))*100,man=av(raw.stories)/2*100,to=F.filter(x=>x.timeout).length/F.length*100,s=.5*per+.5*man;
  return{score:r(s),label:band(s),stats:[['Emotional perception',r(per)],['Emotion management',r(man)],['Faces right',F.filter(x=>x.ok).length+' of '+F.length]],f:{per,man,to}}},
 // Easy vs Hard. ambition = hard share / 0.5 (capped). score = 0.5*ambition + 0.5*hard completion rate.
 // x0.7 if stubborn (>60% hard but <30% finished) or only safe (<15% hard).
 eh(raw){
  const L=raw.log,H=L.filter(x=>x.hard),hr=H.length/L.length,hs=H.length?H.filter(x=>x.ok).length/H.length:0,amb=cl(hr/.5,0,1)*100;
  let s=.5*amb+.5*hs*100;if(hr>.6&&hs<.3)s*=.7;if(hr<.15)s*=.7;
  return{score:r(s),label:band(s),stats:[['Hard tasks chosen',H.length+' of '+L.length],['Hard tasks finished',H.filter(x=>x.ok).length],['Points',raw.points]],f:{amb}}},
 // Working memory. memory = (longest list - 2) / 7. math = 0.7*accuracy + 0.3*speed. score = 0.7*memory + 0.3*math (peak difficulty counts most).
 mem(raw){
  const mem=cl((raw.peak-2)/7*100),M=raw.math,acc=av(M.map(x=>+x.ok)),sp=cl(1-av(M.map(x=>x.ms))/8000,0,1),s=.7*mem+.3*(.7*acc+.3*sp)*100;
  return{score:r(s),label:band(s),stats:[['Longest list remembered',raw.peak],['Sums right',M.filter(x=>x.ok).length+' of '+M.length],['Seconds per sum',(av(M.map(x=>x.ms))/1000).toFixed(1)]],f:{}}}};

// Big Five from game indicators (several indicators per trait)
export const bigFive=g=>{
 const R=g.bart.score,P=g.hanoi.score,{per,man,to}=g.emo.f,EF=g.eh.score,AM=g.eh.f.amb,CG=g.mem.score,POP=g.bart.f.pop;
 const s={O:.4*CG+.3*R+.3*AM,C:.4*P+.3*EF+.3*(100-POP),E:.4*AM+.3*R+.3*per,A:.6*man+.4*per,N:.4*(100-R)+.3*(100-man)+.3*to};
 for(const k in s)s[k]=r(cl(s[k]));return s};

// RIASEC: 4 questions per type (1-5). Type score = (sum - 4) / 16 * 100. Code = top 3 types.
export const riasec=ans=>{const sum={R:0,I:0,A:0,S:0,E:0,C:0},p={};RQ.forEach(([t],k)=>sum[t]+=ans[k]);for(const t in sum)p[t]=r((sum[t]-4)/16*100);return{p,code:Object.keys(p).sort((x,y)=>p[y]-p[x]).slice(0,3).join('')}};

const TIPS=['Practise a little each week and note what you learn.','Use it in a small project or school activity.','Show your work to a teacher or mentor and ask for feedback.'];
const stage=g=>g<=10?'Start here: free online lessons, school clubs, and talking to people in this field.':'Start here: do a real project, prepare for entry tests, and ask a teacher for advice.';
// Final ranking = 0.7 * RIASEC match (code letters weighted 1, .6, .3) + 0.3 * Big Five fit (1 - mean distance to the field's ideal)
export const recommend=(bf,ri,grade)=>{
 const W=[1,.6,.3],V={1:.2,2:.5,3:.8};
 return FIELDS.map(([name,rc,bc,skills])=>{
  const m=[...rc].reduce((s,c,k)=>s+W[k]*ri.p[c],0)/1.9/100,fit=1-[...bc].reduce((s,v,k)=>s+Math.abs(bf['OCEAN'[k]]/100-V[v]),0)/5,sc=.7*m+.3*fit;
  return{name,pct:r(sc*100),sc,skills,why:'Interests '+ri.code+' match '+r(m*100)+'% (main factor). Personality fit from your games: '+r(fit*100)+'% (supporting factor).',road:skills.map((s,k)=>[s,k?TIPS[(k-1)%3]:stage(grade)])};
 }).sort((x,y)=>y.sc-x.sc).slice(0,5)};
