import {providerPanel,loadRoadNews,askRoad,loadApproach,connectDistances} from './road-live.js';
import {roadQuestionLink} from './road-brief.js';
import {hotelAccess, googleDirections, destinationVideos} from './hotel-access.js';
import {connectLivePanels} from './live.js';
const destinations = {
  Goa: {
    region:'Goa, India', image:'goa', caption:'Beaches & slow mornings', climate:'December to February is typically drier. June to September is the monsoon season.',
    anchors:['Fort Aguada','Fontainhas','Calangute Beach'],
    areas:[['Candolim','Beach days and cafés'],['Panaji','Culture and walkable lanes'],['Calangute','Nightlife and beach access']],
    hotels:[['Taj Fort Aguada Resort & Spa','Candolim',16800,[9,39,20]],['Novotel Goa Resort & Spa','Candolim',8900,[18,31,11]],['Vivanta Goa, Panaji','Panaji',7300,[35,8,37]]],
    plans:[['Fort Aguada','Fontainhas heritage walk','Calangute Beach','Panjim market','Sunset at Candolim','Goan seafood lunch'],['Candolim Beach','Poolside afternoon','Coffee in Panaji','Sunset walk','Lunch near the hotel','Beachside breakfast'],['Fontainhas heritage walk','Panjim market','Goan cooking class','Old Goa churches','Local bakery stop','Regional seafood dinner']],
    prebook:['Mandovi river cruise','Guided Fontainhas walk'], driving:'Check the vehicle entrance with the property before arrival.'
  },
  Jaipur: {
    region:'Rajasthan, India', image:'jaipur', caption:'Palaces & pink streets', climate:'Winters are typically cooler and drier. Summer afternoons can be very hot.',
    anchors:['City Palace','Hawa Mahal','Amber Fort'],
    areas:[['Old City','Heritage and bazaars'],['Bani Park','A quieter base near the centre'],['Amer','Fort views and resort stays']],
    hotels:[['Alsisar Haveli','Bani Park',6900,[14,16,39]],['Samode Haveli','Old City',15200,[8,10,24]],['Trident Jaipur','Amer',9900,[19,18,10]]],
    plans:[['Hawa Mahal','City Palace','Amber Fort','Jal Mahal viewpoint','Johari Bazaar','Albert Hall Museum'],['Lakeside walk','Coffee near the hotel','Jal Mahal viewpoint','Relaxed lunch','Johari Bazaar','Hotel garden break'],['Johari Bazaar','Rajasthani thali lunch','Block printing workshop','City Palace','Old City food walk','Handicrafts browsing']],
    prebook:['Guided Old City walk','Block printing workshop'], driving:'Check whether the hotel entrance is accessible to your vehicle during market hours.'
  },
  Manali: {
    region:'Himachal Pradesh, India', image:'manali', caption:'Mountain air & valleys', climate:'Winter is typically cold with potential snow at elevation. Check current road and weather information for your dates.',
    anchors:['Hadimba Temple','Old Manali','Solang Valley'],
    areas:[['Old Manali','Cafés and hillside lanes'],['Mall Road','Shops and a central base'],['Katrain','Highway access south of Manali']],
    hotels:[['The Himalayan','Old Manali',12000,[10,12,32]],['Span Resort & Spa','Katrain',15600,[32,37,55]],['The Orchard Greens Resort','Old Manali',6200,[7,5,26]]],
    plans:[['Hadimba Temple','Old Manali cafés','Solang Valley','Mall Road walk','Vashisht village','Riverside lunch'],['Riverside walk','Café near the hotel','Hadimba Temple','Hotel downtime','Old Manali cafés','Valley viewpoint'],['Old Manali cafés','Himachali lunch','Vashisht village','Mall Road market','Local bakery stop','Hadimba Temple']],
    prebook:['Guided Solang outing','Local nature walk'], driving:'Hillside lanes can vary by entrance. Ask the hotel for its vehicle gate pin, final slope and parking instructions.'
  }
};
const icons = {
 compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>', sparkles:'<path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2zM19 3v4m-2-2h4"/>',
 pin:'<path d="M20 10c0 5-8 11-8 11s-8-6-8-11a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2"/>', calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>', users:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v3"/>', search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>', layers:'<path d="m12 3 9 5-9 5-9-5zm-9 9 9 5 9-5M3 16l9 5 9-5"/>', map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15"/>', lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', unlock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0"/>', close:'<path d="m6 6 12 12M18 6 6 18"/>'};
