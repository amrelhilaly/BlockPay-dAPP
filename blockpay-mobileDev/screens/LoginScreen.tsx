import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type RootStackParamList = {
  Login:         undefined;
  Signup:        undefined;
  ConnectWallet: undefined;
  Dashboard:     undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      // 1) Sign in
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // 2) Query wallets by that UID
      const walletSnap = await getDocs(
        query(collection(db, "wallets"), where("uid", "==", uid))
      );

      // 3) Redirect based on existence
      if (walletSnap.empty) {
        navigation.replace("ConnectWallet");
      } else {
        navigation.replace("Dashboard");
      }
    } catch (err: any) {
      console.error("Login failed", err);
      Alert.alert("Login Error", err.message || "Could not log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log In</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title={loading ? "Logging in..." : "Log In"}
        onPress={handleLogin}
        disabled={loading}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <Button
          title="Sign Up"
          onPress={() => navigation.navigate("Signup")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff",
  },
  title: {
    fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center",
  },
  input: {
    borderWidth: 1, borderColor: "#ccc",
    padding: 12, marginBottom: 12, borderRadius: 6,
  },
  footer: {
    marginTop: 24, alignItems: "center",
  },
  footerText: {
    marginBottom: 8, color: "#666",
  },
});
