import copy
import json
import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import engine
from store import Store
from test_workflow import report

class CommitmentTests(unittest.TestCase):
 def test_overlap_does_not_double_count_or_release_baseline(self):
  p=engine.ledger_preset('promises');a=engine.calculate(p)
  self.assertEqual(a['status'],'READY_FOR_REVIEW')
  baseline=engine.calculate(engine.preset('normal'))
  self.assertEqual(a['schedule'][0]['available'],baseline['schedule'][0]['available'])
  self.assertEqual(a['schedule'][0]['ledger_qty'],210000)
 def test_peak_blocks_and_assigns_exposure_by_customer(self):
  p=engine.ledger_preset('collision');a=engine.calculate(p)
  self.assertEqual(a['status'],'INFEASIBLE')
  impacts=a['commitment_impacts'];self.assertEqual(len(impacts),2)
  self.assertGreater(impacts[0]['at_risk_if_new_first'],0)
  self.assertAlmostEqual(sum(r['at_risk_if_new_first'] for r in impacts),a['schedule'][0]['shortage'],places=1)
 def test_unconfirmed_reserves_but_blocks_approval(self):
  p=engine.ledger_preset('unconfirmed');a=engine.calculate(p)
  self.assertEqual(a['status'],'NEEDS_INFO')
  self.assertEqual(a['schedule'][0]['ledger_qty'],290000)
  self.assertTrue(any('SYN-P001' in g['title'] for g in a['gaps']))
 def test_coverage_confirmation_cannot_be_omitted(self):
  p=engine.ledger_preset('promises');p['commitments_complete']=False
  self.assertEqual(engine.calculate(p)['status'],'NEEDS_INFO')
 def test_date_boundaries_are_not_silently_dropped(self):
  for day,expected in [('2026-08-31','NEEDS_INFO'),('2027-08-31','NEEDS_INFO')]:
   p=engine.ledger_preset('promises');p['commitments'][0]['due_date']=day
   self.assertEqual(engine.calculate(p)['status'],expected)
  p=engine.ledger_preset('promises');p['commitments'][0]['due_date']='2026-09-08'
  self.assertEqual(engine.calculate(p)['commitment_impacts'][1]['week'],2)
 def test_existing_overload_not_hidden_by_zero_new_product(self):
  p=engine.ledger_preset('promises');p['basic_qty']=0;p['commitments'][0]['quantity']=400000
  a=engine.calculate(p);self.assertEqual(a['status'],'INFEASIBLE')
  self.assertGreater(a['commitment_impacts'][0]['existing_shortage'],0)
 def test_invalid_rows_and_duplicate_ids_rejected(self):
  for key,value in [('quantity',-1),('quantity',True),('quantity',1.5),('due_date','bad'),('customer_id','C-201'),('product_id','PL-99'),('confirmed','yes'),('source_ref','')]:
   p=engine.ledger_preset('promises');p['commitments'][0][key]=value
   with self.assertRaises(ValueError):engine.calculate(p)
  p=engine.ledger_preset('promises');p['commitments'].append(copy.deepcopy(p['commitments'][0]))
  with self.assertRaises(ValueError):engine.calculate(p)
 def test_edit_invalidates_approval_persists_and_creates_customer_tasks(self):
  with tempfile.TemporaryDirectory() as tmp:
   path=Path(tmp)/'state.sqlite3';s=Store(path);p=engine.ledger_preset('promises')
   c=s.update(p,1);c=s.attach_ai(report(p),c['revision']);s.approve(c['revision'],'approve','CEO/이사회','테스트 모형 응답으로 검증')
   c=s.update(engine.ledger_preset('collision'),c['revision'])
   self.assertIsNone(c['approval']);self.assertIsNone(c['ai'])
   self.assertEqual(len([t for t in c['tasks'] if t['kind']=='PROMISE_REVIEW']),2)
   with self.assertRaises(ValueError):s.execute(c['revision'])
   restored=Store(path).state();self.assertEqual(restored['inputs']['commitments'][0]['quantity'],280000)
   with self.assertRaises(ValueError):s.attach_ai(report(p),c['revision'])
 def test_old_real_replay_never_matches_new_ledger(self):
  p=engine.ledger_preset('promises')
  self.assertNotEqual(engine.digest(p),engine.digest(engine.preset('normal')))
  self.assertFalse((engine.ROOT/'data/ai-replays'/f'{engine.digest(p)}.json').exists())
 def test_missing_promises_create_action_not_automatic_confirmation(self):
  with tempfile.TemporaryDirectory() as tmp:
   s=Store(Path(tmp)/'s.sqlite3');c=s.update(engine.ledger_preset('unconfirmed'),1)
   t=next(t for t in c['tasks'] if t['kind']=='INFORMATION')
   c=s.complete(t['id'],c['revision']);self.assertEqual(c['status'],'NEEDS_INFO')
   self.assertFalse(c['inputs']['commitments'][0]['confirmed'])
