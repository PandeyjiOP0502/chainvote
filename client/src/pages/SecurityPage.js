import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import FaceCamera from '../components/FaceCamera';
import { Card, Badge, Btn, SectionLabel } from '../components/UI';

export default function SecurityPage({ token, onToast }) {
  const { user, faceToken, setFaceToken, refreshUser } = useAuth();
  const [showEnroll, setShowEnroll] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const handleEnrollSuccess = async (descriptor) => {
    try {
      await api.enrollFace(descriptor, token);
      await refreshUser();
      setShowEnroll(false);
      onToast('🧬 Face ID enrolled successfully!', 'success');
    } catch (err) {
      onToast(err.message, 'error');
      setShowEnroll(false);
    }
  };

  const handleVerifySuccess = async (descriptor) => {
    try {
      const result = await api.verifyFace(descriptor, token);
      setFaceToken(result.faceToken);
      setVerifyResult({ confidence: result.confidence, distance: result.distance });
      setShowVerify(false);
      onToast(`✓ Face verified! ${result.confidence}% confidence`, 'success');
    } catch (err) {
      setShowVerify(false);
      onToast(err.message || 'Face verification failed', 'error');
    }
  };

  return (
    <div>
      <AnimatePresence>
        {showEnroll && <FaceCamera mode="enroll" title="🧬 Register Face ID" subtitle="Enroll your biometric voter identity on the blockchain" onSuccess={handleEnrollSuccess} onCancel={() => setShowEnroll(false)} />}
        {showVerify && <FaceCamera mode="verify" title="🔐 Face Verification" subtitle="Verify your identity to get a 10-minute voting token" onSuccess={handleVerifySuccess} onCancel={() => setShowVerify(false)} />}
      </AnimatePresence>

      <SectionLabel>BIOMETRIC IDENTITY</SectionLabel>
      <Card glow style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {/* Face preview / placeholder */}
          <div style={{ width: 90, height: 68, borderRadius: 12, background: user.faceRegistered ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)', border: user.faceRegistered ? '2px solid rgba(34,197,94,0.4)' : '2px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
            <span style={{ fontSize: 28 }}>👤</span>
            {user.faceRegistered && (
              <div style={{ position: 'absolute', bottom: -5, right: -5, width: 20, height: 20, borderRadius: '50%', background: '#22c55e', border: '2px solid #040a04', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>✓</div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <Badge label={user.faceRegistered ? 'FACE ID ACTIVE' : 'NOT ENROLLED'} color={user.faceRegistered ? '#22c55e' : '#ef4444'} />
              {faceToken && <Badge label="AUTH TOKEN ACTIVE" color="#eab308" />}
              <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>Face Authentication</span>
            </div>
            <div style={{ color: '#6b7280', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, marginBottom: 14, lineHeight: 1.6 }}>
              {user.faceRegistered
                ? `Biometric enrolled · Voter ID: ${user.voterId} · ${user.faceRegisteredAt ? 'Registered: ' + new Date(user.faceRegisteredAt).toLocaleDateString() : ''}`
                : 'Register your face to unlock voting. Uses face-api.js with 128-dimensional descriptor matching.'}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {!user.faceRegistered ? (
                <Btn onClick={() => setShowEnroll(true)} size="md">🧬 Register Face ID</Btn>
              ) : (
                <>
                  <Btn onClick={() => setShowVerify(true)} size="md">
                    🔐 {faceToken ? 'Re-Verify (Active)' : 'Get Vote Token'}
                  </Btn>
                  <Btn onClick={() => setShowEnroll(true)} variant="secondary" size="md">↻ Update Face</Btn>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Verification result */}
        <AnimatePresence>
          {verifyResult && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10 }}
            >
              <div style={{ color: '#22c55e', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>LAST VERIFICATION RESULT</div>
              <div style={{ display: 'flex', gap: 20, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#9ca3af' }}>
                <span>Confidence: <strong style={{ color: '#22c55e' }}>{verifyResult.confidence}%</strong></span>
                <span>Distance: <strong style={{ color: '#86efac' }}>{verifyResult.distance}</strong></span>
                <span>Token: <strong style={{ color: '#eab308' }}>Valid 10 min</strong></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <SectionLabel>HOW BIOMETRIC AUTH WORKS</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { n: '01', icon: '📷', t: 'Camera Capture', d: 'Browser MediaDevices API opens camera. All processing happens locally — nothing is sent to external servers.' },
          { n: '02', icon: '🧬', t: 'face-api.js Detection', d: 'TinyFaceDetector finds your face, FaceLandmark68Net maps 68 key points on your face geometry.' },
          { n: '03', icon: '📐', t: '128-D Descriptor', d: 'FaceRecognitionNet computes a 128-dimensional float vector uniquely representing your face biometrics.' },
          { n: '04', icon: '🔐', t: 'Euclidean Matching', d: 'On verify, distance between stored and live descriptor is computed. Distance < 0.6 = verified match.' },
          { n: '05', icon: '🪙', t: 'Signed Token', d: 'Successful verification issues a JWT face-token (10min TTL) required to sign your blockchain vote.' },
          { n: '06', icon: '⛓', t: 'On-Chain Record', d: 'Vote + face-token are sent to the server. Vote is mined into a SHA-256 block with Merkle root.' },
        ].map((s, i) => (
          <Card key={s.n} delay={i * 0.05} style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</span>
              <div>
                <div style={{ color: '#22c55e', fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, marginBottom: 2 }}>STEP {s.n}</div>
                <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{s.t}</div>
                <div style={{ color: '#6b7280', fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1.6 }}>{s.d}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SectionLabel>SECURITY STATUS</SectionLabel>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          {[
            { l: 'face-api.js Recognition', s: 'Active', c: '#22c55e', i: '🧬' },
            { l: 'Liveness Detection', s: 'Active', c: '#22c55e', i: '👁' },
            { l: 'JWT Auth Tokens', s: 'Active', c: '#22c55e', i: '🔑' },
            { l: 'Double-Vote Prevention', s: 'Active', c: '#22c55e', i: '⛔' },
            { l: 'SHA-256 Blockchain', s: 'Active', c: '#22c55e', i: '⛓' },
            { l: 'WebSocket Live Feed', s: 'Active', c: '#22c55e', i: '📡' },
            { l: 'Face Token TTL', s: '10 min', c: '#eab308', i: '⏱' },
            { l: 'Local Face Processing', s: 'Always', c: '#eab308', i: '💾' },
          ].map(f => (
            <div key={f.l} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{f.i}</span>
              <div style={{ flex: 1 }}><div style={{ color: '#d1d5db', fontSize: 11, fontWeight: 600 }}>{f.l}</div></div>
              <Badge label={f.s} color={f.c} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
