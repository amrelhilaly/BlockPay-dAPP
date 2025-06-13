import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';

type Wallet = {
  id: string;
  username: string;
  address: string;
  bgIndex: number;   // 0–3, to pick one of four backgrounds
};

type WalletTileDetProps = {
  wallet: Wallet;
  inEditMode: boolean;
  onDelete: (id: string) => void;
};

const BACKGROUNDS = [
  require('../assets/walletbg.png'),
  require('../assets/walletbg2.png'),
  require('../assets/walletbg3.png'),
  require('../assets/walletbg4.png'),
];

export default function WalletTileDet({
  wallet,
  inEditMode,
  onDelete,
}: WalletTileDetProps) {
  const bg = BACKGROUNDS[wallet.bgIndex % BACKGROUNDS.length];

  return (
    <ImageBackground
      source={bg}
      style={styles.card}
      imageStyle={styles.bgImage}
    >
      {inEditMode && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(wallet.id)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      )}
      <View style={styles.info}>
        <Text style={styles.username}>@{wallet.username}</Text>
        <Text
          style={styles.address}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {wallet.address}
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'flex-end',
    padding: 12,
  },
  bgImage: {
    borderRadius: 16,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  info: {
    // ensure text is above delete button
    zIndex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  address: {
    color: '#fff',
    fontSize: 14,
  },
});
