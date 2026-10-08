import { Ionicons } from "@expo/vector-icons";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "../../components/common/AppHeader";
import COLORS from "../../constants/colors";

export default function ContactScreen() {
  const handleEmail = async () => {
    const url = "mailto:contact@mekosoft.vn";

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handlePhone = async () => {
    const url = "tel:0911999854";

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handleAddress = async () => {
    const address = "15 đường số 7 KDC Metro, Phường Tân An, Thành phố Cần Thơ";

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address,
    )}`;

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    }
  };
  const handleWebsite = async () => {
    const url = "https://mekosoft.vn";

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Liên hệ" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* INTRO */}
        <View style={styles.intro}>
          <View style={styles.iconCircle}>
            <Ionicons name="headset-outline" size={30} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Liên hệ với chúng tôi</Text>

          <Text style={styles.description}>
            Nếu bạn cần hỗ trợ hoặc có góp ý trong quá trình sử dụng MekoEdu,
            hãy liên hệ với chúng tôi qua các thông tin bên dưới.
          </Text>
        </View>

        {/* CONTACT INFORMATION */}
        <View style={styles.card}>
          {/* ADDRESS */}
          <TouchableOpacity
            style={styles.contactItem}
            activeOpacity={0.7}
            onPress={handleAddress}
          >
            <View style={styles.itemIcon}>
              <Ionicons
                name="location-outline"
                size={22}
                color={COLORS.primaryDark}
              />
            </View>

            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>Địa chỉ liên hệ</Text>

              <Text style={styles.itemSubtitle}>
                15 đường số 7 KDC Metro, Phường Tân An, Thành phố Cần Thơ
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color={COLORS.textLight}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* EMAIL */}
          <TouchableOpacity
            style={styles.contactItem}
            activeOpacity={0.7}
            onPress={handleEmail}
          >
            <View style={styles.itemIcon}>
              <Ionicons
                name="mail-outline"
                size={21}
                color={COLORS.primaryDark}
              />
            </View>

            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>Email</Text>

              <Text style={styles.itemSubtitle}>contact@mekosoft.vn</Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color={COLORS.textLight}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* PHONE */}
          <TouchableOpacity
            style={styles.contactItem}
            activeOpacity={0.7}
            onPress={handlePhone}
          >
            <View style={styles.itemIcon}>
              <Ionicons
                name="call-outline"
                size={21}
                color={COLORS.primaryDark}
              />
            </View>

            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>Điện thoại</Text>

              <Text style={styles.itemSubtitle}>0911 999 854</Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color={COLORS.textLight}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* WEBSITE */}
          <TouchableOpacity
            style={styles.contactItem}
            activeOpacity={0.7}
            onPress={handleWebsite}
          >
            <View style={styles.itemIcon}>
              <Ionicons
                name="globe-outline"
                size={21}
                color={COLORS.primaryDark}
              />
            </View>

            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>Website</Text>

              <Text style={styles.itemSubtitle}>mekoSoft.vn</Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color={COLORS.textLight}
            />
          </TouchableOpacity>
        </View>

        {/* FEEDBACK */}
        <Text style={styles.sectionTitle}>Góp ý</Text>

        <View style={styles.feedbackCard}>
          <View style={styles.feedbackIcon}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={23}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.feedbackContent}>
            <Text style={styles.feedbackTitle}>Góp ý để MekoEdu tốt hơn</Text>

            <Text style={styles.feedbackText}>
              Những phản hồi của bạn giúp chúng tôi cải thiện trải nghiệm học
              tập trên MekoEdu.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>MekoEdu · Phát triển bởi MekoSoft</Text>
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

  intro: {
    alignItems: "center",
    marginBottom: 24,
  },

  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },

  description: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: "center",
    maxWidth: 330,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  contactItem: {
    minHeight: 82,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.backgroundSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  itemContent: {
    flex: 1,
    paddingRight: 8,
  },

  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  itemSubtitle: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 69,
  },

  sectionTitle: {
    marginTop: 25,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  feedbackCard: {
    padding: 16,
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  feedbackIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.backgroundSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  feedbackContent: {
    flex: 1,
  },

  feedbackTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  feedbackText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },

  footer: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 11,
    color: COLORS.textLight,
  },
});
