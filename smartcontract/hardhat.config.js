require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
const dotenv = require("dotenv");

dotenv.config();

const ETHERSCAN_API_KEY = "1C2M7JIV5MQCG1P2V14KGMCVVXATFNXFPE"
const INFURA_API_KEY = "48a2d93d350d402986077a1bc364df64";
const PRIVATE_KEY = "545c1f1bd02ed28f1534c145374b38dac415a03360d374d43ba77b836314cb0d";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.7",
  networks: {
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY]
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY]
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};
