import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import COLORS from "../../constants/colors";

interface LoadingProps {
  message?: string;
  size?: "small" | "large";
  color?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export default function Loading({
  message = "Đang tải...",
  size = "large",
  color = COLORS.primary,
  fullScreen = true,
  style,
}: LoadingProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [rotateAnim]);

  const spinnerSize = size === "large" ? 42 : 28;
  const borderWidth = size === "large" ? 4 : 3;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={[
        fullScreen ? styles.fullScreenContainer : styles.inlineContainer,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.spinner,
          {
            width: spinnerSize,
            height: spinnerSize,
            borderRadius: spinnerSize / 2,
            borderWidth,
            borderColor: `${color}20`,
            borderTopColor: color,
            transform: [{ rotate: spin }],
          },
        ]}
      />

      {message ? (
        <Text
          style={[
            styles.text,
            {
              fontSize: size === "large" ? 14 : 12,
            },
          ]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  inlineContainer: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  spinner: {
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
  },

  text: {
    marginTop: 14,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
