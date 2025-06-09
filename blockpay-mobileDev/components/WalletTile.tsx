// components/WalletTile.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';

export type WalletTileProps = {
  walletType: 'MetaMask' | 'Ethereum' | 'Bitcoin';
  address: string;
  username: string;
  balance: string;
  chainId: string;
  onSend: () => void;
  onReceive: () => void;
  onDisconnect: () => void;
};

const BACKGROUNDS: Record<string, any> = {
  MetaMask: require('../assets/metamask-bg.jpeg')
};

export default function WalletTile({
  walletType,
  address,
  username,
  balance,
  chainId,
  onSend,
  onReceive,
  onDisconnect,
}: WalletTileProps) {
  return (
    <View style={styles.wrapper}>
      <ImageBackground
        source={BACKGROUNDS[walletType]}
        style={styles.card}
        imageStyle={styles.bgImage}
        resizeMode="cover"
      >
        {/* Top row: address */}
        <View>
          <Text style={styles.labelSmall}>wallet address:</Text>
          <Text
            style={styles.address}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {address}
          </Text>
        </View>

        {/* Username */}
        <Text style={styles.username}>{username}</Text>

        {/* Info row */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Balance:</Text>
          <Text style={styles.infoValue}>{balance}</Text>
          <Text style={styles.infoLabel}>Chain ID:</Text>
          <Text style={styles.infoValue}>{chainId}</Text>
        </View>

      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginTop: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,           // Android shadow
    shadowColor: '#000',    // iOS shadow
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    paddingHorizontal: 2,
    
  },
  card: {
    width: '100%',
    height: 200,            // fixed height so content never overlaps
    padding: 10,
    justifyContent: 'space-between',
  },
  bgImage: {
    borderRadius: 16,
  },
  labelSmall: {
    color: '#fff',
    fontSize: 12,
  },
  address: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
  username: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#eee',
    fontSize: 12,
    marginRight: 4,
  },
  infoValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  send: {
    backgroundColor: '#3b82f6',
  },
  receive: {
    backgroundColor: '#10b981',
  },
  disconnect: {
    backgroundColor: '#ef4444',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
