import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import COLORS from "../../../constants/colors";
import { DragItem, DropField } from "../../../types/question";

interface Props {
  items: DragItem[];
  fields: DropField[];
  answers: Record<string, string>;
  setAnswer: (field: string, value: string) => void;
}

export default function DragDropTextQuestion({
  items,
  fields,
  answers,
  setAnswer,
}: Props) {
  const [selected, setSelected] = useState<DragItem | null>(null);

  return (
    <View>
      <Text style={styles.title}>Vị trí:</Text>

      {fields.map((field) => {
        const current = answers[field.fieldName];

        const item = items.find((x) => String(x.choice) === current);

        return (
          <Pressable
            key={field.fieldName}
            style={[styles.drop, item && styles.dropFilled]}
            onPress={() => {
              if (!selected) return;

              setAnswer(field.fieldName, String(selected.choice));

              setSelected(null);
            }}
          >
            <Text style={styles.dropText}>
              Vị trí {field.place}: {item?.text ?? "Chọn đáp án"}
            </Text>
          </Pressable>
        );
      })}

      <Text style={styles.title}>Lựa chọn:</Text>

      <View style={styles.choices}>
        {items.map((item) => {
          const isSelected = selected?.id === item.id;

          return (
            <Pressable
              key={item.id}
              onPress={() => setSelected(item)}
              style={[styles.choice, isSelected && styles.selected]}
            >
              <Text
                style={[styles.choiceText, isSelected && styles.selectedText]}
              >
                {item.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  questionContext: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.textSecondary,
    marginBottom: 14,
    fontStyle: "italic",
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 4,
    marginBottom: 10,
  },

  drop: {
    minHeight: 52,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.textLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },

  dropFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundSoft,
  },

  dropText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },

  choices: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  choice: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: COLORS.white,
  },

  selected: {
    backgroundColor: COLORS.backgroundSoft,
    borderColor: COLORS.primary,
  },

  choiceText: {
    fontSize: 15,
    color: COLORS.text,
  },

  selectedText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
