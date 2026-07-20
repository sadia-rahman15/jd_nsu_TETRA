import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  SafeAreaView,
  TextInput,
  Animated,
  StatusBar,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Logo } from '@/components/Logo';
import ReportsScreen from './ReportsScreen';
import AvailableHospitalsScreen from './AvailableHospitalsScreen';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isTablet = width >= 768 && width < 1024;

const getCurrentUserId = (): number => {
  try {
    const currentUser = (globalThis as any).__AMARCURE_USER__;

    if (currentUser?.id) {
      return Number(currentUser.id);
    }

    if (isWeb && typeof window !== 'undefined') {
      const savedUser = window.localStorage.getItem('amarcure_user');

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);

        if (parsedUser?.id) {
          return Number(parsedUser.id);
        }
      }
    }
  } catch (error) {
    console.error('Failed to read current user:', error);
  }

  return 0;
};

// ---------- Types ----------
interface Reminder {
  id: string;
  medicineName: string;
  takenToday: boolean;
  dayPeriod: 'morning' | 'noon' | 'night';
}

interface Appointment {
  id: string;
  doctorName: string;
  hospital: string;
  date: Date;
  time: string;
}

// ---------- Menu Items ----------
const menuItems = [
  { id: 'dashboard', icon: 'grid-outline', label: 'Dashboard' },
  { id: 'blood-search', icon: 'search-circle-outline', label: 'Search Blood' },
  { id: 'reports', icon: 'document-text-outline', label: 'My Reports' },
  { id: 'profile', icon: 'person-outline', label: 'Profile' },
  { id: 'family', icon: 'people-outline', label: 'Family' },
  { id: 'reminders', icon: 'notifications-outline', label: 'Reminders' },
  { id: 'appointments', icon: 'calendar-outline', label: 'Appointments' },
  { id: 'ai-insights', icon: 'bulb-outline', label: 'AI Insights' },
  { id: 'available-hospitals', icon: 'business-outline', label: 'Available Hospitals' },
];

