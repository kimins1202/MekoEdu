import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import COLORS from "../../constants/colors";

export type NotificationType = "exam" | "course" | "result" | "system";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

const notificationConfig = {
  exam: {
    icon: "document-text-outline" as keyof typeof Ionicons.glyphMap,
  },

  course: {
    icon: "book-outline" as keyof typeof Ionicons.glyphMap,
  },

  result: {
    icon: "trophy-outline" as keyof typeof Ionicons.glyphMap,
  },

  system: {
    icon: "information-circle-outline" as keyof typeof Ionicons.glyphMap,
  },
};

export default function NotificationItem({
  notification,
  onPress,
}: NotificationItemProps) {
  const config = notificationConfig[notification.type];

  return (
    <TouchableOpacity
      style={[styles.container, !notification.isRead && styles.unreadContainer]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name={config.icon} size={22} color={COLORS.primary} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, !notification.isRead && styles.unreadTitle]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>

          {!notification.isRead && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>

        <Text style={styles.time}>{notification.createdAt}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },

  unreadContainer: {
    backgroundColor: COLORS.backgroundSoft,
    borderColor: "#CDE5D5",
  },

  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSoft,
    marginRight: 12,
  },

  content: {
    flex: 1,
    marginRight: 8,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  unreadTitle: {
    fontWeight: "800",
  },

  unreadDot: {
    width: 8,
    height: 8,
    marginLeft: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  message: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },

  time: {
    marginTop: 6,
    fontSize: 11,
    color: COLORS.textLight,
  },
});
