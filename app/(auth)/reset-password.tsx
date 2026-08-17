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

export default function ResetPasswordScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      resetToken?: string | string[];
    }>();

  const resetToken = useMemo(() => {
    if (Array.isArray(params.resetToken)) {
      return params.resetToken[0] || "";
    }

    return params.resetToken || "";
  }, [params.resetToken]);

  const [newPassword, setNewPassword] =
    useState("");
  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");
  const [
    showPasswords,
    setShowPasswords,
  ] = useState(false);
  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");
  const [loading, setLoading] =
    useState(false);

  const handleReset = async () => {
    setErrorMessage("");

    if (!resetToken) {
      setErrorMessage(
        "The password-reset session is missing. Request another reset code."
      );
      return;
    }

    if (newPassword.length < 12) {
      setErrorMessage(
        "Password must contain at least 12 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        "The passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            resetToken,
            newPassword,
            confirmPassword,
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
            "Could not reset the password."
        );
      }

      if (
        Platform.OS === "web" &&
        typeof window !== "undefined"
      ) {
        window.alert(
          data.message ||
            "Password reset successfully."
        );
      } else {
        Alert.alert(
          "Password Reset",
          data.message ||
            "Password reset successfully."
        );
      }

      router.replace("/login");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not reset the password."
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
            <Text style={styles.title}>
              Create New Password
            </Text>

            <Text style={styles.subtitle}>
              Enter a new password containing at
              least 12 characters.
            </Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  ⚠️ {errorMessage}
                </Text>
              </View>
            ) : null}

            <Text style={styles.label}>
              New Password
            </Text>

            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPasswords}
              editable={!loading}
              autoCapitalize="none"
            />

            <Text style={styles.label}>
              Confirm New Password
            </Text>

            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPasswords}
              editable={!loading}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.showButton}
              onPress={() =>
                setShowPasswords(
                  (current) => !current
                )
              }
              disabled={loading}
            >
              <Text style={styles.showText}>
                {showPasswords
                  ? "Hide passwords"
                  : "Show passwords"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                loading
                  ? styles.disabledButton
                  : null,
              ]}
              onPress={handleReset}
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
                  Reset Password
                </Text>
              )}
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
    marginBottom: 24,
    textAlign: "center",
    color: "#64748b",
    lineHeight: 22,
  },
  label: {
    marginTop: 14,
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
  },
  showButton: {
    marginTop: 12,
    alignSelf: "flex-end",
  },
  showText: {
    color: "#0f766e",
    fontWeight: "700",
  },
  button: {
    height: 52,
    marginTop: 22,
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
    marginBottom: 10,
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
});