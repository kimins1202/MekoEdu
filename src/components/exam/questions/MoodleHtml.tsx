import React from "react";
import { useWindowDimensions } from "react-native";
import RenderHtml from "react-native-render-html";

import COLORS from "../../../constants/colors";

interface Props {
  html: string;
}

export default function MoodleHtml({ html }: Props) {
  const { width } = useWindowDimensions();

  return (
    <RenderHtml
      contentWidth={Math.max(width - 80, 100)}
      source={{ html }}
      baseStyle={{
        fontSize: 15,
        lineHeight: 24,
        color: COLORS.text,
      }}
      tagsStyles={{
        strong: { fontWeight: "bold" },
        b: { fontWeight: "bold" },
        em: { fontStyle: "italic" },
        i: { fontStyle: "italic" },
        p: { marginTop: 0, marginBottom: 8 },
      }}
      enableCSSInlineProcessing
    />
  );
}
