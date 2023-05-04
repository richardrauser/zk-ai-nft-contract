# zkSync AI NFT Generator smart contract

This repo hosts a smart contract for publishing an image and its name as an NFT. These are intended to be supplied by the AI NFT Generator frontend, which is is in a different repo that is under development and private. The total supply of NFTs is unbounded.

Note that mint transactions must include a signature that is verified by the mint function. It is intended that an off-chain backend service of some sort generates this signature from transaction data submitted to it and the contract owner's private key. The intention here is to be able to restrict access to minting if necessary, e.g. to block certain IP addresses that perhaps mint too frequently. At an extreme, an auth system could guard access to the off-chain signature generator and track the details of those requesting signatures and minting NFTs. The ultimate aim is to avoid abuse. If you do not require such functionality, you can remove the relevant require statement from the mint function.


## Setup
- In your local .env file, add an entry containing your Alchemy API key called ALCHEMY_API_KEY to your .env file. 

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```
