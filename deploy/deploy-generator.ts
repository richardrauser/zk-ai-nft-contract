// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
// const { utils } = require("ethers");
// const hre = require("hardhat");

import { utils, Wallet } from "zksync-web3";
import * as ethers from "ethers";
import * as zksync from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running deploy script for zkSync AI NFT Generator`);

  // Initialize the wallet.
  const wallet = new Wallet(process.env.DEPLOYER_PRIVATE_KEY);

  console.log("Loaded wallet: " + wallet.address);
  // const balance = await wallet.getEthereumBalance("ETH");
  // console.log("Wallet balance: " + ethers.utils.formatEther(balance)); 


  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, wallet);
  // Load contract
  const artifact = await deployer.loadArtifact("AINFTGenerator");

  const deploymentFee = await deployer.estimateDeployFee(artifact, []);
  console.log(`Estimated deployment fee: ${ethers.utils.formatEther(deploymentFee)} ETH`);

  // Deploy this contract. The returned object will be of a `Contract` type, 
  const generatorContract = await deployer.deploy(artifact, []);

  // Show the contract info.
  console.log(`${artifact.contractName} was deployed to ${generatorContract.address}`);
}

// async function main() {
//   console.log("Deploying..");

//   let provider = ethers.provider;
//   const accounts = await provider.listAccounts();
//   console.log("Accounts: ");
//   console.log(accounts);

//   const balance = await ethers.provider.getBalance(accounts[0]);
//   console.log("Balance: " + utils.formatEther(balance)); 

//   const AINFTGenerator = await hre.ethers.getContractFactory("AINFTGenerator");
//   const generator = await AINFTGenerator.deploy();

//   await generator.deployed();

//   console.log("Deployed to: " + generator.address);
  
// }

// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });
