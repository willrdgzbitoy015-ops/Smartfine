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

import * as ImagePicker from 'expo-image-picker';

import {
  useAuth,
} from '@/hooks/use-auth';

import {
  API_BASE,
} from '@/constants/api';

import {
  styles,
} from './add-student.styles';

// ==========================================
// TYPES
// ==========================================

type NavItem = {
  label: string;
  route: string;
  icon?: any;
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
  // PROFILE PICTURE
  // ==========================================

  const [
    profilePicture,
    setProfilePicture,
  ] =
    useState<ImagePicker.ImagePickerAsset | null>(
      null
    );

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
      icon: require('../../../../assets/icons/dashboard.png'),
    },

    {
      label: 'Students',
      route:
        '/admin/students',
      icon: require('../../../../assets/icons/students.png'),
    },

    {
      label: 'Fines',
      route:
        '/admin/fines',
      icon: require('../../../../assets/icons/fines.png'),
    },

    {
      label: 'QR Scanner',
      route:
        '/admin/qr-scanner',
      icon: require('../../../../assets/icons/qr-codeWhite.png'),
    },

    {
      label: 'Reports',
      route:
        '/admin/reports',
      icon: require('../../../../assets/icons/reports.png'),
    },

    {
      label: 'Settings',
      route:
        '/admin/settings',
      icon: require('../../../../assets/icons/settings.png'),
    },

    {
      label: 'Officers',
      route:
        '/admin/officers',
      icon: require('../../../../assets/icons/officers.png'),
    },
  ];

  // ==========================================
  // CREATE SUGGESTED USERNAME
  //
  // Will Bitoy
  // -> wbitoy
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
  // LOAD SCREEN
  // ==========================================

  useEffect(() => {
    loadNextStudentId();
  }, []);

  // ==========================================
  // CLEAR ERROR
  // ==========================================

  const clearError =
    () => {
      if (
        errorMessage
      ) {
        setErrorMessage('');
      }
    };

  // ==========================================
  // PICK PROFILE PICTURE
  // ==========================================

  const handlePickProfilePicture =
    async () => {
      try {
        clearError();

        // ======================================
        // REQUEST PERMISSION ON MOBILE
        // ======================================

        if (
          Platform.OS !==
          'web'
        ) {
          const permission =
            await ImagePicker
              .requestMediaLibraryPermissionsAsync();

          if (
            !permission.granted
          ) {
            showMessage(
              'Permission Required',
              'SmartFine needs access to your photo library so you can select a student profile picture.'
            );

            return;
          }
        }

        // ======================================
        // OPEN IMAGE LIBRARY
        // ======================================

        const result =
          await ImagePicker
            .launchImageLibraryAsync({
              mediaTypes: [
                'images',
              ],

              allowsEditing:
                true,

              aspect: [
                1,
                1,
              ],

              quality:
                0.8,
            });

        if (
          result.canceled ||
          !result.assets ||
          result.assets.length ===
            0
        ) {
          return;
        }

        const selectedAsset =
          result.assets[0];

        // ======================================
        // CHECK FILE SIZE
        // ======================================

        if (
          selectedAsset.fileSize &&
          selectedAsset.fileSize >
            5 *
              1024 *
              1024
        ) {
          showMessage(
            'Image Too Large',
            'Profile picture must not exceed 5 MB.'
          );

          return;
        }

        setProfilePicture(
          selectedAsset
        );
      } catch (error) {
        console.error(
          'Select profile picture error:',
          error
        );

        showMessage(
          'Profile Picture',
          'Could not select the profile picture.'
        );
      }
    };

  // ==========================================
  // REMOVE SELECTED PROFILE PICTURE
  // ==========================================

  const handleRemoveSelectedPicture =
    () => {
      setProfilePicture(
        null
      );
    };

  // ==========================================
  // FIRST NAME CHANGE
  // ==========================================

  const handleFirstNameChange = (
    text: string
  ) => {
    setFirstName(
      text
    );

    if (
      !usernameEdited
    ) {
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
    setLastName(
      text
    );

    if (
      !usernameEdited
    ) {
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
  // UPLOAD PROFILE PICTURE
  // ==========================================

  const uploadProfilePicture =
    async (
      studentDatabaseId:
        number
    ) => {
      if (
        !profilePicture
      ) {
        return {
          success: true,
        };
      }

      try {
        const formData =
          new FormData();

        // ======================================
        // WEB
        // ======================================

        if (
          Platform.OS ===
          'web'
        ) {
          if (
            profilePicture.file
          ) {
            formData.append(
              'profilePicture',
              profilePicture.file
            );
          } else {
            const fileResponse =
              await fetch(
                profilePicture.uri
              );

            const blob =
              await fileResponse.blob();

            const fileName =
              profilePicture.fileName ||
              `student-${studentDatabaseId}.jpg`;

            formData.append(
              'profilePicture',
              blob,
              fileName
            );
          }
        } else {
          // ====================================
          // ANDROID / IOS
          // ====================================

          const fileName =
            profilePicture.fileName ||
            `student-${studentDatabaseId}.jpg`;

          const mimeType =
            profilePicture.mimeType ||
            'image/jpeg';

          formData.append(
            'profilePicture',
            {
              uri:
                profilePicture.uri,

              name:
                fileName,

              type:
                mimeType,
            } as any
          );
        }

        // ======================================
        // SEND UPLOAD
        // ======================================

        const response =
          await fetch(
            `${API_BASE}/api/students/${studentDatabaseId}/profile-picture`,
            {
              method:
                'POST',

              body:
                formData,
            }
          );

        const data =
          await response.json();

        console.log(
          'Profile picture upload response:',
          data
        );

        if (
          !response.ok ||
          !data.success
        ) {
          return {
            success:
              false,

            message:
              data.message ||
              'Profile picture could not be uploaded.',
          };
        }

        return {
          success:
            true,

          data,
        };
      } catch (error) {
        console.error(
          'Upload profile picture error:',
          error
        );

        return {
          success:
            false,

          message:
            'Student account was created, but the profile picture could not be uploaded.',
        };
      }
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
      // FIRST NAME
      // ======================================

      if (
        firstName
          .trim()
          .length < 2
      ) {
        setErrorMessage(
          'First Name must contain at least 2 characters.'
        );

        return;
      }

      // ======================================
      // LAST NAME
      // ======================================

      if (
        lastName
          .trim()
          .length < 2
      ) {
        setErrorMessage(
          'Last Name must contain at least 2 characters.'
        );

        return;
      }

      // ======================================
      // USERNAME
      // ======================================

      const normalizedUsername =
        username
          .trim()
          .toLowerCase();

      const usernamePattern =
        /^[a-z0-9]+$/;

      if (
        !usernamePattern.test(
          normalizedUsername
        )
      ) {
        setErrorMessage(
          'Username may contain letters and numbers only.'
        );

        return;
      }

      if (
        normalizedUsername.length <
        3
      ) {
        setErrorMessage(
          'Username must contain at least 3 characters.'
        );

        return;
      }

      // ======================================
      // CONTACT NUMBER
      // ======================================

      const normalizedContact =
        contactNumber
          .trim()
          .replace(
            /[^0-9]/g,
            ''
          );

      if (
        !/^[0-9]+$/.test(
          normalizedContact
        )
      ) {
        setErrorMessage(
          'Contact Number must contain numbers only.'
        );

        return;
      }

      if (
        normalizedContact.length <
          10 ||
        normalizedContact.length >
          15
      ) {
        setErrorMessage(
          'Contact Number must contain 10 to 15 digits.'
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
      // PASSWORD
      // ======================================

      if (
        password.length <
        8
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

      if (
        !hasLetter
      ) {
        setErrorMessage(
          'Password must contain at least one letter.'
        );

        return;
      }

      if (
        !hasNumber
      ) {
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
      // CREATE ACCOUNT
      // ======================================

      try {
        setLoading(
          true
        );

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
                    normalizedUsername,

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
                    normalizedContact,

                  gradeLevel:
                    gradeLevel.trim(),

                  section:
                    section.trim(),

                  password,

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
          'Create student response:',
          data
        );

        // ======================================
        // CREATE ERROR
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

        const newStudent =
          data.student;

        const studentDatabaseId =
          Number(
            newStudent?.id
          );

        // ======================================
        // UPLOAD PROFILE PICTURE
        // ======================================

        let pictureUploadSucceeded =
          true;

        let pictureUploadMessage =
          '';

        if (
          profilePicture &&
          studentDatabaseId
        ) {
          const uploadResult =
            await uploadProfilePicture(
              studentDatabaseId
            );

          if (
            !uploadResult.success
          ) {
            pictureUploadSucceeded =
              false;

            pictureUploadMessage =
              uploadResult.message ||
              'The profile picture could not be uploaded.';
          }
        }

        // ======================================
        // SUCCESS
        // ======================================

        handleSuccess(
          newStudent.studentId,
          newStudent.username,
          studentDatabaseId,
          pictureUploadSucceeded,
          pictureUploadMessage
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
        setLoading(
          false
        );
      }
    };

  // ==========================================
  // SUCCESS
  // ==========================================

  const handleSuccess = (
    generatedStudentId:
      string,

    createdUsername:
      string,

    studentDatabaseId:
      number,

    pictureUploadSucceeded:
      boolean,

    pictureUploadMessage:
      string
  ) => {
    let message =
      `Student account created successfully.\n\n` +
      `Student ID: ${generatedStudentId}\n` +
      `Username: ${createdUsername}`;

    if (
      profilePicture &&
      pictureUploadSucceeded
    ) {
      message +=
        '\n\nProfile picture uploaded successfully.';
    }

    if (
      profilePicture &&
      !pictureUploadSucceeded
    ) {
      message +=
        `\n\nThe account was created, but the profile picture was not uploaded.\n\n` +
        `${pictureUploadMessage}\n\n` +
        `You can add the picture from Edit Student.`;
    }

    // ======================================
    // WEB
    // ======================================

    if (
      Platform.OS ===
      'web'
    ) {
      window.alert(
        message
      );

      if (
        profilePicture &&
        !pictureUploadSucceeded &&
        studentDatabaseId
      ) {
        router.replace(
          `/admin/students/${studentDatabaseId}` as any
        );

        return;
      }

      router.replace(
        '/admin/students' as any
      );

      return;
    }

    // ======================================
    // MOBILE
    // ======================================

    Alert.alert(
      'Student Created',

      message,

      [
        {
          text:
            'OK',

          onPress: () => {
            if (
              profilePicture &&
              !pictureUploadSucceeded &&
              studentDatabaseId
            ) {
              router.replace(
                `/admin/students/${studentDatabaseId}` as any
              );

              return;
            }

            router.replace(
              '/admin/students' as any
            );
          },
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
        '/admin/students' as any
      );
    };

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
  // LOGOUT
  // ==========================================

  const performLogout =
    async () => {
      try {
        await logout();

        router.replace(
          '/login' as any
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

        if (
          confirmed
        ) {
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
  // MESSAGE
  // ==========================================

  const showMessage = (
    title: string,
    message: string
  ) => {
    if (
      Platform.OS ===
      'web'
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
                    <View
                      style={
                        styles.navIconContainer
                      }
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
              onPress={
                handlePickProfilePicture
              }
              disabled={
                loading
              }
            >
              <Text
                style={
                  styles.uploadButtonText
                }
              >
                {profilePicture
                  ? 'Change Profile Picture'
                  : 'Upload a Profile Picture'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ==================================
              PROFILE PICTURE PREVIEW
          ================================== */}

          {profilePicture && (
            <View
              style={{
                width:
                  '100%',

                maxWidth:
                  1250,

                alignSelf:
                  'center',

                backgroundColor:
                  '#FFFFFF',

                borderRadius:
                  14,

                padding:
                  18,

                marginBottom:
                  20,

                flexDirection:
                  'row',

                alignItems:
                  'center',

                gap:
                  16,
              }}
            >
              <Image
                source={{
                  uri:
                    profilePicture.uri,
                }}
                style={{
                  width:
                    90,

                  height:
                    90,

                  borderRadius:
                    45,

                  backgroundColor:
                    '#E8E8E8',
                }}
                resizeMode="cover"
              />

              <View
                style={{
                  flex:
                    1,
                }}
              >
                <Text
                  style={{
                    color:
                      '#123266',

                    fontSize:
                      14,

                    fontWeight:
                      '800',

                    marginBottom:
                      4,
                  }}
                >
                  Profile Picture Selected
                </Text>

                <Text
                  style={{
                    color:
                      '#8C939F',

                    fontSize:
                      11,

                    marginBottom:
                      10,
                  }}
                >
                  This picture will be uploaded after the student account is created.
                </Text>

                <TouchableOpacity
                  onPress={
                    handleRemoveSelectedPicture
                  }
                  disabled={
                    loading
                  }
                >
                  <Text
                    style={{
                      color:
                        '#D32F2F',

                      fontSize:
                        11,

                      fontWeight:
                        '800',
                    }}
                  >
                    Remove Selected Picture
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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
                  const numbersOnly =
                    text.replace(
                      /[^0-9]/g,
                      ''
                    );

                  setContactNumber(
                    numbersOnly
                  );

                  clearError();
                }}
                keyboardType="phone-pad"
                maxLength={
                  15
                }
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

