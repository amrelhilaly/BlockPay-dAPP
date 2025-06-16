// TxHistory.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  TextInput,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  RefreshControl,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getAuth } from 'firebase/auth'
import {
  getDocs,
  collection,
  query,
  where,
  orderBy,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'
import Feather from 'react-native-vector-icons/Feather'

type TxDoc = {
  id: string
  type: string
  description: string
  amount: string
  timestamp: Date
}

type Wallet = {
  id: string
  username: string
  address: string
}

const TxHistory: React.FC = () => {
  const insets = useSafeAreaInsets()
  const HEADER_BASE_HEIGHT = 56
  const auth = getAuth()

  // raw data
  const [rawTxns, setRawTxns] = useState<TxDoc[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])

  // filters
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)
  const [receivedOnly, setReceivedOnly] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [amountFilter, setAmountFilter] = useState('')
  const [editingAmount, setEditingAmount] = useState(false)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  // UI state
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showSortModal, setShowSortModal] = useState(false)
  const [showDateModal, setShowDateModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // fetch transactions
  const fetchTxns = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const snap = await getDocs(
      query(
        collection(db, 'transactions'),
        where('uid', '==', uid),
        orderBy('timestamp', 'desc'),
      )
    )
    const docs = snap.docs.map(
      (d: QueryDocumentSnapshot<DocumentData>) => ({
        id: d.id,
        type: d.data().type as string,
        description: d.data().description as string,
        amount: d.data().amount as string,
        timestamp: (d.data().timestamp as any).toDate() as Date,
      })
    )
    setRawTxns(docs)
  }, [auth.currentUser])

  // fetch wallets
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
  }, [auth.currentUser])

  // initial load
  useEffect(() => {
    fetchTxns()
    fetchWallets()
  }, [fetchTxns, fetchWallets])

  // pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    // reset filters
    setSelectedWalletId(null)
    setReceivedOnly(false)
    setSelectedDate(null)
    setAmountFilter('')
    setEditingAmount(false)
    setSortOrder('newest')
    // re-fetch data
    await fetchTxns()
    setRefreshing(false)
  }, [fetchTxns])

  // apply filters + sort
  const filteredTxns = useMemo(() => {
    let list = [...rawTxns]

    if (receivedOnly) {
      list = list.filter(tx =>
        tx.description.startsWith('Received')
      )
    } else if (selectedWalletId) {
      if (selectedWalletId === 'ALL') {
        list = list.filter(tx =>
          tx.description.startsWith('Sent')
        )
      } else {
        const w = wallets.find(w => w.id === selectedWalletId)
        if (w) {
          list = list.filter(
            tx =>
              tx.description.startsWith('Sent') &&
              tx.description.includes(w.username)
          )
        }
      }
    }

    if (selectedDate) {
      const day = selectedDate.toISOString().slice(0, 10)
      list = list.filter(tx =>
        tx.timestamp.toISOString().startsWith(day)
      )
    }

    if (amountFilter) {
      list = list.filter(tx =>
        tx.amount.includes(amountFilter)
      )
    }

    list.sort((a, b) =>
      sortOrder === 'newest'
        ? b.timestamp.getTime() - a.timestamp.getTime()
        : a.timestamp.getTime() - b.timestamp.getTime()
    )

    return list
  }, [
    rawTxns,
    wallets,
    receivedOnly,
    selectedWalletId,
    selectedDate,
    amountFilter,
    sortOrder,
  ])

  return (
  
    <View style={styles.container}>
      {/* APP HEADER */}
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
          Transaction History
        </Text>
      </View>

      {/* STATIC CONTENT ABOVE LIST */}
      <View
        style={{
          marginTop: HEADER_BASE_HEIGHT + insets.top,
        }}
      >
        {/* FILTERS */}
        <View style={styles.filterSection}>
          {/* Row 1 */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Filter:</Text>

            <TouchableOpacity
              style={styles.sentButton}
              onPress={() => {
                setShowWalletModal(true)
                setReceivedOnly(false)
              }}
            >
              <Text style={styles.ButtonText}>
                {selectedWalletId
                  ? selectedWalletId === 'ALL'
                    ? 'All'
                    : wallets.find(
                        (w) => w.id === selectedWalletId
                      )?.username
                  : 'Sent From'}
              </Text>
              <Text style={{ marginLeft: 4 }}>▼</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.ReceivedButton,
                receivedOnly && styles.activeButton,
              ]}
              onPress={() =>
                setReceivedOnly((prev) => {
                  const next = !prev
                  if (next) setSelectedWalletId(null)
                  return next
                })
              }
            >
              <Text
                style={[
                  styles.ButtonText,
                  receivedOnly && styles.activeText,
                ]}
              >
                Received
              </Text>
            </TouchableOpacity>

            {/* Clear‐Filters button */}
            {(!!selectedWalletId ||
               
              !!selectedDate ||
              !!amountFilter) && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSelectedWalletId(null)
                  setReceivedOnly(false)
                  setSelectedDate(null)
                  setAmountFilter('')
                }}
                
              >
                <Feather name="x-circle" size={26} color="#DF4C4C" />
              </TouchableOpacity>
            )}
          </View>

          {/* Row 2 */}
          <View style={styles.secondRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDateModal(true)}
            >
              <Text style={styles.ButtonText}>
                {selectedDate
                  ? selectedDate.toLocaleDateString()
                  : 'Date'}
              </Text>
            </TouchableOpacity>

            {editingAmount ? (
              <TextInput
                style={[styles.amountButton, { flex: 1 }]}
                value={amountFilter}
                onChangeText={setAmountFilter}
                placeholder="Amount"
                keyboardType="numeric"
                onBlur={() => setEditingAmount(false)}
                onSubmitEditing={() =>
                  setEditingAmount(false)
                }
              />
            ) : (
              <TouchableOpacity
                style={styles.amountButton}
                onPress={() => setEditingAmount(true)}
              >
                <Text style={styles.ButtonText}>
                  Amount
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setShowSortModal(true)}
            >
              <Text>⇅</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION TITLE */}
        <Text style={styles.sectionTitle}>
          Transactions:
        </Text>
      </View>

      {/* ONLY THIS SCROLLS */}
      <FlatList
        data={filteredTxns}
        keyExtractor={(tx) => tx.id}
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.txnRow,
              { paddingVertical: 16 },
            ]}
          >
            <Image
              source={require('../assets/ethicon.png')}
              style={styles.txnIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.txnText}>
                {item.type}
              </Text>
              <Text
                style={[
                  styles.txnText,
                  styles.txnSmall,
                ]}
              >
                {item.description}
              </Text>
            </View>
            <Text
              style={[
                styles.txnText,
                styles.txnAmt,
                item.amount.startsWith('+')
                  ? styles.positive
                  : styles.negative,
              ]}
            >
              {item.amount}
            </Text>
          </View>
        )}
      />

      {/* DATE PICKER MODAL */}
      {showDateModal && (
        <Modal
          transparent
          animationType="fade"
          visible={true}
          onRequestClose={() =>
            setShowDateModal(false)
          }
        >
          <TouchableWithoutFeedback
            onPress={() => setShowDateModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.dateModalContent}>
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="date"
                  display={
                    Platform.OS === 'ios'
                      ? 'spinner'
                      : 'default'
                  }
                  onChange={(_, date) => {
                    setShowDateModal(false)
                    if (date) setSelectedDate(date)
                  }}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* WALLET DROPDOWN MODAL */}
      {showWalletModal && (
        <Modal
          transparent
          animationType="fade"
          visible={true}
          onRequestClose={() =>
            setShowWalletModal(false)
          }
        >
          <TouchableWithoutFeedback
            onPress={() => setShowWalletModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedWalletId('ALL')
                    setShowWalletModal(false)
                  }}
                >
                  <Text>All</Text>
                </TouchableOpacity>
                {wallets.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedWalletId(w.id)
                      setShowWalletModal(false)
                    }}
                  >
                    <Text>{w.username}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() =>
                    setShowWalletModal(false)
                  }
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* SORT DROPDOWN MODAL */}
      {showSortModal && (
        <Modal
          transparent
          animationType="fade"
          visible={true}
          onRequestClose={() =>
            setShowSortModal(false)
          }
        >
          <TouchableWithoutFeedback
            onPress={() => setShowSortModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSortOrder('newest')
                    setShowSortModal(false)
                  }}
                >
                  <Text>Newest → Oldest</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSortOrder('oldest')
                    setShowSortModal(false)
                  }}
                >
                  <Text>Oldest → Newest</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() =>
                    setShowSortModal(false)
                  }
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
)


}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

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
  stickyHeader: {
    backgroundColor: '#fff',
    zIndex: 1,
  },

  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 30,
    marginRight: 8,
    width: 70, // reserve space for indent
  },
  secondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 77, // align under the buttons, not under the label
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 6,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    width: 100,
  },
  sentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    width: 100,
  },
  ReceivedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    width: 100,
  },
  amountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    width: 100,
  },
  ButtonText: {
    color: '#000',
    fontSize: 17,
  },
  activeButton: {
    backgroundColor: '#3b82f6',
    fontSize: 18,
  },
  activeText: {
    color: '#fff',
    fontSize: 17,
  },
  nonActiveText: {
    color: '#000',
    fontSize: 17,
  },
  sortButton: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 20,
  },

  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 30,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingTop: 5,
  },

  list: {
    flex:1,
  },
  listContent: {
    paddingBottom: 20,
  },

  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#ececec',
  },
  txnIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  txnText: {
    fontFamily: 'Manrope_500Medium',
    color: '#333',
  },
  txnSmall: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  txnAmt: {
    marginLeft: 'auto',
    fontWeight: '600',
  },
  positive: { color: '#10b981' },
  negative: { color: '#ef4444' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#000',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    width: '80%',
  },
  dateModalContent: {
    backgroundColor: '#A2A2A2',
    borderRadius: 8,
    padding: 16,
  },
  modalItem: {
    paddingVertical: 12,
  },
  modalCancel: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  datePickerInline: {
    alignSelf: 'center',
    marginVertical: 10,
  },
  clearIcon: {
    fontSize: 20,
    color: '#ef4444',
  
  },
  clearButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default TxHistory
