import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import COLORS from "../../constants/colors";

interface AnswerOptionProps {
  label: string;
  text: string;
  selected?: boolean;
  onPress: () => void;
}

export default function AnswerOption({
  label,
  text,
  selected = false,
  onPress,
}: AnswerOptionProps) {
  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.containerSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[styles.labelWrapper, selected && styles.labelWrapperSelected]}
      >
        {selected ? (
          <Ionicons name="checkmark" size={18} color={COLORS.white} />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </View>

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
