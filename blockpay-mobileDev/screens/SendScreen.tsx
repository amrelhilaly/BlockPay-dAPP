// SendScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
  Animated,
  Modal
} from 'react-native'
import Feather from 'react-native-vector-icons/Feather'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/Stack'
import { getAuth } from 'firebase/auth'
import {
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth'
import { db } from '../firebase/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import {
  parseEther,
  JsonRpcProvider,
  Contract,
  formatEther,
} from 'ethers'
import {
  useAppKitAccount,
  useDisconnect,
} from '@reown/appkit-ethers-react-native'
import BlockPayArtifact from '../abi/BlockPay.json'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Camera, CameraView } from 'expo-camera'
import AsyncStorage from '@react-native-async-storage/async-storage'
import WalletTileDetV from '../components/WalletTile_DetV'
import { KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native'

type Props = NativeStackNavigationProp<RootStackParamList, 'SendScreen'>

type Wallet = {
  id: string
  username: string
  address: string
  bgIndex: number
}
  const HEADER_H = 56


export default function SendScreen() {
  const navigation = useNavigation<Props>()
  const { address: liveAddress, isConnected } = useAppKitAccount()
  const { disconnect } = useDisconnect()

  // — camera scanning state —
  const [scanning, setScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  // — safe area inset for header —
  const insets = useSafeAreaInsets()
  const headerHeight = insets.top + HEADER_H

  // — multi-wallet state —
  const [storedAddress,  setStoredAddress]  = useState<string|null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [showSwitcher, setShowSwitcher] = useState(false)

  const dropdownAnim = useRef(new Animated.Value(0)).current
  const MAX_HEIGHT = 150
  const [dropdownVisible, setDropdownVisible] = useState(false)

  const selectWallet = (id: string) => {
    Animated.timing(dropdownAnim, { toValue:0, duration:200, useNativeDriver:false })
      .start(async () => {
        const w = wallets.find(w => w.id === id)
        if (w) {
          setActiveId(w.id)
          setStoredAddress(w.address)
          // persist the choice:
        }
        setDropdownVisible(false)
      })
  }
  
  // — form state —
  const [receiverUsername, setReceiverUsername] = useState('')
  const [amountEth, setAmountEth] = useState('')
  const [loading, setLoading] = useState(false)

  // — on-chain balance —
  const [balance, setBalance] = useState('0.0')

  const auth = getAuth()
const [showPwModal, setShowPwModal] = useState(false)
const [passwordInput, setPasswordInput] = useState('')

// helper to re‐authenticate
async function authenticateUser(password: string) {
  const user = auth.currentUser!
  const cred = EmailAuthProvider.credential(user.email!, password)
  await reauthenticateWithCredential(user, cred)
}



  // 0) Request camera permission once
  useEffect(() => {
    ;(async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  const toggleDropdown = () => {
      if (!dropdownVisible) {
        setDropdownVisible(true)
        Animated.timing(dropdownAnim, { toValue:1, duration:200, useNativeDriver:false }).start()
      } else {
        Animated.timing(dropdownAnim, { toValue:0, duration:200, useNativeDriver:false })
          .start(() => setDropdownVisible(false))
      }
    }

    const dropdownHeight = dropdownAnim.interpolate({
    inputRange: [0,1],
    outputRange: [0, MAX_HEIGHT],
  })

  // 1) Fetch wallets from Firestore
  const fetchWallets = useCallback(async () => {
    const uid = getAuth().currentUser?.uid
    if (!uid) return
    const snap = await getDocs(
      query(collection(db, 'wallets'), where('uid', '==', uid))
    )
    const list = snap.docs.map((d, i) => ({
      id: d.id,
      username: d.data().username as string,
      address: d.data().address as string,
      bgIndex: i % 4,
    }))
    setWallets(list)
    if (list.length) {
      setActiveId((id) => id || list[0].id)
    }
  }, [])

  useEffect(() => {
    fetchWallets()
  }, [fetchWallets])
  useFocusEffect(useCallback(() => {
    fetchWallets()
  }, [fetchWallets]))

  // 2) Fetch on-chain balance of the active wallet
  const fetchBalance = useCallback(async () => {
    const active = wallets.find((w) => w.id === activeId)
    if (!active) {
      setBalance('0.00')
      return
    }
    try {
      const raw = await new JsonRpcProvider(
        'http://192.168.100.129:8546'
      ).getBalance(active.address)
      const eth = parseFloat(formatEther(raw))
      setBalance(eth.toFixed(2))
    } catch {
      setBalance('0.00')
    }
  }, [wallets, activeId])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])
  useFocusEffect(useCallback(() => {
    fetchBalance()
  }, [fetchBalance]))

  // 3) Send logic
  const handleSend = async () => {
  const name = receiverUsername.trim()
  if (!name) {
    return Alert.alert(
      'Invalid username',
      'Please enter or scan a username.'
    )
  }
  let value
  try {
    value = parseEther(amountEth)
  } catch {
    return Alert.alert(
      'Invalid amount',
      'Enter a number greater than 0.'
    )
  }

  setLoading(true)
  try {
    // lookup recipient
    const walletsRef = collection(db, 'wallets')
    const qs = await getDocs(
      query(walletsRef, where('username', '==', name))
    )
    if (qs.empty) throw new Error(`No user "${name}"`)
    const data = qs.docs[0].data()
    const toAddr = data.address as string

    // on-chain send
    const provider = new JsonRpcProvider(
      'http://192.168.100.129:8546'
    )
    const signer = provider.getSigner()
    const fromAddress = await (await signer).getAddress()

    const blockPay = new Contract(
      '0x5B1259E016527E82F02Fd0e9d4A90267C9A971A3',
      BlockPayArtifact.abi,
      await signer
    )
    const tx = await blockPay.sendPayment(toAddr, { value })
    const receipt = await tx.wait()

    // ← NEW: persist to Firestore
    const uid = auth.currentUser?.uid
if (uid) {
  await addDoc(collection(db, 'transactions'), {
    uid,
    type: 'Ethereum',
    description: `Sent to @${name}`,
    amount: `-${amountEth} ETH`,
    timestamp: serverTimestamp(),
    from: fromAddress,
    to: toAddr
  }
)
}
  console.log('Transaction logged:', { from: fromAddress, to: toAddr, amount: amountEth, blockNumber: receipt.blockNumber } )

    Alert.alert(
      'Confirmed',
      `✅ Sent ${amountEth} ETH\nfrom ${fromAddress}\nto ${toAddr}\nin block ${receipt.blockNumber}`
    )
  } catch (err: any) {
    Alert.alert('Error', err.message || 'Oops')
  } finally {
    setLoading(false)
  }
}

  const activeWallet = wallets.find((w) => w.id === activeId)

  // — only *after* all hooks are called do we conditionally early-return for scanning —
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
          <Text>
            No access to camera. Please enable it in settings.
          </Text>
        </View>
      )
    }
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          onBarcodeScanned={({ type, data }) => {
            setScanning(false)
            setReceiverUsername(data)
          }}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
    )
  }

  // — main render —
  return (
  <SafeAreaView style={styles.safe}>
    {/* HEADER */}
    <View
      style={[
        styles.header,
        { paddingTop: insets.top, height: headerHeight },
      ]}
    >
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Feather name="chevron-left" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Send Payment</Text>
      <View style={{ width: 24, marginRight: 12 }} />
    </View>

    {/* CONTENT + KEYBOARD AVOIDANCE */}
    <KeyboardAvoidingView
       enabled={!showPwModal}  
       behavior={Platform.OS === 'ios' ? 'position' : 'height'}
       keyboardVerticalOffset={2}   // ← extra offset
     >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* FROM */}
        <Text style={styles.label}>From:</Text>
        <View style={styles.tileWrapper}>
          <View style={styles.walletSection}>
            {activeWallet && (
              <WalletTileDetV wallet={activeWallet} />
            )}
            {wallets.length > 1 && (
              <TouchableOpacity
                style={styles.switchBtn}
                onPress={toggleDropdown}
              >
                <Text style={styles.switchText}>
                  Switch Wallet ▼
                </Text>
              </TouchableOpacity>
            )}
            {dropdownVisible && (
              <Animated.View
                style={[
                  styles.dropdown,
                  { maxHeight: dropdownHeight },
                ]}
              >
                <ScrollView>
                  {wallets.map((w) => (
                    <TouchableOpacity
                      key={w.id}
                      style={styles.dropdownItem}
                      onPress={() => selectWallet(w.id)}
                    >
                      <Text style={styles.dropdownText}>
                        @{w.username}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            )}
          </View>
        </View>

        {/* BALANCE */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceText}>
            Balance:{' '}
            <Text style={styles.balanceValue}>
              {balance} ETH
            </Text>
          </Text>
        </View>

        {/* TO */}
        <Text style={[styles.label, { marginTop: 16 }]}>
          To:
        </Text>
        <View style={styles.recipientRow}>
          <Text style={styles.at}>@</Text>
          <TextInput
            style={styles.recipientInput}
            placeholder="Wallet username"
            autoCapitalize="none"
            value={receiverUsername}
            onChangeText={setReceiverUsername}
          />
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => {
              if (hasPermission) setScanning(true)
              else
                Alert.alert(
                  'Camera permission',
                  'Allow camera access to scan QR.'
                )
            }}
          >
            <Feather name="camera" size={20} color="#757575" />
          </TouchableOpacity>
        </View>

        {/* AMOUNT */}
        <View style={styles.amountRow}>
          <View style={styles.amountBox}>
            <Text style={styles.currency}>ETH</Text>
          </View>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            keyboardType="decimal-pad"
            value={amountEth}
            onChangeText={setAmountEth}
          />
        </View>

        {/* SEND BUTTON */}
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={ () => setShowPwModal(true) }
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendTxt}>
              Send On-Chain
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
    <Modal
  transparent
  animationType="fade"
  visible={showPwModal}
  onRequestClose={() => setShowPwModal(false)}
>
  <TouchableWithoutFeedback onPress={() => setShowPwModal(false)}>
    <View style={styles.modalOverlay}/>
  </TouchableWithoutFeedback>

  <View style={styles.pwModalContent}>
    <Text style={styles.pwTitle}>Confirm Password</Text>
    <TextInput
      style={styles.pwInput}
      placeholder="Enter your password"
      placeholderTextColor={styles.pwInputText.color}
      secureTextEntry
      value={passwordInput}
      onChangeText={setPasswordInput}
    />
    <View style={styles.pwBtnsRow}>
      <TouchableOpacity
        style={[styles.pwBtn, styles.pwCancel]}
        onPress={() => {
          setShowPwModal(false)
          setPasswordInput('')
        }}
      >
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.pwBtn, styles.pwConfirm]}
        onPress={async () => {
          try {
            setLoading(true)
            await authenticateUser(passwordInput)
            setShowPwModal(false)
            setPasswordInput('')
            await handleSend()
          } catch {
            Alert.alert('Authentication failed','Wrong password.')
          } finally {
            setLoading(false)
          }
        }}
      >
        <Text style={styles.pwBtnText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
  </SafeAreaView>
)
}

