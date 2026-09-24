import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import COLORS from "../../constants/colors";

interface ExamCardProps {
  examName: string;
  questionCount?: number;
  timeLimit?: number;
  onPress: () => void;
}

export default function ExamCard({
  examName,
  questionCount,
  timeLimit,
  onPress,
}: ExamCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconWrapper}>
        <Ionicons
          name="document-text-outline"
          size={25}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {examName}
        </Text>

        <View style={styles.infoRow}>
          {questionCount !== undefined && (
            <View style={styles.infoItem}>
              <Ionicons
                name="help-circle-outline"
                size={15}
                color={COLORS.textSecondary}
              />
              <Text style={styles.infoText}>{questionCount} câu</Text>
            </View>
          )}

          {timeLimit !== undefined && timeLimit > 0 && (
            <View style={styles.infoItem}>
              <Ionicons
                name="time-outline"
                size={15}
                color={COLORS.textSecondary}
              />
              <Text style={styles.infoText}>{timeLimit} phút</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.arrow}>
        <Ionicons
          name="chevron-forward"
          size={19}
          color={COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 14,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  content: {
    flex: 1,
    marginRight: 10,
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    color: COLORS.text,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 14,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoText: {
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
  },
});
