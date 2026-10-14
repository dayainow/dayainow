import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const assets = new Map([['/', ['dist/index.html','text/html']],['/index.html',['dist/index.html','text/html']],['/style.css',['dist/style.css','text/css']],['/app.js',['dist/app.js','text/javascript']],['/core.mjs',['dist/core.mjs','text/javascript']],['/portable.html',['portable/inquiry-desk.html','text/html']]]);
const port=Number(process.env.PORT||8765);
createServer(async(req,res)=>{
 const asset=assets.get(new URL(req.url,'http://localhost').pathname);
 if(!asset||!['GET','HEAD'].includes(req.method)){res.writeHead(404);res.end('Not found');return;}
 try{const body=await readFile(new URL(asset[0],import.meta.url));res.writeHead(200,{'Content-Type':`${asset[1]}; charset=utf-8`,'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:body);}
 catch{res.writeHead(500);res.end('Asset missing. Run npm run build for the portable version.');}
}).listen(port,'127.0.0.1',()=>console.log(`Inquiry Desk: http://127.0.0.1:${port}`));
