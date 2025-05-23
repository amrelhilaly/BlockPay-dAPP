import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import {
  useAppKitAccount,
  useAppKitState,
} from "@reown/appkit-ethers-react-native";
// In ethers v6, everything (providers, utils, etc.) is exported from the root
import { JsonRpcProvider, formatEther } from "ethers";  // :contentReference[oaicite:0]{index=0}

export default function Dashboard() {
  const { address } = useAppKitAccount();
  const { selectedNetworkId } = useAppKitState();

  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) return;

      try {
        // v6: JsonRpcProvider is now directly on ethers
        const provider = new JsonRpcProvider(
          "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID"
        );  // :contentReference[oaicite:1]{index=1}

        const raw = await provider.getBalance(address);
        // v6: formatEther is a standalone export, not under `ethers.utils`
        setBalance(formatEther(raw));  // :contentReference[oaicite:2]{index=2}
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    };

    fetchBalance();
  }, [address]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧾 BlockPay Dashboard</Text>

      <Text style={styles.label}>Wallet Address:</Text>
      <Text selectable style={styles.value}>
        {address || "Not connected"}
      </Text>

      <Text style={styles.label}>Chain ID:</Text>
      <Text style={styles.value}>
        {selectedNetworkId ?? "Unknown"}
      </Text>

      <Text style={styles.label}>Balance:</Text>
      {balance === null ? (
        <ActivityIndicator size="small" />
      ) : (
        <Text style={styles.value}>{balance} ETH</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: "center", alignItems: "center", padding: 20
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 24 },
  label: { fontWeight: "600", marginTop: 16, fontSize: 16 },
  value: { fontSize: 16, color: "#333", marginTop: 4, textAlign: "center" },
});
