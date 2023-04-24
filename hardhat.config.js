require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require('hardhat-contract-sizer');
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 17
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: `${process.env.ETHERSCAN_API_KEY}`
  }
};
