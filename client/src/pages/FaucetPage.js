import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { switchToSepolia, connectMetaMask } from '../utils/web3';
import { Card, Badge, Btn, SectionLabel } from '../components/UI';

const mono = { fontFamily: "'IBM Plex Mono',monospace" };

const FaucetPage = ({ onToast, token }) => {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [network, setNetwork] = useState(null);
  const [providers, setProviders] = useState([]);
  const [txHash, setTxHash] = useState('');
  const [txResult, setTxResult] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [loadingNetwork, setLoadingNetwork] = useState(true);

  // Load providers and network info on mount
  useEffect(() => {
    api.getFaucetProviders().then(data => setProviders(data.providers || [])).catch(() => {});
    api.getFaucetNetwork().then(data => { setNetwork(data); setLoadingNetwork(false); }).catch(() => setLoadingNetwork(false));
  }, []);

  // Auto-refresh balance
  useEffect(() => {
    if (!wallet) return;
    const fetchBal = () => {
      setLoadingBalance(true);
      api.getFaucetBalance(wallet)
        .then(data => { setBalance(data); setLoadingBalance(false); })
        .catch(() => setLoadingBalance(false));
    };
    fetchBal();
    const id = setInterval(fetchBal, 15000);
    return () => clearInterval(id);
  }, [wallet]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      if (!window.ethereum) {
        onToast('MetaMask not detected. Please install MetaMask extension.', 'error');
        return;
      }
      await switchToSepolia();
      const addr = await connectMetaMask();
      setWallet(addr);
      onToast('🦊 Connected to Sepolia via MetaMask!', 'success');
    } catch (err) {
      onToast('Connection failed: ' + err.message, 'error');
    } finally {
      setConnecting(false);
    }
  };

  const handleVerifyTx = async () => {
    if (!txHash.trim()) return onToast('Enter a transaction hash', 'error');
    setLoadingTx(true);
    setTxResult(null);
    try {
      const result = await api.verifyFaucetTx(txHash.trim());
      setTxResult(result);
      onToast('Transaction verified!', 'success');
    } catch (err) {
      onToast('Verification failed: ' + err.message, 'error');
    } finally {
      setLoadingTx(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    onToast('Copied to clipboard!', 'info');
  };

  const inp = {
    padding: '10px 12px', background: 'rgba(8,18,8,0.8)',
    border: '1px solid rgba(34,197,94,0.18)', borderRadius: 8,
    color: '#fff', ...mono, fontSize: 11, outline: 'none',
    width: '100%', boxSizing: 'border-box'
  };

  return (
    <div>
      {/* ── Network Status Banner ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(16,185,129,0.04))',
          border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14,
          padding: '14px 20px', marginBottom: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 12px #22c55e', animation: 'pulse 2s ease infinite' }} />
          <span style={{ color: '#86efac', ...mono, fontSize: 12, fontWeight: 700 }}>Sepolia Testnet</span>
          <Badge label="Chain ID: 11155111" color="#10b981" />
        </div>
        {!loadingNetwork && network && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ color: '#6b7280', ...mono, fontSize: 10 }}>Block: <span style={{ color: '#86efac' }}>{network.blockNumber?.toLocaleString()}</span></span>
            <span style={{ color: '#6b7280', ...mono, fontSize: 10 }}>Gas: <span style={{ color: '#eab308' }}>{network.gasPrice?.gwei} gwei</span></span>
          </div>
        )}
      </motion.div>

      {/* ── Wallet Connection ─────────────────────────────────────────── */}
      <Card glow style={{ marginBottom: 22 }}>
        <SectionLabel>WALLET CONNECTION</SectionLabel>
        {!wallet ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🦊</div>
            <div style={{ color: '#9ca3af', ...mono, fontSize: 12, marginBottom: 18 }}>
              Connect your MetaMask wallet to Sepolia Testnet
            </div>
            <Btn onClick={handleConnect} disabled={connecting} size="lg">
              {connecting ? '⏳ Connecting...' : '🦊 Connect MetaMask to Sepolia'}
            </Btn>
            <div style={{ color: '#4b5563', ...mono, fontSize: 9, marginTop: 12 }}>
              MetaMask will auto-switch to Sepolia network
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                <span style={{ color: '#86efac', ...mono, fontSize: 12 }}>Connected</span>
                <Badge label="SEPOLIA" color="#22c55e" />
              </div>
              <Btn onClick={() => { setWallet(null); setBalance(null); }} variant="danger" size="sm">Disconnect</Btn>
            </div>

            {/* Wallet Address */}
            <div style={{
              background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(34,197,94,0.12)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10
            }}>
              <div>
                <div style={{ color: '#6b7280', ...mono, fontSize: 9, marginBottom: 4 }}>WALLET ADDRESS</div>
                <div style={{ color: '#86efac', ...mono, fontSize: 11, wordBreak: 'break-all' }}>{wallet}</div>
              </div>
              <button onClick={() => copyToClipboard(wallet)} style={{
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 8, padding: '6px 12px', color: '#22c55e', cursor: 'pointer',
                ...mono, fontSize: 10, flexShrink: 0
              }}>📋 Copy</button>
            </div>

            {/* Balance */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.04))',
              border: '1px solid rgba(34,197,94,0.22)', borderRadius: 12, padding: '18px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ color: '#6b7280', ...mono, fontSize: 9, marginBottom: 6 }}>SEPOLIA ETH BALANCE</div>
                <div style={{ color: '#fff', fontSize: 28, fontWeight: 800 }}>
                  {loadingBalance ? '...' : balance ? `${balance.balanceEth}` : '0.000000'}
                  <span style={{ color: '#22c55e', fontSize: 14, marginLeft: 6 }}>ETH</span>
                </div>
              </div>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e22, #10b98111)',
                border: '2px solid #22c55e44', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 24
              }}>💎</div>
            </div>
          </div>
        )}
      </Card>

      {/* ── Faucet Providers ─────────────────────────────────────────── */}
      <SectionLabel>FREE SEPOLIA FAUCET PROVIDERS</SectionLabel>
      <div style={{ color: '#4b5563', ...mono, fontSize: 10, marginBottom: 14 }}>
        Get free Sepolia ETH from these trusted providers. Paste your wallet address on their site.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 28 }}>
        {providers.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card style={{ position: 'relative', height: '100%' }}>
              {p.recommended && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  background: '#eab30818', border: '1px solid #eab30844',
                  borderRadius: 6, padding: '2px 8px', ...mono,
                  fontSize: 8, color: '#eab308', fontWeight: 700
                }}>⭐ RECOMMENDED</div>
              )}
              <div style={{ fontSize: 32, marginBottom: 10 }}>{p.icon}</div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
              <div style={{ color: '#6b7280', ...mono, fontSize: 10, marginBottom: 12, lineHeight: 1.6 }}>{p.description}</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{
                  background: 'rgba(34,197,94,0.06)', borderRadius: 6, padding: '4px 10px',
                  ...mono, fontSize: 9, color: '#86efac'
                }}>💧 {p.drip}</div>
                <div style={{
                  background: 'rgba(234,179,8,0.06)', borderRadius: 6, padding: '4px 10px',
                  ...mono, fontSize: 9, color: '#eab308'
                }}>⏱ {p.cooldown}</div>
              </div>
              <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <Btn variant="primary" size="sm" style={{ width: '100%' }}>
                  🚰 Get Free ETH →
                </Btn>
              </a>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Transaction Verification ─────────────────────────────────── */}
      <Card style={{ marginBottom: 22 }}>
        <SectionLabel>VERIFY SEPOLIA TRANSACTION</SectionLabel>
        <div style={{ color: '#4b5563', ...mono, fontSize: 10, marginBottom: 14 }}>
          Paste a Sepolia transaction hash to verify its status on-chain.
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <input
            value={txHash}
            onChange={e => setTxHash(e.target.value)}
            style={{ ...inp, flex: 1 }}
            placeholder="0x... (Sepolia TX hash)"
          />
          <Btn onClick={handleVerifyTx} disabled={loadingTx} size="md">
            {loadingTx ? '⏳' : '🔍'} Verify
          </Btn>
        </div>

        <AnimatePresence>
          {txResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{
                background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(34,197,94,0.15)',
                borderRadius: 10, padding: '16px 18px', overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Badge label={txResult.status} color={txResult.status === 'Success' ? '#22c55e' : txResult.status === 'Pending' ? '#eab308' : '#ef4444'} />
                {txResult.blockNumber && <span style={{ color: '#6b7280', ...mono, fontSize: 10 }}>Block #{txResult.blockNumber.toLocaleString()}</span>}
              </div>
              {[
                { l: 'TX Hash', v: txResult.hash },
                { l: 'From', v: txResult.from },
                { l: 'To', v: txResult.to || '(Contract Creation)' },
                { l: 'Value', v: txResult.value },
                { l: 'Gas Used', v: txResult.gasUsed?.toLocaleString() || 'N/A' },
              ].map(row => (
                <div key={row.l} style={{ display: 'flex', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ color: '#6b7280', ...mono, fontSize: 10, minWidth: 70 }}>{row.l}:</span>
                  <span style={{ color: '#86efac', ...mono, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{row.v}</span>
                </div>
              ))}
              <a href={txResult.explorerUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <Btn variant="secondary" size="sm" style={{ marginTop: 10 }}>
                  🔗 View on Etherscan
                </Btn>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <Card>
        <SectionLabel>HOW FAUCET ETH WORKS</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { step: '1', icon: '🦊', title: 'Connect Wallet', desc: 'Connect MetaMask and switch to Sepolia testnet' },
            { step: '2', icon: '📋', title: 'Copy Address', desc: 'Copy your wallet address from above' },
            { step: '3', icon: '🚰', title: 'Visit Faucet', desc: 'Go to any faucet provider and paste your address' },
            { step: '4', icon: '💎', title: 'Receive ETH', desc: 'Free testnet ETH arrives in ~15 seconds' },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              style={{ textAlign: 'center', padding: 12 }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e44',
                color: '#22c55e', ...mono, fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 8px'
              }}>{s.step}</div>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
              <div style={{ color: '#6b7280', ...mono, fontSize: 9, lineHeight: 1.6 }}>{s.desc}</div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default FaucetPage;
