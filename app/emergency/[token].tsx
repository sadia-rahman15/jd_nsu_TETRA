
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

interface EmergencyCard {
  firstName: string;
  lastName: string;
  bloodGroup: string;
  chronicDisease: string;
  otherDisease: string | null;
  phone: string;
}

export default function EmergencyCardScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<EmergencyCard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadCard = async () => {
      if (!token) {
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/family/emergency-card/${token}`
        );
        const responseText = await response.text();
        const data = responseText ? JSON.parse(responseText) : {};

        if (!active) {
          return;
        }

        if (!response.ok) {
          setError(
            data.error || "This emergency card link is invalid or has expired."
          );
          return;
        }

        setCard(data.card);
      } catch {
        if (active) {
          setError("Could not load this emergency card. Check your connection.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCard();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <SafeAreaView style={styles.screen}>
      {loading ? (
        <ActivityIndicator size="large" color="#ffffff" />
      ) : error ? (
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={48} color="#ffffff" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : card ? (
        <View style={styles.card}>
          <Ionicons name="medkit" size={40} color="#DC2626" />
          <Text style={styles.heading}>In Case of Emergency</Text>

          <Text style={styles.name}>
            {card.firstName} {card.lastName}
          </Text>

          <View style={styles.bloodBox}>
            <Text style={styles.bloodLabel}>Blood Group</Text>
            <Text style={styles.bloodValue}>{card.bloodGroup || "Unknown"}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Chronic Disease</Text>
            <Text style={styles.fieldValue}>{card.chronicDisease || "None reported"}</Text>
          </View>

          {card.otherDisease ? (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Other Conditions</Text>
              <Text style={styles.fieldValue}>{card.otherDisease}</Text>
            </View>
          ) : null}

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Phone</Text>
            <Text style={styles.fieldValue}>{card.phone || "Not provided"}</Text>
          </View>

          <Text style={styles.footerNote}>
            This information was shared for emergency use only, via AmarCure.
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  centerBox: {
    alignItems: "center",
    gap: 14,
    maxWidth: 320,
  },
  errorText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },
  heading: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },
  name: {
    marginTop: 6,
    fontSize: 16,
    color: "#334155",
    marginBottom: 18,
  },
  bloodBox: {
    width: "100%",
    backgroundColor: "#FEF2F2",
    borderWidth: 2,
    borderColor: "#DC2626",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  bloodLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9A3412",
  },
  bloodValue: {
    marginTop: 4,
    fontSize: 34,
    fontWeight: "900",
    color: "#DC2626",
  },
  fieldRow: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingVertical: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  fieldValue: {
    marginTop: 3,
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "600",
  },
  footerNote: {
    marginTop: 18,
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
  },
});
