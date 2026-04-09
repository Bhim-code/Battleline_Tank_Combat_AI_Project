const currentUser = getUser();
if (!currentUser) window.location.replace('login.html');

const navName = $('navPlayerName');
if (navName) navName.textContent = currentUser.name || 'Commander';

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
    }
  }

  renderGame(window.G);
  updateHUD(window.G, 0);
  requestAnimationFrame(loop);
}
function startGame() {
  window.G = createState();
  window.G.status = 'running';
  window.G.message = 'Sector secure. Engage hostiles.';
}
function togglePause() {
  if (!window.G) return;
  window.G.status = window.G.status === 'running' ? 'paused' : 'running';
  window.G.message = window.G.status === 'paused' ? 'Mission paused' : 'Mission resumed';
}

$('startBtn').addEventListener('click', startGame);

$('pauseBtn').addEventListener('click', togglePause);

$('logoutBtn').addEventListener('click', logout);

window.G = createState();
renderGame(window.G);
updateHUD(window.G, 0);
requestAnimationFrame(loop);

