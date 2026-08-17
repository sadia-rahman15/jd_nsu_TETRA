
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import {
  authorizedFetch,
  clearAuthSession,
} from "@/services/auth-storage";

const isWeb = Platform.OS === "web";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:5000";

interface MedicalReport {
  id: number;
  originalName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

interface SelectedImageReport {
  report: MedicalReport;
  signedUrl: string;
}

interface SharedReport {
  report: MedicalReport;
  shareUrl: string;
  expiresAt: string;
}

const showMessage = (
  title: string,
  message: string
) => {
  if (
    isWeb &&
    typeof window !== "undefined"
  ) {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const parseJsonResponse = async (
  response: Response
) => {
  const responseText =
    await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return {
      error:
        responseText ||
        "The server returned an invalid response.",
    };
  }
};

const formatFileSize = (
  bytes: number
) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
};

const formatDate = (
  dateValue: string
) => {
  const date = new Date(dateValue);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Unknown date";
  }

  return date.toLocaleDateString();
};

const readAssetAsBase64 = async (
  asset: DocumentPicker.DocumentPickerAsset
) => {
  if (
    isWeb &&
    asset.file
  ) {
    return new Promise<string>(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () => {
          const result = String(
            reader.result || ""
          );

          resolve(
            result.includes(",")
              ? result.split(",")[1]
              : result
          );
        };

        reader.onerror = () => {
          reject(
            new Error(
              "Could not read the selected report."
            )
          );
        };

        reader.readAsDataURL(
          asset.file as Blob
        );
      }
    );
  }

  const FileSystem = await import(
    "expo-file-system/legacy"
  );

  return FileSystem.readAsStringAsync(
    asset.uri,
    {
      encoding:
        FileSystem.EncodingType
          .Base64,
    }
  );
};

