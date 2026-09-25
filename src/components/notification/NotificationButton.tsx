import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import COLORS from "../../constants/colors";

interface NotificationButtonProps {
  unreadCount?: number;
  onPress: () => void;
}

export default function NotificationButton({
  unreadCount = 0,
  onPress,
}: NotificationButtonProps) {
  const displayCount = unreadCount > 99 ? "99+" : unreadCount.toString();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name="notifications-outline" size={23} color={COLORS.text} />

      {unreadCount > 0 && <ViewBadge text={displayCount} />}
    </TouchableOpacity>
  );
}

interface ViewBadgeProps {
  text: string;
}

function ViewBadge({ text }: ViewBadgeProps) {
  return <Text style={styles.badge}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundSoft,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: COLORS.error,
    color: COLORS.white,
    textAlign: "center",
    lineHeight: 14,
    fontSize: 9,
    fontWeight: "800",
  },
});
