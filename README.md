# zkSync AI NFT Generator smart contract

This repo hosts a smart contract for publishing an image and image name as an NFT. The total supply is unbounded.


## Setup
- .env file must contain a private key used for verifying the sender of a mint transaction.
- Add an entry for containing your Alchemy private key valled DEPLOYER_PRIVATE_KEY to your .env file. ?


Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```
