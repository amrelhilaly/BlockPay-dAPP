// components/WalletTile.tsx

import React, { memo } from 'react'
import { View, Text, StyleSheet, ImageBackground } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export type WalletTileProps = {
  address:     string
  isConnected: boolean
  bgIndex?:    number
}

const BACKGROUNDS = [
  require('../assets/walletbg.png'),
  require('../assets/walletbg2.png'),
  require('../assets/walletbg3.png'),
  require('../assets/walletbg4.png'),
]
const DISCONNECTED_BG = require('../assets/nowalletbg.png')

function WalletTile({
  address,
  isConnected,
  bgIndex = 0,
}: WalletTileProps) {
  const source = isConnected
    ? BACKGROUNDS[bgIndex % BACKGROUNDS.length]
    : DISCONNECTED_BG

  return (
    <ImageBackground
      source={source}
      style={styles.card}
      imageStyle={styles.bgImage}
    >
      {/* bottom fade overlay */}
      <LinearGradient
        // vertical: transparent at top → slight dark at bottom
        start={{ x: 0, y: 0 }}
        end={{   x: 0, y: 1 }}
        colors={['transparent', 'rgba(0, 0, 0, 0.2)']}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <Text
          style={styles.address}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {address}
        </Text>
      </View>
    </ImageBackground>
  )
}

export default memo(WalletTile)

const styles = StyleSheet.create({
  card: {
    width:         '100%',       // fill container
    height:        200,
    borderRadius:  16,
    overflow:      'hidden',
    justifyContent:'flex-end',
    marginVertical: 8,
  },
  bgImage: {
    borderRadius: 16,
  },
  gradient: {
    position:                'absolute',
    left:                    0,
    right:                   0,
    bottom:                  0,
    height:                  80,
    borderBottomLeftRadius:  16,
    borderBottomRightRadius: 16,
  },
  content: {
    zIndex: 1,      // ensure text is above the gradient
    paddingHorizontal: 12,
    paddingBottom:     12,
  },
  address: {
    color:      '#fff',
    fontSize:   16,
    fontFamily: 'Manrope',
  },
})
