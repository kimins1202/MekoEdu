import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import COLORS from "../../constants/colors";

interface AnswerItemProps {
  label: string;
  content: string;
  selected?: boolean;
  onPress: () => void;
}

export default function AnswerItem({
  label,
  content,
  selected = false,
  onPress,
}: AnswerItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.selectedContainer]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.radio, selected && styles.selectedRadio]}>
        {selected && <View style={styles.radioDot} />}
      </View>

      <View style={styles.labelWrapper}>
        <Text style={[styles.label, selected && styles.selectedLabel]}>
          {label}
        </Text>
      </View>

      <Text style={[styles.content, selected && styles.selectedContent]}>
        {content}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },

  selectedContainer: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundSoft,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },

  selectedRadio: {
    borderColor: COLORS.primary,
  },

  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },

  labelWrapper: {
    width: 30,
    alignItems: "center",
    marginLeft: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  selectedLabel: {
    color: COLORS.primary,
  },

  content: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.text,
    marginLeft: 4,
  },

  selectedContent: {
    color: COLORS.primaryDark,
    fontWeight: "600",
  },
});
