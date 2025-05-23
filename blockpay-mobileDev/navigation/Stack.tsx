import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "../screens/WelcomeScreen";
import SignupScreen from "../screens/SignupScreen";
import ConnectWalletScreen from "../screens/ConnectWalletScreen";
import Dashboard from "../screens/Dashboard";

// Define the navigation parameter list to match screen props across your app
export type RootStackParamList = {
  Welcome: undefined;
  Signup: undefined;
  ConnectWallet: undefined;
  Dashboard: undefined;
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
      <Stack.Screen name="ConnectWallet" component={ConnectWalletScreen} />
      <Stack.Screen name="Dashboard" component={Dashboard} />
    </Stack.Navigator>
  );
}
