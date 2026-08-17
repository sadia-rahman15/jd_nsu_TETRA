import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import React, {
  useMemo,
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

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:5000";

const isWeb = Platform.OS === "web";

const showMessage = (
  title: string,
  message: string
) => {
  if (
    isWeb &&
    typeof window !== "undefined"
  ) {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function VerifyEmailScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      email?: string | string[];
    }>();

  const email = useMemo(() => {
    if (Array.isArray(params.email)) {
      return params.email[0] || "";
    }

    return params.email || "";
  }, [params.email]);

  const [code, setCode] = useState("");
  const [loading, setLoading] =
    useState(false);
  const [resending, setResending] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  const parseResponse = async (
    response: Response
  ) => {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        error:
          "The server returned an invalid response.",
      };
    }
  };

  const handleVerify = async () => {
    setErrorMessage("");

    const normalizedCode =
      code.replace(/\D/g, "").slice(0, 6);

    if (!email) {
      setErrorMessage(
        "The email address is missing. Please register again."
      );
      return;
    }

    if (normalizedCode.length !== 6) {
      setErrorMessage(
        "Please enter the six-digit verification code."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/verify-email`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            code: normalizedCode,
          }),
        }
      );

      const data =
        await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not verify the email address."
        );
      }

      showMessage(
        "Email Verified",
        data.message ||
          "Your email has been verified successfully."
      );

      router.replace("/login");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not verify the email address."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage("");

    if (!email) {
      setErrorMessage(
        "The email address is missing."
      );
      return;
    }

    try {
      setResending(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data =
        await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not resend the verification code."
        );
      }

      showMessage(
        "Code Sent",
        data.message ||
          "A new verification code was sent."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not resend the verification code."
      );
    } finally {
      setResending(false);
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
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.icon}>✉️</Text>

            <Text style={styles.title}>
              Verify Your Email
            </Text>

            <Text style={styles.subtitle}>
              We sent a six-digit verification
              code to:
            </Text>

            <Text style={styles.email}>
              {email || "Unknown email"}
            </Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  ⚠️ {errorMessage}
                </Text>
              </View>
            ) : null}

            <Text style={styles.label}>
              Verification Code
            </Text>

            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={(value) =>
                setCode(
                  value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor="#94a3b8"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              editable={!loading}
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                loading
                  ? styles.disabledButton
                  : null,
              ]}
              onPress={handleVerify}
              disabled={loading || resending}
            >
              {loading ? (
                <ActivityIndicator
                  color="#ffffff"
                />
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Verify Email
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleResend}
              disabled={loading || resending}
            >
              {resending ? (
                <ActivityIndicator
                  color="#0f766e"
                />
              ) : (
                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  Resend Code
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                router.replace("/login")
              }
              disabled={loading || resending}
            >
              <Text style={styles.loginLink}>
                Back to Login
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
  card: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 5,
  },
  icon: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: "#64748b",
    textAlign: "center",
  },
  email: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 16,
    fontWeight: "700",
    color: "#0f766e",
    textAlign: "center",
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  codeInput: {
    height: 64,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 10,
    textAlign: "center",
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  errorBox: {
    marginBottom: 18,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    height: 52,
    marginTop: 22,
    borderRadius: 12,
    backgroundColor: "#0f766e",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    height: 50,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0f766e",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#0f766e",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginLink: {
    marginTop: 20,
    color: "#2563eb",
    fontWeight: "700",
    textAlign: "center",
  },
});