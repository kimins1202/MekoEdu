import { DynamicColorIOS, Platform } from "react-native";

const adaptiveColor = (
  light: string,
  dark: string,
) => {
  if (Platform.OS === "ios") {
    return DynamicColorIOS({ light, dark });
  }

  // Android theme attributes may resolve to ColorStateList resource IDs instead
  // of ARGB colors. Keep text and surfaces on the explicit light palette.
  return light;
};

const COLORS = {
  // BRAND COLORS
  primary: "#006E27",
  primaryDark: "#006C46",
  primaryLight: "#7DBA18",
  // Foreground accents need more contrast than filled brand backgrounds.
  primaryText: adaptiveColor(
    "#006E27",
    "#83DFA5",
  ),
  warningText: adaptiveColor(
    "#956500",
    "#F4CC74",
  ),
  warningSurface: adaptiveColor(
    "#FFF8E8",
    "#362D1B",
  ),
  text: adaptiveColor("#223241", "#F2F5F3"),

  // TEXT
  textSecondary: adaptiveColor(
    "#5F6F7B",
    "#C5D0CA",
  ),
  textLight: adaptiveColor(
    "#94A0AA",
    "#A9B8AF",
  ),

  // BACKGROUND
  background: adaptiveColor(
    "#FFFFFF",
    "#101714",
  ),
  backgroundSoft: adaptiveColor(
    "#F3F8F5",
    "#101714",
  ),

  // SURFACE
  surface: adaptiveColor(
    "#FFFFFF",
    "#1C2420",
  ),

  // BORDER
  // A translucent separator stays subtle on both light and dark surfaces.
  border: "rgba(128, 151, 137, 0.24)",

  // STATUS
  success: "#2E8B57",
  error: "#D64545",
  warning: "#D99A24",
  info: "#4A7C9B",

  // BASIC
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};

export default COLORS;
