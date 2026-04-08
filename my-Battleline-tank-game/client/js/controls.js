/* ============================================================
   controls.js — Keyboard and mouse input state
   Stores raw input; player.js reads it each frame.
   ============================================================ */

// Input state object — imported by player.js
const INPUT = {
  keys:  {},
  mouse: { x: W * 0.65, y: H * 0.38, down: false }
};

const PREVENT_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);

window.addEventListener('keydown', e => {
  if (PREVENT_KEYS.has(e.key)) e.preventDefault();
  INPUT.keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') INPUT.mouse.down = true;
}, { passive: false });

window.addEventListener('keyup', e => {
  if (PREVENT_KEYS.has(e.key)) e.preventDefault();
  INPUT.keys[e.key.toLowerCase()] = false;
  if (e.key === ' ') INPUT.mouse.down = false;
}, { passive: false });

canvas.addEventListener('mousemove', e => {
  const r  = canvas.getBoundingClientRect();
  const sx = W / r.width;
  const sy = H / r.height;
  INPUT.mouse.x = (e.clientX - r.left) * sx;
  INPUT.mouse.y = (e.clientY - r.top)  * sy;
});

canvas.addEventListener('mousedown', () => INPUT.mouse.down = true);
window.addEventListener('mouseup',   () => INPUT.mouse.down = false);
