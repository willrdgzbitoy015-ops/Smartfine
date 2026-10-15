import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useGuardedRouter } from "@/hooks/use-guarded-router";
import { StudentFormModal } from "@/components/admin-forms/student-form-modal";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { returnToLogin, useAuth } from "@/hooks/use-auth";

import DeleteModal from "@/components/deletationmodal";
import LogoutModal from "@/components/logout-modal";
import SuccessModal from "@/components/success-modal";
import WarningModal from "@/components/warningmodal";

import { API_BASE } from "@/constants/api";
import { FadeIn, PopIn } from "@/components/motion";
import { AdminNavBadge } from "@/components/notification-badge";
import { Pagination } from "@/components/pagination";
import { SkeletonList, SkeletonTable } from "@/components/skeleton";
import { SummaryCard, SummaryCardRow } from "@/components/summary-card";
import { usePagination } from "@/hooks/use-pagination";

import { styles } from "./students.styles";

// ==========================================
// TYPES
// ==========================================

type Student = {
  id: number;

  student_id: string;

  full_name: string;

  email: string | null;

  grade_level: string | null;

  section: string | null;

  account_status: string;

  total_fines: number;

  outstanding_balance: number;

  profile_picture_uri?: string | null;
};

type NavItem = {
  label: string;

  route: string;

  icon?: any;
};

type ImportStatus = "VALID" | "DUPLICATE" | "INVALID";

type ImportPreviewRow = {
  rowNumber: number;

  studentNumber: string;

  firstName: string;

  middleName: string;

  lastName: string;

  email: string;

  contactNumber: string;

  status: ImportStatus;

  issues: string[];
};

type ParsedImportStudent = {
  rowNumber: number;

  studentNumber: string;

  firstName: string;

  middleName?: string | null;

  lastName: string;

  email: string;

  contactNumber: string;
};

type ParsedImportClass = {
  gradeLevel: string;

  strand: string;

  section: string;

  databaseSection?: string;

  displayName?: string;
};

// ==========================================
// IMPORT OPTIONS
// ==========================================

