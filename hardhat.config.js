require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.20",
  networks: {
    gethPrivate: {
      // url: "http://172.20.10.6:8546"
      url: "http://192.168.100.129:8546"
      // url: "http://192.168.100.129:8546"

      // No need to add `accounts` if Geth dev mode is auto-unlocked
    }
  }
};
