// src/screens/launch/AppInitScreen.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getSiteInfo } from "../../api/authApi";
import COLORS from "../../constants/colors";
import { RootStackParamList } from "../../types/navigation";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "AppInit">;

export default function AppInitScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [error, setError] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // 1. LẤY TOKEN

      const token = await AsyncStorage.getItem("wstoken");

      if (!token) {
        throw new Error("Không tìm thấy token đăng nhập");
      }

      // 2. GỌI MOODLE API LẤY THÔNG TIN USER

      const siteInfo = await getSiteInfo();

      // 3. KIỂM TRA USERID

      if (!siteInfo?.userid) {
        throw new Error("Moodle không trả về userid");
      }

      // 4. LƯU USERID

      await AsyncStorage.setItem("userid", String(siteInfo.userid));

      // 5. KIỂM TRA LẠI USERID

      const savedUserId = await AsyncStorage.getItem("userid");

      // 6. ĐI VÀO APP STACK

      navigation.replace("App");
    } catch (error) {
      console.error("APP INIT ERROR:", error);

      setError(true);

      Alert.alert(
        "Lỗi khởi tạo",
        "Không thể lấy thông tin tài khoản Moodle. Vui lòng đăng nhập lại.",
        [
          {
            text: "Đăng nhập lại",
            onPress: handleLogout,
          },
        ],
        {
          cancelable: false,
        },
      );
    }
  };

  // ĐĂNG XUẤT KHI APP INIT THẤT BẠI

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("wstoken");
      await AsyncStorage.removeItem("userid");

      DeviceEventEmitter.emit("authChange");
    } catch (error) {
      console.error("APP INIT LOGOUT ERROR:", error);
    }
  };

  // UI

  return (
    <View style={styles.container}>
      {!error ? (
        <>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.logo}>MekoEdu</Text>

          <Text style={styles.title}>Đang khởi tạo ứng dụng</Text>

          <Text style={styles.description}>
            Đang kết nối với hệ thống Moodle...
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.logo}>MekoEdu</Text>

          <Text style={styles.title}>Không thể khởi tạo ứng dụng</Text>

          <Text style={styles.description}>Vui lòng đăng nhập lại.</Text>
        </>
      )}
    </View>
  );
}
// STYLE

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },

  logo: {
    marginTop: 20,
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.primary,
  },

  title: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },

  description: {
    marginTop: 8,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
