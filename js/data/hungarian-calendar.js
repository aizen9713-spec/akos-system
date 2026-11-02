/* Verified 2026-11-02. Statutory recurrence from current Mt. 102; annual transfers only when verified. */
const HungarianCalendar=(()=>{
 const law='https://net.jogtar.hu/jogszabaly?docid=a1200001.tv',schedule='https://net.jogtar.hu/jogszabaly?docid=a2500010.ngm';
 const transfers={2026:[['01-02','Substitute rest day','rest','Worked on 10 January 2026.'],['01-10','Substitute working day','work','Working day in exchange for 2 January.'],['08-08','Substitute working day','work','Working day in exchange for 21 August.'],['08-21','Substitute rest day','rest','Worked on 8 August 2026.'],['12-12','Substitute working day','work','Working day in exchange for 24 December.'],['12-24','Christmas Eve · substitute rest day','rest','Worked on 12 December 2026. Not a recurring statutory public holiday.']]};
 const cache=new Map();
 function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;return new Date(Date.UTC(y,month-1,day,12));}
 const shift=(d,n)=>new Date(d.getTime()+n*86400000).toISOString().slice(0,10);
 function year(y){if(!Number.isInteger(y)||y<2026||y>2100)return [];if(cache.has(y))return cache.get(y).map(x=>({...x}));const rows=[];
  function add(date,title,dayType,note,sourceUrl=law){rows.push(Object.freeze({date,title,kind:'holiday',source:dayType==='holiday'?'Hungarian public holiday':'Hungarian work schedule',dayType,time:'',completed:false,official:true,note,sourceUrl}));}
  for(const [md,title]of [['01-01','New Year’s Day'],['03-15','National Day · 15 March'],['05-01','Labour Day'],['08-20','State Foundation Day'],['10-23','National Day · 23 October'],['11-01','All Saints’ Day'],['12-25','Christmas Day'],['12-26','Second Day of Christmas']])add(y+'-'+md,title,'holiday','Public holiday · Labour Code, Section 102(1).');
  const e=easter(y);for(const [offset,title,sunday]of [[-2,'Good Friday',false],[0,'Easter Sunday',true],[1,'Easter Monday',false],[49,'Pentecost Sunday',true],[50,'Pentecost Monday',false]])add(shift(e,offset),title,'holiday',sunday?'Feast Sunday · Labour Code, Section 102(4) scheduling rules.':'Public holiday · Labour Code, Section 102(1).');
  for(const [md,title,type,note]of transfers[y]||[])add(y+'-'+md,title,type,note+' General work schedule; NGM Regulation 10/2025 (30 April).',schedule);
  rows.sort((a,b)=>a.date.localeCompare(b.date));cache.set(y,Object.freeze(rows));return rows.map(x=>({...x}));
 }
 function forDate(key){return /^\d{4}-\d{2}-\d{2}$/.test(key)?year(Number(key.slice(0,4))).filter(e=>e.date===key):[];}
 function coverage(y){return y<2026?'Hungarian public holiday data is not loaded for this year.':y===2026?'Hungarian public holidays and verified 2026 workday substitutions are loaded.':'Hungarian public holidays follow current rules. Verified workday substitutions are not loaded for this year.';}
 return {year,forDate,coverage,checkedAt:'2026-11-02',scheduleYears:[2026]};
})();
if(typeof module!=='undefined')module.exports=HungarianCalendar;
