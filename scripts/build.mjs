import {mkdir,cp,rm,readdir,readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
const files=['index.html','quiz.html','quiz-data.js','quiz.js','quiz.css','onboarding.html','onboarding-theme.css','thank-you.html','privacy.html','styles.css','site.js','favicon.svg','profile.jpg','_redirects','_headers','intake-form.html'];
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const file of files){await cp(file,join('dist',file));}
await cp('media','dist/media',{recursive:true});await cp('assets','dist/assets',{recursive:true});
let total=0;async function count(dir){for(const f of await readdir(dir,{withFileTypes:true})){const p=join(dir,f.name);if(f.isDirectory())await count(p);else total+=(await stat(p)).size;}}await count('dist');
console.log(`Static website built: ${files.length} entry files, ${Math.round(total/1024)} KiB total.`);
