import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import COLORS from "../../constants/colors";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Tìm kiếm...",
}: SearchBarProps) {
  const handleClear = () => {
    onChangeText("");
  };

  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {value.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={19} color={COLORS.textLight} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 0,
    fontSize: 14,
    color: COLORS.text,
  },

  clearButton: {
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
