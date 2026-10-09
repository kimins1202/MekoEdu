import { NavigationContainer } from "@react-navigation/native";
import { registerRootComponent } from "expo"; // 1. Import hàm này từ expo
import { useEffect } from "react";
import { Appearance } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem("themeMode")
      .then((mode) => {
        if (!isMounted) {
          return;
        }

        if (mode === "dark" || mode === "light") {
          Appearance.setColorScheme(mode);
        }
      })
      .catch((error: unknown) => {
        console.error("Không thể tải giao diện đã lưu:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// 2. Thêm dòng này ở cuối file App.tsx
registerRootComponent(App);
