// ProfileScreen.tsx

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/Stack'
import Feather from 'react-native-vector-icons/Feather'

import { getAuth, sendPasswordResetEmail } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'

import * as ImagePicker from 'expo-image-picker'
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage'

const HEADER_BASE_HEIGHT = 56

type ProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<ProfileNavProp>()
  const auth = getAuth()
  const user = auth.currentUser!

  const [userData, setUserData] = useState<{
    firstName: string
    lastName: string
    email: string
    photoURL: string
  }>({ firstName: '', lastName: '', email: '', photoURL: '' })

  const [loading, setLoading] = useState(true)
  const [editingFields, setEditingFields] = useState({
    firstName: false,
    lastName: false,
    email: false,
  })
  const [editingValues, setEditingValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })

  // fetch user document (or fall back to auth profile)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRef = doc(db, 'users', user.uid)
        const snap = await getDoc(userRef)
        if (snap.exists()) {
          const d = snap.data()
          setUserData({
            firstName: d.firstName || '',
            lastName: d.lastName || '',
            email: d.email || user.email || '',
            photoURL: d.photoURL || user.photoURL || '',
          })
        } else {
          setUserData({
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ')[1] || '',
            email: user.email || '',
            photoURL: user.photoURL || '',
          })
        }
      } catch (err) {
        console.error('Fetch user failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleEditField = (field: keyof typeof editingFields) => {
    setEditingFields(prev => ({ ...prev, [field]: true }))
    setEditingValues(prev => ({ ...prev, [field]: userData[field] }))
  }

  const handleSaveField = async (field: keyof typeof editingFields) => {
    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, { [field]: editingValues[field] })
      setUserData(prev => ({ ...prev, [field]: editingValues[field] }))
      setEditingFields(prev => ({ ...prev, [field]: false }))
    } catch (err) {
      Alert.alert('Error', `Could not update ${field}`)
      console.error(err)
    }
  }

  const handleEditImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!granted) {
      Alert.alert('Permission required', 'We need access to your photos.')
      return
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // use enum for correct type
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })

    if (!res.canceled && res.assets.length > 0) {
      const uri = res.assets[0].uri
      try {
        const blob = await (await fetch(uri)).blob()
        const ref = storageRef(getStorage(), `profilePictures/${user.uid}`)
        await uploadBytes(ref, blob)
        const url = await getDownloadURL(ref)
        const userRef = doc(db, 'users', user.uid)
        await updateDoc(userRef, { photoURL: url })
        setUserData(prev => ({ ...prev, photoURL: url }))
      } catch (err) {
        Alert.alert('Upload failed', 'Could not upload image.')
        console.error(err)
      }
    }
  }

  const handleChangePassword = async () => {
    try {
      await sendPasswordResetEmail(auth, userData.email)
      Alert.alert('Email sent', `Reset link sent to ${userData.email}`)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    }
  }

  const handleSignOut = async () => {
    await auth.signOut()
    navigation.replace('Login')
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + HEADER_BASE_HEIGHT }]}>
        <Text>Loading…</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* APP HEADER */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, height: HEADER_BASE_HEIGHT + insets.top },
        ]}
      >
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: HEADER_BASE_HEIGHT + insets.top }}>
        {/* Greeting */}
        <Text style={styles.greeting}>Hey {userData.firstName}</Text>

        {/* Profile Image */}
        <View style={styles.profileImageWrapper}>
          {userData.photoURL ? (
            <Image source={{ uri: userData.photoURL }} style={styles.profileImage} />
          ) : (
            <Feather name="user" size={64} color="#999" />
          )}
          <TouchableOpacity style={styles.editImageButton} onPress={handleEditImage}>
            <Feather name="edit-2" size={16} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Edit Info */}
        <Text style={styles.sectionTitle}>Edit Info</Text>
        {(['firstName', 'lastName', 'email'] as const).map(field => (
          <View key={field} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>
              {field === 'firstName'
                ? 'First Name:'
                : field === 'lastName'
                ? 'Last Name:'
                : 'Email:'}
            </Text>

            {editingFields[field] ? (
              <TextInput
                style={styles.fieldInput}
                value={editingValues[field]}
                onChangeText={t =>
                  setEditingValues(prev => ({ ...prev, [field]: t }))
                }
                autoFocus
              />
            ) : (
              <Text style={styles.fieldValue}>{userData[field]}</Text>
            )}

            <TouchableOpacity
              onPress={() =>
                editingFields[field]
                  ? handleSaveField(field)
                  : handleEditField(field)
              }
            >
              <Feather
                name={editingFields[field] ? 'check' : 'edit-2'}
                size={20}
                color="#000"
              />
            </TouchableOpacity>
          </View>
        ))}

        {/* More Options */}
        <Text style={styles.sectionTitle}>More Options</Text>
        <TouchableOpacity onPress={handleChangePassword}>
          <Text style={styles.option}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.option}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    fontSize: 24,
    fontFamily: 'Manrope_600SemiBold',
    marginTop: 16,
    marginLeft: 16,
  },
  profileImageWrapper: {
    alignSelf: 'center',
    marginTop: 16,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    marginTop: 24,
    marginLeft: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: 'Manrope_500Medium',
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: 'Manrope_400Regular',
  },
  fieldInput: {
    flex: 1,
    marginRight: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
    fontFamily: 'Manrope_400Regular',
  },
  option: {
    fontSize: 16,
    fontFamily: 'Manrope_500Medium',
    marginHorizontal: 16,
    marginVertical: 12,
  },
})
