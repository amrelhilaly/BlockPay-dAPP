import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "../screens/WelcomeScreen";
import SignupScreen from "../screens/SignupScreen";
import ConnectWalletScreen from "../screens/ConnectWalletScreen";
import Dashboard from "../screens/Dashboard";
import LoginScreen from "../screens/LoginScreen";
import SendScreen from "../screens/SendScreen";
import ReceiveScreen from "../screens/RecieveScreen";

// Define the navigation parameter list to match screen props across your app
export type RootStackParamList = {
  Welcome: undefined;
  Signup: undefined;
  Login: undefined;
  ConnectWallet: undefined;
  Dashboard: { username: string }; 
  SendScreen: undefined // <— Add this
  ReceiveScreen: undefined;
};

// Create the stack navigator with the typed parameter list
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ConnectWallet" component={ConnectWalletScreen} />
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="SendScreen" component={SendScreen} />
      <Stack.Screen name="ReceiveScreen" component={ReceiveScreen} />

    </Stack.Navigator>
  );
}
