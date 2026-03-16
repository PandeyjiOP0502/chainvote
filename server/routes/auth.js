const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { queries } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const SECRET = () => process.env.JWT_SECRET || 'chainvote_secret';

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET(),
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password min 6 characters' });

    if (queries.getUserByEmail.get(email))
      return res.status(409).json({ error: 'Email already registered' });

    const id   = uuidv4();
    const vId  = 'CV-' + Math.random().toString(36).toUpperCase().slice(2, 10);
    const hash = await bcrypt.hash(password, 12);
    queries.createUser.run(id, name, email, hash, 'voter', vId);
    queries.addAudit.run(id, 'REGISTER', `New voter: ${email}`, req.ip);

    const user  = queries.getUserById.get(id);
    res.status(201).json({ token: signToken(user), user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = queries.getUserByEmail.get(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Invalid credentials' });

    queries.updateLastLogin.run(user.id);
    queries.addAudit.run(user.id, 'LOGIN', `Login`, req.ip);
    res.json({ token: signToken(user), user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => res.json(safeUser(req.user)));

// POST /api/auth/face/enroll
router.post('/face/enroll', authenticate, (req, res) => {
  const { descriptor } = req.body;
  if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128)
    return res.status(400).json({ error: 'Valid 128-element descriptor array required' });
  queries.updateFaceDescriptor.run(JSON.stringify(descriptor), req.user.id);
  queries.addAudit.run(req.user.id, 'FACE_ENROLL', 'Face enrolled', req.ip);
  res.json({ success: true, message: 'Face ID enrolled' });
});

// POST /api/auth/face/verify
router.post('/face/verify', authenticate, (req, res) => {
  const { descriptor } = req.body;
  if (!descriptor || !Array.isArray(descriptor))
    return res.status(400).json({ error: 'Descriptor required' });

  const user = queries.getUserById.get(req.user.id);
  if (!user.face_descriptor)
    return res.status(400).json({ error: 'No face enrolled — register in Security tab first' });

  const stored   = JSON.parse(user.face_descriptor);
  const dist     = Math.sqrt(stored.reduce((s, v, i) => s + Math.pow(v - descriptor[i], 2), 0));
  const THRESH   = 0.6;
  const confidence = Math.max(0, Math.round((1 - dist / THRESH) * 100));
  const verified   = dist < THRESH;

  queries.addAudit.run(req.user.id, verified ? 'FACE_VERIFY_OK' : 'FACE_VERIFY_FAIL',
    `dist=${dist.toFixed(4)} conf=${confidence}%`, req.ip);

  if (verified) {
    const faceToken = jwt.sign({ id: req.user.id, faceVerified: true }, SECRET(), { expiresIn: '10m' });
    return res.json({ verified: true, confidence, distance: dist.toFixed(4), faceToken });
  }
  res.status(401).json({ verified: false, confidence, distance: dist.toFixed(4), error: 'Face not recognized. Try again.' });
});

function safeUser(u) {
  return {
    id: u.id, name: u.name, email: u.email, role: u.role,
    voterId: u.voter_id, isVerified: !!u.is_verified,
    faceRegistered: !!u.face_descriptor,
    faceRegisteredAt: u.face_registered_at,
  };
}

module.exports = router;
