// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { utils } = require("ethers");
const hre = require("hardhat");

async function main() {
  console.log("Deploying..");

  let provider = ethers.provider;
  const accounts = await provider.listAccounts();
  console.log("Accounts: ");
  console.log(accounts);

  const balance = await ethers.provider.getBalance(accounts[0]);
  console.log("Balance: " + utils.formatEther(balance)); 

  const AINFTGenerator = await hre.ethers.getContractFactory("AINFTGenerator");
  const generator = await AINFTGenerator.deploy();

  await generator.deployed();

  console.log("Deployed to: " + generator.address);
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
