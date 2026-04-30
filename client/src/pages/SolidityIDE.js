import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { compileSolidity, extractContractTree } from '../utils/solidity-compiler';
import { switchToSepolia, connectMetaMask, initWeb3 } from '../utils/web3';
import { Card, Badge, Btn, SectionLabel } from '../components/UI';

const mono = { fontFamily: "'IBM Plex Mono',monospace" };
const DEFAULT_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ChainVote {
    string public title;
    string public description;
    bool public isOpen;
    uint256 public totalVotes;
    uint256 public candidateCount;

    struct Candidate {
        uint256 id; string name; string party; string bio; uint256 voteCount;
    }
    struct Voter { bool hasVoted; uint256 candidateId; uint256 timestamp; }

    mapping(uint256 => Candidate) public candidates;
    mapping(address => Voter) public voters;

    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 indexed electionId, uint256 timestamp);
    event CandidateAdded(uint256 id, string name, string party);

    constructor(string memory _title, string memory _description) {
        title = _title; description = _description;
    }

    function addCandidate(string memory _name, string memory _party, string memory _bio) external {
        require(!isOpen, "Cannot add while open");
        candidates[candidateCount] = Candidate(candidateCount, _name, _party, _bio, 0);
        emit CandidateAdded(candidateCount, _name, _party);
        candidateCount++;
    }

    function openElection() external { require(candidateCount >= 2); isOpen = true; }
    function closeElection() external { isOpen = false; }

    function castVote(uint256 _candidateId, uint256 _electionId) external {
        require(isOpen, "Not open");
        require(!voters[msg.sender].hasVoted, "Already voted");
        require(_candidateId < candidateCount, "Invalid");
        voters[msg.sender] = Voter(true, _candidateId, block.timestamp);
        candidates[_candidateId].voteCount++;
        totalVotes++;
        emit VoteCast(msg.sender, _candidateId, _electionId, block.timestamp);
    }

    function getResults() external view returns (Candidate[] memory) {
        Candidate[] memory r = new Candidate[](candidateCount);
        for (uint256 i = 0; i < candidateCount; i++) r[i] = candidates[i];
        return r;
    }

    function hasVoted(address _v) external view returns (bool) { return voters[_v].hasVoted; }
}`;

const SolidityIDE = ({ onToast }) => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [activeTab, setActiveTab] = useState('compiler');
  const [compileResult, setCompileResult] = useState(null);
  const [compiling, setCompiling] = useState(false);
  const [deployedAddr, setDeployedAddr] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [ctorArgs, setCtorArgs] = useState({});
  const [fnArgs, setFnArgs] = useState({});
  const [fnResults, setFnResults] = useState({});
  const [txLog, setTxLog] = useState([]);
  const [contractTree, setContractTree] = useState([]);
  const [showTree, setShowTree] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const handleCompile = async () => {
    setCompiling(true);
    try {
      const result = await compileSolidity(code);
      console.log('Compile result:', result);
      setCompileResult(result);
      if (result.ast) setContractTree(extractContractTree(result.ast));
      const names = Object.keys(result.contracts || {});
      if (names.length > 0) setSelectedContract(names[0]);
      onToast(result.success ? '✅ Compilation successful!' : '❌ Compilation failed', result.success ? 'success' : 'error');
    } catch (err) {
      onToast('Compile error: ' + err.message, 'error');
    } finally { setCompiling(false); }
  };

  const handleConnect = async () => {
    try {
      if (!window.ethereum) return onToast('Install MetaMask', 'error');
      await switchToSepolia();
      const addr = await connectMetaMask();
      setWallet(addr);
      onToast('🦊 Connected to Sepolia!', 'success');
    } catch (err) { onToast(err.message, 'error'); }
  };

  const handleDeploy = async () => {
    if (!wallet) return onToast('Connect wallet first', 'error');
    if (!compileResult?.success || !selectedContract) return onToast('Compile first', 'error');
    const c = compileResult.contracts[selectedContract];
    if (!c?.bytecode || c.bytecode.length < 10) return onToast('No bytecode available', 'error');
    setDeploying(true);
    try {
      const w3 = await initWeb3();
      const contract = new w3.eth.Contract(c.abi);
      const ctorAbi = c.abi.find(a => a.type === 'constructor');
      const args = ctorAbi ? ctorAbi.inputs.map((inp, i) => ctorArgs[i] || '') : [];
      const deployed = await contract.deploy({ data: c.bytecode.startsWith('0x') ? c.bytecode : '0x' + c.bytecode, arguments: args }).send({ from: wallet, gas: 3000000 });
      const addr = deployed.options.address;
      setDeployedAddr(addr);
      addTxLog('Deploy', 'deploy', 'Success', addr);
      onToast('🚀 Contract deployed: ' + addr.slice(0,10) + '...', 'success');
      setActiveTab('functions');
    } catch (err) { onToast('Deploy failed: ' + err.message, 'error'); } finally { setDeploying(false); }
  };

  const addTxLog = (fn, type, status, detail) => {
    setTxLog(prev => [{ fn, type, status, detail, time: new Date().toLocaleTimeString(), id: Date.now() }, ...prev]);
  };

  const callFunction = async (fnAbi) => {
    if (!deployedAddr || !wallet) return onToast('Deploy contract first', 'error');
    const key = fnAbi.name;
    const args = fnAbi.inputs.map((_, i) => fnArgs[`${key}_${i}`] || '');
    try {
      const w3 = await initWeb3();
      const c = compileResult.contracts[selectedContract];
      const instance = new w3.eth.Contract(c.abi, deployedAddr);
      const isView = fnAbi.stateMutability === 'view' || fnAbi.stateMutability === 'pure';
      let result;
      if (isView) {
        result = await instance.methods[key](...args).call();
        setFnResults(prev => ({ ...prev, [key]: String(result) }));
        addTxLog(key, 'call', 'Success', String(result));
      } else {
        const receipt = await instance.methods[key](...args).send({ from: wallet, gas: 300000 });
        setFnResults(prev => ({ ...prev, [key]: 'TX: ' + receipt.transactionHash?.slice(0,16) + '...' }));
        addTxLog(key, 'transact', 'Success', receipt.transactionHash);
      }
      onToast(`✅ ${key}() executed`, 'success');
    } catch (err) {
      setFnResults(prev => ({ ...prev, [key]: '❌ ' + err.message }));
      addTxLog(key, 'call', 'Revert', err.message);
      onToast(`${key}() failed`, 'error');
    }
  };

  const inp = { padding:'8px 10px', background:'rgba(8,18,8,0.8)', border:'1px solid rgba(34,197,94,0.18)', borderRadius:6, color:'#fff', ...mono, fontSize:10, outline:'none', width:'100%', boxSizing:'border-box' };
  const tabBtn = (id, label, active) => (
    <button key={id} onClick={() => setActiveTab(id)} style={{ padding:'7px 14px', borderRadius:7, fontSize:10, cursor:'pointer', fontWeight:600, ...mono, background: active ? 'linear-gradient(135deg,#166534,#14532d)' : 'rgba(255,255,255,0.04)', border: active ? '1px solid #22c55e55' : '1px solid rgba(255,255,255,0.08)', color: active ? '#22c55e' : '#6b7280' }}>{label}</button>
  );

  const currentAbi = compileResult?.contracts?.[selectedContract]?.abi || [];
  const fns = currentAbi.filter(a => a.type === 'function');
  const ctorAbi = currentAbi.find(a => a.type === 'constructor');

  return (
    <div>
      {/* Status Bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ color:'#fff', fontSize:14, fontWeight:700 }}>🔧 Solidity IDE</span>
          <Badge label="v0.8.20" color="#10b981" />
          {wallet && <Badge label={wallet.slice(0,6)+'...'+wallet.slice(-4)} color="#22c55e" />}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {!wallet ? <Btn onClick={handleConnect} size="sm">🦊 Connect</Btn> : <Badge label="Sepolia" color="#22c55e" />}
          <Btn onClick={() => setShowTree(!showTree)} variant="secondary" size="sm">{showTree ? '📂 Hide' : '📂 Tree'}</Btn>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: showTree ? '1fr 250px' : '1fr', gap:14 }}>
        <div>
          {/* Editor + Panels */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, minHeight:420 }}>
            {/* Code Editor */}
            <Card style={{ padding:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', borderBottom:'1px solid rgba(34,197,94,0.1)', background:'rgba(0,0,0,0.3)' }}>
                <span style={{ color:'#86efac', ...mono, fontSize:10 }}>📄 contract.sol</span>
                <Btn onClick={handleCompile} disabled={compiling} size="sm">{compiling ? '⏳ Compiling...' : '▶ Compile'}</Btn>
              </div>
              <div style={{ flex:1, position:'relative' }}>
                <div style={{ position:'absolute', top:0, left:0, width:36, bottom:0, background:'rgba(0,0,0,0.3)', borderRight:'1px solid rgba(34,197,94,0.08)', padding:'10px 0', overflowY:'hidden' }}>
                  {code.split('\n').map((_, i) => (
                    <div key={i} style={{ color:'#4b5563', ...mono, fontSize:10, textAlign:'right', paddingRight:8, lineHeight:'18px', height:18 }}>{i+1}</div>
                  ))}
                </div>
                <textarea value={code} onChange={e => setCode(e.target.value)} spellCheck={false} style={{ width:'100%', height:'100%', minHeight:380, background:'transparent', border:'none', color:'#86efac', ...mono, fontSize:11, lineHeight:'18px', padding:'10px 10px 10px 42px', outline:'none', resize:'none', boxSizing:'border-box', tabSize:4 }} />
              </div>
            </Card>

            {/* Right Panel */}
            <Card style={{ padding:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <div style={{ display:'flex', gap:4, padding:'6px 8px', borderBottom:'1px solid rgba(34,197,94,0.1)', background:'rgba(0,0,0,0.3)', flexWrap:'wrap' }}>
                {[['compiler','📋 Compiler'],['deploy','🚀 Deploy'],['functions','📞 Functions'],['transactions','📜 TX Log']].map(([id,label]) => tabBtn(id, label, activeTab===id))}
              </div>
              <div style={{ flex:1, padding:14, overflowY:'auto', maxHeight:420 }}>
                {/* Compiler Tab */}
                {activeTab === 'compiler' && (
                  <div>
                    <SectionLabel>COMPILATION OUTPUT</SectionLabel>
                    {!compileResult ? (
                      <div style={{ color:'#4b5563', ...mono, fontSize:11, padding:20, textAlign:'center' }}>Click "Compile" to compile your contract</div>
                    ) : (
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, padding:'10px 14px', background: compileResult.success ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${compileResult.success ? '#22c55e33' : '#ef444433'}`, borderRadius:8 }}>
                          <span style={{ fontSize:18 }}>{compileResult.success ? '✅' : '❌'}</span>
                          <span style={{ color: compileResult.success ? '#22c55e' : '#ef4444', ...mono, fontSize:12, fontWeight:700 }}>
                            {compileResult.success ? 'Compilation Successful' : 'Compilation Failed'}
                          </span>
                        </div>
                        {compileResult.warnings?.map((w, i) => (
                          <div key={i} style={{ background:'rgba(234,179,8,0.06)', border:'1px solid #eab30822', borderRadius:6, padding:'8px 12px', marginBottom:6, color:'#eab308', ...mono, fontSize:9, lineHeight:1.6 }}>⚠️ {w.formattedMessage || w.message}</div>
                        ))}
                        {compileResult.errors?.map((e, i) => (
                          <div key={i} style={{ background:'rgba(239,68,68,0.06)', border:'1px solid #ef444422', borderRadius:6, padding:'8px 12px', marginBottom:6, color:'#ef4444', ...mono, fontSize:9, lineHeight:1.6 }}>❌ {e.formattedMessage || e.message}</div>
                        ))}
                        {compileResult.success && Object.entries(compileResult.contracts).map(([name, c]) => (
                          <div key={name} style={{ marginTop:10 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                              <span style={{ color:'#22c55e', ...mono, fontSize:11, fontWeight:700 }}>✅ {name}</span>
                              <Badge label={`${c.abi.length} ABI entries`} color="#10b981" />
                            </div>
                            <details style={{ marginBottom:8 }}>
                              <summary style={{ color:'#6b7280', ...mono, fontSize:10, cursor:'pointer' }}>ABI ({c.abi.length} entries)</summary>
                              <pre style={{ background:'rgba(0,0,0,0.4)', borderRadius:6, padding:10, ...mono, fontSize:9, color:'#86efac', maxHeight:150, overflowY:'auto', whiteSpace:'pre-wrap' }}>{JSON.stringify(c.abi, null, 2)}</pre>
                            </details>
                            <details>
                              <summary style={{ color:'#6b7280', ...mono, fontSize:10, cursor:'pointer' }}>Bytecode</summary>
                              <div style={{ background:'rgba(0,0,0,0.4)', borderRadius:6, padding:10, ...mono, fontSize:9, color:'#86efac', maxHeight:80, overflowY:'auto', wordBreak:'break-all' }}>{c.bytecode?.slice(0,200)}...</div>
                            </details>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Deploy Tab */}
                {activeTab === 'deploy' && (
                  <div>
                    <SectionLabel>DEPLOY CONTRACT</SectionLabel>
                    {!wallet && <div style={{ textAlign:'center', padding:20 }}><Btn onClick={handleConnect} size="md">🦊 Connect MetaMask</Btn></div>}
                    {wallet && !compileResult?.success && <div style={{ color:'#eab308', ...mono, fontSize:11, padding:20, textAlign:'center' }}>⚠️ Compile your contract first</div>}
                    {wallet && compileResult?.success && (
                      <div>
                        {selectedContract && <Badge label={selectedContract} color="#22c55e" />}
                        {ctorAbi && ctorAbi.inputs.length > 0 && (
                          <div style={{ marginTop:12 }}>
                            <div style={{ color:'#9ca3af', ...mono, fontSize:9, marginBottom:8 }}>CONSTRUCTOR ARGUMENTS</div>
                            {ctorAbi.inputs.map((p, i) => (
                              <div key={i} style={{ marginBottom:8 }}>
                                <label style={{ color:'#6b7280', ...mono, fontSize:9 }}>{p.name} ({p.type})</label>
                                <input value={ctorArgs[i] || ''} onChange={e => setCtorArgs(prev => ({...prev, [i]: e.target.value}))} style={inp} placeholder={`${p.type}`} />
                              </div>
                            ))}
                          </div>
                        )}
                        <Btn onClick={handleDeploy} disabled={deploying} size="md" style={{ width:'100%', marginTop:12 }}>
                          {deploying ? '⏳ Deploying...' : '🚀 Deploy to Sepolia'}
                        </Btn>
                        {deployedAddr && (
                          <div style={{ marginTop:12, background:'rgba(34,197,94,0.06)', border:'1px solid #22c55e33', borderRadius:8, padding:'10px 14px' }}>
                            <div style={{ color:'#6b7280', ...mono, fontSize:9 }}>DEPLOYED ADDRESS</div>
                            <div style={{ color:'#22c55e', ...mono, fontSize:10, wordBreak:'break-all', marginTop:4 }}>{deployedAddr}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Functions Tab */}
                {activeTab === 'functions' && (
                  <div>
                    <SectionLabel>CONTRACT FUNCTIONS</SectionLabel>
                    {!deployedAddr ? (
                      <div style={{ color:'#4b5563', ...mono, fontSize:11, padding:20, textAlign:'center' }}>Deploy a contract first to interact with functions</div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {fns.map(fn => {
                          const isView = fn.stateMutability === 'view' || fn.stateMutability === 'pure';
                          return (
                            <div key={fn.name} style={{ background:'rgba(0,0,0,0.3)', border:`1px solid ${isView ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)'}`, borderRadius:8, padding:'10px 12px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:fn.inputs.length ? 8 : 4 }}>
                                <span style={{ color:'#fff', ...mono, fontSize:11, fontWeight:700 }}>{fn.name}()</span>
                                <Badge label={isView ? 'view' : 'transact'} color={isView ? '#22c55e' : '#eab308'} />
                              </div>
                              {fn.inputs.map((p, i) => (
                                <input key={i} value={fnArgs[`${fn.name}_${i}`] || ''} onChange={e => setFnArgs(prev => ({...prev, [`${fn.name}_${i}`]: e.target.value}))} style={{...inp, marginBottom:6}} placeholder={`${p.name || 'arg'+i} (${p.type})`} />
                              ))}
                              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                                <Btn onClick={() => callFunction(fn)} variant={isView ? 'primary' : 'gold'} size="sm">{isView ? '📖 Call' : '📝 Transact'}</Btn>
                                {fnResults[fn.name] && <span style={{ color:'#86efac', ...mono, fontSize:9, flex:1, overflow:'hidden', textOverflow:'ellipsis' }}>{fnResults[fn.name]}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TX Log Tab */}
                {activeTab === 'transactions' && (
                  <div>
                    <SectionLabel>TRANSACTION LOG</SectionLabel>
                    {txLog.length === 0 ? (
                      <div style={{ color:'#4b5563', ...mono, fontSize:11, padding:20, textAlign:'center' }}>No transactions yet</div>
                    ) : txLog.map(tx => (
                      <div key={tx.id} style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(34,197,94,0.1)', borderRadius:6, padding:'8px 12px', marginBottom:6 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                          <span style={{ color: tx.status === 'Success' ? '#22c55e' : '#ef4444', fontSize:12 }}>{tx.status === 'Success' ? '✅' : '❌'}</span>
                          <span style={{ color:'#fff', ...mono, fontSize:10, fontWeight:700 }}>{tx.fn}()</span>
                          <Badge label={tx.type} color={tx.type === 'call' ? '#10b981' : '#eab308'} />
                          <span style={{ color:'#4b5563', ...mono, fontSize:9, marginLeft:'auto' }}>{tx.time}</span>
                        </div>
                        <div style={{ color:'#6b7280', ...mono, fontSize:9, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.detail}</div>
                        {tx.detail?.startsWith('0x') && (
                          <a href={`https://sepolia.etherscan.io/tx/${tx.detail}`} target="_blank" rel="noopener noreferrer" style={{ color:'#378ADD', ...mono, fontSize:9 }}>View on Etherscan ↗</a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Contract Tree Sidebar */}
        {showTree && (
          <Card style={{ padding:12, maxHeight:500, overflowY:'auto' }}>
            <SectionLabel>CONTRACT TREE</SectionLabel>
            {contractTree.length === 0 ? (
              <div style={{ color:'#4b5563', ...mono, fontSize:10, padding:10 }}>Compile to see tree</div>
            ) : contractTree.map(ct => (
              <div key={ct.name} style={{ marginBottom:12 }}>
                <div style={{ color:'#22c55e', ...mono, fontSize:11, fontWeight:700, marginBottom:6 }}>📦 {ct.name}</div>
                {ct.structs?.length > 0 && <div style={{ marginLeft:8, marginBottom:6 }}><div style={{ color:'#eab308', ...mono, fontSize:9, marginBottom:2 }}>Structs</div>{ct.structs.map(s => <div key={s.name} style={{ color:'#86efac', ...mono, fontSize:9, marginLeft:8 }}>📐 {s.name} ({s.members?.length || 0} fields)</div>)}</div>}
                {ct.stateVars?.length > 0 && <div style={{ marginLeft:8, marginBottom:6 }}><div style={{ color:'#eab308', ...mono, fontSize:9, marginBottom:2 }}>State Variables</div>{ct.stateVars.map(v => <div key={v.name} style={{ color:'#86efac', ...mono, fontSize:9, marginLeft:8 }}>📌 {v.type} {v.name}</div>)}</div>}
                {ct.events?.length > 0 && <div style={{ marginLeft:8, marginBottom:6 }}><div style={{ color:'#eab308', ...mono, fontSize:9, marginBottom:2 }}>Events</div>{ct.events.map(ev => <div key={ev.name} style={{ color:'#86efac', ...mono, fontSize:9, marginLeft:8 }}>⚡ {ev.name}({ev.params?.map(p => p.type).join(', ')})</div>)}</div>}
                {ct.functions?.length > 0 && <div style={{ marginLeft:8 }}><div style={{ color:'#eab308', ...mono, fontSize:9, marginBottom:2 }}>Functions</div>{ct.functions.map(fn => <div key={fn.name||fn.kind} style={{ color: fn.stateMutability === 'view' || fn.stateMutability === 'pure' ? '#22c55e' : '#f59e0b', ...mono, fontSize:9, marginLeft:8 }}>🔹 {fn.name||fn.kind}({fn.params?.map(p => p.type).join(', ')}) {fn.visibility}</div>)}</div>}
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
};

export default SolidityIDE;
