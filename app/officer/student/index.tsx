import { useCallback, useEffect, useRef, useState } from "react";

import {
    Animated,
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

import { type Href, useFocusEffect } from "expo-router";
import { useGuardedRouter } from "@/hooks/use-guarded-router";

import { StatusBar } from "expo-status-bar";

import { SafeAreaView } from "react-native-safe-area-context";

import QRCode from "react-native-qrcode-svg";

import { FadeIn, PopIn, useSwitchFade } from "@/components/motion";
import { Pagination } from "@/components/pagination";
import { SkeletonList } from "@/components/skeleton";
import { API_BASE } from "@/constants/api";
import { usePagination } from "@/hooks/use-pagination";

import { useResponsiveStyles } from "./student.styles";

import { FloatingTabBar } from "@/components/floating-tab-bar";
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
    route: "/officer/profile",
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

// "Grade 7" ... "Grade 12" in number order, anything else after them.
function gradeRank(grade: string) {
  const number = Number(/\d+/.exec(grade)?.[0]);

  return Number.isFinite(number) ? number : 999;
}

function byGrade(a: string, b: string) {
  return gradeRank(a) - gradeRank(b) || a.localeCompare(b);
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
  const styles = useResponsiveStyles();
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
  const styles = useResponsiveStyles();
  const router = useGuardedRouter();
  const { width } = useWindowDimensions();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showQr, setShowQr] = useState(false);

  const requestRef = useRef<AbortController | null>(null);
  const listRef = useRef<FlatList<Student> | null>(null);

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

  // Grade and section pills come from the students themselves.
  const grades = Array.from(
    new Set(students.map((student) => (student.grade_level || "").trim()).filter(Boolean)),
  ).sort(byGrade);

  const sections = gradeFilter
    ? Array.from(
        new Set(
          students
            .filter((student) => (student.grade_level || "").trim() === gradeFilter)
            .map((student) => (student.section || "").trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b))
    : [];

  const filteredStudents = students.filter((student) => {
    if (gradeFilter && (student.grade_level || "").trim() !== gradeFilter) return false;

    if (sectionFilter && (student.section || "").trim() !== sectionFilter) return false;

    return (
      fullName(student).toLowerCase().includes(query) ||
      String(student.student_id || "")
        .toLowerCase()
        .includes(query)
    );
  });

  const filtering = Boolean(query || gradeFilter || sectionFilter);

  // Ten students a page, so a list of hundreds stays easy to move through.
  const pager = usePagination(filteredStudents, `${query}|${gradeFilter}|${sectionFilter}`);

  // A new page starts at the top of the list.
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [pager.page]);

  const chooseGrade = (grade: string) => {
    setGradeFilter((current) => (current === grade ? "" : grade));
    setSectionFilter("");
  };

  const clearFilters = () => {
    setSearch("");
    setGradeFilter("");
    setSectionFilter("");
  };

  const canAddFine =
    selectedStudent !== null &&
    String(selectedStudent.account_status).toUpperCase() === "ACTIVE";

  const returnToList = () => {
    setShowQr(false);
    setSelectedId(null);
  };

  // The list and a student's profile fade in when switching between them.
  const viewFade = useSwitchFade(selectedId);

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
          <Animated.ScrollView
            style={[styles.scroll, viewFade]}
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
          </Animated.ScrollView>
        ) : (
          // ==================================
          // STUDENT LIST
          // ==================================
          <Animated.View style={[styles.listScreen, viewFade]}>
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle} accessibilityRole="header">
                Students
              </Text>

              <Text style={styles.pageSubtitle}>
                Select a student to view their profile or add a fine.
              </Text>
            </View>

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

            {students.length > 0 && (
              <View style={styles.filterArea}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                  keyboardShouldPersistTaps="handled"
                >
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Show all grades"
                    accessibilityState={{ selected: gradeFilter === "" }}
                    style={[styles.chip, gradeFilter === "" && styles.chipActive]}
                    onPress={() => chooseGrade(gradeFilter)}
                  >
                    <Text style={[styles.chipText, gradeFilter === "" && styles.chipTextActive]}>
                      All grades
                    </Text>
                  </TouchableOpacity>

                  {grades.map((grade) => (
                    <TouchableOpacity
                      key={grade}
                      accessibilityRole="button"
                      accessibilityLabel={`Show ${grade}`}
                      accessibilityState={{ selected: gradeFilter === grade }}
                      style={[styles.chip, gradeFilter === grade && styles.chipActive]}
                      onPress={() => chooseGrade(grade)}
                    >
                      <Text style={[styles.chipText, gradeFilter === grade && styles.chipTextActive]}>
                        {grade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {sections.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                    keyboardShouldPersistTaps="handled"
                  >
                    {sections.map((section) => (
                      <TouchableOpacity
                        key={section}
                        accessibilityRole="button"
                        accessibilityLabel={`Show section ${section}`}
                        accessibilityState={{ selected: sectionFilter === section }}
                        style={[
                          styles.chip,
                          styles.chipSection,
                          sectionFilter === section && styles.chipActive,
                        ]}
                        onPress={() => setSectionFilter((current) => (current === section ? "" : section))}
                      >
                        <Text
                          style={[styles.chipText, sectionFilter === section && styles.chipTextActive]}
                        >
                          {section}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryText}>
                    {filtering
                      ? `${filteredStudents.length} of ${students.length} students`
                      : `${students.length} students`}
                  </Text>

                  {filtering && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Clear search and filters"
                      style={styles.clearFilters}
                      onPress={clearFilters}
                    >
                      <Text style={styles.clearFiltersText}>Clear filters</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <FlatList
              ref={listRef}
              data={pager.pageItems}
              keyExtractor={(student) => String(student.id)}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              refreshing={refreshing}
              onRefresh={() => void loadStudents(true)}
              renderItem={({ item, index }) => (
                <FadeIn index={index}>
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

                      <Text style={styles.studentMeta}>
                        {gradeSection(item)}
                      </Text>

                      <Text style={styles.studentMeta}>
                        Student ID: {item.student_id || "Unavailable"}
                      </Text>

                      {String(item.account_status).toUpperCase() !== "ACTIVE" && (
                        <Text style={styles.inactiveTag}>Inactive</Text>
                      )}
                    </View>

                    <View style={styles.chevron} />
                  </TouchableOpacity>
                </FadeIn>
              )}
              ListEmptyComponent={
                loading ? (
                  // Placeholder rows in the shape of the student cards.
                  <SkeletonList
                    label="Loading students"
                    count={5}
                    itemStyle={styles.studentCard}
                  />
                ) : (
                  <View style={styles.emptyPanel}>
                    {!error ? (
                      <>
                        <Text style={styles.emptyTitle}>
                          {filtering ? "No matching students" : "No students yet"}
                        </Text>

                        <Text style={styles.helperText}>
                          {filtering
                            ? "Try a different name, student ID, grade or section."
                            : "Registered students will appear here."}
                        </Text>
                      </>
                    ) : null}
                  </View>
                )
              }
              ListFooterComponent={
                <View style={styles.pagerArea}>
                  <Pagination pager={pager} noun="students" />
                </View>
              }
            />
          </Animated.View>
        )}

        {/* ==================================
            BOTTOM NAVIGATION
        ================================== */}

        <FloatingTabBar
          items={NAV_ITEMS}
          active="Students"
          onSelect={(item) => {
            if (item.label === "Students") {
              returnToList();
            } else if (item.route) {
              router.replace(item.route as Href);
            }
          }}
        />

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
            <PopIn style={styles.modalCard}>
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
            </PopIn>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
