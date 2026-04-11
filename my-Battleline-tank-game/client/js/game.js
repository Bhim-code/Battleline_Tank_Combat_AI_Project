const currentUser = getUser();
if (!currentUser) window.location.replace('login.html');

const navName = $('navPlayerName');
const navHS = $('navHighScore');
if (navName) navName.textContent = currentUser.name || 'Commander';
let highScore = 0;
let lastTime = performance.now();
window.G = null;
function createState() {
  const obs = makeObstacles();
  buildNavGrid(obs);
  return {
    player: createPlayer(),
    enemies: [spawnEnemy(0, 1), spawnEnemy(1, 1), spawnEnemy(2, 1)],
    bullets: [],
    particles: [],
    effects: [],
    trackMarks: [],
    pickups: [],
    obstacles: obs,
    dynamicCraters: [],
    wave: 1,
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
function togglePause() {
  if (!window.G) return;
  window.G.status = window.G.status === 'running' ? 'paused' : 'running';
  window.G.message = window.G.status === 'paused' ? 'Mission paused' : 'Mission ready';
}

$('startBtn').addEventListener('click', startGame);

$('pauseBtn').addEventListener('click', togglePause);

$('logoutBtn').addEventListener('click', logout);
(async function init() {
  try {
    const stats = await apiGetStats();
    highScore = stats.highScore || 0;
    if (navHS) navHS.textContent = 'Best: ' + highScore;
    if (hiscoreDisplay) hiscoreDisplay.textContent = highScore;
  } catch {}
  window.G = createState();
  renderGame(window.G);
  updateHUD(window.G, highScore);
  requestAnimationFrame(loop);
})();