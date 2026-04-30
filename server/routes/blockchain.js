const express = require('express');
const { queries } = require('../db');
const { verifyChain, getBlockchainMode, getContractVoteCount, hasVotedOnContract } = require('../blockchain');
const solc = require('solc');
const router = express.Router();

router.post('/compile', (req, res) => {
  try {
    const { source } = req.body;
    if (!source) return res.status(400).json({ error: 'No source code provided' });

    const input = {
      language: 'Solidity',
      sources: { 'contract.sol': { content: source } },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode.object', 'evm.gasEstimates'],
            '': ['ast']
          }
        }
      }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const errors = [];
    const warnings = [];
    const contracts = {};

    if (output.errors) {
      output.errors.forEach(err => {
        if (err.severity === 'error') errors.push(err);
        else warnings.push(err);
      });
    }

    if (output.contracts) {
      Object.keys(output.contracts).forEach(file => {
        Object.keys(output.contracts[file]).forEach(contractName => {
          const c = output.contracts[file][contractName];
          console.log('Compiling:', contractName, 'ABI:', c.abi?.length);
          contracts[contractName] = {
            abi: c.abi || [],
            bytecode: c.evm?.bytecode?.object || '',
            gasEstimates: c.evm?.gasEstimates || {},
          };
        });
      });
    }

    res.json({
      success: errors.length === 0,
      errors,
      warnings,
      contracts,
      ast: output.sources?.['contract.sol']?.ast || null
    });
    console.log('Compile response:', { success: errors.length === 0, contractCount: Object.keys(contracts).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
