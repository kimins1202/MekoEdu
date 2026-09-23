import { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const onboardingData = [
  {
    title: "Học tập dễ dàng hơn",
    description:
      "Truy cập các khóa học và nội dung học tập ngay trên thiết bị của bạn.",
    icon: "📚",
  },
  {
    title: "Làm bài thi trực tuyến",
    description:
      "Thực hiện bài thi, theo dõi thời gian và quản lý câu trả lời ngay trên ứng dụng.",
    icon: "✏️",
  },
  {
    title: "Theo dõi kết quả",
    description:
      "Xem kết quả và quá trình học tập của bạn một cách thuận tiện.",
    icon: "📈",
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = onboardingData[currentIndex];

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace("Launch");
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.replace("Launch")}
      >
        <Text style={styles.skipText}>Bỏ qua</Text>
      </TouchableOpacity>

      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <View style={styles.circle}>
          <Text style={styles.icon}>{current.icon}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{current.title}</Text>

        <Text style={styles.description}>{current.description}</Text>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === currentIndex && styles.activeDot]}
          />
        ))}
      </View>

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {currentIndex === onboardingData.length - 1 ? "Bắt đầu" : "Tiếp tục"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FFF9",
    alignItems: "center",
  },

  skipButton: {
    position: "absolute",
    top: 55,
    right: 24,
    zIndex: 10,
  },

  skipText: {
    color: "#415161",
    fontSize: 14,
  },

  illustrationContainer: {
    marginTop: 130,
    alignItems: "center",
    justifyContent: "center",
  },

  circle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "#61CE70",
    justifyContent: "center",
    alignItems: "center",
  },

  icon: {
    fontSize: 90,
  },

  content: {
    width: width * 0.82,
    alignItems: "center",
    marginTop: 50,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#415161",
    textAlign: "center",
  },

  description: {
    marginTop: 15,
    fontSize: 15,
    lineHeight: 24,
    color: "#718078",
    textAlign: "center",
  },

  dots: {
    flexDirection: "row",
    marginTop: 35,
    gap: 7,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C8DED0",
  },

  activeDot: {
    width: 24,
    backgroundColor: "#3EAF7C",
  },

  button: {
    position: "absolute",
    bottom: 45,
    width: width * 0.82,
    height: 55,
    borderRadius: 18,
    backgroundColor: "#3EAF7C",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
