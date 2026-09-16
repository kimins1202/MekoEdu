import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { loginApi } from "../api/authApi";
import { RootStackParamList } from "../types/navigation";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  const handleLogin = async () => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      Alert.alert(
        "Thông báo",
        "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!",
      );
      return;
    }

    setLoading(true);

    try {
      const data = await loginApi(cleanUsername, cleanPassword);
      console.log("Moodle Response Data:", data);

      if (data.token) {
        // 1. Lưu token vào AsyncStorage
        await AsyncStorage.setItem("wstoken", data.token);
        console.log("Token đã lưu thành công:", data.token);

        // 2. Chuyển sang luồng AppStack (màn hình ExamListScreen)
        navigation.getParent()?.reset({
          index: 0,
          routes: [{ name: "App" }],
        });
      } else {
        // Xử lý các dạng lỗi trả về từ Moodle Web Service
        const errorMessage =
          data.error ||
          data.message ||
          "Tài khoản hoặc mật khẩu không chính xác.";
        Alert.alert("Lỗi đăng nhập", errorMessage);
      }
    } catch (error: any) {
      console.error("Lỗi khi gọi API đăng nhập:", error);
      Alert.alert(
        "Lỗi kết nối",
        "Không thể kết nối đến máy chủ Moodle. Vui lòng kiểm tra lại kết nối mạng hoặc server IP.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MekoEdu</Text>
      <Text style={styles.subtitle}>Đăng nhập tài khoản Moodle</Text>

      <TextInput
        style={styles.input}
        placeholder="Tên đăng nhập / Email"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

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
