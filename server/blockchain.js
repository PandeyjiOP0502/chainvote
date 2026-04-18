const crypto  = require('crypto');
const { queries } = require('./db');

const USE_REMIX_VM = process.env.USE_REMIX_VM === 'true';
const REMIX_VM_URL = process.env.REMIX_VM_URL || 'http://localhost:8545';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || null;

let web3 = null;
let contract = null;

const CHAINVOTE_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "voter", "type": "address" },
      { "indexed": true, "name": "candidateId", "type": "uint256" },
      { "indexed": true, "name": "electionId", "type": "uint256" },
      { "name": "timestamp", "type": "uint256" }
    ],
    "name": "VoteCast",
    "type": "event"
  },
  {
    "inputs": [
      { "name": "_candidateId", "type": "uint256" },
      { "name": "_electionId", "type": "uint256" }
    ],
    "name": "castVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalVotes",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_voter", "type": "address" }],
    "name": "hasVoted",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getResults",
    "outputs": [
      {
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "name", "type": "string" },
          { "name": "party", "type": "string" },
          { "name": "bio", "type": "string" },
          { "name": "voteCount", "type": "uint256" }
        ],
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const initWeb3 = async () => {
  if (web3) return web3;
  
  try {
    const Web3 = require('web3');
    web3 = new Web3(new Web3.providers.HttpProvider(REMIX_VM_URL));
    return web3;
  } catch (err) {
    console.error('Failed to initialize Web3:', err.message);
    return null;
  }
};

const initContract = async () => {
  if (contract || !CONTRACT_ADDRESS) return contract;
  
  const w3 = await initWeb3();
  if (!w3) return null;
  
  contract = new w3.eth.Contract(CHAINVOTE_ABI, CONTRACT_ADDRESS);
  return contract;
};

const castVoteOnContract = async (voterAddress, candidateId, electionId) => {
  const c = await initContract();
  if (!c) throw new Error('Contract not available');
  
  const w3 = await initWeb3();
  const accounts = await w3.eth.getAccounts();
  const from = accounts[0] || voterAddress;
  
  const gas = await c.methods.castVote(candidateId, electionId).estimateGas({ from });
  const receipt = await c.methods.castVote(candidateId, electionId).send({ from, gas });
  
  return receipt;
};

const getContractVoteCount = async () => {
  const c = await initContract();
  if (!c) return null;
  
  try {
    const count = await c.methods.totalVotes().call();
    return parseInt(count);
  } catch {
    return null;
  }
};

const hasVotedOnContract = async (voterAddress) => {
  const c = await initContract();
  if (!c) return false;
  
  try {
    return await c.methods.hasVoted(voterAddress).call();
  } catch {
    return false;
  }
};

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

const recordVoteOnChain = async (voteData) => {
  if (USE_REMIX_VM && CONTRACT_ADDRESS) {
    try {
      const receipt = await castVoteOnContract(voteData.voter_address, voteData.candidate_id, voteData.election_id);
      
      const block = {
        id: receipt.blockNumber,
        hash: receipt.transactionHash,
        prev_hash: '0x' + '0'.repeat(64),
        merkle_root: '0x' + sha256([receipt.transactionHash]),
        vote_count: 1,
        nonce: 0,
        mined_at: new Date().toISOString(),
      };
      
      queries.createBlock.run(
        block.hash,
        block.prev_hash,
        block.merkle_root,
        block.vote_count,
        block.nonce
      );
      
      return queries.getLastBlock.get();
    } catch (err) {
      console.error('Contract interaction failed, falling back to simulated:', err.message);
    }
  }
  
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

const getBlockchainMode = () => USE_REMIX_VM ? 'remix-vm' : 'simulated';

module.exports = { 
  recordVoteOnChain, 
  verifyChain, 
  sha256,
  initWeb3,
  initContract,
  castVoteOnContract,
  getContractVoteCount,
  hasVotedOnContract,
  getBlockchainMode,
  USE_REMIX_VM,
  CONTRACT_ADDRESS
};
