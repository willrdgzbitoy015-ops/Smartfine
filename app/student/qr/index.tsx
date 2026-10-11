import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "expo-router";
import { useGuardedRouter } from "@/hooks/use-guarded-router";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import AppIcon, { IconName } from "@/components/AppIcon";
import { FadeIn, PopIn, TabIndicator } from "@/components/motion";
import { Skeleton, SkeletonGroup } from "@/components/skeleton";
import { API_BASE } from "@/constants/api";
import { haptics } from "@/utils/haptics";
import { styles } from "../styles/student-qr.styles";
import { HomeTabBadge } from "@/components/notification-badge";

type StudentQRData = {
  student: {
    id: number;
    studentId: string;
    fullName: string;
    gradeLevel: string;
    section: string;
  };
  qrValue: string;
};

type QRExportRef = {
  toDataURL: (callback: (value: string) => void) => void;
};

const navigation: { label: string; icon: IconName }[] = [
  {
    label: "Home",
    icon: "dashboard",
  },
  {
    label: "Fines",
    icon: "fines",
  },
  {
    label: "My QR",
    icon: "qr",
  },
  {
    label: "Profile",
    icon: "profile",
  },
];

export default function StudentQRScreen() {
  const router = useGuardedRouter();
  const { width } = useWindowDimensions();

  const [data, setData] = useState<StudentQRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");

  const qrRef = useRef<QRExportRef | null>(null);
  const qrContainerRef = useRef<View | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const savingRef = useRef(false);

  const qrSize = Math.max(100, Math.min(240, width - 136));

  const loadQR = useCallback(async () => {
    requestRef.current?.abort();

    const controller = new AbortController();
    requestRef.current = controller;

    // The current QR stays on screen while it refreshes.
    setLoading(true);
    setError("");
    setSaveError("");
    setNotice("");

    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    try {
      const token = await AsyncStorage.getItem("token");
      if (controller.signal.aborted) return;

      if (!token) {
        throw new Error("Please log in again to view your QR code.");
      }

      const response = await fetch(`${API_BASE}/api/student-qr/me`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        signal: controller.signal,
      });

      const body = await response.json();

      if (!response.ok || !body?.success) {
        throw new Error(
          response.status === 401
            ? "Your session has expired. Please log in again."
            : response.status === 403
              ? "An active Student account is required."
              : "Unable to load your QR code. Please try again.",
        );
      }

      if (
        typeof body.student?.studentId !== "string" ||
        !body.student.studentId.trim() ||
        typeof body.student?.fullName !== "string" ||
        body.qrValue !== `SMARTFINE_STUDENT:${body.student.studentId}`
      ) {
        throw new Error(
          "Your QR information is incomplete. Please contact the administrator.",
        );
      }

      if (requestRef.current !== controller) return;

      setData({
        student: body.student,
        qrValue: body.qrValue,
      });
    } catch (caught) {
      if (requestRef.current !== controller) return;
      if (controller.signal.aborted && !timedOut) return;

      // A failed refresh never leaves an old QR code available.
      setData(null);
      setError(
        timedOut
          ? "The server took too long to respond. Please try again."
          : caught instanceof Error &&
              !(caught instanceof TypeError) &&
              !(caught instanceof SyntaxError)
            ? caught.message
            : "Could not connect to the SmartFine server. Please try again.",
      );
    } finally {
      clearTimeout(timeout);

      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadQR();

      return () => {
        requestRef.current?.abort();
        requestRef.current = null;
      };
    }, [loadQR]),
  );

  const exportNativePNG = () =>
    new Promise<string>((resolve, reject) => {
      const svg = qrRef.current;

      if (!svg) {
        reject(new Error("QR image is not ready."));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("QR export timed out."));
      }, 10000);

      try {
        svg.toDataURL((value) => {
          clearTimeout(timeout);

          const base64 = value.replace(/^data:image\/png;base64,/, "");

          if (!base64) {
            reject(new Error("QR export was empty."));
            return;
          }

          resolve(base64);
        });
      } catch (caught) {
        clearTimeout(timeout);
        reject(caught);
      }
    });

  const downloadWebPNG = async (filename: string) => {
    // React Native Web renders the View as an HTML element.
    const container = qrContainerRef.current as unknown as HTMLElement | null;
    const svg = container?.querySelector("svg");

    if (!svg) {
      throw new Error("QR image is not ready.");
    }

    const copy = svg.cloneNode(true) as SVGElement;
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const source = new XMLSerializer().serializeToString(copy);
    const blob = new Blob([source], {
      type: "image/svg+xml;charset=utf-8",
    });
    const objectURL = URL.createObjectURL(blob);

    try {
      const image = new window.Image();

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Unable to export QR."));
        image.src = objectURL;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Image export is unavailable.");
      }

      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, 1024, 1024);
      context.drawImage(image, 0, 0, 1024, 1024);

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      URL.revokeObjectURL(objectURL);
    }
  };

  const downloadQR = async () => {
    if (!data || loading || savingRef.current) return;

    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    setNotice("");

    const safeId =
      data.student.studentId.replace(/[^a-zA-Z0-9_-]/g, "_") || "student";
    const filename = `SmartFine-QR-${safeId}.png`;

    try {
      if (Platform.OS === "web") {
        await downloadWebPNG(filename);
        setNotice("Download requested. Check your browser’s downloads.");
        return;
      }

      const base64 = await exportNativePNG();

      if (Platform.OS === "android") {
        const permission =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permission.granted) {
          setNotice("Download cancelled. No file was saved.");
          return;
        }

        const destination =
          await FileSystem.StorageAccessFramework.createFileAsync(
            permission.directoryUri,
            filename,
            "image/png",
          );

        await FileSystem.writeAsStringAsync(destination, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        haptics.success();
        setNotice("Your QR code was saved to the selected folder.");
        return;
      }

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Sharing is unavailable.");
      }

      if (!FileSystem.cacheDirectory) {
        throw new Error("Temporary storage is unavailable.");
      }

      const uri = `${FileSystem.cacheDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: "Save your SmartFine QR code",
      });

      setNotice("Use Save Image or Save to Files in the save/share menu.");
    } catch (caught) {
      console.error("Student QR download failed:", caught);
      haptics.error();
      setSaveError("Unable to save your QR code. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const gradeSection = data
    ? [data.student.gradeLevel, data.student.section]
        .filter(Boolean)
        .join(" - ")
    : "";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <View style={styles.phone}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/student/dashboard")}
            accessibilityRole="button"
            accessibilityLabel="Return to Home"
          >
            <AppIcon name="back" size={23} color="#123266" />
          </TouchableOpacity>

          <Text style={styles.title}>My QR Code</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            Your SmartFine student identification
          </Text>

          {loading && !data ? (
            // Placeholder in the shape of the QR card.
            <SkeletonGroup label="Loading your QR code" style={styles.qrCard}>
              <Skeleton width={130} height={18} />
              <Skeleton width={110} height={10} style={styles.skeletonGap} />
              <Skeleton
                width={qrSize + 48}
                height={qrSize + 48}
                radius={12}
                style={styles.qrSkeleton}
              />
              <View style={styles.studentInformation}>
                <Skeleton width="60%" height={18} />
                <Skeleton width="45%" height={12} style={styles.skeletonGap} />
                <Skeleton
                  width={170}
                  height={28}
                  radius={14}
                  style={styles.skeletonGap}
                />
              </View>
            </SkeletonGroup>
          ) : error ? (
            <View style={styles.stateCard}>
              <Text style={styles.errorTitle}>QR code unavailable</Text>
              <Text style={styles.errorText} accessibilityRole="alert">
                {error}
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => void loadQR()}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : data ? (
            <>
              {/* The ID card pops in once the code is ready. */}
              <PopIn style={styles.qrCard} from={0.95}>
                <Text style={styles.cardBrand}>SMARTFINE</Text>
                <Text style={styles.cardLabel}>STUDENT QR CODE</Text>

                <View
                  ref={qrContainerRef}
                  collapsable={false}
                  style={styles.qrContainer}
                >
                  <QRCode
                    value={data.qrValue}
                    size={qrSize}
                    color="#111111"
                    backgroundColor="#FFFFFF"
                    quietZone={24}
                    ecl="M"
                    getRef={(ref) => {
                      qrRef.current = ref;
                    }}
                  />
                </View>

                <View style={styles.studentInformation}>
                  <Text style={styles.studentName}>
                    {data.student.fullName}
                  </Text>
                  <Text style={styles.studentClass}>
                    {gradeSection || "Grade and section not assigned"}
                  </Text>

                  <View style={styles.idBadge}>
                    <Text style={styles.idText}>
                      Student ID: {data.student.studentId}
                    </Text>
                  </View>
                </View>
              </PopIn>

              <FadeIn delay={120}>
                <Text style={styles.instruction}>
                  Show this QR code to a Fines Officer for quick scanning.
                </Text>
              </FadeIn>

              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.disabled]}
                onPress={() => void downloadQR()}
                disabled={saving}
                accessibilityRole="button"
                accessibilityState={{ busy: saving, disabled: saving }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Download QR Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, saving && styles.disabled]}
                onPress={() => void loadQR()}
                disabled={saving}
                accessibilityRole="button"
              >
                <Text style={styles.secondaryButtonText}>Refresh</Text>
              </TouchableOpacity>

              <Text style={styles.downloadHint}>
                {Platform.OS === "android"
                  ? "Choose a folder to save your QR image."
                  : Platform.OS === "web"
                    ? "Download a PNG copy for offline use."
                    : "Save or share a PNG copy using your device’s menu."}
              </Text>
            </>
          ) : null}

          {!!saveError && (
            <Text style={styles.errorText} accessibilityRole="alert">
              {saveError}
            </Text>
          )}

          {!!notice && (
            <Text style={styles.notice} accessibilityLiveRegion="polite">
              {notice}
            </Text>
          )}
        </ScrollView>

        <SafeAreaView style={styles.bottomArea} edges={["bottom"]}>
          <View style={styles.bottomNavigation}>
            {navigation.map((item) => {
              const active = item.label === "My QR";

              return (
                <TouchableOpacity
                  key={item.label}
                  style={styles.navItem}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    if (item.label === "Home") {
                      router.replace("/student/dashboard");
                    } else if (item.label === "Fines") {
                      router.replace("/student/fines");
                    } else if (item.label === "Profile") {
                      router.push("/student/profile");
                    }
                  }}
                >
                  <AppIcon
                    name={item.icon}
                    focused={active}
                    size={28}
                    color="#FFFFFF"
                  />
                  <Text style={styles.navLabel}>{item.label}</Text>
                  <HomeTabBadge label={item.label} />
                  <TabIndicator
                    active={active}
                    style={styles.indicator}
                    hiddenStyle={styles.hiddenIndicator}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
}
