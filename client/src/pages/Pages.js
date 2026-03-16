import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Card, Avatar, Badge, Btn, ProgressBar, SectionLabel, Input } from '../components/UI';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// ── COUNTDOWN ─────────────────────────────────────────────────────────────────
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
  return <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: '#22c55e', fontSize: 12 }}>{t}</span>;
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export function Dashboard({ elections, blocks, token }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin' && token) {
      api.getStats(token).then(setStats).catch(() => {});
    }
  }, [user, token]);

  const totalVotes = elections.reduce((a, e) => a + (e.totalVotes || 0), 0);
  const activeElections = elections.filter(e => e.status === 'active');

  return (
    <div>
      {!user?.faceRegistered && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.28)', borderRadius: 10, padding: '12px 16px', marginBottom: 22, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#fbbf24', display: 'flex', gap: 8, alignItems: 'center' }}>
          ⚠️ <span>Face ID not registered. Go to <strong style={{ color: '#eab308' }}>Security</strong> to enroll and unlock voting.</span>
        </motion.div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Active Elections', value: activeElections.length, icon: '🗳️', c: '#22c55e' },
          { label: 'Total Votes', value: totalVotes.toLocaleString(), icon: '📊', c: '#eab308' },
          { label: 'Blocks Mined', value: blocks.length, icon: '⛓️', c: '#10b981' },
          { label: 'Face Auth', value: user?.faceRegistered ? 'Active' : 'Inactive', icon: '🧬', c: user?.faceRegistered ? '#22c55e' : '#ef4444' },
          ...(stats ? [{ label: 'Total Voters', value: stats.totalVoters, icon: '👥', c: '#f59e0b' }] : []),
        ].map((s, i) => (
          <Card key={s.label} delay={i * 0.05} glow>
            <div style={{ color: s.c, fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 800 }}>{s.value}</div>
            <div style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, marginTop: 3 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Active elections */}
      <SectionLabel>ACTIVE ELECTIONS</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {activeElections.length === 0 ? (
          <div style={{ color: '#4b5563', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, padding: 20 }}>No active elections</div>
        ) : activeElections.map((e, i) => {
          const lead = e.candidates?.sort((a, b) => b.vote_count - a.vote_count)[0];
          return (
            <Card key={e.id} delay={i * 0.07}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <Badge label="LIVE" color="#22c55e" />
                    <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{e.title}</span>
                  </div>
                  <div style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, marginBottom: 8 }}>{e.description}</div>
                  {lead != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, fontFamily: "'IBM Plex Mono',monospace" }}>
                      <span style={{ color: '#6b7280' }}>Leading:</span>
                      <Avatar initials={lead.avatar_initials} color={lead.color} size={20} />
                      <span style={{ color: '#86efac' }}>{lead.name}</span>
                      <span style={{ color: '#6b7280' }}>({lead.vote_count})</span>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, marginBottom: 3 }}>Ends in</div>
                  <Countdown endDate={e.end_date || e.endDate} />
                  <div style={{ color: '#4b5563', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, marginTop: 5 }}>{e.totalVotes || 0} votes cast</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Blockchain ledger */}
      <SectionLabel>BLOCKCHAIN LEDGER (last {Math.min(5, blocks.length)} blocks)</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...blocks].slice(0, 5).map((b, i) => (
          <Card key={b.id} delay={i * 0.04} style={{ padding: '13px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ background: 'linear-gradient(135deg,#22c55e18,#14532d18)', border: '1px solid #22c55e33', borderRadius: 6, padding: '2px 9px', color: '#22c55e', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>#{b.id}</div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ color: '#86efac', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.hash}</div>
              </div>
              <div style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, flexShrink: 0 }}>
                {b.vote_count} vote · {new Date(b.mined_at).toLocaleTimeString()}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── RESULTS PAGE ──────────────────────────────────────────────────────────────
export function ResultsPage({ elections }) {
  const [sel, setSel] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (elections.length) setSel(elections[0].id); }, [elections]);

  useEffect(() => {
    if (!sel) return;
    setLoading(true);
    api.getResults(sel).then(r => { setResults(r); setLoading(false); }).catch(() => setLoading(false));
  }, [sel]);

  const COLORS = ['#22c55e','#eab308','#10b981','#f59e0b','#84cc16','#fbbf24'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 22, flexWrap: 'wrap' }}>
        {elections.map(e => (
          <Btn key={e.id} onClick={() => setSel(e.id)} variant={sel === e.id ? 'primary' : 'secondary'} size="sm">
            {e.title.split(' ').slice(0, 3).join(' ')}…
          </Btn>
        ))}
      </div>

      {loading && <div style={{ color: '#22c55e', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, padding: 20 }}>Loading results...</div>}

      {results && !loading && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <h2 style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>{results.election.title}</h2>
            <Badge label={results.election.status === 'active' ? 'LIVE' : 'CLOSED'} color={results.election.status === 'active' ? '#22c55e' : '#6b7280'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, marginBottom: 24 }}>
            {/* Pie chart */}
            <Card>
              <SectionLabel>VOTE DISTRIBUTION</SectionLabel>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={results.results.map(r => ({ name: r.name, value: r.vote_count, color: r.color }))} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                    {results.results.map((r, i) => <Cell key={i} fill={r.color} opacity={0.85} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#060e06', border: '1px solid #22c55e33', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {results.results.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                    <span style={{ color: '#9ca3af', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9 }}>{r.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Bar chart */}
            <Card>
              <SectionLabel>CANDIDATE STANDINGS</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {results.results.map((r, i) => (
                  <div key={r.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: i === 0 ? '#eab30822' : 'transparent', border: `1px solid ${i === 0 ? '#eab308' : '#374151'}`, color: i === 0 ? '#eab308' : '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                      <Avatar initials={r.avatar_initials} color={r.color} size={26} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{r.name}</div>
                        <div style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9 }}>{r.party}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: r.color, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 700 }}>{r.percentage}%</div>
                        <div style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9 }}>{r.vote_count}</div>
                      </div>
                    </div>
                    <ProgressBar value={r.vote_count} max={results.totalVotes} color={r.color} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>
                <span style={{ color: '#6b7280' }}>Total Votes</span>
                <span style={{ color: '#86efac', fontWeight: 700 }}>{results.totalVotes}</span>
              </div>
            </Card>
          </div>

          {/* Bar chart visualization */}
          <Card>
            <SectionLabel>VOTE COMPARISON</SectionLabel>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={results.results.map(r => ({ name: r.name.split(' ')[0], votes: r.vote_count, fill: r.color }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,197,94,0.08)" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                <Tooltip contentStyle={{ background: '#060e06', border: '1px solid #22c55e33', borderRadius: 8, fontFamily: 'IBM Plex Mono', fontSize: 11 }} />
                <Bar dataKey="votes" radius={[4, 4, 0, 0]}>
                  {results.results.map((r, i) => <Cell key={i} fill={r.color} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
}

// ── MY VOTES PAGE ─────────────────────────────────────────────────────────────
export function MyVotesPage({ token, onToast }) {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyVotes(token).then(v => { setVotes(v); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  const downloadReceipt = (v) => {
    const text = `=== ChainVote Official Vote Receipt ===

Voter ID     : ${v.voter_id || '—'}
Election     : ${v.election_title}
Candidate    : ${v.candidate_name} (${v.candidate_party})
Timestamp    : ${new Date(v.created_at).toLocaleString()}
TX Hash      : ${v.tx_hash}
Block ID     : #${v.block_id}
Block Hash   : ${v.block_hash}
Face Verified: ${v.face_verified ? 'YES ✓' : 'NO'}
Confidence   : ${v.face_confidence ? v.face_confidence.toFixed(1) + '%' : '—'}

This receipt cryptographically proves your vote was recorded on-chain.
ChainVote Blockchain Voting System v1.0`.trim();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = `chainvote-receipt-${v.id}.txt`;
    a.click();
  };

  if (loading) return <div style={{ color: '#22c55e', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, padding: 20 }}>Loading your votes...</div>;

  return (
    <div>
      {votes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 72 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🗳️</div>
          <div style={{ color: '#4b5563', fontFamily: "'IBM Plex Mono',monospace" }}>No votes cast yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {votes.map((v, i) => (
            <Card key={v.id} delay={i * 0.07} glow>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
                    <Badge label="CONFIRMED" color="#22c55e" />
                    {v.face_verified && <Badge label={`FACE ${v.face_confidence?.toFixed(0)}%`} color="#eab308" />}
                    <span style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, alignSelf: 'center' }}>Block #{v.block_id}</span>
                  </div>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{v.election_title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Avatar initials={(v.candidate_name || '??').split(' ').map(w => w[0]).join('').slice(0, 2)} color={v.candidate_color || '#22c55e'} size={34} />
                    <div>
                      <div style={{ color: '#d1fae5', fontSize: 13, fontWeight: 600 }}>{v.candidate_name}</div>
                      <div style={{ color: v.candidate_color || '#22c55e', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>{v.candidate_party}</div>
                    </div>
                  </div>
                  {[
                    { l: 'TX Hash', val: v.tx_hash, trunc: true },
                    { l: 'Block Hash', val: v.block_hash, trunc: true },
                    { l: 'Time', val: new Date(v.created_at).toLocaleString(), trunc: false },
                  ].map(r => (
                    <div key={r.l} style={{ display: 'flex', gap: 8, marginBottom: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, minWidth: 70 }}>{r.l}:</span>
                      <span style={{ color: '#86efac', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: r.trunc ? 220 : 'none' }}>{r.val}</span>
                    </div>
                  ))}
                </div>
                <Btn onClick={() => downloadReceipt(v)} variant="gold" size="sm">📄 Receipt</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ADMIN PAGE ────────────────────────────────────────────────────────────────
export function AdminPage({ elections, setElections, token, onToast }) {
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', candidates: [{ name: '', party: '', bio: '' }, { name: '', party: '', bio: '' }] });
  const [voters, setVoters] = useState([]);
  const [stats, setStats] = useState(null);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  useEffect(() => {
    api.getVoters(token).then(setVoters).catch(() => {});
    api.getStats(token).then(setStats).catch(() => {});
  }, [token]);

  const deployElection = async () => {
    const valids = form.candidates.filter(c => c.name.trim());
    if (!form.title || !form.startDate || !form.endDate || valids.length < 2) {
      return onToast('Fill all required fields (min 2 candidates)', 'error');
    }
    setCreating(true);
    try {
      const result = await api.createElection({ ...form, candidates: valids }, token);
      setElections(prev => [...prev, { ...result.election, candidates: result.candidates, totalVotes: 0 }]);
      setForm({ title: '', description: '', startDate: '', endDate: '', candidates: [{ name: '', party: '', bio: '' }, { name: '', party: '', bio: '' }] });
      onToast('🎉 Election deployed to blockchain!', 'success');
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (election) => {
    const newStatus = election.status === 'active' ? 'closed' : 'active';
    try {
      await api.updateElectionStatus(election.id, newStatus, token);
      setElections(prev => prev.map(e => e.id === election.id ? { ...e, status: newStatus } : e));
      onToast(`Election ${newStatus}`, 'success');
    } catch (err) {
      onToast(err.message, 'error');
    }
  };

  const deleteElection = async (election) => {
    if (!window.confirm(`Are you sure you want to delete "${election.title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteElection(election.id, token);
      setElections(prev => prev.filter(e => e.id !== election.id));
      onToast('Election deleted successfully', 'success');
    } catch (err) {
      onToast(err.message, 'error');
    }
  };

  const inp = { padding: '10px 12px', background: 'rgba(8,18,8,0.8)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 8, color: '#fff', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div>
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { l: 'Total Voters', v: stats.totalVoters, c: '#22c55e', i: '👥' },
            { l: 'Face Enrolled', v: stats.faceEnrolled, c: '#eab308', i: '🧬' },
            { l: 'Elections', v: stats.totalElections, c: '#10b981', i: '🗳' },
            { l: 'Total Votes', v: stats.totalVotes, c: '#f59e0b', i: '📊' },
            { l: 'Blocks Mined', v: stats.totalBlocks, c: '#84cc16', i: '⛓' },
          ].map((s, i) => (
            <Card key={s.l} delay={i * 0.04} style={{ padding: 16 }}>
              <div style={{ color: s.c, fontSize: 20, marginBottom: 6 }}>{s.i}</div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{s.v != null ? String(s.v) : "0"}</div>
              <div style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, marginTop: 2 }}>{s.l}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Admin tabs */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 22 }}>
        {['create', 'manage', 'voters'].map(t => (
          <Btn key={t} onClick={() => setActiveTab(t)} variant={activeTab === t ? 'primary' : 'secondary'} size="sm" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em' }}>
            {t === 'create' ? '+ Create Election' : t === 'manage' ? '⚙ Manage' : '👥 Voters'}
          </Btn>
        ))}
      </div>

      {activeTab === 'create' && (
        <Card>
          <SectionLabel>DEPLOY NEW ELECTION</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ color: '#9ca3af', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, display: 'block', marginBottom: 5 }}>TITLE *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} placeholder="e.g. City Mayor 2025" />
            </div>
            <div>
              <label style={{ color: '#9ca3af', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, display: 'block', marginBottom: 5 }}>DESCRIPTION</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inp} placeholder="Brief description" />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#9ca3af', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, display: 'block', marginBottom: 5 }}>START DATE *</label>
                <input
                  id="start-date-input"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  style={inp}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('start-date-input');
                  if (input) input.showPicker();
                }}
                style={{
                  background: 'rgba(34,197,94,0.15)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#22c55e',
                  cursor: 'pointer',
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                📅 Calendar
              </button>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#9ca3af', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, display: 'block', marginBottom: 5 }}>END DATE *</label>
                <input
                  id="end-date-input"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  style={inp}
                  min={form.startDate || new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('end-date-input');
                  if (input) input.showPicker();
                }}
                style={{
                  background: 'rgba(34,197,94,0.15)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#22c55e',
                  cursor: 'pointer',
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                📅 Calendar
              </button>
            </div>
          </div>

          <div style={{ color: '#9ca3af', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, marginBottom: 10 }}>CANDIDATES (MIN 2) *</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {form.candidates.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input value={c.name} onChange={e => { const cc = [...form.candidates]; cc[i] = { ...cc[i], name: e.target.value }; setForm(f => ({ ...f, candidates: cc })); }} style={{ ...inp, flex: 1 }} placeholder={`Candidate ${i + 1} name *`} />
                <input value={c.party} onChange={e => { const cc = [...form.candidates]; cc[i] = { ...cc[i], party: e.target.value }; setForm(f => ({ ...f, candidates: cc })); }} style={{ ...inp, flex: 1 }} placeholder="Party / affiliation" />
                <input value={c.bio} onChange={e => { const cc = [...form.candidates]; cc[i] = { ...cc[i], bio: e.target.value }; setForm(f => ({ ...f, candidates: cc })); }} style={{ ...inp, flex: 2 }} placeholder="Brief bio" />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn onClick={() => setForm(f => ({ ...f, candidates: [...f.candidates, { name: '', party: '', bio: '' }] }))} variant="secondary" size="sm">+ Add Candidate</Btn>
            <Btn onClick={deployElection} disabled={creating} size="md">
              {creating ? '⛏ Mining Block...' : '⛓ Deploy Election'}
            </Btn>
          </div>
        </Card>
      )}

      {activeTab === 'manage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {elections && Array.isArray(elections) && elections.map(e => {
            const total = e.candidates?.reduce((a, c) => a + c.vote_count, 0) || 0;
            return (
              <Card key={e.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                      <Badge label={e.status === 'active' ? 'ACTIVE' : e.status === 'closed' ? 'CLOSED' : 'PENDING'} color={e.status === 'active' ? '#22c55e' : '#6b7280'} />
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{e.title}</span>
                    </div>
                    <div style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>
                      {e.candidates?.length || 0} candidates · {total} votes · Ends {new Date(e.end_date || e.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn onClick={() => toggleStatus(e)} variant={e.status === 'active' ? 'danger' : 'primary'} size="sm">
                      {e.status === 'active' ? '⏹ Close' : '▶ Reopen'}
                    </Btn>
                    {e.status !== 'active' && (
                      <Btn onClick={() => deleteElection(e)} variant="danger" size="sm">
                        🗑 Delete
                      </Btn>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
          {(!elections || !Array.isArray(elections) || elections.length === 0) && (
            <div style={{ color: '#4b5563', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, padding: 20, textAlign: 'center' }}>
              No elections to manage
            </div>
          )}
        </div>
      )}

      {activeTab === 'voters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {voters.map((v, i) => (
            <Card key={v.id} delay={i * 0.04} style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Avatar initials={v.name[0].toUpperCase()} color={v.face_registered_at ? '#22c55e' : '#6b7280'} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{v.name}</div>
                  <div style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>{v.email} · {v.voter_id}</div>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  {v.face_registered_at && <Badge label="FACE ID" color="#22c55e" />}
                  <Badge label={v.is_verified ? 'VERIFIED' : 'UNVERIFIED'} color={v.is_verified ? '#10b981' : '#6b7280'} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
