/* ============================================================
   bullets.js — Bullet physics, pickups, particles, and effects

   All functions that need game state accept G as a parameter
   EXCEPT the small helpers (addKillLog, addTrackMark, addShake)
   which access window.G directly — consistent with how the
   original single-file version worked.
   ============================================================ */

// ── Bullet creation ───────────────────────────────────────────
function fireBullet(owner, x, y, angle, dmg, G) {
  var sp = owner === 'player' ? B_SPEED : B_SPEED - 0.8;
  G.bullets.push({ owner:owner, x:x, y:y,
    vx: fwX(angle)*sp, vy: fwY(angle)*sp, ttl:130, dmg:dmg });
}

// ── Bullet update ─────────────────────────────────────────────
function updateBullets(G, dt) {
  var dt6  = dt * 0.06;
  var p    = G.player;
  var next = [];

  for (var bi = 0; bi < G.bullets.length; bi++) {
    var b = G.bullets[bi];
    b.x += b.vx * dt6;
    b.y += b.vy * dt6;
    b.ttl -= dt6;

    var dead = false;

    if (b.x < -30 || b.x > W+30 || b.y < -30 || b.y > H+30 || b.ttl <= 0) dead = true;

    if (!dead) {
      for (var oi = 0; oi < G.obstacles.length; oi++) {
        var o = G.obstacles[oi];
        if (o.solid && circleRect(b.x, b.y, B_RADIUS, o)) {
          addBurst(b.x, b.y, '#ffd39f', G);
          addExplosion(b.x, b.y, 0.8, G);
          dead = true; break;
        }
      }
    }

    if (!dead && b.owner === 'player') {
      for (var ei = 0; ei < G.enemies.length; ei++) {
        var e = G.enemies[ei];
        if (dist(b.x, b.y, e.x, e.y) < E_RADIUS * e.cfg.scale + B_RADIUS) {
          e.hp -= b.dmg;
          e.flashTimer = 8;
          e.underFire  = true;
          e.underFireTimer = 1200;
          addBurst(b.x, b.y, '#ffe0b5', G);
          addExplosion(b.x, b.y, 0.9, G);
          dead = true;
          if (e.hp <= 0) {
            G.score += e.cfg.reward;
            G.kills++;
            addExplosion(e.x, e.y, 1.3 * e.cfg.scale, G);
            maybeDropMedPack(e, G);
            addKillLog(e.cfg.label.toUpperCase() + ' DESTROYED +' + e.cfg.reward);
          }
          break;
        }
      }
    }

    if (!dead && b.owner === 'enemy') {
      if (dist(b.x, b.y, p.x, p.y) < P_RADIUS + B_RADIUS) {
        p.hp        -= b.dmg;
        p.flashTimer = 8;
        G.damageFlash = 22;
        addBurst(b.x, b.y, '#cfe8ff', G);
        addExplosion(b.x, b.y, 0.9, G);
        dead = true;
        addKillLog('ARMOR HIT -' + b.dmg);
      }
    }

    if (!dead) next.push(b);
  }
  G.bullets = next;
}

// ── Pickups ───────────────────────────────────────────────────
function updatePickups(G, dt) {
  var p = G.player;
  for (var i = 0; i < G.pickups.length; i++) G.pickups[i].ttl -= dt;
  G.pickups = G.pickups.filter(function(pk){ return pk.ttl > 0; });

  G.pickups = G.pickups.filter(function(pk) {
    if (dist(pk.x, pk.y, p.x, p.y) >= P_RADIUS + 14) return true;

    if (pk.type === 'med') {
      p.hp = p.hp <= p.maxHp * 0.5
        ? Math.min(p.maxHp, p.hp + p.maxHp * 0.5)
        : p.maxHp;
      addFloatingEmoji(p.x, p.y - 44, '😊', '#22c55e', G);
      addKillLog('FIRST AID COLLECTED');
      return false;
    }
    if (pk.type === 'hazard') {
      p.hp = Math.max(0, p.hp - 40);
      p.flashTimer  = 12;
      G.damageFlash = 22;
      addExplosion(pk.x, pk.y, 1.2, G);
      addBurst(pk.x, pk.y, '#ffd39f', G);
      addFloatingEmoji(p.x, p.y - 44, Math.random() < 0.5 ? '💥' : '🔥', '#ef4444', G);
      addKillLog('HAZARD TRIGGERED -40 HP');
      return false;
    }
    return true;
  });
}

function maybeDropMedPack(enemy, G) {
  if (Math.random() < 0.16)
    G.pickups.push({ x: enemy.x, y: enemy.y, type: 'med', ttl: 1200 });
}

// ── Effects creation ──────────────────────────────────────────
function addExplosion(x, y, size, G) {
  if (size === undefined) size = 1;
  G.effects.push({ type:'shockwave', x:x, y:y, r:0,       maxR:55*size, ttl:16,  maxTtl:16  });
  G.effects.push({ type:'fireball',  x:x, y:y, r:5*size,  maxR:28*size, ttl:18,  maxTtl:18  });
  G.effects.push({ type:'smokeBomb', x:x, y:y, r:10*size, maxR:45*size, ttl:240, maxTtl:240 });
  G.dynamicCraters.push({ x:x, y:y, r: 12 + 8*size });
  if (G.dynamicCraters.length > 20) G.dynamicCraters.shift();
  addShake(7 * size);
}

function addBurst(x, y, col, G) {
  for (var i = 0; i < 10; i++) {
    var a  = rnd(0, Math.PI * 2);
    var sp = rnd(1, 3);
    G.particles.push({ type:'spark', x:x, y:y,
      vx: Math.cos(a)*sp, vy: Math.sin(a)*sp,
      ttl: rnd(10,22), maxTtl:22, color:col });
  }
}

function addFloatingEmoji(x, y, emoji, color, G) {
  G.effects.push({ type:'emoji', x:x, y:y, emoji:emoji, color:color, ttl:240, maxTtl:240 });
}

// ── Shared helpers (use window.G) ─────────────────────────────
function addTrackMark(x, y, angle) {
  window.G.trackMarks.push({ x:x, y:y, angle:angle, alpha:0.38 });
  if (window.G.trackMarks.length > 500) window.G.trackMarks.splice(0, 2);
}

function addKillLog(msg) {
  window.G.killLog.unshift({ msg:msg, age:0 });
  if (window.G.killLog.length > 5) window.G.killLog.pop();
}

// ── Effects + particle tick ───────────────────────────────────
function updateEffects(G) {
  for (var i = 0; i < G.effects.length; i++) {
    var ef = G.effects[i];
    if (ef.type === 'shockwave' || ef.type === 'fireball')
      ef.r += ef.maxR / ef.maxTtl;
    ef.ttl -= 1;
  }
  G.effects   = G.effects.filter(function(e){ return e.ttl > 0; });

  for (var j = 0; j < G.particles.length; j++) {
    var p2 = G.particles[j];
    p2.x += p2.vx; p2.y += p2.vy; p2.ttl -= 1;
  }
  G.particles = G.particles.filter(function(p){ return p.ttl > 0; });

  for (var k = 0; k < G.killLog.length; k++) G.killLog[k].age += 16;
  G.killLog = G.killLog.filter(function(k){ return k.age < 6000; });
}
