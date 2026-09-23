import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface AppButtonProps {
  onPress: () => void;
  loading?: boolean;
  title?: string;
  disabled?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export default function AppButton({
  onPress,
  loading = false,
  title = "Đăng nhập",
  disabled = false,
  style,
  children,
}: AppButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : children ? (
        children
      ) : (
        <View style={styles.content}>
          <Text style={styles.text}>{title}</Text>
          <Text style={styles.arrow}>→</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    backgroundColor: "#006400",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  arrow: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
  },
});
