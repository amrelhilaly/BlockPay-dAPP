// screens/SplashScreen.tsx

import React, { useEffect, useRef } from 'react'
import {
  View,
  Animated,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'


type RootStackParamList = {
  Splash: undefined
  Login:  undefined
  Signup: undefined
}

type Props = NativeStackNavigationProp<RootStackParamList, 'Splash'>

const { width } = Dimensions.get('window')
const LOGO_SIZE = width * 0.4  // 40% of screen width

export default function SplashScreen({}: {}) {
  const navigation = useNavigation<Props>()

  const logoOpacity    = useRef(new Animated.Value(0)).current
  const buttonsOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // 1) fade in logo
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      // 2) then fade in buttons
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start()
    })
  }, [])

  return (
    <LinearGradient
      colors={['#3b82f6', '#7dd3fc']}
      style={styles.fullscreen}
    >
      <View style={styles.centered}>
        <Animated.Image
          source={require('../assets/blockpayicon.png')}
          style={[styles.logo, { opacity: logoOpacity }]}
          resizeMode="contain"
        />

        <Animated.View style={[styles.buttonGroup, { opacity: buttonsOpacity }]}>
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.buttonText, styles.loginText]}>
              Log In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.signupButton]}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={[styles.buttonText, styles.signupText]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  )
}

const BUTTON_PADDING = 14
const BUTTON_RADIUS  = 24

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
  },
  centered: {
    flex:           1,
    justifyContent: 'center',
    alignItems:     'center',
  },
  logo: {
    width:        LOGO_SIZE,
    height:       LOGO_SIZE,
    marginBottom: 48,
    borderRadius: LOGO_SIZE / 2,
  },
  buttonGroup: {
    width:      '100%',
    alignItems: 'center',
  },
  button: {
    width:           '70%',
    paddingVertical: BUTTON_PADDING,
    borderRadius:    BUTTON_RADIUS,
    alignItems:      'center',
    marginVertical:  8,
  },
  buttonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize:   16,
  },
  // Log In style
  loginButton: {
    backgroundColor: '#fff',
  },
  loginText: {
    color: '#3b82f6',
  },
  // Sign Up style
  signupButton: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  signupText: {
    color: '#fff',
  },
})
