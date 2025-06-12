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

// ← your deployed BlockPay contract address
const CONTRACT_ADDRESS = '0x6d5B785674360b51875142c66dBFC4a5CC0B1226'
// ← your Geth RPC endpoint
const RPC_URL = 'http://192.168.100.129:8546'

export default function SendScreen() {
  const { address: senderAddress, isConnected } = useAppKitAccount()
  const [receiver, setReceiver] = useState('')
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
    // 1️⃣ Validate receiver
    // if (!isAddress(receiver)) {
    //   return Alert.alert('Invalid address', 'Please double-check the receiver.')
    // }

    // 2️⃣ Parse amount to wei
    let value
    try {
      value = parseEther(amountEth)
    } catch {
      return Alert.alert('Invalid amount', 'Enter a number greater than 0.')
    }

    setLoading(true)
    try {
      // 3️⃣ JSON-RPC provider to your unlocked Geth
      const rpcProvider = new JsonRpcProvider(RPC_URL)

      // 4️⃣ **await** here so signer is a JsonRpcSigner, not a Promise
      const signer = await rpcProvider.getSigner(senderAddress!)

      // 5️⃣ Instantiate contract with that signer
      const blockPay = new Contract(
        CONTRACT_ADDRESS,
        BlockPayArtifact.abi,
        signer
      )

      // 6️⃣ Send tx
      const tx = await blockPay.sendPayment(receiver, { value })
      Alert.alert('Transaction Sent', tx.hash)

      // 7️⃣ Wait for confirmation
      const receipt = await tx.wait()
      Alert.alert(
        'Confirmed',
        `✅ Sent ${amountEth} ETH from\n${senderAddress}\nto\n${receiver}\nin block ${receipt.blockNumber}`
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
        placeholder="Receiver address"
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
