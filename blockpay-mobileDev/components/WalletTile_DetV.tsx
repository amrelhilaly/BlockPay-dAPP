// components/WalletTile_DetV.tsx

import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

type Wallet = {
  id:       string
  username: string
  address:  string
  bgIndex:  number   // 0–3
}

type Props = {
  wallet: Wallet
}

const BACKGROUNDS = [
  require('../assets/walletbg.png'),
  require('../assets/walletbg2.png'),
  require('../assets/walletbg3.png'),
  require('../assets/walletbg4.png'),
]

export default function WalletTileDetV({ wallet }: Props) {
  const bg = BACKGROUNDS[wallet.bgIndex % BACKGROUNDS.length]

  return (
    <ImageBackground
      source={bg}
      style={styles.card}
      imageStyle={styles.bgImage}
      resizeMode="cover"
    >
      {/* bottom gradient for readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)']}
        style={styles.gradient}
      />

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
  )
}

const styles = StyleSheet.create({
  card: {
    width:          '100%',
    height:         200,
    borderRadius:   16,
    overflow:       'hidden',
    marginBottom:   16,
    justifyContent: 'flex-end',
    padding:        12,
  },
  bgImage: {
    borderRadius: 16,
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }]
  },
  gradient: {
    position:               'absolute',
    left:                   0,
    right:                  0,
    bottom:                 0,
    height:                 80,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius:16,
  },
  info: {
    zIndex: 1,
  },
  username: {
    color:       '#fff',
    fontSize:    18,
    fontWeight:  '600',
    marginBottom: 4,
  },
  address: {
    color:    '#fff',
    fontSize: 14,
  },
})
