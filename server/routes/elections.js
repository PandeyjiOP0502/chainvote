const express = require('express');
const { queries } = require('../db');
const router = express.Router();

router.get('/', (_req, res) => {
  try {
    const elections = queries.getAllElections.all();
    res.json(elections.map(e => {
      const candidates  = queries.getCandidatesByElection.all(e.id);
      const totalVotes  = candidates.reduce((a, c) => a + c.vote_count, 0);
      return { ...e, candidates, totalVotes };
    }));
  } catch (err) { res.status(500).json({ error: 'Failed to fetch elections' }); }
});

router.get('/:id', (req, res) => {
  try {
    const e = queries.getElectionById.get(req.params.id);
    if (!e) return res.status(404).json({ error: 'Not found' });
    const candidates = queries.getCandidatesByElection.all(e.id);
    res.json({ ...e, candidates, totalVotes: candidates.reduce((a,c)=>a+c.vote_count,0) });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch election' }); }
});

router.get('/:id/results', (req, res) => {
  try {
    const e = queries.getElectionById.get(req.params.id);
    if (!e) return res.status(404).json({ error: 'Not found' });
    const candidates  = queries.getCandidatesByElection.all(e.id);
    const totalVotes  = candidates.reduce((a,c) => a+c.vote_count, 0);
    const winner      = totalVotes > 0 ? candidates[0] : null;
    const results     = candidates.map(c => ({
      ...c,
      percentage: totalVotes > 0 ? ((c.vote_count/totalVotes)*100).toFixed(1) : '0.0',
      leading:    winner && c.id === winner.id,
    }));
    res.json({ election: e, results, totalVotes, winner, lastUpdated: new Date().toISOString() });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch results' }); }
});

module.exports = router;
