const hre = require("hardhat");

async function main() {
  // Get signers from Hardhat
  const [deployer, ...signers] = await hre.ethers.getSigners();
  
  // Create array of 20 addresses for board members
  const boardMembers = signers.slice(0, 20).map(signer => signer.address);
  
  // First deploy the TestToken
  console.log("Deploying TestToken...");
  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy();
  await testToken.deployed();
  console.log("TestToken deployed to:", testToken.address);

  // Then deploy the BoardMultiSig with the board members
  console.log("Deploying BoardMultiSig...");
  const BoardMultiSig = await hre.ethers.getContractFactory("BoardMultiSig");
  const boardMultiSig = await BoardMultiSig.deploy(boardMembers);
  await boardMultiSig.deployed();
  
  console.log("BoardMultiSig deployed to:", boardMultiSig.address);
  console.log("Board Members:", boardMembers);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });