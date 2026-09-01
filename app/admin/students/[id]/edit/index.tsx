import {
  useEffect,
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
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  useAuth,
} from '@/hooks/use-auth';

import {
  styles,
} from './edit-student.styles';
import { API_BASE } from '@/constants/api';

// ==========================================
// TYPES
// ==========================================

type Student = {
  id: number;

  student_id: string;

  username: string;

  first_name: string;
  middle_name: string | null;
  last_name: string;

  email: string | null;

  contact_number:
    | string
    | null;

  grade_level:
    | string
    | null;

  section:
    | string
    | null;

  account_status: string;
};

type NavItem = {
  label: string;
  route: string;
};

// ==========================================
// EDIT STUDENT SCREEN
// ==========================================

export default function EditStudent() {
  const router =
    useRouter();

  const params =
    useLocalSearchParams();

  const { logout } =
    useAuth();

  const { width } =
    useWindowDimensions();

  const isTablet =
    width >= 768;

  const rawId =
    params.id;

  const studentDatabaseId =
    Array.isArray(rawId)
      ? rawId[0]
      : rawId;

  // ==========================================
  // STUDENT ID
  // ==========================================

  const [
    studentNumber,
    setStudentNumber,
  ] = useState('');

  // ==========================================
  // FORM VALUES
  // ==========================================

  const [
    username,
    setUsername,
  ] = useState('');

  const [
    firstName,
    setFirstName,
  ] = useState('');

  const [
    middleName,
    setMiddleName,
  ] = useState('');

  const [
    lastName,
    setLastName,
  ] = useState('');

  const [
    gradeLevel,
    setGradeLevel,
  ] = useState('');

  const [
    section,
    setSection,
  ] = useState('');

  const [
    contactNumber,
    setContactNumber,
  ] = useState('');

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    accountActive,
    setAccountActive,
  ] = useState(true);

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
      label:
        'Dashboard',
      route:
        '/admin/dashboard',
    },

    {
      label:
        'Students',
      route:
        '/admin/students',
    },

    {
      label:
        'Fines',
      route:
        '/admin/fines',
    },

    {
      label:
        'QR Scanner',
      route:
        '/admin/qr-scanner',
    },

    {
      label:
        'Reports',
      route:
        '/admin/reports',
    },

    {
      label:
        'Settings',
      route:
        '/admin/settings',
    },

    {
      label:
        'Officers',
      route:
        '/admin/officers',
    },
  ];

  // ==========================================
  // LOAD STUDENT
  // ==========================================

  useEffect(() => {
    if (
      !studentDatabaseId
    ) {
      return;
    }

    loadStudent();
  }, [studentDatabaseId]);

  const loadStudent =
    async () => {
      try {
        setLoading(true);

        setErrorMessage('');

        const response =
          await fetch(
            `${API_BASE}/api/students/${studentDatabaseId}`
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success ||
          !data.student
        ) {
          setErrorMessage(
            data.message ||
              'Failed to load student information.'
          );

          return;
        }

        const student:
          Student =
          data.student;

        // ======================================
        // PUT DATABASE VALUES INTO FORM
        // ======================================

        setStudentNumber(
          student.student_id ||
            ''
        );

        setUsername(
          student.username ||
            ''
        );

        setFirstName(
          student.first_name ||
            ''
        );

        setMiddleName(
          student.middle_name ||
            ''
        );

        setLastName(
          student.last_name ||
            ''
        );

        setGradeLevel(
          student.grade_level ||
            ''
        );

        setSection(
          student.section ||
            ''
        );

        setContactNumber(
          student.contact_number ||
            ''
        );

        setEmail(
          student.email ||
            ''
        );

        // ACTIVE = switch ON
        // INACTIVE = switch OFF

        setAccountActive(
          String(
            student.account_status
          ).toUpperCase() ===
            'ACTIVE'
        );
      } catch (error) {
        console.error(
          'Load student error:',
          error
        );

        setErrorMessage(
          'Could not connect to the SmartFine server.'
        );
      } finally {
        setLoading(false);
      }
    };

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
  // USERNAME CHANGE
  //
  // Alphanumeric only
  // ==========================================

  const handleUsernameChange = (
    text: string
  ) => {
    const cleaned =
      text
        .toLowerCase()
        .replace(
          /[^a-z0-9]/g,
          ''
        );

    setUsername(cleaned);

    clearError();
  };

  // ==========================================
  // SAVE STUDENT
  // ==========================================

  const handleSave =
    async () => {
      setErrorMessage('');

      // ======================================
      // REQUIRED FIELDS
      // ======================================

      if (
        !username.trim() ||
        !firstName.trim() ||
        !lastName.trim() ||
        !gradeLevel.trim() ||
        !section.trim() ||
        !contactNumber.trim() ||
        !email.trim()
      ) {
        setErrorMessage(
          'Please complete all required fields.'
        );

        return;
      }

      // ======================================
      // USERNAME
      // ======================================

      const usernamePattern =
        /^[a-z0-9]+$/;

      if (
        !usernamePattern.test(
          username.trim()
        )
      ) {
        setErrorMessage(
          'Username may contain letters and numbers only.'
        );

        return;
      }

      // ======================================
      // EMAIL
      // ======================================

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          email.trim()
        )
      ) {
        setErrorMessage(
          'Please enter a valid email address.'
        );

        return;
      }

      // ======================================
      // SEND UPDATE
      // ======================================

      try {
        setSaving(true);

        const response =
          await fetch(
            `${API_BASE}/api/students/${studentDatabaseId}`,
            {
              method:
                'PUT',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  username:
                    username
                      .trim()
                      .toLowerCase(),

                  firstName:
                    firstName.trim(),

                  middleName:
                    middleName.trim(),

                  lastName:
                    lastName.trim(),

                  email:
                    email
                      .trim()
                      .toLowerCase(),

                  contactNumber:
                    contactNumber.trim(),

                  gradeLevel:
                    gradeLevel.trim(),

                  section:
                    section.trim(),

                  // ==================================
                  // FIXED ACCOUNT STATUS
                  //
                  // Switch ON  = ACTIVE
                  // Switch OFF = INACTIVE
                  // ==================================

                  accountStatus:
                    accountActive
                      ? 'ACTIVE'
                      : 'INACTIVE',
                }),
            }
          );

        const data =
          await response.json();

        console.log(
          'Update student response:',
          data
        );

        if (
          !response.ok ||
          !data.success
        ) {
          setErrorMessage(
            data.message ||
              'Could not update student.'
          );

          return;
        }

        showSuccess();
      } catch (error) {
        console.error(
          'Update student error:',
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

  const showSuccess =
    () => {
      const message =
        'Student information updated successfully.';

      if (
        Platform.OS ===
        'web'
      ) {
        window.alert(
          message
        );

        router.replace(
          `/admin/students/${studentDatabaseId}` as any
        );

        return;
      }

      Alert.alert(
        'Student Updated',
        message,
        [
          {
            text:
              'OK',

            onPress: () =>
              router.replace(
                `/admin/students/${studentDatabaseId}` as any
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
        `/admin/students/${studentDatabaseId}` as any
      );
    };

  // ==========================================
  // LOGOUT
  // ==========================================

  const performLogout =
    async () => {
      try {
        await logout();

        router.replace(
          '/login'
        );
      } catch (error) {
        console.error(
          'Logout error:',
          error
        );
      }
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
            text:
              'Cancel',

            style:
              'cancel',
          },

          {
            text:
              'Log Out',

            style:
              'destructive',

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
          Loading student information...
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
              source={require('../../../../../assets/branding/smartfineNoBG.png')}
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
                  'Students';

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
          {/* BACK */}

          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={
              handleCancel
            }
          >
            <Text
              style={
                styles.backText
              }
            >
              ‹ Student Profile
            </Text>
          </TouchableOpacity>

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
                (item) => (
                  <TouchableOpacity
                    key={
                      item.label
                    }
                    style={[
                      styles.mobileNavItem,

                      item.label ===
                        'Students' &&
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

                        item.label ===
                          'Students' &&
                          styles.mobileNavTextActive,
                      ]}
                    >
                      {
                        item.label
                      }
                    </Text>
                  </TouchableOpacity>
                )
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
              Edit Student Information
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Update student and account information
            </Text>
          </View>

          {/* ==================================
              FORM
          ================================== */}

          <View
            style={
              styles.formContainer
            }
          >
            {/* ==================================
                STUDENT INFORMATION
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
                Student Information
              </Text>

              {/* ==================================
                  FIXED STUDENT ID
              ================================== */}

              <Text
                style={
                  styles.label
                }
              >
                Student ID
              </Text>

              <View
                style={
                  styles.readOnlyBox
                }
              >
                <Text
                  style={
                    styles.readOnlyText
                  }
                >
                  {
                    studentNumber
                  }
                </Text>
              </View>

              <Text
                style={
                  styles.note
                }
              >
                Student ID is permanent and cannot be changed.
              </Text>

              {/* ==================================
                  FIRST / MIDDLE
              ================================== */}

              <View
                style={
                  styles.twoColumnRow
                }
              >
                <View
                  style={
                    styles.flexField
                  }
                >
                  <Text
                    style={
                      styles.label
                    }
                  >
                    First Name *
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      firstName
                    }
                    onChangeText={(
                      text
                    ) => {
                      setFirstName(
                        text
                      );

                      clearError();
                    }}
                    editable={
                      !saving
                    }
                  />
                </View>

                <View
                  style={
                    styles.flexField
                  }
                >
                  <Text
                    style={
                      styles.label
                    }
                  >
                    Middle Name
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      middleName
                    }
                    onChangeText={(
                      text
                    ) => {
                      setMiddleName(
                        text
                      );

                      clearError();
                    }}
                    editable={
                      !saving
                    }
                  />
                </View>
              </View>

              {/* ==================================
                  LAST NAME
              ================================== */}

              <Text
                style={
                  styles.label
                }
              >
                Last Name *
              </Text>

              <TextInput
                style={
                  styles.input
                }
                value={
                  lastName
                }
                onChangeText={(
                  text
                ) => {
                  setLastName(
                    text
                  );

                  clearError();
                }}
                editable={
                  !saving
                }
              />

              {/* ==================================
                  GRADE / SECTION
              ================================== */}

              <View
                style={
                  styles.twoColumnRow
                }
              >
                <View
                  style={
                    styles.flexField
                  }
                >
                  <Text
                    style={
                      styles.label
                    }
                  >
                    Grade Level *
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      gradeLevel
                    }
                    onChangeText={(
                      text
                    ) => {
                      setGradeLevel(
                        text
                      );

                      clearError();
                    }}
                    editable={
                      !saving
                    }
                  />
                </View>

                <View
                  style={
                    styles.flexField
                  }
                >
                  <Text
                    style={
                      styles.label
                    }
                  >
                    Section *
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      section
                    }
                    onChangeText={(
                      text
                    ) => {
                      setSection(
                        text
                      );

                      clearError();
                    }}
                    editable={
                      !saving
                    }
                  />
                </View>
              </View>

              {/* ==================================
                  CONTACT
              ================================== */}

              <Text
                style={
                  styles.label
                }
              >
                Contact Number *
              </Text>

              <TextInput
                style={
                  styles.input
                }
                value={
                  contactNumber
                }
                onChangeText={(
                  text
                ) => {
                  setContactNumber(
                    text
                  );

                  clearError();
                }}
                keyboardType="phone-pad"
                editable={
                  !saving
                }
              />

              {/* ==================================
                  EMAIL
              ================================== */}

              <Text
                style={
                  styles.label
                }
              >
                Email Address *
              </Text>

              <TextInput
                style={
                  styles.input
                }
                value={
                  email
                }
                onChangeText={(
                  text
                ) => {
                  setEmail(
                    text
                  );

                  clearError();
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={
                  false
                }
                editable={
                  !saving
                }
              />
            </View>

            {/* ==================================
                ACCOUNT INFORMATION
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
                Account Information
              </Text>

              {/* ==================================
                  USERNAME
              ================================== */}

              <Text
                style={
                  styles.label
                }
              >
                Username *
              </Text>

              <TextInput
                style={
                  styles.input
                }
                value={
                  username
                }
                onChangeText={
                  handleUsernameChange
                }
                autoCapitalize="none"
                autoCorrect={
                  false
                }
                editable={
                  !saving
                }
              />

              <Text
                style={
                  styles.note
                }
              >
                Username is editable and is used by the student when logging in.
              </Text>

              {/* ==================================
                  ACCOUNT STATUS
              ================================== */}

              <View
                style={
                  styles.statusCard
                }
              >
                <View>
                  <Text
                    style={
                      styles.statusLabel
                    }
                  >
                    Account Status
                  </Text>

                  <Text
                    style={[
                      styles.statusValue,

                      accountActive
                        ? styles.statusActive
                        : styles.statusInactive,
                    ]}
                  >
                    {accountActive
                      ? 'Active'
                      : 'Inactive'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.switchTrack,

                    accountActive &&
                      styles.switchTrackActive,
                  ]}
                  onPress={() =>
                    setAccountActive(
                      !accountActive
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  <View
                    style={[
                      styles.switchThumb,

                      accountActive &&
                        styles.switchThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={
                  styles.statusExplanation
                }
              >
                Inactive students cannot log in to SmartFine. Their existing fine and payment records are preserved.
              </Text>

              {/* ==================================
                  PASSWORD NOTE
              ================================== */}

              <View
                style={
                  styles.securityBox
                }
              >
                <Text
                  style={
                    styles.securityTitle
                  }
                >
                  Password
                </Text>

                <Text
                  style={
                    styles.securityText
                  }
                >
                  Password is not changed from this screen. Password reset will be handled separately for security.
                </Text>
              </View>
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
                Unable to Save Changes
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
              ACTIONS
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
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ==========================================
// TEMPORARY SIDEBAR SYMBOLS
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