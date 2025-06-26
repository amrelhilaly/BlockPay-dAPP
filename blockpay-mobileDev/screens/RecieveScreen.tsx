// ReceiveScreen.tsx

import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/Stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppKitAccount } from '@reown/appkit-ethers-react-native'
import { auth, db } from '../firebase/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import QRCode from 'react-native-qrcode-svg'
import Feather from 'react-native-vector-icons/Feather'

type NavProp = NativeStackNavigationProp<RootStackParamList, 'ReceiveScreen'>

type Wallet = {
  id: string
  username: string
  address: string
}

const HEADER_H = 56
const MAX_DROPDOWN_HEIGHT = 150

export default function ReceiveScreen() {
  const navigation = useNavigation<NavProp>()
  const { isConnected } = useAppKitAccount()

  const insets = useSafeAreaInsets()
  const headerHeight = insets.top + HEADER_H

  const [loading, setLoading] = useState(true)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const dropdownAnim = useRef(new Animated.Value(0)).current

  // fetch all wallets for this user
  const fetchWallets = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const snap = await getDocs(
      query(collection(db, 'wallets'), where('uid', '==', uid))
    )
    const list: Wallet[] = snap.docs.map(d => ({
      id: d.id,
      username: d.data().username as string,
      address: d.data().address as string,
    }))
    setWallets(list)
    if (list.length) setActiveId(id => id || list[0].id)
    setLoading(false)
  }, [])

  useEffect(() => { fetchWallets() }, [fetchWallets])

  const activeWallet = wallets.find(w => w.id === activeId)
  const qrValue = activeWallet?.username ?? ''

  // animate dropdown open/close
  const toggleDropdown = () => {
    if (!dropdownVisible) {
      setDropdownVisible(true)
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start()
    } else {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setDropdownVisible(false))
    }
  }
  const dropdownHeight = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, MAX_DROPDOWN_HEIGHT],
  })

  // if (!isConnected) {
  //   return (
  //     <SafeAreaView style={styles.safe}>
  //       <View style={styles.centered}>
  //         <Text>Please connect to receive funds.</Text>
  //       </View>
  //     </SafeAreaView>
  //   )
  // }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    )
  }

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
        <Text style={styles.headerTitle}>Receive Payment</Text>
        <View style={{ width: 24, marginRight: 12 }} />
      </View>

      {/* CONTENT */}
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: headerHeight - 40 },
        ]}
      >
        <Text style={styles.title}>Receive on</Text>

        {/* WALLET SWITCHER */}
        <View style={styles.switchWrapper}>
          <TouchableOpacity
            style={styles.switcher}
            onPress={toggleDropdown}
          >
            <Text style={styles.switchText}>
              @{activeWallet?.username}
            </Text>
            <Feather
              name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#333"
            />
          </TouchableOpacity>

          {dropdownVisible && (
            <Animated.View
              style={[styles.dropdown, { height: dropdownHeight }]}
            >
              <ScrollView>
                {wallets.map(w => (
                  <TouchableOpacity
                    key={w.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setActiveId(w.id)
                      toggleDropdown()
                    }}
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

        {/* ADDRESS & QR */}
        <Text style={styles.subtitle}>Wallet address:</Text>
        <Text style={styles.address}>
          {activeWallet?.address}
        </Text>

        <View style={styles.qrWrapper}>
          <QRCode value={qrValue} size={200} />
        </View>

        <Text style={styles.instruction}>
          Have the sender tap “Scan QR” and point their camera here
          to autofill @{activeWallet?.username}.
        </Text>

        {/* DONE BUTTON */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
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
    fontSize: 20,
    fontWeight: '600',
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginTop: 16,
  },
  switchWrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 16,
  },
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
    color: '#5392FF',
  },
  dropdown: {
    position: 'absolute',
    top: 48,                // just below the switcher
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Manrope_700Bold',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  address: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 32,
    textAlign: 'center',
    color: '#222',
  },
  qrWrapper: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    marginBottom: 24,
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  doneBtn: {
    backgroundColor: '#10b981',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 32,
  },
   doneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
