// navigation/stack.tsx

import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator }  from '@react-navigation/bottom-tabs'
import Feather                       from 'react-native-vector-icons/Feather'

import WelcomeScreen       from '../screens/WelcomeScreen'
import SignupScreen        from '../screens/SignupScreen'
import LoginScreen         from '../screens/LoginScreen'
import ConnectWalletScreen from '../screens/ConnectWalletScreen'

import Dashboard           from '../screens/Dashboard'
import ManageWallets       from '../screens/ManageWallets'
import TxHistory           from '../screens/TxHistory'
import Profile             from '../screens/Profile'

import SendScreen          from '../screens/SendScreen'
import ReceiveScreen       from '../screens/RecieveScreen'

// 1) Root‐stack param list:
export type RootStackParamList = {
  Dashboard:     undefined
  Welcome:       undefined
  Signup:        undefined
  Login:         undefined
  ConnectWallet: undefined
  MainTabs:      undefined
  SendScreen:    undefined
  ReceiveScreen: undefined
  Profile: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

// 2) Tab param list (only the four main tabs)
export type TabParamList = {
  Dashboard:     undefined
  ManageWallets: undefined
  TxHistory:     undefined
  Profile:       undefined
}

const Tab = createBottomTabNavigator<TabParamList>()

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown:     false,
        tabBarShowLabel: false,              // ← hide labels
        tabBarActiveTintColor:   '#000',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ color, size }) => {
          let name: string
          switch (route.name) {
            case 'Dashboard':
              name = 'home'
              break
            case 'ManageWallets':
              name = 'credit-card'
              break
            case 'TxHistory':
              name = 'clock'
              break
            case 'Profile':
              name = 'user'
              break
            default:
              name = 'circle'
          }
          return <Feather name={name} size={22} color={color} />
        },
      })}
    >
      <Tab.Screen name="Dashboard"     component={Dashboard}     />
      <Tab.Screen name="ManageWallets" component={ManageWallets} />
      <Tab.Screen name="TxHistory"     component={TxHistory}     />
      <Tab.Screen name="Profile"       component={Profile}       />
    </Tab.Navigator>
  )
}

// 3) Root stack includes the tabs plus send/receive
export default function StackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      {/* Auth & Onboarding */}
      <Stack.Screen name="Welcome"       component={WelcomeScreen}       />
      <Stack.Screen name="Dashboard"     component={Dashboard}           />
      <Stack.Screen name="Signup"        component={SignupScreen}        />
      <Stack.Screen name="Login"         component={LoginScreen}         />
      <Stack.Screen name="ConnectWallet" component={ConnectWalletScreen} />

      {/* Main bottom‐tabs */}
      <Stack.Screen name="MainTabs"      component={MainTabs}            />

      {/* Pushed modals / flows */}
      <Stack.Screen name="SendScreen"    component={SendScreen}          />
      <Stack.Screen name="ReceiveScreen" component={ReceiveScreen}       />
    </Stack.Navigator>
  )
}
