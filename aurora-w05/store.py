import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
import engine

SCHEMA = '''
CREATE TABLE IF NOT EXISTS cases(id TEXT PRIMARY KEY, revision INTEGER, status TEXT, inputs TEXT, analysis TEXT, ai TEXT, approval TEXT);
CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY, case_id TEXT, revision INTEGER, owner TEXT, title TEXT, kind TEXT, state TEXT, depends_on INTEGER);
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, case_id TEXT, revision INTEGER, event TEXT, detail TEXT, at TEXT);
CREATE TABLE IF NOT EXISTS archived_revisions(case_id TEXT, revision INTEGER, snapshot TEXT, PRIMARY KEY(case_id, revision));
'''
LABELS = {'NEEDS_INFO':'정보 확인 대기','INFEASIBLE':'조건 재협상 필요','READY_FOR_REVIEW':'AI 검토 대기',
          'PENDING_APPROVAL':'CEO 승인 대기','APPROVED':'승인 완료','EXECUTED':'후속 작업 생성 완료','REJECTED':'반려'}
ALLOWED_TASKS = {
 'BUYER_CLARIFICATION': ('영업', '바이어 납품 조건 확인'),
 'CAPACITY_CHECK': ('생산', '주간 공급 계획 확인'),
 'MATERIAL_CHECK': ('조달', '원료 계약·가용일 확인'),
 'QUALITY_CHECK': ('품질', 'F2 처방 재검증 확인'),
 'BID_DRAFT': ('영업', '승인 조건으로 입찰 제안서 작성'),
 'INVESTMENT_PREP': ('생산', '설비 투자 실행 검토 준비'),
 'CASH_REVIEW': ('재무', '투자·운전자금 지급 계획 검토'),
 'RENEGOTIATE': ('영업', '수락 물량·공급 개시일 재협상')}

