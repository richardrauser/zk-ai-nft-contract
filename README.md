# zkSync AI NFT Generator smart contract

This repo hosts a smart contract for publishing an image and image name as an NFT. The total supply is unbounded.


## Setup
- In your local .env file, add an entry containing your Alchemy API key called ALCHEMY_API_KEY to your .env file. 
- Mint transactions must include a signature that is verified by the mint functio. An off-chain backend service of some sort can generate this signature from transaction data submitted to it. The intention here is to be able to restrict access to minting if necessary. If you do not require such functionality, you can remove this from the mint function.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```
