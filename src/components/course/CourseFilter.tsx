import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

import COLORS from "../../constants/colors";

export type CourseFilterType = "all" | "learning" | "completed";

interface CourseFilterProps {
  activeFilter: CourseFilterType;
  totalCount: number;
  learningCount: number;
  completedCount: number;
  onChange: (filter: CourseFilterType) => void;
}

export default function CourseFilter({
  activeFilter,
  totalCount,
  learningCount,
  completedCount,
  onChange,
}: CourseFilterProps) {
  const filters = [
    {
      key: "all" as CourseFilterType,
      label: "Tất cả",
      count: totalCount,
    },
    {
      key: "learning" as CourseFilterType,
      label: "Đang học",
      count: learningCount,
    },
    {
      key: "completed" as CourseFilterType,
      label: "Hoàn thành",
      count: completedCount,
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => {
        const isActive = activeFilter === filter.key;

        return (
          <TouchableOpacity
            key={filter.key}
            style={[styles.button, isActive && styles.activeButton]}
            onPress={() => onChange(filter.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {filter.label}
            </Text>

            <Text style={[styles.count, isActive && styles.activeCount]}>
              {filter.count}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    gap: 8,
  },

  button: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },

  activeButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  activeLabel: {
    color: COLORS.white,
  },

  count: {
    minWidth: 20,
    height: 20,
    marginLeft: 7,
    paddingHorizontal: 5,
    borderRadius: 10,
    textAlign: "center",
    lineHeight: 20,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    backgroundColor: COLORS.backgroundSoft,
  },

  activeCount: {
    color: COLORS.primary,
    backgroundColor: COLORS.white,
  },
});
