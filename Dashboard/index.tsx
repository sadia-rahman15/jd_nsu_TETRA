import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Logo } from '@/components/Logo';
import RemindersScreen from './reminders';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// ---------- Reminder Type (matches reminders.tsx) ----------
interface Reminder {
  id: string;
  medicineName: string;
  dayPeriod: 'morning' | 'noon' | 'night';
  timing: 'before-meal' | 'after-meal';
  timesPerDay: number;      // user-defined (1-10)
  durationDays: number;     // user-defined
  takenToday: boolean;
  startDate: Date;
  nextNotifyTime: Date | null;
}

// ---------- Menu Items ----------
const menuItems = [
  { id: 'dashboard', icon: 'grid-outline', label: 'Dashboard' },
  { id: 'reports', icon: 'document-text-outline', label: 'My Reports' },
  { id: 'profile', icon: 'person-outline', label: 'Profile' },
  { id: 'family', icon: 'people-outline', label: 'Family' },
  { id: 'reminders', icon: 'notifications-outline', label: 'Reminders' },
  { id: 'appointments', icon: 'calendar-outline', label: 'Appointments' },
  { id: 'ai-insights', icon: 'bulb-outline', label: 'AI Health Insights' },
];

// ---------- Main Dashboard ----------
export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(isWeb);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    router.replace('/login');
  };

  // ----- Render content based on activeTab -----
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome reminders={reminders} setReminders={setReminders} setActiveTab={setActiveTab} />;
      case 'reports':
        return <ReportsScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'family':
        return <FamilyScreen />;
      case 'reminders':
        return <RemindersScreen reminders={reminders} setReminders={setReminders} />;
      case 'appointments':
        return <AppointmentsScreen />;
      case 'ai-insights':
        return <AIInsightsScreen />;
      default:
        return <DashboardHome reminders={reminders} setReminders={setReminders} setActiveTab={setActiveTab} />;
    }
  };

  // ----- Sidebar -----
  const Sidebar = () => (
    <View style={[styles.sidebar, !sidebarOpen && styles.sidebarHidden]}>
      <View style={styles.logoSection}>
        <Logo size="small" showText={true} />
        <Text style={styles.tagline}>Transforming Healthcare</Text>
      </View>

      <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              activeTab === item.id && styles.menuItemActive,
            ]}
            onPress={() => {
              setActiveTab(item.id);
              if (!isWeb) setSidebarOpen(false);
            }}
          >
            <Ionicons
              name={item.icon as any}
              size={20}
              color={activeTab === item.id ? '#ffffff' : '#94a3b8'}
            />
            <Text
              style={[
                styles.menuLabel,
                activeTab === item.id && styles.menuLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.connectedStatus}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Connected</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ----- Main Layout -----
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.layout}>
        {isWeb ? (
          <Sidebar />
        ) : (
          <>
            {sidebarOpen && (
              <TouchableOpacity
                style={styles.overlay}
                onPress={() => setSidebarOpen(false)}
                activeOpacity={1}
              />
            )}
            <View style={[styles.sidebarMobile, sidebarOpen && styles.sidebarMobileOpen]}>
              <Sidebar />
            </View>
          </>
        )}

        <View style={[styles.mainContent, !sidebarOpen && styles.mainContentFull]}>
          {!isWeb && (
            <View style={styles.mobileHeader}>
              <TouchableOpacity onPress={toggleSidebar} style={styles.menuToggle}>
                <Ionicons name="menu-outline" size={28} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.mobileHeaderTitle}>AmarCure</Text>
              <View style={{ width: 40 }} />
            </View>
          )}

          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1631815589963-0de0b7a9ea4d?w=1200&q=80' }}
            style={styles.backgroundImage}
            imageStyle={{ resizeMode: 'cover' }}
          >
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {renderContent()}
            </ScrollView>
          </ImageBackground>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------- Dashboard Home (with enhanced reminders preview) ----------
