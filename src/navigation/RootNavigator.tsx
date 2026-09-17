import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, DeviceEventEmitter, View } from "react-native";

import AppInitScreen from "../screens/AppInitScreen";
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
      console.error("Lỗi khi đọc token từ AsyncStorage:", error);
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

  // =========================
  // APP ĐANG KIỂM TRA TOKEN
  // =========================

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {userToken == null ? (
        // =========================
        // CHƯA ĐĂNG NHẬP
        // =========================
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        // =========================
        // ĐÃ CÓ TOKEN
        // =========================
        <>
          <Stack.Screen name="AppInit" component={AppInitScreen} />

          <Stack.Screen name="App" component={AppStack} />
        </>
      )}
    </Stack.Navigator>
  );
}
