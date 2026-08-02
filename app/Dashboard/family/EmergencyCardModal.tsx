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
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

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

interface EmergencyCardModalProps {
  visible: boolean;
  onClose: () => void;
  onUnauthorized: () => void;
}

const DURATION_OPTIONS: [number, string][] = [
  [30, "30 days"],
  [90, "90 days"],
  [365, "1 year"],
];

export default function EmergencyCardModal({
  visible,
  onClose,
  onUnauthorized,
}: EmergencyCardModalProps) {
  const [expiresInDays, setExpiresInDays] = useState<number>(90);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const generateCard = useCallback(
    async (days: number) => {
      try {
        setGenerating(true);

        const response = await authorizedFetch(
          `${API_BASE_URL}/api/family/emergency-card`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expiresInDays: days }),
          }
        );

        if (response.status === 401) {
          onUnauthorized();
          return;
        }

        const data = await parseJsonResponse(response);

        if (!response.ok) {
          throw new Error(data.error || "Could not generate the emergency card.");
        }

        setCardUrl(data.cardUrl);
        setExpiresAt(data.expiresAt);
      } catch (error: any) {
        showMessage("Error", error.message || "Could not generate the emergency card.");
      } finally {
        setGenerating(false);
      }
    },
    [onUnauthorized]
  );

  useEffect(() => {
    if (visible) {
      generateCard(expiresInDays);
    } else {
      setCardUrl(null);
      setExpiresAt(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const revokeCard = async () => {
    try {
      setRevoking(true);

      const response = await authorizedFetch(
        `${API_BASE_URL}/api/family/emergency-card`,
        { method: "DELETE" }
      );

      if (response.status === 401) {
        onUnauthorized();
        return;
      }

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Could not revoke the emergency card.");
      }

      setCardUrl(null);
      setExpiresAt(null);
      showMessage("Revoked", "The emergency QR card link has been revoked.");
      onClose();
    } catch (error: any) {
      showMessage("Error", error.message || "Could not revoke the emergency card.");
    } finally {
      setRevoking(false);
    }
  };

  const testCardLink = async () => {
    if (cardUrl) {
      await Linking.openURL(cardUrl);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalBox}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={25} color="#0F172A" />
          </TouchableOpacity>

          <Ionicons name="qr-code-outline" size={28} color="#DC2626" />

          <Text style={styles.title}>Emergency Health Card</Text>
          <Text style={styles.subtitle}>
            Anyone who scans this code sees your blood group, conditions and
            phone number instantly — no AmarCure account needed. Useful for
            first responders.
          </Text>

          <Text style={styles.durationLabel}>Link validity</Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map(([days, label]) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.durationButton,
                  expiresInDays === days ? styles.durationButtonActive : null,
                ]}
                onPress={() => {
                  setExpiresInDays(days);
                  generateCard(days);
                }}
                disabled={generating}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    expiresInDays === days ? styles.durationButtonTextActive : null,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {generating ? (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginVertical: 20 }} />
          ) : cardUrl ? (
            <View style={styles.qrBox}>
              <QRCode value={cardUrl} size={200} />
            </View>
          ) : null}

          {cardUrl ? (
            <Text style={styles.cardUrl} selectable>
              {cardUrl}
            </Text>
          ) : null}

          {expiresAt ? (
            <Text style={styles.expiryText}>
              Expires: {new Date(expiresAt).toLocaleDateString()}
            </Text>
          ) : null}

          <TouchableOpacity style={styles.openButton} onPress={testCardLink}>
            <Ionicons name="open-outline" size={18} color="#ffffff" />
            <Text style={styles.openButtonText}>Preview Card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.revokeButton}
            onPress={revokeCard}
            disabled={revoking}
          >
            <Ionicons name="close-circle-outline" size={18} color="#b91c1c" />
            <Text style={styles.revokeButtonText}>
              {revoking ? "Revoking..." : "Revoke QR Link"}
            </Text>
          </TouchableOpacity>
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
    maxWidth: 430,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 13,
    right: 13,
    zIndex: 1,
  },
  title: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: "#64748B",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
  },
  durationLabel: {
    alignSelf: "flex-start",
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  durationRow: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 9,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  durationButtonActive: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  durationButtonText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },
  durationButtonTextActive: {
    color: "#B91C1C",
  },
  qrBox: {
    marginTop: 14,
    backgroundColor: "#ffffff",
    padding: 8,
  },
  cardUrl: {
    marginTop: 12,
    color: "#2563EB",
    textAlign: "center",
    fontSize: 11,
  },
  expiryText: {
    marginTop: 6,
    color: "#475569",
    fontSize: 12,
  },
  openButton: {
    marginTop: 17,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 10,
  },
  openButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  revokeButton: {
    marginTop: 10,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 10,
  },
  revokeButtonText: {
    color: "#B91C1C",
    fontWeight: "700",
  },
});
