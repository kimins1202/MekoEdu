import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppButton from "../../components/common/AppButton";

const { width, height } = Dimensions.get("window");

const COLORS = {
  primary: "#008A3D",
  secondary: "#3EAF7C",

  greenLight: "#DDF7E5",
  greenPale: "#E8F9ED",
  greenSoft: "#C9F2D5",

  dark: "#26352E",
  text: "#52625A",
  textSecondary: "#718078",

  white: "#FFFFFF",
  dot: "#D5E5DC",
};

const onboardingData = [
  {
    title: "Học tập không giới hạn",
    description:
      "Tiếp cận hàng trăm khóa học đại học chất lượng cao, bài giảng tương tác và tài liệu ôn tập chuẩn trên thiết bị của bạn.",
    icon: "book-outline" as keyof typeof Ionicons.glyphMap,
    smallIcon: "desktop-outline" as keyof typeof Ionicons.glyphMap,
    badgeTitle: "120+ Học phần",
    badgeSubtitle: "Tài liệu số ĐHCT",
    accessText: "24/7 Truy cập",
  },
  {
    title: "Làm bài thi trực tuyến",
    description:
      "Thực hiện các bài thi trực tuyến nhanh chóng, theo dõi thời gian và quản lý câu trả lời ngay trên ứng dụng.",
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

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = onboardingData[currentIndex];

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      navigation.replace("Launch");
    }
  };

  const handleSkip = () => {
    navigation.replace("Launch");
  };

  return (
    <View style={styles.container}>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      {/* ================= ILLUSTRATION ================= */}
      <View style={styles.illustrationContainer}>
        <View style={styles.illustrationBackground}>
          {/* Background decorations */}
          <View style={styles.circleTop} />
          <View style={styles.circleBottom} />

          {/* Main white card */}
          <View style={styles.mainCard}>
            <View style={styles.iconCircle}>
              <Ionicons name={current.icon} size={48} color={COLORS.primary} />
            </View>

            <Text style={styles.cardTitle}>{current.badgeTitle}</Text>

            <Text style={styles.cardSubtitle}>{current.badgeSubtitle}</Text>
          </View>

          {/* Top-right icon */}
          <View style={styles.topBadge}>
            <Ionicons
              name={current.smallIcon}
              size={25}
              color={COLORS.primary}
            />
          </View>

          {/* Bottom-left badge */}
          <View style={styles.accessBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />

            <Text style={styles.accessBadgeText}>{current.accessText}</Text>
          </View>
        </View>
      </View>

      {/* ================= CONTENT ================= */}
      <View style={styles.content}>
        <Text style={styles.title}>{current.title}</Text>

        <Text style={styles.description}>{current.description}</Text>
      </View>

      {/* ================= BOTTOM ================= */}
      <View style={styles.bottomSection}>
        {/* Pagination dots */}
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

        {/* System Button */}
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
  // ================= CONTAINER =================

  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // ================= HEADER =================

  header: {
    height: 75,
    paddingTop: 38,
    paddingHorizontal: 25,
    alignItems: "flex-end",
    justifyContent: "center",
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

  // ================= ILLUSTRATION =================

  illustrationContainer: {
    width: width * 0.82,
    height: height * 0.38,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  illustrationBackground: {
    width: width * 0.66,
    height: width * 0.66,
    maxWidth: 250,
    maxHeight: 250,

    borderRadius: 30,

    backgroundColor: COLORS.greenLight,

    alignItems: "center",
    justifyContent: "center",

    position: "relative",
  },

  // ================= DECORATION =================

  circleTop: {
    position: "absolute",

    width: 75,
    height: 75,

    borderRadius: 38,

    backgroundColor: COLORS.greenSoft,

    top: -25,
    left: -20,

    opacity: 0.8,
  },

  circleBottom: {
    position: "absolute",

    width: 95,
    height: 95,

    borderRadius: 48,

    backgroundColor: COLORS.greenPale,

    bottom: -35,
    right: -30,

    opacity: 0.9,
  },

  // ================= MAIN CARD =================

  mainCard: {
    width: 135,
    height: 145,

    borderRadius: 16,

    backgroundColor: COLORS.white,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 12,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,

    elevation: 7,
  },

  iconCircle: {
    width: 54,
    height: 54,

    borderRadius: 27,

    backgroundColor: COLORS.greenPale,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 9,
  },

  cardTitle: {
    fontSize: 13,
    fontWeight: "800",

    color: COLORS.dark,

    textAlign: "center",
  },

  cardSubtitle: {
    fontSize: 10,

    color: COLORS.textSecondary,

    textAlign: "center",

    marginTop: 3,
  },

  // ================= TOP BADGE =================

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

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 5,
  },

  // ================= ACCESS BADGE =================

  accessBadge: {
    position: "absolute",

    left: -17,
    bottom: 12,

    height: 26,

    paddingHorizontal: 10,

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

  // ================= CONTENT =================

  content: {
    width: width * 0.82,

    alignSelf: "center",

    alignItems: "center",

    marginTop: 0,
  },

  title: {
    fontSize: 26,

    lineHeight: 33,

    fontWeight: "800",

    color: COLORS.dark,

    textAlign: "center",
  },

  description: {
    marginTop: 12,

    fontSize: 14,

    lineHeight: 21,

    color: COLORS.text,

    textAlign: "center",
  },

  // ================= BOTTOM =================

  bottomSection: {
    width: width * 0.82,

    alignSelf: "center",

    marginTop: "auto",

    marginBottom: 32,

    alignItems: "center",
  },

  // ================= DOTS =================

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

    backgroundColor: COLORS.dot,
  },

  activeDot: {
    width: 24,

    backgroundColor: COLORS.primary,
  },
});
