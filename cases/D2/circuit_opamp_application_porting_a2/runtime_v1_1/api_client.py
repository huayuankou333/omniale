"""Responses function loop over the user's existing compatible endpoint."""
import json
import time
import urllib.request
import urllib.error
from config import BASE_URL, LIMITS, save

def models(key):
    request=urllib.request.Request(BASE_URL+'/models',headers={'Authorization':'Bearer '+key})
    with urllib.request.urlopen(request,timeout=45) as response:
        return {row['id'] for row in json.load(response)['data']}

def call(key,model,messages,instructions,tools,folder,max_tokens=None):
    payload={'model':model,'instructions':instructions,'input':messages,'tools':tools,
             'parallel_tool_calls':False,'reasoning':{'effort':LIMITS['reasoning_effort']},
             'max_output_tokens':max_tokens or LIMITS['max_output_per_response'],
             'store':False,'stream':True}
    save(folder/'request.json',payload)
    started=time.monotonic()
    for attempt in range(8):
        try:
            request=urllib.request.Request(BASE_URL+'/responses',data=json.dumps(payload).encode(),
                 headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'})
            with urllib.request.urlopen(request,timeout=360) as response:
                if 'text/event-stream' in response.headers.get('Content-Type',''):
                    result=None
                    with (folder/f'events_attempt_{attempt}.jsonl').open('w') as eventlog:
                        for line in response:
                            line=line.decode().strip()
                            if not line.startswith('data:'):continue
                            data=line[5:].strip()
                            if data=='[DONE]':continue
                            event=json.loads(data)
                            eventlog.write(json.dumps(event,ensure_ascii=False)+'\n')
                            if event.get('type') in ('response.completed','response.incomplete','response.failed'):
                                result=event['response']
                            if event.get('type')=='error':
                                save(folder/f'stream_error_{attempt}.json',event)
                                raise ConnectionError('Provider stream error before a usable terminal response')
                    if result is None:raise ConnectionError('Missing terminal response event')
                else:result=json.load(response)
            save(folder/'response.json',result)
            if result.get('status')=='failed':raise ConnectionError('Provider failed before a usable response')
            usage=result.get('usage') or {}
            save(folder/'inference.json',{'requested_model':model,'reported_model':result.get('model'),
                 'usage':usage,'wall_seconds':time.monotonic()-started,'transport_retry':attempt})
            return result
        except (urllib.error.URLError,TimeoutError,ConnectionError) as exc:
            if isinstance(exc,urllib.error.HTTPError):
                body=exc.read().decode(errors='replace').replace(key,'<redacted>')
                save(folder/f'transport_{attempt}.json',{'code':exc.code,'body':body[:2000]})
                if exc.code not in (429,500,502,503,504):raise RuntimeError('Nonretryable API HTTP '+str(exc.code))
            else:save(folder/f'transport_{attempt}.json',{'error':str(exc).replace(key,'<redacted>')[:1000]})
            if attempt==7:raise
            time.sleep(min(45,10*(attempt+1)))
