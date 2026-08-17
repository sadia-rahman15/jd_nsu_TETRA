
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Logo } from "@/components/Logo";
import {
  AmarCureUser,
  clearAuthSession,
  getAccessToken,
  getStoredUser,
} from "@/services/auth-storage";
import { registerPushToken } from "@/services/push-notifications";
import AiInsightsScreen from "./ai-insights";
import AvailableHospitalsScreen from "./hospitals";
import BloodSearchScreen from "./blood-search";
import FamilyScreen from "./family";
import ProfileScreen from "./profile";
import RemindersScreen, {
  DoctorAppointmentReminder,
  MedicationReminder,
} from "./reminders";
import ReportsScreen from "./reports";

const { width } = Dimensions.get("window");

const isWeb = Platform.OS === "web";
const isTablet =
  width >= 768 && width < 1024;

interface MenuItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    icon: "grid-outline",
    label: "Dashboard",
  },
  {
    id: "blood-search",
    icon: "search-circle-outline",
    label: "Search Blood",
  },
  {
    id: "reports",
    icon: "document-text-outline",
    label: "My Reports",
  },
  {
    id: "profile",
    icon: "person-outline",
    label: "Profile",
  },
  {
    id: "family",
    icon: "people-outline",
    label: "Family",
  },
  {
    id: "reminders",
    icon: "notifications-outline",
    label: "Reminders",
  },
  {
    id: "ai-insights",
    icon: "bulb-outline",
    label: "AI Insights",
  },
  {
    id: "available-hospitals",
    icon: "business-outline",
    label: "Available Hospitals",
  },
];

