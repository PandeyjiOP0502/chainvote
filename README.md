# ⛓ ChainVote — Blockchain Voting with Face Recognition

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/yourusername/chainvote/actions)

Full-stack production-ready voting platform with real face recognition, blockchain security, and biometric authentication.

## 🚀 Quick Start (3 commands)

```bash
npm run install:all    # Install all dependencies
npm run setup          # Init database + seed data  
npm run dev            # Start server + client
```

Open http://localhost:3000

## 🔑 Demo Credentials
- **Admin**: admin@chainvote.io / admin123
- **Voter**: voter@chainvote.io / voter123

## 🧬 Face Recognition Flow
1. face-api.js loads 4 neural net models from CDN
2. Camera opens, TinyFaceDetector scans in real time
3. 68 landmark points mapped with canvas overlay
4. 128-dimensional descriptor computed
5. Sent to server, stored as float array (not image)
6. On verify: Euclidean distance < 0.6 = match
7. 10-minute face-token JWT issued for voting

## ⛓ Blockchain
- SHA-256 hashing with proof-of-work (difficulty 2)
- Merkle root per block
- Prev_hash chain for integrity
- Verify: GET /api/blockchain/verify

## 📡 WebSocket Events
Real-time vote_cast, election_created, election_status events.

## 🌐 Production Deploy
```bash
npm run build
NODE_ENV=production JWT_SECRET=your_secret npm start
```
See full docs in the README for Railway/Render deployment.

## 📋 Features

### 🔐 Security & Authentication
- **Face Recognition**: Real-time biometric authentication using face-api.js
- **Blockchain Security**: SHA-256 hashing with proof-of-work consensus
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin and voter permissions

### 🗳️ Voting System
- **Real-time Voting**: WebSocket-powered live vote updates
- **Election Management**: Admin-controlled election lifecycle
- **Vote Verification**: Blockchain-based vote integrity verification
- **Anonymous Voting**: Privacy-preserving vote casting

### 🛠️ Technical Stack
- **Backend**: Node.js, Express, SQLite, WebSocket
- **Frontend**: React, face-api.js, Socket.io
- **Security**: bcrypt, JWT, CORS, Helmet
- **Real-time**: Socket.io for live updates

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
```

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm 8+

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chainvote.git
   cd chainvote
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Setup database**
   ```bash
   npm run setup
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Visit http://localhost:3000

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛡️ Security

Please report security vulnerabilities through our [Security Policy](SECURITY.md).

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by democratic principles and blockchain innovation
- Special thanks to the open-source community

## 📞 Contact

For support and questions:
- 📧 Email: your-email@example.com
- 💬 Discord: [ChainVote Community](https://discord.gg/your-invite)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/chainvote/issues)

---

**Made with 🤖 by the ChainVote Team**
