import COLORS from "./colors";

const THEME = {
  colors: COLORS,

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 999,
  },

  typography: {
    title: {
      fontSize: 24,
      fontWeight: "700" as const,
      color: COLORS.text,
    },

    heading: {
      fontSize: 20,
      fontWeight: "700" as const,
      color: COLORS.text,
    },

    body: {
      fontSize: 16,
      fontWeight: "400" as const,
      color: COLORS.text,
    },

    bodySmall: {
      fontSize: 14,
      fontWeight: "400" as const,
      color: COLORS.textSecondary,
    },

    caption: {
      fontSize: 12,
      fontWeight: "400" as const,
      color: COLORS.textLight,
    },
  },

  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

export default THEME;
