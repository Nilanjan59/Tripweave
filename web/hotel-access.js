import {roadBrief} from './road-brief.js';
const profiles = {
  'The Himalayan': {
    address:'Hadimba Road, Manali',
    source:'https://thehimalayan.com/location-contacts/',
    approach:'The hotel lists Hadimba Road as its address. Ask for its vehicle entrance pin and whether the drive from Hadimba Road is uphill or downhill.'
  },
  'Span Resort & Spa': {
    address:'14 Mile, Katrain, Kullu–Manali Highway',
    source:'https://spanresorts.com/wp-content/uploads/2024/09/E-Brochure-Span-Resort-Spa.pdf',
    approach:'The hotel lists a highway address. Check with reception where to turn off and how far the entrance is from the highway.',
    videos:[['RjxHjceNlng','Most Luxurious Resort in Manali | Span Resort','Sundeep The Traveller','2026-05-20',311]]
  },
  'The Orchard Greens Resort': {
    address:'Log Huts Area, Manali',
    mapName:'The Orchard Greens Resort & Spa',
    source:'https://www.theorchardgreens.com/contact',
    approach:'The hotel lists the Log Huts Area as its location. Ask for the Resort & Spa vehicle gate before following the map pin.'
  },
  'Novotel Goa Resort & Spa': {
    address:'Pinto Waddo, off Candolim Road, Candolim',
    source:'https://all.accor.com/hotel/8861/index.en.shtml',
    approach:'The property address is off Candolim Road. Use the Pinto Waddo address to distinguish it from Novotel Goa Candolim.',
    parking:'The hotel lists an on-site car park.'
  },
  'Taj Fort Aguada Resort & Spa': {
    address:'Sinquerim, Candolim, Goa',
    approach:'The resort is in Sinquerim near Fort Aguada. Select the Taj resort pin for drop-off, where it is listed separately from the fort.',
    source:'https://www.tajhotels.com/en-in/hotels/taj-fort-aguada-goa',
    videos:[['3wKgEnNOs_g','Thinking of booking Taj Fort Aguada, Goa?','Guest review','2026-07-12',590]]
  },
  'Vivanta Goa, Panaji': {
    address:'Off Dayanand Bandodkar Road, Panaji',
    source:'https://hotelassociationofindia.com/pdf/Goa/Vivanta%20Goa%2C%20Panaji.pdf',
    approach:'The hotel is listed off Dayanand Bandodkar Road in Panaji. Use the property pin for the last turn.',
    videos:[['ZJFhJqt9d6s','Goa in Monsoon | Taj Vivanta Panjim Room Tour','Guest room tour',null,null]]
  },
  'Trident Jaipur': {
    address:'Amber Fort Road, opposite Jal Mahal, Jaipur',
    source:'https://www.tridenthotels.com/contact-us/',
    approach:'The hotel lists Amber Fort Road opposite Jal Mahal. Ask reception to confirm the exact vehicle gate.'
  }
};

function url(address, params) {
  const link=new URL(address);
  link.search=new URLSearchParams(params);
  return link.href;
}

function lookup(hotel, city) {
  const profile=profiles[hotel] || {};
  return {profile, target:[profile.mapName||hotel,profile.address||city].join(', ')};
}

export function googleDirections(hotel,city,origin,travelmode='driving') {
  const {target}=lookup(hotel,city);
  return url('https://www.google.com/maps/dir/',{api:1,destination:target,travelmode,...(origin?{origin}:{})});
}

function videoSelection(videos, now=new Date()) {
  const monthsAgo=months=> {
    const cutoff=new Date(now);
    const day=cutoff.getUTCDate();
    cutoff.setUTCDate(1);
    cutoff.setUTCMonth(cutoff.getUTCMonth()-months);
    const last=new Date(Date.UTC(cutoff.getUTCFullYear(),cutoff.getUTCMonth()+1,0)).getUTCDate();
    cutoff.setUTCDate(Math.min(day,last));
    return cutoff.toISOString().slice(0,10);
  };
  const six=monthsAgo(6);
  const twelve=monthsAgo(12);
  const rank=(a,b)=>(b[4]??-1)-(a[4]??-1)||b[3].localeCompare(a[3]);
  const dated=videos.filter(video=>video[3]>=twelve);
  return [...dated.filter(video=>video[3]>=six).sort(rank),...dated.filter(video=>video[3]<six).sort(rank)].slice(0,3);
}

