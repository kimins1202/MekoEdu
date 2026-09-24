import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import COLORS from "../../constants/colors";

export default function SplashScreen({ navigation }: any) {
  // ANIMATION VALUES

  const logoScale = useRef(new Animated.Value(0.75)).current;

  const logoOpacity = useRef(new Animated.Value(0)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;

  const textTranslateY = useRef(new Animated.Value(15)).current;

  const ringScale = useRef(new Animated.Value(0.8)).current;

  const ringOpacity = useRef(new Animated.Value(0)).current;

  const circleTopAnim = useRef(new Animated.Value(0)).current;

  const circleBottomAnim = useRef(new Animated.Value(0)).current;

  // START ANIMATION

  useEffect(() => {
    // Logo xuất hiện
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();

    // Vòng sáng phía sau logo
    Animated.sequence([
      Animated.delay(250),

      Animated.parallel([
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),

        Animated.timing(ringScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),

      Animated.timing(ringOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Text xuất hiện sau logo
    Animated.sequence([
      Animated.delay(650),

      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Decorative animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(circleTopAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(circleTopAnim, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(circleBottomAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(circleBottomAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Chuyển sang Onboarding
    const timer = setTimeout(() => {
      navigation.replace("Onboarding");
    }, 2500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // DECORATIVE TRANSFORMS

  const topCircleTranslate = circleTopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  const bottomCircleTranslate = circleBottomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* 
            BACKGROUND DECORATION
         */}

        <Animated.View
          style={[
            styles.circleTop,
            {
              transform: [{ translateY: topCircleTranslate }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.circleBottom,
            {
              transform: [{ translateY: bottomCircleTranslate }],
            },
          ]}
        />

        <View style={styles.smallCircle1} />
        <View style={styles.smallCircle2} />

        {/* 
            MAIN CONTENT
         */}

        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoWrapper}>
            {/* Glow ring */}
            <Animated.View
              style={[
                styles.logoRing,
                {
                  opacity: ringOpacity,
                  transform: [{ scale: ringScale }],
                },
              ]}
            />

            {/* Logo */}
            <Animated.View
              style={[
                styles.logo,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                },
              ]}
            >
              <Text style={styles.logoLetter}>M</Text>
            </Animated.View>
          </View>

          {/* App name + slogan */}
          <Animated.View
            style={{
              opacity: textOpacity,
              transform: [
                {
                  translateY: textTranslateY,
                },
              ],
            }}
          >
            <Text style={styles.appName}>
              Meko
              <Text style={styles.eduText}>Edu</Text>
            </Text>

            <Text style={styles.slogan}>Learn smarter. Grow better.</Text>
          </Animated.View>
        </View>

        {/* 
            FOOTER
         */}

        <Animated.Text
          style={[
            styles.footer,
            {
              opacity: textOpacity,
            },
          ]}
        >
          Learning made simple
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // CONTAINER

  safeArea: {
    flex: 1,
    backgroundColor: "#F7FBF8",
  },

  container: {
    flex: 1,
    backgroundColor: "#F7FBF8",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  // MAIN CONTENT

  content: {
    alignItems: "center",
    zIndex: 10,
  },

  logoWrapper: {
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  logo: {
    width: 105,
    height: 105,

    borderRadius: 32,

    backgroundColor: COLORS.primaryDark,

    justifyContent: "center",
    alignItems: "center",

    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.22,
    shadowRadius: 18,

    elevation: 10,
  },

  logoLetter: {
    color: COLORS.white,
    fontSize: 60,
    fontWeight: "800",
    letterSpacing: -2,
  },

  // GLOW RING

  logoRing: {
    position: "absolute",

    width: 135,
    height: 135,

    borderRadius: 67.5,

    borderWidth: 1.5,
    borderColor: COLORS.primary,

    opacity: 0,
  },

  // APP NAME

  appName: {
    fontSize: 38,
    fontWeight: "800",

    color: COLORS.text,

    textAlign: "center",

    letterSpacing: 0.3,
  },

  eduText: {
    color: COLORS.primary,
  },

  slogan: {
    marginTop: 8,

    fontSize: 14,

    color: "#60716A",

    textAlign: "center",

    letterSpacing: 0.4,
  },

  // FOOTER

  footer: {
    position: "absolute",

    bottom: 28,

    fontSize: 12,

    color: "#8A9992",

    letterSpacing: 0.3,
  },

  // DECORATIVE SHAPES

  circleTop: {
    position: "absolute",

    width: 280,
    height: 280,

    borderRadius: 140,

    backgroundColor: COLORS.primary,

    top: -125,
    right: -105,

    opacity: 0.08,
  },

  circleBottom: {
    position: "absolute",

    width: 340,
    height: 340,

    borderRadius: 170,

    backgroundColor: COLORS.primaryDark,

    bottom: -175,
    left: -145,

    opacity: 0.07,
  },

  smallCircle1: {
    position: "absolute",

    width: 10,
    height: 10,

    borderRadius: 5,

    backgroundColor: COLORS.primary,

    top: "28%",
    left: 45,

    opacity: 0.5,
  },

  smallCircle2: {
    position: "absolute",

    width: 16,
    height: 16,

    borderRadius: 8,

    borderWidth: 2,
    borderColor: COLORS.primaryDark,

    bottom: "27%",
    right: 45,

    opacity: 0.35,
  },
});
