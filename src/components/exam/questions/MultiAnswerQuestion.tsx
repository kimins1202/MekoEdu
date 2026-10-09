import { StyleSheet, Text, TextInput, View } from "react-native";

import COLORS from "../../../constants/colors";
import { ClozePart } from "../../../types/question";

interface Props {
  parts: ClozePart[];
  qtextHtml?: string;
  rawHtml?: string;
  answers: Record<string, string>;
  setAnswer: (field: string, value: string) => void;
}

export default function MultiAnswerQuestion({
  parts,
  answers,
  setAnswer,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.question}>
        {parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <Text key={`text-${index}`} style={styles.text}>
                {part.text}
              </Text>
            );
          }

          const fieldName = part.fieldName ?? "";

          if (!fieldName) {
            return null;
          }

          return (
            <TextInput
              key={`input-${fieldName}-${index}`}
              value={answers[fieldName] ?? ""}
              onChangeText={(value) => setAnswer(fieldName, value)}
              placeholder="Nhập..."
              placeholderTextColor={COLORS.textLight}
              style={styles.input}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  question: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    lineHeight: 26,
  },

  text: {
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.text,
  },

  input: {
    minWidth: 120,
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
});
