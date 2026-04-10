const waveVal        = $('waveVal');
const scoreVal       = $('scoreVal');
const killVal        = $('killVal');
const enemyVal       = $('enemyVal');
const hpFill         = $('hpFill');
const hpText         = $('hpText');
const ammoPips       = $('ammoPips');
const reloadFill     = $('reloadFill');
const reloadLabel    = $('reloadLabel');
const statusVal      = $('statusVal');
const msgVal         = $('msgVal');
const killfeed       = $('killfeed');
const hiscoreDisplay = $('hiscoreDisplay');

// ── Pre-computed visuals ──────────────────────────────────────
// Star field for overlays
const STARS = [];
for (let i = 0; i < 80; i++) {
  STARS.push({ x: Math.random()*W, y: Math.random()*H,
    r: Math.random()*1.4+0.3, a: Math.random()*0.6+0.1 });
}

// Sand ripple patterns
const RIPPLES = [];
for (let i = 0; i < 60; i++) {
  RIPPLES.push({
    x: Math.random()*W, y: Math.random()*H,
    w: 20+Math.random()*60, h: 3+Math.random()*8,
    a: Math.random()*0.04+0.01, rot: (Math.random()-0.5)*0.4
  });
}

// ── HUD update ────────────────────────────────────────────────
function updateHUD(G, highScore) {
  waveVal.textContent  = G.wave;
  scoreVal.textContent = G.score;
  killVal.textContent  = G.kills;
  enemyVal.textContent = G.enemies.length;

  const hpRatio = Math.max(0, G.player.hp) / G.player.maxHp;
  hpFill.style.width = (hpRatio * 100) + '%';
  hpFill.style.background =
    hpRatio > 0.6  ? 'linear-gradient(90deg,#16a34a,#4ade80)' :
    hpRatio > 0.3  ? 'linear-gradient(90deg,#d97706,#fbbf24)' :
                     'linear-gradient(90deg,#b91c1c,#ef4444)';
  hpText.textContent = Math.max(0, G.player.hp) + ' / ' + G.player.maxHp;
  statusVal.textContent = G.status.toUpperCase();
  msgVal.textContent    = G.message;

  ammoPips.innerHTML = '';
  for (let i = 0; i < MAX_AMMO; i++) {
    const d = document.createElement('div');
    d.className = 'pip' + (i < G.player.ammo ? '' : ' empty');
    ammoPips.appendChild(d);
  }

  if (G.player.reloading) {
    reloadLabel.style.display = 'block';
    reloadFill.style.width = (((RELOAD_MS - G.player.reloadTimer) / RELOAD_MS) * 100) + '%';
  } else {
    reloadLabel.style.display = 'none';
    reloadFill.style.width = '0%';
  }

  killfeed.innerHTML = '';
  if (G.killLog.length === 0) {
    killfeed.innerHTML = '<div class="kill-entry">— Awaiting contact —</div>';
  } else {
    G.killLog.forEach((k, i) => {
      const el = document.createElement('div');
      el.className = 'kill-entry' + (i === 0 ? ' fresh' : '');
      el.textContent = k.msg;
      killfeed.appendChild(el);
    });
  }
  if (hiscoreDisplay) hiscoreDisplay.textContent = highScore;
}

