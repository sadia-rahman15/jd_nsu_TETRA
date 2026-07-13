import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const isWeb = Platform.OS === "web";

const CustomLogo = () => (
  <View
    style={{
      width: 32,
      height: 32,
      marginRight: 8,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <View
      style={{
        position: "absolute",
        width: 30,
        height: 12,
        backgroundColor: "#3cd09d",
        borderRadius: 6,
        transform: [{ rotate: "45deg" }],
        opacity: 0.9,
      }}
    />
    <View
      style={{
        position: "absolute",
        width: 30,
        height: 12,
        backgroundColor: "#0052cc",
        borderRadius: 6,
        transform: [{ rotate: "-45deg" }],
        opacity: 0.9,
      }}
    />
  </View>
);

const FooterLogo = () => (
  <View
    style={{
      width: 40,
      height: 40,
      marginBottom: 12,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <View
      style={{
        position: "absolute",
        width: 38,
        height: 14,
        backgroundColor: "#3cd09d",
        borderRadius: 6,
        transform: [{ rotate: "45deg" }],
      }}
    />
    <View
      style={{
        position: "absolute",
        width: 38,
        height: 14,
        backgroundColor: "#ffffff",
        borderRadius: 6,
        transform: [{ rotate: "-45deg" }],
        opacity: 0.9,
      }}
    />
  </View>
);

export default function App() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const exploreY = useRef<number>(0);
  const featuresY = useRef<number>(0);
  const aboutY = useRef<number>(0);

  const scrollToSection = (layoutY: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: layoutY - 20, animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- STICKY NAVBAR PANEL --- */}
      <View style={styles.navbar}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <CustomLogo />
          <Text style={styles.logoText}>AmarCure</Text>
        </View>

        {isWeb ? (
          <View style={styles.navLinks}>
            <TouchableOpacity onPress={() => scrollToSection(exploreY.current)}>
              <Text style={[styles.navLink, styles.activeNavLink]}>
                Explore
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => scrollToSection(featuresY.current)}
            >
              <Text style={styles.navLink}>Features</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => scrollToSection(aboutY.current)}>
              <Text style={styles.navLink}>About</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <TouchableOpacity
              style={styles.mobileLoginBtn}
              onPress={() => router.push("/(tabs)/login")}
            >
              <Text style={styles.mobileLoginBtnText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mobileLoginBtn, { backgroundColor: "#10b981" }]}
              onPress={() => router.push("/(tabs)/register")}
            >
              <Text style={styles.mobileLoginBtnText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}

        {isWeb && (
          <View style={{ flexDirection: "row", gap: 15, alignItems: "center" }}>
            <TouchableOpacity onPress={() => router.push("/(tabs)/login")}>
              <Text
                style={{ color: "#475569", fontWeight: "700", fontSize: 14 }}
              >
                Log In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: "#0052cc",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
              onPress={() => router.push("/(tabs)/register")}
            >
              <Text
                style={{ color: "#ffffff", fontWeight: "700", fontSize: 14 }}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* --- EXPLORE SECTION --- */}
        <View
          onLayout={(e) => {
            exploreY.current = e.nativeEvent.layout.y;
          }}
          style={styles.exploreSection}
        >
          <View style={styles.greenBadge}>
            <Text style={styles.greenBadgeText}>
              ✨ Transforming Healthcare in Bangladesh
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            Your Centralized,{"\n"}Intelligent Health{"\n"}
            <Text style={{ color: "#10b981" }}>Ecosystem</Text>
          </Text>

          <Text style={styles.heroSubtitle}>
            Digitize prescriptions, automatically translate complex laboratory
            reports, and securely track your family's vital wellness timeline
            using AI.
          </Text>

          <TouchableOpacity
            style={styles.floatingButton}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/register")}
          >
            <Text style={styles.buttonText}>Create Free Account →</Text>
          </TouchableOpacity>

          <Text style={styles.checkmarkText}>
            ✔ Secure. Private. AI-Powered.
          </Text>
        </View>

        {/* --- QUOTE BANNER --- */}
        <View style={styles.quoteBanner}>
          <Text style={styles.quoteText}>
            "Good health is not something we can buy. However, it can be an
            extremely valuable savings account."
          </Text>
          <Text style={styles.quoteAuthor}>— Anne Wilson Schaef</Text>
        </View>

        {/* --- FEATURES GRID SECTION --- */}
        <View
          onLayout={(e) => {
            featuresY.current = e.nativeEvent.layout.y;
          }}
          style={styles.featuresSection}
        >
          <View style={styles.card}>
            <Text
              style={[
                styles.cardIcon,
                { backgroundColor: "#f0f5ff", color: "#0052cc" },
              ]}
            >
              📊
            </Text>
            <Text style={styles.cardTitle}>AI Report Parsing</Text>
            <Text style={styles.cardDescription}>
              Upload standard laboratory reports to instantly convert complex
              parameters into transparent, patient-friendly diagnostic
              summaries.
            </Text>
          </View>

          <View style={styles.card}>
            <Text
              style={[
                styles.cardIcon,
                { backgroundColor: "#fef2f2", color: "#dc2626" },
              ]}
            >
              ⚠
            </Text>
            <Text style={styles.cardTitle}>Emergency Health Profile</Text>
            <Text style={styles.cardDescription}>
              One-click instantaneous display highlighting critical blood
              groups, active medications, allergies, and emergency response
              links.
            </Text>
          </View>

          <View style={styles.card}>
            <Text
              style={[
                styles.cardIcon,
                { backgroundColor: "#e6f4ea", color: "#137333" },
              ]}
            >
              📁
            </Text>
            <Text style={styles.cardTitle}>Centralized Records</Text>
            <Text style={styles.cardDescription}>
              Eliminate paper decay. Safely catalog prescriptions, diagnostics,
              and vaccination details in one unified chronological space.
            </Text>
          </View>

          <View style={styles.card}>
            <Text
              style={[
                styles.cardIcon,
                { backgroundColor: "#fffbeb", color: "#b45309" },
              ]}
            >
              👥
            </Text>
            <Text style={styles.cardTitle}>Multi-User Accounts</Text>
            <Text style={styles.cardDescription}>
              Seamlessly monitor medication adherence pipelines and pending
              appointments for both children and elderly family members.
            </Text>
          </View>
        </View>

        {/* --- ABOUT / FOOTER SECTION --- */}
        <View
          onLayout={(e) => {
            aboutY.current = e.nativeEvent.layout.y;
          }}
          style={styles.footerSection}
        >
          <View style={styles.footerContent}>
            <View style={styles.footerCol}>
              <Text style={styles.footerHeader}>AmarCure Tele Online</Text>
              <Text style={styles.footerText}>info@amarcurebd.com</Text>
              <Text style={styles.footerPhone}>📞 10678</Text>
              <Text style={styles.footerText}>Privacy Policy</Text>
            </View>

            <View style={[styles.footerCol, { alignItems: "center" }]}>
              <FooterLogo />
              <Text style={styles.footerLogoTitle}>AmarCure</Text>
              <Text style={styles.footerLogoSub}>Transforming Healthcare</Text>
              <TouchableOpacity style={styles.queryButton}>
                <Text style={styles.queryButtonText}>Send Query</Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.footerCol,
                { alignItems: isWeb ? "flex-end" : "flex-start" },
              ]}
            >
              <Text style={styles.footerHeader}>Dhaka</Text>
              <Text
                style={[
                  styles.footerText,
                  { textAlign: isWeb ? "right" : "left" },
                ]}
              >
                AmarCure HQ, Bashundhara R/A,{"\n"}Dhaka 1229, Bangladesh.
              </Text>
              <Text
                style={[
                  styles.footerText,
                  { fontSize: 11, color: "#475569", marginTop: 15 },
                ]}
              >
                © Copyright 2026 amarcurebd. All rights reserved.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContainer: {
    alignItems: "center",
  },
  navbar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: "5%",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#ffffff",
    zIndex: 1000,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  navLinks: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  navLink: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeNavLink: {
    color: "#0052cc",
    backgroundColor: "#f0f5ff",
    borderRadius: 20,
    fontWeight: "700",
  },
  mobileLoginBtn: {
    backgroundColor: "#0052cc",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mobileLoginBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  exploreSection: {
    width: "100%",
    maxWidth: 750,
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 30,
    paddingHorizontal: "5%",
  },
  greenBadge: {
    backgroundColor: "#e6f4ea",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ceead6",
    marginBottom: 20,
  },
  greenBadgeText: {
    color: "#137333",
    fontSize: 11,
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: isWeb ? 54 : 28,
    fontWeight: "900",
    textAlign: "center",
    color: "#0f172a",
    lineHeight: isWeb ? 62 : 36,
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
    marginBottom: 28,
  },
  floatingButton: {
    backgroundColor: "#0052cc",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  checkmarkText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  quoteBanner: {
    width: "90%",
    maxWidth: 1100,
    backgroundColor: "#f8fafc",
    borderLeftWidth: 4,
    borderLeftColor: "#3cd09d",
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
  },
  quoteText: {
    fontSize: 14,
    fontWeight: "600",
    fontStyle: "italic",
    color: "#1e293b",
    marginBottom: 4,
  },
  quoteAuthor: {
    fontSize: 12,
    color: "#137333",
    fontWeight: "700",
  },
  featuresSection: {
    width: "90%",
    maxWidth: 1100,
    flexDirection: isWeb ? "row" : "column",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
    marginBottom: 48,
  },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 16,
    padding: 20,
    width: isWeb ? "23%" : "100%",
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    textAlign: "center",
    lineHeight: 40,
    fontSize: 18,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    fontWeight: "500",
  },
  footerSection: {
    width: "100%",
    backgroundColor: "#0b1329",
    paddingVertical: 40,
    paddingHorizontal: "5%",
  },
  footerContent: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    flexDirection: isWeb ? "row" : "column",
    justifyContent: "space-between",
    gap: 30,
  },
  footerCol: {
    width: isWeb ? "auto" : "100%",
  },
  footerHeader: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  footerText: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  footerPhone: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  footerLogoTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  footerLogoSub: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  queryButton: {
    backgroundColor: "#38bdf8",
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  queryButtonText: {
    color: "#0b1329",
    fontWeight: "700",
    fontSize: 13,
  },
});
