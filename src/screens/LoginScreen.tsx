// src/screens/LoginScreen.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { loginApi } from "../api/authApi";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ĐĂNG NHẬP

  const handleLogin = async () => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // Kiểm tra input
    if (!cleanUsername || !cleanPassword) {
      Alert.alert(
        "Thông báo",
        "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!",
      );
      return;
    }

    try {
      setLoading(true);

      // 1. GỌI API LOGIN

      const data = await loginApi(cleanUsername, cleanPassword);

      // 2. KIỂM TRA LOGIN

      if (!data?.token) {
        const errorMessage =
          data?.error ||
          data?.message ||
          "Tài khoản hoặc mật khẩu không chính xác.";

        Alert.alert("Lỗi đăng nhập", errorMessage);

        return;
      }

      // 3. LƯU TOKEN

      await AsyncStorage.setItem("wstoken", data.token);

      // 4. XÓA USERID CŨ
      // Tránh trường hợp đổi tài khoản
      // nhưng vẫn giữ userid của tài khoản trước.

      await AsyncStorage.removeItem("userid");

      // 5. BÁO APP ĐÃ ĐĂNG NHẬP

      DeviceEventEmitter.emit("authChange");
    } catch (error: any) {
      Alert.alert(
        "Lỗi kết nối",
        "Không thể kết nối đến máy chủ Moodle. Vui lòng kiểm tra kết nối mạng hoặc server.",
      );
    } finally {
      setLoading(false);
    }
  };

  // UI

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MekoEdu</Text>

      <Text style={styles.subtitle}>Đăng nhập tài khoản Moodle</Text>

      {/* USERNAME */}

      <Text style={styles.label}>Tên đăng nhập</Text>

      <TextInput
        style={styles.input}
        placeholder="Nhập tên đăng nhập"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />

      {/* PASSWORD */}

      <Text style={styles.label}>Mật khẩu</Text>

      <TextInput
        style={styles.input}
        placeholder="Nhập mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      {/* LOGIN BUTTON */}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Đăng nhập</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// STYLE

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2563EB",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 32,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
  },

  button: {
    height: 48,
    backgroundColor: "#2563EB",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },

  buttonDisabled: {
    backgroundColor: "#93C5FD",
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
