import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.mp4':'video/mp4'};
const server=http.createServer((req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');let name=decodeURIComponent(url.pathname);
  if(name.endsWith('/'))name+='index.html';
  const target=path.resolve(root,'.'+name);
  if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);return res.end('Not found');}
  const size=fs.statSync(target).size;const headers={'Content-Type':types[path.extname(target)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
  const range=req.headers.range;
  if(range){
   const match=/^bytes=(\d+)-(\d*)$/.exec(range);
   if(!match){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}
   const start=Number(match[1]),end=match[2]?Math.min(size-1,Number(match[2])):size-1;
   if(start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}
   res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});
   if(req.method==='HEAD')return res.end();fs.createReadStream(target,{start,end}).pipe(res);
  }else{
   res.writeHead(200,{...headers,'Content-Length':size});
   if(req.method==='HEAD')return res.end();fs.createReadStream(target).pipe(res);
  }
 }catch{res.writeHead(400);res.end('Bad request');}
});
server.listen(Number(process.env.PORT||8767),'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:'+(process.env.PORT||8767)));
