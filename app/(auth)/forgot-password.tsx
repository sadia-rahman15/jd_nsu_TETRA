import { useRouter } from "expo-router";
import React, { useState } from "react";
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

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");
  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async () => {
    setErrorMessage("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      setErrorMessage(
        "Please enter a valid email address."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
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
            "Could not request a reset code."
        );
      }

      router.push({
        pathname: "/verify-reset-code",
        params: {
          email: normalizedEmail,
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not request a reset code."
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
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.backText}>
                ← Back
              </Text>
            </TouchableOpacity>

            <Text style={styles.title}>
              Forgot Password
            </Text>

            <Text style={styles.subtitle}>
              Enter your registered email address.
              AmarCure will send a six-digit
              password-reset code.
            </Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  ⚠️ {errorMessage}
                </Text>
              </View>
            ) : null}

            <Text style={styles.label}>
              Email Address
            </Text>

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <TouchableOpacity
              style={[
                styles.button,
                loading
                  ? styles.disabledButton
                  : null,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  color="#ffffff"
                />
              ) : (
                <Text
                  style={styles.buttonText}
                >
                  Send Reset Code
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                router.replace("/login")
              }
              disabled={loading}
            >
              <Text style={styles.loginLink}>
                Return to Login
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
  backText: {
    color: "#0f766e",
    fontWeight: "700",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 24,
    color: "#64748b",
    lineHeight: 22,
  },
  label: {
    marginBottom: 8,
    color: "#334155",
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
  button: {
    height: 52,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: "#0f766e",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
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
  loginLink: {
    marginTop: 20,
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "700",
  },
});