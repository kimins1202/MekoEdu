import { Pressable, StyleSheet, Text, View } from "react-native";

import COLORS from "../../../constants/colors";
import { Choice } from "../../../types/question";

interface Props {
  choices: Choice[];

  answers: Record<string, string>;

  setAnswer: (field: string, value: string) => void;
}

export default function MultipleChoiceQuestion({
  choices,
  answers,
  setAnswer,
}: Props) {
  return (
    <View>
      {choices.map((choice, index) => {
        const field = choice.fieldName ?? "";
        const selected = answers[field] === "1";

        return (
          <Pressable
            key={`${field}-${index}`}
            style={[styles.choice, selected && styles.selectedChoice]}
            onPress={() => {
              if (!field) return;

              setAnswer(field, selected ? "0" : "1");
            }}
          >
            <View
              style={[styles.checkbox, selected && styles.checkboxSelected]}
            >
              {selected && <Text style={styles.check}>✓</Text>}
            </View>

            <Text style={[styles.label, selected && styles.selectedLabel]}>
              {choice.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  choice: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,

    paddingHorizontal: 16,
    paddingVertical: 15,

    marginBottom: 12,
  },

  selectedChoice: {
    backgroundColor: COLORS.backgroundSoft,
    borderColor: COLORS.primary,
  },

  checkbox: {
    width: 23,
    height: 23,
    borderWidth: 2,
    borderColor: COLORS.textLight,
    borderRadius: 6,

    marginRight: 13,

    justifyContent: "center",
    alignItems: "center",
  },

  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  check: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.white,
  },

  label: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },

  selectedLabel: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
