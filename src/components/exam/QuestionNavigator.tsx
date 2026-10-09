import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import COLORS from "../../constants/colors";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentQuestion: number;

  answeredQuestions?: number[];
  flaggedQuestions?: number[];

  onQuestionPress: (index: number) => void;
}

export default function QuestionNavigator({
  totalQuestions,
  currentQuestion,
  answeredQuestions = [],
  flaggedQuestions = [],
  onQuestionPress,
}: QuestionNavigatorProps) {
  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Danh sách câu hỏi</Text>

      {/* Question list */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {Array.from({ length: totalQuestions }, (_, index) => {
          const isCurrent = index === currentQuestion;
          const isAnswered = answeredQuestions.includes(index);
          const isFlagged = flaggedQuestions.includes(index);

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
              {/* Question number */}
              <Text
                style={[
                  styles.number,

                  isAnswered && styles.numberAnswered,

                  isCurrent && styles.numberCurrent,
                ]}
              >
                {index + 1}
              </Text>

              {/* Flag */}
              {isFlagged && !isCurrent && (
                <View style={styles.flag}>
                  <Text style={styles.flagText}>⚑</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        {/* Chưa làm */}
        <View style={styles.legendItem}>
          <View style={styles.dot} />

          <Text style={styles.legendText}>Chưa làm</Text>
        </View>

        {/* Đã làm */}
        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotAnswered]} />

          <Text style={styles.legendText}>Đã làm</Text>
        </View>

        {/* Đang xem */}
        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotCurrent]} />

          <Text style={styles.legendText}>Đang xem</Text>
        </View>

        {/* Đánh dấu */}
        <View style={styles.legendItem}>
          <Text style={styles.flagLegend}>⚑</Text>

          <Text style={styles.legendText}>Đánh dấu</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
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

  flag: {
    position: "absolute",
    top: -7,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.warning,
    justifyContent: "center",
    alignItems: "center",
  },

  flagText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: "700",
  },

  legend: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 14,
    gap: 12,
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

  flagLegend: {
    fontSize: 13,
    color: COLORS.warning,
    marginRight: 4,
  },
});
