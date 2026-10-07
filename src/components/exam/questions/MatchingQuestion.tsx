import { StyleSheet, Text, View } from "react-native";

import { Picker } from "@react-native-picker/picker";

import COLORS from "../../../constants/colors";
import { SelectField } from "../../../types/question";

interface Props {
  fields: SelectField[];
  answers: Record<string, string>;
  setAnswer: (field: string, value: string) => void;
}

export default function MatchingQuestion({
  fields,
  answers,
  setAnswer,
}: Props) {
  return (
    <View>
      {fields.map((field) => (
        <View key={field.fieldName} style={styles.row}>
          <Text style={styles.item}>{field.label}</Text>

          <View style={styles.pickerBox}>
            <Picker
              selectedValue={answers[field.fieldName] ?? "0"}
              onValueChange={(value) =>
                setAnswer(field.fieldName, String(value))
              }
              style={styles.picker}
              dropdownIconColor={COLORS.primary}
            >
              {field.choices.map((choice, index) => (
                <Picker.Item
                  key={`${choice.value}-${index}`}
                  label={choice.label || "Chọn..."}
                  value={choice.value}
                  color={COLORS.text}
                />
              ))}
            </Picker>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 16,
  },

  item: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    color: COLORS.text,
    marginBottom: 8,
  },

  pickerBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: COLORS.white,
  },

  picker: {
    color: COLORS.text,
  },
});
