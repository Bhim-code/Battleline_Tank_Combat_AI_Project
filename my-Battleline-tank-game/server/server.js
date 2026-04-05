require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const clientDir = path.join(__dirname, '..', 'client');

app.use(express.json());
app.use(express.static(clientDir));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'tank-frontline', stage: 'bootstrap' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Server] Listening on http://localhost:${PORT}`);
});
