export const suggestions=['Ahmedabad','Agra','Amritsar','Bengaluru','Bhuj','Chennai','Darjeeling','Delhi','Diu','Gangtok','Goa','Hyderabad','Jaipur','Jaisalmer','Jodhpur','Kochi','Kolkata','Leh','Manali','Mumbai','Munnar','Mysuru','Ooty','Pondicherry','Pune','Rishikesh','Shillong','Shimla','Somnath','Udaipur','Varanasi'];
const featured={
 Bhuj:[[23.25397,69.66928],['Aina Mahal','Prag Mahal','Kutch Museum'],['Regenta Resort Bhuj','The Fern Residency Bhuj','Hotel Prince Bhuj']],
 Ahmedabad:[[23.0225,72.5714],['Sabarmati Ashram','Adalaj Stepwell','Kankaria Lake'],['House of MG','Hyatt Regency Ahmedabad','ITC Narmada']],
 Mumbai:[[19.076,72.8777],['Gateway of India','Marine Drive','Chhatrapati Shivaji Maharaj Vastu Sangrahalaya'],['The Taj Mahal Palace','Trident Nariman Point','The Oberoi Mumbai']],
 Delhi:[[28.6139,77.209],['India Gate','Humayun’s Tomb','Qutub Minar'],['The Imperial New Delhi','The Claridges New Delhi','Shangri-La Eros New Delhi']],
 Kolkata:[[22.5726,88.3639],['Victoria Memorial','Indian Museum','Howrah Bridge'],['The Park Kolkata','ITC Royal Bengal','Taj Bengal']],
 Bengaluru:[[12.9716,77.5946],['Cubbon Park','Bangalore Palace','Lalbagh Botanical Garden'],['The Oberoi Bengaluru','Taj West End','ITC Gardenia']],
 Udaipur:[[24.5854,73.7125],['City Palace','Lake Pichola','Saheliyon Ki Bari'],['Trident Udaipur','Taj Lake Palace','The Leela Palace Udaipur']]
};
export async function discoverCity(name){
 const known=featured[name];
 if(known)return {name,centre:[...known[0]].reverse(),anchors:known[1],hotels:known[2]};
 const r=await fetch('/api/discover?'+new URLSearchParams({city:name}));
 if(!r.ok)throw Error();return r.json();
}
