import { useState, useEffect, useCallback } from 'react';
import { initWeb3, initContract, getContract, connectMetaMask, CONTRACT_ADDRESS, CHAINVOTE_ABI } from '../utils/web3';

export const useWeb3 = () => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const w3 = await initWeb3();
      setWeb3(w3);

      if (window.ethereum) {
        const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccounts(accs);

        const chain = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(chain);

        setIsConnected(accs.length > 0);
      } else {
        setAccounts(['0x0000000000000000000000000000000000000000']);
        setIsConnected(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (newAccounts) => {
        setAccounts(newAccounts);
        setIsConnected(newAccounts.length > 0);
      });
      window.ethereum.on('chainChanged', (newChain) => {
        setChainId(newChain);
        window.location.reload();
      });
    }
  }, []);

  return { web3, accounts, chainId, isConnected, loading, error, connect };
};

export const useChainVoteContract = (contractAddress = CONTRACT_ADDRESS) => {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [electionData, setElectionData] = useState({
    title: '',
    description: '',
    isOpen: false,
    totalVotes: 0,
    candidateCount: 0,
  });

  const init = useCallback(async () => {
    setLoading(true);
    try {
      const w3 = await initWeb3();
      const c = new w3.eth.Contract(CHAINVOTE_ABI, contractAddress);
      setContract(c);
      return c;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [contractAddress]);

  useEffect(() => {
    init();
  }, [init]);

  const castVote = useCallback(async (candidateId, electionId, fromAddress) => {
    if (!contract) {
      const c = await init();
      if (!c) throw new Error('Contract not initialized');
    }

    setLoading(true);
    try {
      const gas = await contract.methods.castVote(candidateId, electionId).estimateGas({ from: fromAddress });
      const receipt = await contract.methods.castVote(candidateId, electionId).send({
        from: fromAddress,
        gas: gas,
      });
      return receipt;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract, init]);

  const getResults = useCallback(async () => {
    if (!contract) await init();
    try {
      const results = await contract.methods.getResults().call();
      return results;
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, [contract, init]);

  const getVoteCount = useCallback(async () => {
    if (!contract) await init();
    try {
      const count = await contract.methods.getVoteCount().call();
      return parseInt(count);
    } catch (err) {
      setError(err.message);
      return 0;
    }
  }, [contract, init]);

  const hasVoted = useCallback(async (voterAddress) => {
    if (!contract) await init();
    try {
      const voted = await contract.methods.hasVoted(voterAddress).call();
      return voted;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [contract, init]);

  const getVoterInfo = useCallback(async (voterAddress) => {
    if (!contract) await init();
    try {
      const info = await contract.methods.getVoterInfo(voterAddress).call();
      return { hasVoted: info[0], candidateId: parseInt(info[1]), timestamp: info[2] };
    } catch (err) {
      setError(err.message);
      return { hasVoted: false, candidateId: 0, timestamp: 0 };
    }
  }, [contract, init]);

  const getElectionInfo = useCallback(async () => {
    if (!contract) await init();
    try {
      const [title, description, isOpen, totalVotes, candidateCount] = await Promise.all([
        contract.methods.title().call(),
        contract.methods.description().call(),
        contract.methods.isOpen().call(),
        contract.methods.totalVotes().call(),
        contract.methods.candidateCount().call(),
      ]);
      const data = {
        title,
        description,
        isOpen,
        totalVotes: parseInt(totalVotes),
        candidateCount: parseInt(candidateCount),
      };
      setElectionData(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [contract, init]);

  return {
    contract,
    loading,
    error,
    electionData,
    init,
    castVote,
    getResults,
    getVoteCount,
    hasVoted,
    getVoterInfo,
    getElectionInfo,
  };
};