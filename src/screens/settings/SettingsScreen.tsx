import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  DeviceEventEmitter,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getSiteInfo } from "../../api/authApi";
import AppHeader from "../../components/common/AppHeader";
import Loading from "../../components/common/Loading";
import COLORS from "../../constants/colors";
import { AppStackParamList } from "../../types/navigation";

interface SiteInfo {
  userid?: number;
  username?: string;
  fullname?: string;
  siteurl?: string;
  email?: string;
}

interface LocalProfile {
  fullname: string;
  birthday: string;
  avatarId: string;
  avatarUri: string | null;
  address: string;
  phone: string;
}

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  danger?: boolean;
  onPress?: () => void;
}

type AvatarOption = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const PROFILE_STORAGE_KEY = "@mekoedu_profile";

const DEFAULT_PROFILE: LocalProfile = {
  fullname: "",
  birthday: "",
  avatarId: "person",
  avatarUri: null,
  address: "",
  phone: "",
};

const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "person", icon: "person" },
  { id: "happy", icon: "happy" },
  { id: "school", icon: "school" },
  { id: "book", icon: "book" },
  { id: "leaf", icon: "leaf" },
  { id: "star", icon: "star" },
];

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

  const [user, setUser] = useState<SiteInfo | null>(null);

  const [localProfile, setLocalProfile] =
    useState<LocalProfile>(DEFAULT_PROFILE);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const [siteInfoResponse, savedTheme, storedProfile] = await Promise.all([
        getSiteInfo(),
        AsyncStorage.getItem("themeMode"),
        AsyncStorage.getItem(PROFILE_STORAGE_KEY),
      ]);

      if (siteInfoResponse?.exception) {
        throw new Error(
          siteInfoResponse.message || "Không thể lấy thông tin sinh viên.",
        );
      }

      setUser({
        userid: Number(siteInfoResponse?.userid),
        username: siteInfoResponse?.username || "",
        fullname: siteInfoResponse?.fullname || "",
        siteurl: siteInfoResponse?.siteurl || "",
        email: siteInfoResponse?.email || "",
      });

      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile);

          setLocalProfile({
            ...DEFAULT_PROFILE,
            ...parsed,
          });
        } catch {
          setLocalProfile(DEFAULT_PROFILE);
        }
      } else {
        setLocalProfile({
          ...DEFAULT_PROFILE,
          fullname: siteInfoResponse?.fullname || "",
        });
      }

      setDarkMode(savedTheme === "dark");
    } catch (error: any) {
      Alert.alert("Không thể tải dữ liệu", error?.message || "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Refresh settings
  const handleRefresh = () => {
    setRefreshing(true);
    loadSettings();
  };

  // Change theme
  const handleThemeChange = async (value: boolean) => {
    setDarkMode(value);

    await AsyncStorage.setItem("themeMode", value ? "dark" : "light");
  };

  // Logout
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
              await AsyncStorage.multiRemove(["wstoken", "userid"]);

              DeviceEventEmitter.emit("authChange");
            } catch {
              Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
            }
          },
        },
      ],
    );
  };

  const selectedAvatar =
    AVATAR_OPTIONS.find((avatar) => avatar.id === localProfile.avatarId) ||
    AVATAR_OPTIONS[0];

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Cài đặt" />

        <Loading message="Đang tải thông tin..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Cài đặt" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.content}
      >
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Profile")}
        >
          <View style={styles.avatar}>
            {localProfile.avatarUri ? (
              <Image
                source={{
                  uri: localProfile.avatarUri,
                }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons
                name={selectedAvatar.icon}
                size={28}
                color={COLORS.white}
              />
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {localProfile.fullname || user?.fullname || "Chưa cập nhật"}
            </Text>

            <Text style={styles.username} numberOfLines={1}>
              @{user?.username || "Chưa cập nhật"}
            </Text>

            <View style={styles.studentBadge}>
              <View style={styles.studentDot} />{" "}
              <Text style={styles.studentText}>Sinh viên MekoEdu</Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Tài khoản</Text>

        <View style={styles.settingsGroup}>
          <SettingItem
            icon="person-outline"
            title="Thông tin cá nhân"
            subtitle="Xem thông tin tài khoản"
            onPress={() => navigation.navigate("Profile")}
          />

          <SettingItem
            icon="lock-closed-outline"
            title="Đổi mật khẩu"
            subtitle="Cập nhật mật khẩu tài khoản"
            onPress={() => navigation.navigate("Profile")}
          />
        </View>

        <Text style={styles.sectionTitle}>Ứng dụng</Text>

        <View style={styles.settingsGroup}>
          <SettingItem
            icon="notifications-outline"
            title="Thông báo"
            subtitle="Quản lý thông báo"
            onPress={() => navigation.navigate("SettingsNotification")}
          />

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Ionicons
                name={darkMode ? "moon-outline" : "sunny-outline"}
                size={21}
                color={COLORS.primaryDark}
              />
            </View>

            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Giao diện</Text>

              <Text style={styles.settingSubtitle}>
                {darkMode ? "Giao diện tối" : "Giao diện sáng"}
              </Text>
            </View>

            <View style={styles.switchContainer}>
              <Switch
                value={darkMode}
                onValueChange={handleThemeChange}
                trackColor={{
                  false: COLORS.border,
                  true: COLORS.primary,
                }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>

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
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 25,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 29,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 13,
    marginRight: 8,
  },

  name: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  username: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  studentBadge: {
    alignSelf: "flex-start",
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: COLORS.backgroundSoft,
  },

  studentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 5,
  },

  studentText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.success,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 10,
  },

  settingsGroup: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    overflow: "hidden",
    marginBottom: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    borderRadius: 13,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  settingInfo: {
    flex: 1,
  },

  switchContainer: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  settingTitle: {
    fontSize: 14,
    fontWeight: "700",
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

  dangerIcon: {
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#FFD6D6",
  },

  dangerText: {
    color: COLORS.error,
  },

  version: {
    textAlign: "center",
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
