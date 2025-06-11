// src/components/NavBar.tsx

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

type Tab = {
  routeName: string;
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
  inactiveIcon: React.ComponentProps<typeof Ionicons>['name'];
};

const TABS: Tab[] = [
  {
    routeName: 'Dashboard',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  {
    routeName: 'ManageWallets',
    activeIcon: 'wallet',
    inactiveIcon: 'wallet-outline',
  },
  {
    routeName: 'History',
    activeIcon: 'time',
    inactiveIcon: 'time-outline',
  },
  {
    routeName: 'Profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
];

export default function NavBar() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, object | undefined>, string>>();

  return (
    <View style={styles.container}>
      {TABS.map(({ routeName, activeIcon, inactiveIcon }) => {
        const focused = route.name === routeName;
        return (
          <TouchableOpacity
            key={routeName}
            style={styles.tab}
            onPress={() => navigation.navigate(routeName as never)}
          >
            <Ionicons
              name={focused ? activeIcon : inactiveIcon}
              size={24}
              color={focused ? '#000' : '#666'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
});
