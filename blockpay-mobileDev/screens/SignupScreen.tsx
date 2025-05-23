import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Text, Alert } from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type RootStackParamList = {
  Signup: undefined;
  ConnectWallet: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Signup">;

export default function SignupScreen({ navigation }: Props) {
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [status, setStatus] = useState("");

  const handleChange = (key: keyof typeof user, value: string) => {
    setUser({ ...user, [key]: value });
  };

  const handleSubmit = async () => {
    if (!user.firstName || !user.lastName || !user.email) {
      Alert.alert("Please fill in all required fields.");
      return;
    }

    try {
      await addDoc(collection(db, "users"), {
        ...user,
        createdAt: new Date(),
      });
      navigation.navigate("ConnectWallet");
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to save user.");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="First Name"
        style={styles.input}
        onChangeText={(text) => handleChange("firstName", text)}
        value={user.firstName}
      />
      <TextInput
        placeholder="Last Name"
        style={styles.input}
        onChangeText={(text) => handleChange("lastName", text)}
        value={user.lastName}
      />
      <TextInput
        placeholder="Email"
        style={styles.input}
        keyboardType="email-address"
        onChangeText={(text) => handleChange("email", text)}
        value={user.email}
      />
      <TextInput
        placeholder="Phone (optional)"
        style={styles.input}
        keyboardType="phone-pad"
        onChangeText={(text) => handleChange("phone", text)}
        value={user.phone}
      />
      <Button title="Next → Connect Wallet" onPress={handleSubmit} />
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
  },
  status: {
    marginTop: 10,
    textAlign: "center",
    color: "red",
  },
});
