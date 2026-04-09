/* ============================================================
   enemy.js — Enemy AI: A* pathfinding + utility-based decisions
   
   Architecture:
   1. buildNavGrid()   — converts obstacles into a walkable grid
   2. astar()          — finds shortest path between two world points
   3. scoreActions()   — utility scoring for 6 possible actions
   4. pickAction()     — selects highest-scoring action
   5. updateEnemy()    — per-frame enemy tick
   ============================================================ */

// ── Navigation grid ───────────────────────────────────────────
const GRID_SIZE = 28;
const GRID_W    = Math.ceil(W / GRID_SIZE);
const GRID_H    = Math.ceil(H / GRID_SIZE);

let walkable = [];

function buildNavGrid(obstacles) {
  walkable = [];
  for (let gy = 0; gy < GRID_H; gy++) {
    walkable[gy] = [];
    for (let gx = 0; gx < GRID_W; gx++) {
      const wx = gx * GRID_SIZE + GRID_SIZE / 2;
      const wy = gy * GRID_SIZE + GRID_SIZE / 2;
      let blocked = false;
      const margin = 18;
      for (const o of obstacles) {
        if (!o.solid) continue;
        if (wx >= o.x - margin && wx <= o.x + o.w + margin &&
            wy >= o.y - margin && wy <= o.y + o.h + margin) {
          blocked = true; break;
        }
      }
      walkable[gy][gx] = !blocked;
    }
  }
}

function worldToGrid(wx, wy) {
  return { gx: Math.floor(wx / GRID_SIZE), gy: Math.floor(wy / GRID_SIZE) };
}
function gridToWorld(gx, gy) {
  return { wx: gx * GRID_SIZE + GRID_SIZE / 2, wy: gy * GRID_SIZE + GRID_SIZE / 2 };
}

// ── A* pathfinding ────────────────────────────────────────────
function astar(sx, sy, gx, gy) {
  const start = worldToGrid(sx, sy);
  const goal  = worldToGrid(gx, gy);

  if (!walkable[start.gy]?.[start.gx]) return null;
  if (!walkable[goal.gy]?.[goal.gx])   return null;
  if (start.gx === goal.gx && start.gy === goal.gy) return [];

  const key = (x, y) => y * GRID_W + x;
  const h   = (x, y) => Math.abs(x - goal.gx) + Math.abs(y - goal.gy);

  const open     = new Map();
  const closed   = new Set();
  const cameFrom = new Map();
  const gScore   = new Map();
  const fScore   = new Map();

  const sk = key(start.gx, start.gy);
  gScore.set(sk, 0);
  fScore.set(sk, h(start.gx, start.gy));
  open.set(sk, { x: start.gx, y: start.gy });

  const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
  let iterations = 0;

  while (open.size > 0 && iterations < 400) {
    iterations++;
    let bestK = null, bestF = Infinity;
    for (const [k] of open) {
      const f = fScore.get(k) ?? Infinity;
      if (f < bestF) { bestF = f; bestK = k; }
    }
    const cur = open.get(bestK);
    if (cur.x === goal.gx && cur.y === goal.gy) {
      const path = [];
      let ck = bestK;
      while (cameFrom.has(ck)) {
        const n = cameFrom.get(ck);
        path.unshift(gridToWorld(n.x, n.y));
        ck = key(n.x, n.y);
      }
      path.push(gridToWorld(goal.gx, goal.gy));
      return simplifyPath(path);
    }
    open.delete(bestK);
    closed.add(bestK);

    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue;
      if (!walkable[ny]?.[nx]) continue;
      const nk      = key(nx, ny);
      if (closed.has(nk)) continue;
      const tentG   = (gScore.get(bestK) ?? 0) + (dx !== 0 && dy !== 0 ? 1.41 : 1);
      if (tentG < (gScore.get(nk) ?? Infinity)) {
        cameFrom.set(nk, { x: cur.x, y: cur.y });
        gScore.set(nk, tentG);
        fScore.set(nk, tentG + h(nx, ny));
        if (!open.has(nk)) open.set(nk, { x: nx, y: ny });
      }
    }
  }
  return null;
}

