import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, DeviceEventEmitter, View } from "react-native";

import AppInitScreen from "../screens/launch/AppInitScreen";
import LaunchScreen from "../screens/launch/LaunchScreen";
import OnboardingScreen from "../screens/launch/OnboardingScreen";
import SplashScreen from "../screens/launch/SplashScreen";

import { RootStackParamList } from "../types/navigation";
import AppStack from "./AppStack";
import AuthStack from "./AuthStack";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem("wstoken");

      console.log("Token hiện tại:", token);

      setUserToken(token);
    } catch (error) {
      console.error("Lỗi khi đọc token:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkToken();

    const subscription = DeviceEventEmitter.addListener(
      "authChange",
      checkToken,
    );

    return () => subscription.remove();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#3EAF7C" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />

      <Stack.Screen name="Onboarding" component={OnboardingScreen} />

      <Stack.Screen name="Launch" component={LaunchScreen} />

      <Stack.Screen name="Auth" component={AuthStack} />

      {userToken != null && (
        <>
          <Stack.Screen name="AppInit" component={AppInitScreen} />

          <Stack.Screen name="App" component={AppStack} />
        </>
      )}
    </Stack.Navigator>
  );
}
