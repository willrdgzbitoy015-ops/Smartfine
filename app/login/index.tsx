import {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useRouter,
} from 'expo-router';

import {
  styles,
} from './login.styles';

import {
  API_BASE,
} from '@/constants/api';

export default function LoginScreen() {
  const router =
    useRouter();

  const { width } =
    useWindowDimensions();

  const isTablet =
    width >= 768;

  // ==========================================
  // LOGIN FORM STATE
  // ==========================================

  const [
    username,
    setUsername,
  ] =
    useState('');

  const [
    password,
    setPassword,
  ] =
    useState('');

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    rememberMe,
    setRememberMe,
  ] =
    useState(false);

  // ==========================================
  // LOGIN ERROR STATE
  // ==========================================

  const [
    errorTitle,
    setErrorTitle,
  ] =
    useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  // ==========================================
  // SHOW ERROR
  // ==========================================

  const showError =
    (
      title: string,
      message: string
    ) => {
      setErrorTitle(
        title
      );

      setErrorMessage(
        message
      );
    };

  // ==========================================
  // CLEAR ERROR
  // ==========================================

  const clearError =
    () => {
      setErrorTitle(
        ''
      );

      setErrorMessage(
        ''
      );
    };

  // ==========================================
  // AUTO-HIDE ERROR
  // ==========================================

  useEffect(() => {
    if (
      !errorMessage
    ) {
      return;
    }

    const timer =
      setTimeout(
        () => {
          setErrorTitle(
            ''
          );

          setErrorMessage(
            ''
          );
        },
        3000
      );

    return () => {
      clearTimeout(
        timer
      );
    };
  }, [
    errorMessage,
  ]);

  // ==========================================
  // SAVE LOGIN SESSION
  // ==========================================

  const saveLoginSession =
    async (
      data: any
    ) => {
      if (
        !data.token
      ) {
        throw new Error(
          'LOGIN_TOKEN_MISSING'
        );
      }

      if (
        !data.user
      ) {
        throw new Error(
          'LOGIN_USER_MISSING'
        );
      }

      const userEmail =
        String(
          data.user.email ||
            data.user.username ||
            ''
        );

      const userId =
        String(
          data.user.id
        );

      const userRole =
        String(
          data.user.role
        );

      // ======================================
      // STORE AUTH DATA
      // ======================================

      await AsyncStorage.multiSet([
        [
          'token',
          String(
            data.token
          ),
        ],

        [
          'userEmail',
          userEmail,
        ],

        [
          'userId',
          userId,
        ],

        [
          'userRole',
          userRole,
        ],
      ]);

      console.log(
        'Login session saved.'
      );

      console.log(
        'Saved user ID:',
        userId
      );

      console.log(
        'Saved role:',
        userRole
      );
    };

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin =
    async () => {
      clearError();

      // ======================================
      // EMPTY FIELD VALIDATION
      // ======================================

      if (
        !username.trim() ||
        !password.trim()
      ) {
        showError(
          'Missing Information',
          'Please enter your ID/Username and password.'
        );

        return;
      }

      try {
        setLoading(
          true
        );

        console.log(
          'Trying to login...'
        );

        console.log(
          'Username:',
          username.trim()
        );

        // ====================================
        // LOGIN REQUEST
        // ====================================

        const response =
          await fetch(
            `${API_BASE}/api/auth/login`,
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
                    username.trim(),

                  password,
                }),
            }
          );

        console.log(
          'Response status:',
          response.status
        );

        const data =
          await response.json();

        console.log(
          'Login response:',
          data
        );

        // ====================================
        // LOGIN FAILED
        // ====================================

        if (
          !response.ok
        ) {
          // ==================================
          // INVALID CREDENTIALS
          // ==================================

          if (
            data.code ===
            'INVALID_CREDENTIALS'
          ) {
            let message =
              data.message ||
              'Invalid username or password.';

            if (
              typeof data.attemptsRemaining ===
              'number'
            ) {
              const attemptWord =
                data.attemptsRemaining ===
                1
                  ? 'attempt'
                  : 'attempts';

              message +=
                `\n${data.attemptsRemaining} ${attemptWord} remaining before temporary lockout.`;
            }

            showError(
              'Login Failed',
              message
            );

            setPassword(
              ''
            );

            return;
          }

          // ==================================
          // ACCOUNT LOCKED
          // ==================================

          if (
            data.code ===
            'ACCOUNT_LOCKED'
          ) {
            let message =
              data.message ||
              'This account is temporarily locked.';

            if (
              !data.message &&
              typeof data.retryAfterMinutes ===
                'number'
            ) {
              message =
                `This account is temporarily locked. ` +
                `Please try again in approximately ${data.retryAfterMinutes} minute(s).`;
            }

            showError(
              'Account Temporarily Locked',
              message
            );

            setPassword(
              ''
            );

            return;
          }

          // ==================================
          // DEACTIVATED
          // ==================================

          if (
            data.code ===
            'ACCOUNT_DEACTIVATED'
          ) {
            showError(
              'Account Deactivated',
              data.message ||
                'This account has been deactivated. Please contact the SmartFine administrator.'
            );

            setPassword(
              ''
            );

            return;
          }

          // ==================================
          // ACCOUNT UNAVAILABLE
          // ==================================

          if (
            data.code ===
            'ACCOUNT_UNAVAILABLE'
          ) {
            showError(
              'Account Unavailable',
              data.message ||
                'This account is currently unavailable. Please contact the SmartFine administrator.'
            );

            setPassword(
              ''
            );

            return;
          }

          // ==================================
          // MISSING CREDENTIALS
          // ==================================

          if (
            data.code ===
            'MISSING_CREDENTIALS'
          ) {
            showError(
              'Missing Information',
              data.message ||
                'Username and password are required.'
            );

            return;
          }

          // ==================================
          // SERVER ERROR
          // ==================================

          if (
            data.code ===
            'SERVER_ERROR'
          ) {
            showError(
              'Server Error',
              data.message ||
                'An error occurred while logging in.'
            );

            return;
          }

          // ==================================
          // OTHER ERROR
          // ==================================

          showError(
            'Login Failed',
            data.message ||
              'Unable to log in. Please try again.'
          );

          return;
        }

        // ====================================
        // VALIDATE RESPONSE
        // ====================================

        if (
          !data.user ||
          !data.user.role
        ) {
          showError(
            'Login Error',
            'The server did not return a valid user role.'
          );

          return;
        }

        if (
          !data.token
        ) {
          showError(
            'Login Error',
            'The server did not return a valid login token.'
          );

          return;
        }

        // ====================================
        // LOGIN SUCCESS
        // ====================================

        clearError();

        // ====================================
        // SAVE TOKEN + CURRENT USER
        // ====================================

        await saveLoginSession(
          data
        );

        const role =
          String(
            data.user.role
          ).toUpperCase();

        console.log(
          'Logged-in role:',
          role
        );

        // ====================================
        // ROLE REDIRECTION
        // ====================================

        if (
          role ===
          'ADMIN'
        ) {
          console.log(
            'Redirecting to Admin Dashboard...'
          );

          router.replace(
            '/admin/dashboard'
          );
        } else if (
          role ===
          'FINES_OFFICER'
        ) {
          console.log(
            'Redirecting to Officer Dashboard...'
          );

          router.replace(
            '/officer/dashboard'
          );
        } else if (
          role ===
          'STUDENT'
        ) {
          console.log(
            'Redirecting to Student Dashboard...'
          );

          router.replace(
            '/student/dashboard'
          );
        } else {
          // Remove invalid session if role
          // returned by server is unsupported.

          await AsyncStorage.multiRemove([
            'token',
            'userEmail',
            'userId',
            'userRole',
          ]);

          showError(
            'Login Error',
            `Unknown user role: ${role}`
          );
        }
      } catch (error) {
        console.error(
          'Login error:',
          error
        );

        showError(
          'Connection Error',
          'Could not connect to the SmartFine server. Please check your connection and try again.'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  // ==========================================
  // UI
  // ==========================================

  return (
    <KeyboardAvoidingView
      style={
        styles.screen
      }
      behavior={
        Platform.OS ===
        'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,

          isTablet
            ? styles.tabletContainer
            : styles.phoneContainer,
        ]}
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* ======================================
            BRAND AREA
        ====================================== */}

        <View
          style={[
            styles.brandSection,

            isTablet
              ? styles.brandTablet
              : styles.brandPhone,
          ]}
        >
          <Image
            source={require('../../assets/branding/smartfineNoBG.png')}
            style={[
              styles.brandLogo,

              isTablet
                ? styles.brandLogoTablet
                : styles.brandLogoPhone,
            ]}
            resizeMode="contain"
          />

          <Text
            style={[
              styles.tagline,

              isTablet
                ? styles.taglineTablet
                : styles.taglinePhone,
            ]}
          >
            A Student Fines Monitoring and{'\n'}
            Management System
          </Text>
        </View>

        {/* ======================================
            LOGIN AREA
        ====================================== */}

        <View
          style={[
            styles.loginSection,

            isTablet
              ? styles.loginTablet
              : styles.loginPhone,
          ]}
        >
          <View
            style={[
              styles.loginCard,

              isTablet
                ? styles.loginCardTablet
                : styles.loginCardPhone,
            ]}
          >
            {/* ==================================
                SMALL LOGO
            ================================== */}

            <View
              style={
                styles.smallLogoBox
              }
            >
              <Image
                source={require('../../assets/branding/smartfine-logo.png')}
                style={
                  styles.smallLogo
                }
                resizeMode="contain"
              />
            </View>

            {/* ==================================
                WELCOME
            ================================== */}

            <Text
              style={
                styles.welcomeText
              }
            >
              Welcome Back!
            </Text>

            <Text
              style={
                styles.loginTitle
              }
            >
              LOGIN
            </Text>

            {/* ==================================
                USERNAME
            ================================== */}

            <TextInput
              style={
                styles.input
              }
              placeholder="Enter your ID or Username"
              placeholderTextColor="#777777"
              value={
                username
              }
              onChangeText={(
                text
              ) => {
                setUsername(
                  text
                );

                clearError();
              }}
              autoCapitalize="none"
              autoCorrect={
                false
              }
              editable={
                !loading
              }
            />

            {/* ==================================
                PASSWORD
            ================================== */}

            <View
              style={
                styles.passwordContainer
              }
            >
              <TextInput
                style={
                  styles.passwordInput
                }
                placeholder="Password"
                placeholderTextColor="#777777"
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
                onSubmitEditing={
                  handleLogin
                }
              />

              <TouchableOpacity
                onPress={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                style={
                  styles.showButton
                }
                disabled={
                  loading
                }
              >
                <Text
                  style={
                    styles.showText
                  }
                >
                  {showPassword
                    ? 'Hide'
                    : 'Show'}
                </Text>
              </TouchableOpacity>
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
                  {
                    errorTitle
                  }
                </Text>

                <Text
                  style={
                    styles.errorMessage
                  }
                >
                  {
                    errorMessage
                  }
                </Text>
              </View>
            )}

            {/* ==================================
                OPTIONS
            ================================== */}

            <View
              style={
                styles.optionsRow
              }
            >
              <TouchableOpacity
                style={
                  styles.rememberRow
                }
                onPress={() =>
                  setRememberMe(
                    !rememberMe
                  )
                }
                disabled={
                  loading
                }
              >
                <View
                  style={[
                    styles.checkbox,

                    rememberMe &&
                      styles.checkboxChecked,
                  ]}
                >
                  {rememberMe && (
                    <Text
                      style={
                        styles.checkmark
                      }
                    >
                      ✓
                    </Text>
                  )}
                </View>

                <Text
                  style={
                    styles.rememberText
                  }
                >
                  Remember me
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={
                  loading
                }
              >
                <Text
                  style={
                    styles.forgotText
                  }
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* ==================================
                LOGIN BUTTON
            ================================== */}

            <TouchableOpacity
              style={[
                styles.loginButton,

                loading &&
                  styles.disabledButton,
              ]}
              onPress={
                handleLogin
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
                    styles.loginButtonText
                  }
                >
                  LOGIN
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ======================================
              SECURITY TEXT
          ====================================== */}

          <Text
            style={
              styles.securityText
            }
          >
            Secure access for students and authorized school personnel
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}