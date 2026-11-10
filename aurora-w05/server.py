import argparse
import json
import mimetypes
import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import engine
from store import Store

ROOT=Path(__file__).parent
DB=Store(os.environ.get('AURORA_DB',str(ROOT/'runtime/state.sqlite3')))

class Handler(BaseHTTPRequestHandler):
 def send(self,obj,code=200):
  data=json.dumps(obj,ensure_ascii=False).encode()
  self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8')
  self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
 def do_GET(self):
  path=urlsplit(self.path).path
  if path=='/api/state': return self.send(DB.state())
  if path=='/api/evidence': return self.send(engine.EVIDENCE)
  if path=='/api/presets': return self.send({**{n:engine.preset(n) for n in ['missing','normal','changed']}, **{n:engine.ledger_preset(n) for n in ['promises','collision','unconfirmed']}})
  if path=='/api/ai-prompt':
   from ai_adapter import prompt
   return self.send({'prompt':prompt(DB.state()['inputs'])})
  if path.startswith('/api/source/'):
   name=path.removeprefix('/api/source/')
   if name not in [m['file'] for m in engine.EVIDENCE['manifest']]: return self.send({'error':'없는 자료'},404)
   return self.send({'name':name,'content':(ROOT/'data/original'/name).read_text()})
  name={'/':'index.html','/app.js':'app.js','/style.css':'style.css'}.get(path)
  if not name:return self.send({'error':'Not found'},404)
  data=(ROOT/'web'/name).read_bytes();self.send_response(200)
  self.send_header('Content-Type',(mimetypes.guess_type(name)[0] or 'text/plain')+'; charset=utf-8')
  self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'")
  self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
 def do_POST(self):
  origin=self.headers.get('Origin')
  if origin and origin not in [f'http://127.0.0.1:{self.server.server_port}',f'http://localhost:{self.server.server_port}']:
   return self.send({'error':'허용되지 않은 출처'},403)
  if self.headers.get('Content-Type','').split(';')[0]!='application/json': return self.send({'error':'JSON만 허용'},415)
  try:
   size=int(self.headers.get('Content-Length','0'))
   if not 0<size<=100000: raise ValueError('요청 크기 오류')
   p=json.loads(self.rfile.read(size));rev=p.get('revision')
   if self.path=='/api/update': out=DB.update(p['inputs'],rev)
   elif self.path=='/api/approve': out=DB.approve(rev,p['decision'],p['role'],p['reason'])
   elif self.path=='/api/execute': out=DB.execute(rev)
   elif self.path=='/api/complete':out=DB.complete(p['task_id'],rev)
   elif self.path=='/api/ai-import':out=DB.attach_ai(p['report'],rev,'manual-import')
   elif self.path=='/api/ai-replay':
    c=DB.state();DB.check(c,rev)
    f=ROOT/'data/ai-replays'/f"{c['analysis']['hash']}.json"
    if not f.exists(): raise ValueError('이 조건에 대한 실측 AI 응답이 없습니다. 프롬프트를 복사해 AI 응답을 가져오세요.')
    out=DB.attach_ai(json.loads(f.read_text()),rev,'recorded-live-replay')
   else: return self.send({'error':'Not found'},404)
   return self.send(out)
  except (ValueError,KeyError,TypeError) as e:return self.send({'error':str(e)},400)
 def log_message(self,fmt,*args): pass

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8765);args=p.parse_args()
 server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
 print(f'Aurora review desk: http://127.0.0.1:{args.port}',flush=True)
 server.serve_forever()
