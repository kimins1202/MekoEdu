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
};

export default THEME;
