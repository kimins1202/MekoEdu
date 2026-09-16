import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, DeviceEventEmitter, View } from "react-native";
import { RootStackParamList } from "../types/navigation";
import AppStack from "./AppStack";
import AuthStack from "./AuthStack";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  const checkToken = async () => {
    try {
      // Đã bỏ removeItem để không làm mất token hợp lệ
      const token = await AsyncStorage.getItem("wstoken");
      console.log("Token hiện tại:", token);
      setUserToken(token);
    } catch (e) {
      console.error("Lỗi khi đọc token từ AsyncStorage", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkToken();

    // Lắng nghe sự kiện đăng nhập / đăng xuất để re-render RootNavigator
    const subscription = DeviceEventEmitter.addListener(
      "authChange",
      checkToken,
    );
    return () => subscription.remove();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken == null ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <Stack.Screen name="App" component={AppStack} />
      )}
    </Stack.Navigator>
  );
}
