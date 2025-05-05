async function main() {
    const BlockPay = await ethers.getContractFactory("BlockPay");
    const blockPay = await BlockPay.deploy();
    await blockPay.deployed();
  
    console.log(`✅ BlockPay deployed to: ${blockPay.address}`);
  }
  
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

  //✅ UserRegistry deployed to: 0x43558f411D1C4Dc52bA98C4e27FFc1A7B34Cd11a
  //✅ BlockPay deployed to: 0x2B59E08bab1E546C39C9e1086Ee562f425E5316E
