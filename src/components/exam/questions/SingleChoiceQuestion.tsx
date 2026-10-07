import { Pressable, StyleSheet, Text, View } from "react-native";

import COLORS from "../../../constants/colors";
import { Choice } from "../../../types/question";

interface Props {
  choices: Choice[];
  value?: string;
  onChange: (value: string) => void;
}

export default function SingleChoiceQuestion({
  choices,
  value,
  onChange,
}: Props) {
  return (
    <View>
      {choices.map((choice) => {
        const selected = value === choice.value;

        return (
          <Pressable
            key={`${choice.value}-${choice.label}`}
            style={[styles.choice, selected && styles.choiceSelected]}
            onPress={() => onChange(choice.value)}
          >
            <View style={[styles.radio, selected && styles.radioSelected]} />

            <Text style={[styles.label, selected && styles.labelSelected]}>
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

    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,

    paddingHorizontal: 16,
    paddingVertical: 15,

    marginBottom: 12,
  },

  choiceSelected: {
    backgroundColor: COLORS.backgroundSoft,
    borderColor: COLORS.primary,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,

    borderWidth: 2,
    borderColor: COLORS.textLight,

    marginRight: 13,

    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: COLORS.primary,
    borderWidth: 6,
  },

  label: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },

  labelSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
