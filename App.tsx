import { NavigationContainer } from "@react-navigation/native";
import { registerRootComponent } from "expo"; // 1. Import hàm này từ expo
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// 2. Thêm dòng này ở cuối file App.tsx
registerRootComponent(App);
