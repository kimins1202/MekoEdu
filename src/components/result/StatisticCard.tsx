import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import COLORS from "../../constants/colors";

interface StatisticCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  onPress?: () => void;
}

export default function StatisticCard({
  icon,
  value,
  label,
  onPress,
}: StatisticCardProps) {
  const ContainerComponent = onPress ? TouchableOpacity : View;

  return (
    <ContainerComponent 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={22} color={COLORS.primary} />
      </View>

      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>

      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </ContainerComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 115,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  value: {
    fontSize: 21,
    fontWeight: "800",
    color: COLORS.text,
  },

  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
});
