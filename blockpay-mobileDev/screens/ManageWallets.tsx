// screens/ManageWallets.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import WalletTileDet from '../components/WalletTile_Det';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
type Wallet = {
  id: string;
  username: string;
  address: string;
  bgIndex: number;
};

export default function ManageWallets() {
  const nav = useNavigation();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [editMode, setEditMode] = useState(false);
  const insets = useSafeAreaInsets()
  const HEADER_BASE_HEIGHT = 56

  useEffect(() => {
    (async () => {
      const data = await fetchWalletsForCurrentUser();
      setWallets(data);
    })();
  }, []);

  // — FIRESTORE FETCH —
  async function fetchWalletsForCurrentUser(): Promise<Wallet[]> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.warn('No logged-in user');
      return [];
    }

    const walletsRef = collection(db, 'wallets');
    const q = query(walletsRef, where('uid', '==', user.uid));
    const snap = await getDocs(q);

    return snap.docs.map((docSnap, idx) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        username: data.username as string,
        address: data.address as string,
        bgIndex: idx % 4,    // rotate through 0–3
      };
    });
  }
  // — end FIRESTORE FETCH —

  const handleAdd = () => {
    nav.navigate('ConnectWallet' as never);
  };

  const handleDelete = async (id: string) => {
    // remove locally
    setWallets(ws => ws.filter(w => w.id !== id));
    // AND remove from Firestore:
    try {
      await deleteDoc(doc(db, 'wallets', id));
    } catch (err) {
      console.error('Failed to delete wallet:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
           <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            height: HEADER_BASE_HEIGHT + insets.top,
          },
        ]}
      >
        <Text style={styles.headerTitle}>
          Manage Wallets
        </Text>
      </View>

      {/* Section Header */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connected Wallets:</Text>
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleAdd}>
            <Text style={styles.actionText}>＋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setEditMode(em => !em)}
          >
            <Text style={styles.actionText}>
              {editMode ? 'Done' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Wallet List */}
      <FlatList
        contentContainerStyle={styles.list}
        data={wallets}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
        <View style={styles.itemWrapper}>
           <WalletTileDet
             wallet={item}
             inEditMode={editMode}
             onDelete={() =>
               Alert.alert(
                 'Delete Wallet',
                 'Are you sure you want to delete this wallet?',
                 [
                   { text: 'Cancel', style: 'cancel' },
                   {
                     text: 'Delete',
                     style: 'destructive',
                     onPress: () => handleDelete(item.id),
                   },
                 ]
               )
             }
           />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>No wallets connected.</Text>
          </View>
        }
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
   header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
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
  section: {
    marginTop: 56, // space for header
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: { fontSize: 26, fontFamily: 'Manrope_700Bold' },
  buttons: { flexDirection: 'row', marginLeft: 'auto', borderRadius: 20 },
  actionBtn: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
  },
  actionText: { fontSize: 16, fontWeight: '600' },
  list: {

    alignItems: 'stretch',
    paddingTop: 10,
    paddingBottom: 50,
  },
  itemWrapper: {
    width: '92%',
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 12
  },
  empty: {
    marginTop: 40,
    alignItems: 'center',
  },
  tabbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 4,
  },
  tabItem: { fontSize: 24, opacity: 0.5 },
  tabItemActive: { opacity: 1 },
});