// ── BACKGROUND — rich multi-layer desert ─────────────────────
function drawBackground(G) {
  const t = performance.now() / 1000;

  // === Layer 1: Sky-horizon desert gradient ===
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0,    '#e8e09a');   // bright sand top
  grad.addColorStop(0.3,  '#d4c978');
  grad.addColorStop(0.65, '#c5ba68');
  grad.addColorStop(1,    '#a89945');   // darker bottom
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // === Layer 2: Large sand dune shapes ===
  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 5; i++) {
    const dx = (i * 280) % W;
    const dy = 120 + (i * 97) % 280;
    const g2 = ctx.createRadialGradient(dx, dy, 10, dx, dy, 200+i*40);
    g2.addColorStop(0,   'rgba(180,150,60,.9)');
    g2.addColorStop(0.5, 'rgba(160,130,40,.4)');
    g2.addColorStop(1,   'rgba(140,110,20,0)');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.ellipse(dx, dy, 200+i*40, 80+i*20, 0.2, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();

  // === Layer 3: Sand ripple texture ===
  ctx.save();
  for (const r of RIPPLES) {
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.rot);
    ctx.globalAlpha = r.a;
    ctx.fillStyle = '#8a7235';
    ctx.beginPath();
    ctx.ellipse(0, 0, r.w, r.h, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // === Layer 4: Fine noise dots ===
  ctx.save();
  for (const tn of terrainNoise) {
    ctx.globalAlpha = tn.alpha * 1.4;
    ctx.fillStyle = '#7a6530';
    ctx.beginPath();
    if (tn.isEllipse) ctx.ellipse(tn.x, tn.y, tn.ellipseRx, tn.ellipseRy, 0.3, 0, Math.PI*2);
    else ctx.arc(tn.x, tn.y, tn.r, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();

  // === Layer 5: Animated heat shimmer bands ===
  ctx.save();
  ctx.globalAlpha = 0.025;
  for (let i = 0; i < 3; i++) {
    const yy = 200 + i * 180 + Math.sin(t * 0.4 + i) * 8;
    const hg = ctx.createLinearGradient(0, yy-4, 0, yy+4);
    hg.addColorStop(0, 'rgba(255,240,180,0)');
    hg.addColorStop(0.5,'rgba(255,240,180,1)');
    hg.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, yy-4, W, 8);
  }
  ctx.restore();

  // === Layer 6: Track marks ===
  for (const tk of G.trackMarks) {
    if (tk.alpha <= 0) continue;
    ctx.save();
    ctx.translate(tk.x, tk.y);
    ctx.rotate(tk.angle + Math.PI * 0.5);
    ctx.globalAlpha = tk.alpha * 0.85;
    // Left tread mark
    ctx.fillStyle = '#6a5520';
    ctx.fillRect(-5, -6, 4, 12);
    ctx.fillRect( 1, -6, 4, 12);
    ctx.restore();
    tk.alpha -= 0.00045;
  }
  // === Layer 7: Dynamic craters ===
  for (const c of G.dynamicCraters) drawCraterAt(c.x, c.y, c.r);

  // === Layer 8: Edge vignette ===
  const vig = ctx.createRadialGradient(W/2, H/2, 200, W/2, H/2, 820);
  vig.addColorStop(0,   'rgba(0,0,0,0)');
  vig.addColorStop(0.7, 'rgba(0,0,0,.06)');
  vig.addColorStop(1,   'rgba(0,0,0,.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

function drawCraterAt(x, y, r) {
  r = r || 22;
  // Outer scorched ring
  const outer = ctx.createRadialGradient(x, y, r*0.6, x, y, r*1.4);
  outer.addColorStop(0,   'rgba(60,40,10,0)');
  outer.addColorStop(0.5, 'rgba(40,28,8,.25)');
  outer.addColorStop(1,   'rgba(20,14,4,0)');
  ctx.fillStyle = outer;
  ctx.beginPath(); ctx.arc(x, y, r*1.4, 0, Math.PI*2); ctx.fill();

  // Main pit
  const g = ctx.createRadialGradient(x-r*0.15, y-r*0.15, 0, x, y, r);
  g.addColorStop(0,   'rgba(18,10,2,.95)');
  g.addColorStop(0.35,'rgba(32,20,5,.85)');
  g.addColorStop(0.7, 'rgba(55,38,12,.5)');
  g.addColorStop(1,   'rgba(80,60,25,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();

  // Highlight rim
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = '#c8a84a';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x-r*0.1, y-r*0.1, r*0.75, -2.4, 0.2); ctx.stroke();
  ctx.restore();
}

function drawShadow(x, y, rx, ry) {
  ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry);
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

// ── OBSTACLES — richer detail ─────────────────────────────────
function drawObstacle(o) {
  switch (o.type) {
    case 'wall':      drawWall(o);      break;
    case 'house':     drawHouse(o);     break;
    case 'container': drawContainer(o); break;
    case 'crate':     drawCrate(o);     break;
    case 'lowwall':   drawLowWall(o);   break;
    case 'decor':
      if (o.kind === 'crater')  drawCraterAt(o.x, o.y, 28);
      if (o.kind === 'bush')    drawBush(o.x, o.y);
      if (o.kind === 'tires')   drawTires(o.x, o.y);
      if (o.kind === 'barrels') drawBarrels(o.x, o.y);
      if (o.kind === 'cactus')  drawCactus(o.x, o.y);
      break;
  }
}

function drawWall(o) {
  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.fillRect(o.x+6, o.y+7, o.w, o.h);

  // Base concrete
  const wg = ctx.createLinearGradient(o.x, o.y, o.x+o.w, o.y+o.h);
  wg.addColorStop(0, '#b0a878'); wg.addColorStop(1, '#8a8258');
  ctx.fillStyle = wg; ctx.fillRect(o.x, o.y, o.w, o.h);

  // Brick rows
  ctx.strokeStyle = 'rgba(60,50,30,.4)'; ctx.lineWidth = 1;
  const brickH = 14;
  for (let row = 0; row * brickH < o.h; row++) {
    const yy = o.y + row * brickH;
    ctx.beginPath(); ctx.moveTo(o.x, yy); ctx.lineTo(o.x + o.w, yy); ctx.stroke();
    // Staggered vertical joints
    const offset = row % 2 === 0 ? 0 : 22;
    for (let bx = o.x + offset; bx < o.x + o.w; bx += 44) {
      ctx.beginPath(); ctx.moveTo(bx, yy); ctx.lineTo(bx, yy + brickH); ctx.stroke();
    }
  }

  // Top light edge
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(o.x, o.y, o.w, 4);
  // Outline
  ctx.strokeStyle = 'rgba(40,32,16,.7)'; ctx.lineWidth = 2; ctx.strokeRect(o.x, o.y, o.w, o.h);
}

function drawHouse(o) {
  drawShadow(o.x+o.w*0.5, o.y+o.h+14, o.w*0.5, 12);

  // Walls
  const hg = ctx.createLinearGradient(o.x, o.y, o.x+o.w, o.y+o.h);
  hg.addColorStop(0, '#9e9468'); hg.addColorStop(1, '#736c4e');
  ctx.fillStyle = hg; ctx.fillRect(o.x, o.y, o.w, o.h);

  // Inner face
  ctx.fillStyle = '#c2b87e'; ctx.fillRect(o.x+12, o.y+10, o.w-24, o.h-20);

  // Windows with glow
  if (o.w > 80) {
    const wins = [[o.x+14, o.y+14], [o.x+o.w-34, o.y+14]];
    for (const [wx, wy] of wins) {
      ctx.fillStyle = 'rgba(20,35,60,.75)'; ctx.fillRect(wx, wy, 20, 16);
      // Window pane cross
      ctx.strokeStyle = 'rgba(100,140,180,.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(wx+10, wy); ctx.lineTo(wx+10, wy+16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(wx, wy+8);  ctx.lineTo(wx+20, wy+8);  ctx.stroke();
      // Subtle light glow
      ctx.fillStyle = 'rgba(180,210,255,.06)'; ctx.fillRect(wx, wy, 20, 16);
    }
  }
  // Door
  const dx = o.x + o.w/2 - 8;
  ctx.fillStyle = 'rgba(25,18,8,.8)'; ctx.fillRect(dx, o.y+o.h-28, 16, 28);
  ctx.strokeStyle = '#604030'; ctx.lineWidth = 1; ctx.strokeRect(dx, o.y+o.h-28, 16, 28);

  ctx.strokeStyle = '#4a4428'; ctx.lineWidth = 2; ctx.strokeRect(o.x, o.y, o.w, o.h);
}

function drawContainer(o) {
  ctx.save(); ctx.translate(o.x+o.w/2, o.y+o.h/2); ctx.rotate(o.angle || 0);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-o.w/2+4, -o.h/2+4, o.w, o.h);

  // Main body gradient
  const cg = ctx.createLinearGradient(-o.w/2, 0, o.w/2, 0);
  cg.addColorStop(0,   '#496070'); cg.addColorStop(0.5, '#6a8898');
  cg.addColorStop(1,   '#496070');
  ctx.fillStyle = cg; ctx.fillRect(-o.w/2, -o.h/2, o.w, o.h);

  // Ribs
  ctx.strokeStyle = 'rgba(30,45,55,.65)'; ctx.lineWidth = 1.5;
  for (let x = -o.w/2+12; x < o.w/2; x += 16) {
    ctx.beginPath(); ctx.moveTo(x, -o.h/2+2); ctx.lineTo(x, o.h/2-2); ctx.stroke();
  }

  // Top/bottom edge highlight
  ctx.fillStyle = 'rgba(255,255,255,.1)';
  ctx.fillRect(-o.w/2, -o.h/2, o.w, 4);
  ctx.fillStyle = 'rgba(0,0,0,.2)';
  ctx.fillRect(-o.w/2, o.h/2-4, o.w, 4);

  ctx.strokeStyle = 'rgba(15,25,35,.8)'; ctx.lineWidth = 2;
  ctx.strokeRect(-o.w/2, -o.h/2, o.w, o.h);
  ctx.restore();
}

function drawCrate(o) {
  drawShadow(o.x+o.w*0.5, o.y+o.h+8, o.w*0.38, 9);

  const cg = ctx.createLinearGradient(o.x, o.y, o.x+o.w, o.y+o.h);
  cg.addColorStop(0, '#8a6840'); cg.addColorStop(1, '#5c4222');
  ctx.fillStyle = cg; ctx.fillRect(o.x, o.y, o.w, o.h);

  // Wood planks
  ctx.strokeStyle = '#3e2810'; ctx.lineWidth = 2;
  const pH = Math.floor(o.h / 3);
  for (let i = 1; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(o.x, o.y+pH*i); ctx.lineTo(o.x+o.w, o.y+pH*i); ctx.stroke();
  }
  // Diagonal strapping
  ctx.strokeStyle = 'rgba(30,18,6,.7)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(o.x+4, o.y+4); ctx.lineTo(o.x+o.w-4, o.y+o.h-4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(o.x+o.w-4, o.y+4); ctx.lineTo(o.x+4, o.y+o.h-4); ctx.stroke();

  // Metal band highlight
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(o.x, o.y, o.w, 3);
  ctx.strokeStyle = '#2a1806'; ctx.lineWidth = 2.5; ctx.strokeRect(o.x, o.y, o.w, o.h);
}

function drawLowWall(o) {
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(o.x+4, o.y+4, o.w, o.h);
  const lwg = ctx.createLinearGradient(o.x, o.y, o.x+o.w, o.y+o.h);
  lwg.addColorStop(0, '#504030'); lwg.addColorStop(1, '#2e2018');
  ctx.fillStyle = lwg; ctx.fillRect(o.x, o.y, o.w, o.h);
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(o.x, o.y, o.w, 3);
  ctx.strokeStyle = '#786050'; ctx.lineWidth = 1.5; ctx.strokeRect(o.x, o.y, o.w, o.h);
}

function drawBush(x, y) {
  const clusters = [[-2,-2,8],[11,4,7],[-9,6,9],[6,-8,6],[-12,-5,7],[3,8,8],[0,2,11]];
  // Shadow
  ctx.save(); ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#3a2800';
  ctx.beginPath(); ctx.ellipse(x+2, y+6, 18, 8, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  // Layers
  for (const [dx,dy,r] of clusters) {
    // Dark back layer
    ctx.fillStyle = '#4a6a22';
    ctx.beginPath(); ctx.arc(x+dx+1, y+dy+2, r, 0, Math.PI*2); ctx.fill();
    // Main color
    ctx.fillStyle = '#6a9a34';
    ctx.beginPath(); ctx.arc(x+dx, y+dy, r, 0, Math.PI*2); ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(180,230,80,.2)';
    ctx.beginPath(); ctx.arc(x+dx-r*0.25, y+dy-r*0.25, r*0.45, 0, Math.PI*2); ctx.fill();
  }
}

function drawTires(x, y) {
  const pts = [[0,0],[18,-14],[22,14],[-6,22]];
  for (const [dx,dy] of pts) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.ellipse(x+dx+3, y+dy+4, 12, 6, 0, 0, Math.PI*2); ctx.fill();
    // Tire body
    ctx.fillStyle = '#252018';
    ctx.beginPath(); ctx.arc(x+dx, y+dy, 13, 0, Math.PI*2); ctx.fill();
    // Tread ring
    ctx.strokeStyle = '#3a3028'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x+dx, y+dy, 10, 0, Math.PI*2); ctx.stroke();
    // Hub
    const hg = ctx.createRadialGradient(x+dx-2, y+dy-2, 0, x+dx, y+dy, 6);
    hg.addColorStop(0, '#909090'); hg.addColorStop(1, '#484848');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.arc(x+dx, y+dy, 6, 0, Math.PI*2); ctx.fill();
  }
}

function drawBarrels(x, y) {
  const pts = [[0,0],[20,12],[-14,20]];
  for (const [dx,dy] of pts) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,.2)';
    ctx.beginPath(); ctx.ellipse(x+dx+3, y+dy+4, 11, 5, 0, 0, Math.PI*2); ctx.fill();
    // Body gradient
    const bg = ctx.createRadialGradient(x+dx-3, y+dy-3, 0, x+dx, y+dy, 12);
    bg.addColorStop(0, '#a0b0b8'); bg.addColorStop(0.6,'#6a7e88'); bg.addColorStop(1,'#3a4a52');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(x+dx, y+dy, 12, 0, Math.PI*2); ctx.fill();
    // Banding
    ctx.strokeStyle = '#2a3840'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x+dx, y+dy, 12, 0, Math.PI*2); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,40,50,.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x+dx, y+dy, 8, 0, Math.PI*2); ctx.stroke();
    // Top highlight
    ctx.fillStyle = 'rgba(255,255,255,.15)';
    ctx.beginPath(); ctx.ellipse(x+dx-3, y+dy-3, 5, 3, -0.5, 0, Math.PI*2); ctx.fill();
  }
}

