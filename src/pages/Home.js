import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import "../App";
import "./pages.css";
import { TabList, Tab, Widget, Tag, Table, Form, Button } from "@web3uikit/core";
import Moralis from "moralis";
import connectionDetails from "../connectionDetails.json";
import contractABI from "../contractABI.json";

// Configuring the connection to an Ethereum node
var Web3 = require('web3');
const web3 = new Web3(
    new Web3.providers.HttpProvider(
        `https://${connectionDetails.ETHEREUM_NETWORK}.infura.io/v3/${connectionDetails.API_KEY}`
    )
);
//Initializing contract object
var daoContract = new web3.eth.Contract(contractABI, connectionDetails.contract_address);

function Home() {

    const [proposals, setProposals] = useState();
    const [proposalCount, setProposalCount] = useState(0);
    const [endedProposalCount, setEndedProposalCount] = useState(0);
    const [passRate, setPassRate] = useState(0);
    const [voters, setVoters] = useState([]);
    const [submit, setSubmit] = useState(false);

    useEffect(() => {
        async function getEvents() {
            var tempArray = await daoContract.getPastEvents('proposalCreated', {
                fromBlock: 0,
                toBlock: 'latest'
            }, function (err, events) {
                if (!err) {
                    console.log(events);
                } else {
                    console.log(err);
                }
            });
            if (tempArray.length > 0) {
                tempArray.reverse();
                const table = await Promise.all(
                    tempArray.map(async (e) => [
                        e.returnValues.id,
                        e.returnValues.description,
                        <Link to="/proposal" state={{
                            description: e.returnValues.description,
                            color: (await getEventStatus(e.returnValues.id)).color,
                            text: (await getEventStatus(e.returnValues.id)).text,
                            id: e.returnValues.id,
                            proposer: e.returnValues.proposer,
                        }}>
                            <Tag
                                color={(await getEventStatus(e.returnValues.id)).color}
                                text={(await getEventStatus(e.returnValues.id)).text}
                            />
                        </Link>,
                    ])
                );
                setProposals(table);
                setProposalCount(tempArray.length);
            }
        };

        async function getPassRate() {
            var tempArray = await daoContract.getPastEvents('proposalEnded', {
                fromBlock: 0,
                toBlock: 'latest'
            }, function (err, events) {
                if (!err) {
                    console.log(events);
                } else {
                    console.log(err);
                }
            });
            if (tempArray.length > 0) {
                var passCount = 0;
                for (let i = 0; i < tempArray.length; i++) {
                    if (tempArray[i].returnValues.passed) {
                        passCount++;
                    }
                }
                setPassRate(passCount/tempArray.length * 100);
                setEndedProposalCount(tempArray.length);
            }
        }

        async function getTokenOwners() {
            await Moralis.start({
                apiKey: connectionDetails.MORALIS_API_KEY,
                // ...and any other configuration
            });
            let cursor = null;
            var addresses = [];
            do {
                var response = await Moralis.EvmApi.nft.getNFTOwners({
                    address: connectionDetails.nft_contract_address,
                    chain: connectionDetails.CHAIN_ID,
                    limit: 50,
                    cursor: cursor
                });
                response.result.forEach((e) => {
                    if (!addresses.includes(e.ownerOf._value))
                        addresses.push(e.ownerOf._value);
                })
                cursor = response.data.cursor;
            } while (cursor !== "" && cursor != null);
            setVoters(addresses);
        }

        getEvents();
        getPassRate();
        getTokenOwners();
    }, []) //Fill the array with something you want to check


    async function getEventStatus(_id) {
        const result = await daoContract.getPastEvents('proposalEnded', {
            filter: { id: _id },
            fromBlock: 0,
            toBlock: 'latest'
        }, function (err, events) {
            if (!err) {
                console.log(events);
            } else {
                console.log(err);
            }
        });
        if (result.length > 0) {
            if (result[0].returnValues.passed) {
                return { color: "green", text: "Passed" };
            } else {
                return { color: "red", text: "Rejected" };
            }
        } else {
            return { color: "blue", text: "Ongoing" };
        }
    }
    async function submitProposal(desc) {
        const abi = await daoContract.methods.createProposal(desc, voters).encodeABI();
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
            <div className='content'>
                <TabList defaultActiveKey={1} tabStyle="bulbUnion">
                    <Tab tabKey={1} tabName="DAO">
                        {proposals && (
                            <div className='tabContent'>
                                Governance Overview
                                <div className='widgets'>
                                    <Widget info={proposalCount} title="Proposals Created" style={{ width: "200%" }}>
                                        <div className='extraWidgetInfo'>
                                            <div className='extraTitle'>Pass Rate: {passRate}%</div>
                                            <div className='progress'>
                                                <div className='progressPercentage' style={{ width: `${passRate}%` }} />
                                            </div>
                                        </div>
                                    </Widget>
                                    <Widget info={voters.length} title="Eligible Voters" />
                                    <Widget info={proposalCount - endedProposalCount} title="Ongoing Proposals" />
                                </div>
                                <h3>Recent Proposals</h3>
                            
                                <div style={{ marginTop: "30px" }}>
                                    <Table columnsConfig='10% 70% 20%'
                                        data={proposals}
                                        header={[
                                            <span>ID</span>,
                                            <span>Description</span>,
                                            <span>Status</span>
                                        ]}
                                        pageSize={10}
                                    >
                                    </Table>
                                </div>
                                <Form
                                    buttonConfig={
                                        {
                                            isLoading: submit,
                                            loadingText: "Submitting Proposal",
                                            text: "Submit",
                                            theme: "primary"
                                        }
                                    }
                                    title='New Proposal Form'
                                    id='proposalForm'
                                    data={[
                                        {
                                            inputWidth: '100%',
                                            name: 'Proposal Question',
                                            type: 'textarea',
                                            validation: {
                                                required: true
                                            },
                                            value: ""
                                        }
                                    ]}
                                    onSubmit={(e) => {
                                        setSubmit(true);
                                        submitProposal(e.data[0].inputResult);
                                    }}>
                                </Form>
                            </div>
                        )}
                    </Tab>
                    <Tab tabKey={2} tabName="Announcements"></Tab>
                    <Tab tabKey={3} tabName="Docs"></Tab>
                </TabList>
            </div>
        </>
    )
}

export default Home