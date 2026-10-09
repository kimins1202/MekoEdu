import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import COLORS from "../../../constants/colors";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function EssayQuestion({ value, onChange }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View>

      <TextInput
        multiline
        value={value}
        onChangeText={onChange}
        placeholder="Nhập câu trả lời tự luận..."
        placeholderTextColor={COLORS.textLight}
        textAlignVertical="top"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.editor, focused && styles.editorFocused]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    minHeight: 180,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.text,
  },

  editorFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundSoft,
  },
});
