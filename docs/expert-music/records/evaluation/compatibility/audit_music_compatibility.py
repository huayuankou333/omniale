from pathlib import Path
import hashlib
import json
import shutil
import sys
from music_transport import adapt, VERSION

sys.stdout.reconfigure(encoding='utf8')
root=Path('D:/omniale/case/D6教育训练与学习应用/case6e-expert-music-learning-hard-v2')
run=root/'evaluations/gpt-6.2-sol-hard-v2-20261123';qa=run/'evaluation'
load=lambda p:json.loads(p.read_text(encoding='utf8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
original=run/'output/answers.json'
manifest=load(run/'delivery-manifest.json')
assert sha(original)==next(x['sha256'] for x in manifest['files'] if x['path']=='answers.json')
converted,changes=adapt(load(original),load(root/'candidate/questions.json'))
assert converted==load(qa/'answers.transport-normalized.json')
transport=load(qa/'transport-normalization.json')
assert transport['changes']==changes and not transport['answer_key_or_explanations_used']
support=qa/'compatibility';support.mkdir(exist_ok=True)
for name in ['music_transport.py','grade_music_local.py','review_music_answer_display.py','audit_music_compatibility.py']:
    shutil.copy2(Path(__file__).parent/name,support/name)
audit={'adapter_version':VERSION,'public_question_formats_only':True,'original_matches_frozen_delivery_manifest':True,
       'normalized_file_reproducible_from_original_and_public_formats':True,
       'literal_original_transport_accepted':False,'original_modified':False,
       'adapter_code_sha256':sha(support/'music_transport.py'),
       'frozen_grader_not_edited_current_sha256':sha(root/'evaluator/grade_content.mjs'),
       'author_key_not_edited_current_sha256':sha(root/'evaluator/answer-key.json'),
       'files':{p.name:sha(p) for p in support.glob('*.py')},
       'limitation':'The adapter was added after the original type-only rejection. It is an explicitly disclosed compatibility-layer analysis, not literal acceptance by the originally released entry point.'}
(qa/'compatibility-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(audit,ensure_ascii=False))
