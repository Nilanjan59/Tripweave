function showArticles(panel,articles,escape,ext){
 panel.innerHTML=articles.map(a=>'<article class="row"><div>'+ext(a.url,a.title,'link')+'<small>'+escape(new Date(a.date).toLocaleDateString('en-IN'))+' · '+escape(a.publisher)+'</small></div></article>').join('');
}
export async function loadRoadNews(panel,city,{escape,ext},q=''){
 if(!panel)return;
 panel.textContent='Checking recent local reporting…';
 try{
 const response=await fetch('/api/road-news?'+new URLSearchParams({city,q}));
 if(!response.ok)throw Error();
 const data=await response.json();
 if(!data.articles.length){panel.textContent='No matching reports found in the past 21 days. Current road status is unconfirmed.';return;}
 showArticles(panel,data.articles,escape,ext);
 panel.insertAdjacentHTML('beforeend','<small>Regional headlines · checked '+escape(new Date(data.checked).toLocaleString('en-IN'))+'</small>');
 }catch{panel.textContent='Live headlines are unavailable. Open the official updates or latest road news below.';}
}
export async function askRoad(panel,context,fallback,{escape,ext}){
 panel.textContent='Looking up your question…';
 try{
 const response=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(context)});
 if(!response.ok)throw Error();
 const data=await response.json();
 if(data.available){
 panel.innerHTML='<p style="white-space:pre-line">'+escape(data.answer)+'</p>'+data.sources.map(s=>ext(s.url,s.title,'pill')).join('');return;
 }
 }catch{}
 panel.innerHTML='<p>Continue this search in ChatGPT with your hotel, dates and question already filled in.</p>'+ext(fallback,'Search with ChatGPT','button primary');
}

export async function loadApproach(panel,city,hotel){
 panel.textContent='Checking the mapped approach…';
 try{
 const r=await fetch('/api/approach?'+new URLSearchParams({city,hotel}));if(!r.ok)throw Error();
 const data=await r.json();if(!data.found)throw Error();
 const airport={Goa:'Dabolim',Jaipur:'Jaipur',Manali:'Bhuntar'}[city];
 panel.textContent='From '+airport+' airport, the mapped drive to '+data.match+' is about '+data.km+' km.'+(data.rise!==null?' Across roughly the last '+data.lastKm.toFixed(1)+' km, sampled terrain '+(data.rise<0?'drops ':'rises ')+Math.abs(data.rise)+' m overall.':'')+' The hotel driveway grade and surface are unverified. Route by OSRM / OpenStreetMap. Terrain by Open-Meteo.';
 }catch{panel.textContent='A mapped approach estimate is unavailable for this property. Use the hotel address and Google Maps route below.';}
}

const distanceCache=new Map();
export function connectDistances(root,city,places,mode){
 if(mode!=='Drive')return;
 for(const box of root.querySelectorAll('[data-distances]')){
 const params=new URLSearchParams({city,hotel:box.dataset.distances});places.forEach(p=>params.append('place',p));
 const key=params.toString();
 if(!distanceCache.has(key))distanceCache.set(key,fetch('/api/distances?'+key).then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>{distanceCache.delete(key);return {distances:[]};}));
 distanceCache.get(key).then(data=>{
 if(!box.isConnected)return;
 for(const a of box.querySelectorAll('a')){
 const label=a.textContent.replace(/ on Maps$/,'');
 const estimate=data.distances?.find(d=>d.label===label);
 if(estimate){a.textContent=label+' · '+estimate.km+' km · '+estimate.minutes+' min';a.title='Estimated drive from '+(data.provider||'OpenStreetMap / OSRM')+'. Open Google Maps for current directions.';}
 }
 });
 }
}

export async function providerPanel(el,path,params){
 if(!el)return;
 try{
 const r=await fetch('/api/'+path+'?'+new URLSearchParams(params));if(!r.ok)throw Error();
 const d=await r.json();el.replaceChildren();
 if(d.configured===false){el.textContent=path==='offers'?'Automatic provider quotes are awaiting a pricing connection.':'Live video discovery is awaiting a YouTube connection.';return;}
 if(!d.items.length){el.textContent='No matching live results returned.';return;}
 for(const item of d.items){
 const link=document.createElement('a');link.className='row link';link.target='_blank';link.rel='noopener noreferrer';link.href=item.url;link.textContent=path==='offers'?item.source+' · ₹'+item.amount.toLocaleString('en-IN')+' total including taxes':item.title+' · '+item.date.slice(0,10)+' · '+item.views.toLocaleString('en-IN')+' views';el.append(link);
 }
 }catch{el.textContent='Live provider results are temporarily unavailable.';}
}
