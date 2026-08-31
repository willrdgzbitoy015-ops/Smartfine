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
  useWindowDimensions,
  ActivityIndicator,
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
  styles,
} from './add-student.styles';

const API_BASE =
  'http://192.168.1.45:3000';

// ==========================================
// TYPES
// ==========================================

type NavItem = {
  label: string;
  route: string;
};

// ==========================================
// ADD STUDENT
// ==========================================

export default function AddStudent() {
  const router =
    useRouter();

  const { logout } =
    useAuth();

  const { width } =
    useWindowDimensions();

  const isTablet =
    width >= 768;

  // ==========================================
  // AUTO STUDENT ID
  // ==========================================

  const [
    previewStudentId,
    setPreviewStudentId,
  ] = useState('');

  const [
    studentIdLoading,
    setStudentIdLoading,
  ] = useState(true);

  // ==========================================
  // STUDENT INFORMATION
  // ==========================================

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

  // ==========================================
  // ACCOUNT INFORMATION
  // ==========================================

  const [
    username,
    setUsername,
  ] = useState('');

  const [
    usernameEdited,
    setUsernameEdited,
  ] = useState(false);

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    accountActive,
    setAccountActive,
  ] = useState(true);

  // ==========================================
  // FORM STATE
  // ==========================================

  const [
    loading,
    setLoading,
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
  // CREATE SUGGESTED USERNAME
  //
  // Will Bitoy
  // -> wbitoy
  //
  // John Dela Cruz
  // -> jdelacruz
  //
  // ==========================================

  const createSuggestedUsername = (
    first: string,
    last: string
  ) => {
    const cleanFirst =
      first
        .trim()
        .toLowerCase()
        .replace(
          /[^a-z0-9]/g,
          ''
        );

    const cleanLast =
      last
        .trim()
        .toLowerCase()
        .replace(
          /[^a-z0-9]/g,
          ''
        );

    if (
      !cleanFirst ||
      !cleanLast
    ) {
      return '';
    }

    return (
      cleanFirst.charAt(0) +
      cleanLast
    );
  };

  // ==========================================
  // LOAD NEXT STUDENT ID
  // ==========================================

  const loadNextStudentId =
    async () => {
      try {
        setStudentIdLoading(
          true
        );

        const response =
          await fetch(
            `${API_BASE}/api/students/next-id`
          );

        const data =
          await response.json();

        if (
          response.ok &&
          data.success
        ) {
          setPreviewStudentId(
            data.studentId
          );
        } else {
          setPreviewStudentId(
            ''
          );
        }
      } catch (error) {
        console.error(
          'Load Student ID error:',
          error
        );

        setPreviewStudentId(
          ''
        );
      } finally {
        setStudentIdLoading(
          false
        );
      }
    };

  // ==========================================
  // LOAD WHEN SCREEN OPENS
  // ==========================================

  useEffect(() => {
    loadNextStudentId();
  }, []);

  // ==========================================
  // NAVIGATION
  // ==========================================

  const handleNavigation = (
    item: NavItem
  ) => {
    router.push(
      item.route as any
    );
  };

  // ==========================================
  // CLEAR ERROR
  // ==========================================

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  // ==========================================
  // FIRST NAME CHANGE
  // ==========================================

  const handleFirstNameChange = (
    text: string
  ) => {
    setFirstName(text);

    if (!usernameEdited) {
      setUsername(
        createSuggestedUsername(
          text,
          lastName
        )
      );
    }

    clearError();
  };

  // ==========================================
  // LAST NAME CHANGE
  // ==========================================

  const handleLastNameChange = (
    text: string
  ) => {
    setLastName(text);

    if (!usernameEdited) {
      setUsername(
        createSuggestedUsername(
          firstName,
          text
        )
      );
    }

    clearError();
  };

  // ==========================================
  // USERNAME CHANGE
  // Editable by Admin
  // ==========================================

  const handleUsernameChange = (
    text: string
  ) => {
    const cleanedUsername =
      text
        .toLowerCase()
        .replace(
          /[^a-z0-9]/g,
          ''
        );

    setUsername(
      cleanedUsername
    );

    setUsernameEdited(
      true
    );

    clearError();
  };

  // ==========================================
  // CREATE STUDENT
  // ==========================================

  const handleCreateStudent =
    async () => {
      setErrorMessage('');

      // ======================================
      // REQUIRED FIELDS
      // ======================================

      if (
        !firstName.trim() ||
        !lastName.trim() ||
        !gradeLevel.trim() ||
        !section.trim() ||
        !contactNumber.trim() ||
        !email.trim() ||
        !username.trim() ||
        !password ||
        !confirmPassword
      ) {
        setErrorMessage(
          'Please complete all required fields.'
        );

        return;
      }

      // ======================================
      // USERNAME VALIDATION
      // Alphanumeric only
      // ======================================

      const usernamePattern =
        /^[a-z0-9]+$/;

      if (
        !usernamePattern.test(
          username
        )
      ) {
        setErrorMessage(
          'Username may contain letters and numbers only.'
        );

        return;
      }

      // ======================================
      // EMAIL VALIDATION
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
      // PASSWORD
      //
      // REQUIRED:
      // 8+ characters
      // 1 letter
      // 1 number
      // 1 special character
      // ======================================

      if (
        password.length < 8
      ) {
        setErrorMessage(
          'Password must contain at least 8 characters.'
        );

        return;
      }

      const hasLetter =
        /[A-Za-z]/.test(
          password
        );

      const hasNumber =
        /[0-9]/.test(
          password
        );

      const hasSpecialCharacter =
        /[^A-Za-z0-9\s]/.test(
          password
        );

      if (!hasLetter) {
        setErrorMessage(
          'Password must contain at least one letter.'
        );

        return;
      }

      if (!hasNumber) {
        setErrorMessage(
          'Password must contain at least one number.'
        );

        return;
      }

      if (
        !hasSpecialCharacter
      ) {
        setErrorMessage(
          'Password must contain at least one special character such as !, @, #, $, %, or &.'
        );

        return;
      }

      // ======================================
      // CONFIRM PASSWORD
      // ======================================

      if (
        password !==
        confirmPassword
      ) {
        setErrorMessage(
          'Password and Confirm Password do not match.'
        );

        return;
      }

      // ======================================
      // SEND TO BACKEND
      // ======================================

      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_BASE}/api/students`,
            {
              method:
                'POST',

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

                  password,

                  accountStatus:
                    accountActive
                      ? 'ACTIVE'
                      : 'DEACTIVATED',
                }),
            }
          );

        const data =
          await response.json();

        console.log(
          'Create student response:',
          data
        );

        // ======================================
        // BACKEND ERROR
        // ======================================

        if (
          !response.ok ||
          !data.success
        ) {
          setErrorMessage(
            data.message ||
              'Could not create student account.'
          );

          return;
        }

        // ======================================
        // SUCCESS
        // ======================================

        handleSuccess(
          data.student.studentId,
          data.student.username
        );
      } catch (error) {
        console.error(
          'Create student error:',
          error
        );

        setErrorMessage(
          'Could not connect to the SmartFine server. Please check the backend connection.'
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================
  // SUCCESS
  // ==========================================

  const handleSuccess = (
    generatedStudentId: string,
    createdUsername: string
  ) => {
    const message =
      `Student account created successfully.\n\n` +
      `Student ID: ${generatedStudentId}\n` +
      `Username: ${createdUsername}`;

    if (
      Platform.OS ===
      'web'
    ) {
      window.alert(
        message
      );

      router.replace(
        '/admin/students'
      );

      return;
    }

    Alert.alert(
      'Student Created',
      message,
      [
        {
          text:
            'OK',

          onPress: () =>
            router.replace(
              '/admin/students'
            ),
        },
      ]
    );
  };

  // ==========================================
  // CANCEL
  // ==========================================

  const handleCancel = () => {
    router.replace(
      '/admin/students'
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

  const handleLogout = () => {
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
          MAIN CONTENT
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
              HEADER
          ================================== */}

          <View
            style={
              styles.header
            }
          >
            <View>
              <Text
                style={
                  styles.pageTitle
                }
              >
                Add New Student
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Create a new student account in the system
              </Text>
            </View>

            <TouchableOpacity
              style={
                styles.uploadButton
              }
              disabled
            >
              <Text
                style={
                  styles.uploadButtonText
                }
              >
                Upload a Profile Picture
              </Text>
            </TouchableOpacity>
          </View>

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
              FORM CARDS
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

              {/* STUDENT ID */}

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
                {studentIdLoading ? (
                  <ActivityIndicator
                    size="small"
                    color="#173A73"
                  />
                ) : (
                  <Text
                    style={
                      previewStudentId
                        ? styles.readOnlyText
                        : styles.readOnlyPlaceholder
                    }
                  >
                    {previewStudentId ||
                      'Unable to generate ID'}
                  </Text>
                )}
              </View>

              <Text
                style={
                  styles.usernameNote
                }
              >
                SmartFine automatically assigns the next available Student ID.
              </Text>

              {/* FIRST + MIDDLE */}

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
                    placeholder="First name"
                    placeholderTextColor="#8C939F"
                    value={
                      firstName
                    }
                    onChangeText={
                      handleFirstNameChange
                    }
                    editable={
                      !loading
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
                    placeholder="Middle name"
                    placeholderTextColor="#8C939F"
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
                      !loading
                    }
                  />
                </View>
              </View>

              {/* LAST NAME */}

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
                placeholder="Last name"
                placeholderTextColor="#8C939F"
                value={
                  lastName
                }
                onChangeText={
                  handleLastNameChange
                }
                editable={
                  !loading
                }
              />

              {/* GRADE + SECTION */}

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
                    placeholder="Grade 12"
                    placeholderTextColor="#8C939F"
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
                      !loading
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
                    placeholder="STEM - A"
                    placeholderTextColor="#8C939F"
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
                      !loading
                    }
                  />
                </View>
              </View>

              {/* CONTACT */}

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
                placeholder="09123456789"
                placeholderTextColor="#8C939F"
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
                  !loading
                }
              />

              {/* EMAIL */}

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
                placeholder="student@example.com"
                placeholderTextColor="#8C939F"
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
                  !loading
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

              {/* USERNAME */}

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
                placeholder="Username"
                placeholderTextColor="#8C939F"
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
                  !loading
                }
              />

              <Text
                style={
                  styles.usernameNote
                }
              >
                Suggested automatically from the first initial and last name. You can edit the username before creating the account.
              </Text>

              {/* PASSWORD */}

              <Text
                style={
                  styles.label
                }
              >
                Enter Password *
              </Text>

              <View
                style={
                  styles.passwordContainer
                }
              >
                <TextInput
                  style={
                    styles.passwordInput
                  }
                  placeholder="Enter password"
                  placeholderTextColor="#8C939F"
                  value={
                    password
                  }
                  onChangeText={(
                    text
                  ) => {
                    setPassword(
                      text
                    );

                    clearError();
                  }}
                  secureTextEntry={
                    !showPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={
                    false
                  }
                  editable={
                    !loading
                  }
                />

                <TouchableOpacity
                  style={
                    styles.passwordToggle
                  }
                  onPress={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  disabled={
                    loading
                  }
                >
                  <Text
                    style={
                      styles.passwordToggleText
                    }
                  >
                    {showPassword
                      ? 'Hide'
                      : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={
                  styles.usernameNote
                }
              >
                Minimum 8 characters with at least one letter, one number, and one special character (! @ # $ % &).
              </Text>

              {/* CONFIRM PASSWORD */}

              <Text
                style={
                  styles.label
                }
              >
                Confirm Password *
              </Text>

              <TextInput
                style={
                  styles.input
                }
                placeholder="Confirm password"
                placeholderTextColor="#8C939F"
                value={
                  confirmPassword
                }
                onChangeText={(
                  text
                ) => {
                  setConfirmPassword(
                    text
                  );

                  clearError();
                }}
                secureTextEntry={
                  !showPassword
                }
                autoCapitalize="none"
                autoCorrect={
                  false
                }
                editable={
                  !loading
                }
              />

              {/* STATUS */}

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
                    loading
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
                  styles.statusNote
                }
              >
                Active students can log in immediately. Inactive students cannot access their SmartFine account.
              </Text>
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
                Unable to Create Student
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
                loading
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
                styles.createButton,

                loading &&
                  styles.createButtonDisabled,
              ]}
              onPress={
                handleCreateStudent
              }
              disabled={
                loading
              }
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.createButtonText
                  }
                >
                  Create Student Account
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