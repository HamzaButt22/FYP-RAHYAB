// Local storage stands in for the Flask + MySQL backend. Each api method mirrors a REST endpoint.
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RQ} from './data';
import {scoreGame,bigFive,riasec,recommend as rec} from './scoring';

const KEY='rahyaab_mobile_v1';
const hash=s=>{let x=5381;for(const c of s)x=(x*33^c.charCodeAt(0))>>>0;return x.toString(36)}; // demo only: use bcrypt on the real backend
export const D={db:null};
const seed=()=>({n:10,tok:null,insts:[{id:1,name:'Demo School',sub:'ACTIVE'}],users:[{id:1,email:'admin@demo.edu',pw:hash('admin123'),role:'INSTITUTION_ADMIN',status:'ACTIVE',name:'Demo Admin',inst:1}],asm:[],scores:[]});
const save=()=>AsyncStorage.setItem(KEY,JSON.stringify(D.db)).catch(()=>{});
const asmOf=id=>D.db.asm.find(a=>a.id===id);
const mk=(d,x)=>{const e=d.email.trim().toLowerCase(),g=+d.grade;
 if(!d.name.trim()||!e.includes('@')||d.pw.length<6)throw 'Enter a name, a valid email and a password with at least 6 characters.';
 if(!(g>=9&&g<=12))throw 'Grade must be between 9 and 12.';
 if(D.db.users.some(u=>u.email===e))throw 'This email is already registered.';
 D.db.users.push({id:D.db.n++,email:e,pw:hash(d.pw),role:'STUDENT',status:'ACTIVE',name:d.name.trim(),grade:g,inst:null,sub:null,...x});save()};

export const api={
 async load(){try{D.db=JSON.parse(await AsyncStorage.getItem(KEY))}catch(e){}D.db=D.db||seed()},
 me:()=>D.db.users.find(u=>u.id===D.db.tok),
 register:d=>mk(d,{sub:'ACTIVE'}), // POST /api/auth/register
 login(email,pw){const u=D.db.users.find(x=>x.email===email.trim().toLowerCase());if(!u||u.status!=='ACTIVE'||u.pw!==hash(pw))throw 'Invalid email or password.';D.db.tok=u.id;save()}, // POST /api/auth/login
 logout(){D.db.tok=null;save()},
 active:u=>(u.inst?D.db.insts.find(i=>i.id===u.inst).sub:u.sub)==='ACTIVE', // checkAccess
 toggleInst(id){const i=D.db.insts.find(x=>x.id===id);i.sub=i.sub==='ACTIVE'?'EXPIRED':'ACTIVE';save()},
 addStudent(d){const ad=api.me();if(D.db.insts.find(i=>i.id===ad.inst).sub!=='ACTIVE')throw 'Your institution subscription is inactive.';mk(d,{inst:ad.inst})}, // POST /api/institution/students
 start(u){if(!api.active(u))throw 'Your subscription is inactive. Please contact your school or renew it.';const a={id:D.db.n++,sid:u.id,grade:u.grade,status:'IN_PROGRESS',at:Date.now()};D.db.asm.push(a);save();return a.id}, // POST /api/assessments
 asm:asmOf,
 saveScore(uid,key,sc){D.db.scores.push({uid,key,score:sc.score,at:Date.now()});save()}, // every game play is tracked
 best:uid=>{const b={};D.db.scores.filter(s=>s.uid===uid).forEach(s=>{b[s.key]=Math.max(b[s.key]??0,s.score)});return b},
 finishGames(id,raws){const a=asmOf(id);a.g={};for(const k in raws)a.g[k]=scoreGame[k](raws[k]);a.raw=raws;a.bf=bigFive(a.g);save()}, // POST /api/game-sessions/{id}/complete
 submitRiasec(id,ans){const a=asmOf(id);if(!RQ.every((_,k)=>ans[k]>=1&&ans[k]<=5))throw 'Please answer every question.';a.ans=ans;a.ri=riasec(ans);a.status='COMPLETED';a.done=Date.now();save()}, // POST /api/assessments/{id}/riasec-responses
 recommend(id){const a=asmOf(id);if(a.status!=='COMPLETED')throw 'Finish the assessment first.';if(!a.recs){a.recs=rec(a.bf,a.ri,a.grade);save()}return a.recs}}; // POST /api/assessments/{id}/recommendations
