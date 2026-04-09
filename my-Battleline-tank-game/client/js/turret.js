/* ============================================================
   turret.js — Turret aiming logic and aim assist
   The turret rotates freely with the mouse, independent of
   the hull body angle. Only the body rotates with A/D keys.
   ============================================================ */

/**
 * Pick the best aim angle for the player's turret.
 * If an enemy is close to the crosshair, snap slightly toward it.
 * @param {number} px, py  - player world position
 * @param {number} mx, my  - mouse world position
 * @param {Array}  enemies - array of live enemy objects
 * @returns {number} angle in radians
 */
function pickAimTarget(px, py, mx, my, enemies) {
  const raw = angTo(px, py, mx, my);
  let best  = null;

  for (const e of enemies) {
    const d    = dist(mx, my, e.x, e.y);
    if (d > AIM_ASSIST_R) continue;

    const a    = angTo(px, py, e.x, e.y);
    const diff = Math.abs(normAng(a - raw));
    if (diff > AIM_ASSIST_ANG) continue;

    const score = d + diff * 150;
    if (!best || score < best.score) best = { angle: a, score };
  }

  return best ? best.angle : raw;
}
