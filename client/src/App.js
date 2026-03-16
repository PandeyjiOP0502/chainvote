import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { api, createWS } from './utils/api';
import { Toast, BlockMineOverlay } from './components/UI';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import VotePage from './pages/VotePage';
import ResultsPage from './pages/ResultsPage';
import MyVotesPage from './pages/MyVotesPage';
import SecurityPage from './pages/SecurityPage';
import AdminPage from './pages/AdminPage';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'vote', label: 'Vote', icon: '🗳' },
  { id: 'results', label: 'Results', icon: '📊' },
  { id: 'myvotes', label: 'My Votes', icon: '✓' },
  { id: 'security', label: 'Security', icon: '🧬' },
  { id: 'admin', label: 'Admin', icon: '⚙', adminOnly: true },
];

function AppInner() {
  const { user, token, loading, faceToken, logout } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [elections, setElections] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [mineBlock, setMineBlock] = useState(null);
  const [liveUpdate, setLiveUpdate] = useState(null);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  // Load initial data
  useEffect(() => {
    if (!user) return;
    api.getElections().then(setElections).catch(() => {});
    api.getBlocks().then(setBlocks).catch(() => {});
  }, [user]);

  // WebSocket live updates
  useEffect(() => {
    if (!user) return;
    const ws = createWS((msg) => {
      if (msg.event === 'vote_cast') {
        setElections(prev => prev.map(e => e.id === msg.data.electionId ? { ...e, candidates: msg.data.candidates, totalVotes: msg.data.totalVotes } : e));
        api.getBlocks().then(setBlocks).catch(() => {});
        setLiveUpdate(msg.data);
        setTimeout(() => setLiveUpdate(null), 3000);
      }
      if (msg.event === 'election_created' || msg.event === 'election_status') {
        api.getElections().then(setElections).catch(() => {});
      }
    });
    return () => ws.close();
  }, [user]);
  // ========== DEBUG ==========
  console.log('=== DEBUG IMPORTS ===');
  console.log('Dashboard:', Dashboard);
  console.log('VotePage:', VotePage);
  console.log('ResultsPage:', ResultsPage);
  console.log('MyVotesPage:', MyVotesPage);
  console.log('SecurityPage:', SecurityPage);
  console.log('AdminPage:', AdminPage);
  console.log('LoginPage:', LoginPage);
  // ===========================
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#040a04', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1.5s ease infinite' }}>⛓️</div>
          <div style={{ color: '#22c55e', fontFamily: "'IBM Plex Mono',monospace", fontSize: 14 }}>Loading ChainVote...</div>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage onToast={addToast} />;

  const availableTabs = TABS.filter(t => !t.adminOnly || user.role === 'admin');

  const pageProps = { elections, setElections, blocks, setBlocks, onToast: addToast, onMineBlock: setMineBlock, token };

  return (
    <>
      {/* Global CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #040a04; font-family: 'Syne', sans-serif; overflow-x: hidden; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 20px #22c55e44; } 50% { box-shadow: 0 0 40px #22c55e88; } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #040a04; }
        ::-webkit-scrollbar-thumb { background: #22c55e44; border-radius: 2px; }
        input::placeholder { color: #374151; }
        input, textarea, select { background: transparent; }
      `}</style>

      {/* BG */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -20%,rgba(5,46,22,0.5),transparent),#040a04' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(34,197,94,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.022) 1px,transparent 1px)', backgroundSize: '36px 36px' }} />
      </div>

      <Toast toasts={toasts} remove={removeToast} />

      <AnimatePresence>
        {mineBlock && <BlockMineOverlay block={mineBlock} onDone={() => setMineBlock(null)} />}
      </AnimatePresence>

      {/* Live vote indicator */}
      <AnimatePresence>
        {liveUpdate && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: 'linear-gradient(135deg,#166534,#14532d)', border: '1px solid #22c55e55', borderRadius: 10, padding: '8px 18px', color: '#22c55e', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1s ease infinite' }} />
            ⛓ Live vote recorded on blockchain
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        {/* Navbar */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(2,8,2,0.96)', borderBottom: '1px solid rgba(34,197,94,0.12)', backdropFilter: 'blur(20px)', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 62 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div
              animate={{ boxShadow: ['0 0 15px #22c55e44', '0 0 30px #22c55e77', '0 0 15px #22c55e44'] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}
            >⛓</motion.div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>Chain<span style={{ color: '#22c55e' }}>Vote</span></span>
            {user.faceRegistered && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} title="Face ID Active" />}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '5px 12px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#22c55e33,#22c55e11)', border: '1px solid #22c55e55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#22c55e', fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace" }}>
                {user.name[0].toUpperCase()}
              </div>
              <span style={{ color: '#86efac', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }}>{user.name}</span>
              {user.role === 'admin' && <span style={{ background: '#eab30822', border: '1px solid #eab30844', borderRadius: 5, padding: '1px 6px', color: '#eab308', fontSize: 9, fontFamily: "'IBM Plex Mono',monospace" }}>ADMIN</span>}
            </div>
            <button onClick={logout} style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </nav>

        {/* Tabs */}
        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid rgba(34,197,94,0.08)', background: 'rgba(2,8,2,0.85)', position: 'sticky', top: 62, zIndex: 99, scrollbarWidth: 'none' }}>
          {availableTabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ flex: '1 0 auto', padding: '11px 16px', fontSize: 11, cursor: 'pointer', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600, background: 'transparent', border: 'none', borderBottom: tab === t.id ? '2px solid #22c55e' : '2px solid transparent', color: tab === t.id ? '#22c55e' : '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, whiteSpace: 'nowrap', transition: 'all 0.18s' }}
            >
              {t.icon} {t.label}
              {t.id === 'security' && !user.faceRegistered && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 4px #ef4444' }} />}
            </button>
          ))}
        </div>

        {/* Page */}
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px 80px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                  {availableTabs.find(t => t.id === tab)?.icon} {availableTabs.find(t => t.id === tab)?.label}
                </h1>
                <div style={{ color: '#374151', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>
                  {tab === 'dashboard' && 'Real-time blockchain voting system overview'}
                  {tab === 'vote' && 'Cast your biometrically-secured vote on the blockchain'}
                  {tab === 'results' && 'Live election results with real-time updates'}
                  {tab === 'myvotes' && 'Your immutable on-chain voting history'}
                  {tab === 'security' && 'Biometric face ID & security management'}
                  {tab === 'admin' && 'Election administration & system management'}
                </div>
              </div>

              {tab === 'dashboard' && <Dashboard {...pageProps} />}
              {tab === 'vote' && <VotePage {...pageProps} />}
              {tab === 'results' && <ResultsPage {...pageProps} />}
              {tab === 'myvotes' && <MyVotesPage {...pageProps} />}
              {tab === 'security' && <SecurityPage {...pageProps} />}
              {tab === 'admin' && user.role === 'admin' && <AdminPage {...pageProps} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