function simplifyPath(path) {
  if (path.length <= 2) return path;
  const simple = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    const prev = simple[simple.length - 1];
    const next = path[i + 1];
    const dx1 = path[i].wx - prev.wx, dy1 = path[i].wy - prev.wy;
    const dx2 = next.wx - path[i].wx, dy2 = next.wy - path[i].wy;
    const dot  = dx1 * dx2 + dy1 * dy2;
    const m    = Math.hypot(dx1, dy1) * Math.hypot(dx2, dy2);
    if (m < 0.01 || dot / m < 0.9) simple.push(path[i]);
  }
  simple.push(path[path.length - 1]);
  return simple;
}

function nearestWalkable(wx, wy) {
  const g = worldToGrid(wx, wy);
  if (walkable[g.gy]?.[g.gx]) return { wx, wy };
  for (let r = 1; r < 6; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = g.gx + dx, ny = g.gy + dy;
        if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue;
        if (walkable[ny]?.[nx]) return gridToWorld(nx, ny);
      }
    }
  }
  return { wx, wy };
}

function findCoverPosition(fromX, fromY, awayX, awayY, obstacles) {
  let best = null, bestScore = -Infinity;
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2;
    const r   = 60 + Math.random() * 90;
    const cx  = clamp(fromX + Math.cos(ang) * r, 20, W - 20);
    const cy  = clamp(fromY + Math.sin(ang) * r, 20, H - 20);
    const g   = worldToGrid(cx, cy);
    if (!walkable[g.gy]?.[g.gx]) continue;
    const threatDist   = dist(cx, cy, awayX, awayY);
    let   nearObstacle = false;
    for (const o of obstacles) {
      if (!o.solid) continue;
      if (dist(cx, cy, o.x + o.w / 2, o.y + o.h / 2) < 70) { nearObstacle = true; break; }
    }
    const score = threatDist * (nearObstacle ? 1.8 : 0.8);
    if (score > bestScore) { bestScore = score; best = { wx: cx, wy: cy }; }
  }
  return best;
}

function findFlankPosition(ex, ey, px, py, side) {
  const toPlayer  = angTo(ex, ey, px, py);
  const flankAng  = toPlayer + (side > 0 ? Math.PI * 0.55 : -Math.PI * 0.55);
  const flankDist = 90 + Math.random() * 60;
  const fx = clamp(px + Math.cos(flankAng) * flankDist, 30, W - 30);
  const fy = clamp(py + Math.sin(flankAng) * flankDist, 30, H - 30);
  const g  = worldToGrid(fx, fy);
  return walkable[g.gy]?.[g.gx] ? { wx: fx, wy: fy } : nearestWalkable(fx, fy);
}

// ── Utility scoring ───────────────────────────────────────────
function scoreActions(enemy, player, obstacles) {
  const d      = dist(enemy.x, enemy.y, player.x, player.y);
  const los    = hasLOS(enemy.x, enemy.y, player.x, player.y, obstacles);
  const hp     = enemy.hp / enemy.maxHp;
  const W_     = enemy.cfg.weights;

  let coverDist = 999;
  for (const o of obstacles) {
    if (!o.solid) continue;
    const cd = dist(enemy.x, enemy.y, o.x + o.w / 2, o.y + o.h / 2);
    if (cd < coverDist) coverDist = cd;
  }
  const inCover = coverDist < 55;

  return {
    chase:      W_.chase      * (d > 260 ? 1.2 : 0.3) * (los ? 0.9 : 1.1) * (hp > 0.4 ? 1 : 0.5),
    attack:     W_.attack     * (los ? 1.5 : 0.1)      * (d < 280 && d > 80 ? 1.4 : 0.4) * (hp > 0.25 ? 1 : 0.6),
    flank:      W_.flank      * (!los ? 1.6 : 0.6)     * (d < 400 ? 1.2 : 0.5)           * (hp > 0.5 ? 1.1 : 0.3),
    cover:      W_.cover      * ((1 - hp) * 1.8 + 0.2) * (inCover ? 0.2 : 1.2)            * (enemy.underFire ? 1.5 : 0.8),
    retreat:    W_.retreat    * (hp < 0.35 ? 2.2 : 0.15) * (d < 200 ? 1.3 : 0.6),
    reposition: W_.reposition * (enemy.stuckTimer > 120 ? 2.0 : 0.5) * (!los ? 1.2 : 0.4) * (hp > 0.2 ? 1 : 0.3)
  };
}

function pickAction(scores) {
  let best = null, bestVal = -Infinity;
  for (const [k, v] of Object.entries(scores)) {
    if (v > bestVal) { bestVal = v; best = k; }
  }
  return best;
}

