const currentUser = getUser();
if (!currentUser) window.location.replace('login.html');

const navName = document.getElementById('navPlayerName');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const logoutBtn = document.getElementById('logoutBtn');
if (navName) navName.textContent = currentUser?.name || 'Commander';

window.G = {
  player: createPlayer(),
  bullets: [],
  obstacles: makeObstacles(),
  wave: 1,
  score: 0,
  kills: 0,
  status: 'ready',
  message: 'Press DEPLOY to begin'
};

function loop() {
  renderGame(window.G);
  updateHUD(window.G, 0);
  requestAnimationFrame(loop);
}

startBtn.addEventListener('click', () => {
  window.G.status = 'running';
  window.G.message = 'Prototype build deployed';
});

pauseBtn.addEventListener('click', () => {
  window.G.status = window.G.status === 'running' ? 'paused' : 'running';
  window.G.message = window.G.status === 'paused' ? 'Paused' : 'Resumed';
});

logoutBtn.addEventListener('click', logout);

loop();
