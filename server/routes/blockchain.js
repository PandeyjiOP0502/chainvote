const express = require('express');
const { queries } = require('../db');
const { verifyChain } = require('../blockchain');
const router = express.Router();

router.get('/blocks',  (_req, res) => {
  try { res.json(queries.getAllBlocks.all()); }
  catch { res.status(500).json({ error: 'Failed to fetch blocks' }); }
});

router.get('/verify', (_req, res) => {
  try { res.json(verifyChain()); }
  catch { res.status(500).json({ error: 'Verification failed' }); }
});

module.exports = router;