// ── Enemy factory ─────────────────────────────────────────────
function pickEnemyType(wave) {
  const r = Math.random();
  if (wave < 2) return 'standard';
  if (wave < 3) return r < 0.3 ? 'scout' : 'standard';
  if (wave < 5) return r < 0.35 ? 'scout' : r < 0.7 ? 'standard' : 'heavy';
  return r < 0.3 ? 'scout' : r < 0.6 ? 'standard' : 'heavy';
}

function spawnEnemy(idx, wave) {
  const p    = SPAWN_POINTS[idx % SPAWN_POINTS.length];
  const type = pickEnemyType(wave);
  const T    = ETYPES[type];
  return {
    x: p.x, y: p.y, type, cfg: T,
    bodyAngle: Math.PI * 0.8, turretAngle: Math.PI * 0.8,
    hp: T.hp + wave * 4, maxHp: T.hp + wave * 4,
    cooldown: 400 + Math.random() * 600,
    action: 'chase', path: [], pathTarget: null, pathTimer: 0,
    stuckTimer: 0, strafeDir: Math.random() > 0.5 ? 1 : -1,
    underFire: false, underFireTimer: 0,
    flankSide: Math.random() > 0.5 ? 1 : -1,
    flashTimer: 0, trackTick: 0,
    decisionTimer: 0, actionLabel: 'INIT'
  };
}