function DashboardHome({
  reminders,
  setReminders,
  setActiveTab,
}: {
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}) {
  const pendingReminders = reminders.filter((r) => !r.takenToday);

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.pageTitle}>Dashboard</Text>
      <Text style={styles.pageSubtitle}>Welcome back to AmarCure</Text>

      {/* Reminders Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Reminders</Text>
        {reminders.length === 0 ? (
          <View style={styles.reminderCard}>
            <Ionicons name="notifications-outline" size={32} color="#64748b" />
            <Text style={styles.reminderText}>No reminders set yet.</Text>
            <TouchableOpacity
              style={styles.reminderBtn}
              onPress={() => setActiveTab('reminders')}
            >
              <Text style={styles.reminderBtnText}>Click 'Reminders' to add one</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.reminderSummary}>
              <Text style={styles.reminderSummaryText}>
                {pendingReminders.length} reminder{pendingReminders.length !== 1 ? 's' : ''} pending
              </Text>
              <TouchableOpacity onPress={() => setActiveTab('reminders')}>
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>
            {pendingReminders.slice(0, 3).map((r) => {
              const periodEmoji =
                r.dayPeriod === 'morning' ? '🌅' : r.dayPeriod === 'noon' ? '☀️' : '🌙';
              const periodLabel =
                r.dayPeriod.charAt(0).toUpperCase() + r.dayPeriod.slice(1);
              return (
                <View key={r.id} style={styles.reminderItem}>
                  <Ionicons name="medkit-outline" size={20} color="#0052cc" />
                  <View style={styles.reminderItemContent}>
                    <Text style={styles.reminderItemText}>{r.medicineName}</Text>
                    <Text style={styles.reminderItemSub}>
                      {periodEmoji} {periodLabel} •{' '}
                      {r.timing === 'before-meal' ? 'Before meal' : 'After meal'} • {r.timesPerDay}x/day
                    </Text>
                  </View>
                  <Text style={styles.reminderItemDuration}>{r.durationDays}d</Text>
                </View>
              );
            })}
            {pendingReminders.length > 3 && (
              <Text style={styles.moreText}>+{pendingReminders.length - 3} more</Text>
            )}
          </>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="document-text-outline" size={28} color="#0052cc" />
            </View>
            <Text style={styles.actionLabel}>My Reports</Text>
            <Text style={styles.actionDesc}>View and upload your medical records.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionCard, styles.uploadCard]}>
            <View style={[styles.actionIcon, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="cloud-upload-outline" size={28} color="#10b981" />
            </View>
            <Text style={styles.actionLabel}>Upload</Text>
            <Text style={styles.actionDesc}>Upload a new medical document.</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Appointments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appointments</Text>
        <View style={styles.appointmentCard}>
          <View>
            <Text style={styles.appointmentTitle}>Book doctor appointments directly.</Text>
            <Text style={styles.appointmentSubtext}>
              Schedule with top specialists in your area.
            </Text>
          </View>
          <TouchableOpacity style={styles.bookNowBtn}>
            <Text style={styles.bookNowText}>Book Now →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ---------- Other Screen Placeholders ----------
function ReportsScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.pageTitle}>📄 My Reports</Text>
      <Text style={styles.pageSubtitle}>View and upload your medical records here.</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.pageTitle}>👤 Profile</Text>
      <Text style={styles.pageSubtitle}>Manage your personal information.</Text>
    </View>
  );
}

function FamilyScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.pageTitle}>👨‍👩‍👦 Family</Text>
      <Text style={styles.pageSubtitle}>Manage your family members' health records.</Text>
    </View>
  );
}

function AppointmentsScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.pageTitle}>📅 Appointments</Text>
      <Text style={styles.pageSubtitle}>View and book your doctor appointments.</Text>
    </View>
  );
}

function AIInsightsScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.pageTitle}>🧠 AI Health Insights</Text>
      <Text style={styles.pageSubtitle}>Get AI-powered analysis of your health data.</Text>
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1a3a',
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 220,
    height: '100%',
    backgroundColor: '#0b1a3a',
    paddingVertical: 20,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  sidebarHidden: {
    display: 'none',
  },
  sidebarMobile: {
    position: 'absolute',
    left: -240,
    top: 0,
    width: 240,
    height: '100%',
    zIndex: 20,
    transition: 'left 0.3s ease',
  },
  sidebarMobileOpen: {
    left: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 15,
  },
  logoSection: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  tagline: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menu: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 2,
    gap: 10,
  },
  menuItemActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  menuLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 12,
    gap: 10,
  },
  connectedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  mainContent: {
    flex: 1,
    marginLeft: 220,
    backgroundColor: 'transparent',
  },
  mainContentFull: {
    marginLeft: 0,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(11, 26, 58, 0.95)',
  },
  menuToggle: {
    padding: 4,
  },
  mobileHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  screenContainer: {
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14,
  },
  reminderCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    gap: 8,
  },
  reminderText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  reminderBtn: {
    marginTop: 4,
  },
  reminderBtnText: {
    fontSize: 14,
    color: '#0052cc',
    fontWeight: '600',
  },
  reminderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderSummaryText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  seeAllText: {
    fontSize: 14,
    color: '#0052cc',
    fontWeight: '600',
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  reminderItemContent: {
    flex: 1,
  },
  reminderItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
  },
  reminderItemSub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '400',
  },
  reminderItemDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0052cc',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  moreText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 4,
  },
  quickActionsRow: {
    flexDirection: width < 600 ? 'column' : 'row',
    gap: 14,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
  },
  uploadCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    flexDirection: width < 600 ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  appointmentSubtext: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  bookNowBtn: {
    backgroundColor: '#0052cc',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookNowText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
