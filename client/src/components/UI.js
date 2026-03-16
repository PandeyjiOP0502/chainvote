import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

export const Card = ({ children, style = {}, glow, onClick, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={onClick ? { y: -2, boxShadow: '0 8px 40px rgba(34,197,94,0.15)' } : {}}
    onClick={onClick}
    style={{
      background: 'rgba(8,18,8,0.8)',
      border: '1px solid rgba(34,197,94,0.18)',
      borderRadius: 16,
      backdropFilter: 'blur(16px)',
      padding: 24,
      boxShadow: glow ? '0 0 30px rgba(34,197,94,0.12), inset 0 1px 0 rgba(34,197,94,0.07)' : '0 4px 24px rgba(0,0,0,0.5)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color 0.2s',
      ...style,
    }}
  >
    {children}
  </motion.div>
);

export const Avatar = ({ initials, color = '#22c55e', size = 46 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: `linear-gradient(135deg,${color}28,${color}08)`,
    border: `2px solid ${color}55`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700,
    fontSize: size * 0.3, color, flexShrink: 0,
    boxShadow: `0 0 12px ${color}33`,
  }}>
    {initials}
  </div>
);

export const Badge = ({ label, color = '#22c55e' }) => (
  <span style={{
    padding: '2px 9px', borderRadius: 99, fontSize: 9, fontWeight: 700,
    fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.06em',
    textTransform: 'uppercase', background: `${color}18`, color,
    border: `1px solid ${color}44`,
  }}>
    {label}
  </span>
);

export const ProgressBar = ({ value, max, color = '#22c55e', animated = true }) => {
  const pct = max === 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <div style={{ background: '#0a140a', borderRadius: 99, overflow: 'hidden', height: 7, flex: 1 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          height: '100%',
          background: `linear-gradient(90deg,${color},${color}bb)`,
          borderRadius: 99,
          boxShadow: `0 0 8px ${color}55`,
        }}
      />
    </div>
  );
};

export const Btn = ({ children, onClick, variant = 'primary', disabled, style = {}, size = 'md' }) => {
  const variants = {
    primary: { bg: 'linear-gradient(135deg,#166534,#14532d)', border: '1px solid rgba(34,197,94,0.5)', color: '#22c55e', shadow: '0 0 20px rgba(34,197,94,0.2)' },
    secondary: { bg: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', shadow: 'none' },
    danger: { bg: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', shadow: 'none' },
    gold: { bg: 'linear-gradient(135deg,#78350f33,#451a0322)', border: '1px solid rgba(234,179,8,0.4)', color: '#eab308', shadow: '0 0 16px rgba(234,179,8,0.15)' },
  };
  const sizes = { sm: '6px 12px', md: '10px 20px', lg: '13px 28px' };
  const v = variants[variant] || variants.primary;

  return (
    <motion.button
      whileHover={!disabled ? { y: -1, opacity: 0.9 } : {}}
      whileTap={!disabled ? { y: 0, scale: 0.98 } : {}}
      onClick={!disabled ? onClick : undefined}
      style={{
        padding: sizes[size],
        borderRadius: 10, border: v.border,
        background: disabled ? 'rgba(255,255,255,0.03)' : v.bg,
        color: disabled ? '#374151' : v.color,
        fontSize: size === 'sm' ? 11 : size === 'lg' ? 14 : 12,
        fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace",
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : v.shadow,
        transition: 'all 0.2s',
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
};

export const Input = ({ label, type = 'text', value, onChange, placeholder, required }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <label style={{ color: '#9ca3af', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>{label}{required && ' *'}</label>}
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: '11px 14px',
        background: 'rgba(8,18,8,0.8)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: 10, color: '#fff',
        fontFamily: "'IBM Plex Mono',monospace", fontSize: 12,
        outline: 'none', width: '100%', boxSizing: 'border-box',
      }}
    />
  </div>
);

export const PasswordInput = ({ label, value, onChange, placeholder, required }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ color: '#9ca3af', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>{label}{required && ' *'}</label>}
      <div style={{ position: 'relative' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            padding: '11px 40px 11px 14px',
            background: 'rgba(8,18,8,0.8)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 10, color: '#fff',
            fontFamily: "'IBM Plex Mono',monospace", fontSize: 12,
            outline: 'none', width: '100%', boxSizing: 'border-box',
          }}
        />
        <button
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: 16,
            padding: 4,
            borderRadius: 6,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.color = '#86efac'}
          onMouseLeave={(e) => e.target.style.color = '#6b7280'}
        >
          {showPassword ? '👁️' : '🙈'}
        </button>
      </div>
    </div>
  );
};

export const SectionLabel = ({ children }) => (
  <div style={{ color: '#86efac', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, marginBottom: 14, letterSpacing: '0.1em' }}>
    ▸ {children}
  </div>
);

export const Toast = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <AnimatePresence>
      {toasts.map(t => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60 }}
          onClick={() => remove(t.id)}
          style={{
            background: t.type === 'success' ? 'linear-gradient(135deg,#166534,#14532d)' : t.type === 'error' ? 'linear-gradient(135deg,#7f1d1d,#450a0a)' : 'linear-gradient(135deg,#1a2e1a,#0f1f0f)',
            border: `1px solid ${t.type === 'success' ? '#22c55e' : t.type === 'error' ? '#ef4444' : '#eab308'}`,
            borderRadius: 12, padding: '12px 18px', color: '#fff', fontSize: 12,
            fontFamily: "'IBM Plex Mono',monospace", cursor: 'pointer', maxWidth: 340,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : '⚡'}</span>
          <span>{t.message}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

export const BlockMineOverlay = ({ block, onDone }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(0,8,0,0.94)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5, times: [0, 0.6, 1] }}
        style={{ fontSize: 80, marginBottom: 24, filter: 'drop-shadow(0 0 30px #22c55e)' }}
      >
        ⛓️
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div style={{ color: '#22c55e', fontFamily: "'IBM Plex Mono',monospace", fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
          Block #{block?.id} Mined!
        </div>
        <div style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, textAlign: 'center', marginBottom: 24 }}>
          Your vote is now immutable on the blockchain
        </div>
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '12px 20px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#86efac', maxWidth: 400, wordBreak: 'break-all', textAlign: 'center' }}>
          {block?.hash}
        </div>
        <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Badge label="VOTE RECORDED" color="#22c55e" />
          <Badge label="FACE VERIFIED ✓" color="#eab308" />
          <Badge label="BLOCKCHAIN SEALED" color="#10b981" />
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        <button onClick={onDone} style={{ marginTop: 32, padding: '10px 24px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, cursor: 'pointer' }}>
          Continue →
        </button>
      </motion.div>
    </motion.div>
  );
};
