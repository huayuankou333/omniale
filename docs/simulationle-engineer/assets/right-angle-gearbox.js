/* Frozen evidence viewer. No model calls, telemetry, or external libraries. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url = path => '../../' + path;
  const fixed = (v,n=3) => Number.isFinite(v) ? Number(v).toFixed(n).replace('-', '−') : '未测';
  const modelName = m => `<span class="model-label"><i class="dot ${m.key}"></i> ${esc(m.label)}</span>`;
  const link = (path,label) => `<a href="${url(path)}" download>${label} ↓</a>`;
  const fp = (m,file) => `files/right-angle-gearbox/${m.key}/${file}`;
  let data, selected='sol', traceSelected='sol', traceLimit=8, selectionTicket=0, geometryMode='design';
  const meshes=new Map(), traces=new Map();

  /* Small WebGL viewer: original mesh coordinates in mm; orbit and explode are display only. */
  class CADView {
    constructor(canvas) {
      this.canvas=canvas; this.gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:true});
      if (!this.gl) throw new Error('当前浏览器未启用 WebGL，已显示静态几何预览。');
      const gl=this.gl;
      const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
      const vertex=shader(gl.VERTEX_SHADER,'attribute vec3 p; attribute vec3 n; uniform mat4 m; uniform vec3 offset; varying vec3 normal; void main(){normal=n;gl_Position=m*vec4(p+offset,1.0);}');
      const frag=shader(gl.FRAGMENT_SHADER,'precision mediump float; varying vec3 normal; uniform vec4 color; uniform float lit; void main(){float light=mix(1.0,0.48+0.52*abs(dot(normalize(normal+vec3(0.00001)),normalize(vec3(-0.4,-0.6,0.85)))),lit);gl_FragColor=vec4(color.rgb*light,color.a);}');
      this.program=gl.createProgram();gl.attachShader(this.program,vertex);gl.attachShader(this.program,frag);gl.linkProgram(this.program);
      if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));
      this.loc={};for(const k of ['m','offset','color','lit'])this.loc[k]=gl.getUniformLocation(this.program,k);
      this.loc.p=gl.getAttribLocation(this.program,'p');this.loc.n=gl.getAttribLocation(this.program,'n');
      this.objects=[];this.collision=null;this.chosen=-1;this.explode=0;this.axes=true;this.wire=false;this.showCollision=true;
      this.axesBuffer=this.buffer(this.axisLines(),true);this.preset('iso');
      let pointer=null;
      canvas.addEventListener('pointerdown',e=>{pointer=[e.clientX,e.clientY,e.pointerId];canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});});
      canvas.addEventListener('pointermove',e=>{if(!pointer)return;this.yaw+=(e.clientX-pointer[0])*.008;this.pitch=Math.max(-1.5,Math.min(1.5,this.pitch+(e.clientY-pointer[1])*.007));pointer=[e.clientX,e.clientY,e.pointerId];this.draw();});
      const release=()=>pointer=null;canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
      canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom(Math.exp(e.deltaY*.001));},{passive:false});
      canvas.addEventListener('keydown',e=>{const actions={ArrowLeft:()=>this.yaw-=.12,ArrowRight:()=>this.yaw+=.12,ArrowUp:()=>this.pitch=Math.min(1.5,this.pitch+.12),ArrowDown:()=>this.pitch=Math.max(-1.5,this.pitch-.12),'+':()=>this.zoom(.85),'-':()=>this.zoom(1.15)};if(actions[e.key]){e.preventDefault();actions[e.key]();this.draw();}});
      new ResizeObserver(()=>this.draw()).observe(canvas.parentElement);
    }
    axisLines(){
      const out=[],seg=(a,b)=>out.push(...a,...b);
      seg([12,0,10],[12,0,33]);seg([9,0,18],[48,0,18]);seg([40,-8,18],[40,14,18]);
      const lo=[4,-11,7],hi=[48,11,29];
      for(let axis=0;axis<3;axis++)for(let a=0;a<2;a++)for(let b=0;b<2;b++){
        const p=lo.slice(),q=lo.slice(),others=[0,1,2].filter(x=>x!==axis);p[others[0]]=q[others[0]]=a?hi[others[0]]:lo[others[0]];p[others[1]]=q[others[1]]=b?hi[others[1]]:lo[others[1]];q[axis]=hi[axis];seg(p,q);
      }return out;
    }
    buffer(mesh,lines=false){
      let vertices;
      if(lines){vertices=new Float32Array(mesh.length*2);for(let i=0;i<mesh.length/3;i++)vertices.set(mesh.slice(i*3,i*3+3),i*6);}
      else{
        const p=mesh.positions,ix=mesh.indices;vertices=new Float32Array(ix.length*6);
        for(let i=0;i<ix.length;i+=3){const a=ix[i]*3,b=ix[i+1]*3,c=ix[i+2]*3,u=[p[b]-p[a],p[b+1]-p[a+1],p[b+2]-p[a+2]],v=[p[c]-p[a],p[c+1]-p[a+1],p[c+2]-p[a+2]],n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n)||1;for(let j=0;j<3;j++){const q=ix[i+j]*3;vertices.set([p[q],p[q+1],p[q+2],n[0]/len,n[1]/len,n[2]/len],(i+j)*6);}}
      }
      const gl=this.gl,b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);return {buffer:b,count:vertices.length/6};
    }
    wireBuffer(mesh){const p=mesh.positions,ix=mesh.indices,out=[];for(let i=0;i<ix.length;i+=3)for(let j=0;j<3;j++){const a=ix[i+j]*3,b=ix[i+(j+1)%3]*3;out.push(...p.slice(a,a+3),...p.slice(b,b+3));}return this.buffer(out,true);}
    load(mesh){
      const gl=this.gl;for(const o of this.objects){gl.deleteBuffer(o.buffer);if(o.wire)gl.deleteBuffer(o.wire.buffer);}if(this.collision)gl.deleteBuffer(this.collision.buffer);
      this.objects=mesh.gears.map(m=>({...this.buffer(m),mesh:m,color:hex(m.color),wire:null}));this.collision=mesh.collision?this.buffer(mesh.collision):null;this.chosen=-1;this.draw();
    }
    preset(view){this.yaw=view==='top'?-Math.PI/2:view==='front'?-Math.PI/2:-1.02;this.pitch=view==='top'?1.565:view==='front'?0:.43;this.distance=76;this.draw();}
    zoom(scale){this.distance=Math.max(30,Math.min(180,this.distance*scale));this.draw();}
    draw(){
      if(!this.program)return;const c=this.canvas,gl=this.gl,r=c.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
      gl.viewport(0,0,w,h);gl.clearColor(.918,.941,.902,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(this.program);
      const center=[26,0,18],eye=[center[0]+this.distance*Math.cos(this.pitch)*Math.cos(this.yaw),center[1]+this.distance*Math.cos(this.pitch)*Math.sin(this.yaw),center[2]+this.distance*Math.sin(this.pitch)];
      gl.uniformMatrix4fv(this.loc.m,false,mul(perspective(.62,w/h,1,400),lookAt(eye,center,[0,0,1])));
      const draw=(b,color,off=[0,0,0],lines=false)=>{gl.bindBuffer(gl.ARRAY_BUFFER,b.buffer);gl.enableVertexAttribArray(this.loc.p);gl.enableVertexAttribArray(this.loc.n);gl.vertexAttribPointer(this.loc.p,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(this.loc.n,3,gl.FLOAT,false,24,12);gl.uniform3fv(this.loc.offset,off);gl.uniform4fv(this.loc.color,color);gl.uniform1f(this.loc.lit,lines?0:1);gl.drawArrays(lines?gl.LINES:gl.TRIANGLES,0,b.count);};
      if(this.axes)draw(this.axesBuffer,[.52,.64,.49,.45],[0,0,0],true);
      const offsets=[[0,0,1],[ -1,0,0],[1,0,0],[0,1,0]];
      this.objects.forEach((o,i)=>{const role=o.mesh.name.includes('输出')?3:i,off=offsets[role].map(v=>v*this.explode*.13),color=[...o.color,this.chosen<0||this.chosen===i?1:.23];draw(o,color,off);if(this.wire){if(!o.wire)o.wire=this.wireBuffer(o.mesh);draw(o.wire,[.16,.29,.25,.18],off,true);}});
      if(this.collision&&this.showCollision&&this.explode===0){gl.disable(gl.DEPTH_TEST);draw(this.collision,[.77,.2,.13,.78]);gl.enable(gl.DEPTH_TEST);}
      c.dataset.ready='true';
    }
  }
  function hex(h){return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);}
  function mul(a,b){const c=new Float32Array(16);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)c[j*4+i]+=a[k*4+i]*b[j*4+k];return c;}
  function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
  function lookAt(eye,center,up){const norm=a=>{const l=Math.hypot(...a);return a.map(v=>v/l);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),z=norm(eye.map((v,i)=>v-center[i])),x=norm(cross(up,z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
  let viewer;

  async function chooseModel(key,keepMode=false){
    if(!keepMode)geometryMode='design';
    selected=key;const ticket=++selectionTicket,reference=key==='reference',m=reference?{...data.reference,key,label:'校准参考解'}:data.models.find(m=>m.key===key);
    document.querySelectorAll('#model-tabs button').forEach(b=>{b.classList.toggle('active',b.dataset.model===key);b.setAttribute('aria-pressed',b.dataset.model===key);});
    $('viewer-poster').src=url(m.preview);$('viewer-poster').alt=m.label+' 的冻结几何静态渲染';$('viewer-poster').hidden=false;$('cad-canvas').hidden=true;$('viewer-loading').hidden=false;
    const verifier=key==='sol'&&geometryMode==='verifier',meshKey=verifier?'sol-verifier':key,meshPath=verifier?'assets/right-angle-gearbox/sol-verifier-mesh.json':m.mesh;
    if(verifier){$('viewer-poster').src=url('assets/right-angle-gearbox/sol-verifier-iso.png');$('viewer-poster').alt='Sol 正式验收 STL 的三个齿轮，缺少复合轴小齿轮';}
    $('geometry-mode').hidden=key!=='sol';document.querySelectorAll('[data-geometry]').forEach(b=>{b.classList.toggle('active',b.dataset.geometry===geometryMode);b.setAttribute('aria-pressed',b.dataset.geometry===geometryMode);});
    $('viewer-tag').textContent=reference?'CALIBRATION REFERENCE':key==='luna'?'PARAMETER RECONSTRUCTION':key==='sol'&&!verifier?'FROZEN POLYGON SURFACES':'FROZEN VERIFIER STL';
    $('source-download').hidden=reference;$('source-download').href=url(fp(m,'final.py'));
    $('source-hash').textContent=reference?'校准参考解 · 仅用于验证评分器可运行，不属于受测成果。':'final.py SHA-256: '+m.final_sha256;
    $('source-code').textContent=reference?'参考解只提供原始验收 STL 和可视化来源，不混入 Agent 交付。':'正在载入冻结 final.py…';
    if(!reference)fetch(url(fp(m,'final.py'))).then(r=>r.text()).then(t=>{if(selected===key)$('source-code').textContent=t;}).catch(()=>{$('source-code').textContent='载入失败，可通过下载链接查看源文件。';});
    $('collision-control').hidden=key!=='luna';$('explode').value=0;$('explode-value').textContent='0%';
    const prov=$('viewer-provenance');prov.classList.toggle('approx',key==='luna'||key==='sol');prov.innerHTML=key==='luna'?'<strong>冻结代码参数重建 · 非原 CAD 导出</strong><span>0.16 mm 采样；红色为近似穿插形状，体积来自原 CAD 布尔检查。</span>':key==='sol'?verifier?'<strong>正式验收 STL · 实际只含 3 个齿轮</strong><span>复合轴小齿轮未出现在导出网格中；未补齐或修复。</span>':'<strong>冻结程序的多边形曲面重建 · 4 个齿轮</strong><span>直接保留 final.py 中的多边形顶点，四实体包围盒与原 CAD 诊断一致（误差 &lt; 10⁻⁶ mm）。</span>':reference?'<strong>原验收器 STL · 校准参考解</strong><span>用于确认目标可实现；不计入三个模型的比较。</span>':'<strong>原验收器导出的最终 STL</strong><span>保持冻结坐标；复合轴的两个连通实体分别着色。</span>';
    $('source-provenance').textContent=key==='luna'?'本地没有 Luna 的验收 STL，因为它在穿插门槛即被拒绝。此视图按冻结 final.py 中的锥体、齿块与孔参数重建，0.16 mm 采样，不能用来重新计算官方指标。':key==='sol'?'交付视图保留源程序生成的多边形曲面顶点并在原位三角化；不是重新运行 Build123D 的原生导出。验收视图直接载入冻结 STL。两者在复合轴小齿轮处不一致；本页不修复网格、不重新评分。':'网格直接来自正式验收工件，未重做齿形、修复碰撞或改变安装位置。网页分解只改变显示。';
    $('model-artifact-stats').innerHTML=reference?stat('0.9771','参考功能分')+stat('−15.116','输出 rpm')+stat('4','齿轮实体')+stat('校准','非受测模型'):stat(fixed(m.score,4),'原始功能分')+stat(m.simulation?fixed(m.simulation.output_rpm,3):'未进入','输出 rpm / 运动仿真')+stat(`${m.responses} / 36`,'实际回复 / 上限')+stat(fixed(m.minutes,1)+' min','开发计费时间');
    try{
      if(!meshes.has(meshKey)){const r=await fetch(url(meshPath));if(!r.ok)throw new Error('几何文件载入失败');meshes.set(meshKey,await r.json());}
      if(ticket!==selectionTicket)return;const mesh=meshes.get(meshKey);renderInspector(m,mesh);
      if(viewer){viewer.explode=0;viewer.load(mesh);$('viewer-poster').hidden=true;$('cad-canvas').hidden=false;viewer.draw();$('viewer-hint').textContent='拖动旋转 · 滚轮缩放 · 方向键调整';}
    }catch(e){$('cad-inspector').innerHTML=`<p>${esc(e.message)}</p>`;$('viewer-hint').textContent='静态预览 · 原样文件可在证据区下载';}
    finally{if(ticket===selectionTicket)$('viewer-loading').hidden=true;}
  }
  const stat=(value,label)=>`<div><b>${value}</b><span>${label}</span></div>`;
  function renderInspector(m,mesh){
    $('cad-inspector').innerHTML=`<span class="eyebrow">${m.key==='reference'?'CALIBRATION ONLY':'FROZEN DELIVERABLE'}</span><h3>${esc(m.label)}</h3><p>选择齿轮查看安装方向与尺寸。</p><div class="gear-select"><button class="active" data-gear="-1">查看全部 ${mesh.gears.length} 个齿轮</button>${mesh.gears.map((g,i)=>`<button data-gear="${i}"><i style="background:${g.color}"></i>${esc(g.name)}</button>`).join('')}</div><dl class="gear-stats" id="gear-stats"></dl><div class="inspector-note">${m.key==='luna'?'穿插：输入齿轮 ↔ 复合轴大齿轮。精确相交体积 72.160 mm³。':m.key==='sol'?'记录输出 0 rpm；验收 STL 缺少复合轴小齿轮，归因受此不一致限制。':m.key==='ds'?'几何门槛通过；输出约 −1.781 rpm，目标约 −15 rpm。':'原版参考设计；功能分 0.9771，输出约 −15.116 rpm。'}</div>`;
    const inspect=i=>{if(viewer){viewer.chosen=i;viewer.draw();}document.querySelectorAll('[data-gear]').forEach(b=>b.classList.toggle('active',Number(b.dataset.gear)===i));const g=mesh.gears[i];$('gear-stats').innerHTML=g?g.bounds[0].map((v,j)=>`<div><dt>${['X','Y','Z'][j]} 范围 mm</dt><dd>${fixed(v,2)}…${fixed(g.bounds[1][j],2)}</dd></div>`).join('')+`<div><dt>显示三角面</dt><dd>${(g.indices.length/3).toLocaleString()}</dd></div>`:`<div><dt>显示齿轮 / 轴</dt><dd>${mesh.gears.length} / 3</dd></div><div><dt>显示来源</dt><dd>${mesh.kind==='verifier-stl'?'验收 STL':'源程序重建'}</dd></div><div><dt>几何单位</dt><dd>mm</dd></div>`;};
    document.querySelectorAll('[data-gear]').forEach(b=>b.addEventListener('click',()=>inspect(Number(b.dataset.gear))));inspect(-1);
  }
  function renderScores(){
    const captions=['几何穿插 · 未进入运动仿真','输出静止 · 验收网格不一致','转速未达标 · 用满回复预算'];
    $('hero-scores').innerHTML=data.models.map((m,i)=>`<div class="gb-score"><div>${modelName(m)}<p>${captions[i]}</p></div><strong>${fixed(m.score,4)}</strong></div>`).join('');
    $('usage-table').innerHTML=`<table class="gb-table"><caption>模型实际使用情况 · 限额不是实际使用量</caption><thead><tr><th>模型</th><th>开发时间</th><th>回复 / 工具</th><th>正式快照</th><th>输出 token</th><th>开发工具观察</th><th>结束原因</th></tr></thead><tbody>${data.models.map(m=>`<tr><td>${esc(m.label)}</td><td>${fixed(m.minutes,1)} min</td><td>${m.responses} / ${m.tools}</td><td>${m.candidates} / 3</td><td>${m.output_tokens.toLocaleString()}</td><td>终端 ${m.terminal_calls} · 读图 ${m.read_images} · 静态检查 ${m.public_checks}</td><td>${m.stop_reason==='explicit_finish'?'主动 finish':'回复上限'}</td></tr>`).join('')}</tbody></table>`;
  }
  const checkpoints=[
    {title:'自包含交付 / 受限执行',type:'正式构建门槛',desc:'仅将冻结 final.py 交给独立验收器，在受限命名空间重新执行。',states:['pass','pass','pass'],values:['构建成功','构建成功','构建成功'],evidence:'official-result.json',details:['有效执行并构建 part。构建不代表几何或传动达标。','自包含程序被原版评分器成功加载。','此前 reversed 执行失败已消除；本轮最终代码成功构建。']},
    {title:'4 个有效齿轮实体',type:'静态几何诊断',desc:'检查有效实体数、CAD 有效性与基本结构，不以检查项数量累计功能分。',states:['pass','pass','pass'],values:['4 / 4 有效','4 / 4 有效','4 / 4 有效'],evidence:'geometry.json',details:['四个实体均有效。','四个实体均有效。','四个实体均有效。']},
    {title:'按轴分配 1 + 2 + 1',type:'正式轴系选择 / 公开静态诊断',desc:'按全局包围盒最短方向推断轴向，再检查安装段等规则。复合轴两齿轮刚性联动。',states:['pass','pass','pass'],values:['input 1 · compound 2 · output 1','input 1 · compound 2 · output 1','input 1 · compound 2 · output 1'],evidence:'geometry.json',details:['无游离实体，分轴正确。','无游离实体，分轴正确。','无游离实体，分轴正确。']},
    {title:'公开总包络',type:'公开辅助诊断',desc:'检查 x[4,48]、y[−11,11]、z[7,29] mm；这是题面辅助检查，不是额外官方奖励项。',states:['pass','pass','pass'],values:['包络内','包络内','包络内'],evidence:'geometry.json',details:['public_envelope_satisfied = true。','public_envelope_satisfied = true。','public_envelope_satisfied = true。']},
    {title:'初始无穿插',type:'正式动力学前置门槛',desc:'原 CAD 布尔检查中，任意一对相交体积超过 10⁻⁴ mm³ 即阻断后续运动仿真。',states:['fail','pass','pass'],values:['72.160 mm³ 相交','无初始相交','无初始相交'],evidence:'geometry.json',details:['输入与复合轴大齿轮相交 72.159994167 mm³；其余五对为 0。','最终六对实体的相交体积均为 0。','最终六对实体的相交体积均为 0。']},
    {title:'进入原版 Blender 仿真',type:'正式独立验收阶段',desc:'几何门槛通过才运行接触动力学。这里标记是否执行，不代表功能通过。',states:['blocked','pass','pass'],values:['被穿插门槛阻断','已执行 · 150 帧','已执行 · 150 帧'],evidence:'official-result.json',details:['simulation = null；没有实测输出转速。','完整运行，无 sim_error；输出轴仍为静止。','完整运行，无 sim_error；输出速度与目标偏离。']},
    {title:'复合轴两齿轮出现在验收 STL',type:'新增资产审计 / 非原评分项',desc:'复核正式 compound STL 的连通组件与坐标覆盖。Sol 的网格缺少第二级小齿轮；其原始动力学分数的解释受限。',states:['blocked','fail','pass'],values:['未导出验收网格','仅包含大齿轮','两齿轮均存在'],evidence:'visual-provenance.json',details:['Luna 在穿插门槛即停止，没有正式仿真 STL。','正式 compound STL 的最大 x 仅 19.948 mm，未覆盖 CAD 小齿轮所在的 x=32.754…35.426 mm。','compound STL 有两个独立连通组件，对应第一级大齿轮与第二级小齿轮。']},
    {title:'目标输出约 −15 rpm',type:'正式方向与速度指标',desc:'目标方向为负、转速约 15 rpm。功能分连续计分，原任务没有统一二值通过线。',states:['blocked','fail','fail'],values:['未测','0.000 rpm','−1.781 rpm'],evidence:'official-result.json',details:['不可将上游阻断写成输出 0 rpm。','direction_score = 0；speed_score = 0；engaged = 0。','direction_score = 1；speed_score = 0；engaged = 0。']}
  ];
  function renderChecks(){
    const stateLabel={pass:'✓',fail:'×',blocked:'—'};
    $('checks-body').innerHTML=checkpoints.map((c,i)=>`<tr data-check="${i}"><td><button><span class="check-title">${c.title}</span><span class="check-type">${c.type}</span></button></td>${c.states.map((s,j)=>`<td><span class="state ${s}">${stateLabel[s]} ${c.values[j]}</span></td>`).join('')}</tr>`).join('');
    const select=i=>{document.querySelectorAll('[data-check]').forEach(r=>r.classList.toggle('selected',Number(r.dataset.check)===i));const c=checkpoints[i];$('check-detail').innerHTML=`<span class="eyebrow">CHECK ${String(i+1).padStart(2,'0')} / ${c.type}</span><h3>${c.title}</h3><p>${c.desc}</p><div class="check-evidence">${data.models.map((m,j)=>`<div><b>${esc(m.label)}</b><p>${c.details[j]}</p>${link(fp(m,c.evidence),'查看原始证据')}</div>`).join('')}</div>`;};
    document.querySelectorAll('[data-check]').forEach(r=>r.addEventListener('click',()=>select(Number(r.dataset.check))));select(4);
  }
  function renderDynamics(){
    const labels=['GPT-6 Luna','GPT-6.1 Sol','DPSK Flash 1017','参考解 · 非受测'],values=[null,0,data.models[2].simulation.output_rpm,data.reference.simulation.output_rpm],left=162,right=474,scale=(right-left)/18,target=left+15*scale;
    $('rpm-chart').innerHTML=`<svg viewBox="0 0 540 275" role="img" aria-label="输出转速：Luna 未测，Sol 0，DPSK 负1.781，参考解负15.116，目标负15 rpm"><line x1="${target}" x2="${target}" y1="35" y2="229" stroke="#8b9e7e" stroke-dasharray="4 4"/><text x="${target}" y="22" text-anchor="middle" font-size="10" fill="#6a8567">目标 −15</text>${[0,5,10,15].map(v=>`<line x1="${left+v*scale}" x2="${left+v*scale}" y1="40" y2="230" stroke="#e0e6d7"/><text x="${left+v*scale}" y="253" font-size="10" text-anchor="middle" fill="#8c9983">${v?'−'+v:0}</text>`).join('')}${values.map((v,i)=>{const y=63+i*48;return `<text x="0" y="${y+4}" font-size="11" fill="#59705c">${labels[i]}</text>${v===null?`<text x="${left+5}" y="${y+4}" font-size="11" fill="#98a38e">未进入仿真</text>`:`<rect x="${left}" y="${y-9}" width="${Math.max(2,Math.abs(v)*scale)}" height="18" rx="3" fill="${i===3?'#b3c2a2':'#558878'}"/><text x="${left+Math.abs(v)*scale+9}" y="${y+4}" font-size="10" fill="#55705a">${fixed(v,3)}</text>`}`;}).join('')}<text x="474" y="272" font-size="9" text-anchor="end" fill="#8c9983">负方向转速 / rpm</text></svg>`;
    $('score-breakdown').innerHTML=data.models.map(m=>{const s=m.simulation,parts=s?[.25*s.engaged,.25*(1-s.stop_fraction),.5*s.speed_score*s.direction_score]:[0,0,0];return `<div class="score-component"><div class="component-head"><span>${esc(m.label)}</span><b>${fixed(m.score,4)}</b></div><div class="component-bar" role="img" aria-label="功能分 ${m.score}">${parts.map((v,i)=>`<span style="width:${v*100}%;background:${['#5c9185','#b9c39b','#6b86aa'][i]}"></span>`).join('')}</div><div class="component-note">${s?`啮合 ${fixed(parts[0],4)} · 连续性 ${fixed(parts[1],4)} · 方向×速度 ${fixed(parts[2],4)}`:'几何门槛拒绝；没有动力学分项'}</div></div>`;}).join('');
    $('transfer-cards').innerHTML=data.models.filter(m=>m.simulation).map(m=>{const s=m.simulation;return `<article class="transfer-card"><div class="transfer-head">${modelName(m)}<span>汇总测量 · rpm</span></div><div class="transfer-route"><div><span>输入 Z</span><b>${fixed(s.input_rpm_measured,2)}</b></div><i>→</i><div><span>复合 X</span><b>${fixed(s.mid_rpm,2)}</b></div><i>→</i><div><span>输出 Y</span><b>${fixed(s.output_rpm,2)}</b></div></div><p class="gb-fine">engaged ${s.engaged} · speed_score ${s.speed_score} · direction_score ${s.direction_score} · stop_fraction ${fixed(s.stop_fraction,4)}</p></article>`;}).join('');
  }
  function renderFailures(){
    const content=[
      {title:'几何成立，安装时穿插',stage:'初始几何门槛',metric:'72.160 mm³',metricNote:'输入齿轮与复合轴大齿轮的相交体积',fact:'最终四实体有效、分轴和包络均正确，但第一级齿轮存在显著初始相交。原评分器因此返回 intersecting_bodies，未进入运动仿真。',analysis:'模型已经收到公开检查器的穿插反馈，仍在第 4 次回复主动结束。能确认交付没有排除碰撞；这次轨迹并未用尽预算。',quote:'模型结束摘要承认第一级存在相交，同时称没有仿真评测器可用。此为模型陈述；正式验收仍会独立运行。'},
      {title:'验收少了一个复合轴齿轮',stage:'新增资产一致性审计',metric:'4 → 3',metricNote:'CAD 记录四实体，正式仿真 STL 只覆盖三个齿轮',fact:'冻结 CAD 诊断包含位于 x=32.754…35.426 mm 的复合轴小齿轮，但正式 compound STL 的 x 范围只有 16.042…19.948 mm。记录的输出为 0 rpm。',analysis:'这一不一致直接限制失败归因：不能把当前动力学结果完整视为四齿轮交付的性能，也不能断言是模型齿形设计失败。缺失发生的具体环节仍未确认；本页保留原分数，未补齐网格或重新验收。',quote:'27 次回复、27 次工具调用后主动 finish。可在交互视图切换“冻结程序几何 / 正式验收网格”，并下载原 STL 与审计数据核对。'},
      {title:'输出在动，速度远离目标',stage:'接触动力学阶段',metric:'−1.781 rpm',metricNote:'目标约 −15 rpm；方向对，速度指标仍为 0',fact:'最终无初始相交，进入原版仿真。engaged = 0、speed_score = 0，direction_score = 1；原始功能分为 0.248322。',analysis:'全部得分来自 0.25 × (1 − stop_fraction)。它表示评分器的连续性项得到部分分，不能解释为有效啮合或目标传动已完成。',quote:'36 次回复、35 次工具调用，用满回复预算；最终评分对应冻结交付，不选择历史最好版本。'}
    ];
    $('failure-cards').innerHTML=data.models.map((m,i)=>{const c=content[i];return `<article class="failure-card ${m.key}">${modelName(m)}<span class="failure-stage">${c.stage}</span><h3>${c.title}</h3><div class="failure-metric">${c.metric}<small>${c.metricNote}</small></div><p><b>实测证据</b> ${c.fact}</p><p><b>分析</b> ${c.analysis}</p><blockquote>${c.quote}</blockquote>${link(fp(m,'official-result.json'),'正式验收结果')} · ${link(fp(m,'final.py'),'冻结代码')}</article>`;}).join('');
  }
  function renderVideos(){
    const list=[...data.models.filter(m=>m.video),{...data.reference,key:'reference',label:'校准参考解 · 非受测'}];
    $('official-videos').innerHTML=list.map(m=>`<figure><div class="chart-header"><h3>${esc(m.label)}</h3></div><video controls playsinline preload="metadata" poster="${url(m.preview)}" src="${url(m.video)}" aria-label="${esc(m.label)} 的原版正式验收录像"></video><figcaption>${m.key==='sol'?'原验收录像。复合轴小齿轮未出现在仿真网格中，和四实体交付存在不一致。':m.key==='ds'?'原验收录像。动态结果以正式 JSON 汇总指标为准。':'原版参考解验收录像，用于校准环境；不计入模型比较。'} ${link(m.video,'下载 MP4')}</figcaption></figure>`).join('');
  }
  async function chooseTrace(key){
    traceSelected=key;traceLimit=8;$('trace-search').value='';document.querySelectorAll('#trace-tabs button').forEach(b=>{b.classList.toggle('active',b.dataset.model===key);b.setAttribute('aria-pressed',b.dataset.model===key);});
    const m=data.models.find(x=>x.key===key);$('trace-list').textContent='正在载入工具记录…';$('trace-download').href=url(m.activities_file);
    try{if(!traces.has(key)){const r=await fetch(url(m.activities_file));if(!r.ok)throw new Error('轨迹载入失败');traces.set(key,await r.json());}if(traceSelected===key)renderTrace();}catch(e){$('trace-list').textContent=e.message;}
    $('agent-images').innerHTML=m.images.length?m.images.map(img=>`<figure><a href="${url(img.path)}" target="_blank" rel="noopener"><img loading="lazy" src="${url(img.path)}" alt="${esc(m.label)} 开发中读过的 ${esc(img.name)}"></a><figcaption>回复 ${img.turn} · ${esc(img.name)}<br>${esc(img.caption)}</figcaption></figure>`).join(''):'<p class="gb-fine">此模型没有通过 read_image 读入的开发图像。最终交付请查看上方几何视图。</p>';
  }
  function renderTrace(){
    const all=traces.get(traceSelected)||[],q=$('trace-search').value.trim().toLowerCase(),found=all.filter(a=>!q||JSON.stringify(a).toLowerCase().includes(q));
    $('trace-count').textContent=`${found.length} 条匹配 / ${all.length} 条工具记录 · 展示命令和工具返回`;
    $('trace-list').innerHTML=found.slice(0,traceLimit).map(a=>{const cmd=a.arguments.command??a.arguments.cmd??a.arguments.path??a.arguments.summary??JSON.stringify(a.arguments);return `<details class="gb-trace"><summary><span class="trace-turn">R${String(a.turn).padStart(2,'0')}</span><span class="trace-name">${esc(a.name)}</span><span class="trace-command">${esc(cmd)}</span></summary><h4>工具参数</h4><pre>${esc(JSON.stringify(a.arguments,null,2))}</pre><h4>原始工具返回</h4><pre>${esc(typeof a.result==='string'?a.result:JSON.stringify(a.result,null,2))}</pre></details>`;}).join('')||'<p class="empty-traces">没有匹配的工具记录。</p>';
    $('more-traces').hidden=found.length<=traceLimit;
  }
  function renderDownloads(){
    $('downloads').innerHTML=data.models.map(m=>`<article class="download-model"><h3>${modelName(m)}</h3>${[['final.py','冻结源程序'],['geometry.json','公开静态诊断'],['official-result.json','正式验收结果'],['grading.json','原评分记录'],['trajectory.json','工具轨迹'],['visual-provenance.json','可视化来源']].map(([f,label])=>link(fp(m,f),label)).join('')}${m.key!=='luna'?['input','compound','output'].map(s=>link(fp(m,`functional_candidate_${s}.stl`),`${s} 原验收 STL`)).join(''):''}</article>`).join('');
    const reasons=['跨轴实体 component_bridges_multiple_axes','缺少轴系实体 missing_axis_components','受限执行缺少 reversed'];
    $('history-table').innerHTML=`<div class="gb-table-wrap"><table class="gb-table"><caption>旧轮诊断对照 · 不覆盖本轮主结果</caption><thead><tr><th>模型</th><th>旧轮功能分</th><th>旧轮失败</th><th>本轮功能分</th><th>本轮失败</th></tr></thead><tbody>${data.models.map((m,i)=>`<tr><td>${esc(m.label)}</td><td>0.0000</td><td>${reasons[i]}</td><td>${fixed(m.score,4)}</td><td>${['初始实体穿插','输出静止','输出速度未达标'][i]}</td></tr>`).join('')}</tbody></table></div>`;
  }
  async function init(){
    try{
      const r=await fetch('../../data/right-angle-gearbox.json');if(!r.ok)throw new Error('数据文件载入失败');data=await r.json();
      renderScores();renderChecks();renderDynamics();renderFailures();renderDownloads();renderVideos();
      try{viewer=new CADView($('cad-canvas'));}catch(e){$('viewer-hint').textContent=e.message;}
      document.querySelectorAll('#model-tabs button').forEach(b=>b.addEventListener('click',()=>chooseModel(b.dataset.model)));
      document.querySelectorAll('[data-geometry]').forEach(b=>b.addEventListener('click',()=>{geometryMode=b.dataset.geometry;chooseModel(selected,true);}));
      document.querySelectorAll('#trace-tabs button').forEach(b=>b.addEventListener('click',()=>chooseTrace(b.dataset.model)));
      document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));viewer?.preset(b.dataset.view);}));
      $('zoom-out').addEventListener('click',()=>viewer?.zoom(1.18));$('zoom-in').addEventListener('click',()=>viewer?.zoom(.85));
      $('show-axes').addEventListener('change',e=>{if(viewer){viewer.axes=e.target.checked;viewer.draw();}});$('show-wire').addEventListener('change',e=>{if(viewer){viewer.wire=e.target.checked;viewer.draw();}});$('show-collision').addEventListener('change',e=>{if(viewer){viewer.showCollision=e.target.checked;viewer.draw();}});
      $('explode').addEventListener('input',e=>{$('explode-value').textContent=e.target.value+'%';if(viewer){viewer.explode=Number(e.target.value);viewer.draw();}});
      $('reset-view').addEventListener('click',()=>{$('show-axes').checked=true;$('show-wire').checked=false;$('show-collision').checked=true;$('explode').value=0;$('explode-value').textContent='0%';document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view==='iso'));if(viewer){viewer.axes=true;viewer.wire=false;viewer.showCollision=true;viewer.explode=0;viewer.chosen=-1;viewer.preset('iso');}document.querySelector('[data-gear="-1"]')?.click();});
      $('trace-search').addEventListener('input',()=>{traceLimit=8;renderTrace();});$('more-traces').addEventListener('click',()=>{traceLimit+=12;renderTrace();});
      await Promise.all([chooseModel('sol'),chooseTrace('sol')]);document.body.dataset.loaded='true';
    }catch(e){$('page-error').hidden=false;$('page-error').textContent='页面数据暂未载入：'+e.message+'。请通过 HTTP 预览或下载完整评测报告。';}
  }
  init();
})();
