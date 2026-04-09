if (!requireAuth()) throw new Error('Not authenticated');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);

const W = 1280, H = 720;
const P_RADIUS = 26, E_RADIUS = 24, B_RADIUS = 4;
const P_MAX_HP   = 100, MAX_ENEMIES = 7;
const P_ACCEL    = 0.22, P_REVERSE = 0.14;
const P_FRICTION = 0.92, P_MAX_SPEED = 3.8, P_ROT = 0.055;
const B_SPEED    = 8, P_FIRE_CD = 200;
const MAX_AMMO   = 8, RELOAD_MS = 2600;
const AIM_ASSIST_R = 200, AIM_ASSIST_ANG = 0.6;
// ── Enemy type definitions ────────────────────────────────────
const ETYPES = {
  scout: {
    label: 'Scout', bodyColor: '#3d6b8a', turretColor: '#4e7d9e',
    hp: 28, speed: 2.3, fireCd: 720, dmg: 7, scale: 0.82, reward: 75,
    weights: { chase:0.6, attack:0.7, flank:1.4, cover:0.5, retreat:1.1, reposition:1.0 }
  },
  standard: {
    label: 'Standard', bodyColor: '#4a6355', turretColor: '#5a7566',
    hp: 55, speed: 1.3, fireCd: 950, dmg: 12, scale: 1, reward: 100,
    weights: { chase:1.0, attack:1.2, flank:0.8, cover:0.8, retreat:0.8, reposition:0.7 }
  },
  heavy: {
    label: 'Heavy', bodyColor: '#3a3f45', turretColor: '#4a5058',
    hp: 120, speed: 0.7, fireCd: 1400, dmg: 22, scale: 1.2, reward: 200,
    weights: { chase:1.2, attack:1.5, flank:0.3, cover:0.6, retreat:0.5, reposition:0.4 }
  }
};

// ── Math helpers ──────────────────────────────────────────────
const clamp   = (v, a, b) => Math.max(a, Math.min(b, v));
const dist    = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const angTo   = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);
const fwX     = a => Math.cos(a);
const fwY     = a => Math.sin(a);
const rnd     = (a, b) => a + Math.random() * (b - a);

function normAng(a) {
  while (a >  Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
function lerpAngle(a, b, t) { return a + normAng(b - a) * t; }

// ── Rounded rectangle helper ──────────────────────────────────
function roundRect2(cx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  cx.beginPath();
  cx.moveTo(x + r, y);
  cx.lineTo(x + w - r, y);
  cx.quadraticCurveTo(x + w, y, x + w, y + r);
  cx.lineTo(x + w, y + h - r);
  cx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  cx.lineTo(x + r, y + h);
  cx.quadraticCurveTo(x, y + h, x, y + h - r);
  cx.lineTo(x, y + r);
  cx.quadraticCurveTo(x, y, x + r, y);
  cx.closePath();
}

// ── Collision helpers ─────────────────────────────────────────
function circleRect(cx, cy, r, o) {
  const nx = clamp(cx, o.x, o.x + o.w);
  const ny = clamp(cy, o.y, o.y + o.h);
  return dist(cx, cy, nx, ny) < r;
}
function lineRect(x1, y1, x2, y2, o) {
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) return true;
  }
  return false;
}
function hasLOS(ax, ay, bx, by, obs) {
  return !obs.some(o => o.solid && lineRect(ax, ay, bx, by, o));
}


// ── Camera shake ──────────────────────────────────────────────
let shake = { x: 0, y: 0, i: 0 };
function addShake(i) { shake.i = Math.max(shake.i, i); }
function updateShake() {
  if (shake.i > 0.1) {
    shake.x = (Math.random() - 0.5) * shake.i;
    shake.y = (Math.random() - 0.5) * shake.i;
    shake.i *= 0.82;
  } else {
    shake.x = 0; shake.y = 0; shake.i = 0;
  }
}


