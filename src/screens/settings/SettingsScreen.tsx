import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Alert,
  DeviceEventEmitter,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "../../components/common/AppHeader";
import COLORS from "../../constants/colors";
import { AppStackParamList } from "../../types/navigation";

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
      style={[styles.settingItem, danger && styles.dangerItem]}
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
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  // Đăng xuất tài khoản
  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi MekoEdu không?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              // Xóa thông tin phiên đăng nhập
              await AsyncStorage.multiRemove(["wstoken", "userid"]);

              // Báo cho RootNavigator biết trạng thái đăng nhập đã thay đổi
              DeviceEventEmitter.emit("authChange");
            } catch (error) {
              console.error("LOGOUT - Lỗi:", error);

              Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Cài đặt" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Profile */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Profile")}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color={COLORS.primaryDark} />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>Nguyễn Kim Yến</Text>
            <Text style={styles.email}>Sinh viên MekoEdu</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        {/* Account */}
        <Text style={styles.sectionTitle}>Tài khoản</Text>

        <View style={styles.settingsGroup}>
          <SettingItem
            icon="person-outline"
            title="Thông tin cá nhân"
            subtitle="Xem và chỉnh sửa thông tin"
            onPress={() => navigation.navigate("Profile")}
          />

          <SettingItem
            icon="lock-closed-outline"
            title="Đổi mật khẩu"
            subtitle="Cập nhật mật khẩu tài khoản"
            onPress={() => navigation.navigate("Profile")}
          />
        </View>

        {/* App */}
        <Text style={styles.sectionTitle}>Ứng dụng</Text>

        <View style={styles.settingsGroup}>
          <SettingItem
            icon="notifications-outline"
            title="Thông báo"
            subtitle="Quản lý thông báo"
            onPress={() => navigation.navigate("SettingsNotification")}
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
            onPress={() => navigation.navigate("Help")}
          />

          <SettingItem
            icon="call-outline"
            title="Liên hệ"
            subtitle="Hỗ trợ và góp ý"
            onPress={() => navigation.navigate("Contact")}
          />
        </View>

        {/* Logout */}
        <View style={styles.settingsGroup}>
          <SettingItem
            icon="log-out-outline"
            title="Đăng xuất"
            danger
            onPress={handleLogout}
          />
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
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#FFD6D6",
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

  dangerItem: {
    backgroundColor: "#FFF8F8",
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
