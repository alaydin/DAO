import './App.css';
import { Routes, Route, } from "react-router-dom";
import Proposal from './pages/Proposal';
import Home from './pages/Home';
import { Button } from '@web3uikit/core';
import { useState } from 'react';
import connectionDetails from "./connectionDetails.json"
//require("dotenv").config();
function App() {

  const [wallet, setWallet] = useState(window.ethereum.selectedAddress);

  async function connectToMetamask() {
    if (window.ethereum) {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      setWallet(window.ethereum.selectedAddress);
    }
  }
  window.ethereum.on('accountsChanged', (accounts) => {
    // Handle the new accounts, or lack thereof.
    // "accounts" will always be an array, but it can be empty.
    setWallet(window.ethereum.selectedAddress);
  });
  window.ethereum.on('chainChanged', (chainId) => {
    // Handle the new chain.
    // Correctly handling chain changes can be complicated.
    // We recommend reloading the page unless you have good reason not to.
    window.location.reload();
  });
  window.ethereum.on('disconnect', () => { setWallet(""); console.log(wallet) });

  return (
    <>
      <div color='white'>*This is a sample project for DAO members to create proposals and vote on them</div>
      <div>*A sample collection on Goerli network is used. <a href={connectionDetails.nft_collection_url}>You can get one on OpenSea</a> and continue further testing</div>
      <div>*Getting "Eligible Voters" may take some time since I use free plan on Moralis. If it is stuck at 0, wait a few seconds then try refreshing</div>
      <div className='header'>
        <Button id='connectButton' text={(wallet == undefined || wallet === "") ? "Connect Wallet" : `${wallet.slice(0, 5)}...${wallet.slice(-4)}`} theme="colored" color="blue" onClick={connectToMetamask}></Button>
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/proposal" element={<Proposal />} />
      </Routes>
    </>
  );
}

export default App;
