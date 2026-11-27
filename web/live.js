const destinations = {
  Goa: {coordinates:[15.4909,73.8278], location:'Panaji', articles:['Fort Aguada','Fontainhas (quarter)','Calangute']},
  Jaipur: {coordinates:[26.9124,75.7873], location:'Jaipur', articles:['City Palace, Jaipur','Hawa Mahal','Amber Fort']},
  Manali: {coordinates:[32.2396,77.1887], location:'Manali', articles:['Hidimba Devi Temple','Manali, Himachal Pradesh','Solang Valley']}
};
const cache = new Map();
const dateFormat = new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',timeZone:'UTC'});
const dateLabel = date => dateFormat.format(new Date(date+'T12:00:00Z'));

function getJSON(address, params, ttl) {
  const url = new URL(address);
  url.search = new URLSearchParams(params);
  const key = url.href;
  const previous = cache.get(key);
  if (previous && previous.expires > Date.now()) return previous.request;
  const request = fetch(url,{credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(9000)})
    .then(response => {
      if (!response.ok) throw new Error('Provider unavailable');
      return response.json();
    })
    .catch(error => {
      cache.delete(key);
      throw error;
    });
  cache.set(key,{request,expires:Date.now()+ttl});
  return request;
}

function conditions(code) {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if ([45,48].includes(code)) return 'Fog';
  if ([51,53,55,56,57].includes(code)) return 'Drizzle';
  if ([61,63,65,66,67,80,81,82].includes(code)) return 'Rain or showers';
  if ([71,73,75,77,85,86].includes(code)) return 'Snow';
  if ([95,96,99].includes(code)) return 'Thunderstorms possible';
  return 'Conditions unavailable';
}

function renderWeather(host, days) {
  const heading=host.querySelector('[data-weather-status]');
  if (!days.length) {
    heading.textContent='A daily forecast is unavailable for these dates. Try again closer to departure.';
    return;
  }
  heading.textContent='Forecast for '+destinations[host.dataset.weather].location+' · '+dateLabel(days[0].date)+'–'+dateLabel(days.at(-1).date);
  const list=document.createElement('ul');
  list.className='live-weather';
  for (const day of days) {
    const entry=document.createElement('li');
    const label=document.createElement('strong');
    label.textContent=dateLabel(day.date);
    const range=Number.isFinite(day.high)&&Number.isFinite(day.low)?Math.round(day.low)+'–'+Math.round(day.high)+'°C':'Temperature unavailable';
    const rain=Number.isFinite(day.rain)?' · '+day.rain+'% rain chance':'';
    entry.append(label,document.createTextNode(conditions(day.code)+' · '+range+rain));
    list.append(entry);
  }
  heading.after(list);
  if(days[0].date>host.dataset.start||days.at(-1).date<host.dataset.end){
    const note=document.createElement('p');
    note.className='minor';
    note.textContent='Only part of this trip falls within the available forecast.';
    list.after(note);
  }
}

async function showWeather(host) {
  const {weather:city,start,end}=host.dataset;
  const {coordinates:[latitude,longitude]}=destinations[city];
  try {
    const {daily}=await getJSON('https://api.open-meteo.com/v1/forecast',{
      latitude,longitude,timezone:'Asia/Kolkata',forecast_days:16,
      daily:'weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max'
    },600_000);
    const days=daily.time.map((date,i)=>({date,code:daily.weather_code[i],low:daily.temperature_2m_min[i],
      high:daily.temperature_2m_max[i],rain:daily.precipitation_probability_max[i]})).filter(day=>day.date>=start&&day.date<=end);
    if(host.isConnected)renderWeather(host,days);
  } catch {
    if(host.isConnected)host.querySelector('[data-weather-status]').textContent='Live forecast temporarily unavailable. You can check official weather information below.';
  }
}

async function showGuides(host) {
  const {articles}=destinations[host.dataset.guides];
  const status=host.querySelector('[data-guide-status]');
  try {
    const result=await getJSON('https://en.wikipedia.org/w/api.php',{
      action:'query',format:'json',formatversion:2,prop:'extracts',exintro:1,explaintext:1,
      exchars:280,exlimit:3,redirects:1,titles:articles.join('|'),origin:'*'
    },600_000);
    if(!host.isConnected)return;
    const pages=result.query.pages.filter(page=>Number.isInteger(page.pageid)&&page.extract);
    if(!pages.length)throw new Error('No guides available');
    const list=document.createElement('ul');
    list.className='live-guides';
    for(const page of pages){
      const item=document.createElement('li');
      const link=document.createElement('a');
      link.className='link';
      link.href='https://en.wikipedia.org/?curid='+page.pageid;
      link.target='_blank';
      link.rel='noopener noreferrer';
      link.textContent=page.title;
      const snippet=document.createElement('p');
      snippet.className='minor';
      snippet.textContent=page.extract;
      item.append(link,snippet);
      list.append(item);
    }
    status.replaceWith(list);
  } catch {
    if(host.isConnected)status.textContent='Wikipedia previews are temporarily unavailable. You can still open each place in Maps.';
  }
}

export function connectLivePanels(root) {
  for(const host of root.querySelectorAll('[data-weather]'))void showWeather(host);
  for(const host of root.querySelectorAll('[data-guides]'))void showGuides(host);
}

export function registerCity(name,coordinates,articles){destinations[name]={coordinates,articles,location:name};}
