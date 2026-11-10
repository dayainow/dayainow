import copy
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import engine
from alternatives import compare
from store import Store
from test_workflow import report

class AlternativesTests(unittest.TestCase):
 def test_missing_capacity_or_date_does_not_invent_candidates(self):
  self.assertEqual(compare(engine.defaults())['candidates'],[])
 def test_candidate_quantity_uses_tightest_week_not_annual_free(self):
  p=engine.ledger_preset('collision');result=compare(p)
  candidate=next(x for x in result['candidates'] if x['id']=='OPT-02:requested')
  self.assertEqual(candidate['basic_qty'],1060420)
  self.assertEqual(candidate['derma_qty'],1200000)
  self.assertEqual(candidate['physical_shortage_weeks'],0)
  self.assertEqual(candidate['inputs']['commitments'],p['commitments'])
  self.assertEqual(candidate['status'],'NEEDS_INFO')
  self.assertFalse(candidate['inputs']['buyer_confirmed'])
 def test_limits_rechecked_across_units_dates_and_loads(self):
  for unit in ['month','year']:
   for start in ['2026-07-01','2026-09-01','2027-04-01']:
    for load in [0,3,15]:
     p=engine.preset('changed');p.update(capacity_period=unit,start_date=start,existing_load_pct=load)
     for c in compare(p)['candidates']:
      if c['selectable']:
       a=engine.calculate(c['inputs'])
       self.assertTrue(all(l['shortage_weeks']==0 for l in a['lines']))
       self.assertLessEqual(c['basic_qty'],p['basic_qty']);self.assertLessEqual(c['derma_qty'],p['derma_qty'])
 def test_delayed_investment_keeps_old_promises_and_gaps(self):
  p=engine.ledger_preset('collision');c=next(c for c in compare(p)['candidates'] if c['id']=='OPT-01:ready')
  self.assertEqual(c['start_date'],'2027-03-10')
  self.assertEqual(c['inputs']['commitments'],p['commitments'])
  self.assertTrue(any('기간 밖' in g['title'] for g in c['gaps']))
  self.assertEqual(c['status'],'NEEDS_INFO')
 def test_unknown_customer_promises_remain_unknown(self):
  for c in compare(engine.ledger_preset('unconfirmed'))['candidates']:
   self.assertFalse(c['inputs']['commitments'][0]['confirmed'])
   self.assertEqual(c['status'],'NEEDS_INFO')
 def test_same_option_does_not_create_fake_reconfirmation(self):
  p=engine.ledger_preset('promises');c=next(x for x in compare(p)['candidates'] if x['id']=='OPT-02:requested')
  self.assertEqual(c['inputs'],p);self.assertEqual(c['requires_reconfirmation'],[])
 def test_zero_capacity_is_not_selectable(self):
  p=engine.preset('normal');p['existing_load_pct']=100
  c=next(x for x in compare(p)['candidates'] if x['id']=='NONE:requested')
  self.assertFalse(c['selectable'])
 def test_selection_is_versioned_and_trusted_server_side(self):
  with tempfile.TemporaryDirectory() as tmp:
   s=Store(Path(tmp)/'state.sqlite3');p=engine.ledger_preset('collision');c=s.update(p,1)
   r=c['revision'];c=s.choose_alternative('OPT-02:requested',r)
   self.assertEqual(c['inputs']['basic_qty'],1060420)
   self.assertIsNone(c['approval']);self.assertEqual(c['status'],'NEEDS_INFO')
   with self.assertRaises(ValueError):s.choose_alternative('NONE:requested',r)
   with self.assertRaises(ValueError):s.choose_alternative('tampered',c['revision'])
   self.assertTrue(any(e['event']=='ALTERNATIVE_SELECTED' for e in c['events']))
 def test_selected_conditions_reach_tasks_after_new_review(self):
  with tempfile.TemporaryDirectory() as tmp:
   s=Store(Path(tmp)/'s.sqlite3');c=s.update(engine.ledger_preset('collision'),1)
   c=s.choose_alternative('NONE:requested',c['revision'])
   p=copy.deepcopy(c['inputs']);p.update(buyer_confirmed=True,schedule_confirmed=True,material_confirmed=True)
   c=s.update(p,c['revision']);c=s.attach_ai(report(p),c['revision'])
   c=s.approve(c['revision'],'approve','CEO/이사회','모형 응답을 사용한 자동 테스트')
   c=s.execute(c['revision'])
   self.assertFalse(any(t['kind']=='INVESTMENT_PREP' and t['revision']==c['revision'] for t in c['tasks']))
   bid=next(t for t in c['tasks'] if t['kind']=='BID_DRAFT' and t['revision']==c['revision'])
   self.assertIn('1,060,420',bid['title']);self.assertIn('NONE',bid['title'])

 def test_v3_recorded_reviews_bind_exact_inputs(self):
  import json
  with tempfile.TemporaryDirectory() as tmp:
   store=Store(Path(tmp)/'s.sqlite3')
   for name,status in [('selected','PENDING_APPROVAL'),('collision','INFEASIBLE'),('unconfirmed','NEEDS_INFO')]:
    p=json.loads((engine.ROOT/'data/review-inputs'/f'{name}.json').read_text())
    c=store.update(p,store.state()['revision'])
    response=json.loads((engine.ROOT/'data/ai-replays'/f'{engine.digest(p)}.json').read_text())
    c=store.attach_ai(response,c['revision'],'recorded-live-replay')
    self.assertEqual(c['status'],status)
