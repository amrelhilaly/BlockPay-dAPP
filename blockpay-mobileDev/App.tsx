import "@walletconnect/react-native-compat";
import React from "react";
import { AppKit, createAppKit, defaultConfig } from "@reown/appkit-ethers-react-native";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./navigation/Stack"; // ← assumes you created this
import { LogBox } from "react-native";

// Ignore certain warnings from WalletConnect packages if needed
LogBox.ignoreLogs([
  "Require cycle:",
]);

// Your WalletConnect Project ID
const projectId = "15a77aeafbdcbd4b84fcb166fde26b37";

// Metadata
const metadata = {
  name: "BlockPay",
  description: "Blockchain-powered payments with WalletConnect",
  url: "https://blockpay.app",
  icons: ["https://blockpay.app/icon.png"],
  redirect: {
    native: "blockpay://",
  },
};

// AppKit config
const config = defaultConfig({ metadata });

// Geth chain
const gethPrivateChain = {
  chainId: 1337,
  name: "Geth Devnet",
  currency: "ETH",
  explorerUrl: "",
  rpcUrl: "http://192.168.100.129:8546",
};

// Register AppKit
createAppKit({
  projectId,
  chains: [gethPrivateChain],
  config,
  enableAnalytics: false,
});

export default function App() {
  return (
    <>
      <AppKit />
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
    </>
  );
}
