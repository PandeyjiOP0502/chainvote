/**
 * db.js — Pure-JS SQLite via sql.js (no native compilation needed)
 * Persists to disk as chainvote.db using fs read/write.
 * API is intentionally synchronous to match better-sqlite3 interface.
 */
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'chainvote.db');
const dataDir  = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ── Module-level db handle (set once after async init) ────────────────────────
let _db = null;

// Save db to disk after every write
function save() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Run a statement that does NOT return rows (INSERT / UPDATE / DELETE / CREATE)
function run(sql, params = []) {
  _db.run(sql, params);
  save();
  // Return last insert rowid-style object
  return { lastInsertRowid: _db.exec('SELECT last_insert_rowid() as r')[0]?.values[0][0] };
}

// Return all rows from a SELECT
function all(sql, params = []) {
  const stmt = _db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Return first row or null
function get(sql, params = []) {
  const rows = all(sql, params);
  return rows.length ? rows[0] : null;
}

// ── Prepared-statement factory (mimics better-sqlite3 .prepare()) ─────────────
function prepare(sql) {
  return {
    run:  (...args) => run(sql,  args.flat()),
    all:  (...args) => all(sql,  args.flat()),
    get:  (...args) => get(sql,  args.flat()),
    bind: (...args) => args, // no-op shim
  };
}

// ── Schema ────────────────────────────────────────────────────────────────────
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'voter',
    face_descriptor TEXT,
    face_registered_at TEXT,
    voter_id TEXT UNIQUE,
    is_verified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT
  );
  CREATE TABLE IF NOT EXISTS elections (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_by TEXT,
    total_voters INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    election_id TEXT NOT NULL,
    name TEXT NOT NULL,
    party TEXT,
    bio TEXT,
    manifesto TEXT,
    color TEXT DEFAULT '#22c55e',
    avatar_initials TEXT,
    vote_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS votes (
    id TEXT PRIMARY KEY,
    election_id TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    voter_id TEXT NOT NULL,
    tx_hash TEXT UNIQUE NOT NULL,
    block_id INTEGER,
    block_hash TEXT,
    face_verified INTEGER DEFAULT 0,
    face_confidence REAL,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(election_id, voter_id)
  );
  CREATE TABLE IF NOT EXISTS blockchain (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT UNIQUE NOT NULL,
    prev_hash TEXT NOT NULL,
    merkle_root TEXT,
    vote_count INTEGER DEFAULT 0,
    nonce INTEGER DEFAULT 0,
    mined_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`;

// ── Async initializer — call once at startup ──────────────────────────────────
async function initDb() {
  const SQL = await initSqlJs();
  // Load existing DB from disk, or create fresh
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }
  _db.run('PRAGMA foreign_keys = ON;');
  // Run schema (all CREATE TABLE IF NOT EXISTS — safe to re-run)
  _db.run(SCHEMA);
  save();
  console.log('✅ Database ready');
}

// ── Query helpers (mirror the better-sqlite3 queries object) ─────────────────
const queries = {
  // Users
  createUser:           prepare(`INSERT INTO users (id, name, email, password_hash, role, voter_id) VALUES (?, ?, ?, ?, ?, ?)`),
  getUserByEmail:       prepare(`SELECT * FROM users WHERE email = ?`),
  getUserById:          prepare(`SELECT * FROM users WHERE id = ?`),
  updateFaceDescriptor: prepare(`UPDATE users SET face_descriptor = ?, face_registered_at = datetime('now'), is_verified = 1 WHERE id = ?`),
  updateLastLogin:      prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`),
  getAllVoters:          prepare(`SELECT id, name, email, voter_id, is_verified, face_registered_at, created_at, last_login FROM users WHERE role = 'voter'`),

  // Elections
  createElection:       prepare(`INSERT INTO elections (id, title, description, status, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`),
  getAllElections:       prepare(`SELECT * FROM elections ORDER BY created_at DESC`),
  getElectionById:      prepare(`SELECT * FROM elections WHERE id = ?`),
  updateElectionStatus: prepare(`UPDATE elections SET status = ? WHERE id = ?`),

  // Candidates
  createCandidate:          prepare(`INSERT INTO candidates (id, election_id, name, party, bio, manifesto, color, avatar_initials) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`),
  getCandidatesByElection:  prepare(`SELECT * FROM candidates WHERE election_id = ? ORDER BY vote_count DESC`),
  incrementVote:            prepare(`UPDATE candidates SET vote_count = vote_count + 1 WHERE id = ?`),

  // Votes
  castVote:       prepare(`INSERT INTO votes (id, election_id, candidate_id, voter_id, tx_hash, block_id, block_hash, face_verified, face_confidence, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
  getVotesByVoter: prepare(`
    SELECT v.*, e.title as election_title, c.name as candidate_name, c.party as candidate_party, c.color as candidate_color
    FROM votes v
    JOIN elections e ON v.election_id = e.id
    JOIN candidates c ON v.candidate_id = c.id
    WHERE v.voter_id = ?
    ORDER BY v.created_at DESC
  `),
  hasVoted:           prepare(`SELECT id FROM votes WHERE election_id = ? AND voter_id = ?`),
  getVotesByElection: prepare(`SELECT COUNT(*) as count FROM votes WHERE election_id = ?`),

  // Blockchain
  createBlock:  prepare(`INSERT INTO blockchain (hash, prev_hash, merkle_root, vote_count, nonce) VALUES (?, ?, ?, ?, ?)`),
  getLastBlock: prepare(`SELECT * FROM blockchain ORDER BY id DESC LIMIT 1`),
  getAllBlocks:  prepare(`SELECT * FROM blockchain ORDER BY id DESC LIMIT 20`),
  getBlockById: prepare(`SELECT * FROM blockchain WHERE id = ?`),

  // Audit
  addAudit: prepare(`INSERT INTO audit_log (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)`),

  // Delete operations
  deleteElection: prepare(`DELETE FROM elections WHERE id = ?`),
  deleteCandidatesByElection: prepare(`DELETE FROM candidates WHERE election_id = ?`),
  deleteVotesByElection: prepare(`DELETE FROM votes WHERE election_id = ?`),

  // Admin stats (raw)
  countTable: (table, where = '') => get(`SELECT COUNT(*) as n FROM ${table} ${where}`),
  recentAudit: () => all(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10`),
};

module.exports = { initDb, queries, run, all, get };
