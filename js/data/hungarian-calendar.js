/* Verified 2026-11-02. Statutory recurrence from current Mt. 102; annual transfers only when verified. */
const HungarianCalendar=(()=>{
 const law='https://net.jogtar.hu/jogszabaly?docid=a1200001.tv',schedule='https://net.jogtar.hu/jogszabaly?docid=a2500010.ngm';
 const transfers={2026:[['01-02','Áthelyezett pihenőnap','rest','Ledolgozása: 2026. január 10.'],['01-10','Áthelyezett munkanap','work','A január 2-i pihenőnap ledolgozása.'],['08-08','Áthelyezett munkanap','work','Az augusztus 21-i pihenőnap ledolgozása.'],['08-21','Áthelyezett pihenőnap','rest','Ledolgozása: 2026. augusztus 8.'],['12-12','Áthelyezett munkanap','work','A december 24-i pihenőnap ledolgozása.'],['12-24','Szenteste · áthelyezett pihenőnap','rest','Ledolgozása: 2026. december 12. Nem állandó, törvény szerinti munkaszüneti nap.']]};
 const cache=new Map();
 function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;return new Date(Date.UTC(y,month-1,day,12));}
 const shift=(d,n)=>new Date(d.getTime()+n*86400000).toISOString().slice(0,10);
 function year(y){if(!Number.isInteger(y)||y<2026||y>2100)return [];if(cache.has(y))return cache.get(y).map(x=>({...x}));const rows=[];
  function add(date,title,dayType,note,sourceUrl=law){rows.push(Object.freeze({date,title,kind:'holiday',source:dayType==='holiday'?'Magyar ünnepnap':'Magyar munkarend',dayType,time:'',completed:false,official:true,note,sourceUrl}));}
  for(const [md,title]of [['01-01','Újév'],['03-15','Nemzeti ünnep · március 15.'],['05-01','A munka ünnepe'],['08-20','Az államalapítás ünnepe'],['10-23','Nemzeti ünnep · október 23.'],['11-01','Mindenszentek'],['12-25','Karácsony'],['12-26','Karácsony másnapja']])add(y+'-'+md,title,'holiday','Munkaszüneti nap · Mt. 102. § (1).');
  const e=easter(y);for(const [offset,title,sunday]of [[-2,'Nagypéntek',false],[0,'Húsvétvasárnap',true],[1,'Húsvéthétfő',false],[49,'Pünkösdvasárnap',true],[50,'Pünkösdhétfő',false]])add(shift(e,offset),title,'holiday',sunday?'Ünnepvasárnap · Mt. 102. § (4) szerinti beosztási szabályok.':'Munkaszüneti nap · Mt. 102. § (1).');
  for(const [md,title,type,note]of transfers[y]||[])add(y+'-'+md,title,type,note+' Általános munkarend; 10/2025. (IV. 30.) NGM rendelet.',schedule);
  rows.sort((a,b)=>a.date.localeCompare(b.date));cache.set(y,Object.freeze(rows));return rows.map(x=>({...x}));
 }
 function forDate(key){return /^\d{4}-\d{2}-\d{2}$/.test(key)?year(Number(key.slice(0,4))).filter(e=>e.date===key):[];}
 function coverage(y){return y<2026?'Ehhez az évhez nincs betöltött magyar ünnepnapi adat.':y===2026?'Magyar ünnepnapok és a 2026-os munkanap-áthelyezések betöltve.':'Magyar ünnepnapok a jelenlegi szabályok alapján. Ehhez az évhez nincs ellenőrzött munkanap-áthelyezés betöltve.';}
 return {year,forDate,coverage,checkedAt:'2026-11-02',scheduleYears:[2026]};
})();
if(typeof module!=='undefined')module.exports=HungarianCalendar;
