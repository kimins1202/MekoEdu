import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  DeviceEventEmitter,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import Loading from "@/components/common/Loading";
import MekoLogo from "@/components/common/MekoLogo";
import COLORS from "@/constants/colors";
import { loginApi } from "../../api/authApi";

const REMEMBER_USERNAME_KEY = "rememberUsername";
const REMEMBER_PASSWORD_KEY = "rememberPassword";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Đọc thông tin đăng nhập đã lưu
  useEffect(() => {
    loadRememberedAccount();
  }, []);

  const loadRememberedAccount = async () => {
    try {
      const rememberedUsername = await AsyncStorage.getItem(
        REMEMBER_USERNAME_KEY,
      );

      const rememberedPassword = await AsyncStorage.getItem(
        REMEMBER_PASSWORD_KEY,
      );

      if (rememberedUsername) {
        setUsername(rememberedUsername);
      }

      if (rememberedPassword) {
        setPassword(rememberedPassword);
        setRememberPassword(true);
      }
    } catch (error) {
      console.log("Không thể đọc thông tin đăng nhập đã lưu");
    }
  };

  // Đăng nhập
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

    try {
      setLoading(true);

      // Gọi API đăng nhập Moodle
      const data = await loginApi(cleanUsername, cleanPassword);

      // Kiểm tra kết quả đăng nhập
      if (!data?.token) {
        const errorMessage =
          data?.error ||
          data?.message ||
          "Tài khoản hoặc mật khẩu không chính xác.";

        Alert.alert("Lỗi đăng nhập", errorMessage);
        return;
      }

      // Lưu token Moodle
      await AsyncStorage.setItem("wstoken", data.token);

      // Xóa userid cũ khi đổi tài khoản
      await AsyncStorage.removeItem("userid");

      // Xử lý ghi nhớ tài khoản
      if (rememberPassword) {
        await AsyncStorage.setItem(REMEMBER_USERNAME_KEY, cleanUsername);

        await AsyncStorage.setItem(REMEMBER_PASSWORD_KEY, cleanPassword);
      } else {
        await AsyncStorage.removeItem(REMEMBER_USERNAME_KEY);
        await AsyncStorage.removeItem(REMEMBER_PASSWORD_KEY);
      }

      // Báo cho RootNavigator cập nhật trạng thái đăng nhập
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

  // Loading
  if (loading) {
    return <Loading message="Đang kết nối tới hệ thống Moodle..." />;
  }

  return (
    <View style={styles.container}>
      {/* Background decoration */}
      <View style={styles.backgroundCircleTop} />
      <View style={styles.backgroundCircleBottom} />

      {/* Header */}
      <View style={styles.header}>
        <MekoLogo size={78} />

        <View style={styles.brandName}>
          <Text style={styles.mekoText}>Meko</Text>
          <Text style={styles.eduText}>Edu</Text>
        </View>
      </View>

      {/* Form */}
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

        {/* Password */}
        <View style={styles.passwordWrapper}>
          <AppInput
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            style={styles.passwordInput}
          />

          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={21}
              color={COLORS.textLight}
            />
          </TouchableOpacity>
        </View>

        {/* Remember password */}
        <TouchableOpacity
          style={styles.rememberRow}
          onPress={() => setRememberPassword((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View
            style={[styles.checkbox, rememberPassword && styles.checkboxActive]}
          >
            {rememberPassword && (
              <Ionicons name="checkmark" size={15} color={COLORS.white} />
            )}
          </View>

          <Text style={styles.rememberText}>Ghi nhớ mật khẩu</Text>
        </TouchableOpacity>

        {/* Login */}
        <AppButton onPress={handleLogin} loading={loading} title="Đăng nhập" />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLine} />

        <View style={styles.footerContent}>
          <Ionicons
            name="shield-checkmark-outline"
            size={15}
            color={COLORS.textLight}
          />

          <Text style={styles.footerText}>Đăng nhập bằng tài khoản Moodle</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: COLORS.backgroundSoft,
    overflow: "hidden",
  },

  // Background
  backgroundCircleTop: {
    position: "absolute",
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: COLORS.primary,
    opacity: 0.05,
    top: -175,
    right: -120,
  },

  backgroundCircleBottom: {
    position: "absolute",
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: COLORS.primaryDark,
    opacity: 0.04,
    bottom: -205,
    left: -175,
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: 30,
  },

  brandName: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  mekoText: {
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -0.5,
  },

  eduText: {
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.primaryLight,
    letterSpacing: -0.5,
  },

  title: {
    marginTop: 20,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },

  subtitle: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // Form
  form: {
    width: "100%",
  },

  passwordWrapper: {
    position: "relative",
  },

  passwordInput: {
    paddingRight: 52,
  },

  eyeButton: {
    position: "absolute",
    right: 13,
    top: 34,
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },

  // Remember
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: -2,
    marginBottom: 16,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },

  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  rememberText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: 27,
  },

  footerLine: {
    width: 45,
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 11,
  },

  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
});