// ── Per-frame enemy update ────────────────────────────────────
function updateEnemy(enemy, player, dt, G) {
  const dt6 = dt * 0.06;
  const T   = enemy.cfg;

  enemy.cooldown -= dt;
  if (enemy.flashTimer    > 0) enemy.flashTimer    -= 1;
  if (enemy.underFireTimer > 0) { enemy.underFireTimer -= dt; enemy.underFire = true; }
  else enemy.underFire = false;

  const d   = dist(enemy.x, enemy.y, player.x, player.y);
  const los = hasLOS(enemy.x, enemy.y, player.x, player.y, G.obstacles);

  // Turret always tracks player
  enemy.turretAngle = lerpAngle(enemy.turretAngle, angTo(enemy.x, enemy.y, player.x, player.y), T.speed * 0.08);

  // Re-evaluate action every ~400ms
  enemy.decisionTimer -= dt;
  if (enemy.decisionTimer <= 0) {
    const scores    = scoreActions(enemy, player, G.obstacles);
    const newAction = pickAction(scores);
    if (newAction !== enemy.action) {
      enemy.action     = newAction;
      enemy.path       = [];
      enemy.pathTarget = null;
    }
    enemy.actionLabel   = enemy.action.toUpperCase();
    enemy.decisionTimer = 350 + Math.random() * 200;
  }

  // Determine move target based on action
  let moveTarget = null;

  switch (enemy.action) {
    case 'chase':
      moveTarget = { wx: player.x, wy: player.y };
      break;

    case 'attack':
      if (los && d > 100 && d < 300) {
        const sAng = angTo(enemy.x, enemy.y, player.x, player.y) + (Math.PI / 2) * enemy.strafeDir;
        moveTarget = { wx: enemy.x + Math.cos(sAng) * 50, wy: enemy.y + Math.sin(sAng) * 50 };
      } else if (d > 260) {
        moveTarget = { wx: player.x, wy: player.y };
      }
      if (enemy.cooldown <= 0 && los && d < 340) {
        shootEnemy(enemy, G);
        if (Math.random() > 0.5) enemy.strafeDir *= -1;
      }
      break;

    case 'flank':
      if (!enemy.pathTarget || dist(enemy.x, enemy.y, enemy.pathTarget.wx, enemy.pathTarget.wy) < 40) {
        enemy.pathTarget = findFlankPosition(enemy.x, enemy.y, player.x, player.y, enemy.flankSide);
        enemy.flankSide *= -1;
        enemy.path = [];
      }
      moveTarget = enemy.pathTarget;
      if (enemy.cooldown <= 0 && los && d < 300) shootEnemy(enemy, G);
      break;

    case 'cover':
      if (!enemy.pathTarget || dist(enemy.x, enemy.y, enemy.pathTarget.wx, enemy.pathTarget.wy) < 35) {
        enemy.pathTarget = findCoverPosition(enemy.x, enemy.y, player.x, player.y, G.obstacles) || enemy.pathTarget;
        enemy.path = [];
      }
      moveTarget = enemy.pathTarget;
      break;

    case 'retreat': {
      const awayAng = angTo(player.x, player.y, enemy.x, enemy.y);
      moveTarget = {
        wx: clamp(enemy.x + Math.cos(awayAng) * 200, 40, W - 40),
        wy: clamp(enemy.y + Math.sin(awayAng) * 200, 40, H - 40)
      };
      if (enemy.cooldown <= 0 && los && d < 300) shootEnemy(enemy, G);
      break;
    }

    case 'reposition':
      if (!enemy.pathTarget || dist(enemy.x, enemy.y, enemy.pathTarget.wx, enemy.pathTarget.wy) < 40) {
        const ang = Math.random() * Math.PI * 2;
        const r   = 80 + Math.random() * 120;
        enemy.pathTarget = nearestWalkable(
          clamp(enemy.x + Math.cos(ang) * r, 40, W - 40),
          clamp(enemy.y + Math.sin(ang) * r, 40, H - 40)
        );
        enemy.path = [];
      }
      moveTarget = enemy.pathTarget;
      break;
  }

  // Opportunistic snap-shot from non-attack states
  if (enemy.action !== 'attack' && los && d < 260 && enemy.cooldown <= 0) {
    shootEnemy(enemy, G);
  }

  // A* path following
  if (moveTarget) {
    const distToTarget = dist(enemy.x, enemy.y, moveTarget.wx, moveTarget.wy);
    enemy.pathTimer -= dt;
    const targetMoved = enemy.pathTarget && dist(enemy.pathTarget.wx, enemy.pathTarget.wy, moveTarget.wx, moveTarget.wy) > 80;
    const needRepath  = enemy.path.length === 0 || targetMoved || (enemy.pathTimer <= 0 && distToTarget > 60);

    if (needRepath && distToTarget > 30) {
      const dest     = nearestWalkable(moveTarget.wx, moveTarget.wy);
      enemy.path     = astar(enemy.x, enemy.y, dest.wx, dest.wy) ?? [];
      enemy.pathTimer = 800 + Math.random() * 400;
    }

    let tx = moveTarget.wx, ty = moveTarget.wy;
    if (enemy.path.length > 0) {
      const wp = enemy.path[0];
      if (dist(enemy.x, enemy.y, wp.wx, wp.wy) < 28) enemy.path.shift();
      else { tx = wp.wx; ty = wp.wy; }
    }

    if (dist(enemy.x, enemy.y, tx, ty) > 20) {
      enemy.bodyAngle = lerpAngle(enemy.bodyAngle, angTo(enemy.x, enemy.y, tx, ty), 0.12);
      const spd = T.speed * (enemy.action === 'retreat' ? 1.15 : 1);
      const bx = enemy.x, by = enemy.y;
      enemy.x += fwX(enemy.bodyAngle) * spd * dt6;
      enemy.y += fwY(enemy.bodyAngle) * spd * dt6;
      resolveCircle(enemy, E_RADIUS, G.obstacles);

      if (dist(bx, by, enemy.x, enemy.y) < 0.08) {
        enemy.stuckTimer += dt;
        if (enemy.stuckTimer > 250) {
          enemy.path = []; enemy.pathTarget = null; enemy.stuckTimer = 0;
          enemy.action = 'reposition'; enemy.decisionTimer = 0;
          enemy.bodyAngle += Math.PI * 0.5 * enemy.strafeDir;
          enemy.strafeDir *= -1;
        }
      } else enemy.stuckTimer = 0;
    }
  }

  // Track marks
  enemy.trackTick -= dt;
  if (enemy.trackTick <= 0) {
    addTrackMark(
      enemy.x + fwX(enemy.bodyAngle - Math.PI / 2) * 16 * T.scale,
      enemy.y + fwY(enemy.bodyAngle - Math.PI / 2) * 16 * T.scale,
      enemy.bodyAngle
    );
    enemy.trackTick = 150;
  }
}

function shootEnemy(enemy, G) {
  const ex = enemy.x + fwX(enemy.turretAngle) * 30;
  const ey = enemy.y + fwY(enemy.turretAngle) * 30;
  fireBullet('enemy', ex, ey, enemy.turretAngle, enemy.cfg.dmg, G);
  G.particles.push({ type:'muzzle', x:ex, y:ey, angle:enemy.turretAngle, ttl:6, maxTtl:6, color:'#ff9040' });
  enemy.cooldown = enemy.cfg.fireCd + rnd(0, 300);
}
