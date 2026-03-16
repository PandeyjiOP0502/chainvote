const express = require('express');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { queries } = require('../db');
const { authenticate } = require('../middleware/auth');
const { recordVoteOnChain } = require('../blockchain');

const router = express.Router();

router.post('/cast', authenticate, (req, res) => {
  try {
    const { electionId, candidateId, faceToken } = req.body;
    if (!electionId || !candidateId || !faceToken)
      return res.status(400).json({ error: 'electionId, candidateId, and faceToken required' });

    // Verify face token
    let fp;
    try { fp = jwt.verify(faceToken, process.env.JWT_SECRET || 'chainvote_secret'); }
    catch { return res.status(401).json({ error: 'Face token expired or invalid. Please re-verify your face.' }); }

    if (!fp.faceVerified || fp.id !== req.user.id)
      return res.status(401).json({ error: 'Face token mismatch' });

    const election = queries.getElectionById.get(electionId);
    if (!election)       return res.status(404).json({ error: 'Election not found' });
    if (election.status !== 'active') return res.status(400).json({ error: 'Election is not active' });

    const now = new Date();
    if (now < new Date(election.start_date)) return res.status(400).json({ error: 'Election not started yet' });
    if (now > new Date(election.end_date))   return res.status(400).json({ error: 'Election has ended' });

    const candidates = queries.getCandidatesByElection.all(electionId);
    if (!candidates.find(c => c.id === candidateId))
      return res.status(404).json({ error: 'Candidate not in this election' });

    if (queries.hasVoted.get(electionId, req.user.id))
      return res.status(409).json({ error: 'Already voted in this election' });

    // Mine block
    const block  = recordVoteOnChain({ voter_id: req.user.id, candidate_id: candidateId, election_id: electionId });
    const voteId = uuidv4();
    const txHash = block.hash + '-' + voteId.slice(0, 8);

    queries.castVote.run(voteId, electionId, candidateId, req.user.id,
      txHash, block.id, block.hash, 1, 95 + Math.random() * 5, req.ip);
    queries.incrementVote.run(candidateId);
    queries.addAudit.run(req.user.id, 'VOTE_CAST', `E:${electionId} C:${candidateId}`, req.ip);

    const updatedCandidates = queries.getCandidatesByElection.all(electionId);
    const totalVotes = updatedCandidates.reduce((a, c) => a + c.vote_count, 0);
    req.app.get('broadcast')('vote_cast', { electionId, candidateId, candidates: updatedCandidates, totalVotes, blockId: block.id, blockHash: block.hash });

    res.json({ success: true, voteId, txHash, blockId: block.id, blockHash: block.hash, minedAt: block.mined_at });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Already voted' });
    console.error(err);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

router.get('/my', authenticate, (req, res) => {
  try { res.json(queries.getVotesByVoter.all(req.user.id)); }
  catch (err) { res.status(500).json({ error: 'Failed to fetch votes' }); }
});

router.get('/check/:electionId', authenticate, (req, res) => {
  try { res.json({ hasVoted: !!queries.hasVoted.get(req.params.electionId, req.user.id) }); }
  catch (err) { res.status(500).json({ error: 'Check failed' }); }
});

module.exports = router;
