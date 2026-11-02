const {execFileSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
for(const name of fs.readdirSync(__dirname).filter(n=>n.endsWith('.test.cjs')).sort()){console.log('\n'+name);execFileSync(process.execPath,[path.join(__dirname,name)],{cwd:path.resolve(__dirname,'..'),stdio:'inherit'});}
