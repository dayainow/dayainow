"""W05: evidence-led bid review. No external business actions are sent."""
import csv
import hashlib
import json
import math
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).parent
AS_OF = date(2026, 7, 1)

def rows(name):
    with (ROOT / 'data/original' / name).open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f, delimiter='|'))

def evidence():
    capacity = rows('strat_capacity_cv.csv')
    batches = {r['batch_id']: r for r in rows('prod_batch_log_cv.csv')}
    cost, qty = defaultdict(float), defaultdict(float)
    for r in rows('production_material_consumption_cv.csv'):
        if '2026-04-01' <= r['consumption_date'] <= '2026-06-30':
            cost[r['product_id']] += float(r['consumed_qty']) * float(r['applied_unit_cost_krw'])
    for r in batches.values():
        if '2026-04-01' <= r['production_date'] <= '2026-06-30':
            qty[r['product_id']] += float(r['produced_qty'])
    monthly = defaultdict(lambda: {'orders': 0, 'shipments': 0})
    for r in rows('sales_orders_cv.csv'):
        if r['customer_id'] == 'C-101' and '2026-01-01' <= r['order_date'] <= '2026-06-30':
            monthly[r['order_date'][:7]]['orders'] += int(r['order_amount_krw'])
    for r in rows('sales_shipments_cv.csv'):
        if r['customer_id'] == 'C-101' and '2026-01-01' <= r['ship_date'] <= '2026-06-30':
            monthly[r['ship_date'][:7]]['shipments'] += int(r['revenue_krw'])
    fx = max((r for r in rows('ext_fx_daily.csv') if r['date'] <= AS_OF.isoformat()), key=lambda r: r['date'])
    return {'as_of': AS_OF.isoformat(), 'capacity': capacity, 'customers': rows('m_customer_cv.csv'),
            'capex': rows('strat_capex_plan_cv.csv'), 'fx': fx,
            'material_cost_per_ea': {p: round(c / qty[p], 4) for p, c in cost.items()},
            'cost_basis': '2026-04~06 투입 kg×실제 적용 원가 / 같은 기간 생산 EA. 자재비만이며 전체 제조원가 아님.',
            'customer_trend': [{'month': m, **v} for m, v in sorted(monthly.items())],
            'manifest': json.loads((ROOT/'data/manifest.json').read_text()),
            'limitations': ['capacity_qty의 기간 단위는 원본에 명시되지 않음. 월간 가정은 확인된 원본 사실이 아님.',
                           '가동률은 현재 스냅샷이며 주문별 납기·예약·미래 주간계획을 대신하지 않음.',
                           '과거 수주 감소를 미래 확정 약속 취소나 생산 여력 해제로 해석하지 않음.',
                           '설비 투자 승인과 실제 가동·원료 재계약·처방 재검증은 별도 조건.',
                           '원료 입고·투입 수량 불일치 때문에 자재 추적을 완전 재현했다고 주장하지 않음.']}

EVIDENCE = evidence()

def defaults():
    return {'start_date': '', 'basic_qty': 2000000, 'derma_qty': 1200000,
            'fx': float(EVIDENCE['fx']['usdkrw_close']), 'discount_pct': 5,
            'option': 'OPT-02', 'capacity_period': 'unknown', 'existing_load_pct': 0,
            'buyer_confirmed': False, 'schedule_confirmed': False,
            'material_confirmed': False, 'validation_confirmed': False,
            'other_cost_per_ea': 1500, 'scenario_note': '원본 접수 상태. 누락 정보 확인 필요.'}

def preset(name):
    p = defaults()
    if name != 'missing':
        p.update(start_date='2026-09-01', capacity_period='month', buyer_confirmed=True,
                 schedule_confirmed=True, material_confirmed=True, validation_confirmed=True,
                 scenario_note='SYN-01 모의 회신: 월간 능력·기존 부하 보호·52주 균등 공급·부분 수락을 가정. 실제 회신 아님.')
    if name == 'changed':
        p.update(basic_qty=6000000, derma_qty=1500000, discount_pct=10,
                 scenario_note='SYN-02 모의 조건 변경: 바이어가 전량 공급과 10% 인하 요구. 실제 회신 아님.')
    return p

