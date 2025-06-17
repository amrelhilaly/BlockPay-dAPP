// ConnectWalletScreen.tsx
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import {
  useAppKit,
  useAppKitAccount,
  useDisconnect,
} from '@reown/appkit-ethers-react-native'
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { db, auth } from '../firebase/firebase'
import { hashWallet } from '../utils/hash'
import type { RootStackParamList } from '../navigation/Stack'
import Feather from 'react-native-vector-icons/Feather'
import { useNavigation } from '@react-navigation/native'

type Props = NativeStackScreenProps<RootStackParamList, 'ConnectWallet'>

const HEADER_BASE_HEIGHT = 56

export default function ConnectWalletScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const headerHeight = insets.top + HEADER_BASE_HEIGHT
  const nav = useNavigation();
  
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { disconnect } = useDisconnect()

   // --- reset connect‐module on mount so open() always shows the "connect new" flow ---
  useEffect(() => {
   disconnect()
 }, [disconnect])

  const [username, setUsername] = useState('')
  const [requestedConnect, setRequestedConnect] = useState(false)

  // ensure username not already used
  const isUsernameUnique = async (name: string): Promise<boolean> => {
    const q = query(
      collection(db, 'wallets'),
      where('username', '==', name.trim())
    )
    const snap = await getDocs(q)
    return snap.empty
  }

  // STEP 1: tap Connect
  const handleConnect = async () => {
    const name = username.trim()
    if (!name) {
      return Alert.alert(
        'Username required',
        'Please enter a username before connecting.'
      )
    }

    let unique = false
    try {
      unique = await isUsernameUnique(name)
    } catch (e) {
      console.error('Username check failed', e)
      return Alert.alert('Error', 'Could not verify username uniqueness.')
    }

    if (!unique) {
      return Alert.alert('Username taken', 'That username is already in use.')
    }

    setRequestedConnect(true)
    try {
      await open()
    } catch (err) {
      console.error('Wallet connection failed', err)
      Alert.alert('Wallet connection failed.')
      setRequestedConnect(false)
    }
  }

  // STEP 2: when WalletConnect returns, save and navigate
  const handleSave = async (walletAddr: string) => {
    const name = username.trim()
    const user = auth.currentUser
    if (!user) {
      return Alert.alert('Not authenticated', 'Please log in again.')
    }

    try {
      await addDoc(collection(db, 'wallets'), {
        uid:       user.uid,
        username:  name,
        wallet:    hashWallet(walletAddr.trim()),
        address:   walletAddr.trim(),
        createdAt: new Date(),
      })
      navigation.replace('MainTabs')
    } catch (err) {
      console.error('Failed to save wallet', err)
      Alert.alert('Error', 'Failed to save wallet. Try again.')
    }
  }

  // only fire once user actually requested a connection
  useEffect(() => {
    if (requestedConnect && isConnected && address) {
      handleSave(address)
    }
  }, [requestedConnect, isConnected, address])

  return (
  <SafeAreaView style={styles.container}>
    {/* APP HEADER */}
    <View
      style={[
        styles.header,
        { paddingTop: insets.top, height: headerHeight },
      ]}
    >
      <Text style={styles.headerTitle}>Add Wallet</Text>
    </View>

    <ScrollView
      contentContainerStyle={{
        paddingTop: headerHeight,
        paddingHorizontal: 20,
        paddingBottom: 40,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* STEP 1 */}
      <Text style={styles.stepLabel1}>
        Step 1: Create a Wallet Username
      </Text>
      <TextInput
        style={styles.usernameInput}
        placeholder="Wallet Username"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
      />
      <Text style={styles.note}>Must be unique</Text>

      {/* STEP 2 */}
      <Text style={[styles.stepLabel2, { marginTop: 32 }]}>
        Step 2: Connect Wallet Provider
      </Text>
      <View style={styles.buttonsColumn}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.connectBtn]}
          onPress={handleConnect}
        >
          <Text style={styles.connectText}>Connect</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.skipBtn]}
          onPress={() => navigation.replace('MainTabs')}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </SafeAreaView>
)

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
  },

  stepLabel1: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 30,
    marginBottom: 12,
    color: '#333',
  },
  stepLabel2: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 30,
    marginBottom: 12,
    color: '#333',
  },
  usernameInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Manrope_500Medium',
    color: '#000',
  },
  note: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    marginLeft: 16,
  },

  buttonsColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 12,
  },
  actionBtn: {
    width: '60%',           // fixed width so it’s nicely centered
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginVertical: 8,      // space between Connect & Skip
  },
  connectBtn: {
    backgroundColor: '#3b82f6',
  },
  skipBtn: {
    backgroundColor: '#ef4444',
  },
  connectText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  skipText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    color: '#fff',
  },
})