// ---------- Main Dashboard ----------
export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(isWeb);
  const [searchQuery, setSearchQuery] = useState('');

  // ---------- REAL DATA STATE (to be connected to child screens later) ----------
  const [reminders, setReminders] = useState<Reminder[]>([
    // Example: two pending reminders to show the notification
    { id: '1', medicineName: 'Metformin', takenToday: false, dayPeriod: 'morning' },
    { id: '2', medicineName: 'Lisinopril', takenToday: false, dayPeriod: 'noon' },
  ]);
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      doctorName: 'Dr. Sarah Ahmed',
      hospital: 'City Hospital',
      date: new Date(),
      time: '3:30 PM',
    },
  ]);
  const [bmi, setBmi] = useState(25.4); // example – will be calculated from real health data

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    try {
      delete (globalThis as any).__AMARCURE_USER__;

      if (isWeb && typeof window !== 'undefined') {
        window.localStorage.removeItem('amarcure_user');
      }
    } catch (error) {
      console.error('Failed to clear current user:', error);
    }

    router.replace('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardHome
            reminders={reminders}
            appointments={appointments}
            bmi={bmi}
            setReminders={setReminders}
            setAppointments={setAppointments}
            setBmi={setBmi}
            onNavigate={setActiveTab}
          />
        );
      case 'blood-search':
        return <PlaceholderScreen title="🩸 Search Blood" subtitle="Find blood banks, donors, and request blood tests" />;
      case 'reports': {
        const currentUserId = getCurrentUserId();

        if (!currentUserId) {
          return (
            <PlaceholderScreen
              title="🔒 Session Required"
              subtitle="Please log in again before accessing your medical reports."
            />
          );
        }

        return <ReportsScreen userId={currentUserId} />;
      }
      case 'profile':
        return <PlaceholderScreen title="👤 Profile" subtitle="Manage your personal information" />;
      case 'family':
        return <PlaceholderScreen title="👨‍👩‍👦 Family" subtitle="Manage your family members' health records" />;
      case 'reminders':
        return <PlaceholderScreen title="⏰ Reminders" subtitle="Set and manage your medication reminders" />;
      case 'appointments':
        return <PlaceholderScreen title="📅 Appointments" subtitle="View and book your doctor appointments" />;
      case 'ai-insights':
        return <PlaceholderScreen title="🧠 AI Insights" subtitle="Get AI-powered analysis of your health data" />;
      case 'available-hospitals':
        return <AvailableHospitalsScreen />;
      default:
        return (
          <DashboardHome
            reminders={reminders}
            appointments={appointments}
            bmi={bmi}
            setReminders={setReminders}
            setAppointments={setAppointments}
            setBmi={setBmi}
            onNavigate={setActiveTab}
          />
        );
    }
  };

  const Sidebar = () => {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    return (
      <View style={[styles.sidebar, !sidebarOpen && styles.sidebarHidden]}>
        <BlurView intensity={isWeb ? 0 : 80} tint="dark" style={styles.sidebarBlur}>
          <View style={styles.logoSection}>
            <Logo size="small" showText={true} />
            <Text style={styles.tagline}>Transforming Healthcare</Text>
          </View>

          <View style={styles.sidebarSearch}>
            <Ionicons name="search-outline" size={16} color="#64748b" />
            <TextInput
              style={styles.sidebarSearchInput}
              placeholder="Search..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  activeTab === item.id && styles.menuItemActive,
                  hoveredItem === item.id && styles.menuItemHover,
                ]}
                onPress={() => {
                  setActiveTab(item.id);
                  if (!isWeb) setSidebarOpen(false);
                }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                activeOpacity={0.8}
              >
                <View style={styles.menuIconWrapper}>
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={activeTab === item.id ? '#ffffff' : '#94a3b8'}
                  />
                </View>
                <Text
                  style={[
                    styles.menuLabel,
                    activeTab === item.id && styles.menuLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
                {activeTab === item.id && <View style={styles.menuActiveDot} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.bottomSection}>
            <View style={styles.userProfile}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>T</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>Tanvir Ahmed</Text>
                <Text style={styles.userRole}>Patient</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1a3a" />
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
            <Animated.View style={[styles.sidebarMobile, sidebarOpen && styles.sidebarMobileOpen]}>
              <Sidebar />
            </Animated.View>
          </>
        )}

        <Animated.View
          style={[
            styles.mainContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {!isWeb && (
            <View style={styles.mobileHeader}>
              <TouchableOpacity onPress={toggleSidebar} style={styles.menuToggle}>
                <Ionicons name="menu-outline" size={28} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.mobileHeaderTitle}>AmarCure</Text>
              <TouchableOpacity style={styles.headerNotification}>
                <Ionicons name="notifications-outline" size={24} color="#ffffff" />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.whiteBackground}>
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentContainer}
            >
              {renderContent()}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

// ===== REPORTS SCREEN =====
// ===== PLACEHOLDER SCREEN =====
function PlaceholderScreen({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.placeholderContainer}>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderTitle}>{title}</Text>
        <Text style={styles.placeholderSubtitle}>{subtitle}</Text>
        <View style={styles.placeholderIcon}>
          <Ionicons name="construct-outline" size={48} color="#CBD5E1" />
        </View>
        <Text style={styles.placeholderText}>This screen will be created separately</Text>
        <Text style={styles.placeholderHint}>Create a new file for this module</Text>
      </View>
    </View>
  );
}

