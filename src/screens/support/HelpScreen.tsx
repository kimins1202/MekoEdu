import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/common/AppHeader";
import COLORS from "../../constants/colors";
import { AppStackParamList } from "../../types/navigation";

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.faqItem}
      activeOpacity={0.8}
      onPress={() => setExpanded((prev) => !prev)}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.question}>{question}</Text>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={19}
          color={COLORS.textSecondary}
        />
      </View>

      {expanded && <Text style={styles.answer}>{answer}</Text>}
    </TouchableOpacity>
  );
}

export default function HelpScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <AppHeader title="Trợ giúp" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* INTRO */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons
              name="help-circle-outline"
              size={30}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.introContent}>
            <Text style={styles.introTitle}>MekoEdu hỗ trợ bạn</Text>

            <Text style={styles.introText}>
              Tìm câu trả lời cho những vấn đề thường gặp khi sử dụng ứng dụng.
            </Text>
          </View>
        </View>

        {/* QUICK GUIDE */}
        <Text style={styles.sectionTitle}>Hướng dẫn nhanh</Text>

        <View style={styles.quickCard}>
          <View style={styles.quickItem}>
            <View style={styles.quickIcon}>
              <Ionicons name="book-outline" size={20} color={COLORS.primary} />
            </View>

            <View style={styles.quickInfo}>
              <Text style={styles.quickTitle}>Xem khóa học</Text>

              <Text style={styles.quickText}>
                Truy cập các khóa học được cung cấp cho tài khoản của bạn.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.quickItem}>
            <View style={styles.quickIcon}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.quickInfo}>
              <Text style={styles.quickTitle}>Làm bài kiểm tra</Text>

              <Text style={styles.quickText}>
                Chọn bài kiểm tra, trả lời câu hỏi và nộp bài trước khi hết thời
                gian.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.quickItem}>
            <View style={styles.quickIcon}>
              <Ionicons
                name="bar-chart-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.quickInfo}>
              <Text style={styles.quickTitle}>Xem kết quả</Text>

              <Text style={styles.quickText}>
                Theo dõi lịch sử và kết quả các bài kiểm tra đã thực hiện.
              </Text>
            </View>
          </View>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>

        <View style={styles.faqCard}>
          <FAQItem
            question="Tại sao tôi không thấy khóa học?"
            answer="Hãy kiểm tra tài khoản đang đăng nhập và đảm bảo tài khoản của bạn đã được đăng ký vào khóa học tương ứng."
          />

          <FAQItem
            question="Tôi có thể làm lại bài kiểm tra không?"
            answer="Việc làm lại bài kiểm tra phụ thuộc vào số lần làm bài được thiết lập cho từng bài kiểm tra."
          />

          <FAQItem
            question="Khi hết thời gian bài kiểm tra thì sao?"
            answer="Khi thời gian làm bài kết thúc, bài kiểm tra sẽ được xử lý theo trạng thái và quy định của hệ thống."
          />

          <FAQItem
            question="Tôi có thể xem lại kết quả không?"
            answer="Bạn có thể xem các kết quả đã được ghi nhận trong mục Lịch sử nếu bài kiểm tra hỗ trợ hiển thị kết quả."
          />

          <FAQItem
            question="Tôi gặp lỗi khi sử dụng ứng dụng thì làm gì?"
            answer="Bạn có thể kiểm tra kết nối mạng, đăng nhập lại ứng dụng hoặc liên hệ đội ngũ hỗ trợ để được hướng dẫn."
          />
        </View>

        {/* CONTACT */}
        <TouchableOpacity
          style={styles.contactCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Contact")}
        >
          <View style={styles.contactIcon}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={23}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Vẫn cần hỗ trợ?</Text>

            <Text style={styles.contactText}>
              Liên hệ với đội ngũ MekoSoft để được hỗ trợ thêm.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={19} color={COLORS.textLight} />
        </TouchableOpacity>

        <Text style={styles.footer}>MekoEdu · Trung tâm hỗ trợ</Text>
      </ScrollView>
    </SafeAreaView>
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

  introCard: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },

  introIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSoft,
    marginRight: 13,
  },

  introContent: {
    flex: 1,
  },

  introTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  introText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },

  sectionTitle: {
    marginBottom: 10,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },

  quickCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginBottom: 24,
  },

  quickItem: {
    minHeight: 78,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSoft,
    marginRight: 12,
  },

  quickInfo: {
    flex: 1,
  },

  quickTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  quickText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 69,
  },

  faqCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginBottom: 24,
  },

  faqItem: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  question: {
    flex: 1,
    paddingRight: 10,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: COLORS.text,
  },

  answer: {
    marginTop: 10,
    paddingRight: 20,
    fontSize: 12,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },

  contactCard: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSoft,
    marginRight: 12,
  },

  contactContent: {
    flex: 1,
  },

  contactTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },

  contactText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },

  footer: {
    marginTop: 25,
    textAlign: "center",
    fontSize: 11,
    color: COLORS.textLight,
  },
});
