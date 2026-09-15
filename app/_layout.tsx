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

import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

import { useEffect, useState } from "react";

import "react-native-reanimated";

import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";

// ==========================================
// KEEP NATIVE SPLASH VISIBLE
// ==========================================

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if the splash is already controlled
  // by the current development environment.
});

// ==========================================
// ROOT LAYOUT
// ==========================================

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const { isLoading } = useAuth();

  const [showAppSplash, setShowAppSplash] = useState(true);

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
  // SMARTFINE SPLASH TIMER
  // ========================================

  useEffect(() => {
    if (!fontsLoaded || isLoading || fontError) {
      return;
    }

    // Hide the native splash.
    // Our React SmartFine loading screen
    // will immediately appear underneath.
    SplashScreen.hideAsync().catch(() => {});

    const timer = setTimeout(() => {
      setShowAppSplash(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
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
  // CUSTOM SMARTFINE LOADING SCREEN
  // ========================================

  if (showAppSplash) {
    return (
      <View style={styles.splashScreen}>
        <StatusBar style="light" />

        <View style={styles.splashContent}>
          <Image
            source={require("../assets/branding/smartfineNoBG.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.subtitle}>
            Student Fines Monitoring and Management System
          </Text>

          <View style={styles.loadingArea}>
            <ActivityIndicator size="small" color="#8ED000" />

            <Text style={styles.loadingText}>Loading SmartFine...</Text>
          </View>
        </View>

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

  logo: {
    width: 250,

    height: 130,

    marginBottom: 24,
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

  loadingArea: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    marginTop: 38,

    gap: 12,
  },

  loadingText: {
    color: "#FFFFFF",

    fontFamily: "Poppins_300Light",

    fontSize: 13,

    opacity: 0.82,
  },

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
