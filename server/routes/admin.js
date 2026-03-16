const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queries, all, get } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

const COLORS = ['#22c55e','#eab308','#10b981','#f59e0b','#84cc16','#fbbf24'];

// POST /api/admin/elections
router.post('/elections', (req, res) => {
  try {
    const { title, description, startDate, endDate, candidates } = req.body;
    if (!title || !startDate || !endDate || !candidates?.length)
      return res.status(400).json({ error: 'Missing required fields' });
    if (candidates.length < 2)
      return res.status(400).json({ error: 'At least 2 candidates required' });

    const electionId = uuidv4();
    queries.createElection.run(electionId, title, description || '', 'active', startDate, endDate, req.user.id);

    const created = candidates.map((c, i) => {
      const cId      = uuidv4();
      const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      queries.createCandidate.run(cId, electionId, c.name, c.party || '', c.bio || '', c.manifesto || '', COLORS[i % COLORS.length], initials);
      return queries.getCandidatesByElection.all(electionId).find(x => x.id === cId);
    });

    queries.addAudit.run(req.user.id, 'ELECTION_CREATE', `Created: ${title}`, req.ip);
    req.app.get('broadcast')('election_created', { electionId, title });

    res.status(201).json({ election: queries.getElectionById.get(electionId), candidates: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create election' });
  }
});

// PATCH /api/admin/elections/:id/status
router.patch('/elections/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['active','closed','pending'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });
    queries.updateElectionStatus.run(status, req.params.id);
    queries.addAudit.run(req.user.id, 'ELECTION_STATUS', `${req.params.id} → ${status}`, req.ip);
    req.app.get('broadcast')('election_status', { electionId: req.params.id, status });
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// GET /api/admin/voters
router.get('/voters', (_req, res) => {
  try { res.json(queries.getAllVoters.all()); }
  catch (err) { res.status(500).json({ error: 'Failed to fetch voters' }); }
});

// DELETE /api/admin/elections/:id
router.delete('/elections/:id', (req, res) => {
  try {
    const election = queries.getElectionById.get(req.params.id);
    if (!election) return res.status(404).json({ error: 'Election not found' });
    if (election.status === 'active') return res.status(400).json({ error: 'Cannot delete active election' });
    
    // Delete related candidates and votes first
    queries.deleteCandidatesByElection.run(req.params.id);
    queries.deleteVotesByElection.run(req.params.id);
    
    // Delete the election
    queries.deleteElection.run(req.params.id);
    
    queries.addAudit.run(req.user.id, 'ELECTION_DELETE', `Deleted: ${election.title}`, req.ip);
    req.app.get('broadcast')('election_deleted', { electionId: req.params.id, title: election.title });
    
    res.json({ success: true, message: 'Election deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete election' });
  }
});

// GET /api/admin/stats
router.get('/stats', (_req, res) => {
  try {
    res.json({
      totalVoters:     get(`SELECT COUNT(*) as n FROM users WHERE role='voter'`).n,
      faceEnrolled:    get(`SELECT COUNT(*) as n FROM users WHERE face_descriptor IS NOT NULL`).n,
      totalElections:  get(`SELECT COUNT(*) as n FROM elections`).n,
      activeElections: get(`SELECT COUNT(*) as n FROM elections WHERE status='active'`).n,
      totalVotes:      get(`SELECT COUNT(*) as n FROM votes`).n,
      totalBlocks:     get(`SELECT COUNT(*) as n FROM blockchain`).n,
      recentAudit:     all(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10`),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
