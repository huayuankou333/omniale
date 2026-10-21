import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ---------- constants ---------- */
const GRID = 16;                 // studs per side
const BRICK_H = 1.1;             // brick body height
const STUD_R = 0.30, STUD_H = 0.20;
const HALF = GRID / 2;           // 8

const COLORS = [
  { name: 'Red',        hex: 0xe0322d },
  { name: 'Orange',     hex: 0xf59e42 },
  { name: 'Yellow',     hex: 0xf7d038 },
  { name: 'Green',      hex: 0x37a35b },
  { name: 'Light Blue', hex: 0x45b8f0 },
  { name: 'Blue',       hex: 0x5b6ee1 },
  { name: 'Purple',     hex: 0x9b4dca },
  { name: 'Gray',       hex: 0x6e6e78 },
];

/* ---------- state ---------- */
let mode = 'place';              // place | move | erase
let colorIdx = 0;
let width = 2, depth = 2;
let playing = false;
const bricks = [];               // {mesh, i, j, layer, w, d}
const occ = new Map();           // "i,j,layer" -> brick
const key = (i, j, l) => i + ',' + j + ',' + l;

/* ---------- renderer / scene ---------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfcfd6);
scene.fog = new THREE.Fog(0xcfcfd6, 60, 120);

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
camera.position.set(3, 19, 21);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.6, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 7;
controls.maxDistance = 60;
controls.maxPolarAngle = Math.PI * 0.49;
controls.enabled = false;

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9aa4, 1.15));
const sun = new THREE.DirectionalLight(0xffffff, 1.9);
sun.position.set(10, 20, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = sun.shadow.camera.bottom = -16;
sun.shadow.camera.right = sun.shadow.camera.top = 16;
sun.shadow.camera.far = 60;
sun.shadow.bias = -0.0004;
scene.add(sun);

/* ---------- marble ground ---------- */
function marbleTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#cdccd4';
  g.fillRect(0, 0, 512, 512);
  for (let n = 0; n < 26; n++) {
    g.strokeStyle = `rgba(120,118,130,${0.05 + Math.random() * 0.07})`;
    g.lineWidth = 0.6 + Math.random() * 1.4;
    g.beginPath();
    let x = Math.random() * 512, y = Math.random() * 512;
    g.moveTo(x, y);
    for (let s = 0; s < 5; s++) {
      x += (Math.random() - 0.5) * 260; y += (Math.random() - 0.5) * 260;
      g.quadraticCurveTo(x + (Math.random() - .5) * 80, y + (Math.random() - .5) * 80, x, y);
    }
    g.stroke();
  }
  for (let n = 0; n < 900; n++) {
    g.fillStyle = `rgba(110,108,120,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4);
  return t;
}
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ map: marbleTexture(), roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.45;
ground.receiveShadow = true;
scene.add(ground);

/* ---------- baseplate ---------- */
const plateGroup = new THREE.Group();
scene.add(plateGroup);
const plateMat = new THREE.MeshStandardMaterial({ color: 0xd8d9e2, roughness: 0.55 });
const plate = new THREE.Mesh(new THREE.BoxGeometry(GRID, 0.4, GRID), plateMat);
plate.position.y = -0.2;
plate.receiveShadow = true;
plateGroup.add(plate);

{
  const studGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.16, 18);
  const inst = new THREE.InstancedMesh(studGeo, plateMat, GRID * GRID);
  const m = new THREE.Matrix4();
  let k = 0;
  for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
    m.setPosition(i - HALF + 0.5, 0.08, j - HALF + 0.5);
    inst.setMatrixAt(k++, m);
  }
  inst.receiveShadow = true;
  plateGroup.add(inst);
}
// invisible top plane for raycast
const plateTop = new THREE.Mesh(
  new THREE.PlaneGeometry(GRID, GRID),
  new THREE.MeshBasicMaterial({ visible: false })
);
plateTop.rotation.x = -Math.PI / 2;
plateTop.userData.isPlate = true;
scene.add(plateTop);

/* ---------- brick factory ---------- */
const matCache = new Map();
function brickMat(hex) {
  if (!matCache.has(hex))
    matCache.set(hex, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.32, metalness: 0.02 }));
  return matCache.get(hex);
}

function buildBrickMesh(w, d, mat) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, BRICK_H, d - 0.06), mat);
  body.position.y = BRICK_H / 2;
  g.add(body);
  const studGeo = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 20);
  for (let a = 0; a < w; a++) for (let b = 0; b < d; b++) {
    const s = new THREE.Mesh(studGeo, mat);
    s.position.set(a - (w - 1) / 2, BRICK_H + STUD_H / 2, b - (d - 1) / 2);
    g.add(s);
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

function canPlace(i, j, layer, w, d) {
  if (i < 0 || j < 0 || i + w > GRID || j + d > GRID || layer > 24) return false;
  for (let a = i; a < i + w; a++) for (let b = j; b < j + d; b++)
    if (occ.has(key(a, b, layer))) return false;
  return true;
}

function addBrick(i, j, layer, w, d, hex) {
  const mesh = buildBrickMesh(w, d, brickMat(hex));
  mesh.position.set(
    i + (w - 1) / 2 - HALF + 0.5,
    layer * BRICK_H,
    j + (d - 1) / 2 - HALF + 0.5
  );
  const brick = { mesh, i, j, layer, w, d, hex };
  mesh.traverse(o => o.userData.brick = brick);
  scene.add(mesh);
  bricks.push(brick);
  for (let a = i; a < i + w; a++) for (let b = j; b < j + d; b++) occ.set(key(a, b, layer), brick);
  return brick;
}

function removeBrick(brick) {
  scene.remove(brick.mesh);
  const idx = bricks.indexOf(brick);
  if (idx >= 0) bricks.splice(idx, 1);
  for (let a = brick.i; a < brick.i + brick.w; a++)
    for (let b = brick.j; b < brick.j + brick.d; b++)
      occ.delete(key(a, b, brick.layer));
}

function clearAll() { [...bricks].forEach(removeBrick); }

/* ---------- ghost preview ---------- */
const ghostMat = new THREE.MeshStandardMaterial({
  color: 0xffe27a, transparent: true, opacity: 0.55, roughness: 0.4, depthWrite: false
});
let ghost = null;
let ghostSpot = null; // {i,j,layer}

function refreshGhostMesh() {
  if (ghost) scene.remove(ghost);
  ghost = buildBrickMesh(width, depth, ghostMat);
  ghost.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  ghost.visible = false;
  scene.add(ghost);
  ghostSpot = null;
}
refreshGhostMesh();

/* ---------- raycasting ---------- */
const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredErase = null;

function setRayFromEvent(e) {
  const r = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(mouse, camera);
}

function computeSpot(e) {
  setRayFromEvent(e);
  const targets = [plateTop, ...bricks.map(b => b.mesh)];
  const hits = ray.intersectObjects(targets, true);
  for (const h of hits) {
    const b = h.object.userData.brick;
    const p = h.point;
    const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
    if (!b) return { i: Math.floor(p.x + HALF), j: Math.floor(p.z + HALF), layer: 0 };
    if (n.y > 0.5) return { i: Math.floor(p.x + HALF), j: Math.floor(p.z + HALF), layer: b.layer + 1 };
    return { i: Math.floor(p.x + n.x * 0.5 + HALF), j: Math.floor(p.z + n.z * 0.5 + HALF), layer: b.layer };
  }
  return null;
}

function updateGhost(e) {
  if (mode !== 'place' || playing) { ghost.visible = false; ghostSpot = null; return; }
  const spot = computeSpot(e);
  if (spot && canPlace(spot.i, spot.j, spot.layer, width, depth)) {
    ghostSpot = spot;
    ghost.position.set(
      spot.i + (width - 1) / 2 - HALF + 0.5,
      spot.layer * BRICK_H,
      spot.j + (depth - 1) / 2 - HALF + 0.5
    );
    ghost.visible = true;
  } else {
    ghost.visible = false;
    ghostSpot = null;
  }
}

function clearEraseHover() {
  if (hoveredErase) {
    hoveredErase.mesh.traverse(o => { if (o.isMesh) o.material.emissive?.setHex(0); });
    hoveredErase = null;
  }
}

function updateEraseHover(e) {
  clearEraseHover();
  canvas.style.cursor = '';
  if (mode !== 'erase' || playing) return;
  setRayFromEvent(e);
  const hits = ray.intersectObjects(bricks.map(b => b.mesh), true);
  if (hits.length) {
    hoveredErase = hits[0].object.userData.brick;
    hoveredErase.mesh.traverse(o => { if (o.isMesh && o.material.emissive) o.material.emissive.setHex(0x555555); });
    canvas.style.cursor = 'pointer';
  }
}

/* ---------- pointer events ---------- */
canvas.addEventListener('pointermove', e => {
  if (mode === 'place') updateGhost(e);
  else if (mode === 'erase') updateEraseHover(e);
});
canvas.addEventListener('pointerdown', e => {
  if (e.button !== 0 || playing) return;
  if (mode === 'place') {
    updateGhost(e);
    if (ghostSpot && ghost.visible) {
      addBrick(ghostSpot.i, ghostSpot.j, ghostSpot.layer, width, depth, COLORS[colorIdx].hex);
      updateGhost(e);
    }
  } else if (mode === 'erase') {
    updateEraseHover(e);
    if (hoveredErase) {
      const b = hoveredErase;
      clearEraseHover();
      removeBrick(b);
    }
  }
});
canvas.addEventListener('pointerleave', () => {
  ghost.visible = false; ghostSpot = null; clearEraseHover();
});

/* ---------- modes ---------- */
const modeBtns = { place: document.getElementById('mPlace'), move: document.getElementById('mMove'), erase: document.getElementById('mErase') };
function setMode(m) {
  mode = m;
  for (const k in modeBtns) modeBtns[k].classList.toggle('active', k === m);
  controls.enabled = (m === 'move') || playing;
  if (m !== 'place') { ghost.visible = false; ghostSpot = null; }
  if (m !== 'erase') clearEraseHover();
  canvas.style.cursor = '';
}
modeBtns.place.onclick = () => setMode('place');
modeBtns.move.onclick = () => setMode('move');
modeBtns.erase.onclick = () => setMode('erase');

/* ---------- swatches ---------- */
const swWrap = document.getElementById('swatches');
COLORS.forEach((c, i) => {
  const b = document.createElement('button');
  b.className = 'swatch' + (i === colorIdx ? ' active' : '');
  b.style.background = '#' + c.hex.toString(16).padStart(6, '0');
  b.dataset.tip = `${c.name} (${i + 1})`;
  b.onclick = () => setColor(i);
  swWrap.appendChild(b);
});
function setColor(i) {
  colorIdx = i;
  [...swWrap.children].forEach((el, k) => el.classList.toggle('active', k === i));
}

/* ---------- width / depth ---------- */
const wVal = document.getElementById('wVal'), dVal = document.getElementById('dVal');
const dimPop = document.getElementById('dimPop');
let popTarget = null;

function openDimPop(which, btn) {
  popTarget = which;
  dimPop.innerHTML = '';
  for (let n = 1; n <= 6; n++) {
    const b = document.createElement('button');
    b.textContent = n;
    if (n === (which === 'w' ? width : depth)) b.classList.add('cur');
    b.onclick = ev => {
      ev.stopPropagation();
      if (which === 'w') { width = n; wVal.textContent = n; }
      else { depth = n; dVal.textContent = n; }
      refreshGhostMesh();
      closePop();
    };
    dimPop.appendChild(b);
  }
  const r = btn.getBoundingClientRect();
  dimPop.classList.remove('hidden');
  dimPop.style.left = (r.left + r.width / 2 - 60) + 'px';
  dimPop.style.bottom = (innerHeight - r.top + 10) + 'px';
}
function closePop() { dimPop.classList.add('hidden'); popTarget = null; }
document.getElementById('wBtn').onclick = e => { e.stopPropagation(); popTarget === 'w' ? closePop() : openDimPop('w', e.currentTarget); };
document.getElementById('dBtn').onclick = e => { e.stopPropagation(); popTarget === 'd' ? closePop() : openDimPop('d', e.currentTarget); };
document.addEventListener('click', e => { if (popTarget && !dimPop.contains(e.target)) closePop(); });

document.getElementById('swap').onclick = doSwap;
function doSwap() {
  [width, depth] = [depth, width];
  wVal.textContent = width; dVal.textContent = depth;
  refreshGhostMesh();
}

/* ---------- play / pause ---------- */
const pauseBtn = document.getElementById('pauseBtn');
document.getElementById('play').onclick = () => {
  playing = true;
  document.body.classList.add('playing');
  pauseBtn.classList.remove('hidden');
  ghost.visible = false; ghostSpot = null;
  controls.enabled = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 2.2;
};
pauseBtn.onclick = () => {
  playing = false;
  document.body.classList.remove('playing');
  pauseBtn.classList.add('hidden');
  controls.autoRotate = false;
  controls.enabled = (mode === 'move');
};

/* ---------- clear dialog ---------- */
const overlay = document.getElementById('overlay');
document.getElementById('trash').onclick = () => overlay.classList.remove('hidden');
document.getElementById('dlgCancel').onclick = () => overlay.classList.add('hidden');
document.getElementById('dlgClose').onclick = () => overlay.classList.add('hidden');
document.getElementById('dlgClear').onclick = () => { clearAll(); overlay.classList.add('hidden'); };
overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });

/* ---------- keyboard ---------- */
addEventListener('keydown', e => {
  if (!overlay.classList.contains('hidden')) { if (e.key === 'Escape') overlay.classList.add('hidden'); return; }
  const k = e.key.toLowerCase();
  if (k >= '1' && k <= '8') setColor(+k - 1);
  else if (k === 's') doSwap();
  else if (k === 'e') setMode('erase');
  else if (k === 'b') setMode('place');
  else if (k === 'm') setMode('move');
});

/* ---------- resize / loop ---------- */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

/* ---------- seed ---------- */
addBrick(6, 7, 0, 2, 2, COLORS[0].hex);
