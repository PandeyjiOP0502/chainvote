import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaceAuth } from '../hooks/useFaceAuth';

const FaceCamera = ({ mode = 'enroll', onSuccess, onCancel, title, subtitle }) => {
  const { videoRef, canvasRef, modelsReady, loading, error, phase, progress, faceDetected, logs, loadModels, runAuth } = useFaceAuth();

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    if (modelsReady && phase === 'idle') {
      runAuth(onSuccess, (err) => {
        setTimeout(() => onCancel?.(), 3000);
      });
    }
  }, [modelsReady]);

  const phaseColor = phase === 'success' ? '#22c55e' : phase === 'failed' || phase === 'denied' ? '#ef4444' : '#22c55e';
  const phaseLabel = {
    loading_models: 'Loading AI Models...',
    requesting: 'Requesting Camera...',
    scanning: 'Scanning Face Geometry',
    analyzing: 'Analyzing Biometrics',
    success: 'Identity Verified ✓',
    failed: 'Verification Failed',
    denied: 'Camera Access Denied',
    idle: 'Initializing...',
  }[phase] || 'Processing...';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,5,0,0.95)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, fontFamily: "'Syne', sans-serif",
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        style={{
          background: 'rgba(3,10,3,0.99)',
          border: '1px solid rgba(34,197,94,0.4)',
          borderRadius: 20,
          padding: 24,
          maxWidth: 580,
          width: '100%',
          boxShadow: '0 0 80px rgba(34,197,94,0.15), 0 0 200px rgba(34,197,94,0.05)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 3 }}>
              {title || (mode === 'enroll' ? '🧬 Register Face ID' : '🔐 Face Verification')}
            </div>
            <div style={{ color: '#6b7280', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
              {subtitle || (mode === 'enroll' ? 'Enroll your biometric voter identity' : 'Verify identity to authorize vote')}
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '6px 12px', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: "'IBM Plex Mono', monospace" }}
          >
            ✕ Cancel
          </button>
        </div>

        {/* Camera viewport */}
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#000', marginBottom: 16, aspectRatio: '4/3' }}>
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }}
          />

          {/* Phase overlays */}
          <AnimatePresence>
            {(phase === 'loading_models' || phase === 'requesting' || phase === 'idle') && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,5,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}
              >
                <div style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid #22c55e', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                  {phase === 'loading_models' ? '🧬' : '📷'}
                </div>
                <div style={{ color: '#22c55e', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{phaseLabel}</div>
              </motion.div>
            )}

            {phase === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,20,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}
              >
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  style={{ fontSize: 64, filter: 'drop-shadow(0 0 20px #22c55e)' }}
                >✓</motion.div>
                <div style={{ color: '#22c55e', fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 700 }}>IDENTITY VERIFIED</div>
              </motion.div>
            )}

            {(phase === 'failed' || phase === 'denied') && (
              <motion.div
                key="failed"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ position: 'absolute', inset: 0, background: 'rgba(20,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}
              >
                <div style={{ fontSize: 52 }}>❌</div>
                <div style={{ color: '#ef4444', fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, textAlign: 'center', padding: '0 20px' }}>{error || 'Face not recognized'}</div>
                <button onClick={() => window.location.reload()} style={{ padding: '8px 18px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e44', color: '#22c55e', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, cursor: 'pointer', marginTop: 8 }}>
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status pills */}
          {(phase === 'scanning' || phase === 'analyzing') && (
            <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', gap: 8 }}>
              <div style={{ background: 'rgba(0,0,0,0.75)', border: `1px solid ${phaseColor}44`, borderRadius: 6, padding: '3px 10px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: phaseColor }}>
                ● {phaseLabel.toUpperCase()}
              </div>
              <div style={{ background: 'rgba(0,0,0,0.75)', border: `1px solid ${faceDetected ? '#22c55e' : '#eab308'}44`, borderRadius: 6, padding: '3px 10px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: faceDetected ? '#22c55e' : '#eab308' }}>
                {faceDetected ? 'FACE: LOCKED ●' : 'FACE: SEARCHING ○'}
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#9ca3af', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>{phaseLabel}</span>
            <span style={{ color: phaseColor, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ background: '#0a140a', borderRadius: 99, height: 6, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%', background: progress >= 100 ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#22c55e,#eab308)', borderRadius: 99, boxShadow: '0 0 10px rgba(34,197,94,0.5)' }}
            />
          </div>
        </div>

        {/* Terminal log */}
        <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 10, padding: '10px 14px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, minHeight: 80, display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 14 }}>
          {logs.length === 0 && <span style={{ color: '#374151' }}>Awaiting camera stream...</span>}
          <AnimatePresence>
            {logs.map((l, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ color: l.startsWith('✓') ? '#4ade80' : l.startsWith('✕') ? '#ef4444' : '#22c55e' }}
              >
                {l}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Tips */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {['Face camera directly', 'Good lighting', 'No glasses if possible', 'Stay still'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ color: '#4b5563', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}>{t}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FaceCamera;
