import { useFocusEffect, useRouter } from "expo-router";
import React, {
  useCallback,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { saveAuthSession } from "@/services/auth-storage";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:5000";

const isWeb = Platform.OS === "web";

const CustomLogo = () => (
  <View style={styles.logoContainer}>
    <View
      style={[
        styles.logoBar,
        styles.logoBarGreen,
      ]}
    />

    <View
      style={[
        styles.logoBar,
        styles.logoBarBlue,
      ]}
    />
  </View>
);

export default function LoginScreen() {
  const router = useRouter();

  const [identifier, setIdentifier] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    isPasswordVisible,
    setIsPasswordVisible,
  ] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  useFocusEffect(
    useCallback(() => {
      setPassword("");
      setIsPasswordVisible(false);
      setErrorMessage("");
    }, [])
  );

  const showError = (message: string) => {
    setErrorMessage(message);

    if (!isWeb) {
      Alert.alert("Login Failed", message);
    }
  };

  const parseResponse = async (
    response: Response
  ) => {
    const responseText =
      await response.text();

    if (!responseText) {
      return {};
    }

    try {
      return JSON.parse(responseText);
    } catch {
      throw new Error(
        "The server returned an invalid response."
      );
    }
  };

  const handleLogin = async () => {
    setErrorMessage("");

    const normalizedIdentifier =
      identifier.trim();

    if (
      !normalizedIdentifier ||
      !password
    ) {
      showError(
        "Please enter your email or phone number and password."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            identifier:
              normalizedIdentifier,
            password,
          }),
        }
      );

      const data =
        await parseResponse(response);

      if (
        response.status === 403 &&
        data.code ===
          "EMAIL_NOT_VERIFIED"
      ) {
        router.push({
          pathname: "/verify-email",
          params: {
            email:
              data.email ||
              normalizedIdentifier,
          },
        });

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Invalid email, phone number or password."
        );
      }

      if (
        !data.accessToken ||
        !data.user
      ) {
        throw new Error(
          "The server did not return a valid login session."
        );
      }

      await saveAuthSession(
        data.accessToken,
        data.user
      );

      if (
        isWeb &&
        typeof window !== "undefined"
      ) {
        window.alert(
          `Welcome back, ${
            data.user.firstName ||
            "AmarCure user"
          }!`
        );
      } else {
        Alert.alert(
          "Login Successful",
          `Welcome back, ${
            data.user.firstName ||
            "AmarCure user"
          }!`
        );
      }

      router.replace("/(dashboard)");
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Could not connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContainer
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.loginCard}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text
                style={
                  styles.backButtonText
                }
              >
                ← Back
              </Text>
            </TouchableOpacity>

            <View
              style={
                styles.headingContainer
              }
            >
              <CustomLogo />

              <Text style={styles.title}>
                Welcome Back
              </Text>

              <Text
                style={styles.subtitle}
              >
                Log in to manage your
                intelligent health ecosystem
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text
                  style={styles.errorText}
                >
                  ⚠️ {errorMessage}
                </Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email or Phone Number
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter email or phone"
                placeholderTextColor="#94a3b8"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Password
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
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={
                    !isPasswordVisible
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={
                    handleLogin
                  }
                />

                <TouchableOpacity
                  style={
                    styles.showPasswordButton
                  }
                  onPress={() =>
                    setIsPasswordVisible(
                      (current) =>
                        !current
                    )
                  }
                  disabled={loading}
                >
                  <Text
                    style={
                      styles.showPasswordText
                    }
                  >
                    {isPasswordVisible
                      ? "Hide"
                      : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={
                styles.forgotPasswordButton
              }
              onPress={() =>
                router.push(
                  "/forgot-password"
                )
              }
              disabled={loading}
            >
              <Text
                style={
                  styles.forgotPasswordText
                }
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading
                  ? styles.disabledButton
                  : null,
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator
                  color="#ffffff"
                />
              ) : (
                <Text
                  style={
                    styles.loginButtonText
                  }
                >
                  Log In
                </Text>
              )}
            </TouchableOpacity>

            <View
              style={
                styles.registrationContainer
              }
            >
              <Text
                style={
                  styles.registrationText
                }
              >
                Do not have an account?
              </Text>

              <TouchableOpacity
                onPress={() =>
                  router.push("/register")
                }
                disabled={loading}
              >
                <Text
                  style={
                    styles.registrationLink
                  }
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={
                styles.verifyEmailButton
              }
              onPress={() => {
                const email =
                  identifier
                    .trim()
                    .toLowerCase();

                if (!email) {
                  showError(
                    "Enter your registered email address first."
                  );

                  return;
                }

                router.push({
                  pathname:
                    "/verify-email",
                  params: {
                    email,
                  },
                });
              }}
              disabled={loading}
            >
              <Text
                style={
                  styles.verifyEmailText
                }
              >
                Verify an existing account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdfa",
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  loginCard: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 28,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 18,
  },

  backButtonText: {
    color: "#0f766e",
    fontSize: 15,
    fontWeight: "700",
  },

  headingContainer: {
    alignItems: "center",
    marginBottom: 26,
  },

  logoContainer: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  logoBar: {
    position: "absolute",
    width: 46,
    height: 15,
    borderRadius: 8,
  },

  logoBarGreen: {
    backgroundColor: "#3cd09d",
    transform: [
      {
        rotate: "45deg",
      },
    ],
  },

  logoBarBlue: {
    backgroundColor: "#0052cc",
    transform: [
      {
        rotate: "-45deg",
      },
    ],
  },

  title: {
    color: "#0f172a",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },

  errorBox: {
    marginBottom: 20,
    padding: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },

  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 20,
  },

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    marginBottom: 8,
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: 15,
  },

  passwordContainer: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 14,
    color: "#0f172a",
    fontSize: 15,
  },

  showPasswordButton: {
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  showPasswordText: {
    color: "#0f766e",
    fontSize: 14,
    fontWeight: "700",
  },

  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 20,
  },

  forgotPasswordText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "700",
  },

  loginButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#0f766e",
    justifyContent: "center",
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  registrationContainer: {
    marginTop: 22,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 5,
  },

  registrationText: {
    color: "#64748b",
    fontSize: 14,
  },

  registrationLink: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "800",
  },

  verifyEmailButton: {
    marginTop: 18,
    alignItems: "center",
  },

  verifyEmailText: {
    color: "#0f766e",
    fontSize: 14,
    fontWeight: "700",
  },
});