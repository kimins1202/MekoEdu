import { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

export default function SplashScreen({ navigation }: any) {
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),

        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),

      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace("Onboarding");
      // Hoặc navigation.replace("Login");
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />

      {/* Decorative small shape */}
      <View style={styles.smallCircle1} />
      <View style={styles.smallCircle2} />

      {/* Main content */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logo}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity }}>
          <Text style={styles.appName}>
            Meko<Text style={styles.eduText}>Edu</Text>
          </Text>

          <Text style={styles.slogan}>Learn smarter. Grow better.</Text>
        </Animated.View>
      </View>

      {/* Footer */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FFF9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  content: {
    alignItems: "center",
    zIndex: 10,
  },

  logoContainer: {
    marginBottom: 22,
  },

  logo: {
    width: 110,
    height: 110,
    borderRadius: 35,
    backgroundColor: "#3EAF7C",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#3EAF7C",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,

    elevation: 8,
  },

  logoLetter: {
    color: "#FFFFFF",
    fontSize: 62,
    fontWeight: "800",
  },

  appName: {
    fontSize: 38,
    fontWeight: "800",
    color: "#415161",
    textAlign: "center",
    letterSpacing: 0.5,
  },

  eduText: {
    color: "#3EAF7C",
  },

  slogan: {
    marginTop: 8,
    fontSize: 15,
    color: "#718078",
    textAlign: "center",
    letterSpacing: 0.5,
  },

  footer: {
    position: "absolute",
    bottom: 50,
    fontSize: 13,
    color: "#94A29A",
  },

  circleTop: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,

    backgroundColor: "#61CE70",

    top: -100,
    right: -100,

    opacity: 0.18,
  },

  circleBottom: {
    position: "absolute",

    width: 330,
    height: 330,

    borderRadius: 165,

    backgroundColor: "#3EAF7C",

    bottom: -150,
    left: -130,

    opacity: 0.14,
  },

  smallCircle1: {
    position: "absolute",

    width: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor: "#61CE70",

    top: height * 0.27,
    left: 45,

    opacity: 0.4,
  },

  smallCircle2: {
    position: "absolute",

    width: 20,
    height: 20,

    borderRadius: 10,

    backgroundColor: "#3EAF7C",

    bottom: height * 0.25,
    right: 50,

    opacity: 0.45,
  },
});
