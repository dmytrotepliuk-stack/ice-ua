// ICE.UA: keyless NHL fetch plus manually verified, attributed European records.
// No fabricated players, no scraping and no API secrets. Node 22+.
import fs from 'node:fs/promises';
const ROOT = new URL('../', import.meta.url);
const season = process.env.HOCKEY_SEASON || '20262027';
if (!/^20\d{6}$/.test(season) || Number(season.slice(4)) !== Number(season.slice(0,4))+1) throw Error('Invalid NHL season id');
const seasonLabel=`${season.slice(0,4)}/${season.slice(6)}`;
const now=new Date().toISOString();
const num=(v, fallback=0) => v===null||v===undefined||v==='' ? fallback : Number(v);
function requiredNumber(v,key){const n=num(v,NaN);if(!Number.isFinite(n)||n<0)throw Error(`Invalid ${key}`);return n;}
function name(x){if(typeof x==='string')return x;return x?.default||x?.en||'';}
async function nhlReport(position){
 const route=position==='Воротар'?'goalie':'skater';
 const all=[]; const limit=100;
 for(let start=0;start<10000;start+=limit){
  const u=new URL(`https://api.nhle.com/stats/rest/en/${route}/summary`);
  u.searchParams.set('cayenneExp',`seasonId=${season} and gameTypeId=2 and nationalityCode="UKR"`);
  u.searchParams.set('start',start);u.searchParams.set('limit',limit);
  const res=await fetch(u,{headers:{Accept:'application/json','User-Agent':'ICE-UA-Community-Hockey-Tracker/1.0'},signal:AbortSignal.timeout(20000)});
  if(!res.ok)throw Error(`NHL ${route} HTTP ${res.status}`);
  const result=await res.json();if(!Array.isArray(result.data))throw Error(`Invalid NHL ${route} response`);
  all.push(...result.data);
  if(result.data.length<limit)break;
  if(start>=9900)throw Error('Pagination safety limit reached');
 }
 return all.map(x=>{
  const playerId=x.playerId;
  const playerName=name(x.skaterFullName||x.goalieFullName||x.playerName);
  if(!playerId||!playerName)throw Error('Incomplete NHL player identity');
  const goal=x.goals===undefined?0:requiredNumber(x.goals,'goals');
  const assist=x.assists===undefined?0:requiredNumber(x.assists,'assists');
  const pp=x.plusMinus===undefined||x.plusMinus===null?null:Number(x.plusMinus);
  return {
   id:`nhl-${route}-${playerId}`,name:playerName,position:position==='Воротар'?'Воротар':x.positionCode==='D'?'Захисник':'Нападник',
   league:'NHL',club:name(x.teamFullName||x.teamAbbrevs)||'Не вказано',country:'США / Канада',region:'Америка',
   gp:requiredNumber(x.gamesPlayed,'gamesPlayed'),g:goal,a:assist,
   plusMinus:Number.isFinite(pp)?pp:null,
   ...(position==='Воротар'?{svPct:x.savePct==null?null:Math.round(Number(x.savePct)*10000)/100,gaa:x.goalsAgainstAverage??null,wins:x.wins??null}:{}),
   source:'NHL Stats API',sourceUrl:`https://www.nhl.com/player/${playerId}`,
  };
 });
}
function validateSupplement(p){
 for(const k of ['id','name','position','league','club','country','region','sourceUrl']) if(!p[k]||typeof p[k]!=='string')throw Error(`Manual entry lacks ${k}`);
 if(!/^https:\/\//.test(p.sourceUrl))throw Error('Manual sourceUrl must be https');
 for(const k of ['gp','g','a'])requiredNumber(p[k],k);
 if(!['Америка','Європа'].includes(p.region))throw Error('Invalid region');
 if(p.country==='Україна')throw Error('Exclude domestic league');
 return {...p,id:`manual-${p.id}`,source:p.source||'Офіційна сторінка клубу або ліги'};
}
const manual=JSON.parse(await fs.readFile(new URL('data/manual-players.json',ROOT),'utf8'));
if(!Array.isArray(manual.players))throw Error('Expected manual players[]');
const supplement=manual.players.filter(x=>x.season===seasonLabel).map(validateSupplement);
// A failed NHL request must never silently erase previously verified data.
const nhl=[...await nhlReport('Нападник'),...await nhlReport('Воротар')];
const seen=new Set();const players=[...nhl,...supplement].filter(p=>{if(seen.has(p.id))return false;seen.add(p.id);return true;});
const payload={meta:{season:seasonLabel,mode:'live',source:'NHL Stats API + ручна верифікація європейських ліг',coverage:'Часткове покриття: NHL та окремі вручну перевірені ліги; не всі українські хокеїсти',updatedAt:now,nhlRecords:nhl.length,manualRecords:supplement.length,rightsNotice:'Публічний доступ до API не дорівнює ліцензії на повторну публікацію; перед публічним запуском перевірте умови NHL.'},players};
await fs.writeFile(new URL('data/players.json',ROOT),JSON.stringify(payload,null,2)+'\n');
console.log(`Saved ${players.length} records (${nhl.length} NHL; ${suppleme}
