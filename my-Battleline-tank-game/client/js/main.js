if (!requireAuth()) throw new Error('Not authenticated');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);

const W = 1280, H = 720;
const P_RADIUS = 26, P_MAX_HP = 100;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function fwX(a) { return Math.cos(a); }
function fwY(a) { return Math.sin(a); }

function makeObstacles() {
  return [
    { x: 285, y: 130, w: 44, h: 205, solid: true },
    { x: 329, y: 292, w: 362, h: 44, solid: true },
    { x: 975, y: 86, w: 208, h: 122, solid: true }
  ];
}

function resolveCircle(entity, radius, obstacles) {
  entity.x = clamp(entity.x, radius, W - radius);
  entity.y = clamp(entity.y, radius, H - radius);
  for (const o of obstacles) {
    if (!o.solid) continue;
    const hitX = Math.max(o.x, Math.min(entity.x, o.x + o.w));
    const hitY = Math.max(o.y, Math.min(entity.y, o.y + o.h));
    const dx = entity.x - hitX;
    const dy = entity.y - hitY;
    if ((dx * dx + dy * dy) < radius * radius) {
      if (Math.abs(dx) > Math.abs(dy)) entity.x += dx > 0 ? radius : -radius;
      else entity.y += dy > 0 ? radius : -radius;
    }
  }
}