const GRADE_OPTIONS = [
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

const STRAND_OPTIONS = ["STEM", "ABM", "TVL"];

// ==========================================
// GENERAL HELPERS
// ==========================================

function makeSafeFileName(value: string) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeContactNumber(value: string) {
  return String(value || "")
    .trim()
    .replace(/^'+/, "")
    .replace(/[\s()+-]/g, "");
}

function isScientificNotation(value: string) {
  return /^[+-]?(?:\d+\.?\d*|\.\d+)[eE][+-]?\d+$/.test(
    String(value || "").trim(),
  );
}

// ==========================================
// DIRECTORY HELPERS
// ==========================================

type StudentView =
  | "ALL"
  | "ACTIVE"
  | "INACTIVE"
  | "WITH_BALANCE"
  | "NO_BALANCE";

const VIEW_FILTERS: { key: StudentView; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "INACTIVE", label: "Inactive" },
  { key: "WITH_BALANCE", label: "With balance" },
  { key: "NO_BALANCE", label: "No balance" },
];

const VIEW_EMPTY_LABELS: Record<StudentView, string> = {
  ALL: "students",
  ACTIVE: "active students",
  INACTIVE: "inactive students",
  WITH_BALANCE: "students with a balance",
  NO_BALANCE: "students without a balance",
};

function isInactiveStudent(status: string) {
  const normalizedStatus = String(status || "").toUpperCase();

  return normalizedStatus === "INACTIVE" || normalizedStatus === "DEACTIVATED";
}

function getStatusLabel(status: string) {
  const normalizedStatus = String(status || "").toUpperCase();

  if (normalizedStatus === "ACTIVE") {
    return "Active";
  }

  if (isInactiveStudent(status)) {
    return "Inactive";
  }

  return status || "Unknown";
}

function studentBalance(student: Student) {
  return Number(student.outstanding_balance) || 0;
}

function matchesView(student: Student, view: StudentView) {
  switch (view) {
    case "ACTIVE":
      return String(student.account_status || "").toUpperCase() === "ACTIVE";
    case "INACTIVE":
      return isInactiveStudent(student.account_status);
    case "WITH_BALANCE":
      return studentBalance(student) > 0;
    case "NO_BALANCE":
      return studentBalance(student) <= 0;
    default:
      return true;
  }
}

function countViews(list: Student[]) {
  const counts: Record<StudentView, number> = {
    ALL: 0,
    ACTIVE: 0,
    INACTIVE: 0,
    WITH_BALANCE: 0,
    NO_BALANCE: 0,
  };

  for (const student of list) {
    for (const filter of VIEW_FILTERS) {
      if (matchesView(student, filter.key)) {
        counts[filter.key] += 1;
      }
    }
  }

  return counts;
}

function formatPeso(amount: number) {
  return `₱${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// "Grade 7" before "Grade 10".
function sortNatural(values: string[]) {
  return values.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
}

function formatClass(student: Student) {
  if (student.grade_level && student.section) {
    return `${student.grade_level} - ${student.section}`;
  }

  return student.grade_level || student.section || "";
}

function getInitials(fullName: string) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "ST";
  }

  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";

  return `${parts[0][0]}${last}`.toUpperCase();
}

function getProfilePictureUrl(uri: string | null | undefined) {
  if (!uri) {
    return null;
  }

  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }

  return `${API_BASE}${uri}`;
}

// Photo when the student has one, initials otherwise.
function StudentAvatar({ student }: { student: Student }) {
  const [failed, setFailed] = useState(false);

  const url = getProfilePictureUrl(student.profile_picture_uri);

  if (url && !failed) {
    return (
      <Image
        source={{ uri: url }}
        style={styles.avatar}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{getInitials(student.full_name)}</Text>
    </View>
  );
}

function StatusChip({ status }: { status: string }) {
  const tone =
    String(status || "").toUpperCase() === "ACTIVE"
      ? "Active"
      : isInactiveStudent(status)
        ? "Inactive"
        : "Other";

  return (
    <View style={[styles.statusChip, styles[`statusChip${tone}`]]}>
      <Text style={[styles.statusChipText, styles[`statusChipText${tone}`]]}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}

// ==========================================
// COMPONENT
// ==========================================

export default function StudentsDirectory() {
  const router = useGuardedRouter();

  // Add New Student is a pop-up. Links to /admin/students?add=1 (the
  // dashboard quick action, the old /admin/students/add route) open it too.
  const [showAddStudent, setShowAddStudent] = useState(false);

  const { add: addParam } = useLocalSearchParams<{ add?: string }>();

  useEffect(() => {
    if (addParam === "1") {
      setShowAddStudent(true);
      router.setParams({ add: undefined });
    }
  }, [addParam]);

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  // ========================================
  // LOGOUT
  // ========================================

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  // ========================================
  // DELETE
  // ========================================

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);

  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");

  // ========================================
  // WARNING
  // ========================================

  const [showWarningModal, setShowWarningModal] = useState(false);

  const [warningTitle, setWarningTitle] = useState("");

  const [warningMessage, setWarningMessage] = useState("");

  // ========================================
  // STUDENTS
  // ========================================

  const [students, setStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // Background reloads keep the list on screen.
  const [refreshing, setRefreshing] = useState(false);

  const [refreshError, setRefreshError] = useState("");

  const [focusVersion, setFocusVersion] = useState(0);

  // ========================================
  // SEARCH
  // ========================================

  const [search, setSearch] = useState("");

  // ========================================
  // EXPORT STUDENT ACCOUNTS
  // ========================================

  const [exportLoading, setExportLoading] = useState(false);

  // ========================================
  // FILTERS
  // ========================================

  const [selectedGrade, setSelectedGrade] = useState("ALL");

  const [selectedSection, setSelectedSection] = useState("ALL");

  const [selectedView, setSelectedView] = useState<StudentView>("ALL");

  const [showGradeMenu, setShowGradeMenu] = useState(false);

  const [showSectionMenu, setShowSectionMenu] = useState(false);

  // ========================================
  // MULTIPLE DELETE SELECTION
  // ========================================

  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  const [deleteLoading, setDeleteLoading] = useState(false);

  // ========================================
  // IMPORT
  // ========================================

  const [showImportModal, setShowImportModal] = useState(false);

  const [importGrade, setImportGrade] = useState("");

  const [importStrand, setImportStrand] = useState("");

  const [importSection, setImportSection] = useState("");

  const [showImportGradeMenu, setShowImportGradeMenu] = useState(false);

  const [showImportStrandMenu, setShowImportStrandMenu] = useState(false);

  const [importFileName, setImportFileName] = useState("");

  const [importReading, setImportReading] = useState(false);

  const [templateLoading, setTemplateLoading] = useState(false);

  const [importSubmitting, setImportSubmitting] = useState(false);

  const [importError, setImportError] = useState("");

  const [importPreviewRows, setImportPreviewRows] = useState<
    ImportPreviewRow[]
  >([]);

  // ========================================
  // IMPORT CONFIRMATION
  // ========================================

  const [showImportConfirmModal, setShowImportConfirmModal] = useState(false);

  // ========================================
  // IMPORT SUCCESS
  // ========================================

  const [showImportSuccessModal, setShowImportSuccessModal] = useState(false);

  const [importSuccessMessage, setImportSuccessMessage] = useState("");

  // ========================================
  // AUTO-HIDE IMPORT ERROR
  // ========================================

  useEffect(() => {
    if (!importError) {
      return;
    }

    const timer = setTimeout(() => {
      setImportError("");
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, [importError]);

  // ========================================
  // CLASS HELPERS
  // ========================================

  const isSeniorHigh = importGrade === "Grade 11" || importGrade === "Grade 12";

  const finalImportSection = isSeniorHigh
    ? `${importStrand} ${importSection.trim()}`.trim()
    : importSection.trim();

  const expectedClassName =
    importGrade && finalImportSection
      ? `${importGrade} - ${finalImportSection}`
      : "";

  // ========================================
  // IMPORT COUNTS
  // ========================================

  const validImportRows = useMemo(
    () => importPreviewRows.filter((row) => row.status === "VALID"),
    [importPreviewRows],
  );

  const duplicateImportRows = useMemo(
    () => importPreviewRows.filter((row) => row.status === "DUPLICATE"),
    [importPreviewRows],
  );

  const invalidImportRows = useMemo(
    () => importPreviewRows.filter((row) => row.status === "INVALID"),
    [importPreviewRows],
  );

  const importCanContinue =
    validImportRows.length > 0 &&
    duplicateImportRows.length === 0 &&
    invalidImportRows.length === 0 &&
    !importSubmitting;

  // ========================================
  // NAV ITEMS
  // ========================================

  const navItems: NavItem[] = [
    {
      label: "Dashboard",

      route: "/admin/dashboard",

      icon: require("../../../assets/icons/dashboard.png"),
    },

    {
      label: "Students",

      route: "/admin/students",

      icon: require("../../../assets/icons/students.png"),
    },

    {
      label: "Fines",

      route: "/admin/fines",

      icon: require("../../../assets/icons/fines.png"),
    },

    {
      label: "QR Scanner",

      route: "/admin/qr-scanner",

      icon: require("../../../assets/icons/qr-codeWhite.png"),
    },

    {
      label: "Reports",

      route: "/admin/reports",

      icon: require("../../../assets/icons/reports.png"),
    },

    {
      label: "Settings",

      route: "/admin/settings",

      icon: require("../../../assets/icons/settings.png"),
    },

    {
      label: "Officers",

      route: "/admin/officers",

      icon: require("../../../assets/icons/officers.png"),
    },
  ];

  // ========================================
  // LOAD STUDENTS
  // ========================================

  // silent: keep the current list visible while reloading.
  const loadStudents = async (silent = false) => {
    const fail = (message: string) => {
      if (silent) {
        setRefreshError(`${message} Showing the last loaded list.`);
      } else {
        setError(message);
      }
    };

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      setRefreshError("");

      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${API_BASE}/api/students`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        fail(data.message || "Failed to load students.");

        return;
      }

      setStudents(data.students || []);
    } catch (error) {
      console.error("Students connection error:", error);

      fail("Could not connect to the SmartFine server.");
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  };

  // Only a pull shows the pull-to-refresh spinner; focus reloads use the
  // small indicator beside the student count.
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const handlePullRefresh = async () => {
    setPullRefreshing(true);

    await loadStudents(true);

    setPullRefreshing(false);
  };

  // Reload whenever the screen regains focus (after Add or Edit Student).
  useFocusEffect(
    useCallback(() => {
      setFocusVersion((current) => current + 1);
    }, []),
  );

  useEffect(() => {
    if (focusVersion === 0) {
      return;
    }

    loadStudents(focusVersion > 1);
  }, [focusVersion]);

  // ========================================
  // FILTER OPTIONS
  // ========================================

  const gradeOptions = useMemo(() => {
    const grades = students
      .map((student) => student.grade_level)
      .filter((grade): grade is string => Boolean(grade));

    return sortNatural(Array.from(new Set(grades)));
  }, [students]);

  // Sections follow the selected grade.
  const sectionOptions = useMemo(() => {
    const sections = students
      .filter(
        (student) =>
          selectedGrade === "ALL" || student.grade_level === selectedGrade,
      )
      .map((student) => student.section)
      .filter((section): section is string => Boolean(section));

    return sortNatural(Array.from(new Set(sections)));
  }, [students, selectedGrade]);

  // ========================================
  // FILTER STUDENTS
  // ========================================

  // Search, grade, and section; the view chips apply on top.
  const matchingStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return students.filter((student) => {
      const studentId = String(student.student_id || "").toLowerCase();

      const fullName = String(student.full_name || "").toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        studentId.includes(normalizedSearch) ||
        fullName.includes(normalizedSearch);

      const matchesGrade =
        selectedGrade === "ALL" || student.grade_level === selectedGrade;

      const matchesSection =
        selectedSection === "ALL" || student.section === selectedSection;

      return matchesSearch && matchesGrade && matchesSection;
    });
  }, [students, search, selectedGrade, selectedSection]);

  const filteredStudents = useMemo(
    () =>
      matchingStudents.filter((student) => matchesView(student, selectedView)),
    [matchingStudents, selectedView],
  );

  // Ten students per page; a new search or filter starts at page 1. A
  // student ticked for deletion stays ticked when you change page.
  const pager = usePagination(
    filteredStudents,
    [search, selectedGrade, selectedSection, selectedView].join("|"),
  );

  // Chip counts match what each chip would show.
  const viewCounts = useMemo(
    () => countViews(matchingStudents),
    [matchingStudents],
  );

  // Summary cards always describe every student.
  const studentCounts = useMemo(() => countViews(students), [students]);

  const outstandingTotal = useMemo(
    () =>
      students.reduce(
        (centavos, student) =>
          centavos + Math.round(studentBalance(student) * 100),
        0,
      ) / 100,
    [students],
  );

  const filtersActive =
    search.trim() !== "" ||
    selectedGrade !== "ALL" ||
    selectedSection !== "ALL" ||
    selectedView !== "ALL";

  // ========================================
  // SELECTED STUDENTS
  // ========================================

  // Only inactive students can be deleted, even if one changed since selection.
  const selectedStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          selectedStudentIds.includes(student.id) &&
          isInactiveStudent(student.account_status),
      ),
    [students, selectedStudentIds],
  );

  const hiddenSelectedCount = useMemo(() => {
    const visibleIds = new Set(filteredStudents.map((student) => student.id));

    return selectedStudents.filter((student) => !visibleIds.has(student.id))
      .length;
  }, [filteredStudents, selectedStudents]);

  // The compact list replaces the table where the table would not fit.
  const compactList = width - (isTablet ? 220 : 0) - 44 < 720;

  const hasSelectableStudents = filteredStudents.some((student) =>
    isInactiveStudent(student.account_status),
  );

  // ========================================
  // NAVIGATION
  // ========================================

  const handleNavigation = (item: NavItem) => {
    router.push(item.route as any);
  };

  const handleStudentPress = (studentId: number) => {
    router.push(`/admin/students/${studentId}` as any);
  };

  // ========================================
  // MULTIPLE STUDENT SELECTION
  // ========================================

  const handleSelectStudent = (student: Student) => {
    if (!isInactiveStudent(student.account_status)) {
      return;
    }

    setSelectedStudentIds((currentIds) => {
      if (currentIds.includes(student.id)) {
        return currentIds.filter((id) => id !== student.id);
      }

      return [...currentIds, student.id];
    });
  };

  // ========================================
  // FILTER HANDLERS
  // ========================================

  const handleShowAllStudents = () => {
    setSearch("");

    setSelectedGrade("ALL");

    setSelectedSection("ALL");

    setSelectedView("ALL");

    setShowGradeMenu(false);

    setShowSectionMenu(false);
  };

  const handleSelectGrade = (grade: string) => {
    setSelectedGrade(grade);

    setShowGradeMenu(false);

    // Keep the section only if the new grade has it.
    const sectionStillListed = students.some(
      (student) =>
        (grade === "ALL" || student.grade_level === grade) &&
        student.section === selectedSection,
    );

    if (!sectionStillListed) {
      setSelectedSection("ALL");
    }
  };

  const handleSelectSection = (section: string) => {
    setSelectedSection(section);

    setShowSectionMenu(false);
  };

  // ========================================
  // ADD STUDENT
  // ========================================

  const handleAddStudent = () => {
    setShowAddStudent(true);
  };

  // ========================================
  // EXPORT STUDENT ACCOUNTS
  // ========================================

  const handleExportStudentAccounts = async () => {
    if (selectedGrade === "ALL") {
      setWarningTitle("Select Grade Level");

      setWarningMessage(
        "Please select a specific Grade Level before exporting student accounts.",
      );

      setShowWarningModal(true);

      return;
    }

    if (selectedSection === "ALL") {
      setWarningTitle("Select Section");

      setWarningMessage(
        "Please select a specific Section before exporting student accounts.",
      );

      setShowWarningModal(true);

      return;
    }

    try {
      setExportLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setWarningTitle("Session Error");

        setWarningMessage(
          "Your administrator session could not be found. Please log in again.",
        );

        setShowWarningModal(true);

        return;
      }

      const query =
        `gradeLevel=${encodeURIComponent(selectedGrade)}` +
        `&section=${encodeURIComponent(selectedSection)}`;

      const exportUrl = `${API_BASE}/api/students/export-accounts?${query}`;

      // ==================================
      // WEB
      // ==================================

      if (Platform.OS === "web") {
        const response = await fetch(exportUrl, {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const contentType = response.headers.get("content-type") || "";

          let message = "Failed to export student accounts.";

          if (contentType.includes("application/json")) {
            const data = await response.json();

            message = data.message || message;
          }

          throw new Error(message);
        }

        const blob = await response.blob();

        const disposition = response.headers.get("content-disposition");

        let fileName = `SmartFine_${makeSafeFileName(
          selectedGrade,
        )}_${makeSafeFileName(selectedSection)}_Student_Accounts.xlsx`;

        if (disposition) {
          const match = disposition.match(/filename="?([^"]+)"?/i);

          if (match?.[1]) {
            fileName = match[1];
          }
        }

        const url = URL.createObjectURL(blob);

        const anchor = document.createElement("a");

        anchor.href = url;

        anchor.download = fileName;

        document.body.appendChild(anchor);

        anchor.click();

        document.body.removeChild(anchor);

        URL.revokeObjectURL(url);

        return;
      }

      // ==================================
      // MOBILE / TABLET
      // ==================================

      const directory = FileSystem.cacheDirectory;

      if (!directory) {
        throw new Error("The device storage directory is unavailable.");
      }

      const fileName = `SmartFine_${makeSafeFileName(
        selectedGrade,
      )}_${makeSafeFileName(selectedSection)}_Student_Accounts.xlsx`;

      const fileUri = `${directory}${fileName}`;

      const result = await FileSystem.downloadAsync(exportUrl, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (result.status < 200 || result.status >= 300) {
        throw new Error("Failed to download the student account sheet.");
      }

      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        throw new Error("File sharing is not available on this device.");
      }

      await Sharing.shareAsync(result.uri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        dialogTitle: `SmartFine ${selectedGrade} - ${selectedSection} Student Accounts`,

        UTI: "org.openxmlformats.spreadsheetml.sheet",
      });
    } catch (error: any) {
      console.error("Export student accounts error:", error);

      setWarningTitle("Export Failed");

      setWarningMessage(
        error?.message || "Could not export the student account sheet.",
      );

      setShowWarningModal(true);
    } finally {
      setExportLoading(false);
    }
  };

  // ========================================
  // RESET IMPORT
  // ========================================

  const resetImportState = () => {
    setImportGrade("");

    setImportStrand("");

    setImportSection("");

    setShowImportGradeMenu(false);

    setShowImportStrandMenu(false);

    setImportFileName("");

    setImportPreviewRows([]);

    setImportError("");

    setImportReading(false);

    setTemplateLoading(false);

    setImportSubmitting(false);

    setShowImportConfirmModal(false);
  };

  // ========================================
  // OPEN IMPORT
  // ========================================

  const handleOpenImportStudents = () => {
    resetImportState();

    setShowImportModal(true);
  };

  // ========================================
  // CLOSE IMPORT
  // ========================================

  const handleCloseImportStudents = () => {
    if (importReading || templateLoading || importSubmitting) {
      return;
    }

    setShowImportModal(false);

    resetImportState();
  };

  // ========================================
  // VALIDATE CLASS FOR TEMPLATE
  // ========================================

  const validateImportClass = () => {
    setImportError("");

    if (!importGrade) {
      setImportError("Please select a Grade Level first.");

      return false;
    }

    if (isSeniorHigh && !importStrand) {
      setImportError("Please select a Strand for Grade 11 or Grade 12.");

      return false;
    }

    if (!importSection.trim()) {
      setImportError("Please enter the Section first.");

      return false;
    }

    return true;
  };

  // ========================================
  // DOWNLOAD STYLED EXCEL TEMPLATE
  // ========================================

  const handleDownloadExcelTemplate = async () => {
    if (!validateImportClass()) {
      return;
    }

    try {
      setTemplateLoading(true);

      setImportError("");

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Your administrator session could not be found. Please log in again.",
        );
      }

      const query =
        `gradeLevel=${encodeURIComponent(importGrade)}` +
        `&section=${encodeURIComponent(finalImportSection)}`;

      const templateUrl = `${API_BASE}/api/students/import-template?${query}`;

      const fallbackFileName = `SmartFine_${makeSafeFileName(
        importGrade,
      )}_${makeSafeFileName(finalImportSection)}_Student_Import_Template.xlsx`;

      // ==================================
      // WEB DOWNLOAD
      // ==================================

      if (Platform.OS === "web") {
        const response = await fetch(templateUrl, {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const contentType = response.headers.get("content-type") || "";

          let message = "Failed to create the SmartFine Excel template.";

          if (contentType.includes("application/json")) {
            const data = await response.json();

            message = data.message || message;
          }

          throw new Error(message);
        }

        const blob = await response.blob();

        const disposition = response.headers.get("content-disposition");

        let fileName = fallbackFileName;

        if (disposition) {
          const match = disposition.match(/filename="?([^"]+)"?/i);

          if (match?.[1]) {
            fileName = match[1];
          }
        }

        const url = URL.createObjectURL(blob);

        const anchor = document.createElement("a");

        anchor.href = url;

        anchor.download = fileName;

        document.body.appendChild(anchor);

        anchor.click();

        document.body.removeChild(anchor);

        URL.revokeObjectURL(url);

        return;
      }

      // ==================================
      // MOBILE / TABLET DOWNLOAD
      // ==================================

      const directory = FileSystem.cacheDirectory;

      if (!directory) {
        throw new Error("The device storage directory is unavailable.");
      }

      const fileUri = `${directory}${fallbackFileName}`;

      const result = await FileSystem.downloadAsync(templateUrl, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (result.status < 200 || result.status >= 300) {
        throw new Error("Failed to download the SmartFine Excel template.");
      }

      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        throw new Error("File sharing is not available on this device.");
      }

      await Sharing.shareAsync(result.uri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        dialogTitle: "Save or Share SmartFine Student Import Template",

        UTI: "org.openxmlformats.spreadsheetml.sheet",
      });
    } catch (error: any) {
      console.error("Download Excel template error:", error);

      setImportError(
        error?.message || "Failed to create the SmartFine Excel template.",
      );
    } finally {
      setTemplateLoading(false);
    }
  };

  // ========================================
  // BUILD IMPORT PREVIEW
  //
  // The backend parses both XLSX and CSV.
  // This function performs the current
  // frontend validation / duplicate checks.
  // ========================================

  const buildImportPreview = (parsedStudents: ParsedImportStudent[]) => {
    const studentNumberCounts = new Map<string, number>();

    const emailCounts = new Map<string, number>();

    // ====================================
    // COUNT DUPLICATES INSIDE FILE
    // ====================================

    for (const student of parsedStudents) {
      const studentNumber = String(student.studentNumber || "")
        .trim()
        .toLowerCase();

      const email = String(student.email || "")
        .trim()
        .toLowerCase();

      if (studentNumber) {
        studentNumberCounts.set(
          studentNumber,

          (studentNumberCounts.get(studentNumber) || 0) + 1,
        );
      }

      if (email) {
        emailCounts.set(
          email,

          (emailCounts.get(email) || 0) + 1,
        );
      }
    }

    // ====================================
    // EXISTING DATABASE VALUES
    // ====================================

    const existingStudentNumbers = new Set(
      students.map((student) =>
        String(student.student_id || "")
          .trim()
          .toLowerCase(),
      ),
    );

    const existingEmails = new Set(
      students
        .map((student) =>
          String(student.email || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    );

    const previewRows: ImportPreviewRow[] = [];

    // ====================================
    // VALIDATE EACH ROW
    // ====================================

    parsedStudents.forEach((student, index) => {
      const rowNumber = Number(student.rowNumber) || index + 1;

      const studentNumber = String(student.studentNumber || "").trim();

      const firstName = String(student.firstName || "").trim();

      const middleName = String(student.middleName || "").trim();

      const lastName = String(student.lastName || "").trim();

      const email = String(student.email || "")
        .trim()
        .toLowerCase();

      const rawContactNumber = String(student.contactNumber || "").trim();

      const contactNumber = normalizeContactNumber(rawContactNumber);

      const invalidIssues: string[] = [];

      const duplicateIssues: string[] = [];

      // ==================================
      // REQUIRED FIELDS
      // ==================================

      if (!studentNumber) {
        invalidIssues.push("Missing Student ID Number");
      }

      if (!firstName) {
        invalidIssues.push("Missing First Name");
      }

      if (!lastName) {
        invalidIssues.push("Missing Last Name");
      }

      if (!email) {
        invalidIssues.push("Missing Email");
      }

      if (!rawContactNumber) {
        invalidIssues.push("Missing Contact Number");
      }

      // ==================================
      // STUDENT ID
      // ==================================

      if (studentNumber && !/^[A-Za-z0-9_-]+$/.test(studentNumber)) {
        invalidIssues.push(
          "Student ID Number may contain letters, numbers, hyphens, and underscores only",
        );
      }

      // ==================================
      // EMAIL
      // ==================================

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        invalidIssues.push("Invalid Email");
      }

      // ==================================
      // CONTACT NUMBER
      // ==================================

      if (rawContactNumber && isScientificNotation(rawContactNumber)) {
        invalidIssues.push(
          "Contact Number appears to be in scientific notation. Format the Contact Number column as Text and re-enter the number.",
        );
      } else {
        if (contactNumber && !/^[0-9]+$/.test(contactNumber)) {
          invalidIssues.push("Contact Number must contain numbers only");
        }

        if (
          contactNumber &&
          (contactNumber.length < 10 || contactNumber.length > 15)
        ) {
          invalidIssues.push("Contact Number must contain 10 to 15 digits");
        }
      }

      // ==================================
      // DUPLICATES
      // ==================================

      const normalizedStudentNumber = studentNumber.toLowerCase();

      const normalizedEmail = email.toLowerCase();

      if (
        normalizedStudentNumber &&
        (studentNumberCounts.get(normalizedStudentNumber) || 0) > 1
      ) {
        duplicateIssues.push("Duplicate Student ID Number inside file");
      }

      if (normalizedEmail && (emailCounts.get(normalizedEmail) || 0) > 1) {
        duplicateIssues.push("Duplicate Email inside file");
      }

      if (
        normalizedStudentNumber &&
        existingStudentNumbers.has(normalizedStudentNumber)
      ) {
        duplicateIssues.push("Student ID Number already exists");
      }

      if (normalizedEmail && existingEmails.has(normalizedEmail)) {
        duplicateIssues.push("Email already exists");
      }

      // ==================================
      // STATUS
      // ==================================

      let status: ImportStatus = "VALID";

      if (invalidIssues.length > 0) {
        status = "INVALID";
      } else if (duplicateIssues.length > 0) {
        status = "DUPLICATE";
      }

      previewRows.push({
        rowNumber,

        studentNumber,

        firstName,

        middleName,

        lastName,

        email,

        contactNumber,

        status,

        issues: [...invalidIssues, ...duplicateIssues],
      });
    });

    setImportPreviewRows(previewRows);
  };

  // ========================================
  // CHOOSE XLSX / CSV STUDENT FILE
  // ========================================

  const handleChooseStudentFile = async () => {
    setImportError("");

    setImportPreviewRows([]);

    setImportFileName("");

    try {
      setImportReading(true);

      // ==================================
      // PICK FILE
      // ==================================

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "text/csv",

          "text/comma-separated-values",

          "application/csv",

          "application/vnd.ms-excel",
        ],

        multiple: false,

        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      const fileName = String(asset.name || "");

      const extension = fileName.toLowerCase().split(".").pop();

      if (extension !== "xlsx" && extension !== "csv") {
        setImportError(
          "Please choose a SmartFine Excel (.xlsx) or CSV (.csv) file.",
        );

        return;
      }

      // ==================================
      // SESSION TOKEN
      // ==================================

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Your administrator session could not be found. Please log in again.",
        );
      }

      // ==================================
      // FORM DATA
      // ==================================

      const formData = new FormData();

      if (Platform.OS === "web") {
        if (asset.file) {
          formData.append("studentFile", asset.file, fileName);
        } else {
          throw new Error("Could not access the selected file.");
        }
      } else {
        const mimeType =
          extension === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "text/csv";

        (formData as any).append("studentFile", {
          uri: asset.uri,

          name: fileName,

          type: asset.mimeType || mimeType,
        });
      }

      // ==================================
      // SEND TO BACKEND PARSER
      //
      // Do NOT manually set Content-Type.
      // fetch/FormData must generate the
      // multipart boundary automatically.
      // ==================================

      const response = await fetch(
        `${API_BASE}/api/students/parse-import-file`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to read the student file.");
      }

      // ==================================
      // VERIFY RESPONSE
      // ==================================

      const parsedClass = data.class as ParsedImportClass | undefined;

      const parsedStudents = Array.isArray(data.students)
        ? (data.students as ParsedImportStudent[])
        : [];

      if (!parsedClass) {
        throw new Error(
          "SmartFine could not detect the Grade and Section from this file.",
        );
      }

      if (parsedStudents.length === 0) {
        throw new Error(
          "The selected file does not contain any real student records.",
        );
      }

      // ==================================
      // AUTO-FILL CLASS FROM FILE
      // ==================================

      setImportGrade(String(parsedClass.gradeLevel || ""));

      setImportStrand(String(parsedClass.strand || ""));

      setImportSection(String(parsedClass.section || ""));

      setShowImportGradeMenu(false);

      setShowImportStrandMenu(false);

      // ==================================
      // SHOW SELECTED FILE
      // ==================================

      setImportFileName(fileName);

      // ==================================
      // BUILD EXISTING SMARTFINE PREVIEW
      // ==================================

      buildImportPreview(parsedStudents);
    } catch (error: any) {
      console.error("Student file preview error:", error);

      setImportFileName("");

      setImportPreviewRows([]);

      setImportError(
        error?.message || "Failed to read the student import file.",
      );
    } finally {
      setImportReading(false);
    }
  };

  // ========================================
  // OPEN IMPORT CONFIRMATION
  // ========================================

  const handleImportStudents = () => {
    if (!importCanContinue) {
      if (duplicateImportRows.length > 0 || invalidImportRows.length > 0) {
        setWarningTitle("Resolve Student File Issues");

        setWarningMessage(
          "Please correct all duplicate and invalid records before importing the class.",
        );

        setShowWarningModal(true);
      }

      return;
    }

    setShowImportConfirmModal(true);
  };

  // ========================================
  // PERFORM BULK IMPORT
  // ========================================

  const performStudentImport = async () => {
    if (importSubmitting || !importCanContinue) {
      return;
    }

    try {
      setImportSubmitting(true);

      setImportError("");

      const studentsToImport = validImportRows.map((row) => ({
        rowNumber: row.rowNumber,

        studentNumber: row.studentNumber,

        firstName: row.firstName,

        middleName: row.middleName,

        lastName: row.lastName,

        email: row.email,

        contactNumber: row.contactNumber,
      }));

      const response = await fetch(`${API_BASE}/api/students/bulk-import`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          gradeLevel: importGrade,

          section: finalImportSection,

          students: studentsToImport,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        let message = data.message || "Student import failed.";

        if (Array.isArray(data.errors) && data.errors.length > 0) {
          const rowMessages = data.errors
            .slice(0, 5)
            .map((item: any) => {
              const rowLabel = item.rowNumber
                ? `Row ${item.rowNumber}`
                : "Student";

              const issues = Array.isArray(item.errors)
                ? item.errors.join(", ")
                : "";

              return `${rowLabel}: ${issues}`;
            })
            .join("\n");

          message = `${message}\n\n${rowMessages}`;
        }

        setShowImportConfirmModal(false);

        setImportError(message);

        return;
      }

      const importedCount = Number(
        data.importedCount || validImportRows.length,
      );

      const importedClass = expectedClassName;

      const completedGrade = importGrade;

      const completedSection = finalImportSection;

      await loadStudents(true);

      setShowImportConfirmModal(false);

      setShowImportModal(false);

      setImportSuccessMessage(
        `${importedCount} student account${
          importedCount === 1 ? "" : "s"
        } imported successfully.\n\nClass: ${importedClass}\nUsername: First Name + Last Name (lowercase, no spaces; number added if needed)\nDefault Password: Smartfine@2026\nAccount Status: Active`,
      );

      resetImportState();

      setSelectedGrade(completedGrade);

      setSelectedSection(completedSection);

      setShowImportSuccessModal(true);
    } catch (error) {
      console.error("Import students connection error:", error);

      setShowImportConfirmModal(false);

      setImportError("Could not connect to the SmartFine server.");
    } finally {
      setImportSubmitting(false);
    }
  };

  // ========================================
  // DELETE MULTIPLE STUDENTS
  // ========================================

  const handleDeleteStudents = () => {
    if (selectedStudents.length === 0) {
      setWarningTitle("Delete Students");

      setWarningMessage("Please select at least one inactive student.");

      setShowWarningModal(true);

      return;
    }

    setShowDeleteModal(true);
  };

  // ========================================
  // CANCEL DELETE
  // ========================================

  const handleCancelDelete = () => {
    if (deleteLoading) {
      return;
    }

    setShowDeleteModal(false);
  };

  // ========================================
  // PERFORM MULTIPLE DELETE
  // ========================================

  const performDeleteStudents = async () => {
    if (selectedStudents.length === 0) {
      return;
    }

    try {
      setDeleteLoading(true);

      let deletedCount = 0;

      const failedStudents: string[] = [];

      for (const student of selectedStudents) {
        try {
          const response = await fetch(
            `${API_BASE}/api/students/${student.id}`,
            {
              method: "DELETE",
            },
          );

          const data = await response.json();

          if (response.ok && data.success) {
            deletedCount += 1;
          } else {
            failedStudents.push(
              `${student.full_name}: ${
                data.message || "Could not delete student."
              }`,
            );
          }
        } catch (error) {
          console.error(`Delete student ${student.id} error:`, error);

          failedStudents.push(`${student.full_name}: Connection error.`);
        }
      }

      await loadStudents(true);

      setSelectedStudentIds([]);

      setShowDeleteModal(false);

      if (failedStudents.length === 0) {
        setDeleteSuccessMessage(
          `${deletedCount} student${
            deletedCount === 1 ? "" : "s"
          } deleted successfully.`,
        );

        setShowDeleteSuccessModal(true);

        return;
      }

      if (deletedCount > 0) {
        setWarningTitle("Delete Completed with Issues");

        setWarningMessage(
          `${deletedCount} student${
            deletedCount === 1 ? "" : "s"
          } deleted successfully.\n\nThe following student${
            failedStudents.length === 1 ? "" : "s"
          } could not be deleted:\n\n${failedStudents.join("\n")}`,
        );

        setShowWarningModal(true);

        return;
      }

      setWarningTitle("Delete Students");

      setWarningMessage(
        `No students were deleted.\n\n${failedStudents.join("\n")}`,
      );

      setShowWarningModal(true);
    } catch (error) {
      console.error("Delete students error:", error);

      setShowDeleteModal(false);

      setWarningTitle("Connection Error");

      setWarningMessage("Could not connect to the SmartFine server.");

      setShowWarningModal(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleCancelLogout = () => {
    if (logoutLoading) {
      return;
    }

    setShowLogoutModal(false);
  };

  const performLogout = async () => {
    try {
      setLogoutLoading(true);

      await logout();

      setShowLogoutModal(false);

      returnToLogin();
    } catch (error) {
      console.error("Logout error:", error);

      setWarningTitle("Logout Error");

      setWarningMessage("Could not log out. Please try again.");

      setShowWarningModal(true);
    } finally {
      setLogoutLoading(false);
    }
  };

  // ========================================
  // UI
  // ========================================

  return (
    <View style={styles.screen}>
      {/* SIDEBAR */}

      {isTablet && (
        <View style={styles.sidebar}>
          <View style={styles.logoArea}>
            <Image
              source={require("../../../assets/branding/smartfineNoBG.png")}
              style={styles.smartFineLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.navigation}>
            {navItems.map((item) => {
              const isActive = item.label === "Students";

              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => handleNavigation(item)}
                >
                  <View style={styles.navIconContainer}>
                    <Image
                      source={item.icon}
                      style={styles.navImageIcon}
                      resizeMode="contain"
                    />
                  </View>

                  <Text style={styles.navText}>{item.label}</Text>
                  <AdminNavBadge label={item.label} />
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MAIN */}

      <View style={styles.main}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={pullRefreshing}
              onRefresh={handlePullRefresh}
              tintColor="#173A73"
              colors={["#173A73"]}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Students Directory</Text>

            <Text style={styles.pageSubtitle}>
              Find students, check balances, and manage accounts.
            </Text>
          </View>

          {/* MOBILE NAV */}

          {!isTablet && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileNav}
            >
              {navItems.map((item) => {
                const isActive = item.label === "Students";

                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.mobileNavItem,

                      isActive && styles.mobileNavItemActive,
                    ]}
                    onPress={() => handleNavigation(item)}
                  >
                    <Text
                      style={[
                        styles.mobileNavText,

                        isActive && styles.mobileNavTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <AdminNavBadge label={item.label} variant="menu" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* SUMMARY CARDS */}

          <SummaryCardRow>
            <SummaryCard
              label="Total Students"
              value={String(students.length)}
              hint={`${studentCounts.ACTIVE} active · ${studentCounts.INACTIVE} inactive`}
              tone="info"
              loading={loading}
              onPress={handleShowAllStudents}
            />

            <SummaryCard
              label="With Balance"
              value={String(studentCounts.WITH_BALANCE)}
              hint={
                studentCounts.WITH_BALANCE > 0
                  ? `${formatPeso(outstandingTotal)} unpaid`
                  : "No unpaid fines"
              }
              tone="danger"
              loading={loading}
              onPress={() => setSelectedView("WITH_BALANCE")}
            />

            <SummaryCard
              label="No Balance"
              value={String(studentCounts.NO_BALANCE)}
              hint="Nothing left to pay"
              tone="success"
              loading={loading}
              onPress={() => setSelectedView("NO_BALANCE")}
            />

            <SummaryCard
              label="Inactive Accounts"
              value={String(studentCounts.INACTIVE)}
              hint={
                studentCounts.INACTIVE > 0
                  ? "Can be selected for deletion"
                  : "None"
              }
              tone="neutral"
              loading={loading}
              onPress={() => setSelectedView("INACTIVE")}
            />
          </SummaryCardRow>

          {/* TOOLBAR */}

          <View style={styles.toolbar}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>⌕</Text>

              <TextInput
                style={styles.searchInput}
                placeholder="Search student by name or ID"
                placeholderTextColor="#8C939F"
                value={search}
                onChangeText={setSearch}
              />

              {search !== "" && (
                <TouchableOpacity
                  onPress={() => setSearch("")}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* FILTERS */}

            <View style={styles.filtersContainer}>
              <View style={styles.filterWrapper}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,

                    selectedGrade !== "ALL" && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    setShowGradeMenu(!showGradeMenu);

                    setShowSectionMenu(false);
                  }}
                >
                  <Text style={styles.filterText} numberOfLines={1}>
                    {selectedGrade === "ALL" ? "All Grades" : selectedGrade}
                  </Text>

                  <Text style={styles.filterArrow}>▼</Text>
                </TouchableOpacity>

                {showGradeMenu && (
                  <View style={styles.filterMenu}>
                    <ScrollView
                      style={styles.filterMenuScroll}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      <TouchableOpacity
                        style={styles.filterOption}
                        onPress={() => handleSelectGrade("ALL")}
                      >
                        <Text style={styles.filterOptionText}>All Grades</Text>
                      </TouchableOpacity>

                      {gradeOptions.map((grade) => (
                        <TouchableOpacity
                          key={grade}
                          style={[
                            styles.filterOption,

                            grade === selectedGrade &&
                              styles.filterOptionActive,
                          ]}
                          onPress={() => handleSelectGrade(grade)}
                        >
                          <Text style={styles.filterOptionText}>{grade}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.filterWrapper}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,

                    selectedSection !== "ALL" && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    setShowSectionMenu(!showSectionMenu);

                    setShowGradeMenu(false);
                  }}
                >
                  <Text style={styles.filterText} numberOfLines={1}>
                    {selectedSection === "ALL"
                      ? "All Sections"
                      : selectedSection}
                  </Text>

                  <Text style={styles.filterArrow}>▼</Text>
                </TouchableOpacity>

                {showSectionMenu && (
                  <View style={styles.filterMenu}>
                    <ScrollView
                      style={styles.filterMenuScroll}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      <TouchableOpacity
                        style={styles.filterOption}
                        onPress={() => handleSelectSection("ALL")}
                      >
                        <Text style={styles.filterOptionText}>
                          All Sections
                        </Text>
                      </TouchableOpacity>

                      {sectionOptions.map((section) => (
                        <TouchableOpacity
                          key={section}
                          style={[
                            styles.filterOption,

                            section === selectedSection &&
                              styles.filterOptionActive,
                          ]}
                          onPress={() => handleSelectSection(section)}
                        >
                          <Text style={styles.filterOptionText}>
                            {section}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* ACTION BUTTONS */}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.importButton}
                onPress={handleOpenImportStudents}
                disabled={exportLoading}
              >
                <Text style={styles.importButtonText}>Import Students</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.importButton,

                  exportLoading && {
                    opacity: 0.6,
                  },
                ]}
                onPress={handleExportStudentAccounts}
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.importButtonText}>Export Accounts</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddStudent}
                disabled={exportLoading}
              >
                <Text style={styles.addButtonText}>+ Add New Student</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* STUDENT LIST */}

          <View style={styles.tableCard}>
            <View style={styles.tableIntro}>
              <View style={styles.tableIntroText}>
                <Text style={styles.tableIntroTitle}>Student accounts</Text>

                <Text style={styles.tableIntroSubtitle}>
                  Tap a student to open their profile.
                </Text>
              </View>

              <View style={styles.tableIntroActions}>
                {filtersActive && (
                  <TouchableOpacity
                    onPress={handleShowAllStudents}
                    accessibilityRole="button"
                  >
                    <Text style={styles.clearFiltersText}>Clear filters</Text>
                  </TouchableOpacity>
                )}

                {refreshing && (
                  <ActivityIndicator size="small" color="#173A73" />
                )}

                <Text style={styles.resultCount}>
                  {filteredStudents.length === students.length
                    ? `${students.length} ${
                        students.length === 1 ? "student" : "students"
                      }`
                    : `${filteredStudents.length} of ${students.length} shown`}
                </Text>
              </View>
            </View>

            {loading ? (
              // Placeholder rows in the shape of the list or the table.
              compactList ? (
                <SkeletonList
                  label="Loading students"
                  count={5}
                  itemStyle={styles.compactRow}
                  style={styles.compactList}
                />
              ) : (
                <SkeletonTable
                  label="Loading students"
                  rows={6}
                  columns={5}
                  rowStyle={styles.studentRow}
                />
              )
            ) : error ? (
              <View style={styles.centerState}>
                <Text style={styles.errorText}>{error}</Text>

                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => loadStudents()}
                >
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* VIEW CHIPS */}

                <View style={styles.viewChips}>
                  {VIEW_FILTERS.map((filter) => {
                    const active = selectedView === filter.key;

                    return (
                      <TouchableOpacity
                        key={filter.key}
                        style={[styles.viewChip, active && styles.viewChipActive]}
                        onPress={() => setSelectedView(filter.key)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Text
                          style={[
                            styles.viewChipText,

                            active && styles.viewChipTextActive,
                          ]}
                        >
                          {filter.label} ({viewCounts[filter.key]})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {refreshError !== "" && (
                  <Text style={styles.refreshError}>{refreshError}</Text>
                )}

                {filteredStudents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>
                      {students.length === 0
                        ? "No students yet"
                        : `No ${VIEW_EMPTY_LABELS[selectedView]} found`}
                    </Text>

                    <Text style={styles.emptyText}>
                      {students.length === 0
                        ? "Add a student or import a class list to get started."
                        : search.trim() !== "" ||
                            selectedGrade !== "ALL" ||
                            selectedSection !== "ALL"
                          ? "No students match your search and filters."
                          : `There are no ${VIEW_EMPTY_LABELS[selectedView]} right now.`}
                    </Text>

                    {students.length > 0 && (
                      <TouchableOpacity
                        style={styles.emptyResetButton}
                        onPress={handleShowAllStudents}
                        accessibilityRole="button"
                      >
                        <Text style={styles.emptyResetText}>
                          Show all students
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : compactList ? (
                  /* PHONE AND PORTRAIT TABLET: one card per student */
                  <View style={styles.compactList}>
                    {pager.pageItems.map((student, index) => {
                      const isInactive = isInactiveStudent(
                        student.account_status,
                      );

                      const isSelected =
                        isInactive && selectedStudentIds.includes(student.id);

                      const balance = studentBalance(student);

                      const classLabel = formatClass(student);

                      return (
                        <FadeIn
                          key={student.id}
                          index={index}
                          style={[
                            styles.compactRow,

                            isSelected && styles.studentRowSelected,
                          ]}
                        >
                          {/* Same slot on every row keeps avatars aligned. */}
                          {hasSelectableStudents && (
                            <View style={styles.compactSelectSlot}>
                              {isInactive && (
                                <TouchableOpacity
                                  style={[
                                    styles.selectCircle,

                                    isSelected && styles.selectCircleSelected,
                                  ]}
                                  onPress={() => handleSelectStudent(student)}
                                  activeOpacity={0.8}
                                  hitSlop={10}
                                  accessibilityRole="checkbox"
                                  accessibilityState={{ checked: isSelected }}
                                  accessibilityLabel={`Select ${student.full_name} for deletion`}
                                />
                              )}
                            </View>
                          )}

                          <TouchableOpacity
                            style={styles.compactMain}
                            onPress={() => handleStudentPress(student.id)}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={`Open ${student.full_name}`}
                          >
                            <StudentAvatar
                              key={student.profile_picture_uri || "initials"}
                              student={student}
                            />

                            <View style={styles.compactText}>
                              <View style={styles.compactTitleRow}>
                                <Text
                                  style={[styles.studentName, styles.compactName]}
                                  numberOfLines={1}
                                >
                                  {student.full_name}
                                </Text>

                                <StatusChip status={student.account_status} />
                              </View>

                              <Text style={styles.studentMeta} numberOfLines={1}>
                                {student.student_id} ·{" "}
                                {classLabel || "Not assigned"}
                              </Text>

                              <Text style={styles.compactMoney} numberOfLines={1}>
                                Balance{" "}
                                <Text
                                  style={
                                    balance > 0
                                      ? styles.balanceDanger
                                      : styles.balanceZero
                                  }
                                >
                                  {formatPeso(balance)}
                                </Text>
                                {"  ·  "}Fines{" "}
                                {formatPeso(Number(student.total_fines) || 0)}
                              </Text>
                            </View>

                            <Text style={styles.rowChevron}>›</Text>
                          </TouchableOpacity>
                        </FadeIn>
                      );
                    })}
                  </View>
                ) : (
                  /* WIDE SCREENS: table */
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tableScrollContent}
                  >
                    <View style={styles.table}>
                      <View style={styles.tableHeader}>
                        <View style={styles.selectColumn} />

                        <Text style={[styles.headerCell, styles.nameColumn]}>
                          Student
                        </Text>

                        <Text
                          style={[styles.headerCell, styles.gradeSectionColumn]}
                        >
                          Grade / Section
                        </Text>

                        <Text style={[styles.headerCell, styles.moneyColumn]}>
                          Total Fines
                        </Text>

                        <Text style={[styles.headerCell, styles.moneyColumn]}>
                          Balance
                        </Text>

                        <Text style={[styles.headerCell, styles.statusColumn]}>
                          Status
                        </Text>

                        <View style={styles.chevronColumn} />
                      </View>

                      {pager.pageItems.map((student, index) => {
                        const isInactive = isInactiveStudent(
                          student.account_status,
                        );

                        const isSelected =
                          isInactive && selectedStudentIds.includes(student.id);

                        const balance = studentBalance(student);

                        const classLabel = formatClass(student);

                        return (
                          <FadeIn
                            key={student.id}
                            index={index}
                            style={[
                              styles.studentRow,

                              isSelected && styles.studentRowSelected,
                            ]}
                          >
                            <View style={styles.selectColumn}>
                              {isInactive && (
                                <TouchableOpacity
                                  style={[
                                    styles.selectCircle,

                                    isSelected && styles.selectCircleSelected,
                                  ]}
                                  onPress={() => handleSelectStudent(student)}
                                  activeOpacity={0.8}
                                  hitSlop={10}
                                  accessibilityRole="checkbox"
                                  accessibilityState={{ checked: isSelected }}
                                  accessibilityLabel={`Select ${student.full_name} for deletion`}
                                />
                              )}
                            </View>

                            <TouchableOpacity
                              style={styles.rowMain}
                              onPress={() => handleStudentPress(student.id)}
                              activeOpacity={0.7}
                              accessibilityRole="button"
                              accessibilityLabel={`Open ${student.full_name}`}
                            >
                              <View style={[styles.studentCell, styles.nameColumn]}>
                                <StudentAvatar
                                  key={student.profile_picture_uri || "initials"}
                                  student={student}
                                />

                                <View style={styles.studentText}>
                                  <Text
                                    style={styles.studentName}
                                    numberOfLines={1}
                                  >
                                    {student.full_name}
                                  </Text>

                                  <Text
                                    style={styles.studentMeta}
                                    numberOfLines={1}
                                  >
                                    {student.student_id}
                                  </Text>
                                </View>
                              </View>

                              <Text
                                style={[
                                  styles.bodyCell,
                                  styles.gradeSectionColumn,

                                  !classLabel && styles.mutedCell,
                                ]}
                                numberOfLines={2}
                              >
                                {classLabel || "Not assigned"}
                              </Text>

                              <Text style={[styles.bodyCell, styles.moneyColumn]}>
                                {formatPeso(Number(student.total_fines) || 0)}
                              </Text>

                              <Text
                                style={[
                                  styles.bodyCell,
                                  styles.moneyColumn,

                                  balance > 0
                                    ? styles.balanceDanger
                                    : styles.balanceZero,
                                ]}
                              >
                                {formatPeso(balance)}
                              </Text>

                              <View style={styles.statusColumn}>
                                <StatusChip status={student.account_status} />
                              </View>

                              <Text
                                style={[styles.rowChevron, styles.chevronColumn]}
                              >
                                ›
                              </Text>
                            </TouchableOpacity>
                          </FadeIn>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}

                {/* PAGE NUMBERS */}

                <Pagination pager={pager} noun="students" />

                {/* TABLE FOOTER */}

                <View style={styles.tableFooter}>
                  <View style={styles.footerInfo}>
                    <Text style={styles.totalStudentsText}>
                      Showing {filteredStudents.length} of {students.length}{" "}
                      {students.length === 1 ? "student" : "students"}
                    </Text>

                    {selectedStudents.length > 0 && (
                      <View style={styles.selectionRow}>
                        <Text style={styles.selectedStudentText}>
                          {selectedStudents.length} selected
                          {hiddenSelectedCount > 0
                            ? ` (${hiddenSelectedCount} hidden by filters)`
                            : ""}
                        </Text>

                        <TouchableOpacity
                          onPress={() => setSelectedStudentIds([])}
                          disabled={deleteLoading}
                          hitSlop={8}
                          accessibilityRole="button"
                        >
                          <Text style={styles.clearSelectionText}>
                            Clear selection
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.deleteButton,

                      (selectedStudents.length === 0 || deleteLoading) &&
                        styles.deleteButtonDisabled,
                    ]}
                    onPress={handleDeleteStudents}
                    disabled={selectedStudents.length === 0 || deleteLoading}
                  >
                    <Text style={styles.deleteButtonText}>
                      {deleteLoading
                        ? "Deleting..."
                        : selectedStudents.length > 0
                          ? `Delete ${selectedStudents.length} Student${
                              selectedStudents.length === 1 ? "" : "s"
                            }`
                          : "Delete Student"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.deleteHint}>
                  Only inactive students can be selected for deletion.
                </Text>
              </>
            )}
          </View>
        </ScrollView>
      </View>

      {/* =====================================
          IMPORT STUDENTS MODAL
      ====================================== */}

      <Modal
        visible={showImportModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseImportStudents}
      >
        <View style={styles.importOverlay}>
          <PopIn style={styles.importModal}>
            <ScrollView
              contentContainerStyle={styles.importModalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* HEADER */}

              <View style={styles.importHeader}>
                <View style={styles.importHeaderText}>
                  <Text style={styles.importTitle}>Import Students</Text>

                  <Text style={styles.importSubtitle}>
                    Download the official SmartFine Excel template for a class,
                    let the teacher complete it, then upload the same Excel file
                    for validation and import. Existing SmartFine CSV files are
                    still supported.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.importCloseButton}
                  onPress={handleCloseImportStudents}
                  disabled={
                    importReading || templateLoading || importSubmitting
                  }
                >
                  <Text style={styles.importCloseText}>×</Text>
                </TouchableOpacity>
              </View>

              {/* =================================
                  CLASS INFORMATION
              ================================== */}

              <View style={styles.importSectionCard}>
                <Text style={styles.importSectionTitle}>Class Information</Text>

                <View style={styles.importFieldsRow}>
                  {/* GRADE */}

                  <View style={styles.importField}>
                    <Text style={styles.importLabel}>Grade Level *</Text>

                    <TouchableOpacity
                      style={styles.importSelect}
                      onPress={() => {
                        setShowImportGradeMenu(!showImportGradeMenu);

                        setShowImportStrandMenu(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.importSelectText,

                          !importGrade && styles.importPlaceholder,
                        ]}
                      >
                        {importGrade || "Select Grade"}
                      </Text>

                      <Text style={styles.importSelectArrow}>▼</Text>
                    </TouchableOpacity>

                    {showImportGradeMenu && (
                      <View style={styles.importMenu}>
                        {GRADE_OPTIONS.map((grade) => (
                          <TouchableOpacity
                            key={grade}
                            style={styles.importMenuOption}
                            onPress={() => {
                              setImportGrade(grade);

                              setImportStrand("");

                              setImportFileName("");

                              setImportPreviewRows([]);

                              setImportError("");

                              setShowImportGradeMenu(false);
                            }}
                          >
                            <Text style={styles.importMenuOptionText}>
                              {grade}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* STRAND */}

                  {isSeniorHigh && (
                    <View style={styles.importField}>
                      <Text style={styles.importLabel}>Strand *</Text>

                      <TouchableOpacity
                        style={styles.importSelect}
                        onPress={() => {
                          setShowImportStrandMenu(!showImportStrandMenu);

                          setShowImportGradeMenu(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.importSelectText,

                            !importStrand && styles.importPlaceholder,
                          ]}
                        >
                          {importStrand || "Select Strand"}
                        </Text>

                        <Text style={styles.importSelectArrow}>▼</Text>
                      </TouchableOpacity>

                      {showImportStrandMenu && (
                        <View style={styles.importMenu}>
                          {STRAND_OPTIONS.map((strand) => (
                            <TouchableOpacity
                              key={strand}
                              style={styles.importMenuOption}
                              onPress={() => {
                                setImportStrand(strand);

                                setImportFileName("");

                                setImportPreviewRows([]);

                                setImportError("");

                                setShowImportStrandMenu(false);
                              }}
                            >
                              <Text style={styles.importMenuOptionText}>
                                {strand}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* SECTION */}

                  <View style={styles.importField}>
                    <Text style={styles.importLabel}>Section *</Text>

                    <TextInput
                      style={styles.importTextInput}
                      value={importSection}
                      onChangeText={(value) => {
                        setImportSection(value);

                        setImportPreviewRows([]);

                        setImportFileName("");

                        setImportError("");
                      }}
                      placeholder={
                        isSeniorHigh
                          ? "Example: ICT - Pagatpat"
                          : "Example: Ponkan"
                      }
                      placeholderTextColor="#8C939F"
                    />
                  </View>
                </View>

                {expectedClassName ? (
                  <View style={styles.classPreview}>
                    <Text style={styles.classPreviewLabel}>
                      Official class name:
                    </Text>

                    <Text style={styles.classPreviewValue}>
                      {expectedClassName}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* =================================
                  OFFICIAL EXCEL TEMPLATE
              ================================== */}

              <View style={styles.csvGuide}>
                <View style={styles.csvGuideHeader}>
                  <View style={styles.csvGuideHeaderText}>
                    <Text style={styles.csvGuideTitle}>
                      Official SmartFine Excel Template
                    </Text>

                    <Text style={styles.csvGuideDescription}>
                      Download the formatted Excel template for this class. The
                      workbook already includes the SmartFine design, class
                      information, instructions, example row, and properly
                      formatted Student ID and Contact Number columns.
                    </Text>
                  </View>

                  {/* DOWNLOAD EXCEL TEMPLATE */}

                  <TouchableOpacity
                    style={[
                      styles.downloadTemplateButton,

                      templateLoading && styles.downloadTemplateButtonDisabled,
                    ]}
                    onPress={handleDownloadExcelTemplate}
                    disabled={templateLoading}
                  >
                    {templateLoading ? (
                      <ActivityIndicator size="small" color="#173A73" />
                    ) : (
                      <View style={styles.importButtonLoadingContent}>
                        <Image
                          source={require("../../../assets/icons/download.png")}
                          style={styles.navImageIcon}
                          resizeMode="contain"
                        />

                        <Text style={styles.downloadTemplateText}>
                          Download Excel Template
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* TEMPLATE COLUMNS */}

                <Text style={styles.csvColumnLabel}>Template columns</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text selectable style={styles.csvCode}>
                    Student ID | First Name | Middle Name | Last Name | Email |
                    Contact Number
                  </Text>
                </ScrollView>

                {/* TEACHER INSTRUCTIONS */}

                <View style={styles.templateInstructions}>
                  <Text style={styles.templateInstructionTitle}>
                    Instructions for the Teacher
                  </Text>

                  <Text style={styles.templateInstructionText}>
                    1. Do not change the SmartFine class information in the
                    workbook.
                  </Text>

                  <Text style={styles.templateInstructionText}>
                    2. Do not rename, remove, or reorder the student column
                    headings.
                  </Text>

                  <Text style={styles.templateInstructionText}>
                    3. The EXAMPLE row is only a guide and will automatically be
                    ignored.
                  </Text>

                  <Text style={styles.templateInstructionText}>
                    4. Enter real student records beginning below the EXAMPLE
                    row.
                  </Text>

                  <Text style={styles.templateInstructionText}>
                    5. Student ID, First Name, Last Name, Email, and Contact
                    Number are required.
                  </Text>

                  <Text style={styles.templateInstructionText}>
                    6. Middle Name is optional and may be left blank.
                  </Text>

                  <Text style={styles.templateInstructionText}>
                    7. Student ID and Contact Number columns are already
                    formatted as Text to preserve their original values.
                  </Text>

                  <Text style={styles.templateInstructionText}>
                    8. Save and return the same Excel (.xlsx) file. There is no
                    need to convert it to CSV.
                  </Text>
                </View>

                <Text style={styles.csvGuideNote}>
                  When the completed Excel or CSV file is uploaded, SmartFine
                  automatically detects its Grade Level, Strand, and Section.
                </Text>

                <Text style={styles.csvGuideNote}>
                  Imported account: Username = First Name + Last Name
                  (lowercase, no spaces; number added if needed) · Default
                  Password = Smartfine@2026 · Status = Active
                </Text>
              </View>

              {/* =================================
                  COMPLETED STUDENT FILE
              ================================== */}

              <View style={styles.importSectionCard}>
                <Text style={styles.importSectionTitle}>
                  Completed Student File
                </Text>

                <Text style={styles.fileHelperText}>
                  Upload the completed SmartFine Excel file returned by the
                  teacher. Existing SmartFine CSV files are also supported.
                  Grade, Strand, and Section will be detected automatically.
                </Text>

                <TouchableOpacity
                  style={styles.chooseFileButton}
                  onPress={handleChooseStudentFile}
                  disabled={importReading || importSubmitting}
                >
                  {importReading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.chooseFileText}>
                      Choose Student File
                    </Text>
                  )}
                </TouchableOpacity>

                <Text
                  style={[
                    styles.fileHelperText,
                    {
                      marginTop: 8,
                    },
                  ]}
                >
                  Accepted file types: .xlsx and .csv
                </Text>

                {importFileName ? (
                  <View style={styles.selectedFile}>
                    <Text style={styles.selectedFileLabel}>Selected File</Text>

                    <Text style={styles.selectedFileName}>
                      {importFileName}
                    </Text>
                  </View>
                ) : null}

                {importError ? (
                  <View style={styles.importErrorBox}>
                    <Text style={styles.importErrorText}>{importError}</Text>
                  </View>
                ) : null}
              </View>

              {/* =================================
                  FILE PREVIEW
              ================================== */}

              {importPreviewRows.length > 0 && (
                <>
                  <Text style={styles.previewHeading}>File Preview</Text>

                  {/* SUMMARY */}

                  <View style={styles.importSummary}>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryNumber}>
                        {importPreviewRows.length}
                      </Text>

                      <Text style={styles.summaryLabel}>Students Found</Text>
                    </View>

                    <View style={[styles.summaryCard, styles.summaryValidCard]}>
                      <Text
                        style={[styles.summaryNumber, styles.summaryValidText]}
                      >
                        {validImportRows.length}
                      </Text>

                      <Text style={styles.summaryLabel}>Valid</Text>
                    </View>

                    <View
                      style={[styles.summaryCard, styles.summaryDuplicateCard]}
                    >
                      <Text
                        style={[
                          styles.summaryNumber,
                          styles.summaryDuplicateText,
                        ]}
                      >
                        {duplicateImportRows.length}
                      </Text>

                      <Text style={styles.summaryLabel}>Duplicates</Text>
                    </View>

                    <View
                      style={[styles.summaryCard, styles.summaryInvalidCard]}
                    >
                      <Text
                        style={[
                          styles.summaryNumber,
                          styles.summaryInvalidText,
                        ]}
                      >
                        {invalidImportRows.length}
                      </Text>

                      <Text style={styles.summaryLabel}>Invalid</Text>
                    </View>
                  </View>

                  {/* PREVIEW TABLE */}

                  <View style={styles.previewCard}>
                    <ScrollView horizontal showsHorizontalScrollIndicator>
                      <View style={styles.previewTable}>
                        <View style={styles.previewTableHeader}>
                          <Text
                            style={[
                              styles.previewHeaderText,
                              styles.previewRowNumberColumn,
                            ]}
                          >
                            Row
                          </Text>

                          <Text
                            style={[
                              styles.previewHeaderText,
                              styles.previewStudentNumberColumn,
                            ]}
                          >
                            Student ID
                          </Text>

                          <Text
                            style={[
                              styles.previewHeaderText,
                              styles.previewNameColumn,
                            ]}
                          >
                            Student Name
                          </Text>

                          <Text
                            style={[
                              styles.previewHeaderText,
                              styles.previewEmailColumn,
                            ]}
                          >
                            Email
                          </Text>

                          <Text
                            style={[
                              styles.previewHeaderText,
                              styles.previewContactColumn,
                            ]}
                          >
                            Contact
                          </Text>

                          <View style={styles.previewStatusColumn}>
                            <Text style={styles.previewHeaderText}>Status</Text>
                          </View>
                        </View>

                        {importPreviewRows.map((row) => {
                          const fullName = [
                            row.firstName,
                            row.middleName,
                            row.lastName,
                          ]
                            .filter(Boolean)
                            .join(" ");

                          return (
                            <View
                              key={`${row.rowNumber}-${row.studentNumber}`}
                              style={styles.previewTableRow}
                            >
                              <Text
                                style={[
                                  styles.previewCell,
                                  styles.previewRowNumberColumn,
                                ]}
                              >
                                {row.rowNumber}
                              </Text>

                              <Text
                                style={[
                                  styles.previewCell,
                                  styles.previewStudentNumberColumn,
                                ]}
                              >
                                {row.studentNumber || "—"}
                              </Text>

                              <Text
                                style={[
                                  styles.previewCell,
                                  styles.previewNameColumn,
                                ]}
                              >
                                {fullName || "—"}
                              </Text>

                              <Text
                                style={[
                                  styles.previewCell,
                                  styles.previewEmailColumn,
                                ]}
                              >
                                {row.email || "—"}
                              </Text>

                              <Text
                                style={[
                                  styles.previewCell,
                                  styles.previewContactColumn,
                                ]}
                              >
                                {row.contactNumber || "—"}
                              </Text>

                              <View style={styles.previewStatusColumn}>
                                <View
                                  style={[
                                    styles.previewStatusBadge,

                                    row.status === "VALID"
                                      ? styles.previewValidBadge
                                      : row.status === "DUPLICATE"
                                        ? styles.previewDuplicateBadge
                                        : styles.previewInvalidBadge,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.previewStatusText,

                                      row.status === "VALID"
                                        ? styles.previewValidText
                                        : row.status === "DUPLICATE"
                                          ? styles.previewDuplicateText
                                          : styles.previewInvalidText,
                                    ]}
                                  >
                                    {row.status}
                                  </Text>
                                </View>

                                {row.issues.length > 0 && (
                                  <Text style={styles.previewIssues}>
                                    {row.issues.join(" · ")}
                                  </Text>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  {/* DEFAULT ACCOUNT SETUP */}

                  <View style={styles.defaultAccountNotice}>
                    <Text style={styles.defaultAccountTitle}>
                      Student Account Setup
                    </Text>

                    <Text style={styles.defaultAccountText}>
                      Username = First Name + Last Name (lowercase, no spaces;
                      number added if needed)
                      {"\n"}
                      Default Password ={" "}
                      <Text style={styles.defaultPasswordText}>
                        Smartfine@2026
                      </Text>
                      {"\n"}
                      Account Status = Active
                      {"\n"}
                      Class = {expectedClassName}
                    </Text>
                  </View>

                  {/* IMPORT BLOCKED */}

                  {(duplicateImportRows.length > 0 ||
                    invalidImportRows.length > 0) && (
                    <View style={styles.importBlockedNotice}>
                      <Text style={styles.importBlockedTitle}>
                        Import unavailable
                      </Text>

                      <Text style={styles.importBlockedText}>
                        Correct all duplicate and invalid rows in the student
                        file, save it, and upload the file again.
                      </Text>
                    </View>
                  )}
                </>
              )}

              {/* =================================
                  IMPORT FOOTER
              ================================== */}

              <View style={styles.importFooter}>
                <TouchableOpacity
                  style={styles.importCancelButton}
                  onPress={handleCloseImportStudents}
                  disabled={importSubmitting}
                >
                  <Text style={styles.importCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.importContinueButton,

                    !importCanContinue && styles.importContinueButtonDisabled,
                  ]}
                  onPress={handleImportStudents}
                  disabled={!importCanContinue}
                >
                  {importSubmitting ? (
                    <View style={styles.importButtonLoadingContent}>
                      <ActivityIndicator size="small" color="#FFFFFF" />

                      <Text style={styles.importContinueText}>
                        Importing...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.importContinueText}>
                      Import {validImportRows.length} Student
                      {validImportRows.length === 1 ? "" : "s"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </PopIn>
        </View>
      </Modal>

      {/* =====================================
          IMPORT CONFIRMATION
      ====================================== */}

      <Modal
        visible={showImportConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!importSubmitting) {
            setShowImportConfirmModal(false);
          }
        }}
      >
        <View style={styles.confirmOverlay}>
          <PopIn style={styles.confirmModal}>
            {/* IMPORT ICON */}

            <View style={styles.confirmIcon}>
              <Image
                source={require("../../../assets/icons/import-icon.png")}
                style={styles.confirmIconImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.confirmTitle}>Import Students?</Text>

            <Text style={styles.confirmMessage}>
              You are about to create {validImportRows.length} student account
              {validImportRows.length === 1 ? "" : "s"} for:
            </Text>

            <Text style={styles.confirmClass}>{expectedClassName}</Text>

            <View style={styles.confirmAccountBox}>
              <Text style={styles.confirmAccountText}>
                Username: First Name + Last Name (lowercase, no spaces; number
                added if needed)
              </Text>

              <Text style={styles.confirmAccountText}>
                Default Password: Smartfine@2026
              </Text>

              <Text style={styles.confirmAccountText}>Status: Active</Text>
            </View>

            <Text style={styles.confirmWarning}>
              Make sure the preview information is correct before continuing.
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[
                  styles.confirmCancelButton,

                  importSubmitting && styles.confirmDisabled,
                ]}
                disabled={importSubmitting}
                onPress={() => setShowImportConfirmModal(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmImportButton,

                  importSubmitting && styles.confirmDisabled,
                ]}
                disabled={importSubmitting}
                onPress={performStudentImport}
              >
                {importSubmitting ? (
                  <View style={styles.importButtonLoadingContent}>
                    <ActivityIndicator size="small" color="#FFFFFF" />

                    <Text style={styles.confirmImportText}>Importing...</Text>
                  </View>
                ) : (
                  <Text style={styles.confirmImportText}>Import Students</Text>
                )}
              </TouchableOpacity>
            </View>
          </PopIn>
        </View>
      </Modal>

      {/* =====================================
          DELETE CONFIRMATION
      ====================================== */}

      <DeleteModal
        visible={showDeleteModal}
        loading={deleteLoading}
        title={
          selectedStudents.length === 1
            ? "Delete Student?"
            : `Delete ${selectedStudents.length} Students?`
        }
        message={
          selectedStudents.length === 1
            ? `Are you sure you want to delete ${selectedStudents[0]?.full_name}?`
            : `Are you sure you want to delete ${selectedStudents.length} selected inactive students?`
        }
        onCancel={handleCancelDelete}
        onConfirm={performDeleteStudents}
      />

      {/* DELETE SUCCESS */}

      <SuccessModal
        visible={showDeleteSuccessModal}
        title="Students Deleted"
        message={deleteSuccessMessage}
        buttonText="OK"
        onClose={() => setShowDeleteSuccessModal(false)}
      />

      {/* IMPORT SUCCESS */}

      <SuccessModal
        visible={showImportSuccessModal}
        title="Students Imported"
        message={importSuccessMessage}
        buttonText="OK"
        onClose={() => setShowImportSuccessModal(false)}
      />

      {/* WARNING */}

      <WarningModal
        visible={showWarningModal}
        title={warningTitle}
        message={warningMessage}
        buttonText="OK"
        onClose={() => setShowWarningModal(false)}
      />

      {/* ADD STUDENT */}

      <StudentFormModal
        visible={showAddStudent}
        mode="add"
        onClose={() => setShowAddStudent(false)}
        onSaved={() => void loadStudents(true)}
        onOpenProfile={(id) => {
          setShowAddStudent(false);
          router.push(`/admin/students/${id}` as any);
        }}
      />

      {/* LOGOUT */}

      <LogoutModal
        visible={showLogoutModal}
        loading={logoutLoading}
        onCancel={handleCancelLogout}
        onConfirm={performLogout}
      />
    </View>
  );
}
