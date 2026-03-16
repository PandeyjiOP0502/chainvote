require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { initDb, queries, get } = require('../db');
const { recordVoteOnChain } = require('../blockchain');

(async () => {
  console.log('🔧 Initializing ChainVote database...\n');
  await initDb();

  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminEmail = 'admin@chainvote.io';
  const existingAdmin = queries.getUserByEmail.get(adminEmail);
  if (!existingAdmin) {
    const adminId = uuidv4();
    const hash    = bcrypt.hashSync('admin123', 12);
    queries.createUser.run(adminId, 'System Admin', adminEmail, hash, 'admin', 'CV-ADMIN001');
    console.log('✅ Admin created: admin@chainvote.io / admin123');
  } else {
    console.log('ℹ️  Admin already exists');
  }

  // ── Demo voter ──────────────────────────────────────────────────────────────
  const voterEmail = 'voter@chainvote.io';
  const existingVoter = queries.getUserByEmail.get(voterEmail);
  let voterId;
  if (!existingVoter) {
    voterId = uuidv4();
    const hash = bcrypt.hashSync('voter123', 12);
    queries.createUser.run(voterId, 'Demo Voter', voterEmail, hash, 'voter', 'CV-DEMO001');
    console.log('✅ Voter  created: voter@chainvote.io / voter123');
  } else {
    voterId = existingVoter.id;
    console.log('ℹ️  Demo voter already exists');
  }

  const adminId = queries.getUserByEmail.get(adminEmail).id;
  const COLORS  = ['#22c55e','#eab308','#10b981','#f59e0b'];

  const electionsData = [
    {
      title: 'National Presidential Election 2025',
      description: 'Vote for the next President of the Federal Republic.',
      status: 'active',
      startDate: new Date(Date.now() - 86400000).toISOString(),
      endDate:   new Date(Date.now() + 172800000).toISOString(),
      candidates: [
        { name: 'Alexandra Reid',  party: 'Progressive Alliance',  bio: 'Former Secretary of State, 20 years public service' },
        { name: 'Marcus Chen',     party: 'National Unity Party',   bio: 'Tech entrepreneur turned senator' },
        { name: 'Priya Sharma',    party: 'Democratic Front',       bio: 'Constitutional lawyer & human rights advocate' },
        { name: 'James Okafor',    party: "People's Coalition",     bio: 'Community organizer from the Midwest' },
      ],
    },
    {
      title: 'City Council Representative',
      description: 'Elect your district council representative for 2025-2027.',
      status: 'active',
      startDate: new Date(Date.now() - 43200000).toISOString(),
      endDate:   new Date(Date.now() + 86400000).toISOString(),
      candidates: [
        { name: 'Sarah Mitchell', party: 'Green Future',    bio: 'Environmental scientist & city planner' },
        { name: 'David Park',     party: 'Community First', bio: 'Local business owner, school board member' },
        { name: 'Elena Torres',   party: 'Reform Now',      bio: 'Journalist turned activist' },
      ],
    },
    {
      title: 'University Student Union President',
      description: 'Annual student leadership election for 2025 academic year.',
      status: 'closed',
      startDate: new Date(Date.now() - 604800000).toISOString(),
      endDate:   new Date(Date.now() - 86400000).toISOString(),
      candidates: [
        { name: 'Oliver Knight', party: 'Student Voice', bio: 'Computer Science senior' },
        { name: 'Aisha Patel',   party: 'Campus Unity',  bio: 'Pre-law junior' },
      ],
    },
  ];

  for (const e of electionsData) {
    // Skip if title already seeded
    const existing = get(`SELECT id FROM elections WHERE title = ?`, [e.title]);
    if (existing) { console.log(`ℹ️  Election already exists: ${e.title}`); continue; }

    const eId = uuidv4();
    queries.createElection.run(eId, e.title, e.description, e.status, e.startDate, e.endDate, adminId);

    e.candidates.forEach((c, i) => {
      const cId      = uuidv4();
      const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const votes    = e.status === 'closed'
        ? Math.floor(Math.random() * 400 + 100)
        : Math.floor(Math.random() * 80  + 10);
      // Insert with seed vote counts directly
      const { run } = require('../db');
      run(`INSERT INTO candidates (id, election_id, name, party, bio, manifesto, color, avatar_initials, vote_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [cId, eId, c.name, c.party, c.bio || '', '', COLORS[i % COLORS.length], initials, votes]);
    });

    // Mine an initial block for flavour
    try { recordVoteOnChain({ voter_id: 'seed-' + eId, candidate_id: eId, election_id: eId }); } catch(_) {}

    console.log(`✅ Election seeded: ${e.title}`);
  }

  console.log('\n🎉 Database ready!\n');
  console.log('  Admin:  admin@chainvote.io / admin123');
  console.log('  Voter:  voter@chainvote.io / voter123\n');
  process.exit(0);
})();
