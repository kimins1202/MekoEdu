import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, DeviceEventEmitter } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { STORAGE_KEYS } from "../constants/config";
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
  const [hasSeenLaunch, setHasSeenLaunch] = useState(false);

  const checkToken = async () => {
    try {
      const [token, launchSeen] = await AsyncStorage.multiGet([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.LAUNCH_SEEN,
      ]);

      const currentToken = token[1];
      const hasCompletedLaunch = launchSeen[1] === "true" || Boolean(currentToken);

      if (currentToken && launchSeen[1] !== "true") {
        await AsyncStorage.setItem(STORAGE_KEYS.LAUNCH_SEEN, "true");
      }

      setUserToken(currentToken);
      setHasSeenLaunch(hasCompletedLaunch);
    } catch (error) {
      console.error("ROOT - Lỗi khi đọc token:", error);
      setUserToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(checkToken);

    const subscription = DeviceEventEmitter.addListener("authChange", () => {
      console.log("ROOT - Nhận authChange");
      checkToken();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView
        edges={["top", "right", "bottom", "left"]}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#3EAF7C" />
      </SafeAreaView>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {userToken ? (
        // =========================
        // ĐÃ ĐĂNG NHẬP
        // =========================
        <Stack.Group navigationKey="user">
          <Stack.Screen name="AppInit" component={AppInitScreen} />

          <Stack.Screen name="App" component={AppStack} />
        </Stack.Group>
      ) : hasSeenLaunch ? (
        <Stack.Group navigationKey="returning-guest">
          <Stack.Screen name="Auth" component={AuthStack} />
        </Stack.Group>
      ) : (
        // =========================
        // FIRST-TIME GUEST
        // =========================
        <Stack.Group navigationKey="first-time-guest">
          <Stack.Screen name="Splash" component={SplashScreen} />

          <Stack.Screen name="Onboarding" component={OnboardingScreen} />

          <Stack.Screen name="Launch" component={LaunchScreen} />

          <Stack.Screen name="Auth" component={AuthStack} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
