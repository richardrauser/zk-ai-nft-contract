// import { ethers, keccak256 } from 'ethers';

const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { LogDescription } = require("@ethersproject/abi");
const { keccak256 } = require("ethers/lib/utils");

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
    it("Deployment should succeed", async function () {
      expect(await deploy()).not.reverted;
    });

    // OWNERHSIP TESTS

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

    async function generateSig(owner, name, url, nonce) {
      const message = name + url;
      const hashedMessage = keccak256(ethers.utils.solidityPack(["string", "uint"], [message, nonce]));
      return await owner.signMessage(ethers.utils.arrayify(hashedMessage));
    }

    it("Should mint successfully and totalSupply increments", async function () {
      const { owner, generator } = await deploy();
      
      const name = "Crazy AI NFT Image";
      const url = "http://someurl.com/image";
      const nonce = await generator.totalSupply();            
      const sig = await generateSig(owner, name, url, nonce);
      await generator.mint(name, url, nonce, sig);

      expect(await generator.totalSupply()).to.equal(1);
    });

    // it("tokenURI returns correct metadata", async function () {
    //   const { generator } = await deploy();
    //   await generator.mint("some name", "https://someurl.com/image");

    //   const metadata = await generator.tokenURI(0);
    //   const parsedMetadata = JSON.parse(metadata);

    //   expect(parsedMetadata.name).to.equal("some name");
    //   expect(parsedMetadata.image).to.equal("https://someurl.com/image");
    // });

    // it("tokenURI returns correct metadata after multiple mints", async function () {
    //   const { generator } = await deploy();
    //   await generator.mint("some name 0", "https://someurl.com/image0");
    //   await generator.mint("some name 1", "https://someurl.com/image1");
    //   await generator.mint("some name 2", "https://someurl.com/image2");
    //   await generator.mint("some name 3", "https://someurl.com/image3");
    //   await generator.mint("some name 4", "https://someurl.com/image4");
    //   await generator.mint("some name 5", "https://someurl.com/image5");
    //   await generator.mint("some name 6", "https://someurl.com/image6");
    //   await generator.mint("some name 7", "https://someurl.com/image7");
    //   await generator.mint("some name 8", "https://someurl.com/image8");
    //   await generator.mint("some name 9", "https://someurl.com/image9");

    //   const metadata = await generator.tokenURI(3);
    //   const parsedMetadata = JSON.parse(metadata);

    //   expect(parsedMetadata.name).to.equal("some name 3");
    //   expect(parsedMetadata.image).to.equal("https://someurl.com/image3");
    // });

    // SIGNING TESTS

    it("Should revery mint with invalid signature", async function () {
      const { generator } = await deploy();
    
      expect(generator.mint("some name","https://someurl.com/image", "foobar")).to.be.reverted;
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
