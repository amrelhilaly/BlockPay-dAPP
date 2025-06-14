import React, {memo} from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';

export type WalletTileProps = {
  address:     string;
  isConnected: boolean;
  bgIndex?:    number;
};

const BACKGROUNDS = [
  require('../assets/walletbg.png'),
  require('../assets/walletbg2.png'),
  require('../assets/walletbg3.png'),
  require('../assets/walletbg4.png'),
];
const DISCONNECTED_BG = require('../assets/nowalletbg.png');

function WalletTile({
  address,
  isConnected,
  bgIndex = 0,
}: WalletTileProps) {
  const source = isConnected
    ? BACKGROUNDS[bgIndex % BACKGROUNDS.length]
    : DISCONNECTED_BG;

  return (
    <ImageBackground
      source={source}
      style={styles.card}
      imageStyle={styles.bgImage}
    >
      <View>
        <Text style={styles.labelSmall}></Text>
        <Text
          style={styles.address}
          numberOfLines={1}
          ellipsizeMode='middle'
        >
          {address}
        </Text>
      </View>
    </ImageBackground>
  );
}

export default memo(WalletTile)


const styles = StyleSheet.create({
  card: {
    width:         '101%',
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
    textShadowOffset: { width: 0.3, height: 0.3 },
    textShadowRadius: 2,
    textShadowColor: '#7D7D7D',
    fontSize:   14,
    marginTop: 5,
    fontFamily: 'Manrope',
    padding: 5,
  },
});