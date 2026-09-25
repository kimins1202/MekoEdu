import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import COLORS from "../../constants/colors";

interface QuestionNavigationProps {
  totalQuestions: number;
  currentQuestion: number;
  answeredQuestions?: number[];
  onQuestionPress: (index: number) => void;
}

export default function QuestionNavigation({
  totalQuestions,
  currentQuestion,
  answeredQuestions = [],
  onQuestionPress,
}: QuestionNavigationProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Danh sách câu hỏi</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {Array.from({ length: totalQuestions }, (_, index) => {
          const isCurrent = index === currentQuestion;
          const isAnswered = answeredQuestions.includes(index);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.item,
                isAnswered && styles.itemAnswered,
                isCurrent && styles.itemCurrent,
              ]}
              onPress={() => onQuestionPress(index)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.number,
                  isAnswered && styles.numberAnswered,
                  isCurrent && styles.numberCurrent,
                ]}
              >
                {index + 1}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.dot} />
          <Text style={styles.legendText}>Chưa làm</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotAnswered]} />
          <Text style={styles.legendText}>Đã làm</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotCurrent]} />
          <Text style={styles.legendText}>Đang xem</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },

  title: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },

  list: {
    gap: 8,
  },

  item: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },

  itemAnswered: {
    backgroundColor: COLORS.backgroundSoft,
    borderColor: COLORS.primary,
  },

  itemCurrent: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  number: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  numberAnswered: {
    color: COLORS.primary,
  },

  numberCurrent: {
    color: COLORS.white,
    fontWeight: "800",
  },

  legend: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 14,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginRight: 5,
  },

  dotAnswered: {
    backgroundColor: COLORS.primary,
  },

  dotCurrent: {
    backgroundColor: COLORS.primaryDark,
  },

  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
