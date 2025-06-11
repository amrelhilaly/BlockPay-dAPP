import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';

export type WalletTileProps = {
  address:     string;
  isConnected: boolean;
};

const CONNECTED_BG      = require('../assets/walletbg.png');
const DISCONNECTED_BG   = require('../assets/nowalletbg.png');

export default function WalletTile({
  address,
  isConnected,
}: WalletTileProps) {
  return (
    <ImageBackground
      source={isConnected ? CONNECTED_BG : DISCONNECTED_BG}
      style={styles.card}
      imageStyle={styles.bgImage}
    >
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    width:         '100%',
    height:        200,
    borderRadius:  16,
    overflow:      'hidden',
    padding:       5,
    justifyContent:'flex-end',
    marginLeft: 'auto'
  },
  bgImage: {
    borderRadius: 16,
  },
  labelSmall: {
    color:      '#fff',
    fontSize:   12,
    fontFamily: 'Manrope',
  },
  address: {
    color:      '#fff',
    fontSize:   14,
    marginTop:  4,
    fontFamily: 'Manrope',
  },
});
