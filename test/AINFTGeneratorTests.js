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

async function generateSig(account, name, url, nonce) {
  const message = name + url;
  console.log("message: " + message + " nonce: " + nonce);
  const hashedMessage = keccak256(ethers.utils.solidityPack(["string", "uint"], [message, nonce]));
  console.log("hashedMessage: " + hashedMessage);
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
      generator.transferOwnership(otherAccount.address);

      const ownerAddress = await generator.owner();
      expect(ownerAddress).to.equal(otherAccount.address);
    });

    // PAYMENT TESTS

    it('test payOwner pays out', async function () {
        const provider = ethers.provider;
      const { owner, generator, otherAccount } = await deploy();

        await generator.setMintPrice(ethers.utils.parseEther("1"));

        const originalBalance = await provider.getBalance(otherAccount.address);
        expect(originalBalance).to.be.equal(ethers.utils.parseEther("10000"));

        const overrides = { value: ethers.utils.parseEther("1") };
        const name = "Crazy AI NFT Image";
        const url = "http://someurl.com/image";
        const nonce = await generator.totalSupply();            
        const sig = await generateSig(owner, name, url, nonce);
        await generator.mint(name, url, nonce, sig, overrides);

        const afterMintContractBalance = await provider.getBalance(generator.address);
        expect(afterMintContractBalance).to.be.equal(ethers.utils.parseEther("1"));

        await generator.transferOwnership(otherAccount.address);

        generator.connect(otherAccount);
        console.log("new owner: " + await generator.owner());

        await generator.connect(otherAccount).payOwner(ethers.utils.parseEther("0.5"));

        const afterPaymentOwnerBalance = await provider.getBalance(otherAccount.address);
        const afterPaymentContractBalance = await provider.getBalance(generator.address);
        
        // expect(afterPaymentOwnerBalance).to.be.equal(ethers.utils.parseEther("10000.5"));
        expect(afterPaymentContractBalance).to.be.equal(ethers.utils.parseEther("0.5"));
    });

    // MINTING TESTS

    it("Should mint successfully and totalSupply increments", async function () {
      const { owner, generator } = await deploy();
      
      const name = "Crazy AI NFT Image";
      const url = "http://someurl.com/image";
      const nonce = await generator.totalSupply();            
      const sig = await generateSig(owner, name, url, nonce);
      await generator.mint(name, url, nonce, sig);

      expect(await generator.totalSupply()).to.equal(1);
    });

    it("tokenURI returns correct metadata", async function () {
      const { generator, owner } = await deploy();

      const name = "some name";
      const url = "https://someurl.com/image";
      const nonce = await generator.totalSupply();            
      const sig = await generateSig(owner, name, url, nonce);
      await generator.mint(name, url, nonce, sig);

      const metadata = await generator.tokenURI(0);
      const parsedMetadata = JSON.parse(metadata);

      expect(parsedMetadata.name).to.equal("some name");
      expect(parsedMetadata.image).to.equal("https://someurl.com/image");
    });

    it("tokenURI returns correct metadata after multiple mints", async function () {
      const { generator, owner } = await deploy();

      for (var i = 0; i < 10; i++) {

        const name = "some name " + i;
        const url = "https://someurl.com/image" + i;
        const nonce = await generator.totalSupply();            
        const sig = await generateSig(owner, name, url, nonce);
        await generator.mint(name, url, nonce, sig);
      }

      const metadata = await generator.tokenURI(3);
      const parsedMetadata = JSON.parse(metadata);

      expect(parsedMetadata.name).to.equal("some name 3");
      expect(parsedMetadata.image).to.equal("https://someurl.com/image3");
    });

    // SIGNING TESTS

    it("Should reverse mint with invalid signature", async function () {
      const { generator, otherAccount } = await deploy();
      
      const sig = generateSig(otherAccount, "some name", "https://someurl.com/image", 0);

      await expect(generator.mint("some name", "https://someurl.com/image", 0, sig)).to.be.reverted;
    });

    it("Test sig generated with backend", async function () {
      const { generator } = await deploy();

      const signer = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
      console.log("signer: " + signer.address);

      const expectedSig = await generateSig(signer, "test", "test", 1);

      await generator.transferOwnership(signer.address);
      console.log("new owner: " + await generator.owner());

      await expect(generator.mint("test", "test", 1, expectedSig)).to.not.be.reverted;

      expect("0x5c19b3f1450895c0d519dba30391f9a2235d3fe91cd06831d6670dc5128fe6187acd1c8ae75e7f4ed2b9e6fcc60a2b459300a36e0c0c04b33294c163bedb0c381c").to.equal(expectedSig);
    });

        // ERC-2981 Royalties

    it('ERC2981: deployer mints and is recipient and 10% royalties', async function () {
        const overrides = { value: ethers.utils.parseEther("0.01") };
        const { generator, owner } = await deploy();

        const name = "Crazy AI NFT Image";
        const url = "http://someurl.com/image";
        const nonce = await generator.totalSupply();            
        const sig = await generateSig(owner, name, url, nonce);
        await generator.mint(name, url, nonce, sig);

        const info = await generator.royaltyInfo(0, 100);
        expect(info[0]).to.be.equal(owner.address);
        expect(info[1].toNumber()).to.be.equal(5);
    });

  });
});
