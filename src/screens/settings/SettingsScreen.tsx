import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "../../components/common/AppHeader";
import COLORS from "../../constants/colors";

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  danger?: boolean;
  onPress?: () => void;
}

function SettingItem({
  icon,
  title,
  subtitle,
  danger = false,
  onPress,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.settingIcon, danger && styles.dangerIcon]}>
        <Ionicons
          name={icon}
          size={21}
          color={danger ? COLORS.error : COLORS.primaryDark}
        />
      </View>

      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>
          {title}
        </Text>

        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>

      {!danger && (
        <Ionicons name="chevron-forward" size={19} color={COLORS.textLight} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Cài đặt" subtitle="Quản lý tài khoản và ứng dụng" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color={COLORS.primaryDark} />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>Nguyễn Kim Yến</Text>

            <Text style={styles.email}>Sinh viên MekoEdu</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Tài khoản</Text>

        <View style={styles.settingsGroup}>
          <SettingItem
            icon="person-outline"
            title="Thông tin cá nhân"
            subtitle="Xem và chỉnh sửa thông tin"
          />

          <SettingItem
            icon="lock-closed-outline"
            title="Đổi mật khẩu"
            subtitle="Cập nhật mật khẩu tài khoản"
          />
        </View>

        {/* App */}
        <Text style={styles.sectionTitle}>Ứng dụng</Text>

        <View style={styles.settingsGroup}>
          <SettingItem
            icon="notifications-outline"
            title="Thông báo"
            subtitle="Quản lý thông báo"
          />

          <SettingItem
            icon="moon-outline"
            title="Giao diện"
            subtitle="Sáng / Tối"
          />

          <SettingItem
            icon="information-circle-outline"
            title="Về MekoEdu"
            subtitle="Thông tin ứng dụng"
          />
        </View>

        {/* Logout */}
        <View style={styles.settingsGroup}>
          <SettingItem icon="log-out-outline" title="Đăng xuất" danger />
        </View>

        <Text style={styles.version}>MekoEdu v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  content: {
    padding: 20,
    paddingBottom: 35,
  },

  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  profileInfo: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  email: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
  },

  settingsGroup: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 22,
  },

  settingItem: {
    minHeight: 70,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  dangerIcon: {
    backgroundColor: "#FFF1F1",
  },

  settingInfo: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  settingSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  dangerText: {
    color: COLORS.error,
  },

  version: {
    textAlign: "center",
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 5,
  },
});
