"""Check actual browser text against submitted JSON values, without author answers."""
from pathlib import Path
from decimal import Decimal, InvalidOperation
import json
import re
import unicodedata

root=Path('D:/omniale/case/D6教育训练与学习应用/case6e-expert-music-learning-hard-v2')
run=root/'evaluations/gpt-6.2-sol-hard-v2-20261123'
qa=run/'evaluation'
load=lambda p:json.loads(p.read_text(encoding='utf8'))
questions={x['question_id']:x for x in load(root/'candidate/questions.json')['questions']}
answers={x['question_id']:x['answer'] for x in load(run/'output/answers.json')['answers']}
browser=load(qa/'browser-qa.json')
assert len(browser['questions'])==20

def norm(text):
    return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',text)).strip().casefold()

def displayed(value,text):
    text=unicodedata.normalize('NFKC',text).strip()
    if isinstance(value,list):
        if all(type(v) in (str,int,float) for v in value):
            parts=[x.strip() for x in re.split(r'[;,，；]',text)]
            return len(parts)==len(value) and all(displayed(v,p) for v,p in zip(value,parts))
        parts=[x.strip() for x in re.split(r'[;；]',text)]
        return len(parts)==len(value) and all(displayed(v,p) for v,p in zip(value,parts))
    if type(value) is dict and set(value)=={'bar','beat'}:
        m=re.fullmatch(r'第\s*(\d+)\s*小节\s*[,，]\s*第\s*([+-]?\d+(?:\.\d+)?)\s*拍',text)
        return bool(m and Decimal(m[1])==Decimal(str(value['bar'])) and Decimal(m[2])==Decimal(str(value['beat'])))
    if type(value) in (int,float):
        try:return Decimal(text)==Decimal(str(value))
        except InvalidOperation:return False
    return type(value) is str and norm(value)==norm(text)

rows=[]
for row in browser['questions']:
    qid=row['question_id'];value=answers[qid];text=row.get('rendered_answer','');q=questions[qid]
    if q.get('choices'):
        m=re.fullmatch(r'\s*([ABCD])\s*[·:：、.．—–-]\s*(.*?)\s*',text)
        passed=bool(m and m[1]==value and norm(m[2])==norm(q['choices'][value]))
    else:passed=displayed(value,text)
    rows.append({'question_id':qid,'submitted_json_answer':value,'rendered_answer':text,
                 'original_string_only_probe_passed':row.get('answer_matches_json'),
                 'submitted_value_correctly_displayed':passed})
record={'method':'Compare actual browser text to original submitted JSON scalar/list/bar-beat values; preserve list order and all numbers. No author key or musical correction.',
        'original_browser_qa_modified':False,'original_output_modified':False,'passed':sum(x['submitted_value_correctly_displayed'] for x in rows),'total':len(rows),'items':rows}
(qa/'answer-display-review.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'passed':record['passed'],'total':record['total']}))
