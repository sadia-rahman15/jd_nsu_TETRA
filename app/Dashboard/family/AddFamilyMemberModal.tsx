import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { authorizedFetch, getStoredUser } from "../../auth-storage";

const isWeb = Platform.OS === "web";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const RELATIONSHIP_OPTIONS: { value: string; label: string }[] = [
  { value: "child", label: "Son/Daughter" },
  { value: "parent", label: "Parent" },
  { value: "spouse", label: "Spouse" },
  { value: "sibling", label: "Brother/Sister" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
];

const ACCESS_LEVEL_OPTIONS: {
  value: "view_only" | "manage" | "emergency";
  title: string;
  description: string;
}[] = [
  {
    value: "view_only",
    title: "View Only",
    description: "Can see health data but cannot make changes",
  },
  {
    value: "manage",
    title: "Manage",
    description: "Can view and update health information, and view shared reports",
  },
  {
    value: "emergency",
    title: "Emergency Access",
    description: "Can instantly view critical info (blood group, conditions, phone) in an emergency, no approval needed",
  },
];

interface AddFamilyMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  onUnauthorized: () => void;
}

export default function AddFamilyMemberModal({
  visible,
  onClose,
  onCreated,
  onUnauthorized,
}: AddFamilyMemberModalProps) {
  const [email, setEmail] = useState("");
  const [relationshipType, setRelationshipType] = useState("child");
  const [accessLevel, setAccessLevel] = useState<
    "view_only" | "manage" | "emergency"
  >("view_only");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resetAndClose = () => {
    setEmail("");
    setRelationshipType("child");
    setAccessLevel("view_only");
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    const storedUser = await getStoredUser();

    if (storedUser?.email === normalizedEmail) {
      setError("You cannot invite yourself.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await authorizedFetch(
        `${API_BASE_URL}/api/family/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            relationshipType,
            accessLevel,
          }),
        }
      );

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Could not send the invitation.");
      }

      resetAndClose();
      onCreated();
    } catch (submitError: any) {
      setError(submitError.message || "Could not send the invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={resetAndClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Family Member</Text>
            <TouchableOpacity onPress={resetAndClose}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="family.member@example.com"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={styles.label}>Relationship *</Text>
          <View style={styles.chipRow}>
            {RELATIONSHIP_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  relationshipType === option.value ? styles.chipActive : null,
                ]}
                onPress={() => setRelationshipType(option.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    relationshipType === option.value
                      ? styles.chipTextActive
                      : null,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Access Level *</Text>
          <View style={styles.accessList}>
            {ACCESS_LEVEL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.accessCard,
                  accessLevel === option.value ? styles.accessCardActive : null,
                ]}
                onPress={() => setAccessLevel(option.value)}
              >
                <View
                  style={[
                    styles.radioOuter,
                    accessLevel === option.value ? styles.radioOuterActive : null,
                  ]}
                >
                  {accessLevel === option.value ? (
                    <View style={styles.radioInner} />
                  ) : null}
                </View>

                <View style={styles.accessTextBlock}>
                  <Text style={styles.accessTitle}>{option.title}</Text>
                  <Text style={styles.accessDescription}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.primaryButton, submitting ? styles.disabledButton : null]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? "Sending..." : "Send Invitation"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={resetAndClose}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalBox: {
    width: "100%",
    maxWidth: 460,
    maxHeight: isWeb ? "90%" : "88%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 22,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
  },
  chipActive: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  chipText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#1D4ED8",
  },
  accessList: {
    gap: 8,
  },
  accessCard: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  accessCardActive: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  radioOuter: {
    marginTop: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: "#2563EB",
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#2563EB",
  },
  accessTextBlock: {
    flex: 1,
  },
  accessTitle: {
    fontWeight: "700",
    color: "#0F172A",
    fontSize: 13,
  },
  accessDescription: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
  },
  errorText: {
    marginTop: 12,
    color: "#DC2626",
    fontSize: 13,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#334155",
    fontWeight: "700",
  },
});