const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
const formatMoney = new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0});
const icon = name => '<svg aria-hidden="true" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+icons[name]+'</svg>';
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const iso = date => date.toISOString().slice(0,10);
const shift = (s, days) => {const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return iso(d);};
const today = iso(new Date());
const labelDate = s => new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
const defaults = {city:'Goa',start:shift(today,14),end:shift(today,17),guests:'2',area:'',style:0,hotel:'',points:[],checks:{},itinerary:[],messages:[],preferences:[],votes:{},alternative:0,mode:'Drive',tab:'Itinerary'};
let saved;
try {saved=JSON.parse(localStorage.getItem('tripweave-v1')||'null');} catch {}
let state={...defaults,...saved};
let previous=null;
let pending=null;
let toastTimer;
const city = () => destinations[state.city] || destinations.Goa;
const tripKey = x => JSON.stringify([x.city,x.start,x.end,x.guests]);
let records={};
try {records=JSON.parse(localStorage.getItem('tripweave-trips')||'{}')||{};}catch{}
function archive(){
 if(state.hotel||state.itinerary.length||state.preferences.length||Object.keys(state.quotes||{}).length){
  records[tripKey(state)]=structuredClone(state);
  try{localStorage.setItem('tripweave-trips',JSON.stringify(records));}catch{}
 }
}
function selectDates(city,start,end,guests){
 const key=tripKey({city,start,end,guests});
 if(key===tripKey(state))return;
 archive();
 state=structuredClone(records[key]||{...defaults,city,start,end,guests});
 previous=null;pending=null;
}
const save = () => { try{archive();localStorage.setItem('tripweave-v1',JSON.stringify(state));}catch{} };
const money = n => formatMoney.format(n);
const nights = () => Math.max(1, Math.round((new Date(state.end)-new Date(state.start))/86400000));
const searchLink = (q) => 'https://www.google.com/search?q='+encodeURIComponent(q);
const mapsLink = (q) => 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
const ext = (href,label,cls='button') => '<a class="'+cls+'" href="'+escape(href)+'" target="_blank" rel="noopener noreferrer">'+escape(label)+'</a>';
const button = (label,action,cls='button',id='') => '<button type="button" class="'+cls+'" data-action="'+action+'" data-id="'+escape(id)+'">'+label+'</button>';
const styles=['First-time highlights','Relaxed getaway','Food and culture'];
const providerNames=['Booking.com','Agoda','MakeMyTrip'];

