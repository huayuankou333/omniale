import fs from 'node:fs/promises';import path from 'node:path';import {spawnSync} from 'node:child_process';
const config=JSON.parse(await fs.readFile(process.argv[2],'utf8'));const root=path.resolve('outputs/case2_video2code_v1_native/runs',config.run,'evaluation');let last;
const click=p=>({type:'click',x:p[0],y:p[1]}),move=p=>({type:'move',x:p[0],y:p[1]});
async function step(label,actions=[],note=''){const r=await fetch('http://127.0.0.1:3011/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({label,actions,note})});last=await r.json();if(last.error)throw Error(last.error);console.log(JSON.stringify({label,file:last.after.file}));return last.after;}
const ui=config.ui;
async function setColor(c){return step('select-'+c,[click(ui[c])]);}
async function clear(label){await step(label+'-open',[click(ui.clear)]);await step(label+'-confirm',[click(ui.confirm)]);}
async function target(color){const r=spawnSync('F:/annconda/python.exe',['work/video2code-target.py',last.after.file,color],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);const targets=JSON.parse(r.stdout);if(!targets.length)throw Error('No visible '+color+' surface');const t=targets[0];return [t.x,t.y];}
async function hoverAndPlace(label,p){await step(label+'-preview',[move(p)]);await step(label+'-placed',[click(p),move([1100,70])]);}
async function stack(label,color='red',top='green',point=config.a){await setColor(color);await hoverAndPlace(label+'-base',point);await setColor(top);const p=await target(color);await hoverAndPlace(label+'-top',p);return p;}
const phase=process.argv[3]||'all';
if(['all','initial'].includes(phase)){
 await step('S00-initial');await step('S00-reload',[{type:'reload'}]);await clear('S01-reset');await step('S01-place-mode',[click(ui.place)]);await setColor('red');
 await step('S01-hover-a',[move(config.a)]);await step('S01-hover-neighbor',[move([config.a[0]+20,config.a[1]])]);await step('S01-hover-away',[move([1100,70])]);
 for(let i=0;i<config.independent.length;i++)await hoverAndPlace('S01-independent-'+(i+1),config.independent[i]);
 await setColor('green');await step('S01-new-settings',[{type:'select',index:0,value:'3'}]);await step('S01-restore-size',[{type:'select',index:0,value:'2'}]);
 await clear('S02-reset');await stack('S02-primary');await hoverAndPlace('S02-floor',config.b);await stack('S02-secondary','purple','green',config.c);
 await step('S02-camera-mode',[click(ui.camera)]);await step('S02-side-angle',[{type:'drag',x:850,y:350,to_x:1000,to_y:390}]);
}
if(['all','properties'].includes(phase)){
 await step('S03-reload',[{type:'reload'}]);await clear('S03-reset');await step('S03-place-mode',[click(ui.place)]);await setColor('red');await hoverAndPlace('S03-red22',config.a);await setColor('green');await hoverAndPlace('S03-green22',config.b);await setColor('purple');await step('S03-width3',[{type:'select',index:0,value:'3'}]);await hoverAndPlace('S03-purple32',config.c);await step('S03-swap',[click(ui.swap)]);await hoverAndPlace('S03-purple23',config.d);
 await step('S04-play',[click(ui.play)]);await step('S04-rotate-1',[{type:'wait',ms:1500}]);await step('S04-rotate-2',[{type:'wait',ms:1800}]);await step('S04-rotate-3',[{type:'wait',ms:1800}]);await step('S04-pause',[click(ui.pause||ui.play)]);await step('S04-size-reset',[{type:'select',index:0,value:'2'},{type:'select',index:1,value:'2'}]);await hoverAndPlace('S04-postplay',config.a);
 await step('S05-camera-mode',[click(ui.camera)]);await step('S05-drag',[{type:'drag',x:850,y:330,to_x:1050,to_y:390}]);await step('S05-place-mode',[click(ui.place)]);await hoverAndPlace('S05-after-camera',config.b);
}
if(['all','erase'].includes(phase)){
 await step('S06-reload',[{type:'reload'}]);await clear('S06-reset');await step('S06-place-mode',[click(ui.place)]);await stack('S06-setup');await setColor('purple');await hoverAndPlace('S06-purple',config.b);await step('S06-erase-mode',[click(ui.erase)]);const green=await target('green');await step('S06-green-hover',[move(green)]);await step('S06-green-delete',[click(green),move([1100,70])]);
 await step('S06-camera-mode',[click(ui.camera)]);await step('S06-camera-turn',[{type:'drag',x:850,y:330,to_x:1020,to_y:365}]);await step('S06-erase-after-camera',[click(ui.erase)]);const purple=await target('purple');await step('S06-purple-hover',[move(purple)]);await step('S06-purple-delete',[click(purple),move([1100,70])]);
 await step('S08-back-place',[click(ui.place)]);await setColor('purple');const red=await target('red');await hoverAndPlace('S08-rebuild-on-red',red);
 await step('S08-play',[click(ui.play)]);await step('S08-play-rotate',[{type:'wait',ms:2000}]);await step('S08-pause',[click(ui.pause||ui.play)]);
}
if(['all','clear'].includes(phase)){
 await step('S07-reload',[{type:'reload'}]);await clear('S07-reset');await step('S07-place',[click(ui.place)]);await stack('S07-seed');await setColor('purple');await hoverAndPlace('S07-third',config.b);
 await step('S07-open-cancel',[click(ui.clear)]);await step('S07-cancel',[click(ui.cancel)]);
 await step('S07-open-clickthrough',[click(ui.clear)]);await step('S07-modal-no-clickthrough',[click(config.c)]);
 // Re-open from a cleanly dismissed dialog before the independent close test.
 await step('S07-dismiss-if-open',[{type:'key',key:'Escape'}]);
 await step('S07-open-close',[click(ui.clear)]);await step('S07-close',[click(ui.close)]);
 await step('S07-open-confirm',[click(ui.clear)]);await step('S07-confirm',[click(ui.confirm)]);
 await step('S08-place-after-clear',[click(ui.place)]);await stack('S08-clear-rebuild','red','green',config.c);
}