const styles = StyleSheet.create({
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  opacity: 0.8,
},
pwModalContent: {
  position: 'absolute',
  top: '30%',
  left: '10%',
  right: '10%',
  backgroundColor: '#fff',
  borderRadius: 20,
  padding: 20,
  elevation: 5,
},
pwTitle: {
  fontFamily: 'Manrope_700Bold',
  fontSize: 18,
  marginBottom: 12,
  textAlign: 'center',
},
pwInput: {
  borderWidth: 1,
  borderColor: '#F2F2F2',
  backgroundColor: '#F2F2F2',
  borderRadius: 20,
  paddingHorizontal: 12,
  paddingVertical: 8,
  fontSize: 16,
  
  marginBottom: 20,
},
pwInputText: {
  color: '#333',
},
pwBtnsRow: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
},
pwBtn: {
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 6,
  marginLeft: 12,
},
pwCancel: {
  backgroundColor: '#f3f4f6',
},
pwConfirm: {
  backgroundColor: '#3b82f6',
},
cancelBtnText: {
  fontSize: 16,
  color: '#000',
  fontFamily: 'Manrope_700Bold',
},
pwBtnText: {
  fontSize: 16,
  color: '#fff',
  fontFamily: 'Manrope_700Bold',
},
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tileWrapper: { width:'100%', alignSelf:'center' },
  switchBtn: {
    position:'absolute', top:16, alignSelf:'center',
    backgroundColor:'#fff', paddingHorizontal:16, paddingVertical:8,
    borderRadius:20, elevation:4,
    shadowColor:'#000', shadowOffset:{width:0,height:2},
    shadowOpacity:0.2, shadowRadius:4, zIndex:10,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
    zIndex: 10,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
  },

  content: {
    paddingTop: HEADER_H + 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  label: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 30,
    color: '#333',
    marginBottom: 15,
  },

  walletSection: {
    width: '100%',
    alignItems: 'center',
  },
  switcher: {
    position: 'absolute',
    top: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 20,
  },
  switchText: {
    fontFamily: 'Manrope_700Bold',
    color: '#5392FF',
  },
  dropdown: {
    position: 'absolute',
    top: 56,
    width: '60%',
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 200,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 30,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  dropdownText: {
    fontFamily: 'Manrope_700Bold',
    color: '#333',
  },
  balanceSection: {
    alignItems: 'center',
    marginTop: 2,
  },
  balanceText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 20,
    color: '#333',
  },
  balanceValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 24,
  },

  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  at: {
    fontSize: 40,
    marginRight: 4,
    color: '#555',
    fontFamily: 'Manrope_700Bold',
  },
  recipientInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    borderRadius: 20,
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 12,
    fontSize: 20,
    fontFamily: 'Manrope_700Bold',
    color: '#757575',
  },
  scanBtn: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    
  },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  amountBox: {
    width: 170,
    height: 90,
    backgroundColor: '#F2F2F2',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currency: {
    fontFamily: 'Manrope_700Bold',
    color: '#757575',
    fontSize: 50,
  },
  amountInput: {
    flex: 1,
    height: 90,
    borderWidth: 1,
    backgroundColor: '#F2F2F2',
    borderColor: '#F2F2F2',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 12,
    fontSize: 50,
    fontFamily: 'Manrope_700Bold',
    color: '#757575',
    textAlign: 'center',},

  sendBtn: {
    backgroundColor: '#1C8BD1',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  sendTxt: {
    color: '#fff',
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
})
