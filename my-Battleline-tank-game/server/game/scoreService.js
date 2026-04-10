/* ============================================================
   game/scoreService.js — Server-side score helpers
   Basic sanity checks so clients can't submit impossible scores.
   ============================================================ */

const MAX_SCORE_PER_KILL = 200;   // heavy tank reward cap
const MAX_WAVE           = 50;

/**
 * Returns true if the submitted score looks plausible.
 * @param {number} score
 * @param {number} kills
 * @param {number} wave
 */
function isScorePlausible(score, kills, wave) {
  if (typeof score !== 'number' || score < 0)  return false;
  if (typeof kills !== 'number' || kills < 0)  return false;
  if (typeof wave  !== 'number' || wave  < 1)  return false;
  if (wave  > MAX_WAVE)                        return false;
  // Score shouldn't exceed kills × max reward by a large margin
  if (score > kills * MAX_SCORE_PER_KILL * 1.2 + 1000) return false;
  return true;
}

module.exports = { isScorePlausible };
