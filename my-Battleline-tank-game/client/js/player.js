/* ============================================================
   player.js — Player tank state, movement, and firing
   
   Movement model: world-space velocity (vx, vy).
   W always accelerates in the direction the tank currently faces.
   S always decelerates / reverses from the current facing.
   Rotating the hull does NOT flip forward/backward — the
   velocity persists in world-space so the tank slides naturally.
   ============================================================ */

// ── Player state factory ──────────────────────────────────────
function createPlayer() {
  return {
    x: 528, y: 544,
    bodyAngle:   -1.05,   // hull rotation (A/D keys)
    turretAngle: -0.75,   // turret rotation (mouse)
    hp: P_MAX_HP, maxHp: P_MAX_HP,
    // World-space velocity — the fix for the "reversed controls" bug
    vx: 0, vy: 0,
    speed: 0,             // magnitude, kept for track-mark threshold
    cooldown:    0,
    ammo:        MAX_AMMO,
    reloading:   false,
    reloadTimer: 0,
    trackTick:   0,
    flashTimer:  0
  };
}

// ── Player update (called every frame) ───────────────────────
function updatePlayer(player, dt, G) {
  const dt6 = dt * 0.06;

  // Turret follows mouse (turret rotates freely, body stays fixed)
  player.turretAngle = pickAimTarget(player.x, player.y, INPUT.mouse.x, INPUT.mouse.y, G.enemies);

  // Timers
  player.cooldown  -= dt;
  if (player.flashTimer > 0) player.flashTimer -= 1;

  // Reload logic
  if (player.reloading) {
    player.reloadTimer -= dt;
    if (player.reloadTimer <= 0) {
      player.reloading   = false;
      player.ammo        = MAX_AMMO;
      addKillLog('MAIN GUN READY');
    }
  }

  // ── Hull rotation (A / D) ────────────────────────────────
  if (INPUT.keys['a'] || INPUT.keys['arrowleft'])  player.bodyAngle -= P_ROT * dt6;
  if (INPUT.keys['d'] || INPUT.keys['arrowright']) player.bodyAngle += P_ROT * dt6;

  // ── Thrust in world-space (fixes forward/backward confusion) ─
  // W adds velocity in the direction the tank faces RIGHT NOW.
  // Even if you've rotated 180°, W still pushes "forward" from
  // the visual front of the hull — no flip, ever.
  if (INPUT.keys['w'] || INPUT.keys['arrowup']) {
    player.vx += fwX(player.bodyAngle) * P_ACCEL  * dt6;
    player.vy += fwY(player.bodyAngle) * P_ACCEL  * dt6;
  }
  if (INPUT.keys['s'] || INPUT.keys['arrowdown']) {
    player.vx -= fwX(player.bodyAngle) * P_REVERSE * dt6;
    player.vy -= fwY(player.bodyAngle) * P_REVERSE * dt6;
  }

  // Friction
  const friction = Math.pow(P_FRICTION, dt6);
  player.vx *= friction;
  player.vy *= friction;

  // Clamp total speed
  const spd = Math.hypot(player.vx, player.vy);
  if (spd > P_MAX_SPEED) {
    player.vx = player.vx / spd * P_MAX_SPEED;
    player.vy = player.vy / spd * P_MAX_SPEED;
  }
  player.speed = spd;

  // Move and resolve collisions
  const ox = player.x, oy = player.y;
  player.x += player.vx * dt6;
  player.y += player.vy * dt6;
  resolveCircle(player, P_RADIUS, G.obstacles);

  // Kill velocity on the blocked axis
  if (Math.abs(player.x - ox) < 0.01) player.vx *= 0.3;
  if (Math.abs(player.y - oy) < 0.01) player.vy *= 0.3;

  // Track marks
  player.trackTick -= dt;
  if (spd > 0.6 && player.trackTick <= 0) {
    addTrackMark(
      player.x + fwX(player.bodyAngle - Math.PI / 2) * 17,
      player.y + fwY(player.bodyAngle - Math.PI / 2) * 17,
      player.bodyAngle
    );
    addTrackMark(
      player.x + fwX(player.bodyAngle + Math.PI / 2) * 17,
      player.y + fwY(player.bodyAngle + Math.PI / 2) * 17,
      player.bodyAngle
    );
    player.trackTick = 120;
  }

  // Auto-fire on mouse hold or spacebar
  if (INPUT.mouse.down) firePlayer(player, G);
}

// ── Fire ─────────────────────────────────────────────────────
function firePlayer(player, G) {
  if (player.reloading || player.cooldown > 0) return;
  if (player.ammo <= 0) {
    player.reloading   = true;
    player.reloadTimer = RELOAD_MS;
    addKillLog('RELOADING MAIN GUN');
    return;
  }
  const ex = player.x + fwX(player.turretAngle) * 32;
  const ey = player.y + fwY(player.turretAngle) * 32;
  fireBullet('player', ex, ey, player.turretAngle, 18, G);
  G.particles.push({ type:'muzzle', x:ex, y:ey, angle:player.turretAngle, ttl:6, maxTtl:6, color:'#ffd24a' });
  player.cooldown = P_FIRE_CD;
  player.ammo--;
  addShake(2.5);
  if (player.ammo <= 0) {
    player.reloading   = true;
    player.reloadTimer = RELOAD_MS;
  }
}
