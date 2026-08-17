import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  authorizedFetch,
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} from "@/services/auth-storage";

const isWeb = Platform.OS === "web";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

const showMessage = (title: string, message: string) => {
  if (isWeb && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const parseJsonResponse = async (response: Response) => {
  const responseText = await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return { error: responseText || "The server returned an invalid response." };
  }
};

const calculateBMI = (hVal: string, hUnit: "cm" | "inch", wVal: string) => {
  const h = parseFloat(hVal);
  const w = parseFloat(wVal);

  if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) return "N/A";

  const heightInMeters = hUnit === "cm" ? h / 100 : h * 0.0254;
  const bmi = w / (heightInMeters * heightInMeters);
  return bmi.toFixed(1);
};

const availableAllergies = [
  "Penicillin",
  "Dust",
  "Peanuts",
  "Latex",
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Migraine",
];

interface ProfileScreenProps {
  setBmi: React.Dispatch<React.SetStateAction<number>>;
}

export default function ProfileScreen({ setBmi }: ProfileScreenProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [heightValue, setHeightValue] = useState("170");
  const [heightUnit, setHeightUnit] = useState<"cm" | "inch">("cm");
  const [weight, setWeight] = useState("65");
  const [calculatedBmi, setCalculatedBmi] = useState("N/A");

  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [isDonor, setIsDonor] = useState(true);
  const [lastDonationDate, setLastDonationDate] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);

  const handleUnauthorized = async () => {
    await clearAuthSession();
    showMessage("Session Expired", "Your login session has expired. Please log in again.");
    router.replace("/login");
  };

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);

        const response = await authorizedFetch(`${API_BASE_URL}/api/user/profile`);

        if (response.status === 401) {
          await handleUnauthorized();
          return;
        }

        const data = await parseJsonResponse(response);

        if (!response.ok) {
          throw new Error(data.error || "Could not load your profile.");
        }

        if (!active) {
          return;
        }

        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setEmail(data.email || "");
        setPhone(String(data.phone || ""));
        setBloodGroup(data.bloodGroup || "O+");
        setHeightValue(String(data.heightValue || "170"));
        setHeightUnit(data.heightUnit === "inch" ? "inch" : "cm");
        setWeight(String(data.weight || "65"));
        setLastDonationDate("");

        if (data.chronicDisease && data.chronicDisease !== "None / Healthy") {
          setSelectedAllergies((prev) => Array.from(new Set([...prev, data.chronicDisease])));
        }
      } catch (error: any) {
        showMessage("Error", error.message || "Could not load your profile.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const bmiValue = calculateBMI(heightValue, heightUnit, weight);
    setCalculatedBmi(bmiValue);

    const numericBmi = Number(bmiValue);

    if (Number.isFinite(numericBmi) && numericBmi > 0) {
      setBmi(numericBmi);
    }
  }, [heightValue, heightUnit, weight, setBmi]);

  const toggleAllergy = (item: string) => {
    if (selectedAllergies.includes(item)) {
      setSelectedAllergies(selectedAllergies.filter((a) => a !== item));
    } else {
      setSelectedAllergies([...selectedAllergies, item]);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await authorizedFetch(`${API_BASE_URL}/api/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          bloodGroup,
          heightValue,
          weight,
        }),
      });

      if (response.status === 401) {
        await handleUnauthorized();
        return;
      }

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Could not update your profile.");
      }

      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
      setPhone(String(data.phone || ""));
      setBloodGroup(data.bloodGroup || "O+");
      setHeightValue(String(data.heightValue || "170"));
      setWeight(String(data.weight || "65"));

      const session = await getAuthSession();

      if (session) {
        await saveAuthSession(session.accessToken, {
          id: session.user.id,
          firstName: data.firstName || session.user.firstName,
          lastName: data.lastName || session.user.lastName,
          email: session.user.email,
        });
      }

      showMessage("Saved", "Your profile has been updated.");
    } catch (error: any) {
      showMessage("Error", error.message || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  };

  const fullName = `${firstName} ${lastName}`.trim() || "User Profile";

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        style={styles.sosCard}
        onPress={() => showMessage("Emergency SOS", "Emergency SOS broadcast is not yet connected to a real alert system.")}
        activeOpacity={0.85}
      >
        <View style={styles.sosBadge}>
          <Text style={styles.sosBadgeText}>LIVE</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sosTitle}>🚨 EMERGENCY SOS BROADCAST</Text>
          <Text style={styles.sosSub}>Instantly dispatch GPS location & alert contacts</Text>
        </View>
        <Text style={styles.arrowIcon}>→</Text>
      </TouchableOpacity>

      <View style={styles.profileHeader}>
        <View style={styles.avatarGlow}>
          <Text style={styles.avatarText}>{firstName ? firstName.charAt(0).toUpperCase() : "U"}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileEmail}>{email || "No email registered"}</Text>
          <Text style={styles.profilePhone}>{phone ? `Phone: ${phone}` : "No phone number"}</Text>

          <View style={styles.tagRow}>
            <View style={[styles.pillTag, { backgroundColor: "#fee2e2" }]}>
              <Text style={[styles.pillText, { color: "#dc2626" }]}>🩸 {bloodGroup}</Text>
            </View>
            <View style={[styles.pillTag, { backgroundColor: "#e0e7ff" }]}>
              <Text style={[styles.pillText, { color: "#4338ca" }]}>BMI {calculatedBmi}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.qrPassBtn} onPress={() => setShowQrModal(!showQrModal)}>
          <Text style={{ fontSize: 22 }}>🪪</Text>
          <Text style={styles.qrPassText}>QR Pass</Text>
        </TouchableOpacity>
      </View>

      {showQrModal && (
        <View style={styles.qrCard}>
          <View style={styles.qrHeader}>
            <Text style={styles.qrCardTitle}>🪪 Smart Health Digital Pass</Text>
            <TouchableOpacity onPress={() => setShowQrModal(false)}>
              <Text style={{ color: "#94a3b8", fontWeight: "bold" }}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.qrContent}>
            <View style={styles.qrPlaceholder}>
              <Text style={{ fontSize: 36 }}>📱</Text>
              <Text style={styles.qrScanText}>SCAN FOR MED-ID</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.qrDetailText}><Text style={styles.boldText}>{fullName}</Text></Text>
              <Text style={styles.qrDetailText}>Phone: <Text style={styles.boldText}>{phone || "N/A"}</Text></Text>
              <Text style={styles.qrDetailText}>Blood: <Text style={styles.boldText}>{bloodGroup}</Text></Text>
              <Text style={styles.qrDetailText}>BMI: <Text style={styles.boldText}>{calculatedBmi}</Text></Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Registered Personal Details</Text>
        <Text style={styles.cardSub}>Information fetched from your AmarCure account.</Text>

        <View style={styles.row}>
          <View style={styles.flexOne}>
            <Text style={styles.label}>First Name</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
          </View>
          <View style={styles.flexOne}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
          </View>
        </View>

        <Text style={styles.label}>Email Address</Text>
        <TextInput style={styles.input} value={email} editable={false} />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <View style={styles.row}>
          <View style={styles.flexOne}>
            <Text style={styles.label}>Blood Group</Text>
            <TextInput style={styles.input} value={bloodGroup} onChangeText={setBloodGroup} />
          </View>
          <View style={styles.flexOne}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />
          </View>
          <View style={styles.flexOne}>
            <Text style={styles.label}>Height ({heightUnit})</Text>
            <TextInput style={styles.input} value={heightValue} onChangeText={setHeightValue} keyboardType="numeric" />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Medical Conditions & Allergies</Text>
        <Text style={styles.cardSub}>Tap to attach conditions to your health profile.</Text>

        <View style={styles.chipGrid}>
          {availableAllergies.map((item) => {
            const isSelected = selectedAllergies.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.allergyChip, isSelected && styles.activeAllergyChip]}
                onPress={() => toggleAllergy(item)}
              >
                <Text style={[styles.allergyText, isSelected && styles.activeAllergyText]}>
                  {isSelected ? "✓ " : "+ "}{item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={styles.cardTitle}>🩸 Blood Donor Registry</Text>
            <Text style={styles.cardSub}>Allow health networks to notify you in emergency</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleBtn, isDonor ? { backgroundColor: "#10b981" } : { backgroundColor: "#94a3b8" }]}
            onPress={() => setIsDonor(!isDonor)}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 11 }}>
              {isDonor ? "ACTIVE" : "OFF"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>Last Donation Date</Text>
        <TextInput style={styles.input} value={lastDonationDate} onChangeText={setLastDonationDate} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving ? styles.saveBtnDisabled : null]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.saveBtnText}>Save & Update Profile</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9", paddingHorizontal: 18, paddingTop: 16 },
  centerBox: { flex: 1, minHeight: 300, alignItems: "center", justifyContent: "center" },

  sosCard: { backgroundColor: "#0f172a", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16, borderWidth: 1, borderColor: "#1e293b" },
  sosBadge: { backgroundColor: "#ef4444", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sosBadgeText: { color: "#ffffff", fontSize: 10, fontWeight: "900" },
  sosTitle: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  sosSub: { color: "#94a3b8", fontSize: 11, marginTop: 1 },
  arrowIcon: { color: "#ef4444", fontSize: 18, fontWeight: "bold" },

  profileHeader: { backgroundColor: "#ffffff", borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  avatarGlow: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#0052cc", justifyContent: "center", alignItems: "center", marginRight: 14 },
  avatarText: { color: "#ffffff", fontSize: 24, fontWeight: "bold" },
  profileName: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  profileEmail: { fontSize: 11, color: "#64748b", marginTop: 1 },
  profilePhone: { fontSize: 11, color: "#0052cc", fontWeight: "700", marginBottom: 6, marginTop: 2 },
  tagRow: { flexDirection: "row", gap: 6 },
  pillTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  pillText: { fontSize: 10, fontWeight: "800" },
  qrPassBtn: { backgroundColor: "#f8fafc", padding: 10, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: "#cbd5e1" },
  qrPassText: { fontSize: 10, fontWeight: "800", color: "#334155", marginTop: 2 },

  qrCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#bfdbfe" },
  qrHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  qrCardTitle: { fontSize: 13, fontWeight: "800", color: "#1e40af" },
  qrContent: { flexDirection: "row", gap: 15, alignItems: "center" },
  qrPlaceholder: { width: 95, height: 95, backgroundColor: "#eff6ff", borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#93c5fd", borderStyle: "dashed" },
  qrScanText: { fontSize: 8, fontWeight: "900", color: "#2563eb", marginTop: 4 },
  qrDetailText: { fontSize: 12, color: "#475569" },
  boldText: { fontWeight: "700", color: "#0f172a" },

  card: { backgroundColor: "#ffffff", borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 2 },
  cardSub: { fontSize: 11, color: "#64748b", marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6 },
  input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: "#0f172a", marginBottom: 12 },

  row: { flexDirection: "row", gap: 10 },
  flexOne: { flex: 1 },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  allergyChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: "#f1f5f9" },
  activeAllergyChip: { backgroundColor: "#0052cc" },
  allergyText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  activeAllergyText: { color: "#ffffff" },

  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  saveBtn: { backgroundColor: "#0052cc", paddingVertical: 15, borderRadius: 14, alignItems: "center", marginTop: 6 },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
});

