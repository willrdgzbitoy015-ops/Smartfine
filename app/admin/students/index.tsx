import { useEffect, useMemo, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';

import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';

import { styles } from './students.styles';
import { API_BASE } from '@/constants/api';

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

  const { width } =
    useWindowDimensions();

  const isTablet =
    width >= 768;

  // ==========================================
  // STUDENTS
  // ==========================================

  const [students, setStudents] =
    useState<Student[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  // ==========================================
  // SEARCH
  // ==========================================

  const [search, setSearch] =
    useState('');

  // ==========================================
  // FILTERS
  // ==========================================

  const [selectedGrade, setSelectedGrade] =
    useState('ALL');

  const [selectedSection, setSelectedSection] =
    useState('ALL');

  const [showGradeMenu, setShowGradeMenu] =
    useState(false);

  const [showSectionMenu, setShowSectionMenu] =
    useState(false);

  // ==========================================
  // DELETE SELECTION
  // ==========================================

  const [
    selectedStudentId,
    setSelectedStudentId,
  ] = useState<number | null>(null);

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/admin/dashboard',
      icon: require('../../../assets/icons/dashboard.png'),
    },

    {
      label: 'Students',
      route: '/admin/students',
      icon: require('../../../assets/icons/students.png'),
    },

    {
      label: 'Fines',
      route: '/admin/fines',
      icon: require('../../../assets/icons/fines.png'),
    },

    {
      label: 'QR Scanner',
      route: '/admin/qr-scanner',
      icon: require('../../../assets/icons/qr-codeWhite.png'),
    },

    {
      label: 'Reports',
      route: '/admin/reports',
      icon: require('../../../assets/icons/reports.png'),
    },

    {
      label: 'Settings',
      route: '/admin/settings',
      icon: require('../../../assets/icons/settings.png'),
    },

    {
      label: 'Officers',
      route: '/admin/officers',
      icon: require('../../../assets/icons/officers.png'),
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

      setError('');

      const response = await fetch(
        `${API_BASE}/api/students`
      );

      const data =
        await response.json();

      console.log(
        'Students response:',
        data
      );

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            'Failed to load students.'
        );

        return;
      }

      setStudents(
        data.students || []
      );
    } catch (error) {
      console.error(
        'Students connection error:',
        error
      );

      setError(
        'Could not connect to the SmartFine server.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // GRADE OPTIONS
  // ==========================================

  const gradeOptions =
    useMemo(() => {
      const grades =
        students
          .map(
            (student) =>
              student.grade_level
          )
          .filter(
            (
              grade
            ): grade is string =>
              Boolean(grade)
          );

      return Array.from(
        new Set(grades)
      );
    }, [students]);

  // ==========================================
  // SECTION OPTIONS
  // ==========================================

  const sectionOptions =
    useMemo(() => {
      const sections =
        students
          .map(
            (student) =>
              student.section
          )
          .filter(
            (
              section
            ): section is string =>
              Boolean(section)
          );

      return Array.from(
        new Set(sections)
      );
    }, [students]);

  // ==========================================
  // FILTER STUDENTS
  // ==========================================

  const filteredStudents =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return students.filter(
        (student) => {
          const studentId =
            String(
              student.student_id ||
                ''
            ).toLowerCase();

          const fullName =
            String(
              student.full_name ||
                ''
            ).toLowerCase();

          const matchesSearch =
            !normalizedSearch ||
            studentId.includes(
              normalizedSearch
            ) ||
            fullName.includes(
              normalizedSearch
            );

          const matchesGrade =
            selectedGrade ===
              'ALL' ||
            student.grade_level ===
              selectedGrade;

          const matchesSection =
            selectedSection ===
              'ALL' ||
            student.section ===
              selectedSection;

          return (
            matchesSearch &&
            matchesGrade &&
            matchesSection
          );
        }
      );
    }, [
      students,
      search,
      selectedGrade,
      selectedSection,
    ]);

  // ==========================================
  // SELECTED STUDENT
  // ==========================================

  const selectedStudent =
    students.find(
      (student) =>
        student.id ===
        selectedStudentId
    ) || null;

  // ==========================================
  // STATUS HELPERS
  // ==========================================

  const isInactiveStudent = (
    status: string
  ) => {
    const normalizedStatus =
      String(
        status || ''
      ).toUpperCase();

    return (
      normalizedStatus ===
        'INACTIVE' ||
      normalizedStatus ===
        'DEACTIVATED'
    );
  };

  const getStatusLabel = (
    status: string
  ) => {
    const normalizedStatus =
      String(
        status || ''
      ).toUpperCase();

    if (
      normalizedStatus ===
      'ACTIVE'
    ) {
      return 'Active';
    }

    if (
      normalizedStatus ===
        'INACTIVE' ||
      normalizedStatus ===
        'DEACTIVATED'
    ) {
      return 'Inactive';
    }

    return status || 'Unknown';
  };

  // ==========================================
  // NAVIGATION HANDLER
  // ==========================================

  const handleNavigation = (
    item: NavItem
  ) => {
    router.push(
      item.route as any
    );
  };

  // ==========================================
  // OPEN STUDENT PROFILE
  // ==========================================

  const handleStudentPress = (
    studentId: number
  ) => {
    router.push(
      `/admin/students/${studentId}` as any
    );
  };

  // ==========================================
  // SELECT STUDENT FOR DELETE
  // ==========================================

  const handleSelectStudent = (
    student: Student
  ) => {
    if (
      !isInactiveStudent(
        student.account_status
      )
    ) {
      return;
    }

    setSelectedStudentId(
      (currentId) =>
        currentId ===
        student.id
          ? null
          : student.id
    );
  };

  // ==========================================
  // ADD STUDENT
  // ==========================================

  const handleAddStudent = () => {
    router.push(
      '/admin/students/add' as any
    );
  };

  // ==========================================
  // DELETE STUDENT
  // ==========================================

  const performDeleteStudent =
    async () => {
      if (
        !selectedStudent ||
        !isInactiveStudent(
          selectedStudent.account_status
        )
      ) {
        return;
      }

      try {
        setDeleteLoading(true);

        const response = await fetch(
          `${API_BASE}/api/students/${selectedStudent.id}`,
          {
            method: 'DELETE',
          }
        );

        const data =
          await response.json();

        console.log(
          'Delete student response:',
          data
        );

        if (
          !response.ok ||
          !data.success
        ) {
          showMessage(
            'Delete Student',
            data.message ||
              'Could not delete the student.'
          );

          return;
        }

        setSelectedStudentId(
          null
        );

        await loadStudents();

        showMessage(
          'Student Deleted',
          'The inactive student was deleted successfully.'
        );
      } catch (error) {
        console.error(
          'Delete student error:',
          error
        );

        showMessage(
          'Connection Error',
          'Could not connect to the SmartFine server.'
        );
      } finally {
        setDeleteLoading(false);
      }
    };

  const handleDeleteStudent = () => {
    // No selected student

    if (!selectedStudent) {
      showMessage(
        'Delete Student',
        'Please select an inactive student first.'
      );

      return;
    }

    // Selected student is still active

    if (
      !isInactiveStudent(
        selectedStudent.account_status
      )
    ) {
      showMessage(
        'Delete Student',
        'Active students cannot be deleted. Deactivate the student account first.'
      );

      return;
    }

    const message =
      `Are you sure you want to permanently delete ` +
      `${selectedStudent.full_name}?`;

    // WEB

    if (
      Platform.OS === 'web'
    ) {
      const confirmed =
        window.confirm(message);

      if (confirmed) {
        performDeleteStudent();
      }

      return;
    }

    // ANDROID / IOS

    Alert.alert(
      'Delete Student',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Delete',
          style: 'destructive',
          onPress:
            performDeleteStudent,
        },
      ]
    );
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const performLogout =
    async () => {
      try {
        await logout();

        router.replace('/login');
      } catch (error) {
        console.error(
          'Logout error:',
          error
        );

        showMessage(
          'Logout Error',
          'Could not log out. Please try again.'
        );
      }
    };

  const handleLogout = () => {
    if (
      Platform.OS === 'web'
    ) {
      const confirmed =
        window.confirm(
          'Are you sure you want to log out?'
        );

      if (confirmed) {
        performLogout();
      }

      return;
    }

    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Log Out',
          style: 'destructive',
          onPress:
            performLogout,
        },
      ]
    );
  };

  // ==========================================
  // MESSAGE
  // ==========================================

  const showMessage = (
    title: string,
    message: string
  ) => {
    if (
      Platform.OS === 'web'
    ) {
      window.alert(
        `${title}\n\n${message}`
      );

      return;
    }

    Alert.alert(
      title,
      message
    );
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
        <View
          style={
            styles.sidebar
          }
        >
          {/* LOGO */}

          <View
            style={
              styles.logoArea
            }
          >
            <Image
              source={require('../../../assets/branding/smartfineNoBG.png')}
              style={
                styles.smartFineLogo
              }
              resizeMode="contain"
            />
          </View>

          {/* NAVIGATION */}

          <View
            style={
              styles.navigation
            }
          >
            {navItems.map(
              (item) => {
                const isActive =
                  item.label ===
                  'Students';

                return (
                  <TouchableOpacity
                    key={
                      item.label
                    }
                    style={[
                      styles.navItem,

                      isActive &&
                        styles.navItemActive,
                    ]}
                    onPress={() =>
                      handleNavigation(
                        item
                      )
                    }
                  >
                    <View
                      style={styles.navIconContainer}
                    >
                      <Image
                        source={item.icon}
                        style={styles.navImageIcon}
                        resizeMode="contain"
                      />
                    </View>

                    <Text
                      style={
                        styles.navText
                      }
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>

          {/* LOGOUT */}

          <TouchableOpacity
            style={
              styles.logoutButton
            }
            onPress={
              handleLogout
            }
          >
            <Text
              style={
                styles.logoutText
              }
            >
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ======================================
          MAIN
      ====================================== */}

      <View
        style={
          styles.main
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* HEADER */}

          <View
            style={
              styles.header
            }
          >
            <Text
              style={
                styles.pageTitle
              }
            >
              Students Directory
            </Text>
          </View>

          {/* ==================================
              MOBILE NAVIGATION
          ================================== */}

          {!isTablet && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.mobileNav
              }
            >
              {navItems.map(
                (item) => {
                  const isActive =
                    item.label ===
                    'Students';

                  return (
                    <TouchableOpacity
                      key={
                        item.label
                      }
                      style={[
                        styles.mobileNavItem,

                        isActive &&
                          styles.mobileNavItemActive,
                      ]}
                      onPress={() =>
                        handleNavigation(
                          item
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.mobileNavText,

                          isActive &&
                            styles.mobileNavTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>
          )}

          {/* ==================================
              TOOLBAR
          ================================== */}

          <View
            style={
              styles.toolbar
            }
          >
            {/* SEARCH */}

            <View
              style={
                styles.searchContainer
              }
            >
              <Text
                style={
                  styles.searchIcon
                }
              >
                ⌕
              </Text>

              <TextInput
                style={
                  styles.searchInput
                }
                placeholder="Search student by name or ID"
                placeholderTextColor="#8C939F"
                value={search}
                onChangeText={
                  setSearch
                }
              />
            </View>

            {/* FILTERS */}

            <View
              style={
                styles.filtersContainer
              }
            >
              {/* GRADE */}

              <View
                style={
                  styles.filterWrapper
                }
              >
                <TouchableOpacity
                  style={
                    styles.filterButton
                  }
                  onPress={() => {
                    setShowGradeMenu(
                      !showGradeMenu
                    );

                    setShowSectionMenu(
                      false
                    );
                  }}
                >
                  <Text
                    style={
                      styles.filterText
                    }
                  >
                    {selectedGrade ===
                    'ALL'
                      ? 'Grade'
                      : selectedGrade}
                  </Text>

                  <Text
                    style={
                      styles.filterArrow
                    }
                  >
                    ▼
                  </Text>
                </TouchableOpacity>

                {showGradeMenu && (
                  <View
                    style={
                      styles.filterMenu
                    }
                  >
                    <TouchableOpacity
                      style={
                        styles.filterOption
                      }
                      onPress={() => {
                        setSelectedGrade(
                          'ALL'
                        );

                        setShowGradeMenu(
                          false
                        );
                      }}
                    >
                      <Text
                        style={
                          styles.filterOptionText
                        }
                      >
                        All Grades
                      </Text>
                    </TouchableOpacity>

                    {gradeOptions.map(
                      (grade) => (
                        <TouchableOpacity
                          key={
                            grade
                          }
                          style={
                            styles.filterOption
                          }
                          onPress={() => {
                            setSelectedGrade(
                              grade
                            );

                            setShowGradeMenu(
                              false
                            );
                          }}
                        >
                          <Text
                            style={
                              styles.filterOptionText
                            }
                          >
                            {grade}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                )}
              </View>

              {/* SECTION */}

              <View
                style={
                  styles.filterWrapper
                }
              >
                <TouchableOpacity
                  style={
                    styles.filterButton
                  }
                  onPress={() => {
                    setShowSectionMenu(
                      !showSectionMenu
                    );

                    setShowGradeMenu(
                      false
                    );
                  }}
                >
                  <Text
                    style={
                      styles.filterText
                    }
                  >
                    {selectedSection ===
                    'ALL'
                      ? 'Section'
                      : selectedSection}
                  </Text>

                  <Text
                    style={
                      styles.filterArrow
                    }
                  >
                    ▼
                  </Text>
                </TouchableOpacity>

                {showSectionMenu && (
                  <View
                    style={
                      styles.filterMenu
                    }
                  >
                    <TouchableOpacity
                      style={
                        styles.filterOption
                      }
                      onPress={() => {
                        setSelectedSection(
                          'ALL'
                        );

                        setShowSectionMenu(
                          false
                        );
                      }}
                    >
                      <Text
                        style={
                          styles.filterOptionText
                        }
                      >
                        All Sections
                      </Text>
                    </TouchableOpacity>

                    {sectionOptions.map(
                      (section) => (
                        <TouchableOpacity
                          key={
                            section
                          }
                          style={
                            styles.filterOption
                          }
                          onPress={() => {
                            setSelectedSection(
                              section
                            );

                            setShowSectionMenu(
                              false
                            );
                          }}
                        >
                          <Text
                            style={
                              styles.filterOptionText
                            }
                          >
                            {section}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* ADD STUDENT */}

            <TouchableOpacity
              style={
                styles.addButton
              }
              onPress={
                handleAddStudent
              }
            >
              <Text
                style={
                  styles.addButtonText
                }
              >
                + Add New Student
              </Text>
            </TouchableOpacity>
          </View>

          {/* ==================================
              TABLE CARD
          ================================== */}

          <View
            style={
              styles.tableCard
            }
          >
            {loading ? (
              <View
                style={
                  styles.centerState
                }
              >
                <ActivityIndicator
                  size="large"
                  color="#173A73"
                />

                <Text
                  style={
                    styles.stateText
                  }
                >
                  Loading students...
                </Text>
              </View>
            ) : error ? (
              <View
                style={
                  styles.centerState
                }
              >
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {error}
                </Text>

                <TouchableOpacity
                  style={
                    styles.retryButton
                  }
                  onPress={
                    loadStudents
                  }
                >
                  <Text
                    style={
                      styles.retryText
                    }
                  >
                    Try Again
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                >
                  <View
                    style={
                      styles.table
                    }
                  >
                    {/* TABLE HEADER */}

                    <View
                      style={
                        styles.tableHeader
                      }
                    >
                      <View
                        style={
                          styles.selectColumn
                        }
                      />

                      <Text
                        style={[
                          styles.headerCell,
                          styles.studentIdColumn,
                        ]}
                      >
                        Student ID
                      </Text>

                      <Text
                        style={[
                          styles.headerCell,
                          styles.nameColumn,
                        ]}
                      >
                        Full Name
                      </Text>

                      <Text
                        style={[
                          styles.headerCell,
                          styles.gradeSectionColumn,
                        ]}
                      >
                        Grade / Section
                      </Text>

                      <Text
                        style={[
                          styles.headerCell,
                          styles.totalColumn,
                        ]}
                      >
                        Total Fines
                      </Text>

                      <Text
                        style={[
                          styles.headerCell,
                          styles.balanceColumn,
                        ]}
                      >
                        Outstanding Balance
                      </Text>

                      <Text
                        style={[
                          styles.headerCell,
                          styles.statusColumn,
                        ]}
                      >
                        Status
                      </Text>
                    </View>

                    {/* ==================================
                        STUDENT ROWS
                    ================================== */}

                    {filteredStudents.length ===
                    0 ? (
                      <View
                        style={
                          styles.emptyRow
                        }
                      >
                        <Text
                          style={
                            styles.emptyText
                          }
                        >
                          No students found.
                        </Text>
                      </View>
                    ) : (
                      filteredStudents.map(
                        (student) => {
                          const normalizedStatus =
                            String(
                              student.account_status ||
                                ''
                            ).toUpperCase();

                          const isActive =
                            normalizedStatus ===
                            'ACTIVE';

                          const isInactive =
                            isInactiveStudent(
                              student.account_status
                            );

                          const isSelected =
                            selectedStudentId ===
                            student.id;

                          const balance =
                            Number(
                              student.outstanding_balance
                            ) || 0;

                          const gradeSection =
                            student.grade_level &&
                            student.section
                              ? `${student.grade_level} - ${student.section}`
                              : student.grade_level
                                ? student.grade_level
                                : student.section
                                  ? student.section
                                  : 'Not Assigned';

                          return (
                            <View
                              key={
                                student.id
                              }
                              style={[
                                styles.studentRow,

                                isSelected &&
                                  styles.studentRowSelected,
                              ]}
                            >
                              {/* DELETE SELECTOR */}

                              <View
                                style={
                                  styles.selectColumn
                                }
                              >
                                {isInactive && (
                                  <TouchableOpacity
                                    style={[
                                      styles.selectCircle,

                                      isSelected &&
                                        styles.selectCircleSelected,
                                    ]}
                                    onPress={() =>
                                      handleSelectStudent(
                                        student
                                      )
                                    }
                                  >
                                    {isSelected && (
                                      <Text
                                        style={
                                          styles.selectCheck
                                        }
                                      >
                                        ✓
                                      </Text>
                                    )}
                                  </TouchableOpacity>
                                )}
                              </View>

                              {/* CLICKABLE PROFILE AREA */}

                              <TouchableOpacity
                                style={
                                  styles.rowMain
                                }
                                activeOpacity={
                                  0.7
                                }
                                onPress={() =>
                                  handleStudentPress(
                                    student.id
                                  )
                                }
                              >
                                <Text
                                  style={[
                                    styles.bodyCell,
                                    styles.studentIdColumn,
                                  ]}
                                >
                                  {
                                    student.student_id
                                  }
                                </Text>

                                <Text
                                  style={[
                                    styles.bodyCell,
                                    styles.nameColumn,
                                    styles.studentName,
                                  ]}
                                >
                                  {
                                    student.full_name
                                  }
                                </Text>

                                <Text
                                  style={[
                                    styles.bodyCell,
                                    styles.gradeSectionColumn,
                                  ]}
                                >
                                  {
                                    gradeSection
                                  }
                                </Text>

                                <Text
                                  style={[
                                    styles.bodyCell,
                                    styles.totalColumn,
                                  ]}
                                >
                                  ₱
                                  {Number(
                                    student.total_fines ||
                                      0
                                  ).toFixed(
                                    2
                                  )}
                                </Text>

                                <Text
                                  style={[
                                    styles.bodyCell,
                                    styles.balanceColumn,

                                    balance >
                                      0
                                      ? styles.balanceDanger
                                      : styles.balanceZero,
                                  ]}
                                >
                                  ₱
                                  {balance.toFixed(
                                    2
                                  )}
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
                                  {getStatusLabel(
                                    student.account_status
                                  )}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          );
                        }
                      )
                    )}
                  </View>
                </ScrollView>

                {/* ==================================
                    TABLE FOOTER
                ================================== */}

                <View
                  style={
                    styles.tableFooter
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.totalStudentsText
                      }
                    >
                      Total Students:{' '}
                      {students.length}
                    </Text>

                    {selectedStudent && (
                      <Text
                        style={
                          styles.selectedStudentText
                        }
                      >
                        Selected:{' '}
                        {
                          selectedStudent.full_name
                        }
                      </Text>
                    )}
                  </View>

                  {/* DELETE BUTTON */}

                  <TouchableOpacity
                    style={[
                      styles.deleteButton,

                      (!selectedStudent ||
                        deleteLoading) &&
                        styles.deleteButtonDisabled,
                    ]}
                    onPress={
                      handleDeleteStudent
                    }
                    disabled={
                      deleteLoading
                    }
                  >
                    <Text
                      style={
                        styles.deleteButtonText
                      }
                    >
                      {deleteLoading
                        ? 'Deleting...'
                        : 'Delete Student'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text
                  style={
                    styles.deleteHint
                  }
                >
                  Only inactive students can be selected for deletion.
                </Text>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
