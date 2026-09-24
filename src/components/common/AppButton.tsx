import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
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
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[styles.wrapper, style]}
    >
      <LinearGradient
        colors={
          isDisabled
            ? ["#A8B8AE", "#8FA198"]
            : ["#006E27", "#006C46", "#008C50"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.button, isDisabled && styles.buttonDisabled]}
      >
        {/* Highlight nhẹ phía trên */}
        {!isDisabled && <View style={styles.highlight} />}

        {loading ? (
          <View style={styles.loadingContent}>
            <View style={styles.loadingCircle} />
            <Text style={styles.text}>Đang xử lý...</Text>
          </View>
        ) : children ? (
          children
        ) : (
          <View style={styles.content}>
            <Text style={styles.text}>{title}</Text>

            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
            </View>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginTop: 8,

    borderRadius: 18,

    // Shadow iOS
    shadowColor: "#006E27",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,

    // Shadow Android
    elevation: 5,
  },

  button: {
    height: 56,

    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",

    overflow: "hidden",
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  // Ánh sáng nhẹ phía trên button
  highlight: {
    position: "absolute",

    top: 0,
    left: 15,
    right: 15,

    height: 1,

    backgroundColor: "rgba(255,255,255,0.45)",
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 10,
  },

  text: {
    color: "#FFFFFF",

    fontSize: 16,
    fontWeight: "700",

    letterSpacing: 0.2,
  },

  arrowContainer: {
    width: 30,
    height: 30,

    borderRadius: 15,

    backgroundColor: "rgba(255,255,255,0.16)",

    justifyContent: "center",
    alignItems: "center",
  },

  loadingContent: {
    flexDirection: "row",
    alignItems: "center",

    gap: 10,
  },

  loadingCircle: {
    width: 17,
    height: 17,

    borderRadius: 8.5,

    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    borderTopColor: "#FFFFFF",
  },
});
