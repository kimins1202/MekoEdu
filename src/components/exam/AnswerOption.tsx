import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import COLORS from "../../constants/colors";

interface AnswerOptionProps {
  label: string;
  text: string;
  selected?: boolean;
  multiple?: boolean;
  onPress: () => void;
}

export default function AnswerOption({
  label,
  text,
  selected = false,
  multiple = false,
  onPress,
}: AnswerOptionProps) {
  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.containerSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* A / B / C / D */}
      <View
        style={[
          styles.labelWrapper,

          // Multiple choice → hình vuông
          multiple && styles.multipleLabelWrapper,

          selected && styles.labelWrapperSelected,
        ]}
      >
        <Text style={[styles.label, selected && styles.labelSelected]}>
          {label}
        </Text>

        {selected && (
          <Ionicons
            name="checkmark"
            size={12}
            color={COLORS.white}
            style={styles.checkmark}
          />
        )}
      </View>

      {/* Answer text */}
      <Text style={[styles.text, selected && styles.textSelected]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 58,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,
    paddingVertical: 10,

    marginBottom: 12,

    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,

    backgroundColor: COLORS.white,
  },

  containerSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundSoft,
  },

  labelWrapper: {
    width: 34,
    height: 34,

    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: COLORS.border,

    justifyContent: "center",
    alignItems: "center",

    marginRight: 12,

    position: "relative",
  },

  // Multiple choice → checkbox
  multipleLabelWrapper: {
    borderRadius: 8,
  },

  labelWrapperSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  labelSelected: {
    color: COLORS.white,
  },

  checkmark: {
    position: "absolute",
    right: -4,
    bottom: -4,

    width: 16,
    height: 16,

    borderRadius: 8,
    backgroundColor: COLORS.primary,

    textAlign: "center",
    textAlignVertical: "center",
  },

  text: {
    flex: 1,

    fontSize: 15,
    lineHeight: 21,

    color: COLORS.text,
  },

  textSelected: {
    color: COLORS.primaryDark,
    fontWeight: "600",
  },
});
