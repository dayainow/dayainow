import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=name=>readFile(path.join(root,'dist',name),'utf8');
const [html,css,core,app]=await Promise.all(['index.html','style.css','core.mjs','app.js'].map(read));
const js=core.replace(/^export /gm,'')+'\n'+app.replace(/^import .*;\r?\n/,'');
new vm.Script(js); // Check the exact combined script before packaging.
const output=html.replace('<link rel="stylesheet" href="style.css">',`<style>${css}</style>`)
 .replace(/<script type="module" src="app\.js[^\"]*"><\/script>/,`<script>(()=>{\n${js.replace(/<\/script/gi,'<\\/script')}\n})();</script>`);
if(/(?:src|href)="(?:app\.js|style\.css)|type="module"/.test(output))throw Error('Portable file still has external code dependencies');
const dir=path.join(root,'portable');await mkdir(dir,{recursive:true});
await writeFile(path.join(dir,'inquiry-desk.html'),output);
await writeFile(path.join(dir,'READ-ME.txt'),`문의 데스크 — 가상 사례 시연\n\n1. inquiry-desk.html을 브라우저에서 여세요. 별도 설치나 서버가 필요 없습니다.\n2. 가상 예시 넣기 → 상담 기록 저장으로 시작하세요.\n3. 종료 전 JSON 백업 또는 텍스트 백업으로 기록을 별도 파일에 보관하세요.\n4. 다음 실행 시 백업 복원 또는 텍스트에서 복원을 사용하세요.\n\nAI 연결·자동 발송·공동 작업·자동 저장은 없습니다. AI 답장은 미리 작성한 가상 예시입니다.\n자료는 현재 화면에 임시 보관되며 새로고침 시 사라집니다.\n이 파일은 기능 시연용이며 실제 고객용 맞춤 납품과 구분됩니다.\n`);
console.log(JSON.stringify({file:path.join(dir,'inquiry-desk.html'),bytes:Buffer.byteLength(output),externalCodeDependencies:0}));
