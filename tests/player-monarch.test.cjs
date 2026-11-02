const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const appearance=fs.readFileSync('js/features/appearance.js','utf8');
for(const theme of ['shadow-blue','imperial-gold','crimson-black','shadow-monarch-gold','invalid']){
const root={dataset:{},style:{setProperty(k,v){this[k]=v}}};let listener;const values=new Map();
const c={document:{documentElement:root,querySelector:()=>({setAttribute(k,v){values.set(k,v)}}),addEventListener:(e,f)=>listener=f},localStorage:{getItem:()=>JSON.stringify({theme,background:'misty-mountains',visibility:85})}};
vm.runInNewContext(appearance,c);assert.equal(root.dataset.theme,theme==='invalid'?'shadow-blue':theme);assert.equal(root.dataset.background,'misty-mountains');assert.equal(root.style['--background-visibility'],.85);
}
const html=fs.readFileSync('index.html','utf8');assert.ok(html.includes('value="shadow-monarch-gold"'));assert.ok(!html.includes('shadow-warrior-v1.webp'));assert.ok(!html.includes('holding a sword'));
const png=fs.readFileSync('assets/characters/akos-monarch-v1.webp');assert.equal(png.subarray(0,4).toString(),'RIFF');assert.equal(png.subarray(8,12).toString(),'WEBP');assert.ok(png.includes(Buffer.from('ALPH')),'Transparent character asset');
const sw=fs.readFileSync('sw.js','utf8');const assets=[...sw.matchAll(/"(\.\/[^"\n]+)"/g)].map(m=>m[1]).filter(x=>x!=='./');
for(const asset of assets)assert.ok(fs.existsSync(asset.split('?')[0]),'Missing offline asset '+asset);
console.log('PASS: optional palette restoration/fallback, independent Background Engine/visibility, weapon-free references, RGBA character and all offline files.');
