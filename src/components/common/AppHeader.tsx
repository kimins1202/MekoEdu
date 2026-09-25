import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import COLORS from "../../constants/colors";
import MekoLogo from "./MekoLogo";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onNotificationPress?: () => void;
}

export default function AppHeader({
  title,
  subtitle,
  showBack = false,
  onNotificationPress,
}: AppHeaderProps) {
  const navigation = useNavigation();

  const isHome = title === "MekoEdu";

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Logo + tên trang */}
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color={COLORS.text} />
            </TouchableOpacity>
          )}

          {/* Luôn dùng logo thật */}
          <MekoLogo />

          <View style={styles.titleContainer}>
            {isHome ? (
              <View style={styles.brandRow}>
                <Text style={styles.mekoText}>Meko</Text>

                <Text style={styles.eduText}>Edu</Text>
              </View>
            ) : (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            )}

            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Thông báo */}
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={COLORS.text}
          />

          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.white,
  },

  container: {
    minHeight: 68,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSoft,
    marginRight: 10,
  },

  titleContainer: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  mekoText: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    color: COLORS.primary,
  },

  eduText: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    color: COLORS.primaryLight,
  },

  title: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "700",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 1,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
  },

  notificationButton: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSoft,
    marginLeft: 10,
  },

  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryLight,
  },
});
