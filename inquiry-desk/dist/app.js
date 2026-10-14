import {FIELDS,STATUSES,validateFields,parseBackup,mergeRecords,buildPrompt,sample} from './core.mjs';
const $=id=>document.getElementById(id);
let records=[], editing=null, dirty=false;
function notify(message){$('notice').textContent=message;}
function fields(){return Object.fromEntries(FIELDS.map(key=>[key,$(key).value]));}
function reset(){ $('editor').reset();editing=null;$('edit-heading').textContent='01 · 문의 접수';$('prompt-output').value=''; }
function load(record){for(const key of FIELDS) $(key).value=record[key];$('prompt-output').value='';}
function save(input,id=editing){
 const clean=validateFields(input);
 if(!id && records.length>=500) throw Error('시연 도구는 최대 500건까지 열 수 있습니다.');
 const record={...clean,id:id??crypto.randomUUID(),updatedAt:new Date().toISOString()};
 records=[record,...records.filter(r=>r.id!==record.id)];dirty=true;render();return record;
}
function element(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function render(){
 $('count').textContent=`${records.length}건`;
 const list=$('record-list');list.replaceChildren();
 const visible=records.filter(r=>$('filter').value==='전체'||r.status===$('filter').value);
 if(!visible.length){const empty=element('div',records.length?'선택한 상태의 상담이 없습니다.':'아직 상담 기록이 없습니다.','empty');empty.append(element('p','가상 예시를 넣고 저장해보세요.'));list.append(empty);return;}
 const today=new Date();const todayString=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
 for(const r of visible){
  const card=element('article',undefined,'record');card.append(element('h3',r.title));
  const meta=element('div',undefined,'meta');meta.append(element('span',r.status,'status'));
  if(r.due)meta.append(element('span',`확인일 ${r.due}${r.due<todayString&&r.status!=='종료'?' · 기한 지남':''}`,r.due<todayString&&r.status!=='종료'?'overdue':''));
  card.append(meta,element('pre',r.requirements||r.inquiry));
  if(r.questions){card.append(element('strong','확인할 질문'),element('pre',r.questions));}
  const actions=element('div',undefined,'actions');
  const edit=element('button','수정');edit.type='button';edit.onclick=()=>{if(hasInput()&&!confirm('작성 중인 입력을 이 기록으로 바꿀까요?'))return;editing=r.id;load(r);$('edit-heading').textContent='01 · 상담 기록 수정';$('title').focus();};
  const download=element('button','상담 메모 받기');download.type='button';download.onclick=()=>downloadFile(`상담-${r.id}.txt`,`${r.title}\n상태: ${r.status}\n확인일: ${r.due||'미정'}\n\n[원문]\n${r.inquiry}\n\n[요구사항]\n${r.requirements}\n\n[확인 질문]\n${r.questions}\n\n[답장 초안]\n${r.reply}`,'text/plain');
  const del=element('button','삭제','danger');del.type='button';del.onclick=()=>{if(!confirm(`“${r.title}” 기록을 현재 화면에서 삭제할까요?`))return;records=records.filter(x=>x.id!==r.id);if(editing===r.id)reset();dirty=true;render();notify('기록을 삭제했습니다. 기존 백업 파일은 변경되지 않습니다.');};
  actions.append(edit,download,del);card.append(actions);list.append(card);
 }
}
function hasInput(){return FIELDS.some(k=>k!=='status'&&$(k).value.trim());}
function downloadFile(name,text,type){const url=URL.createObjectURL(new Blob([text],{type:`${type};charset=utf-8`}));const a=element('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
$('editor').onsubmit=e=>{e.preventDefault();try{save(fields());reset();notify('상담을 현재 화면에 저장했습니다. 종료 전 JSON 백업을 받아주세요.');}catch(error){notify(error.message);}};
$('sample').onclick=()=>{if(hasInput()&&!confirm('작성 중인 입력을 가상 예시로 바꿀까요?'))return;reset();load(sample);notify('가상 문의와 미리 작성한 답장 예시입니다. AI가 실시간 생성한 결과가 아닙니다.');};
$('clear').onclick=()=>{if(hasInput()&&!confirm('작성 중인 입력을 비우고 새 문의를 시작할까요?'))return;reset();notify('새 문의를 입력할 수 있습니다.');};
$('filter').onchange=render;
$('prompt').onclick=()=>{try{$('prompt-output').value=buildPrompt($('inquiry').value);notify('요청문을 만들었습니다. 개인정보를 확인한 뒤 사용하세요.');}catch(error){notify(error.message);}};
$('copy').onclick=async()=>{if(!$('prompt-output').value){notify('요청문을 먼저 만들어주세요.');return;}try{await navigator.clipboard.writeText($('prompt-output').value);notify('요청문을 복사했습니다.');}catch{$('prompt-output').select();notify('자동 복사가 불가능합니다. 선택된 요청문을 직접 복사해주세요.');}};
$('export').onclick=()=>{downloadFile('inquiry-desk-backup.json',JSON.stringify({version:1,exportedAt:new Date().toISOString(),records},null,2),'application/json');dirty=false;notify('백업 다운로드를 요청했습니다. 파일이 저장됐는지 확인해주세요.');};
$('import-button').onclick=()=>$('import').click();
$('import').onchange=async()=>{const file=$('import').files[0];if(!file)return;try{if(file.size>5_000_000)throw Error('백업은 5MB 이하만 열 수 있습니다.');const incoming=parseBackup(await file.text());const result=mergeRecords(records,incoming);records=result.records;dirty=true;render();notify(`${result.added}건 복원, 중복 ${result.skipped}건 건너뜀. 기존 기록은 유지했습니다.`);}catch(error){notify(`복원하지 못했습니다: ${error.message}`);}finally{$('import').value='';}};
window.addEventListener('beforeunload',e=>{if(dirty||hasInput()){e.preventDefault();e.returnValue='';}});
function backupText(){return JSON.stringify({version:1,exportedAt:new Date().toISOString(),records},null,2);}
$('prepare-backup').onclick=()=>{$('backup-text').value=backupText();notify('백업 텍스트를 만들었습니다. 복사해 별도 파일에 보관해주세요.');};
$('copy-backup').onclick=async()=>{if(!$('backup-text').value){notify('백업 텍스트를 먼저 만들어주세요.');return;}try{await navigator.clipboard.writeText($('backup-text').value);notify('백업 텍스트를 복사했습니다. 별도 파일에 붙여 넣어 보관해주세요.');}catch{$('backup-text').select();notify('선택된 백업 텍스트를 직접 복사해주세요.');}};
$('restore-text').onclick=()=>{try{const incoming=parseBackup($('backup-text').value);const result=mergeRecords(records,incoming);records=result.records;dirty=true;render();notify(`${result.added}건 복원, 중복 ${result.skipped}건 건너뜀. 기존 기록은 유지했습니다.`);}catch(error){notify(`복원하지 못했습니다: ${error.message}`);}};
// Same form action for supported agent-enabled browsers. No automatic sends.
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 for(const tool of [
 {name:'list_inquiries',title:'현재 상담 기록 보기',description:'현재 화면의 임시 상담 기록을 읽습니다.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:input=>{if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw Error('빈 객체를 입력하세요.');return {records:records.map(r=>({...r}))};}},
 {name:'stage_inquiry',title:'상담 입력 준비',description:'상담 양식에 입력을 채웁니다. 저장·발송하지 않습니다. 기존 입력이 있으면 실패합니다.',inputSchema:{type:'object',properties:Object.fromEntries(FIELDS.map(k=>[k,k==='status'?{type:'string',enum:STATUSES}:{type:'string'}])),required:FIELDS,additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute:input=>{if(hasInput())throw Error('작성 중인 입력이 있습니다. 먼저 저장하거나 비워주세요.');if(Object.keys(input).some(k=>!FIELDS.includes(k)))throw Error('지원하지 않는 항목입니다.');const clean=validateFields(input);load(clean);notify('상담 양식에 입력했습니다. 저장 전 확인해주세요.');return {staged:true,saved:false};}}
 ]){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
}
render();
