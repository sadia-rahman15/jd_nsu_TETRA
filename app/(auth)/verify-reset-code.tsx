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

export default function VerifyResetCodeScreen() {
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
  const [errorMessage, setErrorMessage] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [resending, setResending] =
    useState(false);

  const handleVerify = async () => {
    setErrorMessage("");

    const normalizedCode =
      code.replace(/\D/g, "").slice(0, 6);

    if (!email) {
      setErrorMessage(
        "The email address is missing."
      );
      return;
    }

    if (normalizedCode.length !== 6) {
      setErrorMessage(
        "Please enter the six-digit reset code."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/verify-reset-code`,
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

      const text = await response.text();

      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not verify the reset code."
        );
      }

      if (!data.resetToken) {
        throw new Error(
          "The server did not return a reset session."
        );
      }

      router.replace({
        pathname: "/reset-password",
        params: {
          resetToken: data.resetToken,
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not verify the reset code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage("");

    try {
      setResending(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/forgot-password`,
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

      const text = await response.text();

      let data: any = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not resend the reset code."
        );
      }

      if (
        Platform.OS === "web" &&
        typeof window !== "undefined"
      ) {
        window.alert(
          "A new reset code was requested. Check your email."
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not resend the reset code."
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
            <Text style={styles.title}>
              Enter Reset Code
            </Text>

            <Text style={styles.subtitle}>
              Enter the six-digit code sent to:
            </Text>

            <Text style={styles.email}>
              {email}
            </Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  ⚠️ {errorMessage}
                </Text>
              </View>
            ) : null}

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
                  Verify Code
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
                router.replace(
                  "/forgot-password"
                )
              }
            >
              <Text style={styles.backLink}>
                Use another email
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
    padding: 28,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    textAlign: "center",
    color: "#64748b",
  },
  email: {
    marginTop: 6,
    marginBottom: 24,
    textAlign: "center",
    color: "#0f766e",
    fontWeight: "700",
  },
  codeInput: {
    height: 64,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8fafc",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 10,
    textAlign: "center",
    color: "#0f172a",
  },
  primaryButton: {
    height: 52,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: "#0f766e",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
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
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
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
    lineHeight: 20,
  },
  backLink: {
    marginTop: 20,
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "700",
  },
});