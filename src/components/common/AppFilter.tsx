import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import COLORS from "../../constants/colors";

export interface FilterOption<T extends string = string> {
  key: T;
  label: string;
  count?: number;
}

interface AppFilterProps<T extends string = string> {
  filters: FilterOption<T>[];
  activeFilter: T;
  onChange: (filter: T) => void;
  style?: ViewStyle;
}

export default function AppFilter<T extends string>({
  filters,
  activeFilter,
  onChange,
  style,
}: AppFilterProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
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

            {filter.count !== undefined && (
              <Text style={[styles.count, isActive && styles.activeCount]}>
                {filter.count}
              </Text>
            )}
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
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.surface,
  },
});
