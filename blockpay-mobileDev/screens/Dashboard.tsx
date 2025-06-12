// Dashboard.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  SectionListData,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useAppKit,
  useAppKitAccount,
  useAppKitState,
  useDisconnect,
} from '@reown/appkit-ethers-react-native';
import { JsonRpcProvider, formatEther } from 'ethers';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/Stack';

import WalletTile from '../components/WalletTile';
import NavBar     from '../components/Navbar';

// --- TYPES ---
type NavProp       = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
type OtherWallet   = { type: 'Ethereum' | 'Bitcoin'; address: string; balance: string };
type Transaction   = { type: 'Ethereum' | 'Bitcoin'; description: string; amount: string };
type SectionItem   = OtherWallet | Transaction;

// --- DUMMY DATA ---
const otherWallets: OtherWallet[] = [
  { type: 'Ethereum', address: '0x42…789', balance: '0.5 ETH' },
  { type: 'Bitcoin',  address: '0x1A…234', balance: '0.1 BTC' },
];
const transactions: Transaction[] = [
  { type: 'Ethereum', description: 'Received from @blockchainlover', amount: '+0.5 ETH' },
  { type: 'Bitcoin',  description: 'Sent to @digitalcurrency',      amount: '-0.1 BTC' },
];

export default function Dashboard() {
  const insets       = useSafeAreaInsets();
  const navigation   = useNavigation<NavProp>();
  const { open }     = useAppKit();
  const { address: liveAddress } = useAppKitAccount();
  const { selectedNetworkId }    = useAppKitState();
  const { disconnect }           = useDisconnect();

  const [storedAddress, setStoredAddress] = useState<string | null>(null);
  const [username,      setUsername]      = useState<string>('');
  const [balance,       setBalance]       = useState<string>('0');
  const [error,         setError]         = useState<string>('');

  // 1) Watch for on‐chain disconnect → clear local
  useEffect(() => {
    if (!liveAddress) {
      setStoredAddress(null);
      setUsername('');
      setBalance('0');
    }
  }, [liveAddress]);

  // 2) Load Firestore wallet once
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    let cancelled = false;
    (async () => {
      const q    = query(collection(db, 'wallets'), where('uid','==',uid));
      const snap = await getDocs(q);
      if (cancelled) return;
      if (!snap.empty) {
        const d = snap.docs[0].data();
        setUsername(d.username as string);
        setStoredAddress(d.address as string);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 3) Fetch on‐chain balance when address changes
  useEffect(() => {
    const addr = liveAddress || storedAddress;
    if (!addr) {
      setBalance('0');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const provider = new JsonRpcProvider('http://172.20.10.6:8546');
        const raw      = await provider.getBalance(addr);
        if (!cancelled) setBalance(formatEther(raw));
      } catch {
        if (!cancelled) setError('Network unreachable');
      }
    })();
    return () => { cancelled = true; };
  }, [liveAddress, storedAddress]);

  // connection state & address to show
  const displayAddress  = liveAddress || storedAddress || 'Not connected';
  const walletConnected = displayAddress !== 'Not connected';

  // dynamic header & list offsets
  const HEADER_HEIGHT    = 56;
  const headerTotalHeight = insets.top + HEADER_HEIGHT;

  const sections: SectionListData<SectionItem>[] = [
    { title: 'Other wallets',       data: otherWallets },
    { title: 'Recent transactions', data: transactions },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/*  —————— HEADER —————— */}
      <View
        style={[
          styles.header,
          {
            paddingTop:   insets.top,
            height:       headerTotalHeight,
          },
        ]}
      >
        <Text style={styles.headerTitle}>BlockPay</Text>
      </View>

      {/*  —————— CONTENT —————— */}
      <SectionList
        sections={sections}
        keyExtractor={(_, idx) => idx.toString()}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{
          // push below the header
          paddingTop: 80,
          paddingBottom: 10,
        }}

        ListHeaderComponent={() => (
          <>
            {/* WalletTile */}
            <View style={styles.walletTileSection}>
              <View style={styles.walletTileWrapper}>
                <WalletTile
                  address={displayAddress}
                  isConnected={walletConnected}
                />
              </View>
            </View>

            {/* Centered Info */}
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
              <TouchableOpacity
                style={[styles.actionButton, styles.send]}
                onPress={() => navigation.navigate('SendScreen')}
              >
                <Text style={styles.actionText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.receive]}
                onPress={() => alert('Receive not built yet')}
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
                    disconnect();
                  } else {
                    navigation.navigate('ConnectWallet');
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
        renderItem={({ item }) => {
          if ('balance' in item) {
            return (
              <View style={styles.itemRow}>
                <Image
                  source={
                    item.type === 'Ethereum'
                      ? require('../assets/ethicon.png')
                      : require('../assets/ethicon.png')
                  }
                  style={styles.walletIcon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fontedText}>{item.type}</Text>
                  <Text style={[styles.fontedText, styles.smallText]}>
                    {item.address}
                  </Text>
                </View>
                <Text style={[styles.fontedText, styles.balanceText]}>
                  {item.balance}
                </Text>
              </View>
            );
          } else {
            return (
              <View style={styles.itemRow}>
                <Image
                  source={
                    item.type === 'Ethereum'
                      ? require('../assets/ethicon.png')
                      : require('../assets/ethicon.png')
                  }
                  style={styles.walletIcon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fontedText}>{item.type}</Text>
                  <Text style={[styles.fontedText, styles.smallText]}>
                    {item.description}
                  </Text>
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
            );
          }
        }}
      />

      {/*  —————— NAV BAR —————— */}
      <NavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    position:       'absolute',
    top:            0,
    left:           0,
    right:          0,
    backgroundColor:'#fff',
    borderBottomWidth:0.5,
    borderColor:    '#ddd',
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         10,
  },
  headerTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize:   20,
  },

  walletTileSection: {
    alignItems: 'center',
  },
  walletTileWrapper: {
    width:     '90%',
    alignSelf: 'center',
    paddingVertical:  1,

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
    flexDirection:   'row',
    justifyContent:  'space-between',
    marginHorizontal:20,
    marginTop:       16,
    marginBottom:    24,
  },
  actionButton: {
    flex:            1,
    paddingVertical: 12,
    borderRadius:    24,
    alignItems:      'center',
    marginHorizontal:4,
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
    marginHorizontal:20,
    marginTop:      16,
  },
  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize:   16,
    color:      '#333',
  },

  itemRow: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical:12,
    marginHorizontal:20,
    borderBottomWidth:1,
    borderColor:    '#ececec',
  },
  walletIcon: { width: 24, height: 24, marginRight: 12 },
  fontedText: {
    fontFamily: 'Manrope_500Medium',
    color:      '#333',
  },
  smallText:    { fontSize: 12, color: '#888', marginTop: 2 },
  balanceText:  { marginLeft: 'auto', fontWeight: '600' },
  positive:     { color: '#10b981' },
  negative:     { color: '#ef4444' },
});
