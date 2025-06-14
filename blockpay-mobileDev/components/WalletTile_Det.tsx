// components/WalletTile_Det.tsx

import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Animated,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Feather from 'react-native-vector-icons/Feather'

type Wallet = {
  id:        string
  username:  string
  address:   string
  bgIndex:   number   // 0–3
}

type Props = {
  wallet:     Wallet
  inEditMode: boolean
  onDelete:   (id: string) => void
}

const BACKGROUNDS = [
  require('../assets/walletbg.png'),
  require('../assets/walletbg2.png'),
  require('../assets/walletbg3.png'),
  require('../assets/walletbg4.png'),
]

export default function WalletTileDet({
  wallet,
  inEditMode,
  onDelete
}: Props) {
  const bg = BACKGROUNDS[wallet.bgIndex % BACKGROUNDS.length]

  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(anim, {
      toValue:   inEditMode ? 1 : 0,
      duration:  200,
      useNativeDriver: true,
    }).start()
  }, [inEditMode])

  const scale = anim.interpolate({
    inputRange:  [0,1],
    outputRange: [0.8,1],
  })

  const confirmDelete = () => {
    Animated.timing(anim, {
      toValue:   0,
      duration:  100,
      useNativeDriver: true,
    }).start(() => onDelete(wallet.id))
  }

  return (
    <ImageBackground
      source={bg}
      style={styles.card}
      imageStyle={styles.bgImage}
    >
      {/* bottom gradient for readability */}
      <LinearGradient
        colors={['transparent','rgba(0,0,0,0.4)']}
        style={styles.gradient}
      />

      {/* animated trash button */}
      <Animated.View
        pointerEvents={inEditMode ? 'auto' : 'none'}
        style={[styles.trash, { opacity: anim, transform: [{scale}] }]}
      >
        <TouchableOpacity onPress={confirmDelete}>
          <Feather name="trash-2" size={16} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.info}>
        <Text style={styles.username}>@{wallet.username}</Text>
        <Text style={styles.address} numberOfLines={1} ellipsizeMode="middle">
          {wallet.address}
        </Text>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  card: {
    width:         '100%',
    height:        200,
    borderRadius:  16,
    overflow:      'hidden',
    marginBottom:  16,
    justifyContent:'flex-end',
    padding:       12,
    // backgroundColor: no longer needed
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
  trash: {
    position:        'absolute',
    top:             12,
    right:           12,
    backgroundColor: 'rgba(255,0,0,0.8)',
    padding:         8,
    borderRadius:    4,
    zIndex:          2,
  },
  info: {
    zIndex: 1,
  },
  username: {
    color:      '#fff',
    fontSize:   18,
    fontWeight: '600',
    marginBottom: 4,
  },
  address: {
    color:    '#fff',
    fontSize: 14,
  },
})
