<![CDATA[# ⛓ ChainVote — Blockchain Voting with Face Recognition

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/PandeyjiOP0502/chainvote/actions)

> A full-stack, production-ready voting platform that combines **real-time face recognition**, **blockchain-backed vote integrity**, and **biometric authentication** — ensuring every vote is secure, verifiable, and tamper-proof.

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
- **MetaMask Integration** — Real Ethereum transactions via Remix VM
- **JWT Authentication** — Secure token-based sessions with 10-min face-tokens for voting
- **Role-based Access** — Separate Admin and Voter permission levels

### 🗳️ Voting System
- **Real-time Voting** — WebSocket-powered live vote updates
- **Election Management** — Admin-controlled election lifecycle (create, deploy, end)
- **Vote Verification** — Blockchain-based vote integrity verification
- **Anonymous Voting** — Privacy-preserving vote casting on-chain

### 📊 Analytics & Results
- **Interactive Charts** — Pie charts for vote distribution, bar charts for comparisons
- **Live Standings** — Real-time candidate rankings with percentage breakdowns
- **Multi-Election Support** — Tab-based navigation across multiple concurrent elections

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

---

## 🛠️ Tech Stack

| Layer      | Technologies                                |
|------------|---------------------------------------------|
| **Frontend** | React 18, face-api.js, Socket.io, Web3.js |
| **Backend**  | Node.js, Express, SQLite, WebSocket       |
| **Security** | bcrypt, JWT, CORS, Helmet                 |
| **Real-time**| Socket.io (live vote events)              |
| **Blockchain** | Simulated PoW / Ethereum Remix VM       |

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
                                │
                                ▼
                    ┌─────────────────────────┐
                    │  Remix VM / MetaMask    │
                    │  (Ethereum Contract)    │
                    └─────────────────────────┘
```

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm 8+

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
]]>
