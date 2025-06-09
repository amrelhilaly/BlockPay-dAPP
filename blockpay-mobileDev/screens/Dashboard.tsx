// Dashboard.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SectionList,
  SectionListData,
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

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

type OtherWallet = { type: 'Ethereum' | 'Bitcoin'; address: string; balance: string };
type Transaction = { type: 'Ethereum' | 'Bitcoin'; description: string; amount: string };

// we’ll unify sections into a single union type
type SectionItem = OtherWallet | Transaction;

export default function Dashboard() {
  const insets       = useSafeAreaInsets();
  const { open }     = useAppKit();
  const { address: liveAddress, isConnected } = useAppKitAccount();
  const { selectedNetworkId } = useAppKitState();
  const { disconnect } = useDisconnect();
  const navigation   = useNavigation<NavProp>();

  const [storedAddress, setStoredAddress] = useState<string | null>(null);
  const [username,      setUsername]      = useState<string>('');
  const [balance,       setBalance]       = useState<string>('0');
  const [error,         setError]         = useState<string>('');

  // sample data
  const otherWallets: OtherWallet[] = [
    { type: 'Ethereum', address: '0x42…789', balance: '0.5 ETH' },
    { type: 'Bitcoin',  address: '0x1A…234', balance: '0.1 BTC' },
  ];
  const transactions: Transaction[] = [
    { type: 'Ethereum', description: 'Received from @blockchainlover', amount: '+0.5 ETH' },
    { type: 'Bitcoin',  description: 'Sent to @digitalcurrency',      amount: '-0.1 BTC' },
  ];

  // fetch Firestore wallet
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    let cancelled = false;
    (async () => {
      const q    = query(collection(db, 'wallets'), where('uid','==',uid));
      const snap = await getDocs(q);
      if (cancelled) return;
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setUsername(data.username as string);
        setStoredAddress(data.address as string);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // fetch balance
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

  const displayAddress = liveAddress || storedAddress || 'Not connected';

  // SectionList expects an array of { title, data }
  const sections: { title: string; data: SectionItem[] }[] = [
    { title: 'Other wallets',        data: otherWallets },
    { title: 'Recent transactions',  data: transactions },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(_, idx) => idx.toString()}
        stickySectionHeadersEnabled={false}

        // Header above everything
        ListHeaderComponent={() => (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>BlockPay</Text>
            </View>

            <View style={styles.walletTileSection}>
              <WalletTile
                walletType="MetaMask"
                address={displayAddress}
                username={username || '— not set —'}
                balance={error ? error : `${balance} ETH`}
                chainId={`${selectedNetworkId}`}
                onSend={()   => alert('Send not built yet')}
                onReceive={() => alert('Receive not built yet')}
                onDisconnect={() => {
                  if (isConnected) disconnect();
                  else open().catch(() => alert('Connection failed'));
                }}
              />
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.send]}
                onPress={() => alert('Send not built yet')}
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
                style={[styles.actionButton, styles.disconnect]}
                onPress={() => {
                  if (isConnected) disconnect();
                  else open().catch(() => alert('Connection failed'));
                }}
              >
                <Text style={styles.actionText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        // Section headers (“Other wallets” / “Recent transactions”)
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}

        // Items for both sections
        renderItem={({ item, section }) => (
          <View style={styles.itemRow}>
            <Image
              source={
                // @ts-ignore
                item.type === 'Ethereum'
                  ? require('../assets/ethereum-icon.png')
                  : require('../assets/bitcoin-icon.png')
              }
              style={styles.walletIcon}
            />
            <View style={{ flex: 1 }}>
              <Text>{item.type}</Text>
              <Text style={styles.smallText}>
                {/* either .address or .description */}
                {/* @ts-ignore */}
                {section.title === 'Other wallets'
                  ? (item as OtherWallet).address
                  : (item as Transaction).description}
              </Text>
            </View>
            <Text
              style={[
                styles.balanceText,
                // @ts-ignore
                (item as Transaction).amount?.startsWith('+')
                  ? styles.positive
                  : styles.negative,
              ]}
            >
              {/* @ts-ignore */}
              {section.title === 'Other wallets'
                ? (item as OtherWallet).balance
                : (item as Transaction).amount}
            </Text>
          </View>
        )}

        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 100,
        }}
      />

      <NavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header:           { alignItems: 'center', marginBottom: 12 },
  headerTitle:      { fontSize: 20, fontWeight: 'bold' },

  walletTileSection:{ marginHorizontal: 5, marginBottom: 10 , alignItems: 'center' },
  actionRow:        {
    flexDirection: 'row',
    justifyContent:  'space-between',
    marginHorizontal:20,
    marginBottom:    24,
    marginTop:       12,
  },
  actionButton:    {
    flex: 1,
    paddingVertical:12,
    borderRadius:   24,
    alignItems:     'center',
    marginHorizontal:4,
  },
  actionText:      { color: '#fff', fontWeight: '600' },
  send:            { backgroundColor: '#3b82f6' },
  receive:         { backgroundColor: '#10b981' },
  disconnect:      { backgroundColor: '#f87171' },

  sectionHeader:   { marginHorizontal: 20, marginTop: 16, marginBottom: 8 },
  sectionTitle:    { fontSize: 16, fontWeight: '600' },

  itemRow: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical:12,
    marginHorizontal:20,
    borderBottomWidth:1,
    borderColor:    '#ececec',
  },
  walletIcon:      { width: 24, height: 24, marginRight: 12 },
  smallText:       { color: '#888', fontSize: 12 },
  balanceText:     { marginLeft: 'auto', fontWeight: '600' },
  positive:        { color: '#10b981' },
  negative:        { color: '#ef4444' },
});
