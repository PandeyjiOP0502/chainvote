const express = require('express');
const { queries } = require('../db');
const { verifyChain, getBlockchainMode, getContractVoteCount, hasVotedOnContract } = require('../blockchain');
const router = express.Router();

router.get('/blocks',  (_req, res) => {
  try { res.json(queries.getAllBlocks.all()); }
  catch { res.status(500).json({ error: 'Failed to fetch blocks' }); }
});

router.get('/verify', (_req, res) => {
  try { res.json(verifyChain()); }
  catch { res.status(500).json({ error: 'Verification failed' }); }
});

router.get('/status', (_req, res) => {
  try { 
    const mode = getBlockchainMode();
    const blocks = queries.getAllBlocks.all();
    const totalVotes = blocks.reduce((a, b) => a + (b.vote_count || 0), 0);
    res.json({ mode, blockCount: blocks.length, totalVotes });
  }
  catch { res.status(500).json({ error: 'Failed to fetch status' }); }
});

router.get('/contract/vote-count', async (_req, res) => {
  try {
    const count = await getContractVoteCount();
    res.json({ voteCount: count });
  } catch { res.status(500).json({ error: 'Failed to fetch vote count' }); }
});

router.get('/contract/has-voted/:address', async (req, res) => {
  try {
    const voted = await hasVotedOnContract(req.params.address);
    res.json({ hasVoted: voted });
  } catch { res.status(500).json({ error: 'Failed to check voter' }); }
});

module.exports = router;
