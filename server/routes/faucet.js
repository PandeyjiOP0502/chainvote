const express = require('express');
const router = express.Router();

const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
const SEPOLIA_CHAIN_ID = 11155111;

// ── Faucet Providers ─────────────────────────────────────────────────────────
const FAUCET_PROVIDERS = [
  {
    id: 'google-cloud',
    name: 'Google Cloud Faucet',
    url: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia',
    description: 'Google Cloud Web3 faucet — reliable & fast',
    drip: '0.05 ETH per request',
    cooldown: '24 hours',
    icon: '🌐',
    recommended: true,
  },
  {
    id: 'alchemy',
    name: 'Alchemy Sepolia Faucet',
    url: 'https://www.alchemy.com/faucets/ethereum-sepolia',
    description: 'Alchemy faucet — requires free Alchemy account',
    drip: '0.5 ETH per day',
    cooldown: '24 hours',
    icon: '⚗️',
    recommended: true,
  },
  {
    id: 'infura',
    name: 'Infura Sepolia Faucet',
    url: 'https://www.infura.io/faucet/sepolia',
    description: 'Infura faucet — requires free Infura account',
    drip: '0.5 ETH per day',
    cooldown: '24 hours',
    icon: '🔷',
    recommended: false,
  },
  {
    id: 'sepolia-faucet',
    name: 'sepoliafaucet.com',
    url: 'https://sepoliafaucet.com',
    description: 'Community Sepolia faucet — no account needed',
    drip: '0.5 ETH per day',
    cooldown: '24 hours',
    icon: '🚰',
    recommended: false,
  },
  {
    id: 'pow-faucet',
    name: 'Sepolia PoW Faucet',
    url: 'https://sepolia-faucet.pk910.de/',
    description: 'Mine Sepolia ETH in your browser — no limits',
    drip: 'Variable (mining)',
    cooldown: 'None',
    icon: '⛏️',
    recommended: false,
  },
];

// ── Helper: Make JSON-RPC call to Sepolia ─────────────────────────────────────
async function rpcCall(method, params = []) {
  const res = await fetch(SEPOLIA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() }),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RPC HTTP Error ${res.status}: ${text.slice(0, 100)}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`RPC returned non-JSON: ${contentType}`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'RPC error');
  return data.result;
}

// GET /api/faucet/providers — List free faucet providers
router.get('/providers', (_req, res) => {
  res.json({ providers: FAUCET_PROVIDERS, network: 'Sepolia', chainId: SEPOLIA_CHAIN_ID });
});

// GET /api/faucet/balance/:address — Get Sepolia ETH balance
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    const balanceHex = await rpcCall('eth_getBalance', [address, 'latest']);
    const balanceWei = BigInt(balanceHex);
    const balanceEth = Number(balanceWei) / 1e18;
    res.json({
      address,
      balanceWei: balanceWei.toString(),
      balanceEth: balanceEth.toFixed(6),
      network: 'Sepolia',
      chainId: SEPOLIA_CHAIN_ID,
    });
  } catch (err) {
    console.error('Balance fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch balance: ' + err.message });
  }
});

// GET /api/faucet/network — Get Sepolia network info
router.get('/network', async (_req, res) => {
  try {
    const [blockHex, gasPriceHex, chainIdHex] = await Promise.all([
      rpcCall('eth_blockNumber'),
      rpcCall('eth_gasPrice'),
      rpcCall('eth_chainId'),
    ]);
    res.json({
      network: 'Sepolia',
      chainId: parseInt(chainIdHex, 16),
      blockNumber: parseInt(blockHex, 16),
      gasPrice: {
        wei: parseInt(gasPriceHex, 16),
        gwei: (parseInt(gasPriceHex, 16) / 1e9).toFixed(6),
      },
      rpcUrl: SEPOLIA_RPC,
      explorerUrl: 'https://sepolia.etherscan.io',
    });
  } catch (err) {
    console.error('Network info error:', err.message);
    res.status(500).json({ error: 'Failed to fetch network info: ' + err.message });
  }
});

// POST /api/faucet/verify-tx/:txHash — Verify a transaction on Sepolia
router.get('/verify-tx/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return res.status(400).json({ error: 'Invalid transaction hash' });
    }

    const [tx, receipt] = await Promise.all([
      rpcCall('eth_getTransactionByHash', [txHash]),
      rpcCall('eth_getTransactionReceipt', [txHash]),
    ]);

    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      hash: txHash,
      from: tx.from,
      to: tx.to,
      value: (Number(BigInt(tx.value || '0x0')) / 1e18).toFixed(6) + ' ETH',
      gasUsed: receipt ? parseInt(receipt.gasUsed, 16) : null,
      blockNumber: receipt ? parseInt(receipt.blockNumber, 16) : null,
      status: receipt ? (receipt.status === '0x1' ? 'Success' : 'Failed') : 'Pending',
      confirmations: receipt ? 'Confirmed' : 'Pending',
      explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
    });
  } catch (err) {
    console.error('TX verify error:', err.message);
    res.status(500).json({ error: 'Failed to verify transaction: ' + err.message });
  }
});

module.exports = router;
