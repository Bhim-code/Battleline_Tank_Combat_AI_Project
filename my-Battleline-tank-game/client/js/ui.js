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