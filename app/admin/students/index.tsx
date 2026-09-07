import { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { useRouter } from "expo-router";

import { useAuth } from "@/hooks/use-auth";

import DeleteModal from "@/components/deletationmodal";
import LogoutModal from "@/components/logout-modal";
import SuccessModal from "@/components/success-modal";
import WarningModal from "@/components/warningmodal";

import { API_BASE } from "@/constants/api";

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
};

type NavItem = {
  label: string;

  route: string;

  icon?: any;
};

// ==========================================
// STUDENTS DIRECTORY
// ==========================================

export default function StudentsDirectory() {
  const router = useRouter();

  const { logout } = useAuth();

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  // ==========================================
  // LOGOUT MODAL
  // ==========================================

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  // ==========================================
  // DELETE MODAL
  // ==========================================

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);

  // ==========================================
  // WARNING MODAL
  // ==========================================

  const [showWarningModal, setShowWarningModal] = useState(false);

  const [warningTitle, setWarningTitle] = useState("");

  const [warningMessage, setWarningMessage] = useState("");

  // ==========================================
  // STUDENTS
  // ==========================================

  const [students, setStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ==========================================
  // SEARCH
  // ==========================================

  const [search, setSearch] = useState("");

  // ==========================================
  // FILTERS
  // ==========================================

  const [selectedGrade, setSelectedGrade] = useState("ALL");

  const [selectedSection, setSelectedSection] = useState("ALL");

  const [showGradeMenu, setShowGradeMenu] = useState(false);

  const [showSectionMenu, setShowSectionMenu] = useState(false);

  // ==========================================
  // DELETE SELECTION
  // ==========================================

  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    null,
  );

  const [deleteLoading, setDeleteLoading] = useState(false);

  // ==========================================
  // NAVIGATION
  // ==========================================

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

  // ==========================================
  // LOAD STUDENTS
  // ==========================================

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await fetch(`${API_BASE}/api/students`);

      const data = await response.json();

      console.log("Students response:", data);

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to load students.");

        return;
      }

      setStudents(data.students || []);
    } catch (error) {
      console.error("Students connection error:", error);

      setError("Could not connect to the SmartFine server.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // GRADE OPTIONS
  // ==========================================

  const gradeOptions = useMemo(() => {
    const grades = students
      .map((student) => student.grade_level)
      .filter((grade): grade is string => Boolean(grade));

    return Array.from(new Set(grades));
  }, [students]);

  // ==========================================
  // SECTION OPTIONS
  // ==========================================

  const sectionOptions = useMemo(() => {
    const sections = students
      .map((student) => student.section)
      .filter((section): section is string => Boolean(section));

    return Array.from(new Set(sections));
  }, [students]);

  // ==========================================
  // FILTER STUDENTS
  // ==========================================

  const filteredStudents = useMemo(() => {
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

  // ==========================================
  // SELECTED STUDENT
  // ==========================================

  const selectedStudent =
    students.find((student) => student.id === selectedStudentId) || null;

  // ==========================================
  // STATUS HELPERS
  // ==========================================

  const isInactiveStudent = (status: string) => {
    const normalizedStatus = String(status || "").toUpperCase();

    return (
      normalizedStatus === "INACTIVE" || normalizedStatus === "DEACTIVATED"
    );
  };

  const getStatusLabel = (status: string) => {
    const normalizedStatus = String(status || "").toUpperCase();

    if (normalizedStatus === "ACTIVE") {
      return "Active";
    }

    if (normalizedStatus === "INACTIVE" || normalizedStatus === "DEACTIVATED") {
      return "Inactive";
    }

    return status || "Unknown";
  };

  // ==========================================
  // NAVIGATION
  // ==========================================

  const handleNavigation = (item: NavItem) => {
    router.push(item.route as any);
  };

  // ==========================================
  // OPEN STUDENT PROFILE
  // ==========================================

  const handleStudentPress = (studentId: number) => {
    router.push(`/admin/students/${studentId}` as any);
  };

  // ==========================================
  // SELECT STUDENT
  // ==========================================

  const handleSelectStudent = (student: Student) => {
    if (!isInactiveStudent(student.account_status)) {
      return;
    }

    setSelectedStudentId((currentId) =>
      currentId === student.id ? null : student.id,
    );
  };

  // ==========================================
  // ADD STUDENT
  // ==========================================

  const handleAddStudent = () => {
    router.push("/admin/students/add" as any);
  };

  // ==========================================
  // OPEN DELETE CONFIRMATION
  // ==========================================

  const handleDeleteStudent = () => {
    if (!selectedStudent) {
      setWarningTitle("Delete Student");

      setWarningMessage("Please select an inactive student first.");

      setShowWarningModal(true);

      return;
    }

    if (!isInactiveStudent(selectedStudent.account_status)) {
      setWarningTitle("Delete Student");

      setWarningMessage(
        "Active students cannot be deleted. Deactivate the student account first.",
      );

      setShowWarningModal(true);

      return;
    }

    setShowDeleteModal(true);
  };

  // ==========================================
  // CANCEL DELETE
  // ==========================================

  const handleCancelDelete = () => {
    if (deleteLoading) {
      return;
    }

    setShowDeleteModal(false);
  };

  // ==========================================
  // PERFORM DELETE
  // ==========================================

  const performDeleteStudent = async () => {
    if (
      !selectedStudent ||
      !isInactiveStudent(selectedStudent.account_status)
    ) {
      return;
    }

    try {
      setDeleteLoading(true);

      const response = await fetch(
        `${API_BASE}/api/students/${selectedStudent.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      console.log("Delete student response:", data);

      // ======================================
      // DELETE REJECTED BY BACKEND
      // ======================================

      if (!response.ok || !data.success) {
        setShowDeleteModal(false);

        setWarningTitle("Delete Student");

        setWarningMessage(data.message || "Could not delete the student.");

        setShowWarningModal(true);

        return;
      }

      // ======================================
      // DELETE SUCCESS
      // ======================================

      setShowDeleteModal(false);

      setSelectedStudentId(null);

      await loadStudents();

      setShowDeleteSuccessModal(true);
    } catch (error) {
      console.error("Delete student error:", error);

      setShowDeleteModal(false);

      setWarningTitle("Connection Error");

      setWarningMessage("Could not connect to the SmartFine server.");

      setShowWarningModal(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

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

      console.log("Logout confirmation accepted.");

      await logout();

      setShowLogoutModal(false);

      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);

      setWarningTitle("Logout Error");

      setWarningMessage("Could not log out. Please try again.");

      setShowWarningModal(true);
    } finally {
      setLogoutLoading(false);
    }
  };

  // ==========================================
  // GENERAL MESSAGE
  // ==========================================

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);

      return;
    }

    Alert.alert(title, message);
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <View style={styles.screen}>
      {/* ======================================
          SIDEBAR
      ====================================== */}

      {isTablet && (
        <View style={styles.sidebar}>
          {/* LOGO */}

          <View style={styles.logoArea}>
            <Image
              source={require("../../../assets/branding/smartfineNoBG.png")}
              style={styles.smartFineLogo}
              resizeMode="contain"
            />
          </View>

          {/* NAVIGATION */}

          <View style={styles.navigation}>
            {navItems.map((item) => {
              const isActive = item.label === "Students";

              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => handleNavigation(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.navIconContainer}>
                    <Image
                      source={item.icon}
                      style={styles.navImageIcon}
                      resizeMode="contain"
                    />
                  </View>

                  <Text style={styles.navText}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* LOGOUT */}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ======================================
          MAIN
      ====================================== */}

      <View style={styles.main}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <Text style={styles.pageTitle}>Students Directory</Text>
          </View>

          {/* ==================================
              MOBILE NAVIGATION
          ================================== */}

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
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ==================================
              TOOLBAR
          ================================== */}

          <View style={styles.toolbar}>
            {/* SEARCH */}

            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>⌕</Text>

              <TextInput
                style={styles.searchInput}
                placeholder="Search student by name or ID"
                placeholderTextColor="#8C939F"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* FILTERS */}

            <View style={styles.filtersContainer}>
              {/* GRADE */}

              <View style={styles.filterWrapper}>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => {
                    setShowGradeMenu(!showGradeMenu);

                    setShowSectionMenu(false);
                  }}
                >
                  <Text style={styles.filterText}>
                    {selectedGrade === "ALL" ? "Grade" : selectedGrade}
                  </Text>

                  <Text style={styles.filterArrow}>▼</Text>
                </TouchableOpacity>

                {showGradeMenu && (
                  <View style={styles.filterMenu}>
                    <TouchableOpacity
                      style={styles.filterOption}
                      onPress={() => {
                        setSelectedGrade("ALL");

                        setShowGradeMenu(false);
                      }}
                    >
                      <Text style={styles.filterOptionText}>All Grades</Text>
                    </TouchableOpacity>

                    {gradeOptions.map((grade) => (
                      <TouchableOpacity
                        key={grade}
                        style={styles.filterOption}
                        onPress={() => {
                          setSelectedGrade(grade);

                          setShowGradeMenu(false);
                        }}
                      >
                        <Text style={styles.filterOptionText}>{grade}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* SECTION */}

              <View style={styles.filterWrapper}>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => {
                    setShowSectionMenu(!showSectionMenu);

                    setShowGradeMenu(false);
                  }}
                >
                  <Text style={styles.filterText}>
                    {selectedSection === "ALL" ? "Section" : selectedSection}
                  </Text>

                  <Text style={styles.filterArrow}>▼</Text>
                </TouchableOpacity>

                {showSectionMenu && (
                  <View style={styles.filterMenu}>
                    <TouchableOpacity
                      style={styles.filterOption}
                      onPress={() => {
                        setSelectedSection("ALL");

                        setShowSectionMenu(false);
                      }}
                    >
                      <Text style={styles.filterOptionText}>All Sections</Text>
                    </TouchableOpacity>

                    {sectionOptions.map((section) => (
                      <TouchableOpacity
                        key={section}
                        style={styles.filterOption}
                        onPress={() => {
                          setSelectedSection(section);

                          setShowSectionMenu(false);
                        }}
                      >
                        <Text style={styles.filterOptionText}>{section}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* ADD STUDENT */}

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddStudent}
              activeOpacity={0.85}
            >
              <Text style={styles.addButtonText}>+ Add New Student</Text>
            </TouchableOpacity>
          </View>

          {/* ==================================
              TABLE CARD
          ================================== */}

          <View style={styles.tableCard}>
            {loading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color="#173A73" />

                <Text style={styles.stateText}>Loading students...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerState}>
                <Text style={styles.errorText}>{error}</Text>

                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={loadStudents}
                >
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.table}>
                    {/* TABLE HEADER */}

                    <View style={styles.tableHeader}>
                      <View style={styles.selectColumn} />

                      <Text style={[styles.headerCell, styles.studentIdColumn]}>
                        Student ID
                      </Text>

                      <Text style={[styles.headerCell, styles.nameColumn]}>
                        Full Name
                      </Text>

                      <Text
                        style={[styles.headerCell, styles.gradeSectionColumn]}
                      >
                        Grade / Section
                      </Text>

                      <Text style={[styles.headerCell, styles.totalColumn]}>
                        Total Fines
                      </Text>

                      <Text style={[styles.headerCell, styles.balanceColumn]}>
                        Outstanding Balance
                      </Text>

                      <Text style={[styles.headerCell, styles.statusColumn]}>
                        Status
                      </Text>
                    </View>

                    {/* STUDENT ROWS */}

                    {filteredStudents.length === 0 ? (
                      <View style={styles.emptyRow}>
                        <Text style={styles.emptyText}>No students found.</Text>
                      </View>
                    ) : (
                      filteredStudents.map((student) => {
                        const normalizedStatus = String(
                          student.account_status || "",
                        ).toUpperCase();

                        const isActive = normalizedStatus === "ACTIVE";

                        const isInactive = isInactiveStudent(
                          student.account_status,
                        );

                        const isSelected = selectedStudentId === student.id;

                        const balance =
                          Number(student.outstanding_balance) || 0;

                        const gradeSection =
                          student.grade_level && student.section
                            ? `${student.grade_level} - ${student.section}`
                            : student.grade_level
                              ? student.grade_level
                              : student.section
                                ? student.section
                                : "Not Assigned";

                        return (
                          <View
                            key={student.id}
                            style={[
                              styles.studentRow,

                              isSelected && styles.studentRowSelected,
                            ]}
                          >
                            {/* DELETE SELECTOR */}

                            <View style={styles.selectColumn}>
                              {isInactive && (
                                <TouchableOpacity
                                  style={[
                                    styles.selectCircle,

                                    isSelected && styles.selectCircleSelected,
                                  ]}
                                  onPress={() => handleSelectStudent(student)}
                                >
                                  {isSelected && (
                                    <Text style={styles.selectCheck}>✓</Text>
                                  )}
                                </TouchableOpacity>
                              )}
                            </View>

                            {/* PROFILE ROW */}

                            <TouchableOpacity
                              style={styles.rowMain}
                              activeOpacity={0.7}
                              onPress={() => handleStudentPress(student.id)}
                            >
                              <Text
                                style={[
                                  styles.bodyCell,
                                  styles.studentIdColumn,
                                ]}
                              >
                                {student.student_id}
                              </Text>

                              <Text
                                style={[
                                  styles.bodyCell,
                                  styles.nameColumn,
                                  styles.studentName,
                                ]}
                              >
                                {student.full_name}
                              </Text>

                              <Text
                                style={[
                                  styles.bodyCell,
                                  styles.gradeSectionColumn,
                                ]}
                              >
                                {gradeSection}
                              </Text>

                              <Text
                                style={[styles.bodyCell, styles.totalColumn]}
                              >
                                ₱{Number(student.total_fines || 0).toFixed(2)}
                              </Text>

                              <Text
                                style={[
                                  styles.bodyCell,
                                  styles.balanceColumn,

                                  balance > 0
                                    ? styles.balanceDanger
                                    : styles.balanceZero,
                                ]}
                              >
                                ₱{balance.toFixed(2)}
                              </Text>

                              <Text
                                style={[
                                  styles.bodyCell,
                                  styles.statusColumn,

                                  isActive
                                    ? styles.statusActive
                                    : isInactive
                                      ? styles.statusInactive
                                      : styles.statusOther,
                                ]}
                              >
                                {getStatusLabel(student.account_status)}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })
                    )}
                  </View>
                </ScrollView>

                {/* ==================================
                    TABLE FOOTER
                ================================== */}

                <View style={styles.tableFooter}>
                  <View>
                    <Text style={styles.totalStudentsText}>
                      Total Students: {students.length}
                    </Text>

                    {selectedStudent && (
                      <Text style={styles.selectedStudentText}>
                        Selected: {selectedStudent.full_name}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.deleteButton,

                      (!selectedStudent || deleteLoading) &&
                        styles.deleteButtonDisabled,
                    ]}
                    onPress={handleDeleteStudent}
                    disabled={deleteLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.deleteButtonText}>
                      {deleteLoading ? "Deleting..." : "Delete Student"}
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

      {/* ======================================
          DELETE CONFIRMATION
      ====================================== */}

      <DeleteModal
        visible={showDeleteModal}
        loading={deleteLoading}
        title="Delete Student?"
        message={
          selectedStudent
            ? `Are you sure you want to permanently delete ${selectedStudent.full_name}?`
            : ""
        }
        onCancel={handleCancelDelete}
        onConfirm={performDeleteStudent}
      />

      {/* ======================================
          DELETE SUCCESS
      ====================================== */}

      <SuccessModal
        visible={showDeleteSuccessModal}
        title="Student Deleted"
        message="The inactive student was deleted successfully."
        buttonText="OK"
        onClose={() => setShowDeleteSuccessModal(false)}
      />

      {/* ======================================
          WARNING MODAL
      ====================================== */}

      <WarningModal
        visible={showWarningModal}
        title={warningTitle}
        message={warningMessage}
        buttonText="OK"
        onClose={() => {
          setShowWarningModal(false);
        }}
      />

      {/* ======================================
          LOGOUT MODAL
      ====================================== */}

      <LogoutModal
        visible={showLogoutModal}
        loading={logoutLoading}
        onCancel={handleCancelLogout}
        onConfirm={performLogout}
      />
    </View>
  );
}
