import { parse } from "node-html-parser";
import { useMemo, useState } from "react";
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
  question: string;
  qtextHtml?: string;
  fields: SelectField[];
  answers: Record<string, string>;
  setAnswer: (field: string, value: string) => void;
}

function buildCleanQuestionText(html?: string, fallback = ""): string {
  if (!html) {
    return fallback
      .replace(/Blank\s+\d+\s+Question\s+\d+/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  let cleaned = html
    .replace(
      /<(?:label|span)[^>]*class=["'][^"']*(?:accesshide|sr-only|visually-hidden)[^"']*["'][^>]*>[\s\S]*?<\/(?:label|span)>/gi,
      "",
    )
    .replace(/<select[\s\S]*?<\/select>/gi, " ___ ");

  const root = parse(cleaned);

  return root.text
    .replace(/&nbsp;/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/Blank\s+\d+\s+Question\s+\d+/gi, "")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function selectedLabel(field: SelectField, value?: string): string {
  if (!value) return "Chọn đáp án";

  return (
    field.choices.find((choice) => choice.value === value)?.label ||
    "Chọn đáp án"
  );
}

export default function SelectMissingWordsQuestion({
  question,
  qtextHtml,
  fields,
  answers,
  setAnswer,
}: Props) {
  const [activeField, setActiveField] = useState<SelectField | null>(null);

  const displayQuestion = useMemo(
    () => buildCleanQuestionText(qtextHtml, question),
    [qtextHtml, question],
  );

  const choose = (choice: Choice) => {
    if (!activeField) return;

    setAnswer(activeField.fieldName, choice.value);

    setActiveField(null);
  };

  return (
    <View>
      {!!displayQuestion && (
        <Text style={styles.questionContext}>{displayQuestion}</Text>
      )}

      {fields.map((field, index) => {
        const value = answers[field.fieldName];
        const hasValue = Boolean(value);

        return (
          <View key={field.fieldName} style={styles.block}>
            <Text style={styles.label}>Chỗ trống {index + 1}</Text>

            <Pressable
              style={[
                styles.selectButton,
                hasValue && styles.selectButtonSelected,
              ]}
              onPress={() => setActiveField(field)}
            >
              <Text
                style={[styles.selectText, !hasValue && styles.placeholderText]}
              >
                {selectedLabel(field, value)}
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

            <ScrollView style={styles.optionsList}>
              {activeField?.choices
                .filter((choice) => Boolean(choice.value))
                .map((choice, index) => {
                  const isSelected =
                    answers[activeField.fieldName] === choice.value;

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
  questionContext: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textSecondary,
    marginBottom: 16,
    fontStyle: "italic",
  },

  block: {
    marginBottom: 14,
  },

  label: {
    marginBottom: 7,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  selectButton: {
    minHeight: 52,
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
    backgroundColor: "rgba(0, 0, 0, 0.35)",
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
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
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
