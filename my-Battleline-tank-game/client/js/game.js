const currentUser = getUser();
if (!currentUser) window.location.replace('login.html');

const navName = $('navPlayerName');
const navHS = $('navHighScore');
if (navName) navName.textContent = currentUser.name || 'Commander';
let highScore = 0;
let lastTime = performance.now();
window.G = null;
function createState(level = 1) {
  
  const obs = makeObstacles();
  buildNavGrid(obs);
  return {
    player: createPlayer(),
    enemies: [spawnEnemy(0, level), spawnEnemy(1, level), spawnEnemy(2, level)],
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
    const stats = await apiGetStats();
    highScore = stats.highScore || 0;
    if (navHS) navHS.textContent = 'Best: ' + highScore;
    if (hiscoreDisplay) hiscoreDisplay.textContent = highScore;
  } catch (err) {
    console.warn('[Game] Score save failed:', err.message || err);
  }
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

init();

let checkpointLoaded = false;
let autosaveAt = 0;

function asNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
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

function restoreState(saved) { const level = Math.max(1, Math.floor(asNumber(saved.level, 1)));
  const next = createState(level);
  next.wave = level;
  next.score = Math.max(0, Math.floor(asNumber(saved.score, 0)));
  next.kills = Math.max(0, Math.floor(asNumber(saved.kills, 0)));
  next.status = 'paused';
  next.message = saved.message || `Saved mission ready — resume Level ${level}`;
  const player = saved.player || {};
  next.player.x = asNumber(player.x, next.player.x);
  next.player.y = asNumber(player.y, next.player.y);
  next.player.bodyAngle = asNumber(player.bodyAngle, next.player.bodyAngle);
  next.player.turretAngle = asNumber(player.turretAngle, next.player.turretAngle);
  next.player.hp = Math.max(1, asNumber(player.hp, next.player.hp));
  next.player.ammo = Math.max(0, Math.min(MAX_AMMO, asNumber(player.ammo, next.player.ammo)));
  return next;
 }
function serializeState(statusOverride) {
  return {
    status: statusOverride || window.G.status || 'paused',
    level: window.G.wave,
    score: window.G.score,
    kills: window.G.kills,
    message: window.G.message || '',
    player: {
      x: window.G.player.x,
      y: window.G.player.y,
      bodyAngle: window.G.player.bodyAngle,
      turretAngle: window.G.player.turretAngle,
      hp: window.G.player.hp,
      ammo: window.G.player.ammo
    }
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