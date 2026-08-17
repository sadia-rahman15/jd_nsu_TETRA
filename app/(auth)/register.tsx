import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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

const isWeb = Platform.OS === "web";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

interface CustomDropdownProps {
  label: string;
  options: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

const CustomDropdown = ({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder,
  disabled = false,
}: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (disabled) {
      return;
    }

    setIsOpen((currentValue) => !currentValue);
  };

  const handleSelection = (value: string) => {
    if (disabled) {
      return;
    }

    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[
          styles.dropdownHeader,
          disabled ? styles.disabledInput : null,
        ]}
        onPress={handleToggle}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Text
          style={{
            color: selectedValue ? "#0f172a" : "#94a3b8",
            fontSize: 14,
          }}
        >
          {selectedValue || placeholder}
        </Text>

        <Text style={styles.dropdownArrow}>
          {isOpen ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {isOpen && !disabled ? (
        <View style={styles.dropdownList}>
          <ScrollView
            style={styles.dropdownScroll}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {options.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.dropdownItem}
                onPress={() => handleSelection(item)}
              >
                <Text style={styles.dropdownItemText}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

export default function RegisterScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [heightUnit, setHeightUnit] =
    useState<"cm" | "inch">("cm");

  const [heightValue, setHeightValue] = useState("");
  const [weight, setWeight] = useState("");
  const [address, setAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [chronicDisease, setChronicDisease] = useState("");
  const [otherDisease, setOtherDisease] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const bloodGroupOptions = [
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
  ];

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
      setShowPassword(false);
      setShowConfirmPassword(false);
      setErrorMessage("");
      setLoading(false);
    }, [])
  );

  const showError = (
    title: string,
    message: string
  ) => {
    setErrorMessage(message);

    if (!isWeb) {
      Alert.alert(title, message);
    }
  };

  const validateForm = () => {
    const missingFields: string[] = [];

    if (!firstName.trim()) {
      missingFields.push("First Name");
    }

    if (!lastName.trim()) {
      missingFields.push("Last Name");
    }

    if (!email.trim()) {
      missingFields.push("Email Address");
    }

    if (!phone.trim()) {
      missingFields.push("Phone Number");
    }

    if (!heightValue.trim()) {
      missingFields.push("Height");
    }

    if (!weight.trim()) {
      missingFields.push("Weight");
    }

    if (!address.trim()) {
      missingFields.push("Address");
    }

    if (!bloodGroup) {
      missingFields.push("Blood Group");
    }

    if (!chronicDisease) {
      missingFields.push("Chronic Disease History");
    }

    if (
      chronicDisease === "Others" &&
      !otherDisease.trim()
    ) {
      missingFields.push("Specific Disease Detail");
    }

    if (!password) {
      missingFields.push("Password");
    }

    if (!confirmPassword) {
      missingFields.push("Confirm Password");
    }

    if (missingFields.length > 0) {
      const message =
        "Please fill in the missing information:\n\n• " +
        missingFields.join("\n• ");

      showError("Required Fields Missing", message);

      return false;
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      showError(
        "Invalid Email",
        "Please enter a valid email address."
      );

      return false;
    }

    const normalizedPhone = phone
      .replace(/\s+/g, "")
      .trim();

    if (!/^\+?[0-9]{10,15}$/.test(normalizedPhone)) {
      showError(
        "Invalid Phone Number",
        "Please enter a valid phone number containing 10 to 15 digits."
      );

      return false;
    }

    const numericHeight = Number(heightValue);

    if (
      !Number.isFinite(numericHeight) ||
      numericHeight <= 0
    ) {
      showError(
        "Invalid Height",
        "Please enter a valid height."
      );

      return false;
    }

    if (
      heightUnit === "cm" &&
      (numericHeight < 50 || numericHeight > 300)
    ) {
      showError(
        "Invalid Height",
        "Height in centimetres must be between 50 and 300."
      );

      return false;
    }

    if (
      heightUnit === "inch" &&
      (numericHeight < 20 || numericHeight > 120)
    ) {
      showError(
        "Invalid Height",
        "Height in inches must be between 20 and 120."
      );

      return false;
    }

    const numericWeight = Number(weight);

    if (
      !Number.isFinite(numericWeight) ||
      numericWeight < 2 ||
      numericWeight > 500
    ) {
      showError(
        "Invalid Weight",
        "Weight must be between 2 kg and 500 kg."
      );

      return false;
    }

    if (password.length < 12) {
      showError(
        "Weak Password",
        "Password must contain at least 12 characters."
      );

      return false;
    }

    if (password !== confirmPassword) {
      showError(
        "Password Mismatch",
        "Passwords do not match. Please verify your entries."
      );

      return false;
    }

    return true;
  };

const handleRegister = async () => {
  setErrorMessage("");

  if (!validateForm()) {
    return;
  }

  const normalizedEmail = email
    .trim()
    .toLowerCase();

  const normalizedPhone = phone
    .replace(/\s+/g, "")
    .trim();

  try {
    setLoading(true);

    const response = await fetch(
      `${API_BASE_URL}/api/register`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          heightUnit,
          heightValue:
            heightValue.trim(),
          weight: weight.trim(),
          address: address.trim(),
          bloodGroup,
          chronicDisease,
          otherDisease:
            otherDisease.trim(),
          password,
        }),
      }
    );

