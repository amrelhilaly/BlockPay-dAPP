// screens/LoginScreen.tsx

import React, { useState } from 'react'
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/Stack'

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Please enter both email and password.')
      return
    }

    setLoading(true)
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password)
      const uid = userCred.user.uid

      const walletSnap = await getDocs(
        query(collection(db, 'wallets'), where('uid', '==', uid))
      )

      if (walletSnap.empty) {
        navigation.replace('ConnectWallet')
      } else {
        navigation.replace('MainTabs')
      }
    } catch (err: any) {
      console.error('Login failed', err)
      Alert.alert('Login Error', err.message || 'Could not log in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: insets.top }, // respect notch
      ]}
    >
      {/* APP HEADER */}
      <Text style={styles.header}>Login</Text>

      {/* MAIN CONTENT */}
      <View style={styles.content}>
        <Text style={styles.greeting}>
          Hey,{'\n'}
          Welcome Back to{'\n'}
          BlockPay
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don’t have an account?
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    textAlign: 'center',
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
    paddingVertical: 12,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  greeting: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 32,
    lineHeight: 40,
    color: '#000',
    marginBottom: 24,
  },

  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Manrope_500Medium',
    marginBottom: 16,
  },

  loginBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#fff',
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: '#666',
  },
  footerLink: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: '#3b82f6',
    marginLeft: 4,
  },
})
