// screens/Dashboard.tsx

import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Animated,
  Platform,
  UIManager,
  ScrollView,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
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
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp }   from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { TabParamList, RootStackParamList } from '../navigation/Stack'

import WalletTile from '../components/WalletTile'

// Enable Android LayoutAnimation if you ever reintroduce it
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true)
}

const ACTIVE_WALLET_KEY = 'ACTIVE_WALLET_ID'

type Transaction = { type: 'Ethereum' ; description: string; amount: string }
type UserWallet  = { id: string; username: string; address: string; bgIndex: number }

const useRootNav = () => useNavigation<NativeStackNavigationProp<RootStackParamList>>()

export default function Dashboard() {
  const insets         = useSafeAreaInsets()
  const rootNav        = useRootNav()
  const { address: liveAddress } = useAppKitAccount()
  const { selectedNetworkId }    = useAppKitState()
  const { disconnect }           = useDisconnect()

  const [wallets,        setWallets]        = useState<UserWallet[]>([])
  const [activeWalletId, setActiveWalletId] = useState<string>('')
  const [storedAddress,  setStoredAddress]  = useState<string|null>(null)
  const [username,       setUsername]       = useState<string>('')
  const [balance,        setBalance]        = useState<string>('0')
  const [error,          setError]          = useState<string>('')
  const [refreshing,     setRefreshing]     = useState<boolean>(false)
  const [transactions,   setTransactions]   = useState<Transaction[]>([])

  // dropdown animation
  const dropdownAnim = useRef(new Animated.Value(0)).current
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const MAX_HEIGHT = 150

  // — 1) Load stored selection, then fetch wallets —
  const fetchWallets = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    // fetch wallet list
    const snap = await getDocs(
      query(collection(db, 'wallets'), where('uid','==',uid))
    )
    const list = snap.docs.map((d,i) => ({
      id:       d.id,
      username: d.data().username as string,
      address:  d.data().address as string,
      bgIndex:  i % 4,
    }))
    setWallets(list)

    if (list.length === 0) {
      // nothing to select
      setActiveWalletId('')
      setUsername('')
      setStoredAddress(null)
      return
    }

    // see if user had a stored selection
    const saved = await AsyncStorage.getItem(ACTIVE_WALLET_KEY)
    const match = saved ? list.find(w => w.id === saved) : null

    const chosen = match || list[0]
    setActiveWalletId(chosen.id)
    setUsername(chosen.username)
    setStoredAddress(chosen.address)
  }, [])

  useEffect(() => {
    fetchWallets()
  }, [fetchWallets])

  useFocusEffect(useCallback(() => {
    fetchWallets()
  }, [fetchWallets]))

  // — 2) Dropdown open/close animation —
  const toggleDropdown = () => {
    if (!dropdownVisible) {
      setDropdownVisible(true)
      Animated.timing(dropdownAnim, { toValue:1, duration:200, useNativeDriver:false }).start()
    } else {
      Animated.timing(dropdownAnim, { toValue:0, duration:200, useNativeDriver:false })
        .start(() => setDropdownVisible(false))
    }
  }

  const selectWallet = (id: string) => {
    Animated.timing(dropdownAnim, { toValue:0, duration:200, useNativeDriver:false })
      .start(async () => {
        const w = wallets.find(w => w.id === id)
        if (w) {
          setActiveWalletId(w.id)
          setUsername(w.username)
          setStoredAddress(w.address)
          // persist the choice:
          await AsyncStorage.setItem(ACTIVE_WALLET_KEY, w.id)
        }
        setDropdownVisible(false)
      })
  }

  // — 3) Fetch on‐chain balance —
  const fetchBalance = useCallback(async () => {
    const addr = liveAddress || storedAddress
    if (!addr) {
      setBalance('0')
      return
    }
    try {
      const raw = await new JsonRpcProvider('http://192.168.100.129:8546').getBalance(addr)
      setBalance(formatEther(raw))
      setError('')
    } catch {
      setError('Network unreachable')
    }
  }, [liveAddress, storedAddress])

  // — 4) Fetch transactions —
  const fetchTxns = useCallback(async () => {
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
    setTransactions(
      snap.docs.map(d => ({
        type:        d.data().type as 'Ethereum',
        description: d.data().description as string,
        amount:      d.data().amount as string,
      }))
    )
  }, [])

  useEffect(() => {
    fetchBalance()
    fetchTxns()
  }, [fetchBalance, fetchTxns])

  useFocusEffect(useCallback(() => {
    fetchBalance()
    fetchTxns()
  }, [fetchBalance, fetchTxns]))

  // — Pull‐to‐refresh —
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchBalance(), fetchTxns()])
    setRefreshing(false)
  }, [fetchBalance, fetchTxns])

  // display data
  const displayAddr = liveAddress || storedAddress || 'Not connected'
  const isConnected = displayAddr !== 'Not connected'
  const HEADER_H   = 56
  const insetsTop  = insets.top
  const headerHeight = insetsTop + HEADER_H

  const active = wallets.find(w => w.id === activeWalletId)
  const bgIdx  = active?.bgIndex ?? 0

  const dropdownHeight = dropdownAnim.interpolate({
    inputRange: [0,1],
    outputRange: [0, MAX_HEIGHT],
  })

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insetsTop, height: headerHeight }]}>
        <Text style={styles.headerTitle}>BlockPay</Text>
      </View>

      <SectionList
        showsVerticalScrollIndicator={false}
        sections={[{ title: 'Recent transactions', data: transactions }]}
        keyExtractor={(_,i) => i.toString()}
        contentContainerStyle={{ paddingTop:80, paddingBottom:10 }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={headerHeight + 4}
            tintColor="#3b82f6"
          />
        }

        ListHeaderComponent={() => (
          <>
            {/* WalletTile + Switcher */}
            <View style={styles.tileSection}>
              <View style={styles.tileWrapper}>
                <WalletTile
                  address={displayAddr}
                  isConnected={isConnected}
                  bgIndex={bgIdx}
                />

                {wallets.length > 1 && (
                  <TouchableOpacity style={styles.switchBtn} onPress={toggleDropdown}>
                    <Text style={styles.switchText}>Switch Wallet ▼</Text>
                  </TouchableOpacity>
                )}

                {dropdownVisible && (
                  <Animated.View style={[styles.dropdown, { maxHeight: dropdownHeight }]}>
                    <ScrollView>
                      {wallets.map(w => (
                        <TouchableOpacity key={w.id} style={styles.dropdownItem} onPress={() => selectWallet(w.id)}>
                          <Text style={styles.dropdownText}>@{w.username}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </Animated.View>
                )}
              </View>
            </View>

            {/* Wallet Info */}
            <View style={styles.infoSection}>
              <Text style={styles.infoText}>
                Wallet: <Text style={styles.infoValue}>@{username||'— not set —'}</Text>
              </Text>
              <Text style={styles.infoText}>
                Balance: <Text style={styles.infoValue}>{error ? error : `${balance} ETH`}</Text>
              </Text>
              <Text style={styles.infoText}>
                Chain ID: <Text style={styles.infoValue}>{selectedNetworkId}</Text>
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.send]} onPress={() => rootNav.navigate('SendScreen')}>
                <Text style={styles.btnText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.receive]} onPress={() => rootNav.navigate('ReceiveScreen')}>
                <Text style={styles.btnText}>Receive</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, isConnected ? styles.disconnect : styles.connect]}
                onPress={() => isConnected ? disconnect() : rootNav.navigate('ConnectWallet')}
              >
                <Text style={styles.btnText}>{isConnected ? 'Disconnect' : 'Connect'}</Text>
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
          <View style={styles.txnRow}>
            <Image source={require('../assets/ethicon.png')} style={styles.txnIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.txnText}>{item.type}</Text>
              <Text style={[styles.txnText, styles.txnSmall]}>{item.description}</Text>
            </View>
            <Text
              style={[
                styles.txnText,
                styles.txnAmt,
                item.amount.startsWith('+') ? styles.positive : styles.negative,
              ]}
            >
              {item.amount}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f5f5f5' },

  header: {
    position:'absolute',
    top:0,left:0,right:0,
    backgroundColor:'#fff',
    borderBottomWidth:0.5,
    borderColor:'#ddd',
    alignItems:'center',
    justifyContent:'center',
    zIndex:10,
  },
  headerTitle: { fontFamily:'Manrope_700Bold', fontSize:20 },

  tileSection: { alignItems:'center', marginBottom:16, shadowColor:'#171717', shadowOffset:{width:1,height:1}, shadowOpacity:0., shadowRadius:4 },
  tileWrapper: { width:'90%', alignSelf:'center' },

  switchBtn: {
    position:'absolute', top:16, alignSelf:'center',
    backgroundColor:'#fff', paddingHorizontal:16, paddingVertical:8,
    borderRadius:20, elevation:4,
    shadowColor:'#000', shadowOffset:{width:0,height:2},
    shadowOpacity:0.2, shadowRadius:4, zIndex:10,
  },
  switchText: { fontFamily:'Manrope_700Bold', fontSize:14, color:'#5392FF' },

  dropdown: {
    position:'absolute', top:56, alignSelf:'center',
    width:'60%', backgroundColor:'#fff',
    borderRadius:12, overflow:'hidden', zIndex:10,
  },
  dropdownItem: { paddingVertical:12, paddingHorizontal:16, borderBottomWidth:1, borderColor:'#eee' },
  dropdownText: { fontSize:16, fontFamily:'Manrope_700Bold', color:'#333' },

  infoSection: { alignItems:'center', marginBottom:24 },
  infoText:    { fontFamily:'Manrope_500Medium', fontSize:18, color:'#333' },
  infoValue:   { fontFamily:'Manrope_700Bold', fontSize:22, color:'#000' },

  actions:     { flexDirection:'row', justifyContent:'space-between', marginHorizontal:20 },
  btn:         { flex:1, paddingVertical:12, borderRadius:24, marginHorizontal:4, alignItems:'center' },
  btnText:     { fontFamily:'Manrope_700Bold', fontSize:16, color:'#fff' },
  send:        { backgroundColor:'#3b82f6' },
  receive:     { backgroundColor:'#10b981' },
  disconnect:  { backgroundColor:'#ff7f7f' },
  connect:     { backgroundColor:'#22c55e' },

  sectionHeader:{ marginHorizontal:20, marginBottom:8, marginTop:30 },
  sectionTitle:{ fontFamily:'Manrope_700Bold', fontSize:16, color:'#333' },

  txnRow:      { flexDirection:'row', alignItems:'center', paddingVertical:12, marginHorizontal:20, borderBottomWidth:1, borderColor:'#ececec' },
  txnIcon:     { width:24, height:24, marginRight:12 },
  txnText:     { fontFamily:'Manrope_500Medium', color:'#333' },
  txnSmall:    { fontSize:12, color:'#888', marginTop:2 },
  txnAmt:      { marginLeft:'auto', fontWeight:'600' },
  positive:    { color:'#10b981' },
  negative:    { color:'#ef4444' },
})
