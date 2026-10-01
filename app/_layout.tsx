import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";

import * as SplashScreen from "expo-splash-screen";

import { StatusBar } from "expo-status-bar";

import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useEffect, useRef, useState } from "react";

import "react-native-reanimated";

import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";

// ==========================================
// KEEP NATIVE SPLASH VISIBLE
// ==========================================

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if splash is already controlled
  // by the development environment.
});

// ==========================================
// SPLASH SETTINGS
// ==========================================

const CUSTOM_SPLASH_DURATION = 3000;

const SPLASH_EXIT_DURATION = 350;

// ==========================================
// ROOT LAYOUT
// ==========================================

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const { isLoading } = useAuth();

  // ========================================
  // CUSTOM SPLASH
  // ========================================

  const [showAppSplash, setShowAppSplash] = useState(true);

  const [progress, setProgress] = useState(0);

  const splashStartedRef = useRef(false);

  // ========================================
  // SPLASH ANIMATIONS
  // ========================================

  const splashOpacity = useRef(new Animated.Value(1)).current;

  const logoOpacity = useRef(new Animated.Value(0)).current;

  const logoScale = useRef(new Animated.Value(0.9)).current;

  const logoTranslateY = useRef(new Animated.Value(16)).current;

  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  const subtitleTranslateY = useRef(new Animated.Value(10)).current;

  const loadingOpacity = useRef(new Animated.Value(0)).current;

  const loadingTranslateY = useRef(new Animated.Value(10)).current;

  const footerOpacity = useRef(new Animated.Value(0)).current;

  // ========================================
  // FONTS
  // ========================================

  const [fontsLoaded, fontError] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // ========================================
  // FONT ERROR
  // ========================================

  useEffect(() => {
    if (!fontError) {
      return;
    }

    SplashScreen.hideAsync().catch(() => {});
  }, [fontError]);

  // ========================================
  // START SPLASH CONTENT ANIMATION
  // ========================================

  const startSplashAnimation = () => {
    Animated.sequence([
      // ====================================
      // LOGO
      // ====================================

      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,

          duration: 450,

          easing: Easing.out(Easing.cubic),

          useNativeDriver: true,
        }),

        Animated.spring(logoScale, {
          toValue: 1,

          friction: 7,

          tension: 55,

          useNativeDriver: true,
        }),

        Animated.timing(logoTranslateY, {
          toValue: 0,

          duration: 450,

          easing: Easing.out(Easing.cubic),

          useNativeDriver: true,
        }),
      ]),

      // ====================================
      // SUBTITLE
      // ====================================

      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,

          duration: 350,

          easing: Easing.out(Easing.cubic),

          useNativeDriver: true,
        }),

        Animated.timing(subtitleTranslateY, {
          toValue: 0,

          duration: 350,

          easing: Easing.out(Easing.cubic),

          useNativeDriver: true,
        }),
      ]),

      // ====================================
      // LOADING AREA
      // ====================================

      Animated.parallel([
        Animated.timing(loadingOpacity, {
          toValue: 1,

          duration: 350,

          easing: Easing.out(Easing.cubic),

          useNativeDriver: true,
        }),

        Animated.timing(loadingTranslateY, {
          toValue: 0,

          duration: 350,

          easing: Easing.out(Easing.cubic),

          useNativeDriver: true,
        }),

        Animated.timing(footerOpacity, {
          toValue: 1,

          duration: 400,

          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  // ========================================
  // SMARTFINE SPLASH
  // ========================================

  useEffect(() => {
    if (!fontsLoaded || isLoading || fontError || splashStartedRef.current) {
      return;
    }

    splashStartedRef.current = true;

    // ======================================
    // HIDE NATIVE EXPO SPLASH
    // ======================================

    SplashScreen.hideAsync().catch(() => {});

    // ======================================
    // BEGIN ENTRANCE ANIMATION
    // ======================================

    startSplashAnimation();

    // ======================================
    // START PROGRESS
    // ======================================

    const startedAt = Date.now();

    setProgress(0);

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startedAt;

      const percentage = Math.min(
        100,
        Math.round((elapsed / CUSTOM_SPLASH_DURATION) * 100),
      );

      setProgress(percentage);

      if (percentage >= 100) {
        clearInterval(progressTimer);
      }
    }, 30);

    // ======================================
    // FINISH AFTER 3 SECONDS
    // ======================================

    const finishTimer = setTimeout(() => {
      setProgress(100);

      Animated.timing(splashOpacity, {
        toValue: 0,

        duration: SPLASH_EXIT_DURATION,

        easing: Easing.inOut(Easing.cubic),

        useNativeDriver: true,
      }).start(() => {
        setShowAppSplash(false);
      });
    }, CUSTOM_SPLASH_DURATION);

    // ======================================
    // CLEANUP
    // ======================================

    return () => {
      clearInterval(progressTimer);

      clearTimeout(finishTimer);
    };
  }, [fontsLoaded, isLoading, fontError]);

  // ========================================
  // FONT ERROR SCREEN
  // ========================================

  if (fontError) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorTitle}>SmartFine</Text>

        <Text style={styles.errorMessage}>
          Unable to load fonts. Please restart SmartFine.
        </Text>
      </View>
    );
  }

  // ========================================
  // KEEP NATIVE SPLASH WHILE APP LOADS
  // ========================================

  if (!fontsLoaded || isLoading) {
    return null;
  }

  // ========================================
  // CUSTOM SMARTFINE SPLASH
  // ========================================

  if (showAppSplash) {
    return (
      <Animated.View
        style={[
          styles.splashScreen,
          {
            opacity: splashOpacity,
          },
        ]}
      >
        <StatusBar style="light" />

        <View style={styles.splashContent}>
          {/* =================================
              SMARTFINE LOGO
          ================================= */}

          <Animated.View
            style={{
              opacity: logoOpacity,

              transform: [
                {
                  scale: logoScale,
                },

                {
                  translateY: logoTranslateY,
                },
              ],
            }}
          >
            <Image
              source={require("../assets/branding/smartfineNoBG.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* =================================
              DESCRIPTION
          ================================= */}

          <Animated.View
            style={[
              styles.subtitleContainer,
              {
                opacity: subtitleOpacity,

                transform: [
                  {
                    translateY: subtitleTranslateY,
                  },
                ],
              },
            ]}
          >
            <Text style={styles.subtitle}>
              Student Fines Monitoring and Management System
            </Text>
          </Animated.View>

          {/* =================================
              LOADING AREA
          ================================= */}

          <Animated.View
            style={[
              styles.loadingArea,
              {
                opacity: loadingOpacity,

                transform: [
                  {
                    translateY: loadingTranslateY,
                  },
                ],
              },
            ]}
          >
            {/* PROGRESS BAR */}

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>

            {/* PROGRESS INFORMATION */}

            <View style={styles.progressInfo}>
              <View style={styles.loadingTextArea}>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                  style={styles.loadingSpinner}
                />

                <Text style={styles.loadingText}>Loading SmartFine...</Text>
              </View>

              <Text style={styles.percentageText}>{progress}%</Text>
            </View>
          </Animated.View>
        </View>

        {/* =================================
            FOOTER
        ================================= */}

        <Animated.Text
          style={[
            styles.footerText,
            {
              opacity: footerOpacity,
            },
          ]}
        >
          SmartFine
        </Animated.Text>
      </Animated.View>
    );
  }

  // ========================================
  // MAIN APP
  //
  // Only screen transitions are set here;
  // content animations live in each module.
  // ========================================

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={({ route }) => ({
          headerShown: false,

          animation: slidesIn(route.name) ? "slide_from_right" : "fade",
        })}
      />

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

// ==========================================
// SCREEN TRANSITIONS
// ==========================================

// Detail, add, and edit screens slide in over the list they came from.
// Everything else (tabs, sidebar modules, login) cross-fades, so switching
// sections feels like changing tabs rather than opening a new page.
function slidesIn(routeName: string) {
  return /\[|\/(add|edit)(\/|$)/.test(routeName);
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  // ======================================
  // SPLASH
  // ======================================

  splashScreen: {
    flex: 1,

    backgroundColor: "#173A73",

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 32,
  },

  splashContent: {
    width: "100%",

    maxWidth: 420,

    alignItems: "center",

    justifyContent: "center",
  },

  // ======================================
  // LOGO
  // ======================================

  logo: {
    width: 250,

    height: 130,

    marginBottom: 24,
  },

  // ======================================
  // SUBTITLE
  // ======================================

  subtitleContainer: {
    width: "100%",

    alignItems: "center",
  },

  subtitle: {
    maxWidth: 320,

    color: "#FFFFFF",

    fontFamily: "Poppins_400Regular",

    fontSize: 15,

    lineHeight: 23,

    textAlign: "center",

    opacity: 0.9,
  },

  // ======================================
  // LOADING AREA
  // ======================================

  loadingArea: {
    width: "100%",

    maxWidth: 320,

    marginTop: 48,
  },

  // ======================================
  // PROGRESS TRACK
  // ======================================

  progressTrack: {
    width: "100%",

    height: 9,

    backgroundColor: "rgba(255,255,255,0.22)",

    borderRadius: 20,

    overflow: "hidden",
  },

  // ======================================
  // PROGRESS FILL
  // ======================================

  progressFill: {
    height: "100%",

    backgroundColor: "#16E564",

    borderRadius: 20,
  },

  // ======================================
  // PROGRESS INFO
  // ======================================

  progressInfo: {
    width: "100%",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginTop: 12,
  },

  loadingTextArea: {
    flexDirection: "row",

    alignItems: "center",
  },

  loadingSpinner: {
    marginRight: 8,

    transform: [
      {
        scale: 0.8,
      },
    ],
  },

  loadingText: {
    color: "#FFFFFF",

    fontFamily: "Poppins_300Light",

    fontSize: 12,

    opacity: 0.82,
  },

  percentageText: {
    color: "#FFFFFF",

    fontFamily: "Poppins_600SemiBold",

    fontSize: 12,
  },

  // ======================================
  // FOOTER
  // ======================================

  footerText: {
    position: "absolute",

    bottom: 38,

    color: "#FFFFFF",

    fontFamily: "Poppins_300Light",

    fontSize: 11,
  },

  // ======================================
  // ERROR
  // ======================================

  errorScreen: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    padding: 24,

    backgroundColor: "#E8E8E8",
  },

  errorTitle: {
    color: "#173A73",

    fontFamily: "Poppins_700Bold",

    fontSize: 26,

    marginBottom: 10,
  },

  errorMessage: {
    color: "#123266",

    fontFamily: "Poppins_400Regular",

    fontSize: 14,

    lineHeight: 22,

    textAlign: "center",
  },
});
