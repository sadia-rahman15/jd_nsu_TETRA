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

const CustomDropdown = ({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder,
}: {
  label: string;
  options: string[];
  selectedValue: string;
  onValueChange: (val: string) => void;
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownHeader}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.8}
      >
        <Text
          style={{ color: selectedValue ? "#0f172a" : "#94a3b8", fontSize: 14 }}
        >
          {selectedValue || placeholder}
        </Text>
        <Text style={{ color: "#64748b", fontSize: 10 }}>
          {isOpen ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownList}>
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
            {options.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.dropdownItem}
                onPress={() => {
                  onValueChange(item);
                  setIsOpen(false);
                }}
              >
                <Text style={{ color: "#334155", fontSize: 14 }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default function RegisterScreen() {
  const router = useRouter();

  // Form State Values
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [heightUnit, setHeightUnit] = useState<"cm" | "inch">("cm");
  const [heightValue, setHeightValue] = useState("");
  const [weight, setWeight] = useState("");
  const [address, setAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [chronicDisease, setChronicDisease] = useState("");
  const [otherDisease, setOtherDisease] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Automatically clears out the form whenever the user visits this screen
  useFocusEffect(
    useCallback(() => {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setHeightUnit("cm");
      setHeightValue("");
      setWeight("");
      setAddress("");
      setBloodGroup("");
      setChronicDisease("");
      setOtherDisease("");
      setPassword("");
      setConfirmPassword("");
      setShowPass(false);
      setShowConfirmPass(false);
      setErrorMessage("");
    }, []),
  );

  const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const diseaseOptions = [
    "None / Healthy",
    "Allergy / Asthma",
    "Diabetes",
    "Hypertension (High Blood Pressure)",
    "Heart Condition",
    "Chronic Kidney Disease",
    "Gastric / GERD",
    "Migraine",
    "Others",
  ];

  const handleRegister = async () => {
    setErrorMessage("");
    let missingFields: string[] = [];

    if (!firstName.trim()) missingFields.push("First Name");
    if (!lastName.trim()) missingFields.push("Last Name");
    if (!email.trim()) missingFields.push("Email Address");
    if (!phone.trim()) missingFields.push("Phone Number");
    if (!heightValue.trim()) missingFields.push("Height");
    if (!weight.trim()) missingFields.push("Weight");
    if (!address.trim()) missingFields.push("Address");
    if (!bloodGroup) missingFields.push("Blood Group");
    if (!chronicDisease) missingFields.push("Chronic Disease History");
    if (chronicDisease === "Others" && !otherDisease.trim())
      missingFields.push("Specific Disease Detail");
    if (!password) missingFields.push("Password");
    if (!confirmPassword) missingFields.push("Confirm Password");

    if (missingFields.length > 0) {
      const alertText = `Please fill up the missing information:\n• ${missingFields.join("\n• ")}`;
      setErrorMessage(alertText);
      if (Platform.OS !== "web") {
        Alert.alert("Required Fields Missing", alertText);
      }
      return;
    }

    if (password !== confirmPassword) {
      const matchError = "Passwords do not match. Please verify your entries.";
      setErrorMessage(matchError);
      if (Platform.OS !== "web") {
        Alert.alert("Error", matchError);
      }
      return;
    }

    try {
      // Connects cleanly to your standalone XAMPP server database layer across the home router
      const BACKEND_URL =
        Platform.OS === "web"
          ? "http://localhost:5000/api/register"
          : "http://192.168.0.105:5000/api/register";

      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          heightUnit,
          heightValue,
          weight,
          address,
          bloodGroup,
          chronicDisease,
          otherDisease,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (isWeb) {
        alert("Registration Successful!");
      } else {
        Alert.alert("Success", "Account Created Successfully!");
      }
      router.push("/(tabs)/login");
    } catch (err: any) {
      setErrorMessage(err.message || "Server connection failed.");
      if (Platform.OS !== "web") {
        Alert.alert("Registration Failed", err.message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, width: "100%" }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.registerCard}>
            {/* Back Arrow */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <View style={{ marginBottom: 24 }}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join AmarCure to build your smart medical history portfolio
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Name Fields Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  placeholderTextColor="#94a3b8"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor="#94a3b8"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            {/* Email & Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+8801XXXXXXXXX"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Height & Weight Matrix */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <Text style={styles.label}>Height</Text>
                  <View style={styles.unitToggleGroup}>
                    <TouchableOpacity
                      onPress={() => setHeightUnit("cm")}
                      style={[
                        styles.unitTab,
                        heightUnit === "cm" && styles.activeUnitTab,
                      ]}
                    >
                      <Text
                        style={[
                          styles.unitTabText,
                          heightUnit === "cm" && styles.activeUnitTabText,
                        ]}
                      >
                        cm
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setHeightUnit("inch")}
                      style={[
                        styles.unitTab,
                        heightUnit === "inch" && styles.activeUnitTab,
                      ]}
                    >
                      <Text
                        style={[
                          styles.unitTabText,
                          heightUnit === "inch" && styles.activeUnitTabText,
                        ]}
                      >
                        inch
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={heightUnit === "cm" ? "e.g. 175" : "e.g. 5'9"}
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={heightValue}
                  onChangeText={setHeightValue}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { marginBottom: 12 }]}>
                  Weight (kg)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 70"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
            </View>

            {/* Address & Blood Group Dropdown Matrix Row */}
            <View style={[styles.row, { zIndex: 3000 }]}>
              <View style={[styles.inputGroup, { flex: 1.8, marginBottom: 0 }]}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Dhaka, Bangladesh"
                  placeholderTextColor="#94a3b8"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
              <View style={{ flex: 1.2 }}>
                <CustomDropdown
                  label="Blood Group"
                  options={bloodGroupOptions}
                  selectedValue={bloodGroup}
                  onValueChange={setBloodGroup}
                  placeholder="Select"
                />
              </View>
            </View>

            {/* Chronic Diseases Condition Options Dropdown Row */}
            <View style={{ zIndex: 2000, marginTop: 18 }}>
              <CustomDropdown
                label="Chronic Disease History"
                options={diseaseOptions}
                selectedValue={chronicDisease}
                onValueChange={setChronicDisease}
                placeholder="Select Primary Condition"
              />
            </View>

            {chronicDisease === "Others" && (
              <View style={[styles.inputGroup, { marginTop: 18 }]}>
                <Text style={styles.label}>
                  Specify Other Disease / Allergy
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Type condition here..."
                  placeholderTextColor="#94a3b8"
                  value={otherDisease}
                  onChangeText={setOtherDisease}
                />
              </View>
            )}

            {/* Passwords Fields */}
            <View style={[styles.inputGroup, { marginTop: 18 }]}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Create password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPass(!showPass)}
                >
                  <Text style={styles.eyeIconText}>
                    {showPass ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showConfirmPass}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPass(!showConfirmPass)}
                >
                  <Text style={styles.eyeIconText}>
                    {showConfirmPass ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Action Block */}
            <TouchableOpacity
              style={styles.registerButton}
              activeOpacity={0.8}
              onPress={handleRegister}
            >
              <Text style={styles.buttonText}>Register Account</Text>
            </TouchableOpacity>

            <View style={styles.formFooter}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/login")}>
                <Text style={styles.linkText}>Log In</Text>
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
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
  registerCard: {
    width: "90%",
    maxWidth: 480,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    ...Platform.select({
      web: { boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)" },
    }),
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  backButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    fontWeight: "500",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    width: "100%",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  inputGroup: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    height: 48,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#0f172a",
  },
  unitToggleGroup: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    padding: 2,
  },
  unitTab: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeUnitTab: {
    backgroundColor: "#ffffff",
  },
  unitTabText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  activeUnitTabText: {
    color: "#0052cc",
    fontWeight: "700",
  },
  dropdownContainer: {
    width: "100%",
    position: "relative",
  },
  dropdownHeader: {
    width: "100%",
    height: 48,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownList: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    marginTop: 4,
    position: "absolute",
    top: 72,
    left: 0,
    right: 0,
    zIndex: 9999,
    ...Platform.select({
      web: { boxShadow: "0 10px 25px rgba(0,0,0,0.1)" },
      default: { elevation: 5 },
    }),
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  passwordContainer: {
    width: "100%",
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    overflow: "hidden",
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#0f172a",
  },
  eyeButton: {
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  eyeIconText: {
    fontSize: 13,
    color: "#0052cc",
    fontWeight: "700",
  },
  registerButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#0052cc",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  formFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  footerText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  linkText: {
    fontSize: 13,
    color: "#10b981",
    fontWeight: "700",
  },
});
