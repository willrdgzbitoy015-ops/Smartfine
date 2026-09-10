import { useCallback, useEffect, useRef, useState } from "react";

import {
    ActivityIndicator,
    BackHandler,
    FlatList,
    Image,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { type Href, useFocusEffect, useRouter } from "expo-router";

import { StatusBar } from "expo-status-bar";

import { SafeAreaView } from "react-native-safe-area-context";

import QRCode from "react-native-qrcode-svg";

import { API_BASE } from "@/constants/api";

import { styles } from "./student.styles";

// ==========================================
// TYPES
// ==========================================

type Student = {
  id: number;
  student_id: string;
  full_name: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  grade_level: string | null;
  section: string | null;
  account_status: string;
  profile_picture_uri: string | null;
};

const NAV_ITEMS = [
  {
    label: "Home",
    route: "/officer/dashboard",
    icon: require("../../../assets/icons/dashboard.png"),
  },
  {
    label: "Students",
    route: "/officer/student",
    icon: require("../../../assets/icons/students.png"),
  },
  {
    label: "Scan",
    route: "/officer/qr-scanner",
    icon: require("../../../assets/icons/qr-codeWhite.png"),
  },
  {
    label: "Profile",
    route: null,
    icon: require("../../../assets/icons/user.png"),
  },
  {
    label: "Records",
    route: "/officer/records",
    icon: require("../../../assets/icons/reports.png"),
  },
];

// Matches the QR format used by your scanner.
const QR_PREFIX = "SMARTFINE_STUDENT:";

// ==========================================
// HELPERS
// ==========================================

function fullName(student: Student) {
  return (
    student.full_name ||
    [student.first_name, student.middle_name, student.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Student"
  );
}

function gradeSection(student: Student) {
  return (
    [student.grade_level, student.section].filter(Boolean).join(" - ") ||
    "Grade and section unavailable"
  );
}

function pictureUrl(value: string | null) {
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${API_BASE.replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
}

function nameInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "?"
  );
}

// ==========================================
// STUDENT PHOTO
// ==========================================

function StudentPhoto({
  student,
  large = false,
}: {
  student: Student;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  const uri = pictureUrl(student.profile_picture_uri);
  const name = fullName(student);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  return (
    <View style={[styles.avatar, large && styles.avatarLarge]}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={styles.avatarImage}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityLabel={`${name} profile picture`}
        />
      ) : (
        <Text style={[styles.initials, large && styles.initialsLarge]}>
          {nameInitials(name)}
        </Text>
      )}
    </View>
  );
}

// ==========================================
// STUDENTS SCREEN
// ==========================================

