import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { authorizedFetch } from "../../auth-storage";

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

interface FamilyProfile {
  relationshipId: number;
  accessLevel: "view_only" | "manage" | "emergency";
  ownerUserId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  heightUnit: string;
  heightValue: string;
  weight: string;
  address: string;
  bloodGroup: string;
  chronicDisease: string;
  otherDisease: string | null;
}

interface SharedReport {
  id: number;
  originalName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

interface ProfileDetailModalProps {
  visible: boolean;
  relationshipId: number | null;
  onClose: () => void;
  onUnauthorized: () => void;
}

const EDITABLE_FIELDS: { key: keyof FamilyProfile; label: string }[] = [
  { key: "phone", label: "Phone" },
  { key: "heightValue", label: "Height" },
  { key: "weight", label: "Weight" },
  { key: "address", label: "Address" },
  { key: "bloodGroup", label: "Blood Group" },
  { key: "chronicDisease", label: "Chronic Disease" },
  { key: "otherDisease", label: "Other Disease" },
];

export default function ProfileDetailModal({
  visible,
  relationshipId,
  onClose,
  onUnauthorized,
}: ProfileDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<FamilyProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const [reports, setReports] = useState<SharedReport[] | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [openingReportId, setOpeningReportId] = useState<number | null>(null);

  const loadProfile = useCallback(async () => {
    if (!relationshipId) {
      return;
    }

    try {
      setLoading(true);
      setEditing(false);
      setReports(null);

      const response = await authorizedFetch(
        `${API_BASE_URL}/api/family/profile/${relationshipId}`
      );

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Could not load the profile.");
      }

      setProfile(data.profile || null);
    } catch (error: any) {
      showMessage("Error", error.message || "Could not load the profile.");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [relationshipId, onUnauthorized, onClose]);

  useEffect(() => {
    if (visible && relationshipId) {
      loadProfile();
    }
  }, [visible, relationshipId, loadProfile]);

  const startEditing = () => {
    if (!profile) {
      return;
    }

    setDraft({
      phone: profile.phone,
      heightValue: profile.heightValue,
      weight: profile.weight,
      address: profile.address,
      bloodGroup: profile.bloodGroup,
      chronicDisease: profile.chronicDisease,
      otherDisease: profile.otherDisease || "",
    });
    setEditing(true);
  };

  const saveChanges = async () => {
    if (!relationshipId) {
      return;
    }

    try {
      setSaving(true);

      const response = await authorizedFetch(
        `${API_BASE_URL}/api/family/profile/${relationshipId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        }
      );

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Could not update the profile.");
      }

      setProfile(data.profile);
      setEditing(false);
      showMessage("Saved", "The health profile was updated.");
    } catch (error: any) {
      showMessage("Error", error.message || "Could not update the profile.");
    } finally {
      setSaving(false);
    }
  };

  const loadReports = useCallback(async () => {
    if (!profile) {
      return;
    }

    try {
      setReportsLoading(true);

      const response = await authorizedFetch(
        `${API_BASE_URL}/api/family/reports/${profile.ownerUserId}`
      );

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Could not load reports.");
      }

      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch (error: any) {
      showMessage("Error", error.message || "Could not load reports.");
    } finally {
      setReportsLoading(false);
    }
  }, [profile, onUnauthorized]);

  const openReport = async (report: SharedReport) => {
    if (!profile) {
      return;
    }

    try {
      setOpeningReportId(report.id);

      const response = await authorizedFetch(
        `${API_BASE_URL}/api/family/reports/${profile.ownerUserId}/${report.id}/view-url`,
        { method: "POST" }
      );

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Could not open the report.");
      }

      await Linking.openURL(data.url);
    } catch (error: any) {
      showMessage("Error", error.message || "Could not open the report.");
    } finally {
      setOpeningReportId(null);
    }
  };

  const canManage = profile?.accessLevel === "manage";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {profile ? `${profile.firstName} ${profile.lastName}` : "Health Profile"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : profile ? (
            <>
              <View style={styles.fieldList}>
                {EDITABLE_FIELDS.map((field) => (
                  <View key={field.key} style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    {editing ? (
                      <TextInput
                        value={draft[field.key] ?? ""}
                        onChangeText={(text) =>
                          setDraft((current) => ({ ...current, [field.key]: text }))
                        }
                        style={styles.fieldInput}
                        placeholderTextColor="#94A3B8"
                      />
                    ) : (
                      <Text style={styles.fieldValue}>
                        {String(profile[field.key] || "—")}
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              {canManage ? (
                editing ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.primaryButton, saving ? styles.disabledButton : null]}
                      onPress={saveChanges}
                      disabled={saving}
                    >
                      <Text style={styles.primaryButtonText}>
                        {saving ? "Saving..." : "Save Changes"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => setEditing(false)}
                    >
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.editButton} onPress={startEditing}>
                    <Ionicons name="create-outline" size={16} color="#2563EB" />
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                  </TouchableOpacity>
                )
              ) : null}

              {canManage ? (
                <View style={styles.reportsSection}>
                  <TouchableOpacity
                    style={styles.reportsHeader}
                    onPress={() => (reports === null ? loadReports() : setReports(null))}
                  >
                    <Text style={styles.reportsTitle}>Shared Medical Reports</Text>
                    <Ionicons
                      name={reports === null ? "chevron-down-outline" : "chevron-up-outline"}
                      size={18}
                      color="#334155"
                    />
                  </TouchableOpacity>

                  {reportsLoading ? (
                    <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 10 }} />
                  ) : reports !== null ? (
                    reports.length === 0 ? (
                      <Text style={styles.emptyReportsText}>
                        No reports have been uploaded yet.
                      </Text>
                    ) : (
                      reports.map((report) => (
                        <View key={report.id} style={styles.reportRow}>
                          <Ionicons name="document-text-outline" size={16} color="#64748B" />
                          <Text style={styles.reportName} numberOfLines={1}>
                            {report.originalName}
                          </Text>
                          <TouchableOpacity
                            onPress={() => openReport(report)}
                            disabled={openingReportId === report.id}
                          >
                            <Text style={styles.reportOpenText}>
                              {openingReportId === report.id ? "Opening..." : "View"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )
                  ) : null}
                </View>
              ) : null}
            </>
          ) : null}
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
    maxWidth: 480,
    maxHeight: isWeb ? "90%" : "88%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 22,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
    marginRight: 12,
  },
  centerBox: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldList: {
    gap: 10,
  },
  fieldRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 14,
    color: "#0F172A",
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 14,
    color: "#0F172A",
  },
  editButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9,
  },
  editButtonText: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 13,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
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
  reportsSection: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 14,
  },
  reportsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reportsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  emptyReportsText: {
    marginTop: 8,
    color: "#94A3B8",
    fontSize: 12,
  },
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  reportName: {
    flex: 1,
    color: "#0F172A",
    fontSize: 13,
  },
  reportOpenText: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 12,
  },
});