class Store:
 def __init__(self,path):
  self.path=str(path)
  Path(path).parent.mkdir(parents=True,exist_ok=True)
  with self.db() as db:
   db.executescript(SCHEMA)
   if not db.execute('select 1 from cases').fetchone():
    p=engine.defaults();a=engine.calculate(p)
    db.execute('insert into cases values(?,?,?,?,?,?,?)',('C201',1,a['status'],json.dumps(p),json.dumps(a),None,None))
    self.event(db,1,'CREATED','원본 RFP 접수. 납품일·계획은 아직 미확인.')

 @contextmanager
 def db(self):
  db=sqlite3.connect(self.path,timeout=10)
  db.row_factory=sqlite3.Row
  try:
   db.execute('BEGIN IMMEDIATE')
   yield db
   db.commit()
  except Exception:
   db.rollback();raise
  finally: db.close()

 def event(self,db,rev,event,detail):
  db.execute('insert into events(case_id,revision,event,detail,at) values(?,?,?,?,?)',
             ('C201',rev,event,detail,datetime.now(timezone.utc).isoformat()))

 def get(self,db):
  c=dict(db.execute('select * from cases where id="C201"').fetchone())
  for k in ['inputs','analysis','ai','approval']: c[k]=json.loads(c[k]) if c[k] else None
  return c

 def state(self):
  with self.db() as db:
   c=self.get(db)
   c['tasks']=[dict(r) for r in db.execute('select * from tasks order by id')]
   c['events']=[dict(r) for r in db.execute('select * from events order by id desc')]
   c['status_label']=LABELS[c['status']]
   return c

 def check(self,c,revision):
  if revision != c['revision']: raise ValueError('다른 변경이 반영됐습니다. 새로고침 후 다시 시도하세요.')

 def update(self,p,revision):
  a=engine.calculate(p)
  with self.db() as db:
   c=self.get(db);self.check(c,revision)
   rev=c['revision']+1
   db.execute('insert or replace into archived_revisions values(?,?,?)',('C201',c['revision'],json.dumps(c)))
   db.execute('update cases set revision=?,status=?,inputs=?,analysis=?,ai=NULL,approval=NULL where id="C201"',
              (rev,a['status'],json.dumps(p),json.dumps(a)))
   db.execute('update tasks set state="SUPERSEDED" where state in ("OPEN","BLOCKED")')
   self.event(db,rev,'CONDITIONS_CHANGED','조건 버전 변경. 이전 AI 판단·승인·미완료 작업은 현재 실행에 사용할 수 없습니다.')
   if c['status']=='EXECUTED':
    db.execute('insert into tasks(case_id,revision,owner,title,kind,state) values(?,?,?,?,?,?)',
               ('C201',rev,'PM','이전 실행 영향 확인 및 변경 통지 초안 작성','RECONCILE','OPEN'))
   for gap in a['gaps']:
    db.execute('insert into tasks(case_id,revision,owner,title,kind,state) values(?,?,?,?,?,?)',
               ('C201',rev,gap['owner'],gap['title'],'INFORMATION','OPEN'))
   for impact in a.get('commitment_impacts',[]):
    if impact['at_risk_if_new_first'] > 0 or impact['existing_shortage'] > 0:
     title=f"{impact['customer_id']} · {impact['id']} · {impact['due_date']} 약속 보호: 신규 우선 시 {impact['at_risk_if_new_first']:,.0f} EA 노출. 물량·일정 조정"
     db.execute('insert into tasks(case_id,revision,owner,title,kind,state) values(?,?,?,?,?,?)',('C201',rev,'영업·생산',title,'PROMISE_REVIEW','OPEN'))
   if a['blockers']:
    db.execute('insert into tasks(case_id,revision,owner,title,kind,state) values(?,?,?,?,?,?)',
               ('C201',rev,'영업','전량 요구를 충족할 수 없어 물량·일정 재협상','RENEGOTIATE','OPEN'))
   self.event(db,rev,'CALCULATED',f"제약 검증: {a['status']}. 정보 공백 {len(a['gaps'])}건.")
  return self.state()

 def attach_ai(self,report,revision,mode='live'):
  with self.db() as db:
   c=self.get(db);self.check(c,revision)
   if c['status'] in ['APPROVED','EXECUTED','REJECTED']: raise ValueError('현재 상태에서는 AI 검토를 덮어쓸 수 없습니다. 조건을 새 버전으로 저장하세요.')
   if report.get('input_hash') != c['analysis']['hash']: raise ValueError('다른 조건에 대한 AI 응답입니다.')
   if report.get('decision') not in ['PROPOSE','HOLD','RENEGOTIATE']: raise ValueError('AI 결정 형식 오류')
   if not isinstance(report.get('summary'),str) or not 1<=len(report['summary'])<=3000: raise ValueError('AI 요약 형식 오류')
   if not isinstance(report.get('risks'),list) or not all(isinstance(x,str) for x in report['risks']): raise ValueError('AI 위험 검토 형식 오류')
   if not isinstance(report.get('tasks'),list) or not report['tasks'] or any(x not in ALLOWED_TASKS for x in report['tasks']): raise ValueError('AI 작업은 허용된 목록에서 선택해야 합니다.')
   if not isinstance(report.get('sources'),list) or not report['sources'] or any(x not in [m['file'] for m in engine.EVIDENCE['manifest']] for x in report['sources']): raise ValueError('AI 근거 파일이 원본 목록과 일치하지 않습니다.')
   report={**report,'mode':mode}
   ready=c['analysis']['status']=='READY_FOR_REVIEW' and report['decision']=='PROPOSE'
   status='PENDING_APPROVAL' if ready else c['analysis']['status']
   if not ready and status=='READY_FOR_REVIEW': status='NEEDS_INFO'
   db.execute('update cases set ai=?,status=?,approval=NULL where id="C201"',(json.dumps(report),status))
   self.event(db,revision,'AI_REVIEW',f"{mode}: {report['decision']} / {report['summary']}")
   if not ready:
    for kind in dict.fromkeys(report['tasks']):
     owner,title=ALLOWED_TASKS[kind]
     if not db.execute('select 1 from tasks where revision=? and kind=? and state="OPEN"',(revision,kind)).fetchone():
      db.execute('insert into tasks(case_id,revision,owner,title,kind,state) values(?,?,?,?,?,?)',('C201',revision,owner,title,kind,'OPEN'))
  return self.state()

 def approve(self,revision,decision,role,reason):
  if role!='CEO/이사회': raise ValueError('입찰·투자 승인권자는 CEO/이사회입니다.')
  if decision not in ['approve','reject'] or not isinstance(reason,str) or not reason.strip(): raise ValueError('승인/반려 사유를 적어주세요.')
  with self.db() as db:
   c=self.get(db);self.check(c,revision)
   if c['status']!='PENDING_APPROVAL': raise ValueError('현재 조건에 대한 AI 검토와 제약 통과가 먼저 필요합니다.')
   a={'hash':c['analysis']['hash'],'role':role,'decision':decision,'reason':reason,'simulation':True}
   db.execute('update cases set status=?,approval=? where id="C201"',('APPROVED' if decision=='approve' else 'REJECTED',json.dumps(a)))
   if decision=='reject':
    db.execute('insert into tasks(case_id,revision,owner,title,kind,state) values(?,?,?,?,?,?)',('C201',revision,'영업','반려 사유 반영 후 대안 작성: '+reason,'RENEGOTIATE','OPEN'))
   self.event(db,revision,'APPROVAL' if decision=='approve' else 'REJECTION',f'모의 {role}: {reason}')
  return self.state()

 def execute(self,revision):
  with self.db() as db:
   c=self.get(db);self.check(c,revision)
   if c['status']=='EXECUTED': return self._snapshot(db)
   if c['status']!='APPROVED' or c['approval']['hash']!=engine.digest(c['inputs']): raise ValueError('현재 조건에 대한 CEO 승인이 필요합니다.')
   if engine.calculate(c['inputs'])['status']!='READY_FOR_REVIEW': raise ValueError('실행 직전 제약 검증 실패')
   # Mandatory finance dependency persists even if the AI omits it.
   kinds=list(dict.fromkeys(['CASH_REVIEW']+c['ai']['tasks']+['BID_DRAFT','INVESTMENT_PREP']))
   cash_id=None
   for kind in kinds:
    owner,title=ALLOWED_TASKS[kind]
    dep=cash_id if kind=='INVESTMENT_PREP' else None
    cur=db.execute('insert into tasks(case_id,revision,owner,title,kind,state,depends_on) values(?,?,?,?,?,?,?)',
                   ('C201',revision,owner,title,kind,'BLOCKED' if dep else 'OPEN',dep))
    if kind=='CASH_REVIEW': cash_id=cur.lastrowid
   db.execute('update cases set status="EXECUTED" where id="C201"')
   self.event(db,revision,'EXECUTED','제안 조건 패키지·부서 작업 생성. 재무 검토 전 투자 준비 잠금. 외부 발주·수주·송신 없음.')
  return self.state()

 def _snapshot(self,db):
  c=self.get(db); c['status_label']=LABELS[c['status']]
  c['tasks']=[dict(r) for r in db.execute('select * from tasks order by id')]
  c['events']=[dict(r) for r in db.execute('select * from events order by id desc')]
  return c

 def complete(self,task_id,revision):
  with self.db() as db:
   c=self.get(db);self.check(c,revision)
   task=db.execute('select * from tasks where id=?',(task_id,)).fetchone()
   if not task or task['revision']!=revision or task['state']!='OPEN': raise ValueError('현재 버전의 열린 작업만 완료할 수 있습니다.')
   db.execute('update tasks set state="DONE" where id=?',(task_id,))
   db.execute('update tasks set state="OPEN" where depends_on=? and state="BLOCKED"',(task_id,))
   self.event(db,revision,'TASK_COMPLETED',f"모의 담당자 완료: {task['title']}. 정보 확인 작업 완료만으로 입력 조건이나 승인이 변경되지는 않습니다.")
  return self.state()