export default function OfficerStudentsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showQr, setShowQr] = useState(false);

  const requestRef = useRef<AbortController | null>(null);

  const selectedStudent =
    students.find((student) => student.id === selectedId) || null;

  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  const qrSize = Math.min(220, Math.max(120, width - 112));

  // ========================================
  // LOAD STUDENTS
  // ========================================

  const loadStudents = useCallback(async (refresh = false) => {
    requestRef.current?.abort();

    const controller = new AbortController();
    requestRef.current = controller;

    setLoading(!refresh);
    setRefreshing(refresh);
    setError("");

    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    try {
      const token = await AsyncStorage.getItem("token");

      if (controller.signal.aborted) return;

      if (!token) {
        setStudents([]);
        setSelectedId(null);
        setShowQr(false);

        throw new Error("Please sign in again to view students.");
      }

      const response = await fetch(`${API_BASE}/api/students`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        signal: controller.signal,
      });

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "The server returned an unexpected response. Check your API connection.",
        );
      }

      if (controller.signal.aborted) return;

      if (response.status === 401 || response.status === 403) {
        setStudents([]);
        setSelectedId(null);
        setShowQr(false);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load students.");
      }

      if (!Array.isArray(data.students)) {
        throw new Error("The server did not return a valid student list.");
      }

      const nextStudents = data.students as Student[];

      setStudents(nextStudents);

      setSelectedId((current) =>
        current !== null &&
        !nextStudents.some((student) => student.id === current)
          ? null
          : current,
      );
    } catch (caught) {
      if (requestRef.current !== controller) return;

      if (controller.signal.aborted && !timedOut) return;

      setError(
        timedOut
          ? "The server took too long to respond. Please try again."
          : caught instanceof Error
            ? caught.message
            : "Could not load students.",
      );
    } finally {
      clearTimeout(timeout);

      if (requestRef.current === controller) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Refresh after returning from Add Fine.
  useFocusEffect(
    useCallback(() => {
      void loadStudents();

      return () => {
        requestRef.current?.abort();
        requestRef.current = null;
      };
    }, [loadStudents]),
  );

  // Android Back returns from the profile to the list.
  // The QR modal handles its own Back action.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (selectedRef.current !== null) {
            setShowQr(false);
            setSelectedId(null);
            return true;
          }

          return false;
        },
      );

      return () => subscription.remove();
    }, []),
  );

  const query = search.trim().toLowerCase();

  const filteredStudents = students.filter((student) => {
    return (
      fullName(student).toLowerCase().includes(query) ||
      String(student.student_id || "")
        .toLowerCase()
        .includes(query)
    );
  });

  const canAddFine =
    selectedStudent !== null &&
    String(selectedStudent.account_status).toUpperCase() === "ACTIVE";

  const returnToList = () => {
    setShowQr(false);
    setSelectedId(null);
  };

  const addFine = () => {
    if (!selectedStudent || !canAddFine) return;

    router.push({
      pathname: "/officer/fines/add",
      params: {
        studentId: String(selectedStudent.id),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      <View style={styles.phone}>
        {!!error && (
          <View style={styles.errorPanel}>
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              accessibilityRole="button"
              style={styles.retryButton}
              onPress={() => void loadStudents()}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedStudent ? (
          // ==================================
          // STUDENT PROFILE
          // ==================================
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.profileContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Back to students"
              style={styles.backButton}
              onPress={returnToList}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <View style={styles.profileCard}>
              <StudentPhoto student={selectedStudent} large />

              <Text style={styles.profileName}>
                {fullName(selectedStudent)}
              </Text>

              <Text style={styles.profileSummary}>
                {gradeSection(selectedStudent)}
                {" - Student ID: "}
                {selectedStudent.student_id || "Unavailable"}
              </Text>
            </View>

            <View style={styles.profileFields}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Grade and Section:</Text>
                <Text style={styles.infoValue}>
                  {gradeSection(selectedStudent)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Student ID:</Text>
                <Text style={styles.infoValue}>
                  {selectedStudent.student_id || "Unavailable"}
                </Text>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                style={[
                  styles.qrButton,
                  !selectedStudent.student_id && styles.disabled,
                ]}
                disabled={!selectedStudent.student_id}
                onPress={() => setShowQr(true)}
              >
                <Image
                  source={require("../../../assets/icons/qr-code.png")}
                  style={styles.qrIcon}
                  resizeMode="contain"
                />

                <Text style={styles.qrButtonText}>View QR Code</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.addFineArea}>
              {!canAddFine && (
                <Text style={styles.inactiveText}>
                  This student account is inactive. A new fine cannot be added.
                </Text>
              )}

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ disabled: !canAddFine }}
                disabled={!canAddFine}
                onPress={addFine}
                style={[styles.addFineButton, !canAddFine && styles.disabled]}
              >
                <Text style={styles.addFineText}>Add Fine</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          // ==================================
          // STUDENT LIST
          // ==================================
          <View style={styles.listScreen}>
            <View style={styles.searchArea}>
              <View style={styles.searchBox}>
                <View style={styles.searchIcon}>
                  <View style={styles.searchCircle} />
                  <View style={styles.searchHandle} />
                </View>

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  style={styles.searchInput}
                  placeholder="Search student by name or ID"
                  placeholderTextColor="#666666"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  accessibilityLabel="Search student by name or ID"
                />

                {!!search && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    style={styles.clearButton}
                    onPress={() => setSearch("")}
                  >
                    <Text style={styles.clearText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <FlatList
              data={filteredStudents}
              keyExtractor={(student) => String(student.id)}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              refreshing={refreshing}
              onRefresh={() => void loadStudents(true)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`View ${fullName(item)}`}
                  activeOpacity={0.75}
                  style={styles.studentCard}
                  onPress={() => setSelectedId(item.id)}
                >
                  <StudentPhoto student={item} />

                  <View style={styles.studentDetails}>
                    <Text style={styles.studentName}>{fullName(item)}</Text>

                    <Text style={styles.studentMeta}>{gradeSection(item)}</Text>

                    <Text style={styles.studentMeta}>
                      Student ID: {item.student_id || "Unavailable"}
                    </Text>
                  </View>

                  <View style={styles.chevron} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyPanel}>
                  {loading ? (
                    <>
                      <ActivityIndicator size="large" color="#123266" />
                      <Text style={styles.helperText}>Loading students…</Text>
                    </>
                  ) : !error ? (
                    <>
                      <Text style={styles.emptyTitle}>
                        {query ? "No matching students" : "No students yet"}
                      </Text>

                      <Text style={styles.helperText}>
                        {query
                          ? "Try a different name or student ID."
                          : "Registered students will appear here."}
                      </Text>
                    </>
                  ) : null}
                </View>
              }
            />
          </View>
        )}

        {/* ==================================
            BOTTOM NAVIGATION
        ================================== */}

        <SafeAreaView style={styles.bottomArea} edges={["bottom"]}>
          <View style={styles.bottomNavigation}>
            {NAV_ITEMS.map((item) => {
              const active = item.label === "Students";
              const disabled = item.route === null;

              return (
                <TouchableOpacity
                  key={item.label}
                  accessibilityRole="tab"
                  accessibilityLabel={
                    disabled ? `${item.label}, coming soon` : item.label
                  }
                  accessibilityState={{ selected: active, disabled }}
                  disabled={disabled}
                  style={styles.navItem}
                  onPress={() => {
                    if (active) {
                      returnToList();
                    } else if (item.route) {
                      router.replace(item.route as Href);
                    }
                  }}
                >
                  <Image
                    source={item.icon}
                    resizeMode="contain"
                    style={[styles.navIcon, disabled && styles.disabled]}
                  />

                  <Text style={[styles.navLabel, disabled && styles.disabled]}>
                    {item.label}
                  </Text>

                  <View
                    style={[
                      styles.activeIndicator,
                      !active && styles.hiddenIndicator,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>

        {/* ==================================
            QR MODAL
        ================================== */}

        <Modal
          visible={showQr && selectedStudent !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQr(false)}
        >
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ScrollView
                contentContainerStyle={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalTitle}>Student QR Code</Text>

                {selectedStudent && (
                  <>
                    <Text style={styles.modalName}>
                      {fullName(selectedStudent)}
                    </Text>

                    <View style={styles.qrContainer}>
                      <QRCode
                        value={`${QR_PREFIX}${selectedStudent.student_id}`}
                        size={qrSize}
                        color="#000000"
                        backgroundColor="#FFFFFF"
                      />
                    </View>

                    <Text style={styles.helperText}>
                      Student ID: {selectedStudent.student_id}
                    </Text>
                  </>
                )}

                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.modalCloseButton}
                  onPress={() => setShowQr(false)}
                >
                  <Text style={styles.addFineText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
