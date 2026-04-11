const currentUser = getUser();
if (!currentUser) window.location.replace('login.html');

const navName = $('navPlayerName');
const navHS = $('navHighScore');
if (navName) navName.textContent = currentUser.name || 'Commander';
let highScore = 0;
let lastTime = performance.now();
let checkpointLoaded = false;
let autosaveAt = 0;
window.G = null;


function asNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function cloneList(list) {
  return Array.isArray(list) ? JSON.parse(JSON.stringify(list)) : [];
}

function getEnemyCountForLevel(level) {
  return Math.min(2 + Math.max(1, level), MAX_ENEMIES);
}

function createBasePickups() {
  return [
    { x:124,  y:110, type:'med',    ttl:999999 },
    { x:1130, y:662, type:'med',    ttl:999999 },
    { x:940,  y:86,  type:'med',    ttl:999999 },
    { x:420,  y:610, type:'hazard', ttl:999999 },
    { x:1085, y:245, type:'hazard', ttl:999999 },
    { x:215,  y:520, type:'hazard', ttl:999999 }
  ];
}

function createState(level = 1) {
  const obs = makeObstacles();
  buildNavGrid(obs);
  const enemies = [];
  const count = getEnemyCountForLevel(level);
  for (let i = 0; i < count; i++) enemies.push(spawnEnemy(i, level));

  return {
    player: createPlayer(),
    enemies,
    bullets: [],
    particles: [],
    effects: [],
    trackMarks: [],
    pickups: createBasePickups(),
    obstacles: obs,
    dynamicCraters: [],
    wave: level,
    score: 0,
    kills: 0,
    status: 'ready',
    message: 'Press DEPLOY to begin',
    killLog: [],
    damageFlash: 0
  };
}

async function saveScore() {
 if (!getToken()) return;
  try {
    await apiSaveScore(window.G.score, window.G.kills, window.G.wave);
    await apiClearGameState();
    checkpointLoaded = false;

    const stats = await apiGetStats();
    if (stats.highScore !== undefined) {
      highScore = stats.highScore;
      if (navHS) navHS.textContent = 'Best: ' + highScore;
      if (hiscoreDisplay) hiscoreDisplay.textContent = highScore;
    }
  } catch (err) {
    console.warn('[Game] Score save failed:', err.message || err);
  }
}
function prepareNextLevel() {
  window.G.wave += 1;

  const count = getEnemyCountForLevel(window.G.wave);
  window.G.enemies = [];
  window.G.bullets = [];

  for (let i = 0; i < count; i++) {
    window.G.enemies.push(spawnEnemy(i, window.G.wave));
  }

  window.G.message = `Level ${window.G.wave} incoming`;
  autosaveAt = 0;
}
function loop(now) {
  const dt = Math.min(32, now - lastTime);
  lastTime = now;
    updateShake();

  
  if (window.G.status === 'running') {
    updatePlayer(window.G.player, dt, window.G);
    for (const enemy of window.G.enemies) updateEnemy(enemy, window.G.player, dt, window.G);
    updateBullets(window.G, dt);
    updatePickups(window.G, dt);
    updateEffects(window.G);
    window.G.enemies = window.G.enemies.filter(e => e.hp > 0);
    if (window.G.player.hp <= 0) {
      
       window.G.status = 'lost';
      window.G.message = 'Mission failed — press DEPLOY to restart';
      saveScore();
    } else if (window.G.enemies.length === 0) {
      prepareNextLevel();
    }

    autosaveAt += dt;
    if (autosaveAt >= 5000) {
      autosaveAt = 0;
      persistCheckpoint('running');
    }
    
  }
 
  renderGame(window.G);
  updateHUD(window.G, highScore);
  requestAnimationFrame(loop);
}
async function startOrResumeGame() {
  if (window.G.status === 'paused' && checkpointLoaded) {
    window.G.status = 'running';
    window.G.message = `Level ${window.G.wave} resumed`;
    return;
  }

  if (window.G.status === 'running') return;

  checkpointLoaded = false;
  $('startBtn').textContent = '▶ DEPLOY';
  try { await apiClearGameState(); } catch (err) { console.warn('[Game] Could not clear old checkpoint:', err.message || err); }

  window.G = createState(1);
  window.G.status = 'running';
  window.G.message = 'Sector secure. Engage hostiles.';
  autosaveAt = 0;
}
async function togglePause() {
  if (window.G.status === 'running') {
    window.G.status = 'paused';
    window.G.message = `Level ${window.G.wave} paused`;
    await persistCheckpoint('paused');
  } else if (window.G.status === 'paused') {
    window.G.status = 'running';
    window.G.message = `Level ${window.G.wave} active`;
  }
}


