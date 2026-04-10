require('dotenv').config();

const express = require('express');
const path = require('path');
const connectDB = require('./db');
const authRoutes = require('./api/auth');


const userRoutes  = require('./api/users');
const gameRoutes  = require('./api/game');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/game',  gameRoutes);

// ── Serve frontend ────────────────────────────────────────────
// Express serves everything in client/ as static files.
// This means game.html, css/, js/ etc. are all directly accessible.
const clientDir = path.join(__dirname, '..', 'client');
app.use(express.static(clientDir));

// Any unmatched route → serve index.html (which redirects based on auth)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

async function start() {
  await connectDB();
 app.listen(PORT, () => {
    console.log(`[Server] Tank Frontline running on http://localhost:${PORT}`);
    console.log(`[Server] Open your browser at http://localhost:${PORT}`);
  });
}
start();

// app.listen(PORT, () => {
//   console.log(`[Server] Listening on http://localhost:${PORT}`);
// });
