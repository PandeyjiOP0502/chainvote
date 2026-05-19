# ⛓ ChainVote — Blockchain Voting with Face Recognition

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636.svg)](https://soliditylang.org/)
[![Web3.js](https://img.shields.io/badge/Web3.js-4.16-F16822.svg)](https://web3js.readthedocs.io/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/PandeyjiOP0502/chainvote/actions)

> A full-stack, production-ready voting platform that combines **real-time face recognition**, **blockchain-backed vote integrity**, **biometric authentication**, a **Sepolia testnet faucet**, and an **in-browser Solidity IDE** — ensuring every vote is secure, verifiable, and tamper-proof.

---

## 📸 Screenshots

### 🔐 Login & Registration
Secure authentication portal with demo credentials for quick testing.

![Login Page](Chainvote%20images/Screenshot%202026-04-03%20143531.png)

---

### 📊 Dashboard
Real-time overview of active elections, total votes, blockchain blocks mined, face auth status, and voter count — all at a glance.

![Dashboard](Chainvote%20images/Screenshot%202026-04-03%20143545.png)

---

### 🗳️ Vote
Cast your biometrically-secured vote on the blockchain. Each candidate card shows live vote counts, party affiliation, and a **Verify Face** button for biometric authentication before voting.

![Vote Page](Chainvote%20images/Screenshot%202026-04-03%20143552.png)

---

### 📈 Election Results
Live election results with interactive pie charts for vote distribution, candidate standings with percentage breakdowns, and vote comparison bar charts.

![Results Page](Chainvote%20images/Screenshot%202026-04-03%20143607.png)

---

### 🛡️ Security & Face Authentication
Biometric identity management with a step-by-step visual guide showing how face authentication works — from camera capture to on-chain record.

![Security Page](Chainvote%20images/Screenshot%202026-04-03%20143622.png)

---

### ⚙️ Admin Panel
Full election administration: create & deploy new elections, manage voters, view blockchain status, and monitor system-wide stats.

![Admin Panel](Chainvote%20images/Screenshot%202026-04-03%20143636.png)

---

## 🚀 Quick Start

```bash
npm run install:all    # Install all dependencies
npm run setup          # Init database + seed data
npm run dev            # Start server + client
```

Open **http://localhost:3000**

### 🔑 Demo Credentials
| Role  | Email               | Password  |
|-------|---------------------|-----------|
| Admin | admin@chainvote.io  | admin123  |
| Voter | voter@chainvote.io  | voter123  |

---

## 📋 Features

### 🔐 Security & Authentication
- **Face Recognition** — Real-time biometric auth using face-api.js with 128-dimensional face descriptors
- **Blockchain Security** — SHA-256 hashing with proof-of-work consensus or Ethereum smart contracts
- **MetaMask Integration** — Real Ethereum transactions via Remix VM or Sepolia Testnet
- **JWT Authentication** — Secure token-based sessions with 10-min face-tokens for voting
- **Role-based Access** — Separate Admin and Voter permission levels

### 🗳️ Voting System
- **Real-time Voting** — WebSocket-powered live vote updates
- **Election Management** — Admin-controlled election lifecycle (create, deploy, end)
- **Vote Verification** — Blockchain-based vote integrity verification
- **Anonymous Voting** — Privacy-preserving vote casting on-chain
- **Vote Receipts** — Downloadable cryptographic vote receipts with unique UUIDs

### 📊 Analytics & Results
- **Interactive Charts** — Pie charts for vote distribution, bar charts for comparisons (Recharts)
- **Live Standings** — Real-time candidate rankings with percentage breakdowns
- **Multi-Election Support** — Tab-based navigation across multiple concurrent elections

### 🔧 Developer Tools
- **Solidity IDE** — In-browser smart contract editor with syntax highlighting, compilation, deployment, and function interaction
- **Blockchain Explorer** — Live chain visualization with query console and Solidity code viewer
- **Sepolia Faucet** — MetaMask wallet connection, balance checker, TX verifier, and links to free faucet providers
- **Contract Tree View** — Visual AST exploration of compiled contracts (structs, events, functions, state variables)

---

## 🧬 Face Recognition Flow

```
1. face-api.js loads 4 neural net models from CDN
2. Camera opens → TinyFaceDetector scans in real time
3. 68 landmark points mapped with canvas overlay
4. 128-dimensional face descriptor computed
5. Descriptor sent to server, stored as float array (not image)
6. On verify: Euclidean distance < 0.6 = match
7. 10-minute face-token JWT issued for voting
```

---

## ⛓ Blockchain Modes

### Simulated Mode (Default)
- SHA-256 hashing with proof-of-work (difficulty 2)
- Merkle root per block
- Previous-hash chain for integrity
- Verify: `GET /api/blockchain/verify`

### Remix VM Mode (MetaMask)
1. Deploy `contracts/ChainVote.sol` on [Remix IDE](https://remix.ethereum.org) (Solidity 0.8.20+)
2. Set `USE_REMIX_VM=true` and `CONTRACT_ADDRESS=<address>` in `server/.env`
3. Connect MetaMask to Localhost 8545 and import Remix VM Account 0

### Sepolia Testnet Mode
1. Set `SEPOLIA_RPC_URL` in `server/.env` (default: `https://ethereum-sepolia-rpc.publicnode.com`)
2. Use the built-in **Faucet** page to get free Sepolia ETH
3. Deploy contracts via the **Solidity IDE** directly to Sepolia
4. Verify transactions on [Sepolia Etherscan](https://sepolia.etherscan.io)

---

## 🛠️ Tech Stack

| Layer            | Technologies                                                              |
|------------------|---------------------------------------------------------------------------|
| **Frontend**     | React 18, Framer Motion, Recharts, face-api.js, Web3.js 4.16             |
| **Backend**      | Node.js, Express 4.18, sql.js (SQLite), WebSocket (ws)                   |
| **Security**     | bcryptjs, JWT (jsonwebtoken), CORS, Helmet, express-rate-limit            |
| **Blockchain**   | Solidity 0.8.20 (solc), Web3.js, Simulated PoW / Remix VM / Sepolia      |
| **Real-time**    | WebSocket (ws) — live vote events & blockchain updates                    |
| **AI / ML**      | face-api.js, TensorFlow.js — face detection, landmark mapping, descriptor matching |
| **Dev Tools**    | Concurrently, Nodemon, react-scripts                                     |

### Frontend Dependencies
| Package            | Version  | Purpose                                    |
|--------------------|----------|--------------------------------------------|
| `react`            | ^18.2.0  | UI framework                               |
| `react-dom`        | ^18.2.0  | DOM rendering                              |
| `face-api.js`      | ^0.22.2  | Face detection & recognition               |
| `@tensorflow/tfjs` | ^4.17.0  | Neural network inference engine            |
| `web3`             | ^4.16.0  | Ethereum blockchain interaction            |
| `recharts`         | ^2.12.2  | Interactive charts & graphs                |
| `framer-motion`    | ^11.0.20 | Animations & transitions                   |
| `react-icons`      | ^5.6.0   | Icon library                               |

### Backend Dependencies
| Package              | Version  | Purpose                                  |
|----------------------|----------|------------------------------------------|
| `express`            | ^4.18.3  | HTTP server framework                    |
| `sql.js`             | ^1.12.0  | In-memory SQLite database                |
| `web3`               | ^4.16.0  | Ethereum RPC client                      |
| `solc`               | ^0.8.34  | Solidity compiler                        |
| `jsonwebtoken`       | ^9.0.2   | JWT authentication                       |
| `bcryptjs`           | ^2.4.3   | Password hashing                         |
| `helmet`             | ^7.1.0   | HTTP security headers                    |
| `cors`               | ^2.8.5   | Cross-origin resource sharing            |
| `express-rate-limit` | ^7.2.0   | API rate limiting                        |
| `ws`                 | ^8.16.0  | WebSocket server                         |
| `uuid`               | ^9.0.1   | Unique ID generation                     |
| `dotenv`             | ^16.4.5  | Environment variable management          |

### Smart Contract
| File               | Language   | Compiler  | Features                                              |
|--------------------|------------|-----------|-------------------------------------------------------|
| `ChainVote.sol`    | Solidity   | ^0.8.20   | Election management, vote casting, candidate CRUD, voter verification, results aggregation |

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Face Camera   │    │   React Frontend│    │   WebSocket     │
│   Recognition   │───▶│   (Client)      │───▶│   (Real-time)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Express API   │    │   Blockchain    │    │   SQLite DB     │
│   (Server)      │───▶│   (Security)    │───▶│   (Storage)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐  ┌─────────────────────────┐
│  Sepolia Faucet │  │  Remix VM / MetaMask    │
│  + Solidity IDE │  │  (Ethereum Contract)    │
└─────────────────┘  └─────────────────────────┘
```

### 📂 Project Structure

```
chainvote/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── FaceCamera.js    # Face detection & recognition UI
│   │   │   ├── DateTimePicker.js # Election date picker
│   │   │   └── UI.js            # Shared UI components (Card, Badge, Btn, etc.)
│   │   ├── pages/
│   │   │   ├── Pages.js         # Main app pages (Dashboard, Admin, Results, etc.)
│   │   │   ├── LoginPage.js     # Authentication page
│   │   │   ├── VotePage.js      # Voting interface
│   │   │   ├── SecurityPage.js  # Face auth management
│   │   │   ├── FaucetPage.js    # Sepolia testnet faucet
│   │   │   ├── SolidityIDE.js   # In-browser Solidity editor & deployer
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useAuth.js       # Authentication hook
│   │   │   ├── useFaceAuth.js   # Face recognition hook
│   │   │   └── useChainVoteContract.js  # Smart contract interaction hook
│   │   └── utils/
│   │       ├── api.js           # API client
│   │       ├── web3.js          # Web3 & MetaMask utilities
│   │       └── solidity-compiler.js  # Browser-based Solidity compiler
│   └── package.json
├── server/                      # Express backend
│   ├── routes/
│   │   ├── auth.js              # Authentication endpoints
│   │   ├── elections.js         # Election CRUD
│   │   ├── votes.js             # Vote casting & retrieval
│   │   ├── admin.js             # Admin operations
│   │   ├── blockchain.js        # Blockchain API (verify, status, explorer)
│   │   └── faucet.js            # Sepolia faucet & TX verification
│   ├── middleware/              # Auth & validation middleware
│   ├── scripts/                 # Database init scripts
│   ├── blockchain.js            # Blockchain engine (PoW + Web3 + Contract)
│   ├── db.js                    # SQLite database layer
│   ├── index.js                 # Server entry point
│   └── package.json
├── contracts/
│   └── ChainVote.sol            # Solidity smart contract
├── Receipts/                    # Cryptographic vote receipts
├── Chainvote images/            # Project screenshots
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE                      # MIT License
└── package.json                 # Root workspace config
```

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm 8+
- MetaMask browser extension (optional, for blockchain features)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/PandeyjiOP0502/chainvote.git
cd chainvote

# 2. Install dependencies
npm run install:all

# 3. Setup database
npm run setup

# 4. Start development servers
npm run dev

# 5. Open http://localhost:3000
```

### 🌐 Production Deploy

```bash
npm run build
NODE_ENV=production JWT_SECRET=your_secret npm start
```

### ⚙️ Environment Variables

Create `server/.env` based on `server/.env.example`:

```env
PORT=5000
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Remix VM (local blockchain)
USE_REMIX_VM=true
REMIX_VM_URL=http://localhost:8545
CONTRACT_ADDRESS=

# Sepolia Testnet
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
BLOCKCHAIN_MODE=simulated
```

---

## 📜 Changelog

All notable changes to this project are documented below, ordered from newest to oldest.

### 🚀 v1.5 — Sepolia Faucet & Solidity IDE (2026-04-30)

**New Features:**
- ✅ **Sepolia Faucet Page** — Connect MetaMask to Sepolia testnet, check ETH balance, and access 5 free faucet providers (Google Cloud, Alchemy, Infura, sepoliafaucet.com, PoW Faucet)
- ✅ **Transaction Verifier** — Verify any Sepolia transaction hash on-chain with detailed status, gas usage, and Etherscan links
- ✅ **Solidity IDE** — Full in-browser smart contract editor with:
  - Syntax-highlighted code editor with line numbers
  - Real-time Solidity compilation (solc 0.8.34)
  - Contract deployment to Sepolia via MetaMask
  - Interactive function calling (view & transact)
  - Transaction log with Etherscan links
  - Contract AST tree viewer (structs, events, functions, state variables)
- ✅ **Solidity Compiler Utility** — Browser-based `solc` wrapper for compiling and extracting contract ABIs
- ✅ **Web3 Utilities** — `switchToSepolia()`, `connectMetaMask()`, and `initWeb3()` helper functions
- ✅ **Faucet API Routes** — `/api/faucet/providers`, `/api/faucet/balance/:address`, `/api/faucet/network`, `/api/faucet/verify-tx/:txHash`

**Files Added:**
- `client/src/pages/FaucetPage.js`
- `client/src/pages/SolidityIDE.js`
- `client/src/utils/solidity-compiler.js`
- `client/src/utils/web3.js`
- `server/routes/faucet.js`

---

### 🔧 v1.4 — Blockchain Explorer, Vote Receipts & Smart Contract Integration (2026-04-18)

**New Features:**
- ✅ **Blockchain Explorer** — Live chain visualization with block details, hash inspection, and chain integrity status
- ✅ **Query Console** — Run smart contract queries directly from the admin dashboard
- ✅ **Solidity Code Viewer** — View the ChainVote.sol contract source with deploy and config tabs
- ✅ **Vote Receipts** — Cryptographic vote receipt files generated per vote with unique UUIDs
- ✅ **Ethereum Smart Contract** — Full `ChainVote.sol` contract (Solidity 0.8.20) with election management, vote casting, candidate CRUD, and result aggregation
- ✅ **Web3 Contract Hook** — `useChainVoteContract.js` for frontend contract interaction
- ✅ **Shared UI Components** — Reusable `Card`, `Badge`, `Btn`, `SectionLabel` components in `UI.js`
- ✅ **Web3 Integration** — Full `web3.js` utility with MetaMask connection, Sepolia network switching, and contract initialization

**Fixes:**
- 🐛 Fixed README rendering issue (removed CDATA wrapper that broke GitHub rendering)
- 🐛 Removed tracked `client/build/` from git (already in `.gitignore`)
- 🐛 Updated `.gitignore` to exclude `.claude/` and `nul`

**Files Added:**
- `contracts/ChainVote.sol`
- `client/src/components/UI.js`
- `client/src/hooks/useChainVoteContract.js`
- `client/src/utils/web3.js`
- `Receipts/` — 9 sample vote receipt files

---

### 📸 v1.3 — Project Screenshots & README Update (2026-04-18)

**Changes:**
- ✅ Added 6 high-resolution project screenshots (Login, Dashboard, Vote, Results, Security, Admin)
- ✅ Updated README with embedded screenshots and comprehensive project summary
- ✅ Added `Chainvote images/` directory for visual documentation

---

### 🧭 v1.2 — Blockchain Explorer (2026-03-20)

**New Features:**
- ✅ **BlockchainExplorer Component** — Live chain visualization with block details and hash inspection
- ✅ **Query Console** — Run smart contract queries from the admin interface
- ✅ **Solidity Code Viewer** — Tabbed viewer for contract source, deployment config, and settings
- ✅ Dashboard's "Blocks Mined" card is now clickable and navigates to the blockchain explorer view
- ✅ Added "Blockchain" tab in Admin page for blockchain exploration

---

### 📦 v1.1 — Production Build (2026-03-16)

**Changes:**
- ✅ Added production build for GitHub Pages deployment
- ✅ Generated optimized static assets in `client/build/`

---

### 🎉 v1.0 — Initial Release (2026-03-16)

**Core Platform:**
- ✅ Full-stack voting platform with React 18 frontend and Express backend
- ✅ Real-time face recognition using face-api.js with TinyFaceDetector
- ✅ Simulated blockchain with SHA-256 PoW mining (difficulty 2)
- ✅ JWT authentication with role-based access (Admin / Voter)
- ✅ WebSocket-powered live vote updates
- ✅ Election lifecycle management (create, deploy, end)
- ✅ Interactive results with Recharts (pie charts, bar charts)
- ✅ SQLite database via sql.js
- ✅ Security hardening with Helmet, CORS, and rate limiting

**Project Infrastructure:**
- ✅ MIT License
- ✅ CONTRIBUTING.md with community guidelines
- ✅ CODE_OF_CONDUCT.md (Contributor Covenant)
- ✅ SECURITY.md with vulnerability reporting process
- ✅ Professional `.gitignore` for Node.js projects

---

## 🔌 API Endpoints

| Method | Endpoint                         | Description                      |
|--------|----------------------------------|----------------------------------|
| POST   | `/api/auth/register`             | Register a new user              |
| POST   | `/api/auth/login`                | Login with credentials           |
| GET    | `/api/elections`                 | List all elections               |
| POST   | `/api/elections`                 | Create a new election (admin)    |
| POST   | `/api/votes`                     | Cast a vote                      |
| GET    | `/api/votes/election/:id`        | Get votes for an election        |
| GET    | `/api/blockchain/verify`         | Verify blockchain integrity      |
| GET    | `/api/blockchain/status`         | Get blockchain mode & stats      |
| GET    | `/api/faucet/providers`          | List Sepolia faucet providers    |
| GET    | `/api/faucet/balance/:address`   | Get Sepolia ETH balance          |
| GET    | `/api/faucet/network`            | Get Sepolia network info         |
| GET    | `/api/faucet/verify-tx/:txHash`  | Verify a Sepolia transaction     |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🛡️ Security

Please report security vulnerabilities through our [Security Policy](SECURITY.md).

---

<p align="center">
  <b>Made with ❤️ by <a href="https://github.com/PandeyjiOP0502">PandeyjiOP0502</a></b>
</p>