function makeObstacles() {
  return [
    {  type:'wall',      solid:true, x: 285, y: 130, w: 44, h: 205 },
    {  type:'wall',      solid:true, x: 329, y: 292, w: 362, h: 44 },
    {  type:'wall',      solid:true, x: 691, y: 292, w: 44, h: 152 },
    { type:'wall',      solid:true,  x:688,  y:490, w:144, h:42  },
    { type:'wall',      solid:true,  x:805,  y:490, w:44,  h:118 },
    { type:'house',     solid:true,  x:975,  y:86,  w:208, h:122 },
    { type:'house',     solid:true,  x:14,   y:572, w:160, h:98  },
    { type:'house',     solid:true,  x:188,  y:596, w:166, h:98  },
    { type:'house',     solid:true,  x:1020, y:548, w:115, h:90  },
    { type:'house',     solid:true,  x:1148, y:528, w:118, h:104 },
    { type:'container', solid:true,  x:470,  y:220, w:126, h:56,  angle:-0.04 },
    { type:'container', solid:true,  x:620,  y:228, w:132, h:58,  angle:0.18  },
    { type:'crate',     solid:true,  x:790,  y:260, w:78,  h:74  },
    { type:'crate',     solid:true,  x:840,  y:520, w:80,  h:76  },
    { type:'lowwall',   solid:true,  x:110,  y:155, w:138, h:26  },
    { type:'lowwall',   solid:true,  x:830,  y:610, w:176, h:34  },
    { type:'decor', solid:false, x:76,   y:82,  kind:'crater' },
    { type:'decor', solid:false, x:1010, y:218, kind:'crater' },
    { type:'decor', solid:false, x:1155, y:256, kind:'crater' },
    { type:'decor', solid:false, x:55,   y:335, kind:'crater' },
    { type:'decor', solid:false, x:876,  y:405, kind:'crater' },
    { type:'decor', solid:false, x:145,  y:48,  kind:'cactus' },
    { type:'decor', solid:false, x:346,  y:182, kind:'bush'   },
    { type:'decor', solid:false, x:545,  y:668, kind:'bush'   },
    { type:'decor', solid:false, x:770,  y:210, kind:'bush'   },
    { type:'decor', solid:false, x:1190, y:652, kind:'bush'   },
    { type:'decor', solid:false, x:765,  y:78,  kind:'tires'  },
    { type:'decor', solid:false, x:585,  y:390, kind:'tires'  },
    { type:'decor', solid:false, x:485,  y:385, kind:'tires'  },
    { type:'decor', solid:false, x:1004, y:238, kind:'barrels'},
    { type:'decor', solid:false, x:320,  y:190, kind:'barrels'}
  ];
}

const SPAWN_POINTS = [
  {x:1085,y:255},{x:1160,y:315},{x:545,y:585},
  {x:88,y:128},{x:1015,y:135},{x:120,y:510}
];

// ── Terrain noise (pre-computed) ──────────────────────────────
const terrainNoise = [];
for (let i = 0; i < 320; i++) terrainNoise.push({
  x: (i * 173) % W, y: (i * 97) % H,
  r: 2 + (i % 4), alpha: i % 3 === 0 ? 0.065 : 0.03,
  ellipseRx: 10 + (i % 5) * 4, ellipseRy: 4 + (i % 3) * 2,
  isEllipse: i % 5 === 0
});

function resolveCircle(e, r, obs) {
  e.x = clamp(e.x, r, W - r);
  e.y = clamp(e.y, r, H - r);
  for (const o of obs) {
    if (!o.solid|| !circleRect(e.x, e.y, r, o)) continue;
   const sides = [
      { v: Math.abs(e.x - o.x),           fn: () => e.x = o.x - r },
      { v: Math.abs(e.x - (o.x + o.w)),   fn: () => e.x = o.x + o.w + r },
      { v: Math.abs(e.y - o.y),           fn: () => e.y = o.y - r },
      { v: Math.abs(e.y - (o.y + o.h)),   fn: () => e.y = o.y + o.h + r }
    ];
    sides.sort((a, b) => a.v - b.v)[0].fn();
  }
    }
 

