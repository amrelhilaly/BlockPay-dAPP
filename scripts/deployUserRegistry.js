async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying as:", deployer.address);
  
    const Registry = await ethers.getContractFactory("UserRegistry");
    const registry = await Registry.deploy();
    await registry.deployed();
  
    console.log("✅ UserRegistry deployed to:", registry.address);
  }
  
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
  