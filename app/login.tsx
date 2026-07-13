import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
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

const isWeb = Platform.OS === "web";

const CustomLogo = () => (
  <View
    style={{
      width: 40,
      height: 40,
      marginBottom: 16,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <View
      style={{
        position: "absolute",
        width: 38,
        height: 14,
        backgroundColor: "#3cd09d",
        borderRadius: 6,
        transform: [{ rotate: "45deg" }],
        opacity: 0.9,
      }}
    />
    <View
      style={{
        position: "absolute",
        width: 38,
        height: 14,
        backgroundColor: "#0052cc",
        borderRadius: 6,
        transform: [{ rotate: "-45deg" }],
        opacity: 0.9,
      }}
    />
  </View>
);

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Automatically wipes fields on screen focus shifts
  useFocusEffect(
    useCallback(() => {
      setIdentifier("");
      setPassword("");
      setIsPasswordVisible(false);
      setErrorMessage("");
    }, []),
  );

  const handleLogin = async () => {
    setErrorMessage("");

    if (!identifier.trim() || !password.trim()) {
      const emptyError = "Please fill up both fields to proceed.";
      setErrorMessage(emptyError);
      if (!isWeb) Alert.alert("Fields Missing", emptyError);
      return;
    }

    try {
      const BACKEND_URL = isWeb
        ? "http://localhost:5000/api/login"
        : "http://192.168.0.105:5000/api/login";

      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid email/phone or password.");
      }

      if (isWeb) {
        alert(`Welcome back, ${data.user.firstName}!`);
      } else {
        Alert.alert("Success", `Welcome back, ${data.user.firstName}!`);
      }

      // Navigate safely back to main homepage grid dashboard architecture
      router.push("/(tabs)");
    } catch (err: any) {
      setErrorMessage(err.message);
      if (!isWeb) Alert.alert("Login Failed", err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.loginCard}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            {/* Header / Logo */}
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <CustomLogo />
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Log in to manage your intelligent health ecosystem
              </Text>
            </View>

            {/* Dynamic Error Message Block Display */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            ) : null}

            {/* Input Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email or phone"
                placeholderTextColor="#94a3b8"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeIconText}>
                    {isPasswordVisible ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Action Button */}
            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.8}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>

            {/* Form Footer */}
            <View style={styles.formFooter}>
              <Text style={styles.footerText}>Didn't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/register")}>
                <Text style={styles.linkText}>Create an account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    width: "100%",
  },
  loginCard: {
    width: "90%",
    maxWidth: 420,
    paddingHorizontal: 24,
    paddingVertical: 36,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    ...Platform.select({
      web: { boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)" },
    }),
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  backButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
    paddingHorizontal: 10,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: "100%",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "600",
  },
  inputGroup: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#0f172a",
  },
  passwordContainer: {
    width: "100%",
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    overflow: "hidden",
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#0f172a",
  },
  eyeButton: {
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  eyeIconText: {
    fontSize: 14,
    color: "#0052cc",
    fontWeight: "700",
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0052cc",
  },
  loginButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#0052cc",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  formFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  linkText: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "700",
  },
});