const destinationClips = {
  Goa:[['A4613ufruzQ','Goa travel guide','Adventure Goa DK','2026-08-27',2893]],
  Jaipur:[['XmQfFA53VrI','Jaipur attractions, street food and markets','The Explorer Raj','2026-07-04',501]],
  Manali:[['U0ErMHOxjkc','Manali travel guide and sightseeing','MS Vlogger','2026-09-05',28205]]
};

function renderVideo([id,title,channel,date,views], {escape,ext}) {
    const details=[channel,date?new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')):'Upload date not verified',views!=null?views.toLocaleString('en-IN')+' views when indexed':null].filter(Boolean).join(' · ');
    return '<article class="hotel-video"><details><summary>'+escape(title)+'</summary><iframe loading="lazy" title="'+escape(title)+'" src="https://www.youtube-nocookie.com/embed/'+id+'" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe></details><p class="minor">'+escape(details)+'</p>'+ext('https://www.youtube.com/watch?v='+id,'Watch on YouTube','link')+'</article>';
}

export function destinationVideos(city, {escape,ext}, className='card pad') {
  const videos=videoSelection(destinationClips[city]||[]);
  const intro=videos.length?'Selected destination guides.':'Search YouTube for current destination guides.';
  return '<section class="'+className+'"><h3>Videos about '+escape(city)+'</h3><div data-video-query="" role="status"></div><p class="minor">'+intro+'</p>'+videos.map(video=>renderVideo(video,{escape,ext})).join('')+'<div class="buttons compact">'+ext(url('https://www.youtube.com/results',{search_query:city+' travel guide vlog things to do'}),'Explore '+city+' on YouTube')+ext(url('https://www.google.com/search',{q:'site:instagram.com/reel '+city+' travel guide'}),'Find destination reels')+'</div></section>';
}

export function hotelAccess(hotel,city,{escape,ext}) {
  const {profile,target}=lookup(hotel,city);
  const videos=profile.videos||[];
  const dated=videoSelection(videos);
  const undated=videos.filter(video=>!video[3]).slice(0,1);
  return '<section class="hotel-access"><h3>Driving and parking</h3><p data-approach role="status" class="notice"></p><p class="muted">'+escape(profile.approach||'Use the property pin to check the final turn. Ask reception for the vehicle entrance and parking location.')+'</p><dl><div><dt>Location</dt><dd>'+escape(profile.address||city+' · property pin')+'</dd></div><div><dt>Final slope and road width</dt><dd>Unverified. Ask the hotel about steep ramps, narrow turns, and vehicle clearance.</dd></div><div><dt>Parking</dt><dd>'+escape(profile.parking||'Unverified. Confirm the location with the hotel.')+'</dd></div></dl><div class="buttons">'+ext(url('https://www.google.com/maps/search/',{api:1,query:target}),'Hotel pin on Google Maps')+(profile.source?ext(profile.source,'Hotel source'):'')+'</div><div data-route-link role="status">'+ext(googleDirections(hotel,city),'Directions from current location','link')+'</div></section>'+roadBrief(hotel,city,profile,{escape,ext})+'<section class="hotel-access video-section"><h3>Videos of this hotel</h3><div data-video-query="'+escape(hotel)+'" role="status"></div><p class="muted">'+(dated.length?'Selected hotel videos, newest six-month window first. Older matches are included up to a year when available.':'No dated clips within the past year in our selection. Use the hotel-specific search for more.')+'</p>'+[...dated,...undated].map(video=>renderVideo(video,{escape,ext})).join('')+'<div class="buttons compact">'+ext(url('https://www.youtube.com/results',{search_query:'"'+hotel+'" '+city+' hotel review vlog entrance parking'}),'Find more on YouTube')+ext(url('https://www.google.com/search',{q:'site:instagram.com/reel "'+hotel+'" '+city}),'Find Instagram reels')+'</div></section>'+destinationVideos(city,{escape,ext},'hotel-access video-section');
}
