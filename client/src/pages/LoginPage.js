import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Btn, Input, PasswordInput } from '../components/UI';

export default function LoginPage({ onToast }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return onToast('Email and password required', 'error');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        onToast('Welcome back!', 'success');
      } else {
        if (!name) return onToast('Name required', 'error');
        await register(name, email, password);
        onToast('Account created! Please register your Face ID in Security tab.', 'success');
      }
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#040a04', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', overflow: 'hidden', fontFamily: "'Syne',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #040a04; }
        input::placeholder { color: #374151; }
        @keyframes float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
      `}</style>

      {/* BG grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(34,197,94,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.025) 1px,transparent 1px)', backgroundSize: '36px 36px' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 0%,rgba(5,46,22,0.5),transparent)' }} />

      {/* Floating chain icons */}
      {['⛓', '🔐', '🧬', '📊'].map((icon, i) => (
        <div key={i} style={{ position: 'fixed', fontSize: 40, opacity: 0.04, animation: `float ${4 + i}s ease-in-out ${i * 0.8}s infinite`, top: `${15 + i * 20}%`, left: i % 2 === 0 ? `${5 + i * 5}%` : undefined, right: i % 2 !== 0 ? `${5 + i * 5}%` : undefined }}>
          {icon}
        </div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <motion.div
            animate={{ boxShadow: ['0 0 20px #22c55e44', '0 0 40px #22c55e88', '0 0 20px #22c55e44'] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}
          >⛓</motion.div>
          <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Chain<span style={{ color: '#22c55e' }}>Vote</span>
          </h1>
          <p style={{ color: '#4b5563', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, marginTop: 6 }}>
            Blockchain Voting · Face Authentication · Real-time Results
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(6,14,6,0.95)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: 32, boxShadow: '0 0 80px rgba(34,197,94,0.08)', backdropFilter: 'blur(16px)' }}>
          {/* Toggle */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace", cursor: 'pointer', background: mode === m ? 'linear-gradient(135deg,#166534,#14532d)' : 'transparent', border: mode === m ? '1px solid rgba(34,197,94,0.4)' : '1px solid transparent', color: mode === m ? '#22c55e' : '#6b7280', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                {m === 'login' ? '🔐 Login' : '📝 Register'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div key="name" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <Input label="Full Name" value={name} onChange={setName} placeholder="John Doe" required />
                </motion.div>
              )}
            </AnimatePresence>
            <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
            <PasswordInput label="Password" value={password} onChange={setPassword} placeholder="••••••••" required />
          </div>

          <Btn onClick={handleSubmit} disabled={loading} style={{ width: '100%', marginTop: 20, padding: '13px 0', fontSize: 13 }}>
            {loading ? '⏳ Processing...' : mode === 'login' ? '🔐 Sign In' : '🚀 Create Account'}
          </Btn>

          {/* Demo credentials */}
          <div style={{ marginTop: 20, padding: 14, background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 10 }}>
            <div style={{ color: '#eab308', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 700, marginBottom: 8 }}>DEMO CREDENTIALS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[['Admin', 'admin@chainvote.io', 'admin123'], ['Voter', 'voter@chainvote.io', 'voter123']].map(([role, e, p]) => (
                <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => { setEmail(e); setPassword(p); setMode('login'); }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#eab308', flexShrink: 0 }} />
                  <span style={{ color: '#9ca3af', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>
                    <strong style={{ color: '#fbbf24' }}>{role}:</strong> {e} / {p}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#374151', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, marginTop: 20 }}>
          Secured by SHA-256 Blockchain · Face-API.js Biometrics · JWT Authentication
        </p>
      </motion.div>
    </div>
  );
}
