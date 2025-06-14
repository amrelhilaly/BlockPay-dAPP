// ConnectWalletScreen.tsx

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from "react-native"
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore"
import { db, auth } from "../firebase/firebase"
import { hashWallet } from "../utils/hash"
import {
  useAppKit,
  useAppKitAccount,
  useDisconnect,
} from "@reown/appkit-ethers-react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { RootStackParamList } from "../navigation/Stack"

// We only navigate to "ConnectWallet" (this screen) or "MainTabs" (your tabs container)
type Props = NativeStackScreenProps<RootStackParamList, "ConnectWallet">

export default function ConnectWalletScreen({ navigation }: Props) {
  const { open }               = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { disconnect }         = useDisconnect()

  const [username, setUsername]     = useState("")
  const [manualAddress, setManualAddress] = useState("")

  // ensure username not already used
  const isUsernameUnique = async (name: string): Promise<boolean> => {
    const q    = query(
      collection(db, "wallets"),
      where("username", "==", name.trim())
    )
    const snap = await getDocs(q)
    return snap.empty
  }

  // Step 1: ask user to connect via WalletConnect UI
  const handleConnect = async () => {
    const name = username.trim()
    if (!name) {
      Alert.alert("Username required", "Please enter a username before connecting.")
      return
    }

    try {
      const unique = await isUsernameUnique(name)
      if (!unique) {
        Alert.alert("Username taken", "That username is already in use.")
        return
      }
    } catch (e) {
      console.error("Username check failed", e)
      Alert.alert("Error", "Could not verify username uniqueness.")
      return
    }

    try {
      await open()
    } catch (err) {
      console.error("Wallet connection failed", err)
      Alert.alert("Wallet connection failed.")
    }
  }

  // Step 2: user connected, now persist to Firestore
  const handleSave = async (walletAddr: string) => {
    const name = username.trim()
    if (!name || !walletAddr.trim()) {
      Alert.alert("Missing data", "Both username and wallet address are required.")
      return
    }

    const user = auth.currentUser
    if (!user) {
      Alert.alert("Not authenticated", "Please log in again.")
      return
    }

    try {
      await addDoc(collection(db, "wallets"), {
        uid:        user.uid,
        username:   name,
        wallet:     hashWallet(walletAddr.trim()),
        address:    walletAddr.trim(),
        createdAt:  new Date(),
      })
      // instead of “Dashboard”, we jump into the tabs container—
      // by default your Tab.Navigator shows Dashboard first
      navigation.replace("MainTabs")
    } catch (err) {
      console.error("Failed to save wallet", err)
      Alert.alert("Error", "Failed to save wallet. Try again.")
    }
  }

  // whenever WalletConnect returns a connected address
  useEffect(() => {
    if (isConnected && address) {
      handleSave(address)
    }
  }, [isConnected, address])

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
          onPress={() => navigation.replace("MainTabs")}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title:     { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input:     {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 4,
    borderRadius: 6,
  },
  note:      {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
    marginLeft: 4,
  },
  or:        {
    textAlign: "center",
    marginVertical: 10,
    fontWeight: "bold",
    color: "#666",
  },
})
