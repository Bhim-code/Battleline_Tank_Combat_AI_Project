if (!requireAuth()) throw new Error('Not authenticated');

const user = getUser();
document.getElementById('profileName').textContent = user?.name || 'Commander';
document.getElementById('profileEmail').textContent = user?.email || '';
document.getElementById('logoutBtn').addEventListener('click', logout);


// ── Format date ───────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { year:'numeric', month:'short', day:'numeric' });
}

async function loadProfile() {
  try {
    const [profile, stats] = await Promise.all([apiGetProfile(), apiGetStats()]);

    // Stat cards
    document.getElementById('statHighScore').textContent  = stats.highScore    ?? 0;
    document.getElementById('statLatestScore').textContent= stats.latestScore  ?? 0;
    document.getElementById('statKills').textContent      = stats.totalKills   ?? 0;
    document.getElementById('statWave').textContent       = stats.bestWave     ?? 1;
    document.getElementById('statGames').textContent      = stats.gamesPlayed  ?? 0;
    document.getElementById('statJoined').textContent     = fmtDate(profile.createdAt);

    // Session history table
    const sessions = stats.sessions || [];
    const container = document.getElementById('historyContainer');

    if (sessions.length === 0) {
      container.innerHTML = '<div class="empty-history">No missions on record yet. Deploy and fight!</div>';
      return;
    }

    const rows = sessions.slice(0, 10).map(s => `
      <tr>
        <td class="highlight">${s.score}</td>
        <td>${s.kills}</td>
        <td>${s.wave}</td>
        <td>${fmtDate(s.playedAt)}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <table class="history-table">
        <thead>
          <tr>
            <th>Score</th>
            <th>Kills</th>
            <th>Wave</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    console.error('Profile load failed:', err);
    document.getElementById('historyContainer').innerHTML =
      '<div class="empty-history">Could not load data. Is the server running?</div>';
  }
}

loadProfile();
