import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";

import COLORS from "../../constants/colors";
import { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  // =========================
  // Logo animation
  // =========================
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoTranslateY = useRef(new Animated.Value(14)).current;

  // =========================
  // Loading animation
  // =========================
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const loadingScale = useRef(new Animated.Value(0.8)).current;

  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  const progressScale = useRef(new Animated.Value(0)).current;

  // =========================
  // MekoSoft animation
  // =========================
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    // =====================================
    // 1. Logo xuất hiện
    // =====================================
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 45,
        useNativeDriver: true,
      }),

      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 700,
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
        duration: 400,
        delay: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.spring(loadingScale, {
        toValue: 1,
        friction: 7,
        tension: 50,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // =====================================
    // 3. Loading dots
    // =====================================
    const loadingAnimation = Animated.loop(
      Animated.sequence([
        // Dot 1
        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0.25,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0.25,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),

        // Dot 2
        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 0.25,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0.25,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),

        // Dot 3
        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 0.25,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0.25,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    loadingAnimation.start();

    // =====================================
    // 4. Thanh loading
    // Chạy từ 0.5s → 1.8s
    // =====================================
    Animated.timing(progressScale, {
      toValue: 1,
      duration: 1300,
      delay: 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    // =====================================
    // 5. Loading biến mất
    // Bắt đầu tại 1.8s
    // =====================================
    Animated.timing(loadingOpacity, {
      toValue: 0,
      duration: 300,
      delay: 1800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // =====================================
    // 6. MekoSoft xuất hiện SAU loading
    // Bắt đầu tại 2.1s
    // =====================================
    Animated.parallel([
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 600,
        delay: 2100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(brandTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 2100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // =====================================
    // 7. Sau đúng 3 giây → Onboarding
    // =====================================
    const timer = setTimeout(() => {
      navigation.replace("Onboarding");
    }, 3000);

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
        style={styles.background}
      >
        {/* =====================================
            LOGO
        ===================================== */}
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

        {/* =====================================
            LOADING
        ===================================== */}
        <Animated.View
          style={[
            styles.loading,
            {
              opacity: loadingOpacity,
              transform: [{ scale: loadingScale }],
            },
          ]}
        >
          {/* Loading dots */}
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

          {/* Loading bar */}
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

        {/* =====================================
            FROM MEKOSOFT
        ===================================== */}
        <Animated.View
          style={[
            styles.brand,
            {
              opacity: brandOpacity,
              transform: [
                {
                  translateY: brandTranslateY,
                },
              ],
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
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  // =========================
  // Container
  // =========================
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

  // =========================
  // Logo
  // =========================
  logoWrapper: {
    width: 230,
    height: 230,
    alignItems: "center",
    justifyContent: "center",

    // Đẩy logo lên trên một chút
    marginTop: -90,
  },

  logoContainer: {
    width: 158,
    height: 158,
    borderRadius: 79,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.white,

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

  // =========================
  // Loading
  // =========================
  loading: {
    position: "absolute",

    // Cách xa MekoSoft
    bottom: 145,

    alignItems: "center",
  },

  loadingDots: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 13,
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

    transformOrigin: "left",
  },

  // =========================
  // MekoSoft
  // =========================
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

  // =========================
  // Home Indicator
  // =========================
  homeIndicator: {
    position: "absolute",

    bottom: 22,

    width: 105,
    height: 4,

    borderRadius: 4,

    backgroundColor: "rgba(255,255,255,0.5)",
  },
});
