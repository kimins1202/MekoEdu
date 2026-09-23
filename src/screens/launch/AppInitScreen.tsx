import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

import { getSiteInfo } from "../../api/authApi";
import { RootStackParamList } from "../../types/navigation";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "AppInit">;

export default function AppInitScreen() {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const siteInfo = await getSiteInfo();

      if (!siteInfo?.userid) {
        throw new Error("Không tìm thấy userid");
      }

      await AsyncStorage.setItem("userid", String(siteInfo.userid));

      // Khởi tạo xong → vào App
      navigation.replace("App");
    } catch (error: any) {
      Alert.alert(
        "Lỗi khởi tạo",
        "Không thể lấy thông tin tài khoản. Vui lòng đăng nhập lại.",
        [
          {
            text: "OK",
            onPress: async () => {
              await AsyncStorage.removeItem("wstoken");
              await AsyncStorage.removeItem("userid");
            },
          },
        ],
      );
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563EB" />

      <Text style={styles.text}>Đang khởi tạo ứng dụng...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  text: {
    marginTop: 12,
    fontSize: 15,
    color: "#6B7280",
  },
});