    const responseText =
      await response.text();

    let data: any = {};

    try {
      data = responseText
        ? JSON.parse(responseText)
        : {};
    } catch {
      throw new Error(
        "The server returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Could not create the account."
      );
    }

    router.replace({
      pathname: "/verify-email",
      params: {
        email:
          data.email ||
          normalizedEmail,
      },
    });
  } catch (error) {
    showError(
      "Registration Failed",
      error instanceof Error
        ? error.message
        : "Could not create the account."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContainer
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.registerCard}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>
                ← Back
              </Text>
            </TouchableOpacity>

            <View style={styles.headingContainer}>
              <Text style={styles.title}>
                Create Account
              </Text>

              <Text style={styles.subtitle}>
                Join AmarCure to build your smart
                medical history portfolio
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  ⚠️ {errorMessage}
                </Text>
              </View>
            ) : null}

            <View style={styles.row}>
              <View
                style={[
                  styles.inputGroup,
                  styles.flexOne,
                ]}
              >
                <Text style={styles.label}>
                  First Name
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    loading
                      ? styles.disabledInput
                      : null,
                  ]}
                  placeholder="John"
                  placeholderTextColor="#94a3b8"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <View
                style={[
                  styles.inputGroup,
                  styles.flexOne,
                ]}
              >
                <Text style={styles.label}>
                  Last Name
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    loading
                      ? styles.disabledInput
                      : null,
                  ]}
                  placeholder="Doe"
                  placeholderTextColor="#94a3b8"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email Address
              </Text>

              <TextInput
                style={[
                  styles.input,
                  loading
                    ? styles.disabledInput
                    : null,
                ]}
                placeholder="name@example.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Phone Number
              </Text>

              <TextInput
                style={[
                  styles.input,
                  loading
                    ? styles.disabledInput
                    : null,
                ]}
                placeholder="+8801XXXXXXXXX"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                editable={!loading}
              />
            </View>

            <View style={styles.row}>
              <View
                style={[
                  styles.inputGroup,
                  styles.flexOne,
                ]}
              >
                <View style={styles.heightHeading}>
                  <Text style={styles.label}>
                    Height
                  </Text>

                  <View style={styles.unitToggleGroup}>
                    <TouchableOpacity
                      onPress={() =>
                        setHeightUnit("cm")
                      }
                      disabled={loading}
                      style={[
                        styles.unitTab,
                        heightUnit === "cm"
                          ? styles.activeUnitTab
                          : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.unitTabText,
                          heightUnit === "cm"
                            ? styles.activeUnitTabText
                            : null,
                        ]}
                      >
                        cm
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        setHeightUnit("inch")
                      }
                      disabled={loading}
                      style={[
                        styles.unitTab,
                        heightUnit === "inch"
                          ? styles.activeUnitTab
                          : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.unitTabText,
                          heightUnit === "inch"
                            ? styles.activeUnitTabText
                            : null,
                        ]}
                      >
                        inch
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TextInput
                  style={[
                    styles.input,
                    loading
                      ? styles.disabledInput
                      : null,
                  ]}
                  placeholder={
                    heightUnit === "cm"
                      ? "e.g. 175"
                      : "e.g. 69"
                  }
                  placeholderTextColor="#94a3b8"
                  keyboardType="decimal-pad"
                  value={heightValue}
                  onChangeText={setHeightValue}
                  editable={!loading}
                />
              </View>

              <View
                style={[
                  styles.inputGroup,
                  styles.flexOne,
                ]}
              >
                <Text
                  style={[
                    styles.label,
                    styles.weightLabel,
                  ]}
                >
                  Weight (kg)
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    loading
                      ? styles.disabledInput
                      : null,
                  ]}
                  placeholder="e.g. 70"
                  placeholderTextColor="#94a3b8"
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={setWeight}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.addressBloodRow}>
              <View style={styles.addressContainer}>
                <Text style={styles.label}>
                  Address
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    loading
                      ? styles.disabledInput
                      : null,
                  ]}
                  placeholder="Dhaka, Bangladesh"
                  placeholderTextColor="#94a3b8"
                  value={address}
                  onChangeText={setAddress}
                  editable={!loading}
                />
              </View>

              <View style={styles.bloodGroupContainer}>
                <CustomDropdown
                  label="Blood Group"
                  options={bloodGroupOptions}
                  selectedValue={bloodGroup}
                  onValueChange={setBloodGroup}
                  placeholder="Select"
                  disabled={loading}
                />
              </View>
            </View>

            <View style={styles.diseaseDropdownWrapper}>
              <CustomDropdown
                label="Chronic Disease History"
                options={diseaseOptions}
                selectedValue={chronicDisease}
                onValueChange={(value) => {
                  setChronicDisease(value);

                  if (value !== "Others") {
                    setOtherDisease("");
                  }
                }}
                placeholder="Select Primary Condition"
                disabled={loading}
              />
            </View>

            {chronicDisease === "Others" ? (
              <View style={styles.otherDiseaseGroup}>
                <Text style={styles.label}>
                  Specify Other Disease or Allergy
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    loading
                      ? styles.disabledInput
                      : null,
                  ]}
                  placeholder="Type condition here..."
                  placeholderTextColor="#94a3b8"
                  value={otherDisease}
                  onChangeText={setOtherDisease}
                  editable={!loading}
                />
              </View>
            ) : null}

            <View style={styles.passwordGroup}>
              <Text style={styles.label}>
                Password
              </Text>

              <View
                style={[
                  styles.passwordContainer,
                  loading
                    ? styles.disabledInput
                    : null,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  placeholder="At least 12 characters"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />

                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() =>
                    setShowPassword(
                      (currentValue) =>
                        !currentValue
                    )
                  }
                  disabled={loading}
                >
                  <Text style={styles.eyeIconText}>
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.passwordHint}>
                Use at least 12 characters.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Confirm Password
              </Text>

              <View
                style={[
                  styles.passwordContainer,
                  loading
                    ? styles.disabledInput
                    : null,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />

                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() =>
                    setShowConfirmPassword(
                      (currentValue) =>
                        !currentValue
                    )
                  }
                  disabled={loading}
                >
                  <Text style={styles.eyeIconText}>
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.registerButton,
                loading
                  ? styles.disabledButton
                  : null,
              ]}
              activeOpacity={0.8}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator
                    color="#ffffff"
                    size="small"
                  />

                  <Text style={styles.buttonText}>
                    Creating Account...
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  Register Account
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.formFooter}>
              <Text style={styles.footerText}>
                Already have an account?{" "}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  router.replace("/login")
                }
                disabled={loading}
              >
                <Text style={styles.linkText}>
                  Log In
                </Text>
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
  keyboardContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 14,
  },
  registerCard: {
    width: "100%",
    maxWidth: 500,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    ...Platform.select({
      web: {
        boxShadow:
          "0 10px 30px rgba(15, 23, 42, 0.06)",
      },
      default: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  backButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },
  headingContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 27,
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
    lineHeight: 19,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  flexOne: {
    flex: 1,
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
  disabledInput: {
    opacity: 0.65,
  },
  heightHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  weightLabel: {
    marginBottom: 12,
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
  addressBloodRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    zIndex: 3000,
  },
  addressContainer: {
    flex: 1.8,
  },
  bloodGroupContainer: {
    flex: 1.2,
  },
  diseaseDropdownWrapper: {
    zIndex: 2000,
    marginTop: 18,
  },
  otherDiseaseGroup: {
    width: "100%",
    marginTop: 18,
    marginBottom: 16,
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
  dropdownArrow: {
    color: "#64748b",
    fontSize: 10,
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
      web: {
        boxShadow:
          "0 10px 25px rgba(0,0,0,0.1)",
      },
      default: {
        elevation: 8,
      },
    }),
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  dropdownItemText: {
    color: "#334155",
    fontSize: 14,
  },
  passwordGroup: {
    width: "100%",
    marginTop: 18,
    marginBottom: 16,
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
  passwordHint: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 6,
  },
  registerButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#0052cc",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.65,
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
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