import { DynamicColorIOS, Platform, PlatformColor } from "react-native";

const adaptiveColor = (
  light: string,
  dark: string,
  androidResource: string,
) => {
  if (Platform.OS === "ios") {
    return DynamicColorIOS({ light, dark });
  }

  if (Platform.OS === "android") {
    return PlatformColor(androidResource);
  }

  return light;
};

const COLORS = {
  // BRAND COLORS
  primary: "#006E27",
  primaryDark: "#006C46",
  primaryLight: "#7DBA18",
  text: adaptiveColor("#223241", "#F2F5F3", "?android:attr/textColorPrimary"),

  // TEXT
  textSecondary: adaptiveColor(
    "#5F6F7B",
    "#B0BBB5",
    "?android:attr/textColorSecondary",
  ),
  textLight: adaptiveColor(
    "#94A0AA",
    "#84918A",
    "?android:attr/textColorHint",
  ),

  // BACKGROUND
  background: adaptiveColor(
    "#FFFFFF",
    "#101714",
    "?android:attr/colorBackground",
  ),
  backgroundSoft: adaptiveColor(
    "#F3F8F5",
    "#101714",
    "?android:attr/colorBackground",
  ),

  // SURFACE
  surface: adaptiveColor(
    "#FFFFFF",
    "#1C2420",
    "?android:attr/colorBackgroundFloating",
  ),

  // BORDER
  border: adaptiveColor(
    "#DDE7E1",
    "#39443E",
    "?android:attr/colorControlHighlight",
  ),

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
