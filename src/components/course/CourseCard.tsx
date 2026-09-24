import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import COLORS from "../../constants/colors";
import CourseProgress from "./CourseProgress";

interface CourseCardProps {
  courseName: string;
  shortname?: string;
  categoryName?: string;
  progress?: number;
  completed?: boolean;
  onPress: () => void;
}

export default function CourseCard({
  courseName,
  shortname,
  categoryName,
  progress,
  completed = false,
  onPress,
}: CourseCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.topRow}>
        <View style={styles.iconWrapper}>
          <Ionicons name="school-outline" size={28} color={COLORS.primary} />
        </View>

        <View style={styles.content}>
          {categoryName ? (
            <Text style={styles.category} numberOfLines={1}>
              {categoryName}
            </Text>
          ) : null}

          <Text style={styles.title} numberOfLines={2}>
            {courseName}
          </Text>

          {shortname ? (
            <Text style={styles.shortname} numberOfLines={1}>
              {shortname}
            </Text>
          ) : null}
        </View>

        <View style={styles.arrow}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.textSecondary}
          />
        </View>
      </View>

      {progress !== undefined && <CourseProgress progress={progress} />}

      {progress !== undefined && (
        <View style={styles.statusRow}>
          <View
            style={[styles.statusBadge, completed && styles.completedBadge]}
          >
            <View
              style={[styles.statusDot, completed && styles.completedDot]}
            />

            <Text
              style={[styles.statusText, completed && styles.completedText]}
            >
              {completed ? "Hoàn thành" : "Đang học"}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconWrapper: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  content: {
    flex: 1,
    justifyContent: "center",
  },

  category: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primaryDark,
    marginBottom: 4,
    textTransform: "uppercase",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 21,
  },

  shortname: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 5,
  },

  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  statusRow: {
    marginTop: 10,
  },

  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "#FFF8E8",
  },

  completedBadge: {
    backgroundColor: COLORS.backgroundSoft,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    backgroundColor: COLORS.warning,
  },

  completedDot: {
    backgroundColor: COLORS.success,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.warning,
  },

  completedText: {
    color: COLORS.success,
  },
});
