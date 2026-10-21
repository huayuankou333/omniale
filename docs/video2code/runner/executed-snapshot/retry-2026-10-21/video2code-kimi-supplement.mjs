const click=(x,y)=>({type:'click',x,y});
async function step(label,actions=[],extra={}){const r=await fetch('http://127.0.0.1:3011/command',{method:'POST',headers:{'Content-Type':'application/json','Connection':'close'},body:JSON.stringify({label,actions,...extra})});const j=await r.json();if(j.error)throw Error(j.error);console.log(JSON.stringify({label,file:j.after?.file,closed:j.closed}));}
await step('SUP-play-start',[click(948,755)]);
await step('SUP-play-continuity',[],{motion_frames:30});
await step('SUP-pause-confirmed',[click(640,759)]);
await step('SUP-grid-reset',[click(988,755),click(787,455),click(39,39)]);
for(const x of [480,490,500,510,520,530,540,550,560,570,580,590,600])await step('SUP-snap-x-'+x,[{type:'move',x,y:500}]);
await step('SUP-camera-seed',[click(550,430),click(487,755),click(740,430),{type:'move',x:1100,y:70}]);
await step('SUP-camera-drag',[click(39,99),{type:'drag',x:850,y:350,to_x:1000,to_y:380}],{capture_each:true});
await step('SUP-END',[],{close:true});
