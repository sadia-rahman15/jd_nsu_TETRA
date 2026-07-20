
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import QRCode from 'react-native-qrcode-svg';

const isWeb = Platform.OS === 'web';

// Localhost-only report server. This version is intended for the web app
// running on the same computer as server.js.
const API_BASE_URL = 'http://localhost:5000';


interface MedicalReport {
  id: number;
  originalName: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  shareUrl: string;
  createdAt: string;
}

interface ReportsScreenProps {
  userId: number;
}

const showMessage = (title: string, message: string) => {
  if (isWeb && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const readAssetAsBase64 = async (asset: DocumentPicker.DocumentPickerAsset) => {
  if (isWeb && asset.file) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = () => reject(new Error('Could not read the selected report.'));
      reader.readAsDataURL(asset.file as Blob);
    });
  }

  const FileSystem = await import('expo-file-system/legacy');
  return FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
};

export default function ReportsScreen({ userId }: ReportsScreenProps) {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [qrReport, setQrReport] = useState<MedicalReport | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/reports/${userId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load reports.');
      setReports(data.reports || []);
    } catch (error) {
      showMessage('Load Failed', error instanceof Error ? error.message : 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const uploadReport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      if (asset.size && asset.size > 10 * 1024 * 1024) {
        showMessage('File Too Large', 'The maximum report size is 10 MB.');
        return;
      }

      setUploading(true);
      const base64 = await readAssetAsBase64(asset);
      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          originalName: asset.name || `medical-report-${Date.now()}`,
          mimeType: asset.mimeType || 'application/octet-stream',
          base64,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not upload report.');
      setReports((current) => [data.report, ...current]);
      showMessage('Upload Complete', 'Your medical report has been stored successfully.');
    } catch (error) {
      showMessage('Upload Failed', error instanceof Error ? error.message : 'Could not upload report.');
    } finally {
      setUploading(false);
    }
  };

  const deleteReport = async (report: MedicalReport) => {
    const performDelete = async () => {
      try {
        const deleteUrl = `${API_BASE_URL}/api/reports/${report.id}`;

        const response = await fetch(deleteUrl, {
          method: 'DELETE',
        });

        const responseText = await response.text();
        let data: any = {};

        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch {
          data = { error: responseText || 'Unexpected server response.' };
        }

        if (!response.ok) {
          throw new Error(data.error || 'Could not delete report.');
        }

        setReports((current) => current.filter((item) => item.id !== report.id));
        showMessage(
          'Report Deleted',
          'The report was deleted from MySQL and the server storage.'
        );
      } catch (error) {
        showMessage(
          'Delete Failed',
          error instanceof Error ? error.message : 'Could not delete report.'
        );
      }
    };

    if (isWeb && typeof window !== 'undefined') {
      if (window.confirm(`Delete “${report.originalName}”?`)) {
        await performDelete();
      }
      return;
    }

    Alert.alert('Delete Report', `Delete “${report.originalName}”?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: performDelete },
    ]);
  };

  const openReport = async (report: MedicalReport) => {
    if (report.mimeType.startsWith('image/')) {
      setSelectedReport(report);
      return;
    }
    const supported = await Linking.canOpenURL(report.fileUrl);
    if (!supported) throw new Error('This device cannot open the report URL.');
    await Linking.openURL(report.fileUrl);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>📄 My Medical Reports</Text>
          <Text style={styles.subtitle}>Upload PDF or image reports, view them, and share them using a QR code.</Text>
        </View>
        <TouchableOpacity style={styles.uploadButton} onPress={uploadReport} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Ionicons name="cloud-upload-outline" size={19} color="#fff" />}
          <Text style={styles.uploadButtonText}>{uploading ? 'Uploading…' : 'Upload Report'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={20} color="#2563EB" />
        <Text style={styles.noticeText}>The QR code contains a localhost link. It works only on this computer while the backend is running.</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}><ActivityIndicator size="large" /><Text style={styles.centerText}>Loading reports…</Text></View>
      ) : reports.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="document-outline" size={54} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No reports stored yet</Text>
          <Text style={styles.centerText}>Upload your first medical report.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {reports.map((report) => (
            <View key={report.id} style={styles.card}>
              <View style={styles.preview}>
                {report.mimeType.startsWith('image/') ? (
                  <Image source={{ uri: report.fileUrl }} style={styles.thumbnail} resizeMode="cover" />
                ) : (
                  <Ionicons name="document-text-outline" size={48} color="#DC2626" />
                )}
              </View>
              <Text style={styles.name} numberOfLines={2}>{report.originalName}</Text>
              <Text style={styles.meta}>{formatFileSize(report.fileSize)} • {new Date(report.createdAt).toLocaleDateString()}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => openReport(report)}>
                  <Ionicons name="eye-outline" size={17} color="#2563EB" /><Text style={styles.actionText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => setQrReport(report)}>
                  <Ionicons name="qr-code-outline" size={17} color="#2563EB" /><Text style={styles.actionText}>QR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteReport(report)}>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal visible={Boolean(selectedReport)} transparent animationType="fade" onRequestClose={() => setSelectedReport(null)}>
        <View style={styles.backdrop}>
          <View style={styles.viewerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{selectedReport?.originalName}</Text>
              <TouchableOpacity onPress={() => setSelectedReport(null)}><Ionicons name="close" size={26} color="#0F172A" /></TouchableOpacity>
            </View>
            {selectedReport && <Image source={{ uri: selectedReport.fileUrl }} style={styles.fullImage} resizeMode="contain" />}
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(qrReport)} transparent animationType="fade" onRequestClose={() => setQrReport(null)}>
        <View style={styles.backdrop}>
          <View style={styles.qrModal}>
            <TouchableOpacity style={styles.qrClose} onPress={() => setQrReport(null)}><Ionicons name="close" size={25} color="#0F172A" /></TouchableOpacity>
            <Text style={styles.qrTitle}>Share Report</Text>
            <Text style={styles.qrName} numberOfLines={2}>{qrReport?.originalName}</Text>
            {qrReport?.shareUrl ? <View style={styles.qrBox}><QRCode value={qrReport.shareUrl} size={220} /></View> : null}
            <Text style={styles.qrHelp}>Local report link encoded in the QR code:</Text>
            <Text style={styles.qrUrl} selectable>{qrReport?.shareUrl}</Text>
            <TouchableOpacity style={styles.openButton} onPress={() => qrReport && Linking.openURL(qrReport.shareUrl)}>
              <Ionicons name="open-outline" size={18} color="#fff" /><Text style={styles.openButtonText}>Test Shared Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 18 },
  headerText: { flex: 1, minWidth: 250 },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#64748B', lineHeight: 21 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2563EB', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  uploadButtonText: { color: '#fff', fontWeight: '700' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 13, marginBottom: 18 },
  noticeText: { flex: 1, color: '#1E40AF', lineHeight: 19 },
  centerBox: { minHeight: 260, justifyContent: 'center', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  centerText: { color: '#64748B', textAlign: 'center' },
  emptyTitle: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: isWeb ? 260 : '100%', backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  preview: { height: 145, borderRadius: 12, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbnail: { width: '100%', height: '100%' },
  name: { marginTop: 12, fontWeight: '700', color: '#0F172A', minHeight: 40 },
  meta: { marginTop: 4, color: '#64748B', fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  actionText: { color: '#2563EB', fontWeight: '700', fontSize: 12 },
  deleteButton: { marginLeft: 'auto', padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.72)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  viewerModal: { width: isWeb ? '75%' : '100%', maxWidth: 900, height: '82%', backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { flex: 1, marginRight: 12, fontWeight: '700', color: '#0F172A' },
  fullImage: { flex: 1, width: '100%' },
  qrModal: { width: '100%', maxWidth: 430, backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center' },
  qrClose: { position: 'absolute', top: 13, right: 13, zIndex: 1 },
  qrTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  qrName: { marginTop: 5, marginBottom: 18, color: '#64748B', textAlign: 'center' },
  qrBox: { backgroundColor: '#fff', padding: 8 },
  qrHelp: { marginTop: 15, color: '#64748B', textAlign: 'center', fontSize: 12 },
  qrUrl: { marginTop: 7, color: '#2563EB', textAlign: 'center', fontSize: 11 },
  openButton: { marginTop: 17, flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 17, paddingVertical: 11, borderRadius: 10 },
  openButtonText: { color: '#fff', fontWeight: '700' },
});
