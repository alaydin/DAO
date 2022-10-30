// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

interface iDao {
        function balanceOf(address, uint256) external view returns(uint256);
    }

contract Dao {

    address public owner;
    uint256 nextProposal;
    uint256 defaultDeadlineTimer;
    uint256[] public validTokens;
    iDao dao;

    constructor(){
        owner = msg.sender;
        nextProposal = 1;
        defaultDeadlineTimer = 2 days;
        dao = iDao(0xf4910C763eD4e47A585E2D34baA9A4b611aE448C);
        validTokens = [58767543177933050062044303181924150634240364133595845861543008462508511985665];
    }

    struct proposal {
        uint256 id;
        bool exists;
        string description;
        uint deadline;
        uint256 votesUp;
        uint256 votesDown;
        address[] canVote;
        uint256 maxVotes;
        mapping (address => bool) alreadyVoted;
        bool countConducted;
        bool passed;
    }

    mapping (uint256 => proposal) public Proposals;

    event proposalCreated(
        uint256 indexed id,
        string description,
        uint256 maxVotes,
        address proposer
    );

    event newVote(
        uint256 indexed proposal,
        uint256 votesUp,
        uint256 votesDown,
        address indexed voter,
        bool indexed votedFor
    );

    event proposalEnded(
        uint256 indexed id,
        bool indexed passed
    );

    function updateDeadline(uint256 id, uint time) public {
        require(msg.sender == owner, "Only the owner of contract can update deadlines.");
        Proposals[id].deadline += time;
    }

    modifier isValidOwner(address _addr) {
        for(uint i = 0; i < validTokens.length; i++){
            if(dao.balanceOf(_addr, validTokens[i]) >= 1) {
                _;
            }
        }
    }

    function checkProposalEligibility(address _proposalist) private view returns(bool) {
        for(uint i = 0; i < validTokens.length; i++) {
            if(dao.balanceOf(_proposalist, validTokens[i]) >= 1) {
                return true;
            }
        }
        return false;
    }

    function checkVoteEligibility(uint256 _id, address _voter) private view returns(bool) {
        for(uint i = 0; i < Proposals[_id].canVote.length; i++) {
            if(_voter == Proposals[_id].canVote[i]){
                return true;
            }
        }
        return false;
    }

    function createProposal (string memory _description, address[] memory _canVote) public {
        require(checkProposalEligibility(msg.sender), "You are eligible to create proposal!");
        
        proposal storage newProposal = Proposals[nextProposal];
        newProposal.id = nextProposal;
        newProposal.exists = true;
        newProposal.description = _description;
        newProposal.deadline = block.timestamp + defaultDeadlineTimer;
        newProposal.canVote = _canVote;
        newProposal.maxVotes = _canVote.length;

        emit proposalCreated(nextProposal, _description, _canVote.length, msg.sender);
        nextProposal++;
    }

    function voteOnProposal(uint256 _id, bool _vote) public {
        require(Proposals[_id].exists, "This proposal does not exist.");
        require(checkVoteEligibility(_id, msg.sender), "You are not eligible to vote!");
        require(!Proposals[_id].alreadyVoted[msg.sender], "You have already voted!");
        require(Proposals[_id].deadline >= block.timestamp, "The deadline for this proposal is passed." );

        if(_vote){
            Proposals[_id].votesUp++;
        }else{
            Proposals[_id].votesDown++;
        }

        Proposals[_id].alreadyVoted[msg.sender] = true;

        emit newVote(_id, Proposals[_id].votesUp, Proposals[_id].votesDown, msg.sender, _vote);
        
    }

    function countVotes(uint256 _id) public {
        require(msg.sender == owner, "You are not the owner.");
        require(Proposals[_id].exists, "This proposal does not exist.");
        require(block.timestamp > Proposals[_id].deadline);
        require(!Proposals[_id].countConducted, "Proposal count has been already conducted");

        proposal storage p = Proposals[_id];

        if(p.votesUp > p.votesDown) {
            p.passed = true;
        }

        p.countConducted = true;

        emit proposalEnded(_id, p.passed);
    }

    function addValidTokens(uint256[] memory tokenList) public {
        require(msg.sender == owner, "You are not the owner.");

        for( uint i = 0; i < tokenList.length; i++) {
            validTokens.push(tokenList[i]);
        }
    }

}
