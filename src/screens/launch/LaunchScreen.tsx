import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppButton from "../../components/common/AppButton";
import MekoLogo from "../../components/common/MekoLogo";
import COLORS from "../../constants/colors";
import { RootStackParamList } from "../../types/navigation";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Launch">;

type Feature = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: "book-outline",
    title: "Khóa học",
    description: "Học mọi lúc",
  },
  {
    icon: "create-outline",
    title: "Bài thi",
    description: "Thi trực tuyến",
  },
  {
    icon: "stats-chart-outline",
    title: "Kết quả",
    description: "Theo dõi tiến độ",
  },
];

export default function LaunchScreen() {
  const navigation = useNavigation<NavigationProp>();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(18)).current;

  const featuresOpacity = useRef(new Animated.Value(0)).current;
  const featuresTranslateY = useRef(new Animated.Value(18)).current;

  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }),
      ]),

      // Nội dung
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),

      // Các chức năng
      Animated.parallel([
        Animated.timing(featuresOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(featuresTranslateY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),

      // Button
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleStart = async () => {
    try {
      const token = await AsyncStorage.getItem("wstoken");

      if (token) {
        navigation.replace("AppInit");
      } else {
        navigation.replace("Auth");
      }
    } catch {
      navigation.replace("Auth");
    }
  };

  const handleLogin = () => {
    navigation.replace("Auth");
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <MekoLogo size={96} />
      </Animated.View>

      {/* Tên ứng dụng */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
        <Text style={styles.welcome}>Chào mừng đến với</Text>

        <View style={styles.brandName}>
          <Text style={styles.mekoText}>Meko</Text>
          <Text style={styles.eduText}>Edu</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.description}>
          Nền tảng học tập trực tuyến{"\n"}
          đơn giản và thuận tiện.
        </Text>
      </Animated.View>

      {/* Giới thiệu chức năng */}
      <Animated.View
        style={[
          styles.features,
          {
            opacity: featuresOpacity,
            transform: [{ translateY: featuresTranslateY }],
          },
        ]}
      >
        {FEATURES.map((feature) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </Animated.View>

      {/* Nút bắt đầu */}
      <Animated.View
        style={[
          styles.bottomSection,
          {
            opacity: buttonOpacity,
            transform: [{ translateY: buttonTranslateY }],
          },
        ]}
      >
        <AppButton title="Bắt đầu học" onPress={handleStart} />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          activeOpacity={0.7}
        >
          <Text style={styles.loginText}>
            Đã có tài khoản?{" "}
            <Text style={styles.loginHighlight}>Đăng nhập</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

type FeatureCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
};

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={22} color={COLORS.primary} />
      </View>

      <Text style={styles.featureTitle}>{title}</Text>

      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    paddingHorizontal: 24,
  },

  logoWrapper: {
    marginTop: 70,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    alignItems: "center",
    marginTop: 24,
  },

  welcome: {
    fontSize: 17,
    fontWeight: "500",
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  brandName: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  mekoText: {
    fontSize: 42,
    lineHeight: 50,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: -1,
  },

  eduText: {
    fontSize: 42,
    lineHeight: 50,
    fontWeight: "800",
    color: COLORS.primaryLight,
    letterSpacing: -1,
  },

  divider: {
    width: 42,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primaryLight,
    marginTop: 15,
    marginBottom: 14,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  features: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 32,
  },

  featureCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    marginBottom: 8,
  },

  featureTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },

  featureDescription: {
    marginTop: 3,
    fontSize: 9,
    color: COLORS.textLight,
    textAlign: "center",
  },

  bottomSection: {
    width: "100%",
    marginTop: "auto",
    marginBottom: 32,
    alignItems: "center",
  },

  loginButton: {
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  loginText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  loginHighlight: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});
