import { NavigationContainer } from "@react-navigation/native";
import { registerRootComponent } from "expo"; // 1. Import hàm này từ expo
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
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
