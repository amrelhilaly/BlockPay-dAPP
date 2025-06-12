// SendScreen.tsx

import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import {
  parseEther,
  isAddress,
  JsonRpcProvider,
  Contract,
} from 'ethers'
import { useAppKitAccount } from '@reown/appkit-ethers-react-native'
import BlockPayArtifact from '../abi/BlockPay.json'

// Firestore imports for username → address lookup
import { db } from '../firebase/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

// ← your deployed BlockPay contract address
const CONTRACT_ADDRESS = '0x7D23c09b813dC78Ef5328ABE09CF49E2a78B2e81'
// ← your Geth RPC endpoint
const RPC_URL = 'http://172.20.10.6:8546'

export default function SendScreen() {
  const { address: senderAddress, isConnected } = useAppKitAccount()
  const [receiver, setReceiver] = useState('')       // this is the BlockPay username
  const [amountEth, setAmountEth] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isConnected) {
    return (
      <View style={styles.centered}>
        <Text>Please connect your wallet first.</Text>
      </View>
    )
  }

  const handleSend = async () => {
    const username = receiver.trim()
    if (!username) {
      return Alert.alert('Invalid username', 'Please enter a BlockPay username.')
    }

    // 1️⃣ Parse amount to wei
    let value
    try {
      value = parseEther(amountEth)
    } catch {
      return Alert.alert('Invalid amount', 'Enter a number greater than 0.')
    }

    setLoading(true)
    try {
      // 2️⃣ Lookup the username in Firestore to get the hex address
      const walletsRef = collection(db, 'wallets')
      const q = query(walletsRef, where('username', '==', username))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        Alert.alert('User not found', `No BlockPay user with username "${username}".`)
        setLoading(false)
        return
      }

      const data = querySnapshot.docs[0].data()
      const toAddress = data.address as string  // adjust field name if needed

      if (!isAddress(toAddress)) {
        Alert.alert('Invalid address', 'The recipient’s wallet address is invalid.')
        setLoading(false)
        return
      }

      // 3️⃣ JSON-RPC provider to your unlocked Geth
      const rpcProvider = new JsonRpcProvider(RPC_URL)

      // 4️⃣ Use default signer (no ENS lookup)
      const signer = rpcProvider.getSigner()

      // 5️⃣ Instantiate contract with that signer
      const blockPay = new Contract(
        CONTRACT_ADDRESS,
        BlockPayArtifact.abi,
        await signer
      )

      // 6️⃣ Send tx with the fetched hex address
      const tx = await blockPay.sendPayment(toAddress, { value })
      Alert.alert('Transaction Sent', tx.hash)

      // 7️⃣ Wait for confirmation
      const receipt = await tx.wait()
      Alert.alert(
        'Confirmed',
        `✅ Sent ${amountEth} ETH from\n${senderAddress}\nto\n${toAddress}\nin block ${receipt.blockNumber}`
      )
    } catch (err: any) {
      console.error(err)
      Alert.alert('Error', err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Recipient username"
        autoCapitalize="none"
        value={receiver}
        onChangeText={setReceiver}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount (in ETH)"
        keyboardType="decimal-pad"
        value={amountEth}
        onChangeText={setAmountEth}
      />

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Send On-Chain" onPress={handleSend} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
})
