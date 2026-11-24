import {readFile,writeFile,mkdir,readdir,rm,cp} from 'node:fs/promises';
import {join,extname} from 'node:path';

const assets={};
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg'};
async function collect(dir, prefix=''){
 for(const file of await readdir(dir,{withFileTypes:true})){
  const name=prefix+'/'+file.name, path=join(dir,file.name);
  if(file.isDirectory())await collect(path,name);
  else assets[name]=[types[extname(name)],(await readFile(path)).toString('base64')];
 }
}
await collect('web');
await rm('dist',{recursive:true,force:true});
await mkdir('dist/server',{recursive:true});
await mkdir('dist/.openai',{recursive:true});
await cp('.openai/hosting.json','dist/.openai/hosting.json');
await writeFile('dist/server/index.js','const assets='+JSON.stringify(assets)+';\n'+await readFile('server/providers.mjs','utf8')+'\n'+await readFile('server/worker.mjs','utf8'));
