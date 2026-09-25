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

      console.log("ROOT - Token hiện tại:", token);

      setUserToken(token);
    } catch (error) {
      console.error("ROOT - Lỗi khi đọc token:", error);
      setUserToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkToken();

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
      {!userToken ? (
        // =========================
        // CHƯA ĐĂNG NHẬP
        // =========================
        <Stack.Group navigationKey="guest">
          <Stack.Screen name="Splash" component={SplashScreen} />

          <Stack.Screen name="Onboarding" component={OnboardingScreen} />

          <Stack.Screen name="Launch" component={LaunchScreen} />

          <Stack.Screen name="Auth" component={AuthStack} />
        </Stack.Group>
      ) : (
        // =========================
        // ĐÃ ĐĂNG NHẬP
        // =========================
        <Stack.Group navigationKey="user">
          <Stack.Screen name="AppInit" component={AppInitScreen} />

          <Stack.Screen name="App" component={AppStack} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
