const updates = {
  Goa:{
    title:'North Goa diversion · 13 Nov 2026',
    description:'GSIDC announced diversions on routes through Mapusa and Siolim from 16 Nov 2026 to 29 Jan 2027. This matters if your route passes through that area.',
    source:'https://www.gsidcltd.com/featurednews/',
    official:'https://citizen.goapolice.gov.in/web/guest/traffic-cell2'
  },
  Jaipur:{official:'https://jaipurpolice.com/'},
  Manali:{
    title:'Manali traffic and highway works · 21 Nov 2026',
    description:'The Tribune reported that Kullu officials reviewed pending NHAI works and tourist-season parking. This is regional context. Current lane restrictions and the hotel’s access road need a separate check.',
    source:'https://www.tribuneindia.com/news/himachal/pending-nhai-works-infra-projects-in-manali-discussed/',
    official:'https://sdma.hp.gov.in/'
  }
};

export function roadBrief(hotel,city,profile,{escape,ext}) {
  const update=updates[city];
  const query=new URLSearchParams({q:hotel+' '+city+' approach road traffic road closure diversion',tbm:'nws'});
  const regional=city==='Manali'
    ? '<p class="minor">For context, a mapped route from near Bhuntar airport to central Manali climbs roughly 790 m overall. This is a reference drive for the area. The slope and bends at this hotel’s entrance still need confirmation.</p>'
    : '';
  return '<section class="hotel-access video-section"><h3>Recent road reports</h3><div class="compact" data-live-news role="status"></div><h4>Route context</h4>'+regional+
    (update?.source?'<article class="notice compact"><strong>'+escape(update.title)+'</strong><p>'+escape(update.description)+'</p>'+ext(update.source,'Read the source','link')+'</article>':'<p class="minor">Current restrictions on this hotel approach are unverified. Check the traffic sources below before departure.</p>')+
    '<div class="buttons compact">'+(update?ext(update.official,'Official updates'):'')+
    ext('https://www.google.com/search?'+query,'Latest road news')+'</div></section>'+
    '<section class="hotel-access video-section"><h3>Ask about this drive</h3><p class="minor">Ask about the exact hotel. Your hotel and dates are included automatically.</p>'+
    '<form class="compact" data-form="roadQuestion"><input type="hidden" name="hotel" value="'+escape(hotel)+'"><input type="hidden" name="address" value="'+escape(profile.address||'')+'">'+
    '<label>Your question<input class="input" name="question" required maxlength="350" placeholder="Is there a steep or narrow stretch near the gate?"></label>'+
    '<button type="submit" class="button primary">Search my question</button></form><div class="compact" data-road-answer aria-live="polite"></div></section>';
}

export function roadQuestionLink({hotel,address,question},city,dates) {
  const prompt='Search the web now and answer this travel question about the road approach to '+hotel+', '+city+', India'+(address?' ('+address+')':'')+'. Travel dates: '+dates+'. Question: '+question+'. Prefer recent local reporting, official traffic notices and the hotel. Cite each claim with a source and date. Clearly distinguish the main route from the final approach or parking entrance. State what remains unverified, especially for grade, width, road surface, and current closures.';
  return {prompt,url:'https://chatgpt.com/?'+new URLSearchParams({q:prompt})};
}
