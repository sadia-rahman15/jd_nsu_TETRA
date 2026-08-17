
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export interface MedicationReminder {
  id: string;
  type: 'medication';
  medicineName: string;
  dayPeriod: 'morning' | 'noon' | 'night';
  timing: 'before-meal' | 'after-meal';
  exactTime: string;
  timesPerDay: number;
  durationDays: number;
  takenToday: boolean;
  startDate: string;
}

export interface DoctorAppointmentReminder {
  id: string;
  type: 'appointment';
  doctorName: string;
  hospitalName: string;
  specialty: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
  completed: boolean;
}

interface RemindersScreenProps {
  onBack?: () => void;
  medReminders?: MedicationReminder[];
  setMedReminders?: React.Dispatch<React.SetStateAction<MedicationReminder[]>>;
  docAppointments?: DoctorAppointmentReminder[];
  setDocAppointments?: React.Dispatch<React.SetStateAction<DoctorAppointmentReminder[]>>;
}

export default function RemindersScreen({
  onBack,
  medReminders: propMedReminders,
  setMedReminders: propSetMedReminders,
  docAppointments: propDocAppointments,
  setDocAppointments: propSetDocAppointments,
}: RemindersScreenProps) {
  const [internalMeds, setInternalMeds] = useState<MedicationReminder[]>([]);
  const [internalAppts, setInternalAppts] = useState<DoctorAppointmentReminder[]>([]);

  const medReminders = propMedReminders !== undefined ? propMedReminders : internalMeds;
  const setMedReminders = propSetMedReminders !== undefined ? propSetMedReminders : setInternalMeds;

  const docAppointments = propDocAppointments !== undefined ? propDocAppointments : internalAppts;
  const setDocAppointments = propSetDocAppointments !== undefined ? propSetDocAppointments : setInternalAppts;

  const [activeTab, setActiveTab] = useState<'medication' | 'appointment'>('medication');

  const [medModalVisible, setMedModalVisible] = useState(false);
  const [docModalVisible, setDocModalVisible] = useState(false);

  const [medicineName, setMedicineName] = useState('');
  const [dayPeriod, setDayPeriod] = useState<'morning' | 'noon' | 'night'>('morning');
  const [timing, setTiming] = useState<'before-meal' | 'after-meal'>('after-meal');

  const hoursList = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
  const amPmList = ['AM', 'PM'];
  const [hourIndex, setHourIndex] = useState(8);
  const [amPmIndex, setAmPmIndex] = useState(0);
  const [minuteVal, setMinuteVal] = useState(0);

  const [timesPerDay, setTimesPerDay] = useState('1');
  const [durationDays, setDurationDays] = useState('7');

  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');
  const [notes, setNotes] = useState('');

  const requestPermissions = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permission Required', 'Please enable device notifications to receive real-time alerts.');
      }
    }
  };

  // Function to schedule real-time device notification
  const scheduleDeviceNotification = async (title: string, body: string, triggerDate: Date) => {
    try {
      await requestPermissions();
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    } catch (error) {
      console.log('Error scheduling notification:', error);
    }
  };

  const handleAddMedication = async () => {
    const finalMedName = medicineName.trim() ? medicineName.trim() : 'Prescribed Medicine';
    const formattedMinute = String(minuteVal).padStart(2, '0');
    const finalExactTime = `${hoursList[hourIndex]}:${formattedMinute} ${amPmList[amPmIndex]}`;

    // Calculate trigger time for today or tomorrow
    const now = new Date();
    let targetHour = parseInt(hoursList[hourIndex], 10);
    if (amPmList[amPmIndex] === 'PM' && targetHour < 12) targetHour += 12;
    if (amPmList[amPmIndex] === 'AM' && targetHour === 12) targetHour = 0;

    const triggerTime = new Date();
    triggerTime.setHours(targetHour, minuteVal, 0, 0);
    if (triggerTime.getTime() <= now.getTime()) {
      triggerTime.setDate(triggerTime.getDate() + 1); // If time has passed today, set for tomorrow
    }

    // Schedule real-time device notification
    await scheduleDeviceNotification(
      `Medication Alert: ${finalMedName}`,
      `Time to take your ${finalMedName} (${timing === 'before-meal' ? 'Before Meal' : 'After Meal'}).`,
      triggerTime
    );

    const newMed: MedicationReminder = {
      id: Date.now().toString(),
      type: 'medication',
      medicineName: finalMedName,
      dayPeriod,
      timing,
      exactTime: finalExactTime,
      timesPerDay: parseInt(timesPerDay, 10) || 1,
      durationDays: parseInt(durationDays, 10) || 1,
      takenToday: false,
      startDate: new Date().toISOString(),
    };

    setMedReminders([newMed, ...(medReminders || [])]);
    setMedicineName('');
    setMedModalVisible(false);
    Alert.alert('Success', `Notification set! You will be alerted at ${finalExactTime}.`);
  };

  const handleAddAppointment = async () => {
    if (!doctorName.trim() || !hospitalName.trim() || !appointmentDate.trim()) {
      Alert.alert('Error', 'Please fill in required fields.');
      return;
    }

    const [year, month, day] = appointmentDate.split('-').map(Number);
    const triggerDate = new Date(year, month - 1, day, 9, 0, 0); // Default to 9:00 AM on appointment day

    await scheduleDeviceNotification(
      `Doctor Appointment Reminder`,
      `Upcoming visit with Dr. ${doctorName.trim()} at ${hospitalName.trim()} today.`,
      triggerDate
    );

    const newAppt: DoctorAppointmentReminder = {
      id: Date.now().toString(),
      type: 'appointment',
      doctorName: doctorName.trim(),
      hospitalName: hospitalName.trim(),
      specialty: specialty.trim() || 'General Consultation',
      appointmentDate: appointmentDate.trim(),
      appointmentTime: appointmentTime || '10:00 AM',
      notes: notes.trim(),
      completed: false,
    };

    setDocAppointments([newAppt, ...(docAppointments || [])]);
    setDoctorName('');
    setHospitalName('');
    setSpecialty('');
    setAppointmentDate('');
    setNotes('');
    setDocModalVisible(false);
    Alert.alert('Success', `Appointment notification set for ${appointmentDate}!`);
  };

  const toggleMedTaken = (id: string) => {
    setMedReminders((medReminders || []).map((m) => (m.id === id ? { ...m, takenToday: !m.takenToday } : m)));
  };

  const toggleApptCompleted = (id: string) => {
    setDocAppointments((docAppointments || []).map((a) => (a.id === id ? { ...a, completed: !a.completed } : a)));
  };

  const deleteMed = (id: string) => {
    setMedReminders((medReminders || []).filter((m) => m.id !== id));
  };

  const deleteAppt = (id: string) => {
    setDocAppointments((docAppointments || []).filter((a) => a.id !== id));
  };

  const safeMeds = medReminders || [];
  const safeAppts = docAppointments || [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (onBack) {
                  onBack();
                }
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#0f172a" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.title}>⏰ Health Reminders</Text>
            <Text style={styles.subtitle}>Manage medication schedules and appointments.</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => (activeTab === 'medication' ? setMedModalVisible(true) : setDocModalVisible(true))}
        >
          <Ionicons name="add" size={26} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'medication' && styles.tabBtnActive]}
          onPress={() => setActiveTab('medication')}
        >
          <Text style={[styles.tabText, activeTab === 'medication' && styles.tabTextActive]}>
            Medication ({safeMeds.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'appointment' && styles.tabBtnActive]}
          onPress={() => setActiveTab('appointment')}
        >
          <Text style={[styles.tabText, activeTab === 'appointment' && styles.tabTextActive]}>
            Doctor Meetups ({safeAppts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab 1: Medication */}
      {activeTab === 'medication' && (
        <View style={styles.section}>
          {safeMeds.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="medical-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyText}>No medication reminders set.</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setMedModalVisible(true)}>
                <Text style={styles.emptyAddBtnText}>+ Add Medication</Text>
              </TouchableOpacity>
            </View>
          ) : (
            safeMeds.map((med) => (
              <View key={med.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{med.medicineName}</Text>
                    <View style={styles.timeBadge}>
                      <Ionicons name="time-outline" size={12} color="#0284c7" />
                      <Text style={styles.timeBadgeText}>{med.exactTime}</Text>
                    </View>
                  </View>
                  <View style={styles.tagRow}>
                    <Text style={styles.tag}>{med.dayPeriod?.toUpperCase()}</Text>
                    <Text style={styles.tag}>{med.timing === 'before-meal' ? 'Before Meal' : 'After Meal'}</Text>
                    <Text style={styles.tag}>{med.durationDays} Days</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.statusBtn, med.takenToday && styles.statusBtnDone]}
                    onPress={() => toggleMedTaken(med.id)}
                  >
                    <Text style={[styles.statusBtnText, med.takenToday && styles.statusBtnTextDone]}>
                      {med.takenToday ? 'Taken' : 'Pending'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteMed(med.id)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Tab 2: Appointments */}
      {activeTab === 'appointment' && (
        <View style={styles.section}>
          {safeAppts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyText}>No appointments scheduled.</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setDocModalVisible(true)}>
                <Text style={styles.emptyAddBtnText}>+ Add Appointment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            safeAppts.map((appt) => (
              <View key={appt.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{appt.doctorName}</Text>
                    <View style={styles.dateBadge}>
                      <Ionicons name="calendar" size={12} color="#059669" />
                      <Text style={styles.dateBadgeText}>{appt.appointmentDate}</Text>
                    </View>
                  </View>
                  <Text style={styles.specText}>{appt.specialty} • {appt.appointmentTime}</Text>
                  <Text style={styles.hospitalText}>{appt.hospitalName}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.statusBtn, appt.completed && styles.statusBtnDone]}
                    onPress={() => toggleApptCompleted(appt.id)}
                  >
                    <Text style={[styles.statusBtnText, appt.completed && styles.statusBtnTextDone]}>
                      {appt.completed ? 'Visited' : 'Upcoming'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteAppt(appt.id)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Medication Modal */}
      <Modal visible={medModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContainer}>
            <View style={styles.modalCard}>
              <Text style={styles.modalHeader}>Add Medication Reminder</Text>

              <Text style={styles.fieldLabel}>Medicine Name</Text>
              <TextInput style={styles.input} value={medicineName} onChangeText={setMedicineName} placeholder="e.g. Napa 500mg" placeholderTextColor="#94a3b8" />

              <View style={styles.timePickerContainer}>
                <View style={styles.timeColumn}>
                  <Text style={styles.columnHeader}>Hours & AM/PM</Text>
                  <View style={styles.spinnerBox}>
                    <TouchableOpacity
                      style={styles.arrowBtn}
                      onPress={() => setHourIndex((prev) => (prev === 0 ? hoursList.length - 1 : prev - 1))}
                    >
                      <Ionicons name="chevron-back" size={18} color="#475569" />
                    </TouchableOpacity>

                    <View style={styles.spinnerTextContainer}>
                      <Text style={styles.spinnerText}>
                        {hoursList[hourIndex]} {amPmList[amPmIndex]}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setAmPmIndex((prev) => (prev === 0 ? 1 : 0))}
                        style={styles.amPmToggleBadge}
                      >
                        <Text style={styles.amPmToggleText}>Switch {amPmList[amPmIndex] === 'AM' ? 'PM' : 'AM'}</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.arrowBtn}
                      onPress={() => setHourIndex((prev) => (prev === hoursList.length - 1 ? 0 : prev + 1))}
                    >
                      <Ionicons name="chevron-forward" size={18} color="#475569" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.timeColumn}>
                  <Text style={styles.columnHeader}>Minutes</Text>
                  <View style={styles.spinnerBox}>
                    <TouchableOpacity
                      style={styles.arrowBtn}
                      onPress={() => setMinuteVal((prev) => (prev === 0 ? 59 : prev - 1))}
                    >
                      <Ionicons name="chevron-back" size={18} color="#475569" />
                    </TouchableOpacity>

                    <View style={styles.spinnerTextContainer}>
                      <Text style={styles.spinnerText}>
                        {String(minuteVal).padStart(2, '0')}
                      </Text>
                      <Text style={styles.spinnerSubText}>mins</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.arrowBtn}
                      onPress={() => setMinuteVal((prev) => (prev === 59 ? 0 : prev + 1))}
                    >
                      <Ionicons name="chevron-forward" size={18} color="#475569" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Time of Day</Text>
              <View style={styles.chipRow}>
                {(['morning', 'noon', 'night'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, dayPeriod === p && styles.chipActive]}
                    onPress={() => setDayPeriod(p)}
                  >
                    <Text style={[styles.chipText, dayPeriod === p && styles.chipTextActive]}>
                      {p === 'morning' ? 'Morning' : p === 'noon' ? 'Noon' : 'Night'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Meal Relation</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, timing === 'before-meal' && styles.chipActive]}
                  onPress={() => setTiming('before-meal')}
                >
                  <Text style={[styles.chipText, timing === 'before-meal' && styles.chipTextActive]}>Before Meal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, timing === 'after-meal' && styles.chipActive]}
                  onPress={() => setTiming('after-meal')}
                >
                  <Text style={[styles.chipText, timing === 'after-meal' && styles.chipTextActive]}>After Meal</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Times/Day</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={timesPerDay} onChangeText={setTimesPerDay} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Duration (Days)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={durationDays} onChangeText={setDurationDays} />
                </View>
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setMedModalVisible(false)}>
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={handleAddMedication}>
                  <Text style={styles.saveModalBtnText}>Save Medication</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Appointment Modal */}
      <Modal visible={docModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeader}>Add Doctor Appointment</Text>
            <Text style={styles.fieldLabel}>Doctor Name</Text>
            <TextInput style={styles.input} value={doctorName} onChangeText={setDoctorName} placeholder="Dr. Name" placeholderTextColor="#94a3b8" />
            <Text style={styles.fieldLabel}>Hospital / Chamber</Text>
            <TextInput style={styles.input} value={hospitalName} onChangeText={setHospitalName} placeholder="Hospital Name" placeholderTextColor="#94a3b8" />
            <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={appointmentDate} onChangeText={setAppointmentDate} placeholder="2026-08-05" placeholderTextColor="#94a3b8" />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setDocModalVisible(false)}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={handleAddAppointment}>
                <Text style={styles.saveModalBtnText}>Save Appointment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 20, paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0284c7', justifyContent: 'center', alignItems: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 12, padding: 4, marginBottom: 18 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#ffffff' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#0f172a' },
  section: { marginBottom: 30 },
  emptyCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', gap: 8 },
  emptyText: { fontSize: 15, color: '#64748b', fontWeight: '600' },
  emptyAddBtn: { marginTop: 8, backgroundColor: '#0284c7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  emptyAddBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  timeBadgeText: { fontSize: 11, fontWeight: '700', color: '#0284c7' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#d1fae5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  dateBadgeText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tag: { fontSize: 11, backgroundColor: '#f1f5f9', color: '#475569', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontWeight: '600' },
  specText: { fontSize: 13, color: '#10b981', fontWeight: '700', marginTop: 4 },
  hospitalText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  cardActions: { alignItems: 'flex-end', gap: 10 },
  statusBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1' },
  statusBtnDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  statusBtnText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  statusBtnTextDone: { color: '#ffffff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalScrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, width: '100%' },
  modalCard: { width: '100%', maxWidth: 440, backgroundColor: '#ffffff', borderRadius: 18, padding: 20 },
  modalHeader: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 10, marginBottom: 4 },
  input: { height: 42, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#f8fafc', fontSize: 13, color: '#0f172a' },
  timePickerContainer: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  timeColumn: { flex: 1 },
  columnHeader: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 4 },
  spinnerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, height: 50, paddingHorizontal: 4, justifyContent: 'space-between' },
  arrowBtn: { width: 32, height: 38, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0', borderRadius: 6 },
  spinnerTextContainer: { alignItems: 'center' },
  spinnerText: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  spinnerSubText: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  amPmToggleBadge: { marginTop: 2, backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  amPmToggleText: { fontSize: 9, fontWeight: '700', color: '#0284c7' },
  chipRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  chip: { flex: 1, paddingVertical: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, alignItems: 'center' },
  chipActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  chipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  chipTextActive: { color: '#ffffff' },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelModalBtn: { flex: 1, height: 42, backgroundColor: '#f1f5f9', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cancelModalBtnText: { color: '#475569', fontWeight: '700' },
  saveModalBtn: { flex: 1, height: 42, backgroundColor: '#10b981', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  saveModalBtnText: { color: '#ffffff', fontWeight: '700' },
});
