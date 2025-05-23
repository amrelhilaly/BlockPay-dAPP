import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { encryptWallet } from "../utils/encrypt";
import { useAppKit, useAppKitAccount } from "@reown/appkit-ethers-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type RootStackParamList = {
  ConnectWallet: undefined;
  Dashboard: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "ConnectWallet">;

export default function ConnectWalletScreen({ navigation }: Props) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  const [username, setUsername] = useState("");
  const [manualAddress, setManualAddress] = useState("");

  const handleSave = async (walletAddr: string) => {
    if (!username || !walletAddr) {
      Alert.alert("Both username and wallet address are required.");
      return;
    }

    const encrypted = encryptWallet(walletAddr);

    try {
      await addDoc(collection(db, "wallets"), {
        username,
        wallet: encrypted,
        createdAt: new Date(),
      });
      navigation.navigate("Dashboard");
    } catch (err) {
      console.error(err);
      Alert.alert("Error saving wallet to Firestore.");
    }
  };

  const handleConnect = async () => {
    try {
      await open(); // Open WalletConnect modal
      setTimeout(() => {
        if (isConnected && address) {
          handleSave(address);
        } else {
          Alert.alert("Wallet not connected. Try again.");
        }
      }, 1000); // Wait briefly to ensure state updates
    } catch (err) {
      console.error(err);
      Alert.alert("Wallet connection failed.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Wallet</Text>

      <TextInput
        style={styles.input}
        placeholder="Username for this wallet"
        value={username}
        onChangeText={setUsername}
      />

      <Button
        title={isConnected ? "Connected" : "🔌 Connect Wallet"}
        onPress={handleConnect}
      />

      <Text style={styles.or}>OR</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter wallet address manually"
        value={manualAddress}
        onChangeText={setManualAddress}
        autoCapitalize="none"
      />

      <Button
        title="Submit Manual Wallet"
        onPress={() => handleSave(manualAddress)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
  },
  or: {
    textAlign: "center",
    marginVertical: 10,
    fontWeight: "bold",
    color: "#666",
  },
});
