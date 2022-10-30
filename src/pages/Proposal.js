import React, { useEffect, useLayoutEffect, useState } from 'react';
import "./pages.css";
import { Link, useLocation } from 'react-router-dom';
import connectionDetails from "../connectionDetails.json";
import contractABI from "../contractABI.json";
import { Tag, Tooltip, Widget, Form, Table, Avatar } from '@web3uikit/core';
import { ChevronLeft, Checkmark, Cross } from "@web3uikit/icons"

function Proposal() {
  const { state: proposalDetails } = useLocation();
  const [latestVote, setLatestVote] = useState();
  const [votesUp, setVotesUp] = useState(0);
  const [votesDown, setVotesDown] = useState(0);
  const [percUp, setPercUp] = useState(0);
  const [percDown, setPercDown] = useState(0);
  const [votes, setVotes] = useState([]);
  const [submit, setSubmit] = useState(false);

  // Configuring the connection to an Ethereum node
  var Web3 = require('web3');
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      `https://${connectionDetails.ETHEREUM_NETWORK}.infura.io/v3/${connectionDetails.API_KEY}`
    )
  );
  //Initializing contract object
  var daoContract = new web3.eth.Contract(contractABI, connectionDetails.contract_address);

  useEffect(() => {
    async function getVotes() {
      const tempArr = await daoContract.getPastEvents("newVote", {
        filter: { proposal: proposalDetails.id },
        fromBlock: 0,
        toBlock: 'latest'
      }, function (error, events) {
        if (!error) {
          console.log(events);
        } else {
          console.log(error);
        }
      });
      if (tempArr.length > 0) {
        tempArr.reverse();
        setLatestVote(tempArr[0]);
        setVotesUp(Number(tempArr[0].returnValues.votesUp));
        setVotesDown(Number(tempArr[0].returnValues.votesDown));
        setPercUp(Number(votesUp / tempArr.length * 100));
        setPercDown(votesDown / tempArr.length * 100);
        //set and render votes
        const votesResults = tempArr.map((e) => [
          e.returnValues.voter,
          <>{e.returnValues.votedFor ? <Checkmark color='green' /> : <Cross color='red' />}</>
        ])
        setVotes(votesResults);
      }
    }
    getVotes();
  }, [votesUp, votesDown ,percUp, percDown]);

  async function castVote(_vote) {
    const abi = await daoContract.methods.voteOnProposal(proposalDetails.id, _vote).encodeABI();
    var params = [
      {
        from: window.ethereum.selectedAddress,
        to: connectionDetails.contract_address,
        data: abi,
      },
    ];
    const tx = await window.ethereum
      .request({
        method: 'eth_sendTransaction',
        params,
      })
      .then((result) => {
        // The result varies by RPC method.
        // For example, this method will return a transaction hash hexadecimal string on success.
        setSubmit(false);
        alert("Transaction sent successfully!");
      })
      .catch((error) => {
        // If the request fails, the Promise will reject with an error.
        setSubmit(false);
        alert("Transaction cannot be sent!");
      });
  }


  
  return (
    <>
      <div className="contentProposal">
        <div className="proposal">
          <Link to="/">
            <div className='backHome'>
              <ChevronLeft size={20} svg="chevronLeft"></ChevronLeft>
              Overview
            </div>
          </Link>
          <div>{proposalDetails.description}</div>
          <div className='proposalOverview'>
            <Tag color={proposalDetails.color} text={proposalDetails.text}></Tag>
            <div className='proposer'>
              <span>Proposed By</span>
              <Tooltip content={proposalDetails.proposer}>
                <Avatar isRounded size={40} theme="image" />
              </Tooltip>
            </div>
          </div>
        </div>
        {latestVote && (
          <div className='widgets'>
            <Widget info={votesUp} title="Votes For">
              <div className='extraWidgetInfo'>
                <div className='extraTitle'>{percUp}%</div>
                <div className='progress'>
                  <div className="progressPercentage" style={{ width: `${percUp}%` }}></div>
                </div>
              </div>
            </Widget>
            <Widget info={votesDown} title="Votes Against">
              <div className='extraWidgetInfo'>
                <div className='extraTitle'>{percDown}%</div>
                <div className='progress'>
                  <div className='progressPercentage' style={{ width: `${percDown}%` }}></div>
                </div>
              </div>
            </Widget>
          </div>
        )}
        <div className='votesDiv'>
          <Table
            style={{ width: "60%" }}
            columnsConfig="90% 10%"
            data={votes}
            header={[
              <span>Address</span>,
              <span>Vote</span>
            ]}
            pageSize={5}>
          </Table>
          <Form
            isDisabled={proposalDetails.text !== "Ongoing"}
            style={{
              width: "35%",
              height: "250px",
              border: "1px solid rgba(6, 158, 252, 0.2)"
            }}
            buttonConfig={{
              isLoading: submit,
              loadingText: "Casting Vote",
              text: "Vote",
              theme: "secondary"
            }}
            data={[
              {
                inputWidth: "100%",
                name: "Cast Vote",
                options: ["For", "Against"],
                type: "radios",
                validation: {
                  required: true
                }
              }
            ]}
            onSubmit={(e) => {
              if(e.data[0].inputResult[0] === "For") {
                castVote(true);
              } else {
                castVote(false);
              }
              setSubmit(true);
            }}
            title="Cast Vote">
          </Form>
        </div>
      </div>
    </>
  );
}

export default Proposal