import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// ---------- Types ----------
interface Reminder {
  id: string;
  medicineName: string;
  dayPeriod: 'morning' | 'noon' | 'night';
  timing: 'before-meal' | 'after-meal';
  timesPerDay: number; // user-defined: 1, 2, 3, 4, 5
  durationDays: number; // user-defined: any number
  takenToday: boolean;
  startDate: Date;
  nextNotifyTime: Date | null;
}

interface RemindersScreenProps {
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
}

// ---------- Main Component ----------
export default function RemindersScreen({ reminders, setReminders }: RemindersScreenProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [dayPeriod, setDayPeriod] = useState<'morning' | 'noon' | 'night'>('morning');
  const [timing, setTiming] = useState<'before-meal' | 'after-meal'>('before-meal');
  const [timesPerDay, setTimesPerDay] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [notificationPermission, setNotificationPermission] = useState(false);

  // Request notification permissions
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications to get reminders.');
        setNotificationPermission(false);
      } else {
        setNotificationPermission(true);
      }
    } else {
      setNotificationPermission(true);
    }
  };

  // Add new reminder
  const addReminder = async () => {
    if (!medicineName.trim()) {
      Alert.alert('Error', 'Please enter medicine name.');
      return;
    }

    const times = parseInt(timesPerDay);
    if (isNaN(times) || times < 1 || times > 10) {
      Alert.alert('Error', 'Please enter a valid number of times per day (1-10).');
      return;
    }

    const days = parseInt(durationDays);
    if (isNaN(days) || days < 1) {
      Alert.alert('Error', 'Please enter a valid duration in days (minimum 1).');
      return;
    }

    const newReminder: Reminder = {
      id: Date.now().toString(),
      medicineName: medicineName.trim(),
      dayPeriod,
      timing,
      timesPerDay: times,
      durationDays: days,
      takenToday: false,
      startDate: new Date(),
      nextNotifyTime: new Date(),
    };

    // Schedule notification
    if (notificationPermission) {
      await scheduleNotification(newReminder);
    }

    setReminders([...reminders, newReminder]);
    setMedicineName('');
    setDayPeriod('morning');
    setTiming('before-meal');
    setTimesPerDay('');
    setDurationDays('');
    setModalVisible(false);
    Alert.alert('Success', `Reminder for ${newReminder.medicineName} added!\n${times}x/day for ${days} days.`);
  };

  // Schedule notification (demo: fires after 5 seconds)
  const scheduleNotification = async (reminder: Reminder) => {
    try {
      const trigger = new Date(Date.now() + 5 * 1000);
      const periodMap = {
        morning: 'Morning',
        noon: 'Noon',
        night: 'Night',
      };
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Medicine Reminder',
          body: `Time to take ${reminder.medicineName} (${periodMap[reminder.dayPeriod]} - ${reminder.timing === 'before-meal' ? 'Before meal' : 'After meal'})`,
          data: { reminderId: reminder.id },
        },
        trigger: trigger,
      });
      console.log('Notification scheduled!');
    } catch (error) {
      console.log('Error scheduling notification:', error);
    }
  };

  // Toggle taken status
  const toggleTaken = (id: string) => {
    setReminders(
      reminders.map((r) =>
        r.id === id ? { ...r, takenToday: !r.takenToday } : r
      )
    );
  };

  // Delete reminder
  const deleteReminder = (id: string) => {
    Alert.alert('Delete Reminder', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setReminders(reminders.filter((r) => r.id !== id));
        },
      },
    ]);
  };

  // Helper for display
  const getPeriodEmoji = (period: string) => {
    const map = {
      morning: '🌅',
      noon: '☀️',
      night: '🌙',
    };
    return map[period as keyof typeof map] || '⏰';
  };

  const getPeriodLabel = (period: string) => {
    const map = {
      morning: 'Morning',
      noon: 'Noon',
      night: 'Night',
    };
    return map[period as keyof typeof map] || period;
  };

  // ---- Render ----
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>⏰ Reminders</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Set and manage your medication reminders.</Text>

      {reminders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="notifications-outline" size={48} color="#94a3b8" />
          <Text style={styles.emptyText}>No reminders set yet.</Text>
          <Text style={styles.emptySubtext}>Tap the + button to add one.</Text>
        </View>
      ) : (
        reminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminderCard}>
            <View style={styles.reminderLeft}>
              <View style={styles.medHeader}>
                <Text style={styles.medName}>{reminder.medicineName}</Text>
                <Text style={styles.durationBadge}>{reminder.durationDays}d</Text>
              </View>
              <View style={styles.medDetails}>
                <Text style={styles.medDetail}>
                  {getPeriodEmoji(reminder.dayPeriod)} {getPeriodLabel(reminder.dayPeriod)}
                </Text>
                <Text style={styles.medDetail}>
                  {reminder.timing === 'before-meal' ? '🍽️ Before meal' : '🍽️ After meal'}
                </Text>
              </View>
              <Text style={styles.medDays}>
                {reminder.timesPerDay}x/day • {reminder.durationDays} day{reminder.durationDays > 1 ? 's' : ''} course
              </Text>
            </View>
            <View style={styles.reminderRight}>
              <TouchableOpacity
                style={[styles.takenBtn, reminder.takenToday && styles.takenBtnActive]}
                onPress={() => toggleTaken(reminder.id)}
              >
                <Text style={[styles.takenText, reminder.takenToday && styles.takenTextActive]}>
                  {reminder.takenToday ? '✓ Taken' : '⏳ Pending'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteReminder(reminder.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* ---- Add Reminder Modal ---- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Reminder</Text>

              {/* Medicine Name */}
              <Text style={styles.inputLabel}>Medicine Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Metformin"
                placeholderTextColor="#94a3b8"
                value={medicineName}
                onChangeText={setMedicineName}
              />

              {/* Time of Day */}
              <Text style={styles.inputLabel}>Time of Day</Text>
              <View style={styles.periodRow}>
                {(['morning', 'noon', 'night'] as const).map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[styles.periodBtn, dayPeriod === period && styles.periodBtnActive]}
                    onPress={() => setDayPeriod(period)}
                  >
                    <Text style={styles.periodEmoji}>
                      {period === 'morning' ? '🌅' : period === 'noon' ? '☀️' : '🌙'}
                    </Text>
                    <Text style={[styles.periodText, dayPeriod === period && styles.periodTextActive]}>
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Meal Timing */}
              <Text style={styles.inputLabel}>Meal Timing</Text>
              <View style={styles.timingRow}>
                <TouchableOpacity
                  style={[styles.timingBtn, timing === 'before-meal' && styles.timingBtnActive]}
                  onPress={() => setTiming('before-meal')}
                >
                  <Text style={[styles.timingText, timing === 'before-meal' && styles.timingTextActive]}>
                    🍽️ Before Meal
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timingBtn, timing === 'after-meal' && styles.timingBtnActive]}
                  onPress={() => setTiming('after-meal')}
                >
                  <Text style={[styles.timingText, timing === 'after-meal' && styles.timingTextActive]}>
                    🍽️ After Meal
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Times Per Day - Custom Input */}
              <Text style={styles.inputLabel}>Times per day</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1, 2, 3 (max 10)"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={timesPerDay}
                onChangeText={setTimesPerDay}
              />
              <Text style={styles.helperText}>Enter how many times you need to take this medicine daily.</Text>

              {/* Duration - Custom Input */}
              <Text style={styles.inputLabel}>Duration (Days)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 5, 7, 10, 14"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={durationDays}
                onChangeText={setDurationDays}
              />
              <Text style={styles.helperText}>Enter the total number of days for this course.</Text>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={addReminder}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
  },
  addBtn: {
    backgroundColor: '#0052cc',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0052cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    marginBottom: 20,
  },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    color: '#475569',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  reminderCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  reminderLeft: {
    flex: 1,
  },
  medHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  durationBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '700',
    color: '#0052cc',
  },
  medDetails: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  medDetail: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  medDays: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  reminderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  takenBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  takenBtnActive: {
    backgroundColor: '#10b981',
  },
  takenText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  takenTextActive: {
    color: '#ffffff',
  },
  deleteBtn: {
    padding: 4,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    width: '100%',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0f172a',
  },
  helperText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    fontStyle: 'italic',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    gap: 2,
  },
  periodBtnActive: {
    backgroundColor: '#0052cc',
  },
  periodEmoji: {
    fontSize: 20,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  periodTextActive: {
    color: '#ffffff',
  },
  timingRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timingBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  timingBtnActive: {
    backgroundColor: '#0052cc',
  },
  timingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  timingTextActive: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#0052cc',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
