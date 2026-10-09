import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import COLORS from "../../../constants/colors";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function ShortAnswerQuestion({
  value,
  onChange,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View>

      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="default"
        placeholder="Nhập câu trả lời..."
        placeholderTextColor={COLORS.textLight}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, focused && styles.inputFocused]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.text,
  },

  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundSoft,
  },
});