function searchForm() {
 return '<form class="search" data-form="search"><label>'+icon('pin')+'<span class="field">Destination<select name="city" aria-label="Destination">'+Object.keys(destinations).map(x=>'<option '+(state.city===x?'selected':'')+'>'+x+'</option>').join('')+'</select></span></label><label>'+icon('calendar')+'<span class="field">Check-in<input required name="start" aria-label="Check-in" type="date" min="'+today+'" value="'+state.start+'"></span></label><label>'+icon('calendar')+'<span class="field">Check-out<input required name="end" aria-label="Check-out" type="date" min="'+shift(state.start,1)+'" value="'+state.end+'"></span></label><label>'+icon('users')+'<span class="field">Travellers<select name="guests" aria-label="Travellers">'+[1,2,3,4,5,6].map(x=>'<option value="'+x+'" '+(String(state.guests)===String(x)?'selected':'')+'>'+x+' '+(x===1?'guest':'guests')+'</option>').join('')+'</select></span></label><button class="button primary">'+icon('search')+' Search stays</button></form>';
}
function home() {
 return '<div class="shell"><section class="hero"><span class="photo-label">'+icon('pin')+' Goa, India</span><span class="tag">'+icon('sparkles')+' Your smart travel companion</span><h1>Better trips.<br><em>Less guesswork.</em></h1><p>Compare stays, find better dates, and build a trip that fits your plans. Book on the travel platform you choose.</p>'+searchForm()+'<div class="popular"><strong>Popular right now</strong>'+Object.keys(destinations).map(x=>button(x,'destination','',x)).join('')+'</div></section><div class="homebody"><section><div class="section-head"><div><h2>Where to next?</h2><p>Compare stays in Goa, Jaipur, and Manali.</p></div><a class="link" href="#stays">Compare stays</a></div><div class="destinations">'+Object.entries(destinations).map(([name,d])=>'<button class="dest-card" style="background-image:url(assets/'+d.image+'.jpg)" data-action="destination" data-id="'+name+'"><strong>'+name+'</strong><small>'+d.caption+'</small></button>').join('')+'</div></section><aside class="planner-panel"><span class="stamp">'+icon('sparkles')+'</span><h2>Already booked a stay?</h2><p>Bring your reservation into TripWeave and start planning around it.</p><div class="example">“Keep dinner, but make Saturday slower.”</div>'+button('Import a booking','import','button primary')+'</aside></div><section class="home-feature"><div class="feature-grid">'+[['layers','Compare the whole trip','See how different dates and locations change your options.'],['map','Know before you go','Compare landmark distances and check the hotel approach.'],['sparkles','Make the itinerary yours','Pick a trip style, then adjust the plan in conversation.']].map(([i,h,p])=>'<article class="card"><span class="stamp">'+icon(i)+'</span><div><h3>'+h+'</h3><p>'+p+'</p></div></article>').join('')+'</div></section></div>';
}
function providerLink(p,hotel) {
 const query=encodeURIComponent(hotel+' '+state.city);
 if(p===0) return 'https://www.booking.com/searchresults.html?ss='+query+'&checkin='+state.start+'&checkout='+state.end+'&group_adults='+state.guests;
 if(p===1) return 'https://www.agoda.com/search?textToSearch='+query+'&checkIn='+state.start+'&checkOut='+state.end+'&adults='+state.guests;
 return searchLink('site:makemytrip.com/hotels '+hotel+' '+state.city);
}
function bestQuote(name){
 const values=Object.values(state.quotes?.[name]||{}).map(q=>q.amount);
 return values.length?Math.min(...values):Infinity;
}
function showRates(name){
 const quotes=state.quotes?.[name]||{};
 openModal(name,'<h3>Live offers for your dates</h3><div data-offers role="status">Checking offers…</div><p class="muted">Open a provider for availability, then save the total for the same room, guests and cancellation terms, including taxes. Compare amounts in INR.</p>'+providerNames.map((provider,i)=>{
 const item=quotes[i];
 return '<section class="quote-row"><div class="row"><strong>'+provider+'</strong>'+ext(providerLink(i,name),'Check provider')+'</div><form class="inline" data-form="quote"><input type="hidden" name="hotel" value="'+escape(name)+'"><input type="hidden" name="provider" value="'+i+'"><label>Full stay total (₹)<input class="input" name="amount" type="number" min="1" max="99999999" step="1" required value="'+(item?.amount||'')+'"></label><button class="button">Save total</button></form>'+(item?'<small>Saved '+escape(new Date(item.at).toLocaleString('en-IN'))+'</small>':'')+'</section>';
 }).join('')+button('Save hotel to trip','saveHotel','button primary',name));
 providerPanel(modal.querySelector('[data-offers]'),'offers',{city:state.city,hotel:name,start:state.start,end:state.end,guests:state.guests});
}
function weatherPanel(){
 return '<section class="card pad" data-weather="'+state.city+'" data-start="'+state.start+'" data-end="'+state.end+'"><h3>Weather on your dates</h3><p class="minor" data-weather-status role="status">Checking the forecast…</p><div class="buttons compact">'+ext('https://open-meteo.com/','Forecast by Open-Meteo','link')+ext('https://mausam.imd.gov.in/','Official IMD alerts','link')+'</div></section>';
}
function results() {
 const d=city();
 const all=d.hotels.filter(h=>!state.area || h[1]===state.area).sort((a,b)=>bestQuote(a[0])-bestQuote(b[0])||a[0].localeCompare(b[0]));
 const modes=['Drive','Walk'];
 const directions=(hotel,place)=>'https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(hotel+' '+state.city)+'&destination='+encodeURIComponent(place)+'&travelmode='+(state.mode==='Walk'?'walking':'driving');
 const detail=all.map(h=>'<article class="card stay"><img class="stay-image" src="assets/'+(state.city==='Goa'?'pool':d.image)+'.jpg" alt=""><div class="stay-body"><div class="stay-info"><div><h3>'+escape(h[0])+'</h3><p class="minor">'+h[1]+' · '+d.region+'</p></div><div class="rate">'+(Number.isFinite(bestQuote(h[0]))?money(bestQuote(h[0]))+'<small>Lowest saved total</small>':'<small>Check live rates</small>')+'</div></div><div class="ticks" data-distances="'+escape(h[0])+'">'+d.anchors.map(p=>ext(directions(h[0],p+' '+state.city),p+' on Maps','pill')).join('')+state.points.map(p=>ext('https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(h[0]+' '+state.city)+'&destination='+encodeURIComponent(p)+'&travelmode='+(state.mode==='Walk'?'walking':'driving'),p+' on Maps','pill')).join('')+'</div><div class="buttons">'+button('Compare rates','rates','button primary',h[0])+button('Road & videos','road','button',h[0])+button('Save to trip','saveHotel','button',h[0])+'</div></div></article>').join('');
 return '<div class="shell"><div class="head"><div><span class="tag">'+icon('pin')+' '+d.region+'</span><h1>Find your stay in '+state.city+'</h1><p>'+labelDate(state.start)+' – '+labelDate(state.end)+' · '+nights()+' nights · '+state.guests+' guest'+(state.guests==='1'?'':'s')+'</p></div>'+button('Import a booking','import')+'</div><div class="small-search">'+searchForm()+'</div><div class="alternates">'+[['Your search','Keep your dates'],['Shift a day','Compare a one-day shift'],['More holiday time','Reserve an extra morning']].map(([a,b],i)=>button('<strong>'+a+'</strong><span>'+b+'</span>','alternate','alternate '+(state.alternative===i?'selected':''),i)).join('')+'</div><div class="results"><section class="stack"><div class="notice">Compare provider offers for your dates. Stays with saved totals appear first, lowest total first.</div><div class="card pad"><h3>Compare by location</h3><p class="minor">Three landmarks are included. Add up to two places. Driving estimates appear for matched places. Open any place in Google Maps for the current route.</p><form class="inline compact" data-form="point"><input class="input" name="point" aria-label="Custom place" placeholder="Add a venue, address or station" maxlength="80" '+(state.points.length>=2?'disabled':'')+'><button class="button" '+(state.points.length>=2?'disabled':'')+'>Add place</button></form><div class="locations">'+modes.map(x=>button(x,'mode','pill '+(state.mode===x?'selected':''),x)).join('')+state.points.map((p,i)=>button(escape(p)+' ×','removePoint','pill',i)).join('')+'</div></div>'+(detail||'<div class="card empty">No listed stays in this area. Select All areas to see other options.</div>')+'</section><aside class="stack"><div class="card pad"><span class="tag">'+icon('compass')+' Know before you book</span><h2 class="compact">'+state.city+' at a glance</h2><p class="muted">'+d.climate+'</p><p class="minor">Season and forecast depend on your dates. Check current warnings and openings before booking.</p><div class="buttons compact">'+ext('https://mausam.imd.gov.in/','Weather alerts')+ext(searchLink(state.city+' tourism attraction closures '+labelDate(state.start)),'Check openings')+'</div></div><div class="card pad"><h3>Where to stay</h3><div class="locations">'+button('All areas','area','pill '+(!state.area?'selected':''))+d.areas.map(a=>button(a[0]+' · '+a[1],'area','pill '+(state.area===a[0]?'selected':''),a[0])).join('')+'</div></div><div class="card pad"><h3>Things to do</h3><ul class="list">'+d.anchors.map(p=>'<li>'+icon('pin')+ext(mapsLink(p+' '+state.city),p,'link')+'</li>').join('')+'</ul><div class="compact" data-guides="'+state.city+'"><h4>Wikipedia previews</h4><p class="minor" data-guide-status role="status">Loading attraction previews…</p></div></div>'+weatherPanel()+destinationVideos(state.city,{escape,ext})+'</aside></div></div>';
}
function generate(style=state.style, keep=[]) {
 const length= Math.min(nights()+1,15);
 const options=city().plans[style] || city().plans[0];
 return Array.from({length},(_,i)=>{
  const events=i===0?[['15:00','Check in'+(state.hotel?' at '+state.hotel:' at your stay')],['17:30',options[0]]]:i===length-1?[['09:00',options[4]],['11:00','Check out and onward travel']]:[['09:30',options[(i*2-1)%options.length]],['12:30','Lunch and a break'],['16:00',options[(i*2)%options.length]]];
  const rows=events.map(([time,name],j)=>({id:i+'-'+j,time,name,locked:false}));
  for(const item of keep.filter(e=>e.day===i)){
   const match=rows.findIndex(e=>e.id===item.id);const {day,...event}=item;
   if(match<0)rows.push(event);else rows[match]=event;
  }
  return {date:shift(state.start,i),events:rows.sort((a,b)=>a.time.localeCompare(b.time))};
 });
}
function currentItinerary(){if(!state.itinerary.length)state.itinerary=generate();return state.itinerary;}
function issues() {
 const days=currentItinerary();
 const conflicts=[];
 for(const day of days){
  for(let i=1;i<day.events.length;i++){
   const mins=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
   if(mins(day.events[i].time)-mins(day.events[i-1].time)<75)conflicts.push(labelDate(day.date)+': '+day.events[i-1].name+' and '+day.events[i].name+' are less than 75 minutes apart. Check transfer time.');
  }
 }
 return conflicts;
}
function checklist() {
 const items=[['transfer','Arrange arrival transport','Local cabs and hotel transfers',mapsLink('airport taxi near '+(state.hotel||state.city))],['rental','Find local bike or scooter rentals','Check vehicle availability and pickup',mapsLink('bike scooter rental near '+(state.hotel||state.city))],...city().prebook.map((name,i)=>['book'+i,'Check advance booking · '+name,'Review booking dates with the operator',searchLink(state.city+' '+name+' official booking')])];
 return '<section class="card pad"><h2>What to book next</h2><p class="muted">Use this checklist to arrange transport, rentals and activity reservations for your dates.</p>'+items.map(([key,name,note,url])=>'<div class="row"><label><input type="checkbox" data-check="'+key+'" '+(state.checks[key]?'checked':'')+'><span><strong>'+escape(name)+'</strong><small>'+note+'</small></span></label>'+ext(url,'Look up')+'</div>').join('')+'</section>';
}
function group() {
 return '<div class="stack"><section class="card pad"><h2>Group preferences</h2><p class="muted">Collect priorities and bring them into the trip discussion.</p><form class="inline compact" data-form="preference"><input class="input" name="preference" maxlength="140" required aria-label="Preference" placeholder="e.g. No early mornings"><button class="button primary">Add</button></form>'+state.preferences.map(p=>'<div class="row">'+escape(p)+'</div>').join('')+'</section><section class="card pad"><h2>Vote for a trip style</h2>'+styles.map((s,i)=>'<div class="row"><strong>'+s+'</strong>'+button('Vote · '+(state.votes[i]||0),'vote','button',i)+'</div>').join('')+button('Copy trip snapshot','share','button primary')+'<p class="minor compact">A snapshot carries destination, dates and style. Votes and preferences are local to this browser.</p></section></div>';
}
function planPane(){
 return '<div class="stack"><section class="card pad"><h2>Trip style</h2><div class="pills">'+styles.map((s,i)=>button(s,'style','pill '+(state.style===i?'selected':''),i)).join('')+'</div></section>'+currentItinerary().map((day,i)=>'<article class="card day"><h3>Day '+(i+1)+' · '+labelDate(day.date)+'</h3>'+button('Add stop','newEvent','pill',i)+day.events.map(ev=>'<div class="event"><time>'+ev.time+'</time><span>'+escape(ev.name)+'</span><div class="buttons">'+button('Edit','editEvent','button',i+'|'+ev.id)+button('<span class="screen-reader">'+(ev.locked?'Unlock':'Lock')+'</span>'+icon(ev.locked?'lock':'unlock'),'lock','button iconbtn '+(ev.locked?'locked':''),i+'|'+ev.id)+'</div></div>').join('')+'</article>').join('')+'</div>';
}
function chatPane(){
 return '<aside class="card chat"><div class="chat-head"><span class="tag">'+icon('sparkles')+' Trip companion</span><h2 class="compact">Make it your kind of trip</h2><p class="minor">Preview suggested changes before applying them.</p></div><div class="messages"><div class="message">I can make a day more relaxed, change your trip style, or move an activity. Lock anything you want to keep.</div>'+state.messages.slice(-12).map(({role,text})=>'<div class="message '+(role==='user'?'user':'')+'">'+escape(text)+'</div>').join('')+(pending?'<div class="buttons">'+button('Apply changes','apply','button primary')+button('Discard','discard')+'</div>':'')+'</div><div class="chat-footer"><div class="pills">'+['Make day 2 more relaxed','Switch to food and culture'].map(x=>button(x,'suggest','pill',x)).join('')+(previous?button('Undo last change','undo','pill'):'')+'</div><form class="chat-form" data-form="chat"><input name="message" required aria-label="Message trip companion" placeholder="Move Fort Aguada to day 2" maxlength="240"><button class="button primary">Send</button></form></div></aside>';
}
function trip(){
 const tabs=['Itinerary','Book next','Trip checks','Group'];
 const flags=issues();
 return '<div class="shell"><div class="head"><div><span class="tag">'+icon('compass')+' Trip workspace</span><h1>'+state.city+' trip</h1><p>'+labelDate(state.start)+' – '+labelDate(state.end)+' · '+nights()+' nights'+(state.hotel?' · '+escape(state.hotel):' · Hotel to be confirmed')+'</p></div><div class="buttons">'+button('Import a booking','import')+button('Saved trips','savedTrips')+button('Download itinerary','download','button primary')+'</div></div><div class="tabs" aria-label="Trip sections">'+tabs.map(t=>button(t,'tab',state.tab===t?'selected':'',t)).join('')+'</div><div class="workspace">'+(state.tab==='Book next'?checklist():state.tab==='Group'?group():state.tab==='Trip checks'?'<div class="stack"><section class="card pad"><h2>Trip checks</h2><p class="muted">Spacing checks flag tight transitions in your itinerary.</p><ul class="list">'+(flags.length?flags.map(f=>'<li>'+escape(f)+'</li>').join(''):'<li><span class="check">✓</span> No tight transitions in the current plan.</li>')+'</ul><div class="buttons compact">'+ext('https://mausam.imd.gov.in/','Check weather alerts')+ext(searchLink(state.city+' attraction closures official'),'Check openings')+'</div></section>'+weatherPanel()+'</div>':planPane())+chatPane()+'</div></div>';
}
function render(){
 const page=['stays','trip'].includes(location.hash.slice(1))?location.hash.slice(1):'explore';
 app.innerHTML=page==='trip'?trip():page==='stays'?results():home();
 connectLivePanels(app);for(const panel of app.querySelectorAll('[data-video-query]'))providerPanel(panel,'videos',{city:state.city,hotel:panel.dataset.videoQuery});
 if(page==='stays')connectDistances(app,state.city,[...city().anchors,...state.points],state.mode);
 document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===page);if(a.dataset.nav===page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);});
 const messages=app.querySelector('.messages');if(messages)messages.scrollTop=messages.scrollHeight;
 save();
}
function go(page){if(location.hash==='#'+page)render();else location.hash=page;window.scrollTo({top:0});}
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400);}
function openModal(title,body){modal.innerHTML='<div class="dialog-content"><div class="modal-head"><h2>'+escape(title)+'</h2>'+button('<span class="screen-reader">Close</span>'+icon('close'),'close','button iconbtn')+'</div>'+body+'</div>';if(!modal.open)modal.showModal();}
function property(name){return city().hotels.find(h=>h[0]===name);}
function importForm(data={}){
 openModal(data.review?'Review extracted booking':'Import a hotel booking','<form data-form="'+(data.review?'confirmImport':'extract')+'">'+(data.review?'':'<p class="muted">Paste the confirmation or fill the details below. Your saved trips stay in this browser.</p><textarea class="input" name="confirmation" aria-label="Booking confirmation" placeholder="Hotel: …\nCheck-in: YYYY-MM-DD\nCheck-out: YYYY-MM-DD"></textarea>')+'<label>Hotel name<input class="input" name="hotel" '+(data.review?'required':'')+' value="'+escape(data.hotel||'')+'"></label><label>Destination<select class="input" name="city">'+Object.keys(destinations).map(x=>'<option '+((data.city||state.city)===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label><label>Check-in<input class="input" type="date" name="start" value="'+escape(data.start||'')+'"></label><label>Check-out<input class="input" type="date" name="end" value="'+escape(data.end||'')+'"></label><button class="button primary">'+(data.review?'Save booking':'Review booking')+'</button></form>');
}
let planRequest=0;
async function revise(message){
 const request=++planRequest,days=structuredClone(currentItinerary()),key=tripKey(state);
 const before=JSON.stringify(days);
 toast('Preparing itinerary changes…');
 try{
 const r=await fetch('/api/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({city:state.city,message,days,preferences:state.preferences})});
 if(!r.ok)throw Error();
 const result=await r.json();
 if(request!==planRequest||tripKey(state)!==key||JSON.stringify(state.itinerary)!==before)return;
 if(Array.isArray(result.edits)){
 const changes=[];
 for(const edit of result.edits){
 const src=days.find(d=>d.events.some(ev=>ev.id===edit.id));const event=src?.events.find(ev=>ev.id===edit.id);
 if(!event||event.locked||!Number.isInteger(edit.day)||!days[edit.day]||!/^([01]\d|2[0-3]):[0-5]\d$/.test(edit.time)||typeof edit.name!=='string'||!edit.name.trim())continue;
 src.events=src.events.filter(ev=>ev!==event);event.name=edit.name.slice(0,120);event.time=edit.time;days[edit.day].events.push(event);changes.push('Day '+(edit.day+1)+' · '+event.time+' '+event.name);
 }
 days.forEach(d=>d.events.sort((a,b)=>a.time.localeCompare(b.time)));pending=changes.length?{itinerary:days}:null;
 state.messages.push({role:'user',text:message},{role:'assistant',text:changes.length?changes.join(' / '):result.summary});render();return;
 }
 }catch{}
 if(request!==planRequest||tripKey(state)!==key||JSON.stringify(state.itinerary)!==before)return;
 guidedRevision(message);
}
function guidedRevision(message){
 const q=message.toLowerCase();
 const draft=structuredClone(currentItinerary());
 const dayMatch=q.match(/day\s+(\d+)/);
 const weekdays=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
 const weekday=weekdays.find(x=>q.includes(x));
 const index=dayMatch?Number(dayMatch[1])-1:weekday?draft.findIndex(x=>new Date(x.date+'T12:00:00Z').getUTCDay()===weekdays.indexOf(weekday)):Math.min(1,draft.length-1);
 const day=draft[index];
 let data=null;
 let reply='Try “Make day 2 more relaxed”, “Switch to food and culture”, or “Move Fort Aguada to day 2”. You can edit any activity directly from the itinerary.';
 if (q.includes('switch') || q.includes('whole trip')) {
  const next=q.includes('food')||q.includes('culture')?2:q.includes('relax')?1:q.includes('highlight')?0:null;
  if(next!==null){const locked=draft.flatMap((d,i)=>d.events.filter(e=>e.locked).map(e=>({...e,day:i})));data={itinerary:generate(next,locked),style:next};reply='Switch the whole trip to '+styles[next]+' and keep your locked activities.';}
 } else if(q.includes('move') && day) {
  const name=q.match(/move\s+(.+?)\s+to\s+/)?.[1];
  const src=draft.find(d=>d.events.some(e=>name&&e.name.toLowerCase().includes(name)));
  const event=src?.events.find(e=>name&&e.name.toLowerCase().includes(name));
  if(event?.locked)reply=event.name+' is locked. Unlock it first to move it.';
  else if(event){src.events=src.events.filter(e=>e.id!==event.id);const newTime=q.match(/\b(\d{1,2}):(\d{2})\b/);day.events.push({...event,id:'m'+Date.now(),time:newTime?newTime[1].padStart(2,'0')+':'+newTime[2]:q.includes('morning')?'10:30':event.time});day.events.sort((a,b)=>a.time.localeCompare(b.time));data={itinerary:draft};reply='Move '+event.name+' to day '+(index+1)+' ('+labelDate(day.date)+').';}
  else reply='I couldn’t match that activity. Try its name as shown in the itinerary.';
 } else if(q.match(/relax|slow|lighter/) && day){
  const flex=day.events.find(e=>!e.locked && !/check|onward/i.test(e.name));
  if(flex){flex.name='Free time near '+(state.hotel||'your hotel');flex.time=q.includes('late')?'17:00':flex.time;day.events.sort((a,b)=>a.time.localeCompare(b.time));data={itinerary:draft};reply='Make day '+(index+1)+' lighter by adding free time near your hotel. Your locked activities will stay in place.';}
  else reply='There are no flexible activities on that day. Unlock an activity first or pick another day.';
 }
 pending=data;
 state.messages.push({role:'user',text:message},{role:'assistant',text:reply});render();
}
function setCity(name){
 if(Object.hasOwn(destinations,name)&&state.city!==name){Object.assign(state,{city:name,hotel:'',area:'',points:[],checks:{},itinerary:[],messages:[],alternative:0});pending=null;previous=null;}
}
function copyShare(){
 const url=new URL(location.href);
 url.hash='trip';
 url.search=new URLSearchParams({city:state.city,start:state.start,end:state.end,style:String(state.style)});
 Promise.resolve(navigator.clipboard?.writeText(url.href)).then(()=>{if(navigator.clipboard)toast('Trip snapshot copied');else openModal('Trip snapshot','<input class="input" readonly value="'+escape(url.href)+'">');}).catch(()=>openModal('Trip snapshot','<input class="input" readonly value="'+escape(url.href)+'">'));
}
document.addEventListener('click',e=>{
 const target=e.target.closest('[data-action]');if(!target)return;
 const {action,id}=target.dataset;
 if(action==='destination'){selectDates(id,state.start,state.end,state.guests);go('stays');}
 if(action==='planner'){state.tab='Itinerary';go('trip');}
 if(action==='close')modal.close();
 if(action==='import')importForm();
 if(action==='alternate'){
  const old=state.alternative,i=Number(id);
  const offsets=[0,1,0], extras=[0,0,1];
  const start=shift(state.start,offsets[i]-offsets[old]),end=shift(state.end,offsets[i]-offsets[old]+extras[i]-extras[old]);
  if((new Date(end)-new Date(start))/86400000>14){toast('Choose a stay of up to 14 nights');return;}
  selectDates(state.city,start,end,state.guests);state.alternative=i;render();
 }
 if(action==='area'){state.area=id;render();}
 if(action==='mode'){state.mode=id;render();}
 if(action==='removePoint'){state.points.splice(Number(id),1);render();}
 if(action==='saveHotel'){for(const d of state.itinerary)for(const ev of d.events)if(!ev.locked&&ev.name.startsWith('Check in at '))ev.name='Check in at '+id;state.hotel=id;state.tab='Itinerary';go('trip');toast('Hotel saved to your trip');}
 if(action==='rates'){
  const h=property(id);if(!h)return;
  showRates(id);
 }
 if(action==='saveHotel'&&modal.open)modal.close();
 if(action==='road' && property(id)){
  openModal('Driving & videos · '+id,hotelAccess(id,state.city,{escape,ext}));for(const panel of modal.querySelectorAll('[data-video-query]'))providerPanel(panel,'videos',{city:state.city,hotel:panel.dataset.videoQuery});loadApproach(modal.querySelector('[data-approach]'),state.city,id);loadRoadNews(modal.querySelector('[data-live-news]'),state.city,{escape,ext});
 }
 if(action==='style'){const locked=currentItinerary().flatMap((d,i)=>d.events.filter(ev=>ev.locked).map(ev=>({...ev,day:i})));previous={itinerary:structuredClone(state.itinerary),style:state.style};state.style=Number(id);state.itinerary=generate(state.style,locked);pending=null;render();}
 if(action==='tab'){state.tab=id;render();}
 if(action==='lock'||action==='editEvent'){
  const [i,eventId]=id.split('|');const ev=state.itinerary[i]?.events.find(item=>item.id===eventId);if(!ev)return;
  if(action==='lock'){ev.locked=!ev.locked;pending=null;render();}
  else if(ev.locked)toast('Unlock this activity before editing');
  else openModal('Edit activity','<form data-form="editEvent"><input type="hidden" name="id" value="'+escape(id)+'"><label>Activity<input class="input" name="name" value="'+escape(ev.name)+'" required maxlength="120"></label><label>Time<input class="input" type="time" name="time" value="'+ev.time+'" required></label><button class="button primary">Save activity</button>'+button('Remove stop','removeEvent','button',id)+'</form>');
 }
 if(action==='savedTrips'){
  archive();openModal('Saved trips',Object.entries(records).sort((a,b)=>a[1].start.localeCompare(b[1].start)).map(([key,t])=>'<div class="row"><div><strong>'+escape(t.city)+'</strong><small>'+escape(t.start)+' – '+escape(t.end)+' · '+escape(t.hotel||'Stay undecided')+' · '+escape(t.guests)+' guests</small></div>'+button('Open','openTrip','button',key)+'</div>').join(''));
 }
 if(action==='openTrip'&&records[id]){state=structuredClone(records[id]);previous=null;pending=null;modal.close();go('trip');}
 if(action==='download'){
 const lines=[state.city+' · '+state.start+' to '+state.end,(state.hotel||'Stay undecided')+' · '+state.guests+' guests','',...currentItinerary().flatMap(d=>[d.date,...d.events.map(ev=>ev.time+'  '+ev.name),''])];
 const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='TripWeave-'+state.city+'-'+state.start+'.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
 }
 if(action==='newEvent')openModal('Add a stop','<form data-form="newEvent"><input type="hidden" name="day" value="'+escape(id)+'"><label>Activity<input class="input" name="name" maxlength="120" required></label><label>Time<input class="input" name="time" type="time" value="14:00" required></label><button class="button primary">Add to itinerary</button></form>');
 if(action==='removeEvent'){
 const [i,eid]=id.split('|'),day=state.itinerary[i];if(day?.events.some(ev=>ev.id===eid&&!ev.locked)){previous={itinerary:structuredClone(state.itinerary),style:state.style};day.events=day.events.filter(ev=>ev.id!==eid);pending=null;modal.close();render();toast('Stop removed');}
 }
 if(action==='suggest')revise(id);
 if(action==='apply'&&pending){previous={itinerary:structuredClone(state.itinerary),style:state.style};Object.assign(state,pending);pending=null;render();toast('Itinerary updated');}
 if(action==='discard'){pending=null;render();}
 if(action==='undo'&&previous){Object.assign(state,previous);previous=null;pending=null;render();toast('Change undone');}
 if(action==='vote'){state.votes[id]=(state.votes[id]||0)+1;render();toast('Vote added');}
 if(action==='share')copyShare();
});
document.addEventListener('submit',e=>{
 const form=e.target;if(!form.dataset.form)return;e.preventDefault();
 const f=Object.fromEntries(new FormData(form));
 if(form.dataset.form==='quote'&&property(f.hotel)&&['0','1','2'].includes(f.provider)){
 const amount=Number(f.amount);if(Number.isInteger(amount)&&amount>0&&amount<1e8){
 state.quotes??={};state.quotes[f.hotel]??={};state.quotes[f.hotel][f.provider]={amount,at:new Date().toISOString()};render();showRates(f.hotel);toast('Provider total saved');}return;
 }
 if(form.dataset.form==='newEvent'&&f.name.trim()&&state.itinerary[f.day]){
 previous={itinerary:structuredClone(state.itinerary),style:state.style};const day=state.itinerary[f.day];day.events.push({name:f.name.trim(),time:f.time,id:crypto.randomUUID(),locked:false});day.events.sort((a,b)=>a.time.localeCompare(b.time));pending=null;modal.close();render();return;
 }
 if(form.dataset.form==='roadQuestion'&&property(f.hotel)&&f.question.trim()){
  const {prompt,url}=roadQuestionLink({...f,question:f.question.trim()},state.city,state.start+' to '+state.end);
  askRoad(modal.querySelector('[data-road-answer]'),{hotel:f.hotel,city:state.city,dates:state.start+' to '+state.end,question:f.question.trim()},url,{escape,ext});
  return;
 }
 if(form.dataset.form==='hotelRoute'&&property(f.hotel)){
  const href=googleDirections(f.hotel,state.city,f.origin.trim());
  const label=f.origin.trim()?'Open route from '+f.origin.trim():'Directions from current location';
  modal.querySelector('[data-route-link]').innerHTML=ext(href,label,'link');
 }
 if(form.dataset.form==='search'){
  if(f.end<=f.start){toast('Check-out must follow check-in');return;}
  if(new Date(f.end)-new Date(f.start)>14*86400000){toast('Choose a stay of up to 14 nights');return;}
  selectDates(f.city,f.start,f.end,f.guests);state.alternative=0;go('stays');
 }
 if(form.dataset.form==='point'&&f.point?.trim()&&state.points.length<2){if(!state.points.includes(f.point.trim()))state.points.push(f.point.trim());render();}
 if(form.dataset.form==='preference'&&f.preference.trim()){state.preferences.push(f.preference.trim());render();}
 if(form.dataset.form==='chat'&&f.message.trim())revise(f.message.trim());
 if(form.dataset.form==='extract'){
  const raw=f.confirmation||'';
  const ds=raw.match(/\b\d{4}-\d{2}-\d{2}\b/g)||[];
  const hotel=f.hotel.trim()||raw.match(/(?:hotel|property|accommodation)\s*:\s*([^\n\r]+)/i)?.[1]?.trim()||'';
  const name=Object.keys(destinations).find(x=>new RegExp('\\b'+x+'\\b','i').test(raw))||f.city;
  importForm({review:true,hotel,city:name,start:f.start||ds[0]||state.start,end:f.end||ds[1]||state.end});
 }
 if(form.dataset.form==='confirmImport'){
  if(!f.start||!f.end||f.end<=f.start){toast('Enter valid check-in and check-out dates');return;}
  if(new Date(f.end)-new Date(f.start)>14*86400000){toast('Choose a stay of up to 14 nights');return;}
  selectDates(f.city,f.start,f.end,state.guests);state.hotel=f.hotel.trim();for(const d of state.itinerary)for(const ev of d.events)if(!ev.locked&&ev.name.startsWith('Check in at '))ev.name='Check in at '+state.hotel;state.tab='Itinerary';pending=null;previous=null;modal.close();go('trip');toast('Booking added');
 }
 if(form.dataset.form==='editEvent'){
  const [i,eventId]=f.id.split('|');const day=state.itinerary[i];const ev=day?.events.find(item=>item.id===eventId);
  if(ev&&!ev.locked&&f.name.trim()){previous={itinerary:structuredClone(state.itinerary),style:state.style};ev.name=f.name.trim();ev.time=f.time;day.events.sort((a,b)=>a.time.localeCompare(b.time));pending=null;modal.close();render();}
 }
});
document.addEventListener('change',e=>{
 const t=e.target;
 if(t.dataset.check){state.checks[t.dataset.check]=t.checked;save();}
 if(t.name==='start'&&t.form?.dataset.form==='search'&&t.value){t.form.elements.end.min=shift(t.value,1);if(t.form.elements.end.value<=t.value)t.form.elements.end.value=shift(t.value,3);}
});
window.addEventListener('hashchange',render);
const shared=new URLSearchParams(location.search);
if(Object.hasOwn(destinations,shared.get('city'))&&/^\d{4}-\d{2}-\d{2}$/.test(shared.get('start')||'')&&/^\d{4}-\d{2}-\d{2}$/.test(shared.get('end')||'')&&shared.get('end')>shared.get('start')&&!Number.isNaN(Date.parse(shared.get('start')))&&!Number.isNaN(Date.parse(shared.get('end')))){
 selectDates(shared.get('city'),shared.get('start'),shared.get('end'),state.guests);
 Object.assign(state,{start:shared.get('start'),end:shared.get('end'),style:Math.min(2,Math.max(0,Math.trunc(Number(shared.get('style'))||0))),tab:'Itinerary'});
 history.replaceState(null,'',location.pathname+'#trip');
}
render();
