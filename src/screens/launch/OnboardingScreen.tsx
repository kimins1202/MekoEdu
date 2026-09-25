import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppButton from "../../components/common/AppButton";
import COLORS from "../../constants/colors";
import { RootStackParamList } from "../../types/navigation";

const { width, height } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

const onboardingData = [
  {
    title: "Học tập không giới hạn",
    description:
      "Tiếp cận khóa học, bài giảng và tài liệu học tập ngay trên thiết bị của bạn.",
    icon: "book-outline" as keyof typeof Ionicons.glyphMap,
    smallIcon: "desktop-outline" as keyof typeof Ionicons.glyphMap,
    badgeTitle: "120+ Học phần",
    badgeSubtitle: "Tài liệu số ĐHCT",
    accessText: "24/7 Truy cập",
  },
  {
    title: "Làm bài thi trực tuyến",
    description:
      "Thực hiện bài thi nhanh chóng, theo dõi thời gian và quản lý câu trả lời ngay trên ứng dụng.",
    icon: "create-outline" as keyof typeof Ionicons.glyphMap,
    smallIcon: "checkmark-circle-outline" as keyof typeof Ionicons.glyphMap,
    badgeTitle: "Thi trực tuyến",
    badgeSubtitle: "Nhanh chóng & tiện lợi",
    accessText: "Theo dõi thời gian",
  },
  {
    title: "Theo dõi kết quả",
    description:
      "Xem điểm số, kết quả bài thi và tiến độ học tập để hiểu rõ quá trình học tập của bạn.",
    icon: "stats-chart-outline" as keyof typeof Ionicons.glyphMap,
    smallIcon: "trophy-outline" as keyof typeof Ionicons.glyphMap,
    badgeTitle: "Tiến độ học tập",
    badgeSubtitle: "Theo dõi dễ dàng",
    accessText: "Kết quả chi tiết",
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = onboardingData[currentIndex];

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex >= onboardingData.length - 1) {
      navigation.replace("Launch");
      return;
    }

    // Ẩn slide hiện tại
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.timing(contentTranslateY, {
        toValue: -8,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentIndex((prev) => prev + 1);

      contentTranslateY.setValue(8);

      // Hiện slide mới
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleSkip = () => {
    navigation.replace("Launch");
  };

  return (
    <View style={styles.container}>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        {/* Logo MekoSoft */}
        <View style={styles.headerLogoContainer}>
          <Image
            source={require("../../../assets/images/meko-logo-dark-rmbg.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        {/* Bỏ qua */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      {/* ================= CONTENT ================= */}
      <Animated.View
        style={[
          styles.animatedContent,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
        {/* ================= ILLUSTRATION ================= */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustrationBackground}>
            {/* Background decorations */}
            <View style={styles.circleTop} />
            <View style={styles.circleBottom} />

            {/* Main card */}
            <View style={styles.mainCard}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name={current.icon}
                  size={46}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.cardTitle}>{current.badgeTitle}</Text>

              <Text style={styles.cardSubtitle}>{current.badgeSubtitle}</Text>
            </View>

            {/* Top-right badge */}
            <View style={styles.topBadge}>
              <Ionicons
                name={current.smallIcon}
                size={24}
                color={COLORS.primary}
              />
            </View>

            {/* Bottom-left badge */}
            <View style={styles.accessBadge}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={COLORS.white}
              />

              <Text style={styles.accessBadgeText}>{current.accessText}</Text>
            </View>
          </View>
        </View>

        {/* ================= TEXT ================= */}
        <View style={styles.content}>
          <Text style={styles.title}>{current.title}</Text>

          <Text style={styles.description}>{current.description}</Text>
        </View>
      </Animated.View>

      {/* ================= BOTTOM ================= */}
      <View style={styles.bottomSection}>
        {/* Pagination */}
        <View style={styles.dots}>
          {onboardingData.map((_, index) => {
            const isActive = index === currentIndex;

            return (
              <View
                key={index}
                style={[styles.dot, isActive && styles.activeDot]}
              />
            );
          })}
        </View>

        {/* App Button */}
        <AppButton
          title={
            currentIndex === onboardingData.length - 1
              ? "Bắt đầu học"
              : "Tiếp tục"
          }
          onPress={handleNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // =========================
  // CONTAINER
  // =========================

  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // =========================
  // HEADER
  // =========================

  header: {
    height: 76,

    paddingTop: 36,
    paddingHorizontal: 24,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Nền xanh đồng nhất với hệ thống
  headerLogoContainer: {
    width: 44,
    height: 44,

    borderRadius: 13,

    backgroundColor: COLORS.primary,

    alignItems: "center",
    justifyContent: "center",

    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },

  // Logo M trắng đã được tách nền
  headerLogo: {
    width: 40,
    height: 40,
  },

  skipButton: {
    paddingVertical: 7,
    paddingHorizontal: 3,
  },

  skipText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  // =========================
  // ANIMATED CONTENT
  // =========================

  animatedContent: {
    flex: 1,
  },

  // =========================
  // ILLUSTRATION
  // =========================

  illustrationContainer: {
    width: width * 0.82,
    height: height * 0.38,

    alignSelf: "center",

    alignItems: "center",
    justifyContent: "center",

    marginTop: 4,
  },

  illustrationBackground: {
    width: width * 0.66,
    height: width * 0.66,

    maxWidth: 250,
    maxHeight: 250,

    borderRadius: 30,

    backgroundColor: COLORS.backgroundSoft,

    alignItems: "center",
    justifyContent: "center",

    position: "relative",

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // =========================
  // DECORATIONS
  // =========================

  circleTop: {
    position: "absolute",

    width: 75,
    height: 75,

    borderRadius: 38,

    backgroundColor: "rgba(125,186,24,0.18)",

    top: -25,
    left: -20,
  },

  circleBottom: {
    position: "absolute",

    width: 95,
    height: 95,

    borderRadius: 48,

    backgroundColor: "rgba(0,108,70,0.08)",

    bottom: -35,
    right: -30,
  },

  // =========================
  // MAIN CARD
  // =========================

  mainCard: {
    width: 140,
    height: 150,

    borderRadius: 18,

    backgroundColor: COLORS.white,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 12,

    shadowColor: COLORS.black,

    shadowOffset: {
      width: 0,
      height: 7,
    },

    shadowOpacity: 0.1,
    shadowRadius: 15,

    elevation: 7,
  },

  iconCircle: {
    width: 56,
    height: 56,

    borderRadius: 28,

    backgroundColor: COLORS.backgroundSoft,

    borderWidth: 1,
    borderColor: COLORS.border,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 9,
  },

  cardTitle: {
    fontSize: 13,

    fontWeight: "800",

    color: COLORS.text,

    textAlign: "center",
  },

  cardSubtitle: {
    fontSize: 10,

    color: COLORS.textSecondary,

    textAlign: "center",

    marginTop: 3,
  },

  // =========================
  // TOP BADGE
  // =========================

  topBadge: {
    position: "absolute",

    right: -17,
    top: 12,

    width: 50,
    height: 50,

    borderRadius: 15,

    backgroundColor: COLORS.white,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: COLORS.black,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 5,
  },

  // =========================
  // ACCESS BADGE
  // =========================

  accessBadge: {
    position: "absolute",

    left: -17,
    bottom: 12,

    height: 28,

    paddingHorizontal: 11,

    borderRadius: 14,

    backgroundColor: COLORS.primary,

    flexDirection: "row",
    alignItems: "center",

    gap: 4,

    shadowColor: COLORS.primary,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.2,
    shadowRadius: 5,

    elevation: 4,
  },

  accessBadgeText: {
    color: COLORS.white,

    fontSize: 9,

    fontWeight: "700",
  },

  // =========================
  // CONTENT
  // =========================

  content: {
    width: width * 0.82,

    alignSelf: "center",

    alignItems: "center",

    marginTop: 2,
  },

  title: {
    fontSize: 26,

    lineHeight: 33,

    fontWeight: "800",

    color: COLORS.text,

    textAlign: "center",
  },

  description: {
    marginTop: 12,

    fontSize: 14,

    lineHeight: 21,

    color: COLORS.textSecondary,

    textAlign: "center",
  },

  // =========================
  // BOTTOM
  // =========================

  bottomSection: {
    width: width * 0.82,

    alignSelf: "center",

    marginTop: "auto",
    marginBottom: 32,

    alignItems: "center",
  },

  // =========================
  // DOTS
  // =========================

  dots: {
    flexDirection: "row",

    alignItems: "center",

    marginBottom: 20,

    gap: 7,
  },

  dot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: COLORS.border,
  },

  activeDot: {
    width: 24,

    backgroundColor: COLORS.primary,
  },
});
