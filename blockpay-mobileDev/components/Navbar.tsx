import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';

type Tab = {
  name: 'Home' | 'Wallets' | 'History' | 'Profile';
  icon: string;
  route: string;
};

const TABS: Tab[] = [
  { name: 'Home', icon: 'home', route: 'Dashboard' },
  { name: 'Wallets', icon: 'wallet', route: 'ManageWallets' },
  { name: 'History', icon: 'history', route: 'History' },
  { name: 'Profile', icon: 'user-circle', route: 'Profile' },
];

export default function NavBar() {
  const nav = useNavigation();
  return (
    <View style={styles.container}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={styles.tab}
          onPress={() => nav.navigate(tab.route as never)}
        >
          <FontAwesome5 name={tab.icon as any} size={20} color="#666" />
          <Text style={styles.label}>{tab.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
