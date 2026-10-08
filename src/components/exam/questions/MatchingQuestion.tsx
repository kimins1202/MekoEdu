import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import COLORS from "../../../constants/colors";
import { Choice, SelectField } from "../../../types/question";

interface Props {
  fields: SelectField[];
  answers: Record<string, string>;
  setAnswer: (field: string, value: string) => void;
}

function getSelectedLabel(field: SelectField, value?: string): string {
  if (!value || value === "0") {
    return "Chọn đáp án";
  }

  return (
    field.choices.find((choice) => String(choice.value) === String(value))
      ?.label || "Chọn đáp án"
  );
}

export default function MatchingQuestion({
  fields,
  answers,
  setAnswer,
}: Props) {
  const [activeField, setActiveField] = useState<SelectField | null>(null);

  const choose = (choice: Choice) => {
    if (!activeField) return;

    setAnswer(activeField.fieldName, String(choice.value));

    setActiveField(null);
  };

  return (
    <View>
      {fields.map((field) => {
        const value = answers[field.fieldName];
        const hasValue = value !== undefined && value !== "" && value !== "0";

        return (
          <View key={field.fieldName} style={styles.row}>
            <Text style={styles.item}>{field.label}</Text>

            <Pressable
              style={[
                styles.selectButton,
                hasValue && styles.selectButtonSelected,
              ]}
              onPress={() => setActiveField(field)}
            >
              <Text
                style={[styles.selectText, !hasValue && styles.placeholderText]}
                numberOfLines={2}
              >
                {getSelectedLabel(field, value)}
              </Text>

              <Text style={styles.chevron}>⌄</Text>
            </Pressable>
          </View>
        );
      })}

      <Modal
        visible={Boolean(activeField)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveField(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setActiveField(null)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Chọn đáp án</Text>

            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            >
              {activeField?.choices
                .filter(
                  (choice) =>
                    String(choice.value) !== "0" && String(choice.value) !== "",
                )
                .map((choice, index) => {
                  const isSelected =
                    String(answers[activeField.fieldName]) ===
                    String(choice.value);

                  return (
                    <Pressable
                      key={`${choice.value}-${index}`}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionSelected,
                      ]}
                      onPress={() => choose(choice)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {choice.label}
                      </Text>

                      {isSelected && <Text style={styles.check}>✓</Text>}
                    </Pressable>
                  );
                })}
            </ScrollView>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setActiveField(null)}
            >
              <Text style={styles.cancelText}>Đóng</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 18,
  },

  item: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    color: COLORS.text,
    marginBottom: 8,
  },

  selectButton: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: COLORS.white,
  },

  selectButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundSoft,
  },

  selectText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.text,
  },

  placeholderText: {
    color: COLORS.textLight,
  },

  chevron: {
    fontSize: 22,
    marginLeft: 10,
    color: COLORS.primary,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 24,
  },

  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    maxHeight: "70%",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },

  optionsList: {
    maxHeight: 360,
  },

  optionRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,

    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },

  optionSelected: {
    backgroundColor: COLORS.backgroundSoft,
  },

  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },

  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  check: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },

  cancelButton: {
    marginTop: 12,
    minHeight: 46,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSoft,
  },

  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },
});
