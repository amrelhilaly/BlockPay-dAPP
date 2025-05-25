// ConnectWalletScreen.tsx

import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { hashWallet } from "../utils/hash";
import {
  useAppKit,
  useAppKitAccount,
  useDisconnect,
} from "@reown/appkit-ethers-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type RootStackParamList = {
  ConnectWallet: undefined;
  Dashboard:     undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "ConnectWallet">;

export default function ConnectWalletScreen({ navigation }: Props) {
  const { open }               = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect }         = useDisconnect();

  const [username, setUsername]         = useState("");
  const [manualAddress, setManualAddress] = useState("");

  // Helper: returns false if username already exists
  const isUsernameUnique = async (name: string): Promise<boolean> => {
    const q    = query(
      collection(db, "wallets"),
      where("username", "==", name.trim())
    );
    const snap = await getDocs(q);
    return snap.empty;
  };

  const handleConnect = async () => {
    const name = username.trim();
    if (!name) {
      Alert.alert("Username required", "Please enter a username before connecting.");
      return;
    }

    // 1) Check uniqueness BEFORE opening modal
    try {
      const unique = await isUsernameUnique(name);
      if (!unique) {
        Alert.alert("Username taken", "That username is already in use. Please choose another.");
        return;
      }
    } catch (e) {
      console.error("Username check failed", e);
      Alert.alert("Error", "Could not verify username uniqueness. Try again.");
      return;
    }

    // 2) If unique, open WalletConnect
    try {
      await open();
    } catch (err) {
      console.error(err);
      Alert.alert("Wallet connection failed.");
    }
  };

  const handleSave = async (walletAddr: string) => {
    const name = username.trim();
    if (!name || !walletAddr.trim()) {
      Alert.alert("Both username and wallet address are required.");
      return;
    }

    // 1) Current user UID
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not authenticated", "Please log in again.");
      return;
    }
    const uid = user.uid;

    // 2) Hash the address
    const hashed = hashWallet(walletAddr.trim());

    // 3) Save to Firestore
    try {
      await addDoc(collection(db, "wallets"), {
        uid,
        username:   name,
        wallet:     hashed,
        address:    walletAddr.trim(),
        createdAt:  new Date(),
      });
      navigation.replace("Dashboard");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save wallet. Please try again.");
    }
  };

  // Auto‐save when WalletConnect returns
  useEffect(() => {
    if (isConnected && address) {
      handleSave(address);
    }
  }, [isConnected, address]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Wallet</Text>

      <TextInput
        style={styles.input}
        placeholder="Username for this wallet"
        value={username}
        onChangeText={setUsername}
      />
      <Text style={styles.note}>Username must be unique</Text>

      <Button
        title={isConnected ? "Connected ✓" : "🔌 Connect Wallet"}
        onPress={handleConnect}
      />

      <Text style={styles.or}>OR</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter wallet address manually"
        autoCapitalize="none"
        value={manualAddress}
        onChangeText={setManualAddress}
      />

      <Button
        title="Submit Manual Wallet"
        onPress={() => handleSave(manualAddress)}
      />

      <View style={{ marginTop: 20 }}>
        <Button
          title="Skip for Now"
          onPress={() => navigation.replace("Dashboard")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title:     { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input:     {
    borderWidth: 1, borderColor: "#ccc",
    padding: 12, marginBottom: 4, borderRadius: 6,
  },
  note:      {
    fontSize: 12, color: "#666",
    marginBottom: 12, marginLeft: 4,
  },
  or:        {
    textAlign: "center", marginVertical: 10,
    fontWeight: "bold", color: "#666",
  },
});
