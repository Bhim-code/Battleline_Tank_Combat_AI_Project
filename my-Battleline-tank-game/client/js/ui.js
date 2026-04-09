function renderGame(G) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#161f2b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#243041';
  for (const o of G.obstacles || []) ctx.fillRect(o.x, o.y, o.w, o.h);

  ctx.save();
  ctx.translate(G.player.x, G.player.y);
  ctx.rotate(G.player.bodyAngle);
  ctx.fillStyle = '#d4a843';
  ctx.fillRect(-20, -14, 40, 28);
  ctx.restore();

  ctx.save();
  ctx.translate(G.player.x, G.player.y);
  ctx.rotate(G.player.turretAngle);
  ctx.fillStyle = '#8ba4b8';
  ctx.fillRect(0, -4, 30, 8);
  ctx.restore();
}

function updateHUD(G) {
  $('waveVal').textContent = G.wave;
  $('scoreVal').textContent = G.score;
  $('killVal').textContent = G.kills;
  $('statusVal').textContent = (G.status || 'ready').toUpperCase();
  $('msgVal').textContent = G.message || '';
}