$('startBtn').addEventListener('click', startOrResumeGame);
$('pauseBtn').addEventListener('click', togglePause);

async function handleLogout() {
  await persistCheckpoint('paused');
  logout();
}

$('logoutBtn').addEventListener('click', handleLogout);

window.addEventListener('beforeunload', () => {
  if (window.G && (window.G.status === 'running' || window.G.status === 'paused')) {
    apiSaveGameState(serializeState('paused'), true).catch(() => {});
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && window.G && window.G.status === 'running') {
    window.G.status = 'paused';
    window.G.message = `Level ${window.G.wave} paused`;
    persistCheckpoint('paused', true);
  }
});
async function init() {
  try {
    const stats = await apiGetStats();
    if (stats && stats.highScore !== undefined) {
      highScore = stats.highScore;
      if (navHS) navHS.textContent = 'Best: ' + highScore;
      if (hiscoreDisplay) hiscoreDisplay.textContent = highScore;
    }
  } catch (e) {
    console.warn('[Game] Stats unavailable:', e.message);
  }

  try {
    const saved = await apiGetGameState();
    if (saved && saved.hasSavedGame) {
      checkpointLoaded = true;
      window.G = restoreState(saved.state);
      window.G.status = 'paused';
      window.G.message = `Saved mission ready — resume Level ${window.G.wave}`;
      $('startBtn').textContent = '▶ RESUME';
    } else {
      window.G = createState(1);
      $('startBtn').textContent = '▶ DEPLOY';
    }
  } catch (e) {
    console.warn('[Game] Saved game unavailable:', e.message);
    window.G = createState(1);
    $('startBtn').textContent = '▶ DEPLOY';
  }

  renderGame(window.G);
  updateHUD(window.G, highScore);
  requestAnimationFrame(loop);
}
function sanitizeSavedEnemy(enemy, idx, level) {
  const type = ETYPES[enemy.type] ? enemy.type : pickEnemyType(level);
  const cfg = ETYPES[type];
  return {
    x: asNumber(enemy.x, SPAWN_POINTS[idx % SPAWN_POINTS.length].x),
    y: asNumber(enemy.y, SPAWN_POINTS[idx % SPAWN_POINTS.length].y),
    type,
    cfg,
    bodyAngle: asNumber(enemy.bodyAngle, 0),
    turretAngle: asNumber(enemy.turretAngle, 0),
    hp: Math.max(1, asNumber(enemy.hp, cfg.hp)),
    maxHp: Math.max(1, asNumber(enemy.maxHp, cfg.hp)),
    cooldown: asNumber(enemy.cooldown, 0),
    action: enemy.action || 'chase',
    path: Array.isArray(enemy.path) ? enemy.path : [],
    pathTarget: enemy.pathTarget || null,
    pathTimer: asNumber(enemy.pathTimer, 0),
    stuckTimer: asNumber(enemy.stuckTimer, 0),
    strafeDir: enemy.strafeDir === -1 ? -1 : 1,
    underFire: Boolean(enemy.underFire),
    underFireTimer: asNumber(enemy.underFireTimer, 0),
    flankSide: enemy.flankSide === -1 ? -1 : 1,
    flashTimer: asNumber(enemy.flashTimer, 0),
    trackTick: asNumber(enemy.trackTick, 0),
    decisionTimer: asNumber(enemy.decisionTimer, 0),
    actionLabel: enemy.actionLabel || 'RESUME'
  };
}

function sanitizeSavedBullet(bullet) {
  return {
    owner: bullet.owner === 'enemy' ? 'enemy' : 'player',
    x: asNumber(bullet.x, 0),
    y: asNumber(bullet.y, 0),
    vx: asNumber(bullet.vx, 0),
    vy: asNumber(bullet.vy, 0),
    ttl: Math.max(0, asNumber(bullet.ttl, 0)),
    dmg: Math.max(0, asNumber(bullet.dmg, 0))
  };
}


