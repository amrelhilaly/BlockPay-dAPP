// App.tsx

// 0) Shim out BackHandler.removeEventListener without TS errors
import { BackHandler } from "react-native";
const BH = BackHandler as any;
if (typeof BH.removeEventListener !== "function") {
  BH.removeEventListener = (_: string, __: any) => {
    // no-op
  };
}

// 1) Clear old WalletConnect session keys before anything else
import AsyncStorage from "@react-native-async-storage/async-storage";
(async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const wcKeys = keys.filter(k => k.startsWith("wc@") || k.startsWith("walletconnect"));
    if (wcKeys.length) {
      await AsyncStorage.multiRemove(wcKeys);
      console.log("✅ Cleared old WalletConnect keys:", wcKeys);
    }
  } catch (e) {
    console.warn("⚠️ Failed to clear old WalletConnect keys:", e);
  }
})();

// 2) Polyfills — these MUST come next
import "react-native-get-random-values";     // secure RNG for ethers
import "@ethersproject/shims";               // ethers v6 shims
import "@walletconnect/react-native-compat"; // WalletConnect RN compat

// 3) Font loading
import React from "react";
import AppLoading from 'expo-app-loading';
import { useFonts, Manrope_500Medium, Manrope_700Bold } from '@expo-google-fonts/manrope';

// 4) Other imports
import { LogBox } from "react-native";
import { AppKit, createAppKit, defaultConfig } from "@reown/appkit-ethers-react-native";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./navigation/Stack";

// 5) Silence any WalletConnect warnings you don’t care about
LogBox.ignoreLogs(["Require cycle:"]);

// 6) Your WalletConnect Project & AppKit setup
const projectId = "15a77aeafbdcbd4b84fcb166fde26b37";

const metadata = {
  name:        "BlockPay",
  description: "Blockchain-powered payments with WalletConnect",
  url:         "https://blockpay.app",
  icons:       ["https://blockpay.app/icon.png"],
  redirect:    { native: "blockpay://" },
};

const config = defaultConfig({ metadata });

const gethPrivateChain = {
  chainId:    1337,
  name:       "Geth Devnet",
  currency:   "ETH",
  explorerUrl: "",
  rpcUrl:     "http://192.168.100.129:8546",
};

createAppKit({
  projectId,
  chains:          [gethPrivateChain],
  config,
  enableAnalytics: false,
});

// 7) The App component
export default function App() {
  // Load custom fonts
  const [fontsLoaded] = useFonts({ Manrope_500Medium, Manrope_700Bold });
  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <NavigationContainer>
      <AppKit />
      <StackNavigator />
    </NavigationContainer>
  );
}