import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { getSiteInfo } from "../../api/authApi";
import AppHeader from "../../components/common/AppHeader";
import Loading from "../../components/common/Loading";
import COLORS from "../../constants/colors";

type UserInfo = {
  userid?: number;
  username?: string;
  fullname?: string;
  siteurl?: string;
};

type LocalProfile = {
  fullname: string;
  birthday: string;
  avatarId: string;
  avatarUri: string | null;
  address: string;
  phone: string;
};

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

export default function ProfileScreen() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [localProfile, setLocalProfile] =
    useState<LocalProfile>(DEFAULT_PROFILE);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);

  const [editFullname, setEditFullname] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [showAvatarSystem, setShowAvatarSystem] = useState(false);

  // Load profile
  const loadProfile = useCallback(async () => {
    try {
      setError("");

      const [siteData, storedProfile] = await Promise.all([
        getSiteInfo(),
        AsyncStorage.getItem(PROFILE_STORAGE_KEY),
      ]);

      if (siteData?.exception) {
        throw new Error(
          siteData.message || "Không thể lấy thông tin tài khoản.",
        );
      }

      const moodleUser: UserInfo = {
        userid: Number(siteData?.userid),
        username: siteData?.username || "",
        fullname: siteData?.fullname || "",
        siteurl: siteData?.siteurl || "",
      };

      setUser(moodleUser);

      let profile: LocalProfile = DEFAULT_PROFILE;

      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile);

          profile = {
            ...DEFAULT_PROFILE,
            ...parsed,
          };
        } catch {
          profile = DEFAULT_PROFILE;
        }
      }

      if (!profile.fullname) {
        profile.fullname = moodleUser.fullname || "";
      }

      setLocalProfile(profile);

      setEditFullname(profile.fullname);
      setEditBirthday(profile.birthday);
      setEditAddress(profile.address);
      setEditPhone(profile.phone);
    } catch (err: any) {
      setError(err?.message || "Không thể tải thông tin tài khoản.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Refresh profile
  const handleRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  // Pick avatar from gallery
  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Cần quyền truy cập",
        "MekoEdu cần quyền truy cập thư viện ảnh để chọn ảnh đại diện.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const uri = result.assets[0]?.uri;

    if (!uri) return;

    const updatedProfile: LocalProfile = {
      ...localProfile,
      avatarUri: uri,
    };

    setLocalProfile(updatedProfile);
    setShowAvatarOptions(false);

    await AsyncStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(updatedProfile),
    );
  };

  // Select system avatar
  const handleAvatarSelect = async (avatarId: string) => {
    const updatedProfile: LocalProfile = {
      ...localProfile,
      avatarId,
      avatarUri: null,
    };

    setLocalProfile(updatedProfile);
    setShowAvatarSystem(false);
    setShowAvatarOptions(false);

    await AsyncStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(updatedProfile),
    );
  };

  // Start editing
  const handleEdit = () => {
    setEditFullname(localProfile.fullname || user?.fullname || "");
    setEditBirthday(localProfile.birthday);
    setEditAddress(localProfile.address);
    setEditPhone(localProfile.phone);

    setEditing(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditFullname(localProfile.fullname || user?.fullname || "");
    setEditBirthday(localProfile.birthday);
    setEditAddress(localProfile.address);
    setEditPhone(localProfile.phone);

    setShowDatePicker(false);
    setEditing(false);
  };

  // Handle birthday picker
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (!selectedDate) return;

    const day = String(selectedDate.getDate()).padStart(2, "0");
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const year = selectedDate.getFullYear();

    setEditBirthday(`${day}/${month}/${year}`);
  };

  // Convert birthday string to Date
  const getBirthdayDate = () => {
    if (!editBirthday) {
      return new Date(2005, 0, 1);
    }

    const parts = editBirthday.split("/");

    if (parts.length !== 3) {
      return new Date(2005, 0, 1);
    }

    const day = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const year = Number(parts[2]);

    const date = new Date(year, month, day);

    if (Number.isNaN(date.getTime())) {
      return new Date(2005, 0, 1);
    }

    return date;
  };

  // Save profile
  const handleSave = async () => {
    const fullname = editFullname.trim();
    const birthday = editBirthday.trim();
    const address = editAddress.trim();
    const phone = editPhone.trim();

    if (!fullname) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập họ và tên.");
      return;
    }

    if (phone && !/^[0-9+\s-]{8,15}$/.test(phone)) {
      Alert.alert(
        "Số điện thoại không hợp lệ",
        "Vui lòng kiểm tra lại số điện thoại.",
      );
      return;
    }

    const updatedProfile: LocalProfile = {
      ...localProfile,
      fullname,
      birthday,
      address,
      phone,
    };

    try {
      await AsyncStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify(updatedProfile),
      );

      setLocalProfile(updatedProfile);
      setEditing(false);
      setShowDatePicker(false);

      Alert.alert("Đã lưu", "Thông tin hồ sơ đã được cập nhật.");
    } catch {
      Alert.alert("Lỗi", "Không thể lưu thông tin hồ sơ.");
    }
  };

  const selectedAvatar =
    AVATAR_OPTIONS.find((avatar) => avatar.id === localProfile.avatarId) ||
    AVATAR_OPTIONS[0];

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="Hồ sơ cá nhân"
          subtitle="Thông tin tài khoản của bạn"
        />

        <Loading message="Đang tải thông tin..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Hồ sơ cá nhân" />

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
        {error ? (
          <View style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Ionicons
                name="cloud-offline-outline"
                size={30}
                color={COLORS.error}
              />
            </View>

            <Text style={styles.errorTitle}>Không thể tải thông tin</Text>

            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : user ? (
          <>
            <View style={styles.profileCard}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowAvatarOptions((prev) => !prev)}
              >
                <View style={styles.avatar}>
                  {localProfile.avatarUri ? (
                    <Image
                      source={{ uri: localProfile.avatarUri }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Ionicons
                      name={selectedAvatar.icon}
                      size={40}
                      color={COLORS.white}
                    />
                  )}

                  <View style={styles.avatarEdit}>
                    <Ionicons name="camera" size={12} color={COLORS.white} />
                  </View>
                </View>
              </TouchableOpacity>

              <Text style={styles.fullname}>
                {localProfile.fullname || user.fullname || "Chưa cập nhật"}
              </Text>

              <Text style={styles.username}>
                @{user.username || "Chưa cập nhật"}
              </Text>

              {showAvatarOptions && (
                <View style={styles.avatarPicker}>
                  <TouchableOpacity
                    style={styles.avatarChoice}
                    activeOpacity={0.8}
                    onPress={() => setShowAvatarSystem(true)}
                  >
                    <View style={styles.avatarChoiceIcon}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={COLORS.primary}
                      />
                    </View>

                    <View style={styles.avatarChoiceContent}>
                      <Text style={styles.avatarChoiceTitle}>
                        Chọn từ hệ thống
                      </Text>

                      <Text style={styles.avatarChoiceDescription}>
                        Sử dụng avatar có sẵn
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.textLight}
                    />
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  <TouchableOpacity
                    style={styles.avatarChoice}
                    activeOpacity={0.8}
                    onPress={handlePickAvatar}
                  >
                    <View style={styles.avatarChoiceIcon}>
                      <Ionicons
                        name="images-outline"
                        size={20}
                        color={COLORS.primary}
                      />
                    </View>

                    <View style={styles.avatarChoiceContent}>
                      <Text style={styles.avatarChoiceTitle}>
                        Chọn ảnh từ thư viện
                      </Text>

                      <Text style={styles.avatarChoiceDescription}>
                        Chọn ảnh có sẵn trên thiết bị
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.textLight}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

              {!editing && (
                <TouchableOpacity
                  style={styles.editButton}
                  activeOpacity={0.7}
                  onPress={handleEdit}
                >
                  <Ionicons
                    name="create-outline"
                    size={17}
                    color={COLORS.primary}
                  />

                  <Text style={styles.editText}>Chỉnh sửa</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.personalCard}>
              <View style={styles.field}>
                <View style={styles.fieldIcon}>
                  <Ionicons
                    name="person-outline"
                    size={19}
                    color={COLORS.primary}
                  />
                </View>

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Họ và tên</Text>

                  {editing ? (
                    <TextInput
                      value={editFullname}
                      onChangeText={setEditFullname}
                      placeholder="Nhập họ và tên"
                      placeholderTextColor={COLORS.textLight}
                      style={styles.input}
                    />
                  ) : (
                    <Text style={styles.fieldValue}>
                      {localProfile.fullname ||
                        user.fullname ||
                        "Chưa cập nhật"}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.field}>
                <View style={styles.fieldIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={19}
                    color={COLORS.primary}
                  />
                </View>

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Ngày sinh</Text>

                  {editing ? (
                    <>
                      <TouchableOpacity
                        style={styles.dateInput}
                        activeOpacity={0.8}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Text
                          style={[
                            styles.dateText,
                            !editBirthday && styles.datePlaceholder,
                          ]}
                        >
                          {editBirthday || "Chọn ngày sinh"}
                        </Text>

                        <Ionicons
                          name="calendar-outline"
                          size={19}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>

                      {showDatePicker && (
                        <DateTimePicker
                          value={getBirthdayDate()}
                          mode="date"
                          display="default"
                          maximumDate={new Date()}
                          onChange={handleDateChange}
                        />
                      )}
                    </>
                  ) : (
                    <Text style={styles.fieldValue}>
                      {localProfile.birthday || "Chưa cập nhật"}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.field}>
                <View style={styles.fieldIcon}>
                  <Ionicons
                    name="location-outline"
                    size={19}
                    color={COLORS.primary}
                  />
                </View>

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Địa chỉ</Text>

                  {editing ? (
                    <TextInput
                      value={editAddress}
                      onChangeText={setEditAddress}
                      placeholder="Nhập địa chỉ của bạn"
                      placeholderTextColor={COLORS.textLight}
                      multiline
                      style={[styles.input, styles.addressInput]}
                    />
                  ) : (
                    <Text style={styles.fieldValue}>
                      {localProfile.address || "Chưa cập nhật"}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.field}>
                <View style={styles.fieldIcon}>
                  <Ionicons
                    name="call-outline"
                    size={19}
                    color={COLORS.primary}
                  />
                </View>

                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Số điện thoại</Text>

                  {editing ? (
                    <TextInput
                      value={editPhone}
                      onChangeText={setEditPhone}
                      placeholder="Nhập số điện thoại"
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="phone-pad"
                      style={styles.input}
                    />
                  ) : (
                    <Text style={styles.fieldValue}>
                      {localProfile.phone || "Chưa cập nhật"}
                    </Text>
                  )}
                </View>
              </View>

              {editing && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    activeOpacity={0.8}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.cancelText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    activeOpacity={0.8}
                    onPress={handleSave}
                  >
                    <Ionicons name="checkmark" size={18} color={COLORS.white} />

                    <Text style={styles.saveText}>Lưu thay đổi</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Ionicons
                name="person-outline"
                size={30}
                color={COLORS.textLight}
              />
            </View>

            <Text style={styles.errorTitle}>Không có thông tin</Text>

            <Text style={styles.errorText}>
              Chưa lấy được thông tin tài khoản từ máy chủ.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showAvatarSystem}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarSystem(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.systemAvatarModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn avatar</Text>

              <TouchableOpacity
                onPress={() => setShowAvatarSystem(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={23} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>Chọn một avatar có sẵn</Text>

            <View style={styles.avatarOptions}>
              {AVATAR_OPTIONS.map((avatar) => {
                const selected =
                  !localProfile.avatarUri &&
                  avatar.id === localProfile.avatarId;

                return (
                  <TouchableOpacity
                    key={avatar.id}
                    style={[
                      styles.avatarOption,
                      selected && styles.avatarOptionSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleAvatarSelect(avatar.id)}
                  >
                    <Ionicons
                      name={avatar.icon}
                      size={28}
                      color={selected ? COLORS.white : COLORS.primary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

type InfoRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={19} color={COLORS.primary} />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>

        <Text style={styles.infoValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  content: {
    padding: 16,
    paddingBottom: 32,
  },

  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "visible",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 48,
  },

  avatarEdit: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: COLORS.primaryDark,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  fullname: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },

  username: {
    marginTop: 5,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  avatarPicker: {
    width: "100%",
    marginTop: 18,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  avatarChoice: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  avatarChoiceIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarChoiceContent: {
    flex: 1,
    marginLeft: 12,
  },

  avatarChoiceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  avatarChoiceDescription: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textLight,
  },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 3,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },

  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
  },

  infoContent: {
    flex: 1,
    marginLeft: 13,
  },

  infoLabel: {
    fontSize: 11,
    color: COLORS.textLight,
  },

  infoValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  sectionHeader: {
    marginTop: 4,
    marginLeft: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  editButton: {
    marginTop: 14,
    marginRight: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  editText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

  personalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  field: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  fieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
  },

  fieldContent: {
    flex: 1,
    marginLeft: 13,
  },

  fieldLabel: {
    fontSize: 11,
    color: COLORS.textLight,
  },

  fieldValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 20,
  },

  input: {
    marginTop: 5,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSoft,
    fontSize: 13,
    color: COLORS.text,
  },

  dateInput: {
    marginTop: 5,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dateText: {
    fontSize: 13,
    color: COLORS.text,
  },

  datePlaceholder: {
    color: COLORS.textLight,
  },

  addressInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    paddingTop: 14,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  cancelButton: {
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  saveButton: {
    minHeight: 42,
    paddingHorizontal: 17,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: COLORS.primary,
  },

  saveText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 57,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  systemAvatarModal: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 20,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },

  modalDescription: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  avatarOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
  },

  avatarOption: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  errorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  errorIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
  },

  errorTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  errorText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
