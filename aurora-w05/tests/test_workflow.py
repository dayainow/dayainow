import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import engine
from store import Store

def report(p,decision='PROPOSE'):
 return {'input_hash':engine.digest(p),'decision':decision,'summary':'테스트용 AI 모형 응답. 실제 모델 응답 아님.',
         'risks':['월간 능력 가정'],'sources':['rfp_c201.md'],'tasks':['BID_DRAFT','CASH_REVIEW']}

class WorkflowTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
  self.store=Store(Path(self.tmp.name)/'state.sqlite3')
 def prepare(self):
  p=engine.preset('normal');c=self.store.update(p,1)
  return self.store.attach_ai(report(p),c['revision'])
 def test_missing_information_creates_owned_tasks(self):
  c=self.store.update(engine.preset('missing'),1)
  self.assertEqual(c['status'],'NEEDS_INFO');self.assertEqual(len(c['tasks']),6)
 def test_normal_partial_supply_passes(self):
  a=engine.calculate(engine.preset('normal'))
  self.assertEqual(a['status'],'READY_FOR_REVIEW')
  self.assertTrue(all(s['shortage']==0 for s in a['schedule']))
 def test_full_order_fails_both_lines(self):
  a=engine.calculate(engine.preset('changed'))
  self.assertEqual(a['status'],'INFEASIBLE');self.assertEqual([l['shortage_weeks'] for l in a['lines']],[52,52])
 def test_early_delivery_not_confused_with_bid_deadline(self):
  p=engine.preset('normal');p['start_date']='2026-07-22'
  a=engine.calculate(p);self.assertEqual(a['status'],'INFEASIBLE')
  self.assertGreater(a['lines'][1]['shortage_weeks'],0)
 def test_year_capacity_changes_decision(self):
  p=engine.preset('normal');p['capacity_period']='year'
  self.assertEqual(engine.calculate(p)['status'],'INFEASIBLE')
 def test_missing_quality_blocks_conversion(self):
  p=engine.preset('normal');p['validation_confirmed']=False
  self.assertEqual(engine.calculate(p)['status'],'NEEDS_INFO')
 def test_ai_cannot_override_hard_capacity(self):
  p=engine.preset('changed');c=self.store.update(p,1)
  c=self.store.attach_ai(report(p),c['revision']);self.assertEqual(c['status'],'INFEASIBLE')
  with self.assertRaises(ValueError):self.store.approve(c['revision'],'approve','CEO/이사회','허용 불가')
 def test_approval_required_and_role_enforced(self):
  c=self.prepare()
  with self.assertRaises(ValueError):self.store.execute(c['revision'])
  with self.assertRaises(ValueError):self.store.approve(c['revision'],'approve','영업','잘못된 역할')
 def test_approved_execution_is_idempotent_and_gated(self):
  c=self.prepare();r=c['revision'];self.store.approve(r,'approve','CEO/이사회','조건부 승인')
  c=self.store.execute(r);count=len(c['tasks']);self.assertEqual(len(self.store.execute(r)['tasks']),count)
  cash=next(t for t in c['tasks'] if t['kind']=='CASH_REVIEW');invest=next(t for t in c['tasks'] if t['kind']=='INVESTMENT_PREP')
  self.assertEqual(invest['state'],'BLOCKED')
  with self.assertRaises(ValueError):self.store.complete(invest['id'],r)
  c=self.store.complete(cash['id'],r)
  self.assertEqual(next(t for t in c['tasks'] if t['id']==invest['id'])['state'],'OPEN')
 def test_change_invalidates_approval_and_requires_reconciliation(self):
  c=self.prepare();r=c['revision'];self.store.approve(r,'approve','CEO/이사회','조건부 승인');self.store.execute(r)
  c=self.store.update(engine.preset('changed'),r)
  self.assertIsNone(c['approval']);self.assertIsNone(c['ai'])
  self.assertTrue(any(t['kind']=='RECONCILE' for t in c['tasks']))
  self.assertTrue(all(t['state']=='SUPERSEDED' for t in c['tasks'] if t['revision']==r))
  with self.assertRaises(ValueError):self.store.execute(c['revision'])
 def test_stale_revision_and_ai_hash_rejected(self):
  c=self.prepare()
  with self.assertRaises(ValueError):self.store.update(engine.preset('missing'),1)
  with self.assertRaises(ValueError):self.store.attach_ai(report(engine.preset('missing')),c['revision'])
 def test_rejection_creates_followup(self):
  c=self.prepare();c=self.store.approve(c['revision'],'reject','CEO/이사회','지급 계획 보완')
  self.assertEqual(c['status'],'REJECTED');self.assertTrue(any('지급 계획 보완' in t['title'] for t in c['tasks']))
 def test_input_validation(self):
  for k,v in [('basic_qty',-1),('fx',float('nan')),('derma_qty',1.5),('discount_pct',101)]:
   p=engine.preset('normal');p[k]=v
   with self.assertRaises(ValueError):engine.calculate(p)
 def test_material_cost_unit_and_source_integrity(self):
  self.assertGreater(engine.EVIDENCE['material_cost_per_ea']['PL-01'],0)
  for item in engine.EVIDENCE['manifest']:
   self.assertEqual(hashlib.sha256((engine.ROOT/'data/original'/item['file']).read_bytes()).hexdigest(),item['sha256'])
 def test_real_model_replays_are_current_and_valid(self):
  for name in ['normal','changed','missing']:
   p=engine.preset(name);c=self.store.state();c=self.store.update(p,c['revision'])
   f=engine.ROOT/'data/ai-replays'/f'{engine.digest(p)}.json'
   self.assertTrue(f.exists(),name)
   out=self.store.attach_ai(json.loads(f.read_text()),c['revision'],'recorded-live-replay')
   self.assertEqual(out['status'],{'normal':'PENDING_APPROVAL','changed':'INFEASIBLE','missing':'NEEDS_INFO'}[name])

if __name__=='__main__':unittest.main()
