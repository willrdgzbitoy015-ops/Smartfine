import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Image,
  Alert,
  Platform,
} from 'react-native';

import {
  useRouter,
} from 'expo-router';

import {
  useAuth,
} from '@/hooks/use-auth';

import {
  API_BASE,
} from '@/constants/api';

import {
  styles,
} from './add-fine.styles';

// ==========================================
// TYPES
// ==========================================

type StudentOption = {
  id: number;
  student_id: string;
  username: string;

  first_name: string;
  middle_name: string | null;
  last_name: string;

  full_name: string;

  grade_level: string | null;
  section: string | null;
};

type ViolationOption = {
  id: number;

  violation_code:
    | string
    | null;

  violation_name: string;

  description:
    | string
    | null;

  amount_centavos: number;

  amount: number;
};

type OfficerOption = {
  id: number;

  username: string;

  first_name: string;
  middle_name: string | null;
  last_name: string;

  full_name: string;

  role: string;
};

type NavItem = {
  label: string;
  route: string;
};

// ==========================================
// ADD FINE SCREEN
// ==========================================

export default function AddFine() {
  const router =
    useRouter();

  const { logout } =
    useAuth();

  const { width } =
    useWindowDimensions();

  const isTablet =
    width >= 768;

  // ==========================================
  // OPTIONS
  // ==========================================

  const [
    students,
    setStudents,
  ] = useState<StudentOption[]>([]);

  const [
    violations,
    setViolations,
  ] = useState<
    ViolationOption[]
  >([]);

  const [
    officers,
    setOfficers,
  ] = useState<
    OfficerOption[]
  >([]);

  // ==========================================
  // STUDENT SEARCH
  // ==========================================

  const [
    studentSearch,
    setStudentSearch,
  ] = useState('');

  const [
    studentSuggestionsOpen,
    setStudentSuggestionsOpen,
  ] = useState(false);

  const [
    selectedStudentId,
    setSelectedStudentId,
  ] = useState<
    number | null
  >(null);

  // ==========================================
  // VIOLATION
  // ==========================================

  const [
    selectedViolationId,
    setSelectedViolationId,
  ] = useState<
    number | null
  >(null);

  const [
    violationMenuOpen,
    setViolationMenuOpen,
  ] = useState(false);

  // ==========================================
  // OFFICER
  // ==========================================

  const [
    selectedOfficerId,
    setSelectedOfficerId,
  ] = useState<
    number | null
  >(null);

  const [
    officerMenuOpen,
    setOfficerMenuOpen,
  ] = useState(false);

  // ==========================================
  // OTHER FORM VALUES
  // ==========================================

  const [
    issuedAt,
    setIssuedAt,
  ] = useState(
    getTodayDate()
  );

  const [
    remarks,
    setRemarks,
  ] = useState('');

  // ==========================================
  // SCREEN STATE
  // ==========================================

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  // ==========================================
  // NAVIGATION
  // ==========================================

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route:
        '/admin/dashboard',
    },

    {
      label: 'Students',
      route:
        '/admin/students',
    },

    {
      label: 'Fines',
      route:
        '/admin/fines',
    },

    {
      label: 'QR Scanner',
      route:
        '/admin/qr-scanner',
    },

    {
      label: 'Reports',
      route:
        '/admin/reports',
    },

    {
      label: 'Settings',
      route:
        '/admin/settings',
    },

    {
      label: 'Officers',
      route:
        '/admin/officers',
    },
  ];

  // ==========================================
  // LOAD OPTIONS
  // ==========================================

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions =
    async () => {
      try {
        setLoading(true);

        setErrorMessage('');

        const [
          studentsResponse,
          violationsResponse,
          officersResponse,
        ] =
          await Promise.all([
            fetch(
              `${API_BASE}/api/fines/options/students`
            ),

            fetch(
              `${API_BASE}/api/fines/options/violations`
            ),

            fetch(
              `${API_BASE}/api/fines/options/officers`
            ),
          ]);

        const studentsData =
          await studentsResponse.json();

        const violationsData =
          await violationsResponse.json();

        const officersData =
          await officersResponse.json();

        if (
          !studentsResponse.ok ||
          !studentsData.success
        ) {
          throw new Error(
            studentsData.message ||
              'Failed to load students.'
          );
        }

        if (
          !violationsResponse.ok ||
          !violationsData.success
        ) {
          throw new Error(
            violationsData.message ||
              'Failed to load violation types.'
          );
        }

        if (
          !officersResponse.ok ||
          !officersData.success
        ) {
          throw new Error(
            officersData.message ||
              'Failed to load officers.'
          );
        }

        const loadedStudents =
          studentsData.students ||
          [];

        const loadedViolations =
          violationsData.violations ||
          [];

        const loadedOfficers =
          officersData.officers ||
          [];

        setStudents(
          loadedStudents
        );

        setViolations(
          loadedViolations
        );

        setOfficers(
          loadedOfficers
        );

        // ======================================
        // OPTIONAL DEFAULT OFFICER
        //
        // If there is only one available
        // officer/admin, automatically select it.
        // ======================================

        if (
          loadedOfficers.length ===
          1
        ) {
          setSelectedOfficerId(
            loadedOfficers[0].id
          );
        }
      } catch (error) {
        console.error(
          'Load Add Fine options error:',
          error
        );

        setErrorMessage(
          'Could not load the Add Fine form. Please check the SmartFine server.'
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================
  // SELECTED STUDENT
  // ==========================================

  const selectedStudent =
    useMemo(() => {
      return (
        students.find(
          (student) =>
            student.id ===
            selectedStudentId
        ) || null
      );
    }, [
      students,
      selectedStudentId,
    ]);

  // ==========================================
  // FILTERED STUDENT SUGGESTIONS
  // ==========================================

  const filteredStudents =
    useMemo(() => {
      const search =
        studentSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return [];
      }

      return students
        .filter(
          (student) => {
            const searchable =
              [
                student.full_name,

                student.student_id,

                student.username,

                student.grade_level,

                student.section,
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return searchable.includes(
              search
            );
          }
        )
        .slice(
          0,
          6
        );
    }, [
      students,
      studentSearch,
    ]);

  // ==========================================
  // SELECTED VIOLATION
  // ==========================================

  const selectedViolation =
    useMemo(() => {
      return (
        violations.find(
          (violation) =>
            violation.id ===
            selectedViolationId
        ) || null
      );
    }, [
      violations,
      selectedViolationId,
    ]);

  // ==========================================
  // SELECTED OFFICER
  // ==========================================

  const selectedOfficer =
    useMemo(() => {
      return (
        officers.find(
          (officer) =>
            officer.id ===
            selectedOfficerId
        ) || null
      );
    }, [
      officers,
      selectedOfficerId,
    ]);

  // ==========================================
  // CLEAR ERROR
  // ==========================================

  const clearError =
    () => {
      if (errorMessage) {
        setErrorMessage('');
      }
    };

  // ==========================================
  // STUDENT SEARCH CHANGE
  // ==========================================

  const handleStudentSearchChange = (
    text: string
  ) => {
    setStudentSearch(
      text
    );

    setSelectedStudentId(
      null
    );

    setStudentSuggestionsOpen(
      text.trim().length > 0
    );

    setViolationMenuOpen(
      false
    );

    setOfficerMenuOpen(
      false
    );

    clearError();
  };

  // ==========================================
  // SELECT STUDENT
  // ==========================================

  const selectStudent = (
    student: StudentOption
  ) => {
    setSelectedStudentId(
      student.id
    );

    setStudentSearch(
      student.full_name
    );

    setStudentSuggestionsOpen(
      false
    );

    clearError();
  };

  // ==========================================
  // VIOLATION DROPDOWN
  // ==========================================

  const toggleViolationMenu =
    () => {
      setViolationMenuOpen(
        !violationMenuOpen
      );

      setOfficerMenuOpen(
        false
      );

      setStudentSuggestionsOpen(
        false
      );
    };

  // ==========================================
  // OFFICER DROPDOWN
  // ==========================================

  const toggleOfficerMenu =
    () => {
      setOfficerMenuOpen(
        !officerMenuOpen
      );

      setViolationMenuOpen(
        false
      );

      setStudentSuggestionsOpen(
        false
      );
    };

  // ==========================================
  // SAVE FINE
  // ==========================================

  const handleSave =
    async () => {
      setErrorMessage('');

      if (
        selectedStudentId ===
        null
      ) {
        setErrorMessage(
          'Please search for and select a student.'
        );

        return;
      }

      if (
        selectedViolationId ===
        null
      ) {
        setErrorMessage(
          'Please select a violation type.'
        );

        return;
      }

      if (
        selectedOfficerId ===
        null
      ) {
        setErrorMessage(
          'Please select an assigned officer.'
        );

        return;
      }

      if (
        !isValidDate(
          issuedAt
        )
      ) {
        setErrorMessage(
          'Please enter the violation date using YYYY-MM-DD.'
        );

        return;
      }

      try {
        setSaving(true);

        const response =
          await fetch(
            `${API_BASE}/api/fines`,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  studentId:
                    selectedStudentId,

                  violationTypeId:
                    selectedViolationId,

                  recordedBy:
                    selectedOfficerId,

                  remarks:
                    remarks.trim(),

                  issuedAt:
                    issuedAt.trim(),
                }),
            }
          );

        const data =
          await response.json();

        console.log(
          'Create fine response:',
          data
        );

        if (
          !response.ok ||
          !data.success
        ) {
          setErrorMessage(
            data.message ||
              'Failed to record fine.'
          );

          return;
        }

        showSuccess(
          data.fine
            ?.fineReference
        );
      } catch (error) {
        console.error(
          'Create fine error:',
          error
        );

        setErrorMessage(
          'Could not connect to the SmartFine server.'
        );
      } finally {
        setSaving(false);
      }
    };

  // ==========================================
  // SUCCESS
  // ==========================================

  const showSuccess = (
    fineReference:
      | string
      | undefined
  ) => {
    const message =
      fineReference
        ? `Fine ${fineReference} recorded successfully.`
        : 'Fine recorded successfully.';

    if (
      Platform.OS ===
      'web'
    ) {
      window.alert(
        message
      );

      router.replace(
        '/admin/fines' as any
      );

      return;
    }

    Alert.alert(
      'Fine Recorded',
      message,
      [
        {
          text: 'OK',

          onPress: () =>
            router.replace(
              '/admin/fines' as any
            ),
        },
      ]
    );
  };

  // ==========================================
  // CANCEL
  // ==========================================

  const handleCancel =
    () => {
      router.replace(
        '/admin/fines' as any
      );
    };

  // ==========================================
  // LOGOUT
  // ==========================================

  const performLogout =
    async () => {
      await logout();

      router.replace(
        '/login'
      );
    };

  const handleLogout =
    () => {
      if (
        Platform.OS ===
        'web'
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
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <ActivityIndicator
          size="large"
          color="#173A73"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading Add Fine form...
        </Text>
      </View>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <View
      style={
        styles.screen
      }
    >
      {/* ======================================
          SIDEBAR
      ====================================== */}

      {isTablet && (
        <View
          style={
            styles.sidebar
          }
        >
          <View
            style={
              styles.logoArea
            }
          >
            <Image
              source={require('../../../../assets/branding/smartfineNoBG.png')}
              style={
                styles.smartFineLogo
              }
              resizeMode="contain"
            />
          </View>

          <View
            style={
              styles.navigation
            }
          >
            {navItems.map(
              (item) => {
                const active =
                  item.label ===
                  'Fines';

                return (
                  <TouchableOpacity
                    key={
                      item.label
                    }
                    style={[
                      styles.navItem,

                      active &&
                        styles.navItemActive,
                    ]}
                    onPress={() =>
                      router.push(
                        item.route as any
                      )
                    }
                  >
                    <Text
                      style={
                        styles.navIcon
                      }
                    >
                      {getMenuSymbol(
                        item.label
                      )}
                    </Text>

                    <Text
                      style={
                        styles.navText
                      }
                    >
                      {
                        item.label
                      }
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>

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
          keyboardShouldPersistTaps="handled"
        >
          {/* ==================================
              MOBILE NAV
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
                  const active =
                    item.label ===
                    'Fines';

                  return (
                    <TouchableOpacity
                      key={
                        item.label
                      }
                      style={[
                        styles.mobileNavItem,

                        active &&
                          styles.mobileNavItemActive,
                      ]}
                      onPress={() =>
                        router.push(
                          item.route as any
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.mobileNavText,

                          active &&
                            styles.mobileNavTextActive,
                        ]}
                      >
                        {
                          item.label
                        }
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>
          )}

          {/* ==================================
              HEADER
          ================================== */}

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
              Add New Fine
            </Text>
          </View>

          {/* ==================================
              FORM CARD
          ================================== */}

          <View
            style={
              styles.formCard
            }
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              Record New Fine
            </Text>

            {/* ==================================
                ROW 1
            ================================== */}

            <View
              style={[
                styles.formRow,
                styles.formRowTop,
              ]}
            >
              {/* STUDENT SEARCH */}

              <View
                style={
                  styles.fieldGroup
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Student Name
                </Text>

                <View
                  style={
                    styles.searchField
                  }
                >
                  <TextInput
                    style={
                      styles.searchInput
                    }
                    value={
                      studentSearch
                    }
                    onFocus={() => {
                      if (
                        studentSearch
                          .trim()
                          .length >
                        0
                      ) {
                        setStudentSuggestionsOpen(
                          true
                        );
                      }
                    }}
                    onChangeText={
                      handleStudentSearchChange
                    }
                    placeholder="Type student name or ID"
                    placeholderTextColor="#8C939F"
                    editable={
                      !saving
                    }
                  />
                </View>

                {studentSuggestionsOpen && (
                  <View
                    style={
                      styles.suggestionMenu
                    }
                  >
                    <ScrollView
                      style={
                        styles.suggestionScroll
                      }
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {filteredStudents.length ===
                      0 ? (
                        <View
                          style={
                            styles.emptyOption
                          }
                        >
                          <Text
                            style={
                              styles.emptyOptionText
                            }
                          >
                            No matching active students found.
                          </Text>
                        </View>
                      ) : (
                        filteredStudents.map(
                          (
                            student
                          ) => (
                            <TouchableOpacity
                              key={
                                student.id
                              }
                              style={
                                styles.suggestionItem
                              }
                              onPress={() =>
                                selectStudent(
                                  student
                                )
                              }
                            >
                              <Text
                                style={
                                  styles.suggestionTitle
                                }
                              >
                                {
                                  student.full_name
                                }
                              </Text>

                              <Text
                                style={
                                  styles.suggestionSubtitle
                                }
                              >
                                {
                                  student.student_id
                                }

                                {student.grade_level
                                  ? ` • ${student.grade_level}`
                                  : ''}

                                {student.section
                                  ? ` - ${student.section}`
                                  : ''}
                              </Text>
                            </TouchableOpacity>
                          )
                        )
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* DATE */}

              <View
                style={
                  styles.fieldGroup
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Date of Violation
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  value={
                    issuedAt
                  }
                  onChangeText={(
                    text
                  ) => {
                    setIssuedAt(
                      text
                    );

                    clearError();
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#8C939F"
                  editable={
                    !saving
                  }
                />
              </View>
            </View>

            {/* ==================================
                ROW 2
            ================================== */}

            <View
              style={[
                styles.formRow,
                styles.formRowMiddle,
              ]}
            >
              {/* VIOLATION TYPE */}

              <View
                style={
                  styles.fieldGroup
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Violation Type
                </Text>

                <TouchableOpacity
                  style={
                    styles.selectButton
                  }
                  onPress={
                    toggleViolationMenu
                  }
                  disabled={
                    saving
                  }
                >
                  <Text
                    style={[
                      styles.selectText,

                      !selectedViolation &&
                        styles.placeholderText,
                    ]}
                    numberOfLines={
                      1
                    }
                  >
                    {selectedViolation
                      ? selectedViolation.violation_name
                      : 'Select violation type'}
                  </Text>

                  <Text
                    style={
                      styles.selectArrow
                    }
                  >
                    ▼
                  </Text>
                </TouchableOpacity>

                {violationMenuOpen && (
                  <View
                    style={
                      styles.dropdownMenu
                    }
                  >
                    <ScrollView
                      style={
                        styles.dropdownScroll
                      }
                      nestedScrollEnabled
                    >
                      {violations.map(
                        (
                          violation
                        ) => (
                          <TouchableOpacity
                            key={
                              violation.id
                            }
                            style={
                              styles.dropdownItem
                            }
                            onPress={() => {
                              setSelectedViolationId(
                                violation.id
                              );

                              setViolationMenuOpen(
                                false
                              );

                              clearError();
                            }}
                          >
                            <Text
                              style={
                                styles.dropdownTitle
                              }
                            >
                              {
                                violation.violation_name
                              }
                            </Text>

                            <Text
                              style={
                                styles.dropdownSubtitle
                              }
                            >
                              {formatMoney(
                                violation.amount
                              )}
                            </Text>
                          </TouchableOpacity>
                        )
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* OFFICER */}

              <View
                style={
                  styles.fieldGroup
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Assigned Officer
                </Text>

                <TouchableOpacity
                  style={
                    styles.selectButton
                  }
                  onPress={
                    toggleOfficerMenu
                  }
                  disabled={
                    saving
                  }
                >
                  <Text
                    style={[
                      styles.selectText,

                      !selectedOfficer &&
                        styles.placeholderText,
                    ]}
                    numberOfLines={
                      1
                    }
                  >
                    {selectedOfficer
                      ? selectedOfficer.full_name
                      : 'Select officer'}
                  </Text>

                  <Text
                    style={
                      styles.selectArrow
                    }
                  >
                    ▼
                  </Text>
                </TouchableOpacity>

                {officerMenuOpen && (
                  <View
                    style={
                      styles.dropdownMenu
                    }
                  >
                    <ScrollView
                      style={
                        styles.dropdownScroll
                      }
                      nestedScrollEnabled
                    >
                      {officers.map(
                        (
                          officer
                        ) => (
                          <TouchableOpacity
                            key={
                              officer.id
                            }
                            style={
                              styles.dropdownItem
                            }
                            onPress={() => {
                              setSelectedOfficerId(
                                officer.id
                              );

                              setOfficerMenuOpen(
                                false
                              );

                              clearError();
                            }}
                          >
                            <Text
                              style={
                                styles.dropdownTitle
                              }
                            >
                              {
                                officer.full_name
                              }
                            </Text>

                            <Text
                              style={
                                styles.dropdownSubtitle
                              }
                            >
                              {
                                formatRole(
                                  officer.role
                                )
                              }
                            </Text>
                          </TouchableOpacity>
                        )
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* ==================================
                ROW 3
            ================================== */}

            <View
              style={[
                styles.formRow,
                styles.formRowBottom,
              ]}
            >
              {/* AMOUNT */}

              <View
                style={
                  styles.fieldGroup
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Amount
                </Text>

                <View
                  style={
                    styles.amountBox
                  }
                >
                  <Text
                    style={
                      styles.amountText
                    }
                  >
                    {selectedViolation
                      ? formatMoney(
                          selectedViolation.amount
                        )
                      : '₱0.00'}
                  </Text>
                </View>
              </View>

              {/* NOTES */}

              <View
                style={
                  styles.fieldGroup
                }
              >
                <Text
                  style={
                    styles.label
                  }
                >
                  Notes / Description
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  value={
                    remarks
                  }
                  onChangeText={(
                    text
                  ) => {
                    setRemarks(
                      text
                    );

                    clearError();
                  }}
                  placeholder="Enter minor details"
                  placeholderTextColor="#8C939F"
                  editable={
                    !saving
                  }
                />
              </View>
            </View>

            {/* ==================================
                ERROR
            ================================== */}

            {errorMessage !==
              '' && (
              <View
                style={
                  styles.errorBox
                }
              >
                <Text
                  style={
                    styles.errorTitle
                  }
                >
                  Unable to Save Fine
                </Text>

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {
                    errorMessage
                  }
                </Text>
              </View>
            )}

            {/* ==================================
                BUTTONS
            ================================== */}

            <View
              style={
                styles.actionRow
              }
            >
              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={
                  handleCancel
                }
                disabled={
                  saving
                }
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,

                  saving &&
                    styles.buttonDisabled,
                ]}
                onPress={
                  handleSave
                }
                disabled={
                  saving
                }
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    Save Fine
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ==========================================
// TODAY
// ==========================================

function getTodayDate() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
}

// ==========================================
// DATE VALIDATION
// ==========================================

function isValidDate(
  value: string
) {
  const datePattern =
    /^\d{4}-\d{2}-\d{2}$/;

  if (
    !datePattern.test(
      value.trim()
    )
  ) {
    return false;
  }

  const [
    year,
    month,
    day,
  ] =
    value
      .trim()
      .split('-')
      .map(Number);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  return (
    date.getFullYear() ===
      year &&
    date.getMonth() ===
      month - 1 &&
    date.getDate() ===
      day
  );
}

// ==========================================
// MONEY
// ==========================================

function formatMoney(
  amount: number
) {
  return `₱${Number(
    amount || 0
  ).toLocaleString(
    'en-PH',
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  )}`;
}

// ==========================================
// ROLE
// ==========================================

function formatRole(
  role: string
) {
  switch (
    String(
      role || ''
    ).toUpperCase()
  ) {
    case 'FINES_OFFICER':
      return 'Fines Officer';

    case 'ADMIN':
      return 'Administrator';

    default:
      return role;
  }
}

// ==========================================
// SIDEBAR SYMBOLS
// ==========================================

function getMenuSymbol(
  label: string
) {
  switch (label) {
    case 'Dashboard':
      return '⌂';

    case 'Students':
      return '◎';

    case 'Fines':
      return '▤';

    case 'QR Scanner':
      return '▦';

    case 'Reports':
      return '▧';

    case 'Settings':
      return '⚙';

    case 'Officers':
      return '●';

    default:
      return '•';
  }
}