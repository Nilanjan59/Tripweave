async function providerJSON(url,options={}){
 const response=await fetch(url,{...options,signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error('Provider unavailable');
 const data=await response.json();if(data.error)throw Error('Provider error');return data;
}
const normalize=name=>name.toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]/g,'');
async function offers(key,params){
 const query=new URLSearchParams({engine:'google_hotels',q:params.hotel+' '+params.city+' India',check_in_date:params.start,check_out_date:params.end,adults:params.guests,currency:'INR',gl:'in',hl:'en',api_key:key});
 const search=()=>providerJSON('https://serpapi.com/search.json?'+query);
 let data=await search();
 if(!data.prices){
 const property=data.properties?.find(p=>normalize(p.name)===normalize(params.hotel));
 if(!property?.property_token)return [];
 query.set('property_token',property.property_token);data=await search();
 }
 if(!normalize(data.name||'').includes(normalize(params.hotel)))return [];
 return (data.prices||[]).map(p=>({source:p.source,url:p.link,amount:p.total_rate?.extracted_after_taxes_fees})).filter(p=>p.source&&/^https:\/\//.test(p.url)&&Number.isFinite(p.amount)&&p.amount>0).sort((a,b)=>a.amount-b.amount);
}
async function videoMatches(key,city,hotel){
 const cutoff=new Date();cutoff.setUTCMonth(cutoff.getUTCMonth()-12);
 const query=new URLSearchParams({part:'snippet',type:'video',q:(hotel||city)+' '+(hotel?city+' hotel review':'India travel vlog'),publishedAfter:cutoff.toISOString(),order:'relevance',maxResults:'20',key});
 const list=await providerJSON('https://www.googleapis.com/youtube/v3/search?'+query);
 const ids=list.items.map(x=>x.id.videoId).filter(Boolean);
 if(!ids.length)return [];
 const details=await providerJSON('https://www.googleapis.com/youtube/v3/videos?'+new URLSearchParams({part:'snippet,statistics',id:ids.join(','),key}));
 const recent=new Date();recent.setUTCMonth(recent.getUTCMonth()-6);
 return details.items.filter(x=>normalize(x.snippet.title+' '+x.snippet.description).includes(normalize(hotel||city))).map(x=>({title:x.snippet.title,url:'https://www.youtube.com/watch?v='+encodeURIComponent(x.id),date:x.snippet.publishedAt,views:Number(x.statistics.viewCount)||0})).sort((a,b)=>Number(Date.parse(b.date)>=recent)-Number(Date.parse(a.date)>=recent)||b.views-a.views).slice(0,3);
}
async function googleDistances(key,hotel,city,places){
 const response=await providerJSON('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'destinationIndex,status,condition,distanceMeters,duration'},body:JSON.stringify({origins:[{waypoint:{address:hotel+', '+city+', India'}}],destinations:places.map(p=>({waypoint:{address:p+', '+city+', India'}})),travelMode:'DRIVE'})});
 return response.filter(r=>r.condition==='ROUTE_EXISTS'&&Number.isFinite(r.distanceMeters)).map(r=>({label:places[r.destinationIndex||0],km:(r.distanceMeters/1000).toFixed(1),minutes:Math.round(parseFloat(r.duration)/60)}));
}
