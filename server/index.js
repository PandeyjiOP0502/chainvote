require('dotenv').config();
const express   = require('express');
const http      = require('http');
const WebSocket = require('ws');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const { initDb } = require('./db');

const app    = express();
const server = http.createServer(app);

// ── WebSocket ─────────────────────────────────────────────────────────────────
const wss     = new WebSocket.Server({ server });
const clients = new Set();
wss.on('connection', ws => {
  clients.add(ws);
  ws.send(JSON.stringify({ event: 'connected', data: { message: 'ChainVote live feed active' } }));
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
});
const broadcast = (event, data) => {
  const msg = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
};
app.set('broadcast', broadcast);

// ── Middleware ────────────────────────────────────────────────────────────────
app.set('trust proxy', 1); // Enable trust proxy for rate limiting
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }));

// ── Routes (loaded after DB is ready) ────────────────────────────────────────
function mountRoutes() {
  app.use('/api/auth',       require('./routes/auth'));
  app.use('/api/elections',  require('./routes/elections'));
  app.use('/api/votes',      require('./routes/votes'));
  app.use('/api/admin',      require('./routes/admin'));
  app.use('/api/blockchain', require('./routes/blockchain'));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    app.get('*', (_req, res) =>
      res.sendFile(path.join(__dirname, '../client/build/index.html')));
  }

  app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await initDb();   // ← wait for sql.js to load + schema to run
    mountRoutes();

    const PORT = process.env.PORT || 5000;
    
    function startServer(port) {
      server.listen(port, () => {
        console.log(`\n🗳️  ChainVote  →  http://localhost:${port}`);
        console.log(`⛓️  WebSocket live updates active`);
        console.log(`🧬  Face verification API ready\n`);
      }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} busy, trying ${port + 1}`);
          startServer(port + 1);
        } else {
          console.error('❌ Failed to start server:', err);
          process.exit(1);
        }
      });
    }
    
    startServer(PORT);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();