export default function ReportsScreen() {
  const router = useRouter();

  const [reports, setReports] =
    useState<MedicalReport[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [deletingReportId, setDeletingReportId] =
    useState<number | null>(null);

  const [openingReportId, setOpeningReportId] =
    useState<number | null>(null);

  const [sharingReportId, setSharingReportId] =
    useState<number | null>(null);

  const [shareHours, setShareHours] =
    useState<1 | 24 | 168>(24);

  const [
    selectedImageReport,
    setSelectedImageReport,
  ] =
    useState<SelectedImageReport | null>(
      null
    );

  const [
    sharedReport,
    setSharedReport,
  ] =
    useState<SharedReport | null>(
      null
    );

  const handleUnauthorized =
    useCallback(async () => {
      await clearAuthSession();

      showMessage(
        "Session Expired",
        "Your login session has expired. Please log in again."
      );

      router.replace("/login");
    }, [router]);

  const loadReports =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await authorizedFetch(
            `${API_BASE_URL}/api/reports`
          );

        if (
          response.status === 401
        ) {
          await handleUnauthorized();
          return;
        }

        const data =
          await parseJsonResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Could not load reports."
          );
        }

        setReports(
          Array.isArray(data.reports)
            ? data.reports
            : []
        );
      } catch (error) {
        showMessage(
          "Load Failed",
          error instanceof Error
            ? error.message
            : "Could not load reports."
        );
      } finally {
        setLoading(false);
      }
    }, [handleUnauthorized]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const uploadReport = async () => {
    if (uploading) {
      return;
    }

    try {
      const result =
        await DocumentPicker.getDocumentAsync(
          {
            type: [
              "application/pdf",
              "image/*",
            ],
            copyToCacheDirectory:
              true,
            multiple: false,
          }
        );

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      const asset =
        result.assets[0];

      if (
        asset.size &&
        asset.size >
          10 * 1024 * 1024
      ) {
        showMessage(
          "File Too Large",
          "The maximum report size is 10 MB."
        );

        return;
      }

      const mimeType =
        asset.mimeType ||
        "application/octet-stream";

      const isSupportedFile =
        mimeType ===
          "application/pdf" ||
        mimeType.startsWith(
          "image/"
        );

      if (!isSupportedFile) {
        showMessage(
          "Unsupported File",
          "Only PDF and image reports can be uploaded."
        );

        return;
      }

      setUploading(true);

      const base64 =
        await readAssetAsBase64(
          asset
        );

      if (!base64) {
        throw new Error(
          "The selected report could not be read."
        );
      }

      const response =
        await authorizedFetch(
          `${API_BASE_URL}/api/reports`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              originalName:
                asset.name ||
                `medical-report-${Date.now()}`,
              mimeType,
              base64,
            }),
          }
        );

      if (
        response.status === 401
      ) {
        await handleUnauthorized();
        return;
      }

      const data =
        await parseJsonResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not upload the report."
        );
      }

      if (!data.report) {
        throw new Error(
          "The server did not return the uploaded report."
        );
      }

      setReports(
        (currentReports) => [
          data.report,
          ...currentReports,
        ]
      );

      showMessage(
        "Upload Complete",
        "Your medical report has been stored securely in Backblaze B2."
      );
    } catch (error) {
      showMessage(
        "Upload Failed",
        error instanceof Error
          ? error.message
          : "Could not upload the report."
      );
    } finally {
      setUploading(false);
    }
  };

  const requestViewUrl = async (
    report: MedicalReport
  ): Promise<string> => {
    const response =
      await authorizedFetch(
        `${API_BASE_URL}/api/reports/${report.id}/view-url`,
        {
          method: "POST",
        }
      );

    if (
      response.status === 401
    ) {
      await handleUnauthorized();

      throw new Error(
        "Your login session has expired."
      );
    }

    const data =
      await parseJsonResponse(
        response
      );

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Could not open the report."
      );
    }

    if (
      !data.url ||
      typeof data.url !==
        "string"
    ) {
      throw new Error(
        "The server did not return a valid report link."
      );
    }

    return data.url;
  };

  const openReport = async (
    report: MedicalReport
  ) => {
    if (
      openingReportId !== null
    ) {
      return;
    }

    try {
      setOpeningReportId(
        report.id
      );

      const signedUrl =
        await requestViewUrl(
          report
        );

      if (
        report.mimeType.startsWith(
          "image/"
        )
      ) {
        setSelectedImageReport({
          report,
          signedUrl,
        });

        return;
      }

      const canOpen =
        await Linking.canOpenURL(
          signedUrl
        );

      if (!canOpen) {
        throw new Error(
          "This device cannot open the report."
        );
      }

      await Linking.openURL(
        signedUrl
      );
    } catch (error) {
      showMessage(
        "Open Failed",
        error instanceof Error
          ? error.message
          : "Could not open the report."
      );
    } finally {
      setOpeningReportId(null);
    }
  };

  const generateShareLink =
    async (
      report: MedicalReport,
      expiresInHours: 1 | 24 | 168 = shareHours
    ) => {
      if (
        sharingReportId !== null
      ) {
        return;
      }

      try {
        setSharingReportId(
          report.id
        );

        const response =
          await authorizedFetch(
            `${API_BASE_URL}/api/reports/${report.id}/share`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                expiresInHours,
              }),
            }
          );

        if (
          response.status === 401
        ) {
          await handleUnauthorized();
          return;
        }

        const data =
          await parseJsonResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Could not create the sharing link."
          );
        }

        if (
          !data.shareUrl ||
          typeof data.shareUrl !==
            "string"
        ) {
          throw new Error(
            "The server did not return a valid sharing link."
          );
        }

        setSharedReport({
          report,
          shareUrl:
            data.shareUrl,
          expiresAt:
            data.expiresAt ||
            new Date(
              Date.now() +
                expiresInHours *
                  60 *
                  60 *
                  1000
            ).toISOString(),
        });
      } catch (error) {
        showMessage(
          "Sharing Failed",
          error instanceof Error
            ? error.message
            : "Could not create the sharing link."
        );
      } finally {
        setSharingReportId(
          null
        );
      }
    };

  const revokeShareLink = async () => {
    if (!sharedReport) {
      return;
    }

    try {
      const response = await authorizedFetch(
        `${API_BASE_URL}/api/reports/${sharedReport.report.id}/share`,
        {
          method: "DELETE",
        }
      );

      if (response.status === 401) {
        await handleUnauthorized();
        return;
      }

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || "Could not revoke the sharing link."
        );
      }

      setSharedReport(null);

      showMessage(
        "Sharing Revoked",
        data.message || "The QR sharing link was revoked."
      );
    } catch (error) {
      showMessage(
        "Revoke Failed",
        error instanceof Error
          ? error.message
          : "Could not revoke the sharing link."
      );
    }
  };

  const deleteReport = async (
    report: MedicalReport
  ) => {
    const performDelete =
      async () => {
        try {
          setDeletingReportId(
            report.id
          );

          const response =
            await authorizedFetch(
              `${API_BASE_URL}/api/reports/${report.id}`,
              {
                method: "DELETE",
              }
            );

          if (
            response.status ===
            401
          ) {
            await handleUnauthorized();
            return;
          }

          const data =
            await parseJsonResponse(
              response
            );

          if (!response.ok) {
            throw new Error(
              data.error ||
                "Could not delete the report."
            );
          }

          setReports(
            (
              currentReports
            ) =>
              currentReports.filter(
                (
                  currentReport
                ) =>
                  currentReport.id !==
                  report.id
              )
          );

          if (
            selectedImageReport
              ?.report.id ===
            report.id
          ) {
            setSelectedImageReport(
              null
            );
          }

          if (
            sharedReport?.report
              .id === report.id
          ) {
            setSharedReport(
              null
            );
          }

          showMessage(
            "Report Deleted",
            "The report was deleted from Backblaze B2 and AmarCure."
          );
        } catch (error) {
          showMessage(
            "Delete Failed",
            error instanceof Error
              ? error.message
              : "Could not delete the report."
          );
        } finally {
          setDeletingReportId(
            null
          );
        }
      };

    if (
      isWeb &&
      typeof window !==
        "undefined"
    ) {
      const confirmed =
        window.confirm(
          `Delete “${report.originalName}”?`
        );

      if (confirmed) {
        await performDelete();
      }

      return;
    }

    Alert.alert(
      "Delete Report",
      `Delete “${report.originalName}”?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style:
            "destructive",
          onPress: () => {
            performDelete();
          },
        },
      ]
    );
  };

  const testSharedLink =
    async () => {
      if (!sharedReport) {
        return;
      }

      try {
        const canOpen =
          await Linking.canOpenURL(
            sharedReport.shareUrl
          );

        if (!canOpen) {
          throw new Error(
            "This device cannot open the shared report link."
          );
        }

        await Linking.openURL(
          sharedReport.shareUrl
        );
      } catch (error) {
        showMessage(
          "Open Failed",
          error instanceof Error
            ? error.message
            : "Could not open the shared link."
        );
      }
    };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            📄 My Medical Reports
          </Text>

          <Text style={styles.subtitle}>
            Upload PDF or image reports, view them
            securely, and create temporary QR sharing
            links.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.uploadButton,
            uploading
              ? styles.disabledButton
              : null,
          ]}
          onPress={uploadReport}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator
              color="#ffffff"
              size="small"
            />
          ) : (
            <Ionicons
              name="cloud-upload-outline"
              size={19}
              color="#ffffff"
            />
          )}

          <Text
            style={
              styles.uploadButtonText
            }
          >
            {uploading
              ? "Uploading…"
              : "Upload Report"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.notice}>
        <Ionicons
          name="shield-checkmark-outline"
          size={21}
          color="#2563EB"
        />

        <Text style={styles.noticeText}>
          Reports are stored in a private Backblaze B2
          bucket. Viewing links expire after five minutes,
          and QR sharing links expire after 24 hours.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text style={styles.centerText}>
            Loading reports…
          </Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons
            name="document-outline"
            size={54}
            color="#94A3B8"
          />

          <Text style={styles.emptyTitle}>
            No reports stored yet
          </Text>

          <Text style={styles.centerText}>
            Upload your first medical report.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {reports.map(
            (report) => {
              const isOpening =
                openingReportId ===
                report.id;

              const isSharing =
                sharingReportId ===
                report.id;

              const isDeleting =
                deletingReportId ===
                report.id;

              const reportBusy =
                isOpening ||
                isSharing ||
                isDeleting;

              return (
                <View
                  key={report.id}
                  style={styles.card}
                >
                  <View style={styles.preview}>
                    {report.mimeType.startsWith(
                      "image/"
                    ) ? (
                      <View
                        style={
                          styles.fileTypePreview
                        }
                      >
                        <Ionicons
                          name="image-outline"
                          size={49}
                          color="#0F766E"
                        />

                        <Text
                          style={
                            styles.imageTypeText
                          }
                        >
                          Image Report
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={
                          styles.fileTypePreview
                        }
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={49}
                          color="#DC2626"
                        />

                        <Text
                          style={
                            styles.pdfTypeText
                          }
                        >
                          PDF Report
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={styles.name}
                    numberOfLines={2}
                  >
                    {report.originalName}
                  </Text>

                  <Text style={styles.meta}>
                    {formatFileSize(
                      report.fileSize
                    )}{" "}
                    •{" "}
                    {formatDate(
                      report.createdAt
                    )}
                  </Text>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        reportBusy
                          ? styles.disabledButton
                          : null,
                      ]}
                      onPress={() =>
                        openReport(report)
                      }
                      disabled={reportBusy}
                    >
                      {isOpening ? (
                        <ActivityIndicator
                          size="small"
                          color="#2563EB"
                        />
                      ) : (
                        <Ionicons
                          name="eye-outline"
                          size={17}
                          color="#2563EB"
                        />
                      )}

                      <Text
                        style={
                          styles.actionText
                        }
                      >
                        {isOpening
                          ? "Opening"
                          : "View"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        reportBusy
                          ? styles.disabledButton
                          : null,
                      ]}
                      onPress={() =>
                        generateShareLink(
                          report
                        )
                      }
                      disabled={reportBusy}
                    >
                      {isSharing ? (
                        <ActivityIndicator
                          size="small"
                          color="#2563EB"
                        />
                      ) : (
                        <Ionicons
                          name="qr-code-outline"
                          size={17}
                          color="#2563EB"
                        />
                      )}

                      <Text
                        style={
                          styles.actionText
                        }
                      >
                        {isSharing
                          ? "Creating"
                          : "QR"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.deleteButton,
                        reportBusy
                          ? styles.disabledButton
                          : null,
                      ]}
                      onPress={() =>
                        deleteReport(report)
                      }
                      disabled={reportBusy}
                    >
                      {isDeleting ? (
                        <ActivityIndicator
                          size="small"
                          color="#DC2626"
                        />
                      ) : (
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#DC2626"
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }
          )}
        </View>
      )}

      <Modal
        visible={Boolean(
          selectedImageReport
        )}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSelectedImageReport(
            null
          )
        }
      >
        <View style={styles.backdrop}>
          <View
            style={styles.viewerModal}
          >
            <View
              style={styles.modalHeader}
            >
              <Text
                style={styles.modalTitle}
                numberOfLines={1}
              >
                {
                  selectedImageReport
                    ?.report
                    .originalName
                }
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setSelectedImageReport(
                    null
                  )
                }
              >
                <Ionicons
                  name="close"
                  size={26}
                  color="#0F172A"
                />
              </TouchableOpacity>
            </View>

            {selectedImageReport ? (
              <Image
                source={{
                  uri:
                    selectedImageReport.signedUrl,
                }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(
          sharedReport
        )}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSharedReport(null)
        }
      >
        <View style={styles.backdrop}>
          <View style={styles.qrModal}>
            <TouchableOpacity
              style={styles.qrClose}
              onPress={() =>
                setSharedReport(
                  null
                )
              }
            >
              <Ionicons
                name="close"
                size={25}
                color="#0F172A"
              />
            </TouchableOpacity>

            <Text style={styles.qrTitle}>
              Share Report
            </Text>

            <Text
              style={styles.qrName}
              numberOfLines={2}
            >
              {
                sharedReport?.report
                  .originalName
              }
            </Text>

            <Text style={styles.durationLabel}>
              QR link duration
            </Text>

            <View style={styles.durationRow}>
              {([
                [1, "1 hour"],
                [24, "24 hours"],
                [168, "7 days"],
              ] as const).map(([hours, label]) => (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.durationButton,
                    shareHours === hours
                      ? styles.durationButtonActive
                      : null,
                  ]}
                  onPress={async () => {
                    setShareHours(hours);
                    if (sharedReport) {
                      await generateShareLink(
                        sharedReport.report,
                        hours
                      );
                    }
                  }}
                  disabled={sharingReportId !== null}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      shareHours === hours
                        ? styles.durationButtonTextActive
                        : null,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {sharedReport?.shareUrl ? (
              <View style={styles.qrBox}>
                <QRCode
                  value={
                    sharedReport.shareUrl
                  }
                  size={220}
                />
              </View>
            ) : null}

            <Text style={styles.qrHelp}>
              This QR link is temporary. Changing its
              duration creates a new link and revokes the
              previous one.
            </Text>

            <Text
              style={styles.qrUrl}
              selectable
            >
              {sharedReport?.shareUrl}
            </Text>

            {sharedReport?.expiresAt ? (
              <Text
                style={
                  styles.expiryText
                }
              >
                Expires:{" "}
                {new Date(
                  sharedReport.expiresAt
                ).toLocaleString()}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.openButton}
              onPress={
                testSharedLink
              }
            >
              <Ionicons
                name="open-outline"
                size={18}
                color="#ffffff"
              />

              <Text
                style={
                  styles.openButtonText
                }
              >
                Test Shared Link
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.revokeButton}
              onPress={revokeShareLink}
            >
              <Ionicons
                name="close-circle-outline"
                size={18}
                color="#b91c1c"
              />

              <Text style={styles.revokeButtonText}>
                Revoke QR Link
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      paddingBottom: 30,
    },
    header: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      gap: 16,
      flexWrap: "wrap",
      marginBottom: 18,
    },
    headerText: {
      flex: 1,
      minWidth: 250,
    },
    title: {
      fontSize: 26,
      fontWeight: "800",
      color: "#0F172A",
    },
    subtitle: {
      marginTop: 6,
      fontSize: 14,
      color: "#64748B",
      lineHeight: 21,
    },
    uploadButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor:
        "#2563EB",
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 12,
    },
    uploadButtonText: {
      color: "#ffffff",
      fontWeight: "700",
    },
    disabledButton: {
      opacity: 0.55,
    },
    notice: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      gap: 9,
      backgroundColor:
        "#EFF6FF",
      borderRadius: 12,
      padding: 13,
      marginBottom: 18,
    },
    noticeText: {
      flex: 1,
      color: "#1E40AF",
      lineHeight: 19,
    },
    centerBox: {
      minHeight: 260,
      justifyContent:
        "center",
      alignItems: "center",
      gap: 10,
      backgroundColor:
        "#ffffff",
      borderRadius: 16,
      padding: 24,
    },
    centerText: {
      color: "#64748B",
      textAlign: "center",
    },
    emptyTitle: {
      color: "#0F172A",
      fontSize: 18,
      fontWeight: "700",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },
    card: {
      width: isWeb
        ? 260
        : "100%",
      backgroundColor:
        "#ffffff",
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor:
        "#E2E8F0",
    },
    preview: {
      height: 145,
      borderRadius: 12,
      backgroundColor:
        "#F8FAFC",
      alignItems: "center",
      justifyContent:
        "center",
      overflow: "hidden",
    },
    fileTypePreview: {
      alignItems: "center",
      justifyContent:
        "center",
      gap: 7,
    },
    imageTypeText: {
      color: "#0F766E",
      fontWeight: "700",
      fontSize: 12,
    },
    pdfTypeText: {
      color: "#DC2626",
      fontWeight: "700",
      fontSize: 12,
    },
    name: {
      marginTop: 12,
      fontWeight: "700",
      color: "#0F172A",
      minHeight: 40,
    },
    meta: {
      marginTop: 4,
      color: "#64748B",
      fontSize: 12,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 13,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor:
        "#EFF6FF",
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
    },
    actionText: {
      color: "#2563EB",
      fontWeight: "700",
      fontSize: 12,
    },
    deleteButton: {
      marginLeft: "auto",
      padding: 8,
      backgroundColor:
        "#FEF2F2",
      borderRadius: 8,
      minWidth: 35,
      alignItems: "center",
      justifyContent:
        "center",
    },
    backdrop: {
      flex: 1,
      backgroundColor:
        "rgba(15,23,42,0.72)",
      justifyContent:
        "center",
      alignItems: "center",
      padding: 18,
    },
    viewerModal: {
      width: isWeb
        ? "75%"
        : "100%",
      maxWidth: 900,
      height: "82%",
      backgroundColor:
        "#ffffff",
      borderRadius: 18,
      overflow: "hidden",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor:
        "#E2E8F0",
    },
    modalTitle: {
      flex: 1,
      marginRight: 12,
      fontWeight: "700",
      color: "#0F172A",
    },
    fullImage: {
      flex: 1,
      width: "100%",
    },
    qrModal: {
      width: "100%",
      maxWidth: 430,
      backgroundColor:
        "#ffffff",
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
    },
    qrClose: {
      position: "absolute",
      top: 13,
      right: 13,
      zIndex: 1,
    },
    qrTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: "#0F172A",
    },
    qrName: {
      marginTop: 5,
      marginBottom: 18,
      color: "#64748B",
      textAlign: "center",
    },
    qrBox: {
      backgroundColor:
        "#ffffff",
      padding: 8,
    },
    qrHelp: {
      marginTop: 15,
      color: "#64748B",
      textAlign: "center",
      fontSize: 12,
      lineHeight: 18,
    },
    qrUrl: {
      marginTop: 7,
      color: "#2563EB",
      textAlign: "center",
      fontSize: 11,
    },
    expiryText: {
      marginTop: 9,
      color: "#475569",
      fontSize: 12,
      textAlign: "center",
    },
    openButton: {
      marginTop: 17,
      flexDirection: "row",
      gap: 7,
      alignItems: "center",
      backgroundColor:
        "#2563EB",
      paddingHorizontal: 17,
      paddingVertical: 11,
      borderRadius: 10,
    },
    openButtonText: {
      color: "#ffffff",
      fontWeight: "700",
    },
    durationLabel: {
      marginTop: 4,
      marginBottom: 8,
      color: "#334155",
      fontSize: 13,
      fontWeight: "700",
    },
    durationRow: {
      width: "100%",
      flexDirection: "row",
      gap: 8,
      marginBottom: 14,
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
      borderColor: "#2563EB",
      backgroundColor: "#EFF6FF",
    },
    durationButtonText: {
      color: "#475569",
      fontSize: 12,
      fontWeight: "700",
    },
    durationButtonTextActive: {
      color: "#1D4ED8",
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
