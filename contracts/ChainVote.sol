// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ChainVote {
    string public title;
    string public description;
    bool public isOpen;
    uint256 public totalVotes;
    uint256 public candidateCount;

    struct Candidate {
        uint256 id;
        string name;
        string party;
        string bio;
        uint256 voteCount;
    }

    struct Voter {
        bool hasVoted;
        uint256 candidateId;
        uint256 timestamp;
    }

    struct Vote {
        address voter;
        uint256 candidateId;
        uint256 electionId;
        uint256 timestamp;
    }

    mapping(uint256 => Candidate) public candidates;
    mapping(address => Voter) public voters;
    Vote[] public votes;

    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 indexed electionId, uint256 timestamp);
    event CandidateAdded(uint256 id, string name, string party);
    event ElectionOpened(string title);
    event ElectionClosed();

    constructor(string memory _title, string memory _description) {
        title = _title;
        description = _description;
    }

    function addCandidate(string memory _name, string memory _party, string memory _bio) external {
        require(!isOpen, "Cannot add candidates while election is open");
        candidates[candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            party: _party,
            bio: _bio,
            voteCount: 0
        });
        emit CandidateAdded(candidateCount, _name, _party);
        candidateCount++;
    }

    function openElection() external {
        require(candidateCount >= 2, "Need at least 2 candidates");
        isOpen = true;
        emit ElectionOpened(title);
    }

    function closeElection() external {
        isOpen = false;
        emit ElectionClosed();
    }

    function castVote(uint256 _candidateId, uint256 _electionId) external {
        require(isOpen, "Election is not open");
        require(!voters[msg.sender].hasVoted, "Already voted");
        require(_candidateId < candidateCount, "Invalid candidate");

        voters[msg.sender] = Voter({
            hasVoted: true,
            candidateId: _candidateId,
            timestamp: block.timestamp
        });

        candidates[_candidateId].voteCount++;
        totalVotes++;

        votes.push(Vote({
            voter: msg.sender,
            candidateId: _candidateId,
            electionId: _electionId,
            timestamp: block.timestamp
        }));

        emit VoteCast(msg.sender, _candidateId, _electionId, block.timestamp);
    }

    function getResults() external view returns (Candidate[] memory) {
        Candidate[] memory results = new Candidate[](candidateCount);
        for (uint256 i = 0; i < candidateCount; i++) {
            results[i] = candidates[i];
        }
        return results;
    }

    function getVoteCount() external view returns (uint256) {
        return totalVotes;
    }

    function hasVoted(address _voter) external view returns (bool) {
        return voters[_voter].hasVoted;
    }

    function getVoterInfo(address _voter) external view returns (bool, uint256, uint256) {
        Voter memory v = voters[_voter];
        return (v.hasVoted, v.candidateId, v.timestamp);
    }

    function getAllVotes() external view returns (Vote[] memory) {
        return votes;
    }
}