function restoreState(saved) {
  const base = createState(saved.level || 1);
  const level = Math.max(1, Math.floor(asNumber(saved.level, 1)));
  const player = saved.player || {};

  base.wave = level;
  base.score = Math.max(0, Math.floor(asNumber(saved.score, 0)));
  base.kills = Math.max(0, Math.floor(asNumber(saved.kills, 0)));
  base.status = saved.status === 'running' ? 'paused' : (saved.status || 'paused');
  base.message = saved.message || `Saved mission ready — resume Level ${level}`;
  base.dynamicCraters = cloneList(saved.dynamicCraters);
  base.killLog = cloneList(saved.killLog);
  base.pickups = Array.isArray(saved.pickups) ? cloneList(saved.pickups) : createBasePickups();
  base.particles = cloneList(saved.particles);
  base.effects = cloneList(saved.effects);
  base.trackMarks = cloneList(saved.trackMarks);
  base.damageFlash = Math.max(0, asNumber(saved.damageFlash, 0));

  base.player = {
    ...base.player,
    x: asNumber(player.x, base.player.x),
    y: asNumber(player.y, base.player.y),
    bodyAngle: asNumber(player.bodyAngle, base.player.bodyAngle),
    turretAngle: asNumber(player.turretAngle, base.player.turretAngle),
    hp: Math.max(1, asNumber(player.hp, base.player.hp)),
    maxHp: Math.max(P_MAX_HP, asNumber(player.maxHp, base.player.maxHp)),
    vx: asNumber(player.vx, 0),
    vy: asNumber(player.vy, 0),
    speed: asNumber(player.speed, 0),
    cooldown: asNumber(player.cooldown, 0),
    ammo: Math.max(0, Math.min(MAX_AMMO, asNumber(player.ammo, MAX_AMMO))),
    reloading: Boolean(player.reloading),
    reloadTimer: asNumber(player.reloadTimer, 0),
    trackTick: asNumber(player.trackTick, 0),
    flashTimer: asNumber(player.flashTimer, 0)
  };
  

  if (Array.isArray(saved.enemies)) {
    base.enemies = saved.enemies.map((enemy, idx) => sanitizeSavedEnemy(enemy, idx, level));
  }

  if (Array.isArray(saved.bullets)) {
    base.bullets = saved.bullets.map(sanitizeSavedBullet).filter(b => b.ttl > 0);
  }

  return base;
}
function serializeState(statusOverride) {
 
   if (!window.G) return null;

  return {
    status: statusOverride || window.G.status,
    level: window.G.wave,
    score: window.G.score,
    kills: window.G.kills,
    message: window.G.message,
    player: {
      x: window.G.player.x,
      y: window.G.player.y,
      bodyAngle: window.G.player.bodyAngle,
      turretAngle: window.G.player.turretAngle,
      hp: window.G.player.hp,
      maxHp: window.G.player.maxHp,
      vx: window.G.player.vx,
      vy: window.G.player.vy,
      speed: window.G.player.speed,
      cooldown: window.G.player.cooldown,
      ammo: window.G.player.ammo,
      reloading: window.G.player.reloading,
      reloadTimer: window.G.player.reloadTimer,
      trackTick: window.G.player.trackTick,
      flashTimer: window.G.player.flashTimer
    },
    enemies: window.G.enemies.map(enemy => ({
      x: enemy.x,
      y: enemy.y,
      type: enemy.type,
      bodyAngle: enemy.bodyAngle,
      turretAngle: enemy.turretAngle,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      cooldown: enemy.cooldown,
      action: enemy.action,
      path: enemy.path,
      pathTarget: enemy.pathTarget,
      pathTimer: enemy.pathTimer,
      stuckTimer: enemy.stuckTimer,
      strafeDir: enemy.strafeDir,
      underFire: enemy.underFire,
      underFireTimer: enemy.underFireTimer,
      flankSide: enemy.flankSide,
      flashTimer: enemy.flashTimer,
      trackTick: enemy.trackTick,
      decisionTimer: enemy.decisionTimer,
      actionLabel: enemy.actionLabel
    })),
    bullets: window.G.bullets.map(bullet => ({
      owner: bullet.owner,
      x: bullet.x,
      y: bullet.y,
      vx: bullet.vx,
      vy: bullet.vy,
      ttl: bullet.ttl,
      dmg: bullet.dmg
    })),
    particles: cloneList(window.G.particles),
    effects: cloneList(window.G.effects),
    trackMarks: cloneList(window.G.trackMarks),
    pickups: cloneList(window.G.pickups),
    dynamicCraters: cloneList(window.G.dynamicCraters),
       killLog: cloneList(window.G.killLog),
    damageFlash: window.G.damageFlash
  };
}


  
async function persistCheckpoint(statusOverride, keepalive = false) {
  if (!getToken() || !window.G) return;
  if (window.G.status === 'lost') return;
  try {
    await apiSaveGameState(serializeState(statusOverride || 'paused'), keepalive);
  } catch (err) {
    console.warn('[Game] Checkpoint save failed:', err.message || err);
  }
}

init();