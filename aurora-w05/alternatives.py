"""Bounded negotiation candidates. No fabricated consent, global optimum or forecast."""
from copy import deepcopy
from datetime import date, timedelta
import math
import engine
from commitments import evaluate_week

LABELS = {'NONE':'기존 설비', 'OPT-02':'F2 전환', 'OPT-01':'F1 증설'}

def compare(inputs):
    engine.validate(inputs)
    if not inputs['start_date'] or inputs['capacity_period']=='unknown':
        return {'input_hash':engine.digest(inputs),'candidates':[],
                'reason':'최초 납품일과 생산능력 기간 단위를 먼저 확인하세요.'}
    requested=date.fromisoformat(inputs['start_date'])
    candidates=[]
    for option_id in LABELS:
        option=next((r for r in engine.EVIDENCE['capex'] if r['option_id']==option_id),None)
        ready=engine.AS_OF+timedelta(weeks=int(option['lead_time_weeks']) if option else 0)
        dates=[('requested',requested)]
        if ready>requested: dates.append(('ready',ready))
        for timing,start in dates:
            p=deepcopy(inputs);p.update(option=option_id,start_date=start.isoformat())
            limits={};bottlenecks=[]
            for product,key in [('PL-01','basic_qty'),('PL-02','derma_qty')]:
                row=next(r for r in engine.EVIDENCE['capacity'] if r['product_id']==product)
                annual=float(row['capacity_qty'])*(12 if p['capacity_period']=='month' else 1)
                load=min(100,float(row['utilization_pct'])+p['existing_load_pct'])
                weeks=[]
                for w in range(52):
                    day=start+timedelta(weeks=w)
                    extra=int(option['added_capacity_qty'])/52 if option and product=='PL-02' and day>=ready else 0
                    impact=evaluate_week(p,product,day,w+1,annual/52,annual*load/100/52,extra,0)
                    weeks.append((impact['new_available'],w+1,day.isoformat()))
                bottleneck=min(weeks)
                limits[key]=max(0,math.floor(bottleneck[0]*52+1e-7))
                p[key]=min(inputs[key],limits[key])
                bottlenecks.append({'product_id':product,'week':bottleneck[1],'date':bottleneck[2],
                                    'weekly_available':round(bottleneck[0],2),'uniform_52w_limit':limits[key]})
            zero=p['basic_qty']+p['derma_qty']==0
            analysis=None if zero else engine.calculate(p)
            changed=any(p[k]!=inputs[k] for k in ['basic_qty','derma_qty','option','start_date'])
            followups=[]
            if changed:
                p['buyer_confirmed']=False;p['schedule_confirmed']=False
                followups=['바이어의 변경 물량·개시일·균등 공급 동의','생산의 변경 일정·기존 약속 보호 확인']
                if p['option']!=inputs['option'] or p['start_date']!=inputs['start_date']:
                    p['material_confirmed']=False;followups.append('조달의 변경 조건 자재 확보 확인')
                if p['option']=='OPT-02' and p['option']!=inputs['option']:
                    p['validation_confirmed']=False;followups.append('품질의 F2 처방 재검증 확인')
            selected_analysis=None if zero else engine.calculate(p)
            candidates.append({'id':option_id+':'+timing,'label':LABELS[option_id],
                'start_date':p['start_date'],'ready_date':ready.isoformat(),
                'delay_days':(start-requested).days,'basic_qty':p['basic_qty'],'derma_qty':p['derma_qty'],
                'requested_basic_qty':inputs['basic_qty'],'requested_derma_qty':inputs['derma_qty'],
                'capex':int(option['capex_krw']) if option else 0,
                'bottlenecks':bottlenecks,'finance':analysis['finance'] if analysis else None,
                'physical_shortage_weeks':sum(x['shortage_weeks'] for x in analysis['lines']) if analysis else None,
                'existing_customer_shortage':round(sum(x['existing_shortage'] for x in analysis['commitment_impacts']),2) if analysis else None,
                'gaps':selected_analysis['gaps'] if selected_analysis else [],
                'blockers':analysis['blockers'] if analysis else ['이 조건에서는 수락 가능한 물량이 없습니다.'],
                'status':selected_analysis['status'] if selected_analysis else 'INFEASIBLE',
                'selectable':not zero,'requires_reconfirmation':followups,'inputs':p})
    return {'input_hash':engine.digest(inputs),'candidates':candidates,
            'reason':'요청 개시일과 설비 가동일(더 늦은 경우)만 비교합니다. 최적해·실제 납품 확약이 아닙니다. 고객 약속·미확인 정보는 보존하며, 달라진 물량·일정·설비에는 새 회신과 승인이 필요합니다.'}
