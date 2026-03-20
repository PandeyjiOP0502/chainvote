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

// ── BLOCKCHAIN EXPLORER ─────────────────────────────────────────────────────────
function BlockchainExplorer({ blocks: dbBlocks }) {
  const [xTab, setXTab] = useState('chain');
  const [sTab, setSTab] = useState('contract');
  const [qLog, setQLog] = useState(['// Click a query button to run it']);
  const mono = { fontFamily: "'IBM Plex Mono',monospace" };

  const chain = (dbBlocks || []).map((b, i) => ({
    number: b.id, type: i === 0 ? 'genesis' : 'vote',
    hash: b.hash || '0x'+'0'.repeat(64),
    prevHash: b.prev_hash || '0x'+'0'.repeat(64),
    voteCount: b.vote_count || 0,
    ts: b.mined_at ? new Date(b.mined_at).toLocaleTimeString() : '—',
  }));

  const QUERIES = {
    getResults:  () => ['contract.getResults() =>', '', ...chain.map(b => `  Block #${b.number}: ${b.type} — voteCount: ${b.voteCount}`), '', '  View function — zero gas cost'],
    hasVoted:    () => ['voters[address].hasVoted =>', '', '  true after castVote()', '  immutable — cannot be reset on-chain'],
    getBlock:    () => { const b = chain[chain.length-1]||{}; return ['provider.getBlock("latest") =>', '', `  number: ${b.number??0}`, `  hash:   0x${(b.hash||'').slice(2,14)}…`, `  prev:   0x${(b.prevHash||'').slice(2,14)}…`, `  ts:     ${b.ts||'—'}`]; },
    blockCount:  () => ['provider.getBlockNumber() =>', '', `  ${chain.length} blocks total`],
    txReceipt:   () => { const vb = chain.filter(b=>b.type==='vote'); if(!vb.length) return ['Cast a vote first.']; const b = vb[vb.length-1]; return [`getTransactionReceipt =>`, '', `  block: #${b.number}`, `  hash:  0x${b.hash.slice(2,14)}…`, `  status: 1 (success)`, `  gasUsed: ~46,832`]; },
    verifyChain: () => { const bad=[]; for(let i=1;i<chain.length;i++) if(chain[i].prevHash!==chain[i-1].hash) bad.push(`Block #${chain[i].number}: bad prevHash`); return bad.length ? ['verifyChain() =>', '', `  ✗ ${bad.length} issue(s):`, ...bad.map(x=>'    '+x)] : ['verifyChain() =>', '', `  ✓ All ${chain.length} blocks valid`]; },
    doubleVote:  () => ['castVote() ← same wallet second call =>', '', '  REVERT: "Already voted"', '  require(!voters[msg.sender].hasVoted) failed', '  Enforced by EVM — no server can bypass this'],
  };

  const T = a => ({ padding:'7px 16px', borderRadius:7, fontSize:11, cursor:'pointer', fontWeight:600, ...mono, background:a?'linear-gradient(135deg,#166534,#14532d)':'rgba(255,255,255,0.04)', border:a?'1px solid #22c55e55':'1px solid rgba(255,255,255,0.08)', color:a?'#22c55e':'#6b7280' });

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ color:'#fff', fontSize:14, fontWeight:700 }}>⛓ Blockchain Explorer</div>
        <span style={{ background:'rgba(34,197,94,0.1)', border:'1px solid #22c55e33', borderRadius:99, padding:'3px 12px', color:'#22c55e', ...mono, fontSize:10 }}>Hardhat :8545</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
        {[{l:'Blocks',v:chain.length},{l:'Votes',v:chain.reduce((s,b)=>s+b.voteCount,0)},{l:'Difficulty',v:2},{l:'Network',v:'Hardhat'}].map(s=>(
          <div key={s.l} style={{ background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ color:'#fff', fontSize:18, fontWeight:800 }}>{s.v}</div>
            <div style={{ color:'#6b7280', ...mono, fontSize:9 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {[['chain','⛓ Live Chain'],['query','⌨ Query Console'],['solidity','📄 Solidity Code']].map(([id,label])=>(
          <button key={id} onClick={()=>setXTab(id)} style={T(xTab===id)}>{label}</button>
        ))}
      </div>

      {xTab==='chain' && (
        <div>
          {chain.length===0 ? <div style={{color:'#4b5563',...mono,fontSize:11,padding:20}}>No blocks yet.</div> : (
            <div style={{ overflowX:'auto', paddingBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', minWidth:'max-content' }}>
                {[...chain].reverse().map((b,i)=>(
                  <div key={b.number} style={{ display:'flex', alignItems:'center' }}>
                    {i>0 && <span style={{ color:'#22c55e44', fontSize:18, padding:'0 4px' }}>←</span>}
                    <div style={{ background:'rgba(8,18,8,0.88)', border:b.type==='genesis'?'1.5px solid #185FA5':'1.5px solid rgba(34,197,94,0.35)', borderRadius:10, padding:'10px 12px', minWidth:170 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                        <span style={{ color:'#22c55e', ...mono, fontSize:10, fontWeight:700 }}>Block #{b.number}</span>
                        <span style={{ padding:'1px 7px', borderRadius:99, ...mono, fontSize:8, background:b.type==='genesis'?'rgba(24,95,165,0.2)':'rgba(34,197,94,0.12)', color:b.type==='genesis'?'#378ADD':'#22c55e' }}>{b.type}</span>
                      </div>
                      <div style={{ color:'#6b7280', ...mono, fontSize:9, marginBottom:2 }}>prev: 0x{b.prevHash.slice(2,10)}…</div>
                      <div style={{ color:'#86efac', ...mono, fontSize:9, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:155 }}>hash: 0x{b.hash.slice(2,12)}…</div>
                      <div style={{ color:'#4b5563', ...mono, fontSize:9 }}>{b.voteCount} votes · {b.ts}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop:12, background:'rgba(0,0,0,0.35)', border:'1px solid rgba(34,197,94,0.1)', borderRadius:8, padding:'10px 14px', color:'#6b7280', ...mono, fontSize:10, lineHeight:1.7 }}>
            Each block stores the <span style={{color:'#86efac'}}>hash of the previous block</span> as <span style={{color:'#22c55e'}}>prev_hash</span>. Tampering with any vote breaks all subsequent hashes — detectable instantly via <span style={{color:'#22c55e'}}>verifyChain()</span>.
          </div>
        </div>
      )}

      {xTab==='query' && (
        <div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:12 }}>
            {[['getResults','getResults()'],['hasVoted','hasVoted()'],['getBlock','getBlock()'],['blockCount','blockNumber()'],['txReceipt','txReceipt()'],['verifyChain','verifyChain()']].map(([k,l])=>(
              <button key={k} onClick={()=>setQLog(QUERIES[k]())} style={{ padding:'6px 13px', borderRadius:6, fontSize:10, cursor:'pointer', ...mono, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#86efac' }}>{l}</button>
            ))}
            <button onClick={()=>setQLog(QUERIES.doubleVote())} style={{ padding:'6px 13px', borderRadius:6, fontSize:10, cursor:'pointer', ...mono, background:'rgba(239,68,68,0.08)', border:'1px solid #ef444433', color:'#ef4444' }}>⚠ double vote</button>
          </div>
          <div style={{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(34,197,94,0.1)', borderRadius:8, padding:'12px 14px', minHeight:160, maxHeight:280, overflowY:'auto' }}>
            {qLog.map((line,i)=>(
              <div key={i} style={{ ...mono, fontSize:11, lineHeight:1.85, color: i===0?'#378ADD':line.includes('✓')?'#22c55e':(line.includes('✗')||line.includes('REVERT'))?'#ef4444':line.trim()===''?'transparent':'#86efac' }}>{line||'\u00a0'}</div>
            ))}
          </div>
        </div>
      )}

      {xTab==='solidity' && (
        <div>
          <div style={{ display:'flex', gap:7, marginBottom:10 }}>
            {[['contract','ChainVote.sol'],['deploy','deploy.js'],['hardhat','hardhat.config.js']].map(([id,label])=>(
              <button key={id} onClick={()=>setSTab(id)} style={{ padding:'5px 14px', borderRadius:6, fontSize:10, cursor:'pointer', ...mono, background:sTab===id?'rgba(34,197,94,0.1)':'rgba(255,255,255,0.03)', border:sTab===id?'1px solid #22c55e44':'1px solid rgba(255,255,255,0.07)', color:sTab===id?'#22c55e':'#6b7280' }}>{label}</button>
            ))}
          </div>
          <div style={{ background:'rgba(0,0,0,0.55)', border:'1px solid rgba(34,197,94,0.1)', borderRadius:8, padding:'14px', overflowX:'auto', maxHeight:380, overflowY:'auto' }}>
            <pre style={{ ...mono, fontSize:11, lineHeight:1.75, color:'#86efac', margin:0, whiteSpace:'pre' }}>
              {sTab==='contract' ? `// ChainVote.sol\npragma solidity ^0.8.20;\n\ncontract ChainVote is Ownable {\n    struct Candidate { uint256 id; string name; string party; uint256 voteCount; }\n    struct Voter { bool hasVoted; uint256 candidateId; uint256 timestamp; }\n\n    mapping(uint256 => Candidate) public candidates;\n    mapping(address => Voter) public voters;\n    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp);\n\n    function castVote(uint256 _candidateId) external {\n        require(isOpen, "Election is not open");\n        require(!voters[msg.sender].hasVoted, "Already voted"); // double-vote prevention\n        require(_candidateId < candidateCount, "Invalid candidate");\n        voters[msg.sender] = Voter({ hasVoted: true, candidateId: _candidateId, timestamp: block.timestamp });\n        candidates[_candidateId].voteCount++;\n        totalVotes++;\n        emit VoteCast(msg.sender, _candidateId, block.timestamp);\n    }\n}`
              : sTab==='deploy' ? `// deploy.js\nconst { ethers } = require("hardhat");\nasync function main() {\n  const ChainVote = await ethers.getContractFactory("ChainVote");\n  const contract = await ChainVote.deploy("Election 2025");\n  await contract.waitForDeployment();\n  await contract.addCandidate("Alexandra Reid", "Progressive Alliance");\n  await contract.addCandidate("Marcus Chen", "National Unity Party");\n  await contract.openElection();\n  console.log("Deployed to:", await contract.getAddress());\n}\nmain().catch(err => { console.error(err); process.exit(1); });`
              : `// hardhat.config.js\nrequire("@nomicfoundation/hardhat-toolbox");\nmodule.exports = {\n  solidity: "0.8.20",\n  networks: {\n    hardhat: { chainId: 31337 },\n    localhost: { url: "http://127.0.0.1:8545" }\n  }\n};\n// npx hardhat node\n// npx hardhat compile\n// npx hardhat run scripts/deploy.js --network localhost`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export function Dashboard({ elections, blocks, token, onBlocksClick }) {
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
          { label: 'Blocks Mined', value: blocks.length, icon: '⛓️', c: '#10b981', onClick: onBlocksClick },
          { label: 'Face Auth', value: user?.faceRegistered ? 'Active' : 'Inactive', icon: '🧬', c: user?.faceRegistered ? '#22c55e' : '#ef4444' },
          ...(stats ? [{ label: 'Total Voters', value: stats.totalVoters, icon: '👥', c: '#f59e0b' }] : []),
        ].map((s, i) => (
          <Card key={s.label} delay={i * 0.05} glow onClick={s.onClick} style={{ position:'relative', cursor: s.onClick ? 'pointer' : 'default' }}>
            {s.onClick && <div style={{ position:'absolute',top:8,right:10,color:'#22c55e55',fontFamily:"'IBM Plex Mono',monospace",fontSize:9 }}>explore ↗</div>}
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
export function AdminPage({ elections, setElections, blocks, token, onToast, adminView = 'create', setAdminView }) {
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', candidates: [{ name: '', party: '', bio: '' }, { name: '', party: '', bio: '' }] });
  const [voters, setVoters] = useState([]);
  const [stats, setStats] = useState(null);
  const [creating, setCreating] = useState(false);
  const activeTab = adminView;
  const setActiveTab = (v) => { if (setAdminView) setAdminView(v); };

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
        {['create', 'manage', 'voters', 'blockchain'].map(t => (
          <Btn key={t} onClick={() => setActiveTab(t)} variant={activeTab === t ? 'primary' : 'secondary'} size="sm" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em' }}>
            {t === 'create' ? '+ Create' : t === 'manage' ? '⚙ Manage' : t === 'voters' ? '👥 Voters' : '⛓ Blockchain'}
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

      {activeTab === 'blockchain' && <BlockchainExplorer blocks={blocks} />}
    </div>
  );
}
