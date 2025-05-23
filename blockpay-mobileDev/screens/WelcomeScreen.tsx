import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type RootStackParamList = {
  Welcome: undefined;
  Signup: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to BlockPay</Text>
      <Text style={styles.subtitle}>Secure blockchain payments made simple</Text>

      <View style={styles.buttonGroup}>
        <Button title="Sign Up" onPress={() => navigation.navigate("Signup")} />
        <View style={{ height: 10 }} />
        <Button title="Log In" onPress={() => alert("Login not implemented yet")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 32,
    textAlign: "center",
  },
  buttonGroup: {
    width: "80%",
  },
});