export default function Dashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState("dashboard");

  const [sidebarOpen, setSidebarOpen] =
    useState(isWeb);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [currentUser, setCurrentUser] =
    useState<AmarCureUser | null>(null);

  const [authReady, setAuthReady] =
    useState(false);

  const [medReminders, setMedReminders] =
    useState<MedicationReminder[]>([]);

  const [docAppointments, setDocAppointments] =
    useState<DoctorAppointmentReminder[]>([]);

  const [bmi, setBmi] =
    useState(25.4);

  const fadeAnimation =
    useRef(
      new Animated.Value(0)
    ).current;

  const slideAnimation =
    useRef(
      new Animated.Value(30)
    ).current;

  useEffect(() => {
    let componentActive = true;

    const restoreAuthentication =
      async () => {
        try {
          const [
            accessToken,
            storedUser,
          ] = await Promise.all([
            getAccessToken(),
            getStoredUser(),
          ]);

          if (!componentActive) {
            return;
          }

          if (
            !accessToken ||
            !storedUser
          ) {
            await clearAuthSession();

            router.replace(
              "/login"
            );

            return;
          }

          setCurrentUser(
            storedUser
          );

          setAuthReady(true);

          registerPushToken();
        } catch (error) {
          console.error(
            "Could not restore login session:",
            error
          );

          await clearAuthSession();

          if (componentActive) {
            router.replace(
              "/login"
            );
          }
        }
      };

    restoreAuthentication();

    return () => {
      componentActive = false;
    };
  }, [router]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    fadeAnimation.setValue(0);
    slideAnimation.setValue(30);

    Animated.parallel([
      Animated.timing(
        fadeAnimation,
        {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }
      ),
      Animated.timing(
        slideAnimation,
        {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }
      ),
    ]).start();
  }, [
    activeTab,
    authReady,
    fadeAnimation,
    slideAnimation,
  ]);

  const handleLogout = async () => {
    try {
      await clearAuthSession();
    } catch (error) {
      console.error(
        "Could not clear login session:",
        error
      );
    }

    router.replace("/login");
  };

  const navigateToTab = (
    tabId: string
  ) => {
    setActiveTab(tabId);

    if (!isWeb) {
      setSidebarOpen(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardHome
            user={currentUser}
            medReminders={
              medReminders
            }
            docAppointments={
              docAppointments
            }
            bmi={bmi}
            onNavigate={
              navigateToTab
            }
          />
        );

      case "blood-search":
        return <BloodSearchScreen />;

      case "reports":
        return (
          <ReportsScreen />
        );

      case "profile":
        return <ProfileScreen setBmi={setBmi} />;

      case "family":
        return <FamilyScreen />;

      case "reminders":
        return (
          <RemindersScreen
            onBack={() =>
              setActiveTab("dashboard")
            }
            medReminders={medReminders}
            setMedReminders={setMedReminders}
            docAppointments={docAppointments}
            setDocAppointments={setDocAppointments}
          />
        );

      case "ai-insights":
        return <AiInsightsScreen />;

      case "available-hospitals":
        return (
          <AvailableHospitalsScreen />
        );

      default:
        return (
          <DashboardHome
            user={currentUser}
            medReminders={
              medReminders
            }
            docAppointments={
              docAppointments
            }
            bmi={bmi}
            onNavigate={
              navigateToTab
            }
          />
        );
    }
  };

  if (!authReady) {
    return (
      <SafeAreaView
        style={
          styles.loadingPage
        }
      >
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Checking your
          session...
        </Text>
      </SafeAreaView>
    );
  }

  const filteredMenuItems =
    menuItems.filter(
      (item) =>
        item.label
          .toLowerCase()
          .includes(
            searchQuery
              .trim()
              .toLowerCase()
          )
    );

  const fullName =
    currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : "AmarCure User";

  const avatarLetter =
    currentUser?.firstName
      ?.charAt(0)
      .toUpperCase() || "U";

  const SidebarContent = () => (
    <BlurView
      intensity={
        isWeb ? 0 : 80
      }
      tint="dark"
      style={styles.sidebarBlur}
    >
      <View
        style={
          styles.logoSection
        }
      >
        <Logo
          size="small"
          showText
        />

        <Text
          style={styles.tagline}
        >
          Transforming Healthcare
        </Text>
      </View>

      <View
        style={
          styles.sidebarSearch
        }
      >
        <Ionicons
          name="search-outline"
          size={16}
          color="#64748b"
        />

        <TextInput
          style={
            styles.sidebarSearchInput
          }
          placeholder="Search menu..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={
            setSearchQuery
          }
        />
      </View>

      <ScrollView
        style={styles.menu}
        showsVerticalScrollIndicator={
          false
        }
      >
        {filteredMenuItems.map(
          (item) => {
            const selected =
              activeTab ===
              item.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  selected
                    ? styles.menuItemActive
                    : null,
                ]}
                onPress={() =>
                  navigateToTab(
                    item.id
                  )
                }
              >
                <View
                  style={
                    styles.menuIconWrapper
                  }
                >
                  <Ionicons
                    name={
                      item.icon
                    }
                    size={20}
                    color={
                      selected
                        ? "#ffffff"
                        : "#94a3b8"
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.menuLabel,
                    selected
                      ? styles.menuLabelActive
                      : null,
                  ]}
                >
                  {item.label}
                </Text>

                {selected ? (
                  <View
                    style={
                      styles.menuActiveDot
                    }
                  />
                ) : null}
              </TouchableOpacity>
            );
          }
        )}
      </ScrollView>

      <View
        style={
          styles.bottomSection
        }
      >
        <View
          style={
            styles.userProfile
          }
        >
          <View
            style={
              styles.userAvatar
            }
          >
            <Text
              style={
                styles.userAvatarText
              }
            >
              {avatarLetter}
            </Text>
          </View>

          <View
            style={
              styles.userInfo
            }
          >
            <Text
              style={
                styles.userName
              }
              numberOfLines={1}
            >
              {fullName}
            </Text>

            <Text
              style={
                styles.userRole
              }
              numberOfLines={1}
            >
              {currentUser?.email ||
                "Patient"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color="#ef4444"
          />

          <Text
            style={
              styles.logoutText
            }
          >
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  );

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0b1a3a"
      />

      <View
        style={styles.layout}
      >
        {isWeb ? (
          <View
            style={styles.sidebar}
          >
            <SidebarContent />
          </View>
        ) : (
          <>
            {sidebarOpen ? (
              <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={() =>
                  setSidebarOpen(
                    false
                  )
                }
              />
            ) : null}

            <Animated.View
              style={[
                styles.sidebarMobile,
                sidebarOpen
                  ? styles.sidebarMobileOpen
                  : null,
              ]}
            >
              <SidebarContent />
            </Animated.View>
          </>
        )}

        <View
          style={
            styles.mainContent
          }
        >
          {!isWeb ? (
            <View
              style={
                styles.mobileHeader
              }
            >
              <TouchableOpacity
                onPress={() =>
                  setSidebarOpen(
                    true
                  )
                }
                style={
                  styles.menuToggle
                }
              >
                <Ionicons
                  name="menu-outline"
                  size={28}
                  color="#ffffff"
                />
              </TouchableOpacity>

              <Text
                style={
                  styles.mobileHeaderTitle
                }
              >
                AmarCure
              </Text>

              <TouchableOpacity
                style={
                  styles.headerNotification
                }
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="#ffffff"
                />

                <View
                  style={
                    styles.notificationDot
                  }
                />
              </TouchableOpacity>
            </View>
          ) : null}

          <Animated.View
            style={[
              styles.contentAnimation,
              {
                opacity:
                  fadeAnimation,
                transform: [
                  {
                    translateY:
                      slideAnimation,
                  },
                ],
              },
            ]}
          >
            <ScrollView
              style={
                styles.content
              }
              contentContainerStyle={
                styles.contentContainer
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {renderContent()}
            </ScrollView>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function DashboardHome({
  user,
  medReminders,
  docAppointments,
  bmi,
  onNavigate,
}: {
  user: AmarCureUser | null;
  medReminders: MedicationReminder[];
  docAppointments: DoctorAppointmentReminder[];
  bmi: number;
  onNavigate: (
    tab: string
  ) => void;
}) {
  const pendingReminders =
    medReminders.filter(
      (reminder) =>
        !reminder.takenToday
    ).length;

  const pendingAppointments =
    docAppointments.filter(
      (appointment) =>
        !appointment.completed
    ).length;

  const greeting = () => {
    const hour =
      new Date().getHours();

    if (hour < 12) {
      return "🌅 Good Morning";
    }

    if (hour < 17) {
      return "☀️ Good Afternoon";
    }

    return "🌙 Good Evening";
  };

  const modules = [
    {
      id: "reminders",
      icon:
        "notifications-outline" as const,
      title: "Reminders",
      description: `${pendingReminders} pending • ${pendingAppointments} appointments`,
      colors: [
        "#0891B2",
        "#06B6D4",
      ],
      background:
        "#ECFEFF",
    },
    {
      id: "blood-search",
      icon:
        "heart-outline" as const,
      title: "Blood Search",
      description:
        "Find donors and banks",
      colors: [
        "#DC2626",
        "#EF4444",
      ],
      background:
        "#FEF2F2",
    },
    {
      id: "reports",
      icon:
        "document-text-outline" as const,
      title: "My Reports",
      description:
        "Secure cloud records",
      colors: [
        "#2563EB",
        "#3B82F6",
      ],
      background:
        "#EFF6FF",
    },
    {
      id: "profile",
      icon:
        "person-outline" as const,
      title: "Health Profile",
      description: `BMI ${bmi.toFixed(
        1
      )}`,
      colors: [
        "#7C3AED",
        "#8B5CF6",
      ],
      background:
        "#F5F3FF",
    },
    {
      id: "ai-insights",
      icon:
        "bulb-outline" as const,
      title: "AI Insights",
      description:
        "Smart health analysis",
      colors: [
        "#9333EA",
        "#A855F7",
      ],
      background:
        "#FAF5FF",
    },
    {
      id:
        "available-hospitals",
      icon:
        "business-outline" as const,
      title:
        "Available Hospitals",
      description:
        "Find nearby care",
      colors: [
        "#059669",
        "#10B981",
      ],
      background:
        "#ECFDF5",
    },
  ];

  return (
    <View
      style={
        styles.screenContainer
      }
    >
      <View
        style={
          styles.greetingContainer
        }
      >
        <View>
          <Text
            style={
              styles.greetingText
            }
          >
            {greeting()},{" "}
            {user?.firstName ||
              "User"}
            !
          </Text>

          <Text
            style={
              styles.greetingSub
            }
          >
            Welcome to AmarCure
            Healthcare
          </Text>
        </View>

        <LinearGradient
          colors={[
            "#2563EB",
            "#3B82F6",
          ]}
          style={
            styles.greetingBadge
          }
        >
          <Text
            style={
              styles.greetingBadgeText
            }
          >
            AI Healthcare
          </Text>
        </LinearGradient>
      </View>

      <NotificationBox
        medReminders={medReminders}
        docAppointments={
          docAppointments
        }
        bmi={bmi}
      />

      <View
        style={styles.section}
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          🏥 Health Management
        </Text>

        <Text
          style={
            styles.sectionSubtitle
          }
        >
          Access your health tools
          and medical information
        </Text>

        <View
          style={
            styles.modulesGrid
          }
        >
          {modules.map(
            (module) => (
              <TouchableOpacity
                key={module.id}
                style={
                  styles.moduleCard
                }
                onPress={() =>
                  onNavigate(
                    module.id
                  )
                }
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[
                    module.background,
                    "#ffffff",
                  ]}
                  style={
                    styles.moduleGradient
                  }
                >
                  <LinearGradient
                    colors={module.colors as [string, string]}
                    style={
                      styles.moduleIcon
                    }
                  >
                    <Ionicons
                      name={
                        module.icon
                      }
                      size={22}
                      color="#ffffff"
                    />
                  </LinearGradient>

                  <Text
                    style={
                      styles.moduleTitle
                    }
                  >
                    {module.title}
                  </Text>

                  <Text
                    style={
                      styles.moduleDescription
                    }
                  >
                    {
                      module.description
                    }
                  </Text>

                  <Ionicons
                    name="arrow-forward-circle"
                    size={19}
                    color={
                      module.colors[0]
                    }
                    style={
                      styles.moduleArrow
                    }
                  />
                </LinearGradient>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    </View>
  );
}

function NotificationBox({
  medReminders,
  docAppointments,
  bmi,
}: {
  medReminders: MedicationReminder[];
  docAppointments: DoctorAppointmentReminder[];
  bmi: number;
}) {
  const pendingReminders =
    medReminders.filter(
      (reminder) =>
        !reminder.takenToday
    );

  const todayDateString =
    new Date().toISOString().slice(0, 10);

  const todaysAppointments =
    docAppointments.filter(
      (appointment) =>
        !appointment.completed &&
        appointment.appointmentDate ===
          todayDateString
    );

  if (
    pendingReminders.length ===
      0 &&
    todaysAppointments.length ===
      0 &&
    bmi <= 25
  ) {
    return (
      <View
        style={
          styles.noNotifications
        }
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={23}
          color="#10B981"
        />

        <Text
          style={
            styles.noNotificationsText
          }
        >
          All caught up! No new
          health alerts.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={
        styles.notificationBox
      }
    >
      <Text
        style={
          styles.notificationHeading
        }
      >
        📬 Notifications
      </Text>

      {pendingReminders.length >
      0 ? (
        <NotificationItem
          icon="notifications-outline"
          title={`${pendingReminders.length} medication reminder${
            pendingReminders.length >
            1
              ? "s"
              : ""
          } pending`}
          description={pendingReminders
            .map(
              (reminder) =>
                reminder.medicineName
            )
            .join(" • ")}
          color="#D97706"
          background="#FFFBEB"
        />
      ) : null}

      {todaysAppointments.length >
      0 ? (
        <NotificationItem
          icon="calendar-outline"
          title={`${todaysAppointments.length} appointment${
            todaysAppointments.length > 1 ? "s" : ""
          } scheduled today`}
          description={todaysAppointments
            .map(
              (appointment) =>
                `${appointment.doctorName} • ${appointment.appointmentTime}`
            )
            .join(" | ")}
          color="#2563EB"
          background="#EFF6FF"
        />
      ) : null}

      {bmi > 25 ? (
        <NotificationItem
          icon="fitness-outline"
          title="BMI slightly above normal"
          description={`Current BMI: ${bmi.toFixed(
            1
          )}. Standard healthy range: 18.5–24.9.`}
          color="#DC2626"
          background="#FEF2F2"
        />
      ) : null}
    </View>
  );
}

function NotificationItem({
  icon,
  title,
  description,
  color,
  background,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  background: string;
}) {
  return (
    <View
      style={[
        styles.notificationItem,
        {
          backgroundColor:
            background,
        },
      ]}
    >
      <View
        style={[
          styles.notificationIcon,
          {
            backgroundColor:
              `${color}20`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={color}
        />
      </View>

      <View
        style={
          styles.notificationContent
        }
      >
        <Text
          style={
            styles.notificationTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.notificationDescription
          }
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

function PlaceholderScreen({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View
      style={
        styles.placeholderContainer
      }
    >
      <View
        style={
          styles.placeholderCard
        }
      >
        <Text
          style={
            styles.placeholderTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.placeholderSubtitle
          }
        >
          {subtitle}
        </Text>

        <Ionicons
          name="construct-outline"
          size={50}
          color="#CBD5E1"
        />

        <Text
          style={
            styles.placeholderText
          }
        >
          This module is under
          development.
        </Text>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#0b1a3a",
    },
    loadingPage: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      backgroundColor:
        "#F8FAFC",
    },
    loadingText: {
      marginTop: 12,
      color: "#64748B",
      fontWeight: "600",
    },
    layout: {
      flex: 1,
      flexDirection: "row",
    },
    sidebar: {
      width: 260,
      height: "100%",
      backgroundColor:
        "#0b1a3a",
      zIndex: 10,
    },
    sidebarMobile: {
      position: "absolute",
      left: -285,
      top: 0,
      width: 280,
      height: "100%",
      zIndex: 20,
      backgroundColor:
        "#0b1a3a",
    },
    sidebarMobileOpen: {
      left: 0,
    },
    sidebarBlur: {
      flex: 1,
      paddingVertical: 20,
      paddingHorizontal: 16,
      backgroundColor:
        "#0b1a3a",
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor:
        "rgba(0,0,0,0.5)",
      zIndex: 15,
    },
    logoSection: {
      alignItems: "center",
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        "rgba(255,255,255,0.06)",
      marginBottom: 12,
    },
    tagline: {
      fontSize: 10,
      color: "#64748b",
      fontWeight: "500",
      marginTop: 3,
      textTransform:
        "uppercase",
      letterSpacing: 1.1,
    },
    sidebarSearch: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "rgba(255,255,255,0.06)",
      borderRadius: 10,
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    sidebarSearchInput: {
      flex: 1,
      height: 38,
      paddingHorizontal: 8,
      fontSize: 13,
      color: "#ffffff",
    },
    menu: {
      flex: 1,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 3,
      gap: 12,
    },
    menuItemActive: {
      backgroundColor:
        "rgba(255,255,255,0.09)",
    },
    menuIconWrapper: {
      width: 24,
      alignItems: "center",
    },
    menuLabel: {
      flex: 1,
      fontSize: 14,
      color: "#94a3b8",
      fontWeight: "500",
    },
    menuLabelActive: {
      color: "#ffffff",
      fontWeight: "700",
    },
    menuActiveDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor:
        "#3B82F6",
    },
    bottomSection: {
      borderTopWidth: 1,
      borderTopColor:
        "rgba(255,255,255,0.06)",
      paddingTop: 12,
      gap: 10,
    },
    userProfile: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 7,
    },
    userAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(37,99,235,0.2)",
      borderWidth: 2,
      borderColor:
        "rgba(37,99,235,0.35)",
    },
    userAvatarText: {
      color: "#60A5FA",
      fontSize: 15,
      fontWeight: "800",
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "700",
    },
    userRole: {
      color: "#94a3b8",
      fontSize: 10,
      marginTop: 2,
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor:
        "rgba(239,68,68,0.08)",
    },
    logoutText: {
      color: "#ef4444",
      fontSize: 13,
      fontWeight: "700",
    },
    mainContent: {
      flex: 1,
      backgroundColor:
        "#F8FAFC",
    },
    mobileHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor:
        "#0b1a3a",
    },
    menuToggle: {
      padding: 4,
    },
    mobileHeaderTitle: {
      color: "#ffffff",
      fontSize: 18,
      fontWeight: "800",
    },
    headerNotification: {
      position: "relative",
      padding: 4,
    },
    notificationDot: {
      position: "absolute",
      top: 2,
      right: 2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor:
        "#EF4444",
    },
    contentAnimation: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 30,
    },
    screenContainer: {
      paddingBottom: 8,
    },
    greetingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 14,
      gap: 12,
    },
    greetingText: {
      color: "#0F172A",
      fontSize: 21,
      fontWeight: "900",
    },
    greetingSub: {
      color: "#64748B",
      fontSize: 12,
      marginTop: 3,
    },
    greetingBadge: {
      borderRadius: 9,
      paddingHorizontal: 11,
      paddingVertical: 6,
    },
    greetingBadgeText: {
      color: "#ffffff",
      fontSize: 9,
      fontWeight: "800",
      textTransform:
        "uppercase",
    },
    notificationBox: {
      backgroundColor:
        "#ffffff",
      borderRadius: 15,
      padding: 14,
      borderWidth: 1,
      borderColor:
        "#E2E8F0",
      marginBottom: 17,
    },
    notificationHeading: {
      color: "#0F172A",
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 10,
    },
    notificationItem: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 11,
      padding: 11,
      marginBottom: 7,
    },
    notificationIcon: {
      width: 36,
      height: 36,
      borderRadius: 9,
      alignItems: "center",
      justifyContent:
        "center",
      marginRight: 10,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      color: "#0F172A",
      fontSize: 13,
      fontWeight: "700",
    },
    notificationDescription: {
      color: "#64748B",
      fontSize: 11,
      marginTop: 2,
    },
    noNotifications: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 8,
      borderRadius: 14,
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#E2E8F0",
      padding: 15,
      marginBottom: 17,
    },
    noNotificationsText: {
      color: "#64748B",
      fontSize: 13,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      color: "#0F172A",
      fontSize: 16,
      fontWeight: "800",
    },
    sectionSubtitle: {
      color: "#64748B",
      fontSize: 12,
      marginTop: 2,
      marginBottom: 11,
    },
    modulesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    moduleCard: {
      width: isWeb
        ? "31.8%"
        : isTablet
          ? "48%"
          : "100%",
      minWidth: isWeb
        ? 215
        : undefined,
      borderRadius: 14,
      overflow: "hidden",
    },
    moduleGradient: {
      minHeight: 125,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "rgba(226,232,240,0.8)",
      padding: 13,
    },
    moduleIcon: {
      width: 39,
      height: 39,
      borderRadius: 10,
      alignItems: "center",
      justifyContent:
        "center",
      marginBottom: 9,
    },
    moduleTitle: {
      color: "#0F172A",
      fontSize: 14,
      fontWeight: "800",
    },
    moduleDescription: {
      color: "#64748B",
      fontSize: 11,
      marginTop: 2,
    },
    moduleArrow: {
      position: "absolute",
      right: 11,
      bottom: 10,
    },
    simpleScreen: {
      paddingBottom: 20,
    },
    simpleTitle: {
      color: "#0F172A",
      fontSize: 25,
      fontWeight: "900",
      marginBottom: 17,
    },
    formCard: {
      maxWidth: 600,
      backgroundColor:
        "#ffffff",
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        "#E2E8F0",
      padding: 20,
    },
    formLabel: {
      color: "#334155",
      fontSize: 13,
      fontWeight: "800",
      marginBottom: 7,
      marginTop: 10,
    },
    readonlyValue: {
      color: "#0F172A",
      backgroundColor:
        "#F8FAFC",
      borderWidth: 1,
      borderColor:
        "#E2E8F0",
      borderRadius: 10,
      padding: 13,
    },
    formInput: {
      height: 48,
      borderWidth: 1,
      borderColor:
        "#CBD5E1",
      backgroundColor:
        "#F8FAFC",
      borderRadius: 10,
      paddingHorizontal: 14,
    },
    primaryButton: {
      height: 48,
      backgroundColor:
        "#2563EB",
      borderRadius: 10,
      alignItems: "center",
      justifyContent:
        "center",
      marginTop: 18,
    },
    primaryButtonText: {
      color: "#ffffff",
      fontWeight: "800",
    },
    listCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#ffffff",
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        "#E2E8F0",
      padding: 15,
      marginBottom: 10,
    },
    listTitle: {
      color: "#0F172A",
      fontSize: 15,
      fontWeight: "800",
    },
    listDescription: {
      color: "#64748B",
      fontSize: 12,
      marginTop: 3,
      textTransform:
        "capitalize",
    },
    appointmentInfo: {
      flex: 1,
    },
    statusButton: {
      marginLeft: "auto",
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 9,
      backgroundColor:
        "#FEF3C7",
    },
    statusButtonDone: {
      backgroundColor:
        "#D1FAE5",
    },
    statusButtonText: {
      color: "#92400E",
      fontWeight: "800",
      fontSize: 12,
    },
    statusButtonTextDone: {
      color: "#047857",
    },
    deleteSmallButton: {
      marginLeft: 12,
      padding: 9,
      borderRadius: 9,
      backgroundColor:
        "#FEF2F2",
    },
    emptyCard: {
      minHeight: 180,
      alignItems: "center",
      justifyContent:
        "center",
      backgroundColor:
        "#ffffff",
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        "#E2E8F0",
    },
    emptyCardText: {
      color: "#64748B",
    },
    placeholderContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      paddingVertical: 40,
    },
    placeholderCard: {
      width: "100%",
      maxWidth: 520,
      minHeight: 300,
      backgroundColor:
        "#ffffff",
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        "#E2E8F0",
      alignItems: "center",
      justifyContent:
        "center",
      padding: 30,
    },
    placeholderTitle: {
      color: "#0F172A",
      fontSize: 27,
      fontWeight: "900",
      textAlign: "center",
    },
    placeholderSubtitle: {
      color: "#64748B",
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
      marginTop: 7,
      marginBottom: 24,
    },
    placeholderText: {
      color: "#94A3B8",
      fontSize: 14,
      marginTop: 14,
    },
  });
