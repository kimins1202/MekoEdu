import { StyleSheet, Text, View } from "react-native";

import COLORS from "../../../constants/colors";

interface Props {
  question: string;
}

export default function DescriptionQuestion({ question }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
  },

  question: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
  },
});
