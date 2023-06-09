// import { ethers, keccak256 } from 'ethers';

const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { LogDescription } = require("@ethersproject/abi");
const { keccak256 } = require("ethers/lib/utils");
const { Wallet } = require("ethers");

async function generateSig(account, uri, nonce) {
  const hashedMessage = keccak256(ethers.utils.solidityPack(["string", "uint"], [uri, nonce]));
  return await account.signMessage(ethers.utils.arrayify(hashedMessage));
}

describe("NFTAIGenerator", function () {

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploy() {

    console.log("Deploying contract..");

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    console.log("Account deploying: " + owner.address);
    console.log("Other account: " + otherAccount.address);

    const AINFTGenerator = await ethers.getContractFactory("AINFTGenerator");
    const generator = await AINFTGenerator.deploy();

    return { generator, owner, otherAccount };
  }

  describe("AINFTGenerator Tests", function () {
    // it("Deployment should succeed", async function () {
    //   expect(await deploy()).not.reverted;
    // });

    // // OWNERHSIP TESTS

    it("Should set the right owner", async function () {
      const { generator, owner } = await deploy();
      const ownerAddress = await generator.owner();
      expect(ownerAddress).to.equal(owner.address);
    });

    it("Should transfer ownership", async function () {
      const { generator, owner, otherAccount } = await deploy();
      await generator.transferOwnership(otherAccount.address);

      const ownerAddress = await generator.owner();
      expect(ownerAddress).to.equal(otherAccount.address);
    });

    // PAYMENT TESTS

    it('test payOwner pays out', async function () {
        const provider = ethers.provider;
      const { owner, generator, otherAccount } = await deploy();

        await generator.setMintPrice(ethers.utils.parseEther("1"));

        const originalBalance = await provider.getBalance(otherAccount.address);
        console.log("other account original balance: " + originalBalance);
        // expect(originalBalance).to.be.equal(ethers.utils.parseEther("10000"));

        const overrides = { value: ethers.utils.parseEther("1") };
        const name = "Crazy AI NFT Image";
        const url = "http://someurl.com/image";
        const nonce = await generator.totalSupply();            
        const sig = await generateSig(owner, url, nonce);
        await generator.mint(url, nonce, sig, overrides);

        // const afterMintContractBalance = await provider.getBalance(generator.address);
        // // expect(afterMintContractBalance).to.be.equal(ethers.utils.parseEther("1"));

        await generator.transferOwnership(otherAccount.address);

        await generator.connect(otherAccount);
        console.log("new owner: " + await generator.owner());

        await generator.connect(otherAccount).payOwner(ethers.utils.parseEther("0.5"));

        const afterPaymentOwnerBalance = await provider.getBalance(otherAccount.address);
        const afterPaymentContractBalance = await provider.getBalance(generator.address);
        
        const expectedNewBalance = BigInt(originalBalance) + BigInt(ethers.utils.parseEther("0.5"));
        console.log("other account original balance + 0.5: " + expectedNewBalance);
        console.log("other account balance after payment: " + afterPaymentOwnerBalance);
        
        // use closeTo because of gas fees
        expect(afterPaymentOwnerBalance).to.be.closeTo(expectedNewBalance, 100000000000000);
        expect(afterPaymentContractBalance).to.be.equal(ethers.utils.parseEther("0.5"));
    });

    // MINTING TESTS
           
    it("Should mint successfully and totalSupply increments", async function () {
      const { owner, generator } = await deploy();
      
      const name = "Crazy AI NFT Image";
      const url = "http://someurl.com/image";
      const nonce = await generator.totalSupply();            
      const sig = await generateSig(owner, url, nonce);
      await generator.mint(url, nonce, sig);

      expect(await generator.totalSupply()).to.equal(1);
    });

    it("tokenURI returns correct metadata", async function () {
      const { generator, owner } = await deploy();

      const url = "https://someurl.com/image";
      const nonce = await generator.totalSupply();            
      const sig = await generateSig(owner, url, nonce);
      await generator.mint(url, nonce, sig);

      const uri = await generator.tokenURI(0);

      expect(uri).to.equal("https://someurl.com/image");
    });

    it("tokenURI returns correct metadata after multiple mints", async function () {
      const { generator, owner } = await deploy();

      for (var i = 0; i < 10; i++) {
        const url = "https://someurl.com/image" + i;
        const nonce = await generator.totalSupply();            
        const sig = await generateSig(owner, url, nonce);
        await generator.mint(url, nonce, sig);
      }

      const uri = await generator.tokenURI(3);
      
      expect(uri).to.equal("https://someurl.com/image3");
    });

    // SIGNING TESTS

    it("Should reverse mint with invalid signature", async function () {
      const { generator, otherAccount } = await deploy();
      
      const sig = generateSig(otherAccount, "https://someurl.com/image", 0);

      await expect(generator.mint("https://someurl.com/image", 0, sig)).to.be.reverted;
    });

    it("Test sig generated with backend", async function () {
      const { generator } = await deploy();

      const signer = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
      console.log("signer: " + signer.address);

      const expectedSig = await generateSig(signer, "ipfs://1234", 1);

      await generator.transferOwnership(signer.address);
      console.log("new owner: " + await generator.owner());

      await expect(generator.mint("ipfs://1234", 1, expectedSig)).to.not.be.reverted;

      expect("0xa0dacff0e7b9eeb87a46fec2930fb9b670db0edec4b3a8cb9b1ff899fbd3c65646867193a803086bb451841f51a1194bbbcac5bdf9368ab44f8bd2f65f6cddf51c").to.equal(expectedSig);
    });

        // ERC-2981 Royalties

    it('ERC2981: deployer mints and is recipient and 10% royalties', async function () {
        const overrides = { value: ethers.utils.parseEther("0.01") };
        const { generator, owner } = await deploy();

        const url = "http://someurl.com/image";
        const nonce = await generator.totalSupply();            
        const sig = await generateSig(owner, url, nonce);
        await generator.mint(url, nonce, sig);

        const info = await generator.royaltyInfo(0, 100);
        expect(info[0]).to.be.equal(owner.address);
        expect(info[1].toNumber()).to.be.equal(5);
    });

  });
});
