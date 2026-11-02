const path=require('node:path');module.exports=name=>{try{return require(name)}catch{return require(path.resolve(__dirname,'../work/push-tools/node_modules',name))}};
