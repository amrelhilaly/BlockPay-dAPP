// Dashboard.tsx

import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  useAppKitAccount,
  useAppKitState,
  useDisconnect,
} from '@reown/appkit-ethers-react-native'
import { JsonRpcProvider, formatEther } from 'ethers'
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db, auth } from '../firebase/firebase'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/Stack'

import WalletTile from '../components/WalletTile'
import NavBar     from '../components/Navbar'

// --- TYPES ---
type NavProp       = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>
type OtherWallet   = { type: 'Ethereum' | 'Bitcoin'; address: string; balance: string }
type Transaction   = { type: 'Ethereum' | 'Bitcoin'; description: string; amount: string }
type SectionItem   = OtherWallet | Transaction
type UserWallet    = { id: string; username: string; address: string }

// --- DUMMY DATA FOR OTHER WALLETS ---
const otherWallets: OtherWallet[] = [
  { type: 'Ethereum', address: '0x42…789', balance: '0.5 ETH' },
  { type: 'Bitcoin',  address: '0x1A…234', balance: '0.1 BTC' },
]

export default function Dashboard() {
  const insets               = useSafeAreaInsets()
  const navigation           = useNavigation<NavProp>()
  const { address: liveAddress } = useAppKitAccount()
  const { selectedNetworkId }    = useAppKitState()
  const { disconnect }           = useDisconnect()

  // — multi-wallet state —
  const [wallets,        setWallets]        = useState<UserWallet[]>([])
  const [activeWalletId, setActiveWalletId] = useState<string>('')
  const [showSwitcher,   setShowSwitcher]   = useState<boolean>(false)

  // — UI state for the *active* wallet —
  const [storedAddress,     setStoredAddress]     = useState<string|null>(null)
  const [username,          setUsername]          = useState<string>('')
  const [balance,           setBalance]           = useState<string>('0')
  const [error,             setError]             = useState<string>('')
  const [refreshing,        setRefreshing]        = useState<boolean>(false)
  const [transactionsList,  setTransactionsList]  = useState<Transaction[]>([])

  // Clear on disconnect
  useEffect(() => {
    if (!liveAddress) {
      setStoredAddress(null)
      setUsername('')
      setBalance('0')
    }
  }, [liveAddress])

  // Fetch *all* user wallets on mount & focus
  const fetchUserWallets = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    const walletsQ = query(
      collection(db, 'wallets'),
      where('uid', '==', uid),
    )
    const snap = await getDocs(walletsQ)
    const fetched = snap.docs.map(docSnap => ({
      id:       docSnap.id,
      username: docSnap.data().username as string,
      address:  docSnap.data().address as string,
    }))

    setWallets(fetched)
    if (fetched.length > 0) {
      setActiveWalletId(fetched[0].id)
      setUsername(fetched[0].username)
      setStoredAddress(fetched[0].address)
    }
  }, [])

  useEffect(() => { fetchUserWallets() }, [fetchUserWallets])
  useFocusEffect(useCallback(() => { fetchUserWallets() }, [fetchUserWallets]))

  // Switch wallet
  function selectWallet(id: string) {
    const w = wallets.find(w => w.id === id)
    if (!w) return
    setActiveWalletId(id)
    setUsername(w.username)
    setStoredAddress(w.address)
    setShowSwitcher(false)
  }

  // Fetch on-chain balance for the active address
  const fetchBalance = useCallback(async () => {
    const addr = liveAddress || storedAddress
    if (!addr) {
      setBalance('0')
      return
    }
    try {
      const provider = new JsonRpcProvider('http://192.168.100.129:8546')
      const raw      = await provider.getBalance(addr)
      setBalance(formatEther(raw))
      setError('')
    } catch {
      setError('Network unreachable')
    }
  }, [liveAddress, storedAddress])

  // Fetch recent transactions
  const fetchTransactions = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const txQ = query(
      collection(db, 'transactions'),
      where('uid','==',uid),
      orderBy('timestamp','desc'),
      limit(20)
    )
    const snap = await getDocs(txQ)
    setTransactionsList(
      snap.docs.map(d => ({
        type:        d.data().type as 'Ethereum'|'Bitcoin',
        description: d.data().description as string,
        amount:      d.data().amount as string,
      }))
    )
  }, [])

  // Trigger fetch on mount, focus, or address change
  useEffect(() => { fetchBalance(); fetchTransactions() }, [fetchBalance, fetchTransactions])
  useFocusEffect(useCallback(() => { fetchBalance(); fetchTransactions() }, [fetchBalance, fetchTransactions]))

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchBalance(), fetchTransactions()])
    setRefreshing(false)
  }, [fetchBalance, fetchTransactions])

  // Display logic
  const displayAddress  = liveAddress || storedAddress || 'Not connected'
  const walletConnected = displayAddress !== 'Not connected'
  const HEADER_HEIGHT     = 56
  const headerTotalHeight = insets.top + HEADER_HEIGHT

  const sections: { title: string; data: SectionItem[] }[] = [
    { title: 'Other wallets',       data: otherWallets },
    { title: 'Recent transactions', data: transactionsList },
  ]

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top, height: headerTotalHeight }]}>
        <Text style={styles.headerTitle}>BlockPay</Text>
      </View>

      {/* CONTENT */}
      <SectionList
        sections={sections}
        keyExtractor={(_, idx) => idx.toString()}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingTop: 80, paddingBottom: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}

        ListHeaderComponent={() => (
          <>
            {refreshing && (
              <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 8 }} />
            )}

            {/* WalletTile with overlayed switcher */}
            <View style={styles.walletTileSection}>
              <View style={styles.walletTileWrapper}>
                <View>
                  <WalletTile address={displayAddress} isConnected={walletConnected} />

                  {wallets.length > 1 && (
                    <TouchableOpacity
                      style={styles.tileSwitcher}
                      onPress={() => setShowSwitcher(v => !v)}
                    >
                      <Text style={styles.tileSwitcherText}>Switch Wallet ▼</Text>
                    </TouchableOpacity>
                  )}

                  {showSwitcher && (
                    <View style={styles.tileDropdown}>
                      {wallets.map(w => (
                        <TouchableOpacity
                          key={w.id}
                          style={styles.dropdownItem}
                          onPress={() => selectWallet(w.id)}
                        >
                          <Text style={styles.dropdownText}>@{w.username}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Wallet Info */}
            <View style={styles.walletInfoSection}>
              <Text style={styles.walletInfoText}>
                Wallet:{' '}
                <Text style={styles.walletInfoValue}>@{username || '— not set —'}</Text>
              </Text>
              <Text style={styles.walletInfoText}>
                Balance:{' '}
                <Text style={styles.walletInfoValue}>
                  {error ? error : `${balance} ETH`}
                </Text>
              </Text>
              <Text style={styles.walletInfoText}>
                Chain ID:{' '}
                <Text style={styles.walletInfoValue}>{selectedNetworkId}</Text>
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionButton, styles.send]} onPress={() => navigation.navigate('SendScreen')}>
                <Text style={styles.actionText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.receive]} onPress={() => navigation.navigate('ReceiveScreen')}>
                <Text style={styles.actionText}>Receive</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, walletConnected ? styles.disconnect : styles.connect]}
                onPress={() => (walletConnected ? disconnect() : navigation.navigate('ConnectWallet'))}
              >
                <Text style={styles.actionText}>
                  {walletConnected ? 'Disconnect' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}

        renderItem={({ item }) => {
          if ('balance' in item) {
            // Other wallet
            return (
              <View style={styles.itemRow}>
                <Image source={require('../assets/ethicon.png')} style={styles.walletIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fontedText}>{item.type}</Text>
                  <Text style={[styles.fontedText, styles.smallText]}>{item.address}</Text>
                </View>
                <Text style={[styles.fontedText, styles.balanceText]}>{item.balance}</Text>
              </View>
            )
          } else {
            // Transaction
            return (
              <View style={styles.itemRow}>
                <Image source={require('../assets/ethicon.png')} style={styles.walletIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fontedText}>{item.type}</Text>
                  <Text style={[styles.fontedText, styles.smallText]}>{item.description}</Text>
                </View>
                <Text
                  style={[
                    styles.fontedText,
                    styles.balanceText,
                    item.amount.startsWith('+') ? styles.positive : styles.negative,
                  ]}
                >
                  {item.amount}
                </Text>
              </View>
            )
          }
        }}
      />

      {/* NAV BAR */}
      <NavBar />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    position:          'absolute',
    top:               0,
    left:              0,
    right:             0,
    backgroundColor:   '#fff',
    borderBottomWidth: 0.5,
    borderColor:       '#ddd',
    alignItems:        'center',
    justifyContent:    'center',
    zIndex:            10,
  },
  headerTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize:   20,
  },

  walletTileSection: {
    alignItems: 'center',
  },
  walletTileWrapper: {
    width:         '90%',
    alignSelf:     'center',
    paddingVertical: 1,
  },

  // overlayed switcher on the tile
  tileSwitcher: {
    position:          'absolute',
    top:               8,
    alignSelf:         'center',
    backgroundColor:   'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      12,
    zIndex:            10,
  },
  tileSwitcherText: {
    color:      '#fff',
    fontSize:   14,
    fontWeight: '500',
  },

  tileDropdown: {
    position:        'absolute',
    top:             40,
    alignSelf:       'center',
    backgroundColor: '#fff',
    borderRadius:    8,
    elevation:       4,
    width:           '60%',
    maxHeight:       200,
    zIndex:          10,
  },
  dropdownItem: {
    paddingVertical:   12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor:      '#eee',
  },
  dropdownText: {
    fontSize: 16,
    color:    '#333',
  },

  walletInfoSection: {
    alignItems: 'center',
    marginTop:  12,
  },
  walletInfoText: {
    fontFamily: 'Manrope_500Medium',
    fontSize:   18,
    color:      '#333',
    textAlign:  'center',
  },
  walletInfoValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize:   22,
    color:      '#000',
  },

  actionRow: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    marginHorizontal: 20,
    marginTop:        16,
    marginBottom:     24,
  },
  actionButton: {
    flex:             1,
    paddingVertical:  12,
    borderRadius:     24,
    alignItems:       'center',
    marginHorizontal: 4,
  },
  actionText: {
    fontFamily: 'Manrope_700Bold',
    fontSize:   16,
    color:      '#fff',
  },
  send:       { backgroundColor: '#3b82f6' },
  receive:    { backgroundColor: '#10b981' },
  disconnect: { backgroundColor: '#ff7f7f' },
  connect:    { backgroundColor: '#22c55e' },

  sectionHeader: {
    marginHorizontal: 20,
    marginTop:       16,
  },
  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize:   16,
    color:      '#333',
  },

  itemRow: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingVertical:  12,
    marginHorizontal: 20,
    borderBottomWidth:1,
    borderColor:      '#ececec',
  },
  walletIcon:{ width: 24, height: 24, marginRight: 12 },
  fontedText: { fontFamily: 'Manrope_500Medium', color: '#333' },
  smallText:  { fontSize: 12, color: '#888', marginTop: 2 },
  balanceText:{ marginLeft: 'auto', fontWeight: '600' },
  positive:   { color: '#10b981' },
  negative:   { color: '#ef4444' },
})
