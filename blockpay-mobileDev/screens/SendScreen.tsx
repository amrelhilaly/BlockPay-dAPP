// SendScreen.tsx

import React, { useState, useEffect } from 'react'
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
  JsonRpcSigner,
} from 'ethers'
import { Camera, CameraView } from 'expo-camera'
import { useAppKitAccount } from '@reown/appkit-ethers-react-native'
import BlockPayArtifact from '../abi/BlockPay.json'

// Firestore imports for username ↔ address lookup & transaction logging
import { db, auth } from '../firebase/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'

const CONTRACT_ADDRESS = '0x77f68AA0a8247f427Da41a12dcD01AA8d10c119c'
const RPC_URL          = 'http://192.168.100.129:8546'

export default function SendScreen() {
  const { isConnected } = useAppKitAccount()
  const [receiverUsername, setReceiverUsername] = useState('')
  const [amountEth, setAmountEth]               = useState('')
  const [loading, setLoading]                   = useState(false)
  const [scanning, setScanning]                 = useState(false)
  const [hasPermission, setHasPermission]       = useState<boolean|null>(null)

  // request camera permission on mount
  useEffect(() => {
    ;(async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  // barcode scanned handler
  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanning(false)
    setReceiverUsername(data)
  }

  // show camera view when scanning
  if (scanning) {
    if (hasPermission === null) {
      return (
        <View style={styles.centered}>
          <Text>Requesting camera permission…</Text>
        </View>
      )
    }
    if (!hasPermission) {
      return (
        <View style={styles.centered}>
          <Text>No access to camera. Please enable it in settings.</Text>
        </View>
      )
    }
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
    )
  }

  if (!isConnected) {
    return (
      <View style={styles.centered}>
        <Text>Please connect your wallet first.</Text>
      </View>
    )
  }

  const handleSend = async () => {
    const username = receiverUsername.trim()
    if (!username) {
      return Alert.alert('Invalid username', 'Please enter or scan a username.')
    }

    let value
    try {
      value = parseEther(amountEth)
    } catch {
      return Alert.alert('Invalid amount', 'Enter a number greater than 0.')
    }

    setLoading(true)
    const senderUid = auth.currentUser?.uid
    try {
      // lookup recipient
      const walletsRef = collection(db, 'wallets')
      const q          = query(walletsRef, where('username', '==', username))
      const qs         = await getDocs(q)
      if (qs.empty) throw new Error(`No user "${username}"`)
      const { address: toAddress, uid: recipientUid } = qs.docs[0].data()

      if (!isAddress(toAddress)) throw new Error('Invalid recipient address')

      // send on-chain
      const rpcProvider: JsonRpcProvider = new JsonRpcProvider(RPC_URL)
      const signer: JsonRpcSigner       = await rpcProvider.getSigner()
      const fromAddress                 = await signer.getAddress()
      const blockPay                    = new Contract(
        CONTRACT_ADDRESS,
        BlockPayArtifact.abi,
        signer
      )
      const tx      = await blockPay.sendPayment(toAddress, { value })
      const receipt = await tx.wait()

      Alert.alert(
        'Confirmed',
        `✅ Sent ${amountEth} ETH\nfrom ${fromAddress}\nto ${toAddress}\nin block ${receipt.blockNumber}`
      )

      // lookup sender’s username
      let myName = '— you'
      if (senderUid) {
        const meQ    = query(walletsRef, where('uid', '==', senderUid))
        const meSnap = await getDocs(meQ)
        if (!meSnap.empty) myName = meSnap.docs[0].data().username
      }

      // log “sent”
      if (senderUid) {
        await addDoc(collection(db, 'transactions'), {
          uid:         senderUid,
          type:        'Ethereum',
          description: `Sent to ${username}`,
          amount:      `-${amountEth} ETH`,
          txHash:      tx.hash,
          timestamp:   serverTimestamp(),
          success:     true,
        })
      }
      // log “received”
      await addDoc(collection(db, 'transactions'), {
        uid:         recipientUid,
        type:        'Ethereum',
        description: `Received from @${myName}`,
        amount:      `+${amountEth} ETH`,
        txHash:      tx.hash,
        timestamp:   serverTimestamp(),
        success:     true,
      })
    } catch (err: any) {
      console.error(err)
      Alert.alert('Error', err.message || 'Something went wrong.')
      if (senderUid) {
        await addDoc(collection(db, 'transactions'), {
          uid:         senderUid,
          type:        'Ethereum',
          description: `Failed to send to ${receiverUsername}: ${err.message}`,
          amount:      `-${amountEth} ETH`,
          txHash:      null,
          timestamp:   serverTimestamp(),
          success:     false,
        })
      }
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
        value={receiverUsername}
        onChangeText={setReceiverUsername}
      />

      <Button
        title="Scan QR"
        onPress={() => {
          if (hasPermission) setScanning(true)
          else Alert.alert('Camera permission', 'Allow camera access to scan QR.')
        }}
      />

      <TextInput
        style={styles.input}
        placeholder="Amount (in ETH)"
        keyboardType="decimal-pad"
        value={amountEth}
        onChangeText={setAmountEth}
      />

      {loading
        ? <ActivityIndicator size="large" />
        : <Button title="Send On-Chain" onPress={handleSend} />
      }
    </View>
  )
}

const styles = StyleSheet.create({
  centered:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container:       { flex: 1, padding: 16, justifyContent: 'center', backgroundColor: '#fff' },
  input:           { height: 48, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
  scannerContainer:{ flex: 1, backgroundColor: '#000' },
})
