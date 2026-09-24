// src/screens/LoginScreen.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  Alert,
  DeviceEventEmitter,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Loading from "@/components/common/Loading";
import COLORS from "@/constants/colors";

import { loginApi } from "../../api/authApi";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // ĐĂNG NHẬP
  // =========================
  const handleLogin = async () => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // Kiểm tra dữ liệu nhập
    if (!cleanUsername || !cleanPassword) {
      Alert.alert(
        "Thông báo",
        "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!",
      );
      return;
    }

    try {
      setLoading(true);

      // 1. Gọi API đăng nhập Moodle
      const data = await loginApi(cleanUsername, cleanPassword);

      // 2. Kiểm tra kết quả đăng nhập
      if (!data?.token) {
        const errorMessage =
          data?.error ||
          data?.message ||
          "Tài khoản hoặc mật khẩu không chính xác.";

        Alert.alert("Lỗi đăng nhập", errorMessage);
        return;
      }

      // 3. Lưu token Moodle
      await AsyncStorage.setItem("wstoken", data.token);

      // 4. Xóa userid cũ
      // Tránh trường hợp đổi tài khoản
      // nhưng vẫn sử dụng userid của tài khoản trước
      await AsyncStorage.removeItem("userid");

      // 5. Thông báo app đã đăng nhập
      DeviceEventEmitter.emit("authChange");
    } catch (error) {
      Alert.alert(
        "Lỗi kết nối",
        "Không thể kết nối đến máy chủ Moodle. Vui lòng kiểm tra kết nối mạng hoặc server.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return <Loading message="Đang kết nối tới hệ thống Moodle..." />;
  }

  // =========================
  // UI
  // =========================
  return (
    <View style={styles.container}>
      {/* Logo / tên ứng dụng */}
      <View style={styles.header}>
        <Text style={styles.logo}>MekoEdu</Text>

        <Text style={styles.title}>Chào mừng bạn trở lại!</Text>

        <Text style={styles.subtitle}>Đăng nhập để tiếp tục học tập</Text>
      </View>

      {/* Form đăng nhập */}
      <View style={styles.form}>
        <AppInput
          label="Tên đăng nhập"
          placeholder="Nhập tên đăng nhập"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <AppInput
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <AppButton onPress={handleLogin} loading={loading} />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Đăng nhập bằng tài khoản Moodle</Text>
      </View>
    </View>
  );
}

// =========================
// STYLE
// =========================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: COLORS.background,
  },

  header: {
    alignItems: "center",
    marginBottom: 32,
  },

  logo: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  form: {
    width: "100%",
  },

  footer: {
    alignItems: "center",
    marginTop: 24,
  },

  footerText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
});
