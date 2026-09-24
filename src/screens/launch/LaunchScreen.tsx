// src/screens/launch/LaunchScreen.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import COLORS from "../../constants/colors";
import { RootStackParamList } from "../../types/navigation";

const { width } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Launch">;

export default function LaunchScreen() {
  const navigation = useNavigation<NavigationProp>();

  const handleStart = async () => {
    try {
      const token = await AsyncStorage.getItem("wstoken");

      if (token) {
        navigation.replace("AppInit");
      } else {
        navigation.replace("Auth");
      }
    } catch (error) {
      navigation.replace("Auth");
    }
  };

  return (
    <View style={styles.container}>
      {/* =========================
          Decorative Background
      ========================= */}

      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />

      {/* =========================
          Logo
      ========================= */}

      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>M</Text>
        </View>

        <View style={styles.logoDot} />
      </View>

      {/* =========================
          App Information
      ========================= */}

      <View style={styles.content}>
        <Text style={styles.welcomeText}>Chào mừng đến với</Text>

        <Text style={styles.appName}>MekoEdu</Text>

        <Text style={styles.description}>
          Nền tảng học tập trực tuyến{"\n"}
          đơn giản và thuận tiện.
        </Text>
      </View>

      {/* =========================
          Features
      ========================= */}

      <View style={styles.features}>
        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>📚</Text>
          <Text style={styles.featureText}>Khóa học</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>✏️</Text>
          <Text style={styles.featureText}>Bài thi</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>📊</Text>
          <Text style={styles.featureText}>Kết quả</Text>
        </View>
      </View>

      {/* =========================
          Start Button
      ========================= */}

      <TouchableOpacity
        style={styles.startButton}
        activeOpacity={0.8}
        onPress={handleStart}
      >
        <Text style={styles.buttonText}>Bắt đầu học</Text>

        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container

  container: {
    flex: 1,
    backgroundColor: "#F7FFF9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  // Decorative Background

  topCircle: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
    top: -170,
    right: -120,
  },

  bottomCircle: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: COLORS.primaryDark,
    opacity: 0.12,
    bottom: -220,
    left: -170,
  },

  // Logo

  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },

  logo: {
    width: 115,
    height: 115,
    borderRadius: 35,
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },

  logoText: {
    fontSize: 64,
    fontWeight: "800",
    color: COLORS.white,
  },

  logoDot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    right: -5,
    bottom: 8,
  },

  // Content

  content: {
    width: width * 0.85,
    alignItems: "center",
  },

  welcomeText: {
    fontSize: 21,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },

  appName: {
    marginTop: 4,
    fontSize: 42,
    fontWeight: "800",
    color: COLORS.primaryDark,
    textAlign: "center",
  },

  description: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 23,
    color: "#718078",
    textAlign: "center",
  },

  // Features

  features: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: width * 0.82,
    marginTop: 35,
  },

  featureCard: {
    width: "30%",
    minHeight: 85,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: COLORS.text,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  featureIcon: {
    fontSize: 25,
  },

  featureText: {
    marginTop: 7,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },

  // Start Button

  startButton: {
    position: "absolute",
    bottom: 45,
    width: width * 0.82,
    height: 58,
    borderRadius: 19,
    backgroundColor: COLORS.primaryDark,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },

  arrow: {
    marginLeft: 12,
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "600",
  },
});
