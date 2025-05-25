// WelcomeScreen.tsx

import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type RootStackParamList = {
  Welcome: undefined;
  Signup:  undefined;
  Login:   undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/blockpay.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Title & Subtitle */}
      <Text style={styles.title}>BlockPay</Text>
      <Text style={styles.subtitle}>Hey there, welcome to BlockPay</Text>

      {/* Buttons */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate("Signup")}
        >
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const BUTTON_RADIUS = 8;

const styles = StyleSheet.create({
  container: {
    flex:           1,
    justifyContent: "center",
    alignItems:     "center",
    padding:        20,
    backgroundColor: "#fff",
  },
  logoContainer: {
    width:           120,
    height:          120,
    borderRadius:    60,
    backgroundColor: "#f0f0f0",
    justifyContent:  "center",
    alignItems:      "center",
    marginBottom:    32,
  },
  logo: {
    width:  80,
    height: 80,
  },
  title: {
    fontSize:   28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign:    "center",
  },
  subtitle: {
    fontSize:   16,
    color:      "#555",
    marginBottom: 40,
    textAlign:    "center",
  },
  buttonGroup: {
    width: "100%",
  },
  loginButton: {
    backgroundColor: "#2979FF",
    paddingVertical: 14,
    borderRadius:    BUTTON_RADIUS,
    alignItems:      "center",
    marginBottom:    12,
  },
  loginButtonText: {
    color:     "#fff",
    fontSize:  16,
    fontWeight: "600",
  },
  signupButton: {
    backgroundColor: "#F2F3F5",
    paddingVertical: 14,
    borderRadius:    BUTTON_RADIUS,
    alignItems:      "center",
  },
  signupButtonText: {
    color:     "#333",
    fontSize:  16,
    fontWeight: "600",
  },
});
