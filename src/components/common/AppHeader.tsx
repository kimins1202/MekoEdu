import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import COLORS from "../../constants/colors";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightText?: string;
  onRightPress?: () => void;
}

export default function AppHeader({
  title,
  subtitle,
  showBack = false,
  rightText,
  onRightPress,
}: AppHeaderProps) {
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
          )}

          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>

            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {rightText ? (
          <TouchableOpacity onPress={onRightPress} activeOpacity={0.7}>
            <Text style={styles.rightText}>{rightText}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.white,
  },

  container: {
    minHeight: 60,

    paddingHorizontal: 20,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: COLORS.white,

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: COLORS.backgroundSoft,

    marginRight: 10,
  },

  backIcon: {
    fontSize: 32,
    lineHeight: 35,
    color: COLORS.text,
    marginTop: -3,
  },

  titleContainer: {
    flex: 1,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  rightText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primaryDark,
    marginLeft: 12,
  },
});
