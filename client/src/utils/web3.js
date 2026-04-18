import Web3 from 'web3';

const REMIX_VM_URL = 'http://localhost:8545';
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '0xYourContractAddressHere';

let web3Instance = null;
let contractInstance = null;

const CHAINVOTE_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "voter", "type": "address" },
      { "indexed": true, "name": "candidateId", "type": "uint256" },
      { "indexed": true, "name": "electionId", "type": "uint256" },
      { "name": "timestamp", "type": "uint256" }
    ],
    "name": "VoteCast",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "name": "id", "type": "uint256" },
      { "name": "name", "type": "string" },
      { "name": "party", "type": "string" }
    ],
    "name": "CandidateAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "name": "title", "type": "string" }
    ],
    "name": "ElectionOpened",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "ElectionClosed",
    "type": "event"
  },
  {
    "inputs": [
      { "name": "_name", "type": "string" },
      { "name": "_party", "type": "string" },
      { "name": "_bio", "type": "string" }
    ],
    "name": "addCandidate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_candidateId", "type": "uint256" },
      { "name": "_electionId", "type": "uint256" }
    ],
    "name": "castVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "closeElection",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "openElection",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "title",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "description",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isOpen",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalVotes",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "candidateCount",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "", "type": "uint256" }],
    "name": "candidates",
    "outputs": [
      { "name": "id", "type": "uint256" },
      { "name": "name", "type": "string" },
      { "name": "party", "type": "string" },
      { "name": "bio", "type": "string" },
      { "name": "voteCount", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "", "type": "address" }],
    "name": "voters",
    "outputs": [
      { "name": "hasVoted", "type": "bool" },
      { "name": "candidateId", "type": "uint256" },
      { "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "", "type": "uint256" }],
    "name": "votes",
    "outputs": [
      { "name": "voter", "type": "address" },
      { "name": "candidateId", "type": "uint256" },
      { "name": "electionId", "type": "uint256" },
      { "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getResults",
    "outputs": [
      {
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "name", "type": "string" },
          { "name": "party", "type": "string" },
          { "name": "bio", "type": "string" },
          { "name": "voteCount", "type": "uint256" }
        ],
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getVoteCount",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_voter", "type": "address" }],
    "name": "hasVoted",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_voter", "type": "address" }],
    "name": "getVoterInfo",
    "outputs": [
      { "name": "", "type": "bool" },
      { "name": "", "type": "uint256" },
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllVotes",
    "outputs": [
      {
        "components": [
          { "name": "voter", "type": "address" },
          { "name": "candidateId", "type": "uint256" },
          { "name": "electionId", "type": "uint256" },
          { "name": "timestamp", "type": "uint256" }
        ],
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export const initWeb3 = async (provider = null) => {
  if (web3Instance) return web3Instance;

  if (provider) {
    web3Instance = new Web3(provider);
  } else if (window.ethereum) {
    web3Instance = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      console.error('User denied account access');
    }
  } else {
    web3Instance = new Web3(new Web3.providers.HttpProvider(REMIX_VM_URL));
  }

  return web3Instance;
};

export const getWeb3 = () => web3Instance;

export const initContract = (address = CONTRACT_ADDRESS) => {
  if (!web3Instance) {
    throw new Error('Web3 not initialized. Call initWeb3 first.');
  }
  if (contractInstance) return contractInstance;
  
  contractInstance = new web3Instance.eth.Contract(CHAINVOTE_ABI, address);
  return contractInstance;
};

export const getContract = () => contractInstance;

export const getContractAddress = () => CONTRACT_ADDRESS;

export const connectMetaMask = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }
  
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0];
};

export const switchToRemixVM = async () => {
  if (!window.ethereum) return;
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x539' }]
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x539',
          chainName: 'Remix VM',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['http://localhost:8545']
        }]
      });
    }
  }
};

export { CONTRACT_ADDRESS, CHAINVOTE_ABI };