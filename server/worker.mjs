const cities=['Goa','Jaipur','Manali'];
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const clean=s=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const tag=(xml,name)=>clean(xml.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>','i'))?.[1]||'').trim();
async function news(city,question){
 const query=city+' (road OR highway OR traffic OR landslide OR diversion) '+question+' when:21d';
 const response=await fetch('https://news.google.com/rss/search?'+new URLSearchParams({q:query,hl:'en-IN',gl:'IN',ceid:'IN:en'}),{signal:AbortSignal.timeout(7000),cf:{cacheTtl:1800,cacheEverything:true}});
 if(!response.ok)throw Error();
 const feed=await response.text();
 if(!feed.includes('<channel>'))throw Error();
 const since=Date.now()-21*86400000;
 return [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([,item])=>({title:tag(item,'title'),url:tag(item,'link'),date:tag(item,'pubDate'),publisher:tag(item,'source')})).filter(a=>/^https:\/\/news\.google\.com\//.test(a.url)&&Date.parse(a.date)>=since&&Date.parse(a.date)<=Date.now()).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,4);
}
const regions={
 Goa:{box:[73.67,15.43,73.90,15.62],centre:[73.81,15.51],airport:[73.832,15.381]},
 Jaipur:{box:[75.68,26.84,75.92,27.04],centre:[75.83,26.94],airport:[75.805,26.828]},
 Manali:{box:[77.06,32.05,77.24,32.34],centre:[77.18,32.24],airport:[77.153,31.878]}
};
async function external(url){
 const r=await fetch(url,{headers:{'User-Agent':'TripWeave travel planner'},signal:AbortSignal.timeout(6500),cf:{cacheEverything:true,cacheTtl:86400}});
 if(!r.ok)throw Error();
 return r.json();
}
function words(name){return name.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>1&&!['the','at','resort','hotel','and','spa'].includes(w));}
async function locate(name,city){
 const r=regions[city],params=new URLSearchParams({q:name,limit:'5',bbox:r.box.join(','),lat:r.centre[1],lon:r.centre[0]});
 const response=await external('https://photon.komoot.io/api/?'+params);
 const match=response.features.find(f=>{
 const n=new Set(words(f.properties.name||'')),tokens=words(name).filter(w=>w!==city.toLowerCase());
 return tokens.length&&tokens.every(t=>n.has(t))&&Array.isArray(f.geometry.coordinates);
 });
 return match?{name:match.properties.name,coords:match.geometry.coordinates}:null;
}
async function approach(city,hotel){
 const to=await locate(hotel,city);
 if(!to)return json({found:false});
 const from=regions[city].airport;
 const route=await external('https://router.project-osrm.org/route/v1/driving/'+from.join(',')+';'+to.coords.join(',')+'?overview=full&geometries=geojson');
 const path=route.routes?.[0]?.geometry?.coordinates;
 if(!path?.length)return json({found:false});
 const metres=(a,b)=>Math.hypot((a[0]-b[0])*Math.cos(b[1]*Math.PI/180),a[1]-b[1])*111195;
 let length=0,sampledLength=0;const samples=[path.at(-1)];
 for(let i=path.length-2;i>=0&&length<2000;i--){
 length+=metres(path[i],path[i+1]);
 if(length-sampledLength>=200){samples.push(path[i]);sampledLength=length;}
 }
 let rise=null;
 if(samples.length>1)try{
 const heights=await external('https://api.open-meteo.com/v1/elevation?'+new URLSearchParams({latitude:samples.map(p=>p[1]).join(','),longitude:samples.map(p=>p[0]).join(',')}));
 if(heights.elevation?.length===samples.length&&heights.elevation.every(Number.isFinite))rise=Math.round(heights.elevation[0]-heights.elevation.at(-1));
 }catch{}
 return json({found:true,match:to.name,km:Math.round(route.routes[0].distance/1000),lastKm:sampledLength/1000,rise});
}

async function ask(body,env){
 if(!env.OPENAI_API_KEY)return json({available:false});
 const request=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},signal:AbortSignal.timeout(40000),body:JSON.stringify({model:env.OPENAI_MODEL||'gpt-5-mini',store:false,tools:[{type:'web_search'}],tool_choice:'required',instructions:'Answer only the hotel access or travel question. Search recent local official sources. Separate regional information from evidence about the exact hotel entrance. Give dates and cite verifiable claims. State when evidence is incomplete. Do not infer safety or grade from region. Use fewer than 160 words.',input:JSON.stringify(body)})});
 if(!request.ok)throw Error();
 const result=await request.json();
 const parts=result.output?.filter(x=>x.type==='message').flatMap(x=>x.content).filter(x=>x.type==='output_text')||[];
 const sources=parts.flatMap(p=>p.annotations||[]).filter(a=>a.type==='url_citation'&&/^https?:\/\//.test(a.url)).map(a=>({title:a.title,url:a.url}));
 if(!parts.length||!sources.length)throw Error();
 return json({available:true,answer:parts.map(p=>p.text).join('\n'),sources});
}
export default {async fetch(req,env){
 const u=new URL(req.url);
 try{
 if(['/api/offers','/api/videos'].includes(u.pathname)&&req.method==='GET'){
 const p=Object.fromEntries(u.searchParams);
 if(!cities.includes(p.city)||(p.hotel||'').length>120)return json({},400);
 if(u.pathname==='/api/videos')return json(env.YOUTUBE_API_KEY?{items:await videoMatches(env.YOUTUBE_API_KEY,p.city,p.hotel)}:{configured:false});
 if(!p.hotel||![p.start,p.end].every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x))||p.end<=p.start||! /^[1-6]$/.test(p.guests))return json({},400);
 return json(env.SERPAPI_KEY?{items:await offers(env.SERPAPI_KEY,p)}:{configured:false});
 }
 if(u.pathname==='/api/distances'&&req.method==='GET'){
 const city=u.searchParams.get('city'),hotel=u.searchParams.get('hotel'),places=u.searchParams.getAll('place');
 if(!cities.includes(city)||!hotel||hotel.length>120||places.length<1||places.length>5||places.some(p=>!p||p.length>100))return json({},400);
 if(env.GOOGLE_MAPS_API_KEY){try{return json({provider:"Google Maps",distances:await googleDistances(env.GOOGLE_MAPS_API_KEY,hotel,city,places)});}catch{}}
 const origin=await locate(hotel,city);if(!origin)return json({distances:[]});
 const locations=await Promise.all(places.map(async label=>({label,place:await locate(label,city).catch(()=>null)})));
 const points=locations.filter(l=>l.place);if(!points.length)return json({distances:[]});
 const coords=[origin,...points.map(l=>l.place)].map(l=>l.coords.join(',')).join(';');
 const table=await external('https://router.project-osrm.org/table/v1/driving/'+coords+'?sources=0&annotations=distance,duration');
 return json({distances:points.flatMap((p,i)=>{const m=table.distances?.[0]?.[i+1],sec=table.durations?.[0]?.[i+1];return Number.isFinite(m)&&Number.isFinite(sec)?[{label:p.label,km:(m/1000).toFixed(1),minutes:Math.round(sec/60)}]:[];})});
 }
 if(u.pathname==='/api/approach'&&req.method==='GET'){
 const city=u.searchParams.get('city'),hotel=u.searchParams.get('hotel');
 if(!cities.includes(city)||!hotel||hotel.length>120)return json({},400);
 return await approach(city,hotel);
 }
 if(u.pathname==='/api/road-news'&&req.method==='GET'){
 const city=u.searchParams.get('city'),q=u.searchParams.get('q')||'';
 if(!cities.includes(city)||q.length>120)return json({},400);
 return json({articles:await news(city,q),checked:new Date().toISOString()});
 }
 if(u.pathname==='/api/plan'&&req.method==='POST'){
 if(req.headers.get('origin')!==u.origin)return json({},403);
 if(!env.OPENAI_API_KEY)return json({configured:false});
 const raw=await req.text();if(raw.length>25000)return json({},413);
 const body=JSON.parse(raw);
 if(!cities.includes(body.city)||typeof body.message!=='string'||body.message.length>240||!Array.isArray(body.days)||body.days.length>15)return json({},400);
 const response=await providerJSON('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:env.OPENAI_MODEL||'gpt-5-mini',store:false,input:JSON.stringify(body),instructions:'Propose edits to existing unlocked travel itinerary stops matching the request. Return JSON with summary (plain text) and edits (array of objects with id, day index zero based, name, time HH:MM). Include changed stops only. Never invent reservations, availability or opening times. If request cannot be fulfilled explain why and return empty edits.',text:{format:{type:'json_object'}}})});
 const output=response.output?.flatMap(x=>x.content||[]).find(x=>x.type==='output_text');const plan=JSON.parse(output.text);
 if(typeof plan.summary!=='string'||!Array.isArray(plan.edits))throw Error();
 return json({summary:plan.summary.slice(0,1200),edits:plan.edits.slice(0,75)});
 }
 if(u.pathname==='/api/ask'&&req.method==='POST'){
 if(req.headers.get('origin')!==u.origin)return json({},403);
 const b=await req.json();
 if(!cities.includes(b.city)||!['question','hotel','dates'].every(k=>typeof b[k]==='string'&&b[k].length>0&&b[k].length<=350))return json({},400);
 return await ask({city:b.city,hotel:b.hotel,dates:b.dates,question:b.question},env);
 }
 if(!['GET','HEAD'].includes(req.method))return new Response(null,{status:405});
 const asset=assets[u.pathname==='/'?'/index.html':u.pathname];
 if(!Array.isArray(asset))return new Response('Page not found',{status:404});
 return new Response(req.method==='HEAD'?null:Uint8Array.from(atob(asset[1]),c=>c.charCodeAt(0)),{headers:{'Content-Type':asset[0],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});
 }catch{return json({error:'Source temporarily unavailable'},503);}
}};
