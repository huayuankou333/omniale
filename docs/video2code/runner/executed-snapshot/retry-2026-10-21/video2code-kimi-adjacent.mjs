const click=(x,y)=>({type:'click',x,y});
async function step(label,actions=[],extra={}){const r=await fetch('http://127.0.0.1:3011/command',{method:'POST',headers:{'Content-Type':'application/json','Connection':'close'},body:JSON.stringify({label,actions,...extra})});const j=await r.json();if(j.error)throw Error(j.error);console.log(JSON.stringify({label,file:j.after?.file,closed:j.closed}));}
await step('ADJ-reset',[click(988,755),click(787,455),click(39,39),click(387,755)]);
await step('ADJ-first',[click(550,430),{type:'move',x:1100,y:70}]);
await step('ADJ-neighbor-preview',[click(487,755),{type:'move',x:621,y:430}]);
await step('ADJ-neighbor-place',[click(621,430),{type:'move',x:1100,y:70}]);
await step('ADJ-side',[click(39,99),{type:'drag',x:850,y:350,to_x:1000,to_y:380}]);
await step('END',[],{close:true});
