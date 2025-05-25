// Dashboard.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Button,
  Alert,
} from "react-native";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitState,
  useDisconnect,
} from "@reown/appkit-ethers-react-native";
import { JsonRpcProvider, formatEther } from "ethers";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/Stack";

type NavProp = NativeStackNavigationProp<RootStackParamList, "Dashboard">;

export default function Dashboard() {
  const { open } = useAppKit();
  const { address: liveAddress, isConnected } = useAppKitAccount();
  const { selectedNetworkId } = useAppKitState();
  const { disconnect } = useDisconnect();
  const navigation = useNavigation<NavProp>();

  // 1) State for the Firestore-saved wallet
  const [storedAddress, setStoredAddress] = useState<string | null>(null);
  const [username, setUsername]           = useState<string | null>(null);

  // 2) State for balance/error
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  // 3) Lookup Firestore wallet by current user UID
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      console.warn("No authenticated user for Dashboard");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const q    = query(collection(db, "wallets"), where("uid", "==", uid));
        const snap = await getDocs(q);
        if (cancelled) return;
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setUsername(data.username as string);
          setStoredAddress(data.address as string);
        } else {
          setUsername("");
          setStoredAddress(null);
        }
      } catch (e) {
        console.error("Failed to fetch saved wallet:", e);
        if (!cancelled) {
          setUsername("");
          setStoredAddress(null);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 4) Fetch balance whenever the address we display changes
  //    Prefer liveAddress (if connected), else storedAddress
  useEffect(() => {
    const addrToUse = liveAddress || storedAddress;
    if (!addrToUse) {
      setBalance(null);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const provider = new JsonRpcProvider("http://192.168.100.129:8546");
        const raw      = await provider.getBalance(addrToUse);
        if (!cancelled) {
          setBalance(formatEther(raw));
          setError(null);
        }
      } catch (e: any) {
        console.error("Failed to fetch balance:", e);
        if (!cancelled) {
          setBalance(null);
          setError("Network unreachable");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [liveAddress, storedAddress]);

  // Decide what to show as "current" address
  const displayAddress = liveAddress || storedAddress;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧾 BlockPay Dashboard</Text>

      <Text style={styles.label}>Username:</Text>
      {username === null ? (
        <ActivityIndicator size="small" />
      ) : (
        <Text style={styles.value}>{username || "— not set —"}</Text>
      )}

      <Text style={styles.label}>Wallet Address:</Text>
      <Text selectable style={styles.value}>
        {displayAddress || "Not connected"}
      </Text>

      <Text style={styles.label}>Chain ID:</Text>
      <Text style={styles.value}>{selectedNetworkId ?? "Unknown"}</Text>

      <Text style={styles.label}>Balance:</Text>
      {error ? (
        <Text style={[styles.value, { color: "red" }]}>{error}</Text>
      ) : balance === null ? (
        <ActivityIndicator size="small" />
      ) : (
        <Text style={styles.value}>{balance} ETH</Text>
      )}

      {/* Connect / Disconnect */}
      <View style={styles.buttonRow}>
        <Button
          title={isConnected ? "Disconnect Wallet" : "Connect Wallet"}
          onPress={() => {
            if (isConnected) {
              disconnect().catch(e => console.error(e));
            } else {
              open().catch(e => {
                console.error(e);
                Alert.alert("Connection failed");
              });
            }
          }}
        />
        <Button
          title="Send"
          onPress={() => Alert.alert("Send tapped")}
        />
      </View>

      <View style={styles.buttonColumn}>
        <Button
          title="Add Another Wallet"
          onPress={() => navigation.navigate("ConnectWallet")}
        />
        <Button
          title="Manage Wallets"
          onPress={() => Alert.alert("Manage Wallets tapped")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title:        { fontSize: 24, fontWeight: "bold", marginBottom: 24 },
  label:        { fontWeight: "600", marginTop: 16, fontSize: 16 },
  value:        { fontSize: 16, color: "#333", marginTop: 4, textAlign: "center" },
  buttonRow:    { flexDirection: "row", justifyContent: "space-around", width: "100%", marginTop: 20 },
  buttonColumn: { marginTop: 12, width: "100%", justifyContent: "space-between", height: 100 },
});
