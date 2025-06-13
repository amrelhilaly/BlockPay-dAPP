// ReceiveScreen.tsx

import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useAppKitAccount } from '@reown/appkit-ethers-react-native'
import { auth, db } from '../firebase/firebase'
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import QRCode from 'react-native-qrcode-svg'

export default function ReceiveScreen() {
  const { isConnected } = useAppKitAccount()
  const [loading, setLoading]   = useState(true)
  const [username, setUsername] = useState('')
  const [address, setAddress]   = useState('')

  useEffect(() => {
    if (!isConnected) return
    let cancelled = false

    ;(async () => {
      try {
        const uid = auth.currentUser?.uid
        if (!uid) throw new Error('Not authenticated')
        const walletsRef = collection(db, 'wallets')
        const q          = query(walletsRef, where('uid','==',uid))
        const snap       = await getDocs(q)
        if (cancelled) return
        if (!snap.empty) {
          const data = snap.docs[0].data()
          setUsername(data.username)
          setAddress(data.address)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [isConnected])

  if (!isConnected) {
    return (
      <View style={styles.centered}>
        <Text>Please connect to receive funds.</Text>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // Now we simply encode the username as QR payload
  const qrValue = username

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Receive on</Text>
      <Text style={styles.username}>@{username}</Text>

      <Text style={styles.subtitle}>Wallet address:</Text>
      <Text style={styles.address}>{address}</Text>

      <View style={styles.qrWrapper}>
        <QRCode
          value={qrValue}
          size={200}
        />
      </View>

      <Text style={styles.instruction}>
        Have the sender tap “Scan QR” and point their camera here to autofill @{username}.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    alignItems:      'center',
    padding:         24,
    backgroundColor: '#fff',
  },
  centered: {
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
    backgroundColor:'#fff',
  },
  title: {
    fontSize:   18,
    fontWeight: '500',
    color:      '#333',
    marginTop:  16,
  },
  username: {
    fontSize:     28,
    fontWeight:   '700',
    marginBottom: 24,
    color:        '#000',
  },
  subtitle: {
    fontSize:   16,
    fontWeight: '500',
    color:      '#555',
  },
  address: {
    fontSize:     14,
    fontWeight:   '400',
    marginBottom: 32,
    textAlign:    'center',
    color:        '#222',
  },
  qrWrapper: {
    padding:        16,
    borderWidth:    1,
    borderColor:    '#ddd',
    borderRadius:   8,
    backgroundColor:'#fafafa',
  },
  instruction: {
    marginTop:       24,
    fontSize:        14,
    textAlign:       'center',
    color:           '#666',
    paddingHorizontal:16,
  },
})
