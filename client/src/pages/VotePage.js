import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import FaceCamera from '../components/FaceCamera';
import { Card, Avatar, Badge, Btn, ProgressBar, SectionLabel } from '../components/UI';

const Countdown = ({ endDate }) => {
  const [t, setT] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate) - Date.now();
      if (diff <= 0) return setT('Ended');
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
      setT(`${h}h ${m}m ${s}s`);
    };
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id);
  }, [endDate]);
  return <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: '#22c55e', fontSize: 13 }}>{t}</span>;
};

export default function VotePage({ elections, token, onToast, onMineBlock }) {
  const { user, faceToken, setFaceToken } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  const [showFaceCamera, setShowFaceCamera] = useState(false);
  const [pendingVote, setPendingVote] = useState(null);
  const [votedElections, setVotedElections] = useState({});
  const [casting, setCasting] = useState(false);

  // Check which elections user has voted in
  useEffect(() => {
    if (!user || !token) return;
    const active = elections.filter(e => e.status === 'active');
    active.forEach(e => {
      api.checkVoted(e.id, token).then(r => {
        if (r.hasVoted) setVotedElections(v => ({ ...v, [e.id]: true }));
      }).catch(() => {});
    });
  }, [elections, user, token]);

  const handleCastClick = (election, candidate) => {
    if (votedElections[election.id]) return;
    if (!faceToken) {
      // Need face verification first
      setPendingVote({ election, candidate });
      setShowFaceCamera(true);
    } else {
      setConfirmData({ election, candidate });
    }
  };

  const handleFaceVerifySuccess = async (descriptor) => {
    try {
      const result = await api.verifyFace(descriptor, token);
      setFaceToken(result.faceToken);
      setShowFaceCamera(false);
      if (pendingVote) {
        setConfirmData(pendingVote);
        setPendingVote(null);
      }
      onToast(`✓ Face verified! ${result.confidence}% match`, 'success');
    } catch (err) {
      setShowFaceCamera(false);
      setPendingVote(null);
      onToast(err.message || 'Face verification failed', 'error');
    }
  };

  const castVote = async () => {
    if (!confirmData || !faceToken) return;
    setCasting(true);
    try {
      const result = await api.castVote({
        electionId: confirmData.election.id,
        candidateId: confirmData.candidate.id,
        faceToken,
      }, token);

      setVotedElections(v => ({ ...v, [confirmData.election.id]: true }));
      setConfirmData(null);
      onMineBlock({ id: result.blockId, hash: result.blockHash });
      onToast(`⛓ Vote cast for ${confirmData.candidate.name}!`, 'success');
    } catch (err) {
      onToast(err.message, 'error');
      if (err.message?.includes('Face verification expired')) {
        setFaceToken(null);
      }
    } finally {
      setCasting(false);
    }
  };

  const activeElections = elections.filter(e => e.status === 'active');

  return (
    <div>
      <AnimatePresence>
        {showFaceCamera && (
          <FaceCamera
            mode="verify"
            title="🔐 Verify to Vote"
            subtitle="Face verification required before casting your vote"
            onSuccess={handleFaceVerifySuccess}
            onCancel={() => { setShowFaceCamera(false); setPendingVote(null); }}
          />
        )}
      </AnimatePresence>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 8000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              style={{ background: 'rgba(4,10,4,0.99)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 18, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 0 60px rgba(34,197,94,0.15)' }}
            >
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🗳️</div>
                <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Confirm Your Vote</h3>
                <p style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }}>This action is irreversible on the blockchain</p>
              </div>
              <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 10, padding: 16, marginBottom: 22 }}>
                <div style={{ color: '#9ca3af', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, marginBottom: 4, textTransform: 'uppercase' }}>Election</div>
                <div style={{ color: '#d1fae5', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{confirmData.election.title}</div>
                <div style={{ color: '#9ca3af', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, marginBottom: 8, textTransform: 'uppercase' }}>Candidate</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar initials={confirmData.candidate.avatar_initials} color={confirmData.candidate.color} size={40} />
                  <div>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{confirmData.candidate.name}</div>
                    <div style={{ color: '#86efac', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }}>{confirmData.candidate.party}</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn onClick={() => setConfirmData(null)} variant="secondary" style={{ flex: 1, padding: '12px 0' }}>Cancel</Btn>
                <Btn onClick={castVote} disabled={casting} style={{ flex: 1, padding: '12px 0' }}>
                  {casting ? '⛏ Mining...' : '⛓ Cast Vote'}
                </Btn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth status banners */}
      {!user.faceRegistered && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 18, color: '#fca5a5', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, display: 'flex', gap: 8 }}>
          🧬 <span>Face ID not enrolled. Go to <strong style={{ color: '#ef4444' }}>Security</strong> tab to register your biometrics before voting.</span>
        </motion.div>
      )}
      {user.faceRegistered && faceToken && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '10px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', animation: 'pulse 2s ease infinite' }} />
          <div style={{ color: '#22c55e', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 700 }}>FACE VERIFIED · VOTING TOKEN ACTIVE (10 MIN)</div>
        </motion.div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 18 }}>
        <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none', color: '#6b7280' }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidates or parties..." style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 40px', background: 'rgba(8,18,8,0.8)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 10, color: '#fff', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, outline: 'none' }} />
      </div>

      {/* Filter tabs */}
      {activeElections.length > 1 && (
        <div style={{ display: 'flex', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
          {[{ id: null, title: 'All Elections' }, ...activeElections].map(e => (
            <Btn key={e.id} onClick={() => setFilter(e.id)} variant={filter === e.id ? 'primary' : 'secondary'} size="sm">
              {e.id ? e.title.split(' ').slice(0, 3).join(' ') + '…' : 'All'}
            </Btn>
          ))}
        </div>
      )}

      {/* Elections list */}
      {activeElections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#4b5563', fontFamily: "'IBM Plex Mono',monospace" }}>No active elections</div>
      ) : activeElections.filter(e => !filter || e.id === filter).map((election, ei) => {
        const voted = votedElections[election.id];
        const total = election.candidates?.reduce((a, c) => a + c.vote_count, 0) || 0;
        const candidates = (election.candidates || []).filter(c =>
          !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.party || '').toLowerCase().includes(search.toLowerCase())
        );

        return (
          <div key={election.id} style={{ marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{election.title}</h2>
              <Badge label="LIVE" color="#22c55e" />
              {voted && <Badge label="VOTED" color="#eab308" />}
              <div style={{ marginLeft: 'auto' }}>
                <span style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>Ends in </span>
                <Countdown endDate={election.end_date || election.endDate} />
              </div>
            </div>

            {voted && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 8, padding: '9px 14px', marginBottom: 14, color: '#fbbf24', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>
                ⚠️ Already voted · Double-voting prevented by blockchain
              </motion.div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
              {candidates.map((c, ci) => {
                const pct = total === 0 ? 0 : ((c.vote_count / total) * 100).toFixed(1);
                const isMyVote = false; // Would need to track which candidate user voted for
                return (
                  <Card key={c.id} delay={ci * 0.06} glow={isMyVote} style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <Avatar initials={c.avatar_initials} color={c.color} size={50} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{c.name}</div>
                        <div style={{ color: c.color, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>{c.party}</div>
                        {c.bio && <div style={{ color: '#4b5563', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.bio}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <ProgressBar value={c.vote_count} max={total} color={c.color} />
                      <span style={{ color: '#9ca3af', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, flexShrink: 0 }}>{pct}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>{c.vote_count} votes</span>
                      <Btn
                        onClick={() => handleCastClick(election, c)}
                        disabled={voted}
                        variant={voted ? 'secondary' : !user.faceRegistered ? 'gold' : 'primary'}
                        size="sm"
                        style={{ fontSize: 10 }}
                      >
                        {voted ? '✓ Voted' : !user.faceRegistered ? '🧬 Enroll First' : !faceToken ? '🔐 Verify Face' : 'Cast Vote →'}
                      </Btn>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