def ledger_preset(name):
    p = preset('normal')
    p.update(commitments_complete=True, commitments=[
        {'id':'SYN-P001','customer_id':'C-101','product_id':'PL-01','due_date':'2026-09-04',
         'quantity':200000 if name == 'promises' else 280000, 'confirmed':name != 'unconfirmed',
         'source_kind':'synthetic','source_ref':'SYN-03: 기존 고객 납기 집중을 검증하기 위한 모의 회신'},
        {'id':'SYN-P002','customer_id':'C-102','product_id':'PL-01','due_date':'2026-09-06',
         'quantity':10000, 'confirmed':True,'source_kind':'synthetic','source_ref':'SYN-03: 동일 주 고객 약속 합산 검증'}])
    p['scenario_note']='SYN-03 고객별 약속 모의 시나리오. 미래 납기·물량·확인은 원본 사실이 아님. 기존 가동률 보호 하한 유지.'
    return p

def validate(p):
    expected = set(defaults())
    if set(p) - {'commitments', 'commitments_complete'} != expected:
        raise ValueError('입력 필드가 올바르지 않습니다.')
    for k, lo, hi in [('basic_qty', 0, 6000000), ('derma_qty', 0, 1500000), ('fx', 1, 5000),
                      ('discount_pct', 0, 100), ('existing_load_pct', 0, 100), ('other_cost_per_ea', 0, 1000000)]:
        if type(p[k]) not in (int, float) or not math.isfinite(p[k]) or not lo <= p[k] <= hi:
            raise ValueError(f'{k}: 허용 범위를 확인하세요.')
    if p['basic_qty'] + p['derma_qty'] <= 0:
        raise ValueError('제안 수량이 필요합니다.')
    if any(p[k] != int(p[k]) for k in ['basic_qty', 'derma_qty']):
        raise ValueError('수량은 정수 EA여야 합니다.')
    if p['option'] not in ['NONE', 'OPT-01', 'OPT-02'] or p['capacity_period'] not in ['unknown','month','year']:
        raise ValueError('설비 또는 능력 기간이 올바르지 않습니다.')
    for k in ['buyer_confirmed','schedule_confirmed','material_confirmed','validation_confirmed']:
        if type(p[k]) is not bool:
            raise ValueError('확인 값은 참/거짓이어야 합니다.')
    if not isinstance(p['scenario_note'], str) or len(p['scenario_note']) > 2000:
        raise ValueError('시나리오 설명은 2,000자 이내입니다.')
    from commitments import validate_ledger
    validate_ledger(p, EVIDENCE)
    if p['start_date']:
        start = date.fromisoformat(p['start_date'])
        if not AS_OF <= start <= date(2030, 12, 31):
            raise ValueError('납품 개시일은 기준일 이후여야 합니다.')

def digest(p):
    return hashlib.sha256(json.dumps(p, sort_keys=True, ensure_ascii=False).encode()).hexdigest()

