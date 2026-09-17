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

import { Image, StyleSheet, Text, View } from "react-native";

import { useEffect, useRef, useState } from "react";

import "react-native-reanimated";

import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";

// ==========================================
// KEEP NATIVE SPLASH VISIBLE
// ==========================================

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if splash is already controlled
  // by the current development environment.
});

// ==========================================
// SPLASH DURATION
// ==========================================

const CUSTOM_SPLASH_DURATION = 3000;

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
  // SMARTFINE 3-SECOND SPLASH
  // ========================================

  useEffect(() => {
    // Wait until application resources
    // are ready before showing the custom
    // SmartFine splash.

    if (!fontsLoaded || isLoading || fontError || splashStartedRef.current) {
      return;
    }

    splashStartedRef.current = true;

    // ======================================
    // HIDE NATIVE EXPO SPLASH
    // ======================================

    SplashScreen.hideAsync().catch(() => {});

    // ======================================
    // START CUSTOM PROGRESS
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

      setShowAppSplash(false);
    }, CUSTOM_SPLASH_DURATION);

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
      <View style={styles.splashScreen}>
        <StatusBar style="light" />

        <View style={styles.splashContent}>
          {/* =================================
              SMARTFINE LOGO
          ================================= */}

          <Image
            source={require("../assets/branding/smartfineNoBG.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* =================================
              DESCRIPTION
          ================================= */}

          <Text style={styles.subtitle}>
            Student Fines Monitoring and Management System
          </Text>

          {/* =================================
              PROGRESS BAR
          ================================= */}

          <View style={styles.loadingArea}>
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

            {/* =================================
                PROGRESS INFORMATION
            ================================= */}

            <View style={styles.progressInfo}>
              <Text style={styles.loadingText}>Loading SmartFine...</Text>

              <Text style={styles.percentageText}>{progress}%</Text>
            </View>
          </View>
        </View>

        {/* =================================
            FOOTER
        ================================= */}

        <Text style={styles.footerText}>SmartFine</Text>
      </View>
    );
  }

  // ========================================
  // MAIN APP
  // ========================================

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />

      <StatusBar style="auto" />
    </ThemeProvider>
  );
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

    marginTop: 10,
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

    opacity: 0.5,
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
