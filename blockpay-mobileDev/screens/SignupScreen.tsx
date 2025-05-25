// SignupScreen.tsx

import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  Alert
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type RootStackParamList = {
  Signup: undefined;
  ConnectWallet: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Signup">;

export default function SignupScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [password,  setPassword]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1) Create user in Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // 2) Save profile data in Firestore under users/{uid}
      await setDoc(doc(db, "users", cred.user.uid), {
        firstName,
        lastName,
        email,
        phone: phone || null,
        createdAt: new Date(),
      });

      // 3) Go to wallet connection
      navigation.replace("ConnectWallet");
    } catch (err: any) {
      console.error("Signup failed", err);
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="First Name"
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        placeholder="Last Name"
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        placeholder="Email"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        placeholder="Phone (optional)"
        style={styles.input}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title={loading ? "Signing Up..." : "Sign Up & Connect Wallet"}
        onPress={handleSubmit}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: "center", padding: 20
  },
  input: {
    borderWidth: 1, borderColor: "#ccc",
    padding: 12, marginBottom: 12, borderRadius: 6
  },
  error: {
    color: "red", textAlign: "center", marginBottom: 12
  }
});
