const crypto = require('crypto');
const db = require('../db');

// ── Utilities ────────────────────────────────────────────────────────────────
const sha256 = (data) => crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

const randomHex = (len = 64) =>
  crypto.randomBytes(len / 2).toString('hex');

// ── Mining simulation ─────────────────────────────────────────────────────
const mineBlock = (prevHash, merkleRoot, voteCount, difficulty = 2) => {
  let nonce = 0;
  let hash = '';
  const prefix = '0'.repeat(difficulty);

  while (!hash.startsWith(prefix)) {
    hash = sha256({ prevHash, merkleRoot, nonce, voteCount, timestamp: Date.now() });
    nonce++;
  }

  return { hash, nonce };
};

// ── Merkle tree ──────────────────────────────────────────────────────────────
const buildMerkleRoot = (txHashes) => {
  if (!txHashes.length) return sha256('genesis');
  if (txHashes.length === 1) return txHashes[0];

  const pairs = [];
  for (let i = 0; i < txHashes.length; i += 2) {
    const left = txHashes[i];
    const right = txHashes[i + 1] || txHashes[i];
    pairs.push(sha256(left + right));
  }
  return buildMerkleRoot(pairs);
};

// ── Create vote transaction ──────────────────────────────────────────────────
const createVoteTransaction = (voterId, electionId, candidateId) => {
  const txHash = '0x' + randomHex(32);
  return txHash;
};

// ── Add vote to blockchain ───────────────────────────────────────────────────
const addVoteToBlockchain = (txHash) => {
  // Get last block
  const lastBlock = db.prepare('SELECT * FROM blocks ORDER BY id DESC LIMIT 1').get();
  const prevHash = lastBlock ? lastBlock.hash : '0'.repeat(64);

  // Get recent unconfirmed votes to batch
  const merkleRoot = buildMerkleRoot([txHash]);

  // Mine block (fast - difficulty 2)
  const { hash, nonce } = mineBlock(prevHash, merkleRoot, 1, 2);

  // Insert block
  const insertBlock = db.prepare(`
    INSERT INTO blocks (hash, prev_hash, merkle_root, vote_count, nonce, difficulty)
    VALUES (?, ?, ?, 1, ?, 2)
  `);

  const result = insertBlock.run(hash, prevHash, merkleRoot, nonce);
  return {
    blockId: result.lastInsertRowid,
    blockHash: hash,
    prevHash,
    merkleRoot,
    nonce
  };
};

// ── Verify blockchain integrity ──────────────────────────────────────────────
const verifyChain = () => {
  const blocks = db.prepare('SELECT * FROM blocks ORDER BY id ASC').all();
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].prev_hash !== blocks[i - 1].hash) {
      return { valid: false, failedAt: blocks[i].id };
    }
  }
  return { valid: true, blockCount: blocks.length };
};

// ── Genesis block ────────────────────────────────────────────────────────────
const ensureGenesisBlock = () => {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM blocks').get();
  if (count.cnt === 0) {
    const genesisHash = sha256({ genesis: true, timestamp: '2024-01-01T00:00:00Z' });
    db.prepare(`
      INSERT INTO blocks (hash, prev_hash, merkle_root, vote_count, nonce, difficulty)
      VALUES (?, ?, ?, 0, 0, 0)
    `).run(genesisHash, '0'.repeat(64), sha256('genesis'), 0, 0, 0);
    console.log('✅ Genesis block created:', genesisHash);
  }
};

module.exports = {
  createVoteTransaction,
  addVoteToBlockchain,
  verifyChain,
  ensureGenesisBlock,
  sha256,
  randomHex
};
