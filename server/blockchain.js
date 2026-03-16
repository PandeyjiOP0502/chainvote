const crypto  = require('crypto');
const { queries } = require('./db');

const sha256 = (data) =>
  crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

const mineBlock = (prevHash, transactions, difficulty = 2) => {
  const target     = '0'.repeat(difficulty);
  const merkleRoot = sha256(transactions);
  let nonce = 0, hash;
  do {
    nonce++;
    hash = sha256({ prevHash, merkleRoot, nonce, ts: Date.now() });
  } while (!hash.startsWith(target) && nonce < 100000);
  return { hash: '0x' + hash, merkleRoot: '0x' + merkleRoot, nonce };
};

const recordVoteOnChain = (voteData) => {
  const lastBlock = queries.getLastBlock.get();
  const prevHash  = lastBlock ? lastBlock.hash : '0x' + '0'.repeat(64);

  const tx = [{
    type:      'VOTE',
    voter:     sha256(voteData.voter_id),
    candidate: voteData.candidate_id,
    election:  voteData.election_id,
    ts:        Date.now(),
  }];

  const { hash, merkleRoot, nonce } = mineBlock(prevHash, tx);
  const result = queries.createBlock.run(hash, prevHash, merkleRoot, 1, nonce);

  // Fetch the row we just inserted
  const block = queries.getLastBlock.get();
  return block;
};

const verifyChain = () => {
  const blocks = queries.getAllBlocks.all().reverse();
  let valid = true;
  const issues = [];
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].prev_hash !== blocks[i - 1].hash) {
      valid = false;
      issues.push(`Block ${blocks[i].id}: invalid prev_hash`);
    }
  }
  return { valid, issues, blockCount: blocks.length };
};

module.exports = { recordVoteOnChain, verifyChain, sha256 };