// ===== DYNAMIC NOTIFICATION BOX =====
function NotificationBox({
  reminders,
  appointments,
  bmi,
}: {
  reminders: Reminder[];
  appointments: Appointment[];
  bmi: number;
}) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  // Build notifications based on real data
  const pendingReminders = reminders.filter((r) => !r.takenToday);
  const upcomingAppointments = appointments.filter(
    (a) => a.date.toDateString() === new Date().toDateString()
  );
  const isBmiOverweight = bmi > 25;

  const notifications = [];

  if (pendingReminders.length > 0) {
    notifications.push({
      id: 'reminder',
      icon: 'notifications-outline',
      title: `${pendingReminders.length} Medication Reminder${pendingReminders.length > 1 ? 's' : ''} Pending`,
      desc: pendingReminders.map((r) => r.medicineName).join(' • '),
      color: '#D97706',
      bg: '#FFFBEB',
      time: 'Due now',
    });
  }

  if (upcomingAppointments.length > 0) {
    const appt = upcomingAppointments[0];
    notifications.push({
      id: 'appointment',
      icon: 'calendar-outline',
      title: 'Upcoming Appointment Today',
      desc: `${appt.doctorName} • ${appt.time} • ${appt.hospital}`,
      color: '#2563EB',
      bg: '#EFF6FF',
      time: 'Today',
    });
  }

  if (isBmiOverweight) {
    notifications.push({
      id: 'bmi',
      icon: 'fitness-outline',
      title: 'BMI Alert: Slightly Above Normal',
      desc: `Your BMI is ${bmi.toFixed(1)}. Target: 18.5 – 24.9`,
      color: '#DC2626',
      bg: '#FEF2F2',
      time: 'Take action',
    });
  }

  const activeNotifications = notifications.filter((n) => !dismissed.includes(n.id));

  const dismissNotification = (id: string) => {
    setDismissed([...dismissed, id]);
  };

  if (activeNotifications.length === 0) {
    return (
      <View style={styles.notificationBoxEmpty}>
        <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
        <Text style={styles.notificationEmptyText}>All caught up! No notifications.</Text>
      </View>
    );
  }

  return (
    <View style={styles.notificationBox}>
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationHeaderTitle}>📬 Notifications</Text>
        <Text style={styles.notificationHeaderCount}>{activeNotifications.length} alerts</Text>
      </View>
      {activeNotifications.map((notif) => (
        <View key={notif.id} style={[styles.notificationItem, { backgroundColor: notif.bg }]}>
          <View style={[styles.notificationIconWrapper, { backgroundColor: notif.color + '20' }]}>
            <Ionicons name={notif.icon as any} size={20} color={notif.color} />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{notif.title}</Text>
            <Text style={styles.notificationDesc}>{notif.desc}</Text>
            <View style={styles.notificationTimeWrapper}>
              <Ionicons name="time-outline" size={12} color="#94A3B8" />
              <Text style={styles.notificationTime}>{notif.time}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationDismiss}
            onPress={() => dismissNotification(notif.id)}
          >
            <Ionicons name="close-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// ===== DASHBOARD HOME =====
function DashboardHome({
  reminders,
  appointments,
  bmi,
  setReminders,
  setAppointments,
  setBmi,
  onNavigate,
}: {
  reminders: Reminder[];
  appointments: Appointment[];
  bmi: number;
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setBmi: React.Dispatch<React.SetStateAction<number>>;
  onNavigate: (tab: string) => void;
}) {
  const scaleAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  const handlePressIn = (index: number) => {
    Animated.spring(scaleAnims[index], {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = (index: number) => {
    Animated.spring(scaleAnims[index], {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  // Section modules – counts dynamically reflect state
  const section1Modules = [
    {
      id: 'reminders',
      icon: 'notifications-outline',
      label: 'Reminders',
      desc: `${reminders.filter((r) => !r.takenToday).length} pending`,
      colors: ['#0891B2', '#06B6D4'],
      bg: '#ECFEFF',
      gradient: ['#ECFEFF', '#CFFAFE'],
    },
    {
      id: 'appointments',
      icon: 'calendar-outline',
      label: 'Appointments',
      desc: `${appointments.length} booked`,
      colors: ['#D97706', '#F59E0B'],
      bg: '#FFFBEB',
      gradient: ['#FFFBEB', '#FEF3C7'],
    },
    {
      id: 'blood-search',
      icon: 'heart-outline',
      label: 'Blood Search',
      desc: 'Find donors & banks',
      colors: ['#DC2626', '#EF4444'],
      bg: '#FEF2F2',
      gradient: ['#FEF2F2', '#FEE2E2'],
    },
  ];

  const section2Modules = [
    {
      id: 'reports',
      icon: 'document-text-outline',
      label: 'My Reports',
      desc: 'Upload & view records',
      colors: ['#2563EB', '#3B82F6'],
      bg: '#EFF6FF',
      gradient: ['#EFF6FF', '#DBEAFE'],
    },
    {
      id: 'emergency',
      icon: 'alert-circle-outline',
      label: 'Emergency',
      desc: 'Quick access',
      colors: ['#EF4444', '#F87171'],
      bg: '#FEF2F2',
      gradient: ['#FEF2F2', '#FEE2E2'],
    },
    {
      id: 'health-summary',
      icon: 'stats-chart-outline',
      label: 'Health Summary',
      desc: 'Your health overview',
      colors: ['#7C3AED', '#8B5CF6'],
      bg: '#EDE9FE',
      gradient: ['#EDE9FE', '#DDD6FE'],
    },
  ];

  const section3Modules = [
    {
      id: 'ai-insights',
      icon: 'bulb-outline',
      label: 'AI Insights',
      desc: 'Smart health analysis',
      colors: ['#7C3AED', '#A78BFA'],
      bg: '#EDE9FE',
      gradient: ['#EDE9FE', '#DDD6FE'],
    },
    {
      id: 'available-hospitals',
      icon: 'business-outline',
      label: 'Available Hospital',
      desc: 'Find nearby hospitals',
      colors: ['#059669', '#10B981'],
      bg: '#ECFDF5',
      gradient: ['#ECFDF5', '#D1FAE5'],
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 17) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  };

  return (
    <View style={styles.screenContainer}>
      {/* Greeting */}
      <View style={styles.greetingContainer}>
        <View>
          <Text style={styles.greetingText}>{getGreeting()}, Tanvir!</Text>
          <Text style={styles.greetingSub}>Welcome to AmarCure Healthcare</Text>
        </View>
        <View style={styles.greetingBadge}>
          <LinearGradient
            colors={['#2563EB', '#3B82F6']}
            style={styles.greetingBadgeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.greetingBadgeText}>BD's 1st AI Healthcare</Text>
          </LinearGradient>
        </View>
      </View>

      {/* ===== DYNAMIC NOTIFICATION BOX ===== */}
      <NotificationBox reminders={reminders} appointments={appointments} bmi={bmi} />

      {/* SECTION 1 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏥 Health Management</Text>
        <Text style={styles.sectionSubtitle}>Stay on track with your health</Text>

        <View style={styles.modulesGrid}>
          {section1Modules.map((module, index) => (
            <Animated.View
              key={module.id}
              style={[
                styles.moduleCardWrapper,
                { transform: [{ scale: scaleAnims[index] }] },
              ]}
            >
              <TouchableOpacity
                style={styles.moduleCard}
                activeOpacity={1}
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                onPress={() => onNavigate(module.id)}
              >
                <LinearGradient
                  colors={module.gradient as any}
                  style={styles.moduleCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={[styles.moduleIconWrapper, { backgroundColor: module.bg }]}>
                    <LinearGradient
                      colors={module.colors as any}
                      style={styles.moduleIconGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name={module.icon as any} size={20} color="#ffffff" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.moduleLabel}>{module.label}</Text>
                  <Text style={styles.moduleDesc}>{module.desc}</Text>
                  <View style={styles.moduleArrow}>
                    <Ionicons name="arrow-forward-circle" size={18} color={module.colors[0]} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* SECTION 2 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>❤️ Personal Health</Text>
        <Text style={styles.sectionSubtitle}>Your health records & emergency</Text>

        <View style={styles.modulesGrid}>
          {section2Modules.map((module, index) => {
            const idx = index + 3;
            return (
              <Animated.View
                key={module.id}
                style={[
                  styles.moduleCardWrapper,
                  { transform: [{ scale: scaleAnims[idx] }] },
                ]}
              >
                <TouchableOpacity
                  style={styles.moduleCard}
                  activeOpacity={1}
                  onPressIn={() => handlePressIn(idx)}
                  onPressOut={() => handlePressOut(idx)}
                  onPress={() => onNavigate(module.id)}
                >
                  <LinearGradient
                    colors={module.gradient as any}
                    style={styles.moduleCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={[styles.moduleIconWrapper, { backgroundColor: module.bg }]}>
                      <LinearGradient
                        colors={module.colors as any}
                        style={styles.moduleIconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name={module.icon as any} size={20} color="#ffffff" />
                      </LinearGradient>
                    </View>
                    <Text style={styles.moduleLabel}>{module.label}</Text>
                    <Text style={styles.moduleDesc}>{module.desc}</Text>
                    <View style={styles.moduleArrow}>
                      <Ionicons name="arrow-forward-circle" size={18} color={module.colors[0]} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* SECTION 3 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧠 Smart & Resources</Text>
        <Text style={styles.sectionSubtitle}>AI insights & hospital locator</Text>

        <View style={styles.modulesGrid}>
          {section3Modules.map((module, index) => {
            const idx = index + 6;
            return (
              <Animated.View
                key={module.id}
                style={[
                  styles.moduleCardWrapper,
                  styles.moduleCardWrapperHalf,
                  { transform: [{ scale: scaleAnims[idx] }] },
                ]}
              >
                <TouchableOpacity
                  style={styles.moduleCard}
                  activeOpacity={1}
                  onPressIn={() => handlePressIn(idx)}
                  onPressOut={() => handlePressOut(idx)}
                  onPress={() => onNavigate(module.id)}
                >
                  <LinearGradient
                    colors={module.gradient as any}
                    style={styles.moduleCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={[styles.moduleIconWrapper, { backgroundColor: module.bg }]}>
                      <LinearGradient
                        colors={module.colors as any}
                        style={styles.moduleIconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name={module.icon as any} size={20} color="#ffffff" />
                      </LinearGradient>
                    </View>
                    <Text style={styles.moduleLabel}>{module.label}</Text>
                    <Text style={styles.moduleDesc}>{module.desc}</Text>
                    <View style={styles.moduleArrow}>
                      <Ionicons name="arrow-forward-circle" size={18} color={module.colors[0]} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ===== STYLES (unchanged – only the test buttons removed) =====
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
    width: 260,
    flexShrink: 0,
    height: '100%',
    backgroundColor: '#0b1a3a',
    zIndex: 10,
  },
  sidebarBlur: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sidebarHidden: {
    display: 'none',
  },
  sidebarMobile: {
    position: 'absolute',
    left: -280,
    top: 0,
    width: 280,
    height: '100%',
    zIndex: 20,
    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 15,
  },
  logoSection: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
  },
  tagline: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sidebarSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sidebarSearchInput: {
    flex: 1,
    height: 38,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#ffffff',
  },
  menu: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
    gap: 12,
    position: 'relative',
    transition: 'all 0.2s ease',
  },
  menuItemActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  menuItemHover: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  menuIconWrapper: {
    width: 24,
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
    flex: 1,
  },
  menuLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  menuActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563EB',
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
    gap: 10,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  userRole: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '400',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  whiteBackground: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
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
  headerNotification: {
    padding: 4,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#0b1a3a',
  },
  screenContainer: {
    paddingBottom: 8,
  },
  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  greetingSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  greetingBadge: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  greetingBadgeGradient: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  greetingBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // ===== NOTIFICATION BOX STYLES =====
  notificationBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationBoxEmpty: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationEmptyText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  notificationHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  notificationHeaderCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  notificationIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  notificationDesc: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
  },
  notificationTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  notificationTime: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '400',
  },
  notificationDismiss: {
    padding: 4,
  },
  // ===== SECTION STYLES =====
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
    marginBottom: 8,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moduleCardWrapper: {
    width: isWeb ? '31%' : isTablet ? '48%' : '47%',
  },
  moduleCardWrapperHalf: {
    width: isWeb ? '47%' : isTablet ? '48%' : '47%',
  },
  moduleCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  moduleCardGradient: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  moduleIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  moduleIconGradient: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  moduleDesc: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '400',
    marginTop: 0,
  },
  moduleArrow: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  reportsScreen: {
    paddingBottom: 20,
  },
  reportsHeader: {
    flexDirection: isWeb ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: isWeb ? 'center' : 'stretch',
    gap: 14,
    marginBottom: 14,
  },
  reportsHeaderText: {
    flex: 1,
  },
  reportsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  reportsSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
  },
  uploadReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  uploadReportButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  reportSecurityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  reportSecurityText: {
    flex: 1,
    color: '#1E40AF',
    fontSize: 12,
    lineHeight: 17,
  },
  reportLoadingBox: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  reportLoadingText: {
    color: '#64748B',
    fontSize: 14,
  },
  emptyReportsCard: {
    minHeight: 260,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyReportsTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyReportsText: {
    marginTop: 5,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reportCard: {
    width: isWeb ? '31.8%' : isTablet ? '48%' : '100%',
    minWidth: isWeb ? 240 : undefined,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reportPreview: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
  },
  reportThumbnail: {
    width: '100%',
    height: '100%',
  },
  pdfPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  pdfLabel: {
    marginTop: 5,
    fontWeight: '800',
    color: '#DC2626',
  },
  reportName: {
    minHeight: 38,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: '#0F172A',
  },
  reportMeta: {
    marginTop: 4,
    fontSize: 11,
    color: '#94A3B8',
  },
  reportActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
  },
  reportActionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderRadius: 9,
    paddingVertical: 8,
  },
  reportActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  reportDeleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#FEF2F2',
  },
  reportModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  reportViewerModal: {
    width: '100%',
    maxWidth: 900,
    height: isWeb ? '90%' : '82%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
  },
  reportModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  reportModalTitle: {
    flex: 1,
    marginRight: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  fullReportImage: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0F172A',
  },
  qrModal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  qrCloseButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 2,
    padding: 5,
  },
  qrTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  qrReportName: {
    marginTop: 5,
    marginBottom: 18,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  qrInstruction: {
    marginTop: 16,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  openShareLinkButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  openShareLinkText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  placeholderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    width: '100%',
    maxWidth: 500,
  },
  placeholderTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 24,
  },
  placeholderIcon: {
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
  },
  placeholderHint: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '400',
    marginTop: 4,
  },
});
