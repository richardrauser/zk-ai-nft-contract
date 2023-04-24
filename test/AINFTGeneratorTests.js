const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { LogDescription } = require("@ethersproject/abi");

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

    it("Should mint successfully and totalSupply increments", async function () {
      const { generator } = await deploy();
      await generator.mint("some name","https://someurl.com/image");

      expect(await generator.totalSupply()).to.equal(1);
    });

    it("tokenURI returns correct metadata", async function () {
      const { generator } = await deploy();
      await generator.mint("some name", "https://someurl.com/image");

      const metadata = await generator.tokenURI(0);
      const parsedMetadata = JSON.parse(metadata);

      expect(parsedMetadata.name).to.equal("some name");
      expect(parsedMetadata.image).to.equal("https://someurl.com/image");
    });

    it("tokenURI returns correct metadata after multiple mints", async function () {
      const { generator } = await deploy();
      await generator.mint("some name 0", "https://someurl.com/image0");
      await generator.mint("some name 1", "https://someurl.com/image1");
      await generator.mint("some name 2", "https://someurl.com/image2");
      await generator.mint("some name 3", "https://someurl.com/image3");
      await generator.mint("some name 4", "https://someurl.com/image4");
      await generator.mint("some name 5", "https://someurl.com/image5");
      await generator.mint("some name 6", "https://someurl.com/image6");
      await generator.mint("some name 7", "https://someurl.com/image7");
      await generator.mint("some name 8", "https://someurl.com/image8");
      await generator.mint("some name 9", "https://someurl.com/image9");

      const metadata = await generator.tokenURI(3);
      const parsedMetadata = JSON.parse(metadata);

      expect(parsedMetadata.name).to.equal("some name 3");
      expect(parsedMetadata.image).to.equal("https://someurl.com/image3");
    });


  });
});
