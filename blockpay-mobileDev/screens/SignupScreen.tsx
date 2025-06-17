// screens/SignupScreen.tsx

import React, { useState } from 'react'
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { setDoc, doc } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/Stack'

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>

const HEADER_BASE_HEIGHT = 56

export default function SignupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const headerHeight = insets.top + HEADER_BASE_HEIGHT

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !password) {
      return Alert.alert('Please fill in all required fields.')
    }
    if (password !== confirm) {
      return Alert.alert('Passwords do not match.')
    }

    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await setDoc(doc(db, 'users', cred.user.uid), {
        firstName,
        lastName,
        email,
        phone: phone || null,
        createdAt: new Date(),
      })
      navigation.replace('ConnectWallet')
    } catch (err: any) {
      console.error('Signup failed', err)
      Alert.alert('Signup Error', err.message || 'Failed to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, height: headerHeight },
        ]}
      >
        <Text style={styles.headerTitle}>Sign Up</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingHorizontal: 20,
          paddingBottom: 40,
          
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* GREETING */}
        <Text style={styles.greeting}>
          Hey there,{'\n'}
          Welcome to BlockPay
        </Text>

        {/* NAME ROW */}
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput, { marginRight: 8 }]}
            placeholder="First Name"
            placeholderTextColor="#888"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Last Name"
            placeholderTextColor="#888"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        {/* PHONE */}
        <TextInput
          style={styles.input}
          placeholder="Phone (optional)"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {/* EMAIL */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {/* PASSWORD */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* CONFIRM PASSWORD */}
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        {/* SIGNUP BUTTON */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Signup</Text>
          )}
        </TouchableOpacity>

         {/* FOOTER LINK */}
       <View style={styles.footer}>
         <Text style={styles.footerText}>
           Already have an account?
         </Text>
         <TouchableOpacity onPress={() => navigation.navigate('Login')}>
           <Text style={styles.footerLink}>Sign in</Text>
         </TouchableOpacity>
       </View>
      </ScrollView>
    </SafeAreaView>
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

  greeting: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 32,
    lineHeight: 36,
    color: '#000',
    marginBottom: 24,
  },

  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    height: 48,
    marginBottom: 0
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

  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
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
  }
})