function drawCactus(x, y) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.beginPath(); ctx.ellipse(x+2, y+8, 12, 5, 0, 0, Math.PI*2); ctx.fill();

  const cg = ctx.createLinearGradient(x-4, 0, x+8, 0);
  cg.addColorStop(0, '#5a7828'); cg.addColorStop(0.4,'#80aa3c'); cg.addColorStop(1,'#5a7828');
  ctx.fillStyle = cg;
  // Trunk
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x-5, y-26, 10, 34, 4) : ctx.fillRect(x-5, y-26, 10, 34);
  ctx.fill();
  // Arms
  ctx.fillRect(x-20, y-14, 10, 20);
  ctx.fillRect(x+10,  y-12, 10, 18);
  // Arm tops
  ctx.fillRect(x-20, y-20, 10, 8);
  ctx.fillRect(x+10,  y-18, 10, 8);
  // Spines
  ctx.strokeStyle = 'rgba(255,255,200,.6)'; ctx.lineWidth = 1;
  const spinePos = [[x-1,y-22],[x+3,y-16],[x-2,y-8],[x+2,y]];
  for (const [sx,sy] of spinePos) {
    ctx.beginPath(); ctx.moveTo(sx-5,sy); ctx.lineTo(sx-10,sy-2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx+4,sy); ctx.lineTo(sx+9, sy-2); ctx.stroke();
  }
}

