"""Customer promises overlay: never release the original protected load."""
import math
from datetime import date, timedelta

FIELDS = {'id','customer_id','product_id','due_date','quantity','confirmed','source_kind','source_ref'}

def validate_ledger(p, evidence):
    if 'commitments' not in p and 'commitments_complete' not in p:
        return  # Historical v1 snapshot/replay compatibility, explicitly labelled.
    if not isinstance(p.get('commitments'), list) or len(p['commitments']) > 200:
        raise ValueError('고객 약속은 최대 200행 목록이어야 합니다.')
    if type(p.get('commitments_complete')) is not bool:
        raise ValueError('약속 목록 범위 확인이 필요합니다.')
    customers = {r['customer_id'] for r in evidence['customers']}
    ids = set()
    for r in p['commitments']:
        if not isinstance(r,dict) or set(r) != FIELDS:
            raise ValueError('고객 약속 필드가 올바르지 않습니다.')
        for key in ['id','customer_id','product_id','due_date','source_kind','source_ref']:
            if not isinstance(r[key],str) or not 1 <= len(r[key].strip()) <= 500:
                raise ValueError('약속 식별자·출처·날짜를 입력하세요.')
        if r['id'] in ids:
            raise ValueError('약속 ID가 중복되었습니다.')
        ids.add(r['id'])
        if r['customer_id'] not in customers or r['customer_id'] == 'C-201':
            raise ValueError('기존 고객 마스터에 있는 고객을 선택하세요.')
        if r['product_id'] not in ['PL-01','PL-02']:
            raise ValueError('기초·더마 제품 약속만 지원합니다.')
        q=r['quantity']
        if type(q) not in (int,float) or not math.isfinite(q) or q <= 0 or q != int(q) or q > 100000000:
            raise ValueError('확약 수량은 양의 정수 EA여야 합니다.')
        if type(r['confirmed']) is not bool or r['source_kind'] not in ['synthetic','participant-evidence']:
            raise ValueError('확인 상태와 출처 구분이 올바르지 않습니다.')
        date.fromisoformat(r['due_date'])

def ledger_gaps(p):
    if 'commitments' not in p:
        return []
    gaps=[]
    if not p['commitments_complete']:
        gaps.append(('생산','52주 기존 고객 약속 목록의 누락·대상 범위 확인'))
    start=date.fromisoformat(p['start_date']) if p['start_date'] else None
    for r in p['commitments']:
        if not r['confirmed']:
            gaps.append(('영업',f"{r['id']} · {r['customer_id']} 납기 {r['due_date']} / {r['quantity']} EA 확약 근거 확인"))
        due=date.fromisoformat(r['due_date'])
        if start and not start <= due < start+timedelta(weeks=52):
            gaps.append(('생산',f"{r['id']} 납기가 검토 기간 밖입니다. 미납·선행 생산 또는 별도 기간 검토 필요"))
    return gaps

def evaluate_week(p, product, day, week, base, baseline, extra, demand):
    promises=[r for r in p.get('commitments',[]) if r['product_id']==product and day and
              day <= date.fromisoformat(r['due_date']) < day+timedelta(days=7)]
    total=sum(r['quantity'] for r in promises)
    protected=max(baseline,total)
    # Baseline and named promises overlap. Taking max avoids double counting,
    # but never frees baseline capacity. Unknown promises also reserve capacity.
    capacity=base+extra
    available=max(0,capacity-protected)
    existing_shortage=max(0,total-capacity)
    displacement=max(0,total-max(0,capacity-demand))
    customers=[]
    for r in promises:
        customers.append({**r,'week':week,'week_start':day.isoformat(),
            'existing_shortage':round(existing_shortage*r['quantity']/total,2),
            'at_risk_if_new_first':round(displacement*r['quantity']/total,2),
            'allocation_rule':'충돌 물량을 동일 주 확약 수량 비례로 배분한 노출 추정; 실제 배정·지연 확정 아님'})
    return {'protected':protected,'ledger_qty':total,'new_available':available,'customers':customers}
