import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface CourseItemProps {
  courseName: string;
  shortname?: string;
  onPress: () => void;
}

export default function CourseItem({
  courseName,
  shortname,
  onPress,
}: CourseItemProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.touchable}>
      <LinearGradient
        colors={["#1B7543", "#0B3C2A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >


        <Text style={styles.title} numberOfLines={2}>
          {courseName}
        </Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1}>
            {shortname}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.statItem}>
            <Ionicons name="play-circle-outline" size={14} color="#FFF" />
            <Text style={styles.statText}>18 Bài</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="document-text-outline" size={14} color="#FFF" />
            <Text style={styles.statText}>4 Bài kiểm tra</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={14} color="#FFF" />
            <Text style={styles.statText}>68 SV</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginBottom: 10,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  container: {
    padding: 18,
    borderRadius: 16,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    lineHeight: 24,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
  },
});
