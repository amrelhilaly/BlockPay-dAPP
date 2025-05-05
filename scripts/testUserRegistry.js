async function main() {
    const [user] = await ethers.getSigners();
  
    const contractAddress = "0x43558f411D1C4Dc52bA98C4e27FFc1A7B34Cd11a"; // your deployed address
    const UserRegistry = await ethers.getContractFactory("UserRegistry");
    const userRegistry = await UserRegistry.attach(contractAddress);
  
    console.log("Calling register()...");
    const tx = await userRegistry.register("alex");
    await tx.wait();
    console.log("✅ Registered!");
  
    const username = await userRegistry.getUsername(user.address);
    console.log("Username:", username);
  
    const isReg = await userRegistry.isRegistered(user.address);
    console.log("Is registered?", isReg);
  }
  
  main().catch((error) => {
    console.error(error);
    process.exit
  })  