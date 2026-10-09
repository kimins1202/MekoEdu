import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import COLORS from "../../constants/colors";
import { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  // Logo
  const [logoOpacity] = useState(() => new Animated.Value(0));
  const [logoScale] = useState(() => new Animated.Value(0.85));
  const [logoTranslateY] = useState(() => new Animated.Value(10));

  // Loading
  const [loadingOpacity] = useState(() => new Animated.Value(0));
  const [loadingScale] = useState(() => new Animated.Value(0.8));

  const [dot1] = useState(() => new Animated.Value(0.25));
  const [dot2] = useState(() => new Animated.Value(0.25));
  const [dot3] = useState(() => new Animated.Value(0.25));

  const [progressScale] = useState(() => new Animated.Value(0));

  // MekoSoft
  const [brandOpacity] = useState(() => new Animated.Value(0));
  const [brandTranslateY] = useState(() => new Animated.Value(10));

  useEffect(() => {
    // =====================================
    // 1. Logo xuất hiện
    // =====================================
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),

      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // =====================================
    // 2. Loading xuất hiện
    // =====================================
    Animated.parallel([
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 250,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.spring(loadingScale, {
        toValue: 1,
        friction: 7,
        tension: 50,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // =====================================
    // 3. Loading dots
    // =====================================
    const loadingAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0.25,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0.25,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 0.25,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0.25,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 0.25,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0.25,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    loadingAnimation.start();

    // =====================================
    // 4. Thanh loading
    // 0.3s → 1.1s
    // =====================================
    Animated.timing(progressScale, {
      toValue: 1,
      duration: 800,
      delay: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    // =====================================
    // 5. Loading biến mất
    // 1.1s → 1.3s
    // =====================================
    Animated.timing(loadingOpacity, {
      toValue: 0,
      duration: 200,
      delay: 1100,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // =====================================
    // 6. MekoSoft xuất hiện
    // 1.3s → 1.8s
    // =====================================
    Animated.parallel([
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 500,
        delay: 1300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(brandTranslateY, {
        toValue: 0,
        duration: 500,
        delay: 1300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // =====================================
    // 7. Sau 2 giây → Onboarding
    // =====================================
    const timer = setTimeout(() => {
      navigation.replace("Onboarding");
    }, 2000);

    // Cleanup
    return () => {
      clearTimeout(timer);
      loadingAnimation.stop();
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary, "#178044"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView
        edges={["top", "right", "left"]}
        style={styles.background}
      >
        {/* =========================
            LOGO
        ========================= */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { translateY: logoTranslateY }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/images/mekosoft-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* =========================
            LOADING
        ========================= */}
        <Animated.View
          style={[
            styles.loading,
            {
              opacity: loadingOpacity,
              transform: [{ scale: loadingScale }],
            },
          ]}
        >
          <View style={styles.loadingDots}>
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: dot1,
                },
              ]}
            />

            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: dot2,
                },
              ]}
            />

            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: dot3,
                },
              ]}
            />
          </View>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progress,
                {
                  transform: [{ scaleX: progressScale }],
                },
              ]}
            />
          </View>
        </Animated.View>

        {/* =========================
            FROM MEKOSOFT
        ========================= */}
        <Animated.View
          style={[
            styles.brand,
            {
              opacity: brandOpacity,
              transform: [{ translateY: brandTranslateY }],
            },
          ]}
        >
          <Text style={styles.fromText}>FROM</Text>

          <View style={styles.brandName}>
            <Text style={styles.mekoText}>Meko</Text>
            <Text style={styles.softText}>Soft</Text>
          </View>
        </Animated.View>

        {/* iPhone Home Indicator */}
        <View style={styles.homeIndicator} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  background: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  // Logo
  logoWrapper: {
    width: 230,
    height: 230,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -90,
  },

  logoContainer: {
    width: 158,
    height: 158,
    borderRadius: 79,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.surface,

    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.22,
    shadowRadius: 24,

    elevation: 14,
  },

  logo: {
    width: 116,
    height: 116,
  },

  // Loading
  loading: {
    position: "absolute",

    // Đặt cao hơn MekoSoft
    bottom: 145,

    alignItems: "center",
  },

  loadingDots: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,

    backgroundColor: COLORS.primaryLight,

    marginHorizontal: 4,
  },

  progressTrack: {
    width: 88,
    height: 2,

    borderRadius: 2,
    overflow: "hidden",

    backgroundColor: "rgba(255,255,255,0.14)",
  },

  progress: {
    width: "100%",
    height: 2,

    borderRadius: 2,

    backgroundColor: COLORS.primaryLight,
  },

  // MekoSoft
  brand: {
    position: "absolute",

    bottom: 62,

    alignItems: "center",
  },

  fromText: {
    fontSize: 8,
    fontWeight: "500",

    color: "rgba(255,255,255,0.55)",

    letterSpacing: 3.5,

    marginBottom: 4,
  },

  brandName: {
    flexDirection: "row",
    alignItems: "center",
  },

  mekoText: {
    fontSize: 25,
    fontWeight: "800",

    color: COLORS.white,

    letterSpacing: 0.2,
  },

  softText: {
    fontSize: 25,
    fontWeight: "800",

    color: COLORS.primaryLight,

    letterSpacing: 0.2,
  },

  // Home Indicator
  homeIndicator: {
    position: "absolute",

    bottom: 22,

    width: 105,
    height: 4,

    borderRadius: 4,

    backgroundColor: "rgba(255,255,255,0.5)",
  },
});
