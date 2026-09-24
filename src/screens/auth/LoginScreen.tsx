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

  // =========================
  // ĐỌC THÔNG TIN ĐĂNG NHẬP ĐÃ LƯU
  // =========================
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

      // 5. Xử lý ghi nhớ tài khoản
      if (rememberPassword) {
        await AsyncStorage.setItem(REMEMBER_USERNAME_KEY, cleanUsername);

        await AsyncStorage.setItem(REMEMBER_PASSWORD_KEY, cleanPassword);
      } else {
        await AsyncStorage.removeItem(REMEMBER_USERNAME_KEY);
        await AsyncStorage.removeItem(REMEMBER_PASSWORD_KEY);
      }

      // 6. Thông báo app đã đăng nhập
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
      {/* Decorative background */}
      <View style={styles.backgroundCircleTop} />
      <View style={styles.backgroundCircleBottom} />

      {/* =========================
          HEADER
      ========================= */}
      <View style={styles.header}>
        {/* Logo */}
        <View style={styles.logoWrapper}>
          <View style={styles.logoGlow} />

          <View style={styles.logo}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
        </View>

        <Text style={styles.logoName}>
          Meko<Text style={styles.logoEdu}>Edu</Text>
        </Text>

        <Text style={styles.title}>Chào mừng bạn trở lại!</Text>

        <Text style={styles.subtitle}>
          Đăng nhập để tiếp tục hành trình học tập
        </Text>
      </View>

      {/* =========================
          FORM
      ========================= */}
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

        {/* Login button */}
        <AppButton onPress={handleLogin} loading={loading} title="Đăng nhập" />
      </View>

      {/* =========================
          FOOTER
      ========================= */}
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

// =========================
// STYLE
// =========================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#F7FBF8",
    overflow: "hidden",
  },

  // =========================
  // BACKGROUND
  // =========================

  backgroundCircleTop: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: COLORS.primary,
    opacity: 0.055,
    top: -150,
    right: -100,
  },

  backgroundCircleBottom: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: COLORS.primaryDark,
    opacity: 0.045,
    bottom: -190,
    left: -160,
  },

  // =========================
  // HEADER
  // =========================

  header: {
    alignItems: "center",
    marginBottom: 30,
  },

  logoWrapper: {
    width: 92,
    height: 92,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  logoGlow: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    opacity: 0.08,
  },

  logo: {
    width: 68,
    height: 68,
    borderRadius: 21,

    backgroundColor: COLORS.primaryDark,

    justifyContent: "center",
    alignItems: "center",

    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,

    elevation: 6,
  },

  logoLetter: {
    color: COLORS.white,
    fontSize: 39,
    fontWeight: "800",
    letterSpacing: -1,
  },

  logoName: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 0.2,
    marginBottom: 18,
  },

  logoEdu: {
    color: COLORS.primary,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 7,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // =========================
  // FORM
  // =========================

  form: {
    width: "100%",
  },

  // =========================
  // PASSWORD
  // =========================

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

  // =========================
  // REMEMBER
  // =========================

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",

    alignSelf: "flex-start",

    marginTop: -2,
    marginBottom: 14,
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

  // =========================
  // FOOTER
  // =========================

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
