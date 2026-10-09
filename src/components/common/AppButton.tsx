import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import COLORS from "../../constants/colors";

interface AppButtonProps {
  onPress: () => void;
  loading?: boolean;
  title?: string;
  disabled?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
  gradientColors?: readonly [string, string];
  variant?: "primary" | "outline";
}

export default function AppButton({
  onPress,
  loading = false,
  title = "Đăng nhập",
  disabled = false,
  style,
  children,
  gradientColors,
  variant = "primary",
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.88}
      style={[styles.wrapper, style]}
    >
      {variant === "outline" ? (
        <View style={[styles.button, styles.outlineButton, isDisabled && styles.outlineDisabled]}>
          {loading ? <ActivityIndicator size="small" color={COLORS.primary} />
            : children ?? <Text style={[styles.text, styles.outlineText]}>{title}</Text>}
        </View>
      ) : <LinearGradient
        colors={
          isDisabled
            ? ["#B7C5BD", "#A3B2AA"]
            : (gradientColors ?? [COLORS.primary, COLORS.primaryDark])
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        {/* Highlight nhẹ ở phía trên */}
        {!isDisabled && <View style={styles.highlight} />}

        {loading ? (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="small" color={COLORS.white} />
            <Text style={styles.text}>Đang xử lý...</Text>
          </View>
        ) : children ? (
          children
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </LinearGradient>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outlineButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  outlineDisabled: { opacity: 0.5 },
  outlineText: { color: COLORS.primary },
  wrapper: {
    width: "100%",
    marginTop: 8,

    // Bo góc đồng nhất với UI MekoEdu
    borderRadius: 16,

    // Shadow nhẹ, không quá nổi
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },

  button: {
    height: 54,
    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",

    overflow: "hidden",
  },

  highlight: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,

    height: 1,

    backgroundColor: "rgba(255,255,255,0.35)",
  },

  text: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.15,
  },

  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
});