// ── TANK DRAWING — cinematic quality ─────────────────────────
function drawDetailedTank(x, y, bodyAng, turretAng, cfg) {
  const s        = cfg.scale || 1;
  const isPlayer = cfg.team === 'player';
  const now      = performance.now();
  const flashA   = cfg.flashTimer > 0 ? (cfg.flashTimer / 8) * 0.85 : 0;

  // ── Player: animated selection ring ──────────────────────────
  if (isPlayer) {
    const pulse = 0.15 + 0.08 * Math.sin(now / 200);
    // Outer glow
    ctx.save();
    ctx.globalAlpha = pulse * 0.5;
    const rg = ctx.createRadialGradient(x, y, 28*s, x, y, 48*s);
    rg.addColorStop(0, 'rgba(120,230,60,.6)');
    rg.addColorStop(1, 'rgba(120,230,60,0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(x, y, 48*s, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    // Ring
    ctx.save();
    ctx.globalAlpha = pulse + 0.1;
    ctx.strokeStyle = '#7EE040'; ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 5]);
    ctx.lineDashOffset = -(now / 40) % 13;
    ctx.beginPath(); ctx.arc(x, y, 36*s, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── Drop shadow ───────────────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.beginPath(); ctx.ellipse(x+6, y+10, 32*s, 14*s, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // ── HULL ──────────────────────────────────────────────────────
  ctx.save(); ctx.translate(x, y); ctx.rotate(bodyAng + Math.PI*0.5);

  // Tracks (left and right)
  for (const side of [-1, 1]) {
    const tx = side * (22*s);
    // Track base
    ctx.fillStyle = '#0e0c0a';
    roundRect2(ctx, tx-7*s, -30*s, 14*s, 60*s, 3*s); ctx.fill();
    // Track highlight
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    roundRect2(ctx, tx-7*s, -30*s, 14*s, 4*s, 2*s); ctx.fill();
    // Tread links
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 0.8;
    for (let ty = -26; ty < 28; ty += 7) {
      ctx.beginPath(); ctx.moveTo(tx-7*s, ty*s); ctx.lineTo(tx+7*s, ty*s); ctx.stroke();
    }
    // Drive wheel
    ctx.fillStyle = '#1e1c18';
    ctx.beginPath(); ctx.arc(tx, -24*s, 7*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#3a3830';
    ctx.beginPath(); ctx.arc(tx, -24*s, 4*s, 0, Math.PI*2); ctx.fill();
    // Return wheel
    ctx.fillStyle = '#1e1c18';
    ctx.beginPath(); ctx.arc(tx, 24*s, 7*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#3a3830';
    ctx.beginPath(); ctx.arc(tx, 24*s, 4*s, 0, Math.PI*2); ctx.fill();
  }

  // Hull body gradient
  const hullG = ctx.createLinearGradient(-18*s, -24*s, 18*s, 24*s);
  if (isPlayer) {
    hullG.addColorStop(0,   '#5e8c38');
    hullG.addColorStop(0.4, '#4e7230');
    hullG.addColorStop(1,   '#3a5424');
  } else {
    hullG.addColorStop(0,   lighten(cfg.bodyColor, 20));
    hullG.addColorStop(0.5, cfg.bodyColor);
    hullG.addColorStop(1,   darken(cfg.bodyColor, 20));
  }
  ctx.fillStyle = hullG;
  roundRect2(ctx, -18*s, -24*s, 36*s, 48*s, 5*s); ctx.fill();

  // Hull edge shading
  ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 2;
  roundRect2(ctx, -18*s, -24*s, 36*s, 48*s, 5*s); ctx.stroke();

  // Hull top highlight
  ctx.fillStyle = 'rgba(255,255,255,.1)';
  roundRect2(ctx, -16*s, -22*s, 32*s, 8*s, 3*s); ctx.fill();

  // Hatches / detail
  if (isPlayer) {
    ctx.fillStyle = '#c8a020';
    roundRect2(ctx, -7*s, -14*s, 14*s, 10*s, 3*s); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    roundRect2(ctx, -6*s, -13*s, 5*s, 2*s, 1*s); ctx.fill();
    // Hatch bolt dots
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    for (const [bx,by] of [[-5,-12],[5,-12],[-5,-6],[5,-6]]) {
      ctx.beginPath(); ctx.arc(bx*s, by*s, 1.2*s, 0, Math.PI*2); ctx.fill();
    }
  } else {
    // Enemy detail panel
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    roundRect2(ctx, -7*s, -12*s, 14*s, 10*s, 2*s); ctx.fill();
  }

  // Engine exhaust (rear)
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.fillRect(-5*s, 18*s, 4*s, 5*s);
  ctx.fillRect( 1*s, 18*s, 4*s, 5*s);

  ctx.restore();

  // ── TURRET ────────────────────────────────────────────────────
  ctx.save(); ctx.translate(x, y); ctx.rotate(turretAng + Math.PI*0.5);

  // Barrel shadow
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  roundRect2(ctx, -6*s+2, -32*s+2, 12*s, 44*s, 3*s); ctx.fill();

  // Barrel
  const barG = ctx.createLinearGradient(-7*s, 0, 7*s, 0);
  barG.addColorStop(0,   'rgba(0,0,0,.5)');
  barG.addColorStop(0.35,'rgba(255,255,255,.08)');
  barG.addColorStop(1,   'rgba(0,0,0,.3)');
  ctx.fillStyle = '#1e2430';
  roundRect2(ctx, -7*s, -32*s, 14*s, 44*s, 3*s); ctx.fill();
  ctx.fillStyle = barG;
  roundRect2(ctx, -6*s, -31*s, 12*s, 42*s, 3*s); ctx.fill();

  // Muzzle brake
  ctx.fillStyle = '#141820';
  ctx.fillRect(-8*s, -33*s, 16*s, 6*s);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  ctx.fillRect(-8*s, -33*s, 16*s, 2*s);

  // Turret dome gradient
  const turrG = ctx.createRadialGradient(-3*s, -3*s, 0, 0, 0, 14*s);
  turrG.addColorStop(0,   lighten(cfg.turretColor, 30));
  turrG.addColorStop(0.5, cfg.turretColor);
  turrG.addColorStop(1,   darken(cfg.turretColor, 20));
  ctx.fillStyle = turrG;
  ctx.beginPath(); ctx.arc(0, 4*s, 13*s, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 4*s, 13*s, 0, Math.PI*2); ctx.stroke();

  // Cupola (top hatch)
  ctx.fillStyle = darken(cfg.turretColor, 10);
  ctx.beginPath(); ctx.arc(0, 2*s, 6*s, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.beginPath(); ctx.arc(-2*s, 0*s, 3*s, 0, Math.PI*2); ctx.fill();

  ctx.restore();

  // ── HEALTH BAR ────────────────────────────────────────────────
  const hpRatio = Math.max(0, cfg.hp / cfg.maxHp);
  const barY    = y - 46*s;
  // Background
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  roundRect2(ctx, x-23, barY-1, 46, 9, 3); ctx.fill();
  // Fill
  const hpColor = hpRatio > 0.6 ? ['#166534','#4ade80'] : hpRatio > 0.3 ? ['#92400e','#fbbf24'] : ['#7f1d1d','#ef4444'];
  const hpG = ctx.createLinearGradient(x-22, 0, x-22+44*hpRatio, 0);
  hpG.addColorStop(0, hpColor[0]); hpG.addColorStop(1, hpColor[1]);
  ctx.fillStyle = hpG;
  roundRect2(ctx, x-22, barY, 44*hpRatio, 7, 2); ctx.fill();
  // Shine
  ctx.fillStyle = 'rgba(255,255,255,.15)';
  roundRect2(ctx, x-22, barY, 44*hpRatio, 3, 2); ctx.fill();

  // ── AI LABEL ──────────────────────────────────────────────────
  if (!isPlayer && cfg.actionLabel) {
    const labelY = y - 60*s;
    ctx.fillStyle = 'rgba(5,10,20,.72)';
    roundRect2(ctx, x-30, labelY-12, 60, 14, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(80,140,220,.3)'; ctx.lineWidth = 1;
    roundRect2(ctx, x-30, labelY-12, 60, 14, 3); ctx.stroke();
    ctx.fillStyle = 'rgba(160,210,255,.85)';
    ctx.font = (8*s) + 'px Share Tech Mono'; ctx.textAlign = 'center';
    ctx.fillText('[' + cfg.actionLabel + ']', x, labelY-1);
    ctx.fillStyle = 'rgba(150,170,190,.5)';
    ctx.font = (7*s) + 'px Share Tech Mono';
    ctx.fillText(cfg.typeLabel || '', x, labelY+9);
  }

  // ── HIT FLASH ─────────────────────────────────────────────────
  if (flashA > 0) {
    ctx.save();
    ctx.globalAlpha = flashA;
    const fg = ctx.createRadialGradient(x, y, 0, x, y, 24*s);
    fg.addColorStop(0, 'rgba(255,255,255,1)');
    fg.addColorStop(0.5,'rgba(255,200,100,.6)');
    fg.addColorStop(1, 'rgba(255,150,50,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.arc(x, y, 24*s, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

// ── Colour helpers ────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r,g,b];
}
function lighten(hex, amt) {
  const [r,g,b] = hexToRgb(hex);
  return `rgb(${Math.min(255,r+amt)},${Math.min(255,g+amt)},${Math.min(255,b+amt)})`;
}
function darken(hex, amt) {
  const [r,g,b] = hexToRgb(hex);
  return `rgb(${Math.max(0,r-amt)},${Math.max(0,g-amt)},${Math.max(0,b-amt)})`;
}

// ── PICKUPS — glowing ─────────────────────────────────────────
function drawPickup(p) {
  const t     = performance.now();
  const pulse = 1 + Math.sin(t / 200 + p.x * 0.02) * 0.1;
  const bob   = Math.sin(t / 500 + p.x * 0.01) * 3;

  ctx.save(); ctx.translate(p.x, p.y + bob); ctx.scale(pulse, pulse);

  if (p.type === 'med') {
    // Outer glow
    const gg = ctx.createRadialGradient(0,0,4, 0,0,24);
    gg.addColorStop(0, 'rgba(34,197,94,.35)'); gg.addColorStop(1,'rgba(34,197,94,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0,0,24,0,Math.PI*2); ctx.fill();
    // White box
    ctx.fillStyle = '#eef2f8'; ctx.strokeStyle = '#86efac'; ctx.lineWidth = 2;
    roundRect2(ctx, -12,-12,24,24,5); ctx.fill(); ctx.stroke();
    // Red cross
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(-3,-9,6,18); ctx.fillRect(-9,-3,18,6);
    // Shine
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    roundRect2(ctx, -10,-10,10,5,2); ctx.fill();

  } else {
    // Outer glow
    const rg = ctx.createRadialGradient(0,0,4, 0,0,22);
    rg.addColorStop(0,'rgba(239,68,68,.4)'); rg.addColorStop(1,'rgba(239,68,68,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0,0,22,0,Math.PI*2); ctx.fill();
    // Bottle
    ctx.fillStyle = '#7a4c28'; roundRect2(ctx,-8,-13,16,24,5); ctx.fill();
    ctx.fillStyle = '#a06830'; ctx.fillRect(-6,-11,12,18);
    // Label band
    ctx.fillStyle = '#e8a020'; ctx.fillRect(-7,-4,14,7);
    // Fuse
    ctx.strokeStyle = '#f0d040'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0,-13); ctx.bezierCurveTo(4,-20,8,-18,6,-24); ctx.stroke();
    // Spark
    const sparkA = (t / 80) % (Math.PI*2);
    ctx.fillStyle = '#fff176';
    ctx.beginPath(); ctx.arc(6+Math.cos(sparkA)*2, -24+Math.sin(sparkA)*2, 2.5, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

// ── EFFECTS — cinematic explosions ───────────────────────────

// ── EFFECTS — cinematic explosions ───────────────────────────
function drawEffects(G) {
  for (const e of G.effects) {
    const ratio = e.ttl / e.maxTtl;
    const inv   = 1 - ratio;

    if (e.type === 'shockwave') {
      ctx.save();
      ctx.globalAlpha = ratio * 0.7;
      // Double ring
      ctx.strokeStyle = 'rgba(255,230,120,.9)'; ctx.lineWidth = 4*(1-ratio)+1;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,180,60,.4)'; ctx.lineWidth = 8*(1-ratio);
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r*0.7, 0, Math.PI*2); ctx.stroke();
      ctx.restore();

    } else if (e.type === 'fireball') {
      ctx.save(); ctx.globalAlpha = ratio * 0.95;
      // Core white-hot
      const g1 = ctx.createRadialGradient(e.x,e.y,0, e.x,e.y, e.r*0.4);
      g1.addColorStop(0,'rgba(255,255,255,1)');
      g1.addColorStop(1,'rgba(255,240,100,0)');
      ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(e.x,e.y,e.r*0.4,0,Math.PI*2); ctx.fill();
      // Orange fireball
      const g2 = ctx.createRadialGradient(e.x,e.y,0, e.x,e.y,e.r);
      g2.addColorStop(0,  'rgba(255,220,80,.95)');
      g2.addColorStop(0.3,'rgba(255,120,20,.9)');
      g2.addColorStop(0.7,'rgba(180,40,5,.6)');
      g2.addColorStop(1,  'rgba(60,10,0,0)');
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill();
      ctx.restore();

    } else if (e.type === 'smokeBomb') {
      const age = inv;
      const rad = e.maxR * (0.3 + age * 0.85);
      ctx.save(); ctx.globalAlpha = Math.min(0.6, 0.05 + ratio*0.55);
      for (let layer = 0; layer < 3; layer++) {
        const lr = rad * (0.5 + layer*0.25);
        const ox = Math.sin(e.x*0.01 + layer*2.1) * rad*0.15;
        const oy = Math.cos(e.y*0.01 + layer*1.7) * rad*0.1;
        const sg = ctx.createRadialGradient(e.x+ox,e.y+oy,0, e.x+ox,e.y+oy,lr);
        sg.addColorStop(0,   'rgba(70,65,60,.75)');
        sg.addColorStop(0.4, 'rgba(90,85,78,.45)');
        sg.addColorStop(0.8, 'rgba(110,105,95,.18)');
        sg.addColorStop(1,   'rgba(130,125,115,0)');
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(e.x+ox,e.y+oy,lr,0,Math.PI*2); ctx.fill();
      }
      // Orange ember tinge at base
      ctx.globalAlpha *= 0.3;
      ctx.strokeStyle = 'rgba(255,140,30,.5)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(e.x, e.y, rad*0.25, 0, Math.PI*2); ctx.stroke();
      ctx.restore();

    } else if (e.type === 'emoji') {
      ctx.save();
      ctx.globalAlpha = Math.max(0.1, ratio);
      ctx.font = '36px Arial'; ctx.textAlign = 'center';
      ctx.fillText(e.emoji, e.x, e.y - inv*32);
      ctx.restore();
    }
  }
}

function drawParticles(G) {
  for (const p of G.particles) {
    const ratio = p.ttl / p.maxTtl;
    if (p.type === 'spark') {
      ctx.save();
      ctx.globalAlpha = ratio;
      // Glowing spark
      const sg = ctx.createRadialGradient(p.x,p.y,0, p.x,p.y,4);
      sg.addColorStop(0, p.color || '#ffee88');
      sg.addColorStop(1, 'rgba(255,180,40,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = ratio*0.9;
      ctx.fillRect(p.x-1, p.y-1, 2, 2);
      ctx.restore();
    } else if (p.type === 'muzzle') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle+Math.PI/2);
      ctx.globalAlpha = ratio * 0.95;
      // Glow behind flash
      const mg = ctx.createRadialGradient(0,0,0,0,0,18);
      mg.addColorStop(0,'rgba(255,240,160,.8)'); mg.addColorStop(1,'rgba(255,140,40,0)');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.fill();
      // Star shape
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0,-18);ctx.lineTo(5,-6);ctx.lineTo(16,-20);ctx.lineTo(9,0);
      ctx.lineTo(17,7);ctx.lineTo(4,5);ctx.lineTo(0,20);ctx.lineTo(-4,5);
      ctx.lineTo(-17,7);ctx.lineTo(-9,0);ctx.lineTo(-16,-20);ctx.lineTo(-5,-6);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}

// ── MINIMAP — tactical display ────────────────────────────────
function drawMinimap(G) {
  const mw=200, mh=114, mx=W-mw-14, my=14;
  ctx.save();

  // Background
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = 'rgba(4,8,16,.82)';
  roundRect2(ctx, mx-1,my-1,mw+2,mh+2,8); ctx.fill();

  // Scan-line effect
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = '#00ff44';
  for (let sy=my; sy<my+mh; sy+=3) { ctx.fillRect(mx, sy, mw, 1); }

  ctx.globalAlpha = 0.92;

  // Border with glow
  ctx.strokeStyle = 'rgba(212,168,67,.4)'; ctx.lineWidth = 1.5;
  roundRect2(ctx, mx,my,mw,mh,7); ctx.stroke();

  const sx=mw/W, sy2=mh/H;

  // Obstacles
  for (const o of G.obstacles) {
    if (!o.solid) continue;
    ctx.fillStyle = 'rgba(160,145,90,.22)';
    ctx.fillRect(mx+o.x*sx, my+o.y*sy2, Math.max(1,o.w*sx), Math.max(1,o.h*sy2));
  }

  // Pickups
  for (const p of G.pickups) {
    ctx.fillStyle = p.type==='med' ? '#22c55e' : '#ef4444';
    ctx.globalAlpha = 0.7 + 0.3*Math.sin(performance.now()/300);
    ctx.fillRect(mx+p.x*sx-2, my+p.y*sy2-2, 4, 4);
  }
  ctx.globalAlpha = 0.92;

  // Enemy dots with type-coloured halo
  for (const e of G.enemies) {
    const ec = e.type==='heavy'?'#ef4444':e.type==='scout'?'#60a5fa':'#f59e0b';
    ctx.fillStyle = ec + '44';
    ctx.beginPath(); ctx.arc(mx+e.x*sx, my+e.y*sy2, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = ec;
    ctx.beginPath(); ctx.arc(mx+e.x*sx, my+e.y*sy2, 2.5, 0, Math.PI*2); ctx.fill();
  }

  // Player dot — pulsing
  const pp = 0.7 + 0.3*Math.sin(performance.now()/250);
  ctx.fillStyle = 'rgba(74,222,128,' + pp*0.4 + ')';
  ctx.beginPath(); ctx.arc(mx+G.player.x*sx, my+G.player.y*sy2, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#4ade80';
  ctx.beginPath(); ctx.arc(mx+G.player.x*sx, my+G.player.y*sy2, 3, 0, Math.PI*2); ctx.fill();

  // Corner label
  ctx.fillStyle = 'rgba(212,168,67,.55)';
  ctx.font = '8px Share Tech Mono'; ctx.textAlign = 'left';
  ctx.fillText('TACTICAL MAP', mx+6, my+mh-6);

  // Wave indicator
  ctx.textAlign = 'right';
  ctx.fillText('W' + G.wave, mx+mw-6, my+mh-6);

  ctx.restore();
}

// ── BULLETS — glowing tracer rounds ──────────────────────────
function drawBullets(G) {
  for (const b of G.bullets) {
    const isPlayer = b.owner === 'player';
    const tailX = b.x - b.vx * 3.5;
    const tailY = b.y - b.vy * 3.5;

    // Outer glow
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = isPlayer ? 'rgba(255,230,100,.6)' : 'rgba(255,80,40,.5)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.restore();

    // Core tracer
    ctx.strokeStyle = isPlayer ? 'rgba(255,240,160,.95)' : 'rgba(255,120,60,.95)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(b.x, b.y); ctx.stroke();

    // Bright tip
    const tipG = ctx.createRadialGradient(b.x,b.y,0, b.x,b.y,6);
    tipG.addColorStop(0, isPlayer ? 'rgba(255,255,220,1)' : 'rgba(255,200,150,1)');
    tipG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tipG;
    ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI*2); ctx.fill();
  }
}

// ── AIM LINE — laser sight ────────────────────────────────────
function drawAimLine(G) {
  const ang = angTo(G.player.x, G.player.y, INPUT.mouse.x, INPUT.mouse.y);
  const len = 100;
  const ex  = G.player.x + Math.cos(ang) * len;
  const ey  = G.player.y + Math.sin(ang) * len;

  ctx.save();
  // Glow
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = '#a0e060'; ctx.lineWidth = 6;
  ctx.setLineDash([6, 8]);
  ctx.beginPath(); ctx.moveTo(G.player.x, G.player.y); ctx.lineTo(ex, ey); ctx.stroke();
  // Core
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = '#d0ff80'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(G.player.x, G.player.y); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.setLineDash([]);
  // Dot at tip
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#80ff40';
  ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

// ── OVERLAYS — title, pause, game over ───────────────────────
function drawOverlay(G) {
  if (G.status === 'running') return;

  // Dark backdrop with scanlines
  ctx.fillStyle = 'rgba(0,0,0,.52)'; ctx.fillRect(0,0,W,H);
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.fillStyle = '#00ff44';
  for (let sy=0; sy<H; sy+=2) ctx.fillRect(0,sy,W,1);
  ctx.restore();

  // Stars in background
  ctx.save();
  for (const s of STARS) {
    ctx.globalAlpha = s.a * 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();

  const cx = W/2, cy = H/2;
  ctx.textAlign = 'center';

  if (G.status === 'ready') {
    // Title card
    ctx.save();
    // Amber glow behind title
    const tg = ctx.createRadialGradient(cx,cy-40,10,cx,cy-40,220);
    tg.addColorStop(0,'rgba(212,168,67,.22)'); tg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = tg; ctx.fillRect(0,0,W,H);

    ctx.shadowColor = 'rgba(212,168,67,.9)'; ctx.shadowBlur = 40;
    ctx.fillStyle = '#f0c060';
    ctx.font = 'bold 64px Share Tech Mono';
    ctx.fillText('⬡ TANK FRONTLINE', cx, cy-24);
    ctx.shadowBlur = 0;

    ctx.font = '18px Share Tech Mono'; ctx.fillStyle = '#88a0b8';
    ctx.fillText('ARMORED COMBAT SIMULATOR', cx, cy+18);

    // Animated deploy button hint
    const blink = Math.sin(performance.now()/400) > 0;
    ctx.font = '22px Share Tech Mono';
    ctx.fillStyle = blink ? '#f0c060' : 'rgba(240,192,96,.4)';
    ctx.fillText('▶  PRESS DEPLOY TO BEGIN  ◀', cx, cy+68);

    ctx.font = '11px Share Tech Mono'; ctx.fillStyle = 'rgba(120,140,160,.5)';
    ctx.fillText('A* PATHFINDING  ·  UTILITY AI  ·  TACTICAL DECISIONS', cx, cy+104);
    ctx.restore();

  } else if (G.status === 'lost') {
    // Red death glow
    ctx.save();
    const dg = ctx.createRadialGradient(cx,cy,10,cx,cy,280);
    dg.addColorStop(0,'rgba(180,20,20,.3)'); dg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = dg; ctx.fillRect(0,0,W,H);

    ctx.shadowColor = 'rgba(255,60,60,.9)'; ctx.shadowBlur = 35;
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 58px Share Tech Mono';
    ctx.fillText('MISSION FAILED', cx, cy-20);
    ctx.shadowBlur = 0;

    ctx.font = '20px Share Tech Mono'; ctx.fillStyle = '#c8d8e8';
    ctx.fillText(G.message, cx, cy+24);

    const blink2 = Math.sin(performance.now()/500) > 0;
    ctx.font = '17px Share Tech Mono';
    ctx.fillStyle = blink2 ? '#f0c060' : 'rgba(240,192,96,.3)';
    ctx.fillText('▶  PRESS DEPLOY TO RETRY  ◀', cx, cy+68);
    ctx.restore();

  } else if (G.status === 'paused') {
    ctx.save();
    ctx.shadowColor = 'rgba(100,180,255,.7)'; ctx.shadowBlur = 28;
    ctx.fillStyle = '#a0c8f0';
    ctx.font = 'bold 52px Share Tech Mono';
    ctx.fillText('⏸  PAUSED', cx, cy-10);
    ctx.shadowBlur = 0;
    ctx.font = '18px Share Tech Mono'; ctx.fillStyle = '#6a8aaa';
    ctx.fillText('Press PAUSE to resume', cx, cy+32);
    ctx.restore();
  }
}

// ── MASTER RENDER ─────────────────────────────────────────────
function renderGame(G) {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(shake.x, shake.y);

  // Ground + terrain
  drawBackground(G);

  // Decorative objects first (behind walls)
  for (const o of G.obstacles) if (o.type === 'decor') drawObstacle(o);
  // Solid obstacles
  for (const o of G.obstacles) if (o.type !== 'decor') drawObstacle(o);

  // Pickups
  for (const p of G.pickups) drawPickup(p);

  // Bullets (under effects so explosions cover them)
  drawBullets(G);

  // Explosions, smoke, emoji
  drawEffects(G);
  drawParticles(G);

  // Aim line (under tanks)
  if (G.status === 'running') drawAimLine(G);

  // Enemies (drawn before player so player is always on top)
  for (const e of G.enemies) {
    drawDetailedTank(e.x, e.y, e.bodyAngle, e.turretAngle, {
      team:'enemy',
      bodyColor:    e.cfg.bodyColor,
      turretColor:  e.cfg.turretColor,
      hp:e.hp, maxHp:e.maxHp,
      flashTimer:   e.flashTimer,
      scale:        e.cfg.scale,
      typeLabel:    e.cfg.label,
      actionLabel:  e.actionLabel
    });
  }

  // Player (on top of enemies)
  drawDetailedTank(G.player.x, G.player.y, G.player.bodyAngle, G.player.turretAngle, {
    team:'player', bodyColor:'#4e7232', turretColor:'#66923f',
    hp:G.player.hp, maxHp:G.player.maxHp,
    flashTimer:G.player.flashTimer, scale:1.08
  });

  // Minimap (always on top of game world)
  drawMinimap(G);

  ctx.restore(); // end shake transform

  // Damage vignette (full-screen, outside shake)
  if (G.damageFlash > 0) {
    const dv = ctx.createRadialGradient(W/2,H/2,100, W/2,H/2,W*0.7);
    dv.addColorStop(0, 'rgba(255,30,30,0)');
    dv.addColorStop(1, 'rgba(255,30,30,' + (G.damageFlash/22*0.45) + ')');
    ctx.fillStyle = dv; ctx.fillRect(0,0,W,H);
    G.damageFlash--;
  }

  // Status overlays
  drawOverlay(G);
}