def calculate(p):
    validate(p)
    gaps = []
    if not p['start_date']: gaps.append(('영업', '바이어에게 최초·분할 납품일 확인 요청'))
    if p['capacity_period'] == 'unknown': gaps.append(('생산', 'capacity_qty 기간 단위 확인 요청'))
    if not p['buyer_confirmed']: gaps.append(('영업', '부분 물량·52주 균등 공급 조건에 대한 바이어 회신 확인'))
    if not p['schedule_confirmed']: gaps.append(('생산', '기존 고객 확정 약속·주간 예약·셋업 반영 계획 확인'))
    if not p['material_confirmed']: gaps.append(('조달', '공급 개시 전 자재 확보 및 원료 계약 확인'))
    if p['option'] == 'OPT-02' and not p['validation_confirmed']:
        gaps.append(('품질', 'F2 전환 처방 재검증 완료 확인'))
    from commitments import ledger_gaps, evaluate_week
    gaps.extend(ledger_gaps(p))
    impacts = []
    option = next((r for r in EVIDENCE['capex'] if r['option_id'] == p['option']), None)
    lead = int(option['lead_time_weeks']) if option else 0
    ready = AS_OF + timedelta(weeks=lead)
    start = date.fromisoformat(p['start_date']) if p['start_date'] else None
    factor = {'month': 12, 'year': 1, 'unknown': 0}[p['capacity_period']]
    lines, schedule = [], []
    for product, key in [('PL-01', 'basic_qty'), ('PL-02', 'derma_qty')]:
        row = next(r for r in EVIDENCE['capacity'] if r['product_id'] == product)
        annual = float(row['capacity_qty']) * factor
        load = min(100, float(row['utilization_pct']) + p['existing_load_pct'])
        free = annual * (1-load/100)
        added = int(option['added_capacity_qty']) if option and product == 'PL-02' else 0
        weekly_demand = p[key] / 52
        shortages = []
        for w in range(52):
            day = start + timedelta(weeks=w) if start else None
            extra = added/52 if day and day >= ready else 0
            impact = evaluate_week(p, product, day, w+1, annual/52, annual*load/100/52, extra, weekly_demand)
            impacts.extend(impact['customers'])
            available = impact['new_available']
            shortage = max(0, weekly_demand - available)
            if shortage > 0.0001: shortages.append(w+1)
            schedule.append({'product': product, 'week': w+1, 'date': day.isoformat() if day else None,
                             'demand': round(weekly_demand,2), 'available': round(available,2),
                             'shortage': round(shortage,2), 'protected': round(impact['protected'],2),
                             'ledger_qty': impact['ledger_qty']})
        lines.append({'product': product, 'line': row['line_id'], 'annual_base': annual,
                      'protected_load_pct': load, 'annual_free': round(free), 'added_annual': added,
                      'proposed_qty': p[key], 'shortage_weeks': len(shortages),
                      'first_shortage_week': shortages[0] if shortages else None})
    revenue = sum(p[k]*usd*p['fx']*(1-p['discount_pct']/100) for k,usd in [('basic_qty',11.8),('derma_qty',15.8)])
    materials = sum(p[k]*EVIDENCE['material_cost_per_ea'][prod] for k,prod in [('basic_qty','PL-01'),('derma_qty','PL-02')])
    other = (p['basic_qty']+p['derma_qty'])*p['other_cost_per_ea']
    contribution = revenue-materials-other
    capex = int(option['capex_krw']) if option else 0
    blockers = []
    if not gaps and any(l['shortage_weeks'] for l in lines): blockers.append('既存 고객 부하를 보존하면 제안 물량을 충족하지 못합니다.'.replace('既存','기존'))
    if not gaps and any(x['existing_shortage'] > 0 for x in impacts):
        blockers.append('기존 고객 확약 자체가 해당 주 생산능력을 초과합니다. 생산·영업 재계획이 필요합니다.')
    if contribution <= 0: blockers.append('가정한 비용 범위에서도 공헌이익이 양수가 아닙니다.')
    status = 'NEEDS_INFO' if gaps else ('INFEASIBLE' if blockers else 'READY_FOR_REVIEW')
    return {'status': status, 'hash': digest(p), 'gaps': [{'owner':o,'title':t} for o,t in gaps],
            'blockers': blockers, 'lines': lines, 'schedule': schedule, 'ready_date': ready.isoformat(),
            'finance': {'revenue':round(revenue), 'materials':round(materials), 'other_cost':round(other),
                        'contribution':round(contribution), 'capex':capex,
                        'simple_payback_years':round(capex/contribution,3) if contribution>0 else None,
                        'one_month_penalty_full_annual_base':round(revenue*.03)},
            'commitment_impacts': impacts,
            'commitment_mode': 'ledger' if 'commitments' in p else 'snapshot-only',
            'finance_limit': '추가 비용 1,500원/EA는 참가자 가정(편집 가능). 세금·금융비·추가 운전자금 미포함. 회수기간은 제안 52주 매출 정상화 기준 단순값이며 납품 전 대기기간 미포함. 페널티 산정 기준액 미확인이므로 연매출 전체를 기준으로 한 스트레스값만 표시.',
            'scope': '실제 계산·내부 상태 반영 / 바이어·생산·조달·품질 회신 및 사람 승인은 대회용 모의 처리. 수주 확정·발주·고객 통지 없음.'}
