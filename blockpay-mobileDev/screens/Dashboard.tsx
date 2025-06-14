// screens/Dashboard.tsx

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
  LayoutAnimation,
  UIManager,
  Platform,
  ScrollView,                  // <— added
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
import type { BottomTabNavigationProp }   from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { TabParamList, RootStackParamList } from '../navigation/Stack'

import WalletTile from '../components/WalletTile'

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true)
}

// --- TYPES ---
type OtherWallet   = { type: 'Ethereum'|'Bitcoin'; address: string; balance: string }
type Transaction   = { type: 'Ethereum'|'Bitcoin'; description: string; amount: string }
type SectionItem   = OtherWallet | Transaction
type UserWallet    = { id: string; username: string; address: string; bgIndex: number }

// --- NAV HOOKS ---
const useTabNav  = () => useNavigation<BottomTabNavigationProp<TabParamList>>()
const useRootNav = () => useNavigation<NativeStackNavigationProp<RootStackParamList>>()

export default function Dashboard() {
  const insets           = useSafeAreaInsets()
  const tabNavigation    = useTabNav()
  const rootNavigation   = useRootNav()
  const { address: liveAddress } = useAppKitAccount()
  const { selectedNetworkId }    = useAppKitState()
  const { disconnect }           = useDisconnect()

  // — multi-wallet state —
  const [wallets,        setWallets]        = useState<UserWallet[]>([])
  const [activeWalletId, setActiveWalletId] = useState<string>('')
  const [showSwitcher,   setShowSwitcher]   = useState<boolean>(false)

  // — UI state for the *active* wallet —
  const [storedAddress,    setStoredAddress]    = useState<string|null>(null)
  const [username,         setUsername]         = useState<string>('')
  const [balance,          setBalance]          = useState<string>('0')
  const [error,            setError]            = useState<string>('')
  const [refreshing,       setRefreshing]       = useState<boolean>(false)
  const [transactionsList, setTransactionsList] = useState<Transaction[]>([])

  // 1) Load user wallets
  const fetchUserWallets = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    const snap = await getDocs(
      query(collection(db,'wallets'), where('uid','==',uid))
    )

    const fetched = snap.docs.map((doc, idx) => ({
      id:       doc.id,
      username: doc.data().username as string,
      address:  doc.data().address as string,
      bgIndex:  idx % 4,
    }))

    setWallets(fetched)

    if (fetched.length > 0) {
      const first = fetched[0]
      setActiveWalletId(first.id)
      setUsername(first.username)
      setStoredAddress(first.address)
    }
  }, [])

  useEffect(() => { fetchUserWallets() }, [fetchUserWallets])
  useFocusEffect(useCallback(() => { fetchUserWallets() }, [fetchUserWallets]))

  // 2) Animate dropdown
  const toggleSwitcher = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setShowSwitcher(v => !v)
  }
  const selectWallet = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    const w = wallets.find(w => w.id === id)
    if (!w) return
    setActiveWalletId(w.id)
    setUsername(w.username)
    setStoredAddress(w.address)
    setShowSwitcher(false)
  }

  // 3) Fetch on-chain balance
  const fetchBalance = useCallback(async () => {
    const addr = liveAddress || storedAddress
    if (!addr) {
      setBalance('0')
      return
    }
    try {
      const raw = await new JsonRpcProvider(
        'http://192.168.100.129:8546'
      ).getBalance(addr)
      setBalance(formatEther(raw))
      setError('')
    } catch {
      setError('Network unreachable')
    }
  }, [liveAddress, storedAddress])

  // 4) Fetch last 5 transactions
  const fetchTransactions = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    const snap = await getDocs(
      query(
        collection(db,'transactions'),
        where('uid','==',uid),
        orderBy('timestamp','desc'),
        limit(5)
      )
    )

    setTransactionsList(
      snap.docs.map(d => ({
        type:        d.data().type as 'Ethereum'|'Bitcoin',
        description: d.data().description as string,
        amount:      d.data().amount as string,
      }))
    )
  }, [])

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

  const active = wallets.find(w => w.id === activeWalletId)
  const bgIdx  = active?.bgIndex ?? 0

  const sections = [
    { title: 'Recent transactions', data: transactionsList },
  ] as { title: string; data: SectionItem[] }[]

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop:insets.top, height:headerTotalHeight }]}>
        <Text style={styles.headerTitle}>BlockPay</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(_,i)=>i.toString()}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingTop:80, paddingBottom:10 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }

        ListHeaderComponent={() => (
          <>
            {/* Wallet Tile + Switcher */}
            <View style={styles.walletTileSection}>
              <View style={styles.walletTileWrapper}>
                <WalletTile
                  address={displayAddress}
                  isConnected={walletConnected}
                  bgIndex={bgIdx}
                />

                {wallets.length>1 && (
                  <TouchableOpacity
                    style={styles.tileSwitcher}
                    onPress={toggleSwitcher}
                  >
                    <Text style={styles.tileSwitcherText}>
                      Switch Wallet ▼
                    </Text>
                  </TouchableOpacity>
                )}

                {showSwitcher && (
                  <ScrollView
                    style={styles.tileDropdown}
                    contentContainerStyle={styles.dropdownContent}
                  >
                    {wallets.map(w=>(
                      <TouchableOpacity
                        key={w.id}
                        style={styles.dropdownItem}
                        onPress={()=>selectWallet(w.id)}
                      >
                        <Text style={styles.dropdownText}>
                          @{w.username}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>

            {/* Wallet Info */}
            <View style={styles.walletInfoSection}>
              <Text style={styles.walletInfoText}>
                Wallet:{' '}
                <Text style={styles.walletInfoValue}>
                  @{username||'— not set —'}
                </Text>
              </Text>
              <Text style={styles.walletInfoText}>
                Balance:{' '}
                <Text style={styles.walletInfoValue}>
                  {error?error:`${balance} ETH`}
                </Text>
              </Text>
              <Text style={styles.walletInfoText}>
                Chain ID:{' '}
                <Text style={styles.walletInfoValue}>
                  {selectedNetworkId}
                </Text>
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.send]}
                onPress={()=> rootNavigation.navigate('SendScreen')}
              >
                <Text style={styles.actionText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.receive]}
                onPress={()=> rootNavigation.navigate('ReceiveScreen')}
              >
                <Text style={styles.actionText}>Receive</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  walletConnected ? styles.disconnect : styles.connect,
                ]}
                onPress={() => {
                  if (walletConnected) {
                    disconnect()
                  } else {
                    rootNavigation.navigate('ConnectWallet')
                  }
                }}
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
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Image
              source={require('../assets/ethicon.png')}
              style={styles.walletIcon}
            />
            <View style={{ flex:1 }}>
              <Text style={styles.fontedText}>{item.type}</Text>
              <Text style={[styles.fontedText, styles.smallText]}>
                {'address' in item ? item.address : item.description}
              </Text>
            </View>
            <Text
              style={[
                styles.fontedText,
                styles.balanceText,
                ('amount' in item && item.amount.startsWith('+'))
                  ? styles.positive
                  : styles.negative,
              ]}
            >
              {'amount' in item ? item.amount : ''}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:          { flex:1, backgroundColor:'#f5f5f5' },
  header:             {
    position:'absolute', top:0,left:0,right:0,
    backgroundColor:'#fff', borderBottomWidth:0.5,
    borderColor:'#ddd', alignItems:'center',
    justifyContent:'center', zIndex:10
  },
  headerTitle:        {
    fontFamily:'Manrope_700Bold', fontSize:20
  },

  walletTileSection:  { alignItems:'center', marginTop:10 },
  walletTileWrapper:  { width:'90%', alignSelf:'center' },

  tileSwitcher:       {
    position:'absolute', top:8, alignSelf:'center',
    backgroundColor:'#fff', paddingHorizontal:16,
    paddingVertical:8, borderRadius:20,
    elevation:6, shadowColor:'#000',
    shadowOffset:{width:0,height:2},
    shadowOpacity:0.25, shadowRadius:4,
    zIndex:10
  },
  tileSwitcherText:   {
    color:'#5392FF', fontSize:16,
    fontFamily:'Manrope_700Bold'
  },

  tileDropdown:       {
    position:'absolute', top:48, alignSelf:'center',
    backgroundColor:'#fff', borderRadius:12,
    elevation:4, width:'50%', maxHeight:150,
    zIndex:10
  },
  dropdownContent:    {
    // ensure items start at top
    paddingVertical: 4,
  },
  dropdownItem:       {
    paddingVertical:12, paddingHorizontal:16,
    borderBottomWidth:1, borderColor:'#eee'
  },
  dropdownText:       {
    fontSize:16, color:'#333',
    fontFamily:'Manrope_500Medium'
  },

  walletInfoSection:  { alignItems:'center', marginTop:16 },
  walletInfoText:     {
    fontFamily:'Manrope_500Medium', fontSize:18, color:'#333'
  },
  walletInfoValue:    {
    fontFamily:'Manrope_700Bold', fontSize:22, color:'#000'
  },

  actionRow:          {
    flexDirection:'row', justifyContent:'space-between',
    marginHorizontal:20, marginTop:24, marginBottom:16
  },
  actionButton:       {
    flex:1, paddingVertical:12, borderRadius:24,
    alignItems:'center', marginHorizontal:4
  },
  actionText:         {
    fontFamily:'Manrope_700Bold', fontSize:16, color:'#fff'
  },
  send:               { backgroundColor:'#3b82f6' },
  receive:            { backgroundColor:'#10b981' },
  disconnect:         { backgroundColor:'#ff7f7f' },
  connect:            { backgroundColor:'#22c55e' },

  sectionHeader:      { marginHorizontal:20, marginTop:16 },
  sectionTitle:       {
    fontFamily:'Manrope_700Bold', fontSize:16, color:'#333'
  },

  itemRow:            {
    flexDirection:'row', alignItems:'center',
    paddingVertical:12, marginHorizontal:20,
    borderBottomWidth:1, borderColor:'#ececec'
  },
  walletIcon:         { width:24, height:24, marginRight:12 },
  fontedText:         { fontFamily:'Manrope_500Medium', color:'#333' },
  smallText:          { fontSize:12, color:'#888', marginTop:2 },
  balanceText:        { marginLeft:'auto', fontWeight:'600' },
  positive:           { color:'#10b981' },
  negative:           { color:'#ef4444' },
})
