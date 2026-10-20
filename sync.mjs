// Universal feed adapter. Does not scrape any websites or expose API credentials to visitors.
// Supply a licensed feed returning {meta, players} matching data/players.json.
import fs from 'node:fs/promises';
const url=process.env.STATISTICS_FEED_URL;
if(!url){ console.log('STATISTICS_FEED_URL not configured; keeping existing data unchanged.');process.exit(0); }
const headers={'Accept':'application/json'};
if(process.env.STATISTICS_FEED_TOKEN)headers.Authorization=`Bearer ${process.env.STATISTICS_FEED_TOKEN}`;
const response=await fetch(url,{headers,signal:AbortSignal.timeout(30000)});
if(!response.ok)throw new Error(`Feed returned HTTP ${response.status}`);
const payload=await response.json();
if(!payload||!Array.isArray(payload.players)||!payload.meta||!payload.meta.source)throw new Error('Invalid feed: expected meta.source and players[]');
const required=['id','name','position','league','club','country','region','gp','g','a'];
for(const p of payload.players){for(const f of required){if(p[f]===undefined||p[f]===null)throw new Error(`Player ${p.id||'?'} missing field: ${f}`)}for(const f of ['gp','g','a'])if(!Number.isFinite(p[f])||p[f]<0)throw new Error(`Invalid stat: ${f}`)}
payload.meta={...payload.meta,updatedAt:new Date().toISOString(),mode:'live'};
await fs.writeFile(new URL('../data/players.json',import.meta.url),JSON.stringify(payload,null,2)+'\n');
console.log(`Updated ${payload.players.length} players from ${payload.meta.source}`);
