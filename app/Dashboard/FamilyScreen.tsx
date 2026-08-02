import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { authorizedFetch, clearAuthSession } from "../auth-storage";
import AddFamilyMemberModal from "./family/AddFamilyMemberModal";
import EmergencyCardModal from "./family/EmergencyCardModal";
import ProfileDetailModal from "./family/ProfileDetailModal";

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

const formatDate = (dateValue: string) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString();
};

interface FamilyMember {
  id: number;
  memberUserId: number;
  firstName: string;
  lastName: string;
  email: string;
  relationshipType: string;
  accessLevel: "view_only" | "manage" | "emergency";
  status: "pending" | "active" | "revoked" | "declined";
  invitedAt: string;
  respondedAt: string | null;
}

interface Invitation {
  id: number;
  ownerUserId: number;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  relationshipType: string;
  accessLevel: "view_only" | "manage" | "emergency";
  invitedAt: string;
}

interface AccessibleProfile {
  relationshipId: number;
  ownerUserId: number;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  relationshipType: string;
  accessLevel: "view_only" | "manage" | "emergency";
}

interface ActivityItem {
  id: number;
  eventType: string;
  description: string;
  createdAt: string;
  ownerUserId: number;
  actorUserId: number | null;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  parent: "Parent",
  child: "Child",
  spouse: "Spouse",
  sibling: "Sibling",
  guardian: "Guardian",
  other: "Other Relative",
};

const ACCESS_LABELS: Record<string, string> = {
  view_only: "View Only",
  manage: "Manage",
  emergency: "Emergency",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  revoked: "Revoked",
  declined: "Declined",
};

const accessBadgeStyle = (level: string) => {
  if (level === "manage") return { backgroundColor: "#D1FAE5", color: "#065F46" };
  if (level === "emergency") return { backgroundColor: "#FED7AA", color: "#9A3412" };
  return { backgroundColor: "#DBEAFE", color: "#1E40AF" };
};

const statusBadgeStyle = (status: string) => {
  if (status === "active") return { backgroundColor: "#D1FAE5", color: "#065F46" };
  if (status === "revoked") return { backgroundColor: "#FEE2E2", color: "#991B1B" };
  if (status === "declined") return { backgroundColor: "#F3F4F6", color: "#4B5563" };
  return { backgroundColor: "#FEF3C7", color: "#92400E" };
};

export default function FamilyScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [profiles, setProfiles] = useState<AccessibleProfile[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [emergencyLoadingId, setEmergencyLoadingId] = useState<number | null>(null);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [emergencyCardVisible, setEmergencyCardVisible] = useState(false);
  const [activeProfileRelationshipId, setActiveProfileRelationshipId] =
    useState<number | null>(null);

  const handleUnauthorized = useCallback(async () => {
    await clearAuthSession();
    showMessage("Session Expired", "Your login session has expired. Please log in again.");
    router.replace("/login");
  }, [router]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);

      const [membersRes, invitationsRes, profilesRes, activityRes] = await Promise.all([
        authorizedFetch(`${API_BASE_URL}/api/family/members`),
        authorizedFetch(`${API_BASE_URL}/api/family/invitations`),
        authorizedFetch(`${API_BASE_URL}/api/family/accessible-profiles`),
        authorizedFetch(`${API_BASE_URL}/api/family/activity`),
      ]);

      if (
        membersRes.status === 401 ||
        invitationsRes.status === 401 ||
        profilesRes.status === 401 ||
        activityRes.status === 401
      ) {
        await handleUnauthorized();
        return;
      }

      const [membersData, invitationsData, profilesData, activityData] = await Promise.all([
        parseJsonResponse(membersRes),
        parseJsonResponse(invitationsRes),
        parseJsonResponse(profilesRes),
        parseJsonResponse(activityRes),
      ]);

      if (!membersRes.ok) throw new Error(membersData.error || "Could not load family members.");
      if (!invitationsRes.ok) throw new Error(invitationsData.error || "Could not load invitations.");
      if (!profilesRes.ok) throw new Error(profilesData.error || "Could not load accessible profiles.");
      if (!activityRes.ok) throw new Error(activityData.error || "Could not load activity.");

      setMembers(Array.isArray(membersData.members) ? membersData.members : []);
      setInvitations(Array.isArray(invitationsData.invitations) ? invitationsData.invitations : []);
      setProfiles(Array.isArray(profilesData.profiles) ? profilesData.profiles : []);
      setActivity(Array.isArray(activityData.activity) ? activityData.activity : []);
    } catch (error: any) {
      showMessage("Error", error.message || "Could not load family data.");
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const respondToInvitation = async (invitation: Invitation, action: "accept" | "decline") => {
    try {
      setRespondingId(invitation.id);

      const response = await authorizedFetch(
        `${API_BASE_URL}/api/family/invitations/${invitation.id}/${action}`,
        { method: "POST" }
      );

      if (response.status === 401) {
        await handleUnauthorized();
        return;
      }

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || `Could not ${action} the invitation.`);
      }

      await loadAll();
    } catch (error: any) {
      showMessage("Error", error.message || `Could not ${action} the invitation.`);
    } finally {
      setRespondingId(null);
    }
  };

  const changeAccessLevel = async (member: FamilyMember, accessLevel: string) => {
    try {
      const response = await authorizedFetch(
        `${API_BASE_URL}/api/family/members/${member.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessLevel }),
        }
      );

      if (response.status === 401) {
        await handleUnauthorized();
        return;
      }

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Could not update the access level.");
      }

      await loadAll();
    } catch (error: any) {
      showMessage("Error", error.message || "Could not update the access level.");
    }
  };

  const removeMember = (member: FamilyMember) => {
    const performRemove = async () => {
      try {
        setRemovingId(member.id);

        const response = await authorizedFetch(
          `${API_BASE_URL}/api/family/members/${member.id}`,
          { method: "DELETE" }
        );

        if (response.status === 401) {
          await handleUnauthorized();
          return;
        }

        const data = await parseJsonResponse(response);

        if (!response.ok) {
          throw new Error(data.error || "Could not remove the family member.");
        }

        await loadAll();
      } catch (error: any) {
        showMessage("Error", error.message || "Could not remove the family member.");
      } finally {
        setRemovingId(null);
      }
    };

    if (isWeb && typeof window !== "undefined") {
      if (window.confirm(`Remove ${member.email} from family access?`)) {
        performRemove();
      }
      return;
    }

    Alert.alert("Remove Family Member", `Remove ${member.email} from family access?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: performRemove },
    ]);
  };

  const resendInvitation = async (member: FamilyMember) => {
    try {
      const response = await authorizedFetch(
        `${API_BASE_URL}/api/family/members/${member.id}/resend`,
        { method: "POST" }
      );

      if (response.status === 401) {
        await handleUnauthorized();
        return;
      }

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Could not resend the invitation.");
      }

      showMessage("Invitation Resent", `A reminder was sent to ${member.email}.`);
    } catch (error: any) {
      showMessage("Error", error.message || "Could not resend the invitation.");
    }
  };

  const useEmergencyAccess = (profile: AccessibleProfile) => {
    const performRequest = async () => {
      try {
        setEmergencyLoadingId(profile.relationshipId);

        const response = await authorizedFetch(
          `${API_BASE_URL}/api/family/emergency/${profile.ownerUserId}`
        );

        if (response.status === 401) {
          await handleUnauthorized();
          return;
        }

        const data = await parseJsonResponse(response);

        if (!response.ok) {
          throw new Error(data.error || "Could not load emergency information.");
        }

        const info = data.profile;

        showMessage(
          `${info.firstName} ${info.lastName} — Emergency Info`,
          `Blood Group: ${info.bloodGroup || "Unknown"}\n` +
            `Chronic Disease: ${info.chronicDisease || "None reported"}\n` +
            `Other: ${info.otherDisease || "None"}\n` +
            `Phone: ${info.phone || "Not provided"}\n` +
            `Address: ${info.address || "Not provided"}\n\n` +
            `This access has been logged and ${info.firstName} has been notified.`
        );
      } catch (error: any) {
        showMessage("Error", error.message || "Could not load emergency information.");
      } finally {
        setEmergencyLoadingId(null);
      }
    };

    const message =
      `This will immediately show ${profile.ownerFirstName}'s critical health info. ` +
      `It will be logged and ${profile.ownerFirstName} will be notified. Continue?`;

    if (isWeb && typeof window !== "undefined") {
      if (window.confirm(message)) {
        performRequest();
      }
      return;
    }

    Alert.alert("Use Emergency Access", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Continue", onPress: performRequest },
    ]);
  };

  const emergencyProfiles = profiles.filter((profile) => profile.accessLevel === "emergency");

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>👨‍👩‍👦 Family Access</Text>
          <Text style={styles.subtitle}>
            Grant trusted family members access to your health profile, or view
            profiles that have been shared with you.
          </Text>
        </View>
      </View>

      {/* Your Family Members */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Your Family Members</Text>
            <Text style={styles.cardSubtitle}>{members.length} / 5 members added</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}
            disabled={members.filter((m) => m.status !== "revoked" && m.status !== "declined").length >= 5}
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text style={styles.addButtonText}>Add Family Member</Text>
          </TouchableOpacity>
        </View>

        {members.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Family Members Yet</Text>
            <Text style={styles.emptyText}>
              Add family members to share your health information securely.
            </Text>
          </View>
        ) : (
          members.map((member) => {
            const access = accessBadgeStyle(member.accessLevel);
            const status = statusBadgeStyle(member.status);

            return (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.memberTopRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.email.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                    <Text style={styles.memberMeta}>
                      {RELATIONSHIP_LABELS[member.relationshipType] || member.relationshipType}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <View style={[styles.badge, { backgroundColor: access.backgroundColor }]}>
                      <Text style={[styles.badgeText, { color: access.color }]}>
                        {ACCESS_LABELS[member.accessLevel]}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: status.backgroundColor }]}>
                      <Text style={[styles.badgeText, { color: status.color }]}>
                        {STATUS_LABELS[member.status]}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.memberBottomRow}>
                  <Text style={styles.memberDate}>
                    {member.status === "pending" ? "Invited" : "Joined"}:{" "}
                    {formatDate(member.invitedAt)}
                  </Text>

                  <View style={styles.memberActions}>
                    {member.status === "pending" ? (
                      <TouchableOpacity
                        style={styles.smallActionButton}
                        onPress={() => resendInvitation(member)}
                      >
                        <Text style={styles.smallActionText}>Resend</Text>
                      </TouchableOpacity>
                    ) : member.status === "active" ? (
                      <View style={styles.levelChipRow}>
                        {(["view_only", "manage", "emergency"] as const).map((level) => (
                          <TouchableOpacity
                            key={level}
                            style={[
                              styles.levelChip,
                              member.accessLevel === level ? styles.levelChipActive : null,
                            ]}
                            onPress={() => changeAccessLevel(member, level)}
                          >
                            <Text
                              style={[
                                styles.levelChipText,
                                member.accessLevel === level ? styles.levelChipTextActive : null,
                              ]}
                            >
                              {ACCESS_LABELS[level]}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}

                    {member.status !== "revoked" ? (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeMember(member)}
                        disabled={removingId === member.id}
                      >
                        <Text style={styles.removeButtonText}>
                          {removingId === member.id ? "..." : "Remove"}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Profiles You Can Access */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profiles You Can Access</Text>

        <Text style={styles.sectionLabel}>Pending Invitations</Text>
        {invitations.length === 0 ? (
          <Text style={styles.emptyInlineText}>No pending invitations</Text>
        ) : (
          invitations.map((invitation) => (
            <View key={invitation.id} style={styles.invitationCard}>
              <View style={styles.invitationTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.invitationName}>
                    {invitation.ownerFirstName} {invitation.ownerLastName}
                  </Text>
                  <Text style={styles.memberMeta}>{invitation.ownerEmail}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: accessBadgeStyle(invitation.accessLevel).backgroundColor }]}>
                  <Text style={[styles.badgeText, { color: accessBadgeStyle(invitation.accessLevel).color }]}>
                    {ACCESS_LABELS[invitation.accessLevel]}
                  </Text>
                </View>
              </View>

              <Text style={styles.invitationDescription}>
                Wants to give you <Text style={{ fontWeight: "700" }}>{ACCESS_LABELS[invitation.accessLevel]}</Text>{" "}
                access to their health profile as their{" "}
                <Text style={{ fontWeight: "700" }}>
                  {RELATIONSHIP_LABELS[invitation.relationshipType] || invitation.relationshipType}
                </Text>
                .
              </Text>

              <View style={styles.invitationActions}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => respondToInvitation(invitation, "accept")}
                  disabled={respondingId === invitation.id}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => respondToInvitation(invitation, "decline")}
                  disabled={respondingId === invitation.id}
                >
                  <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Accessible Profiles</Text>
        {profiles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={36} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Access to Other Profiles</Text>
            <Text style={styles.emptyText}>
              When family members grant you access, their profiles will appear here.
            </Text>
          </View>
        ) : (
          profiles.map((profile) => {
            const access = accessBadgeStyle(profile.accessLevel);

            return (
              <View key={profile.relationshipId} style={styles.profileCard}>
                <View style={styles.memberTopRow}>
                  <View style={styles.memberAvatarBlue}>
                    <Text style={styles.memberAvatarText}>
                      {profile.ownerFirstName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberEmail}>
                      {profile.ownerFirstName} {profile.ownerLastName}
                    </Text>
                    <Text style={styles.memberMeta}>
                      {RELATIONSHIP_LABELS[profile.relationshipType] || profile.relationshipType} ·{" "}
                      {ACCESS_LABELS[profile.accessLevel]} Access
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: access.backgroundColor }]}>
                    <Text style={[styles.badgeText, { color: access.color }]}>
                      {ACCESS_LABELS[profile.accessLevel]}
                    </Text>
                  </View>
                </View>

                {profile.accessLevel !== "emergency" ? (
                  <TouchableOpacity
                    style={styles.viewProfileButton}
                    onPress={() => setActiveProfileRelationshipId(profile.relationshipId)}
                  >
                    <Text style={styles.viewProfileButtonText}>View Profile</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.emergencyNote}>
                    Emergency-only access — use the Emergency Access button below.
                  </Text>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Emergency Access */}
      {emergencyProfiles.length > 0 ? (
        <View style={styles.card}>
          <View style={styles.emergencyHeaderRow}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.cardTitle}>Emergency Access</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            You hold pre-approved emergency access to these profiles. Using it
            unlocks critical info instantly and notifies the owner.
          </Text>

          {emergencyProfiles.map((profile) => (
            <View key={profile.relationshipId} style={styles.emergencyRow}>
              <Text style={styles.memberEmail}>
                {profile.ownerFirstName} {profile.ownerLastName}
              </Text>
              <TouchableOpacity
                style={styles.emergencyButton}
                onPress={() => useEmergencyAccess(profile)}
                disabled={emergencyLoadingId === profile.relationshipId}
              >
                <Text style={styles.emergencyButtonText}>
                  {emergencyLoadingId === profile.relationshipId
                    ? "Loading..."
                    : "Use Emergency Access"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      {/* Emergency QR Card */}
      <View style={styles.quickAccessCard}>
        <Text style={styles.quickAccessTitle}>My Emergency QR Card</Text>
        <Text style={styles.quickAccessText}>
          Generate a scannable card showing your blood group and critical
          conditions — useful for first responders, even without the app.
        </Text>
        <TouchableOpacity
          style={styles.emergencyQrButton}
          onPress={() => setEmergencyCardVisible(true)}
        >
          <Text style={styles.emergencyQrButtonText}>🚨 View My Emergency QR Card</Text>
        </TouchableOpacity>
      </View>

      {/* Activity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Family Access Activity</Text>

        {activity.length === 0 ? (
          <Text style={styles.emptyInlineText}>No recent activity to display</Text>
        ) : (
          activity.map((item) => (
            <View key={item.id} style={styles.activityRow}>
              <View style={styles.activityDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activityDescription}>{item.description}</Text>
                <Text style={styles.activityDate}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <AddFamilyMemberModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onCreated={loadAll}
        onUnauthorized={handleUnauthorized}
      />

      <ProfileDetailModal
        visible={activeProfileRelationshipId !== null}
        relationshipId={activeProfileRelationshipId}
        onClose={() => setActiveProfileRelationshipId(null)}
        onUnauthorized={handleUnauthorized}
      />

      <EmergencyCardModal
        visible={emergencyCardVisible}
        onClose={() => setEmergencyCardVisible(false)}
        onUnauthorized={handleUnauthorized}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerBox: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    marginBottom: 18,
  },
  headerText: {
    flex: 1,
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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10B981",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
  },
  emptyTitle: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 14,
    marginTop: 6,
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    maxWidth: 260,
  },
  emptyInlineText: {
    color: "#94A3B8",
    fontSize: 13,
    paddingVertical: 10,
  },
  memberRow: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  memberTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarBlue: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontWeight: "800",
    color: "#065F46",
  },
  memberEmail: {
    fontWeight: "700",
    color: "#0F172A",
    fontSize: 14,
  },
  memberMeta: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  memberBottomRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  memberDate: {
    color: "#94A3B8",
    fontSize: 11,
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  smallActionButton: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallActionText: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "700",
  },
  levelChipRow: {
    flexDirection: "row",
    gap: 6,
  },
  levelChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  levelChipActive: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  levelChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  levelChipTextActive: {
    color: "#1D4ED8",
  },
  removeButton: {
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeButtonText: {
    color: "#B91C1C",
    fontSize: 11,
    fontWeight: "700",
  },
  sectionLabel: {
    fontWeight: "700",
    color: "#334155",
    fontSize: 13,
    marginBottom: 8,
  },
  invitationCard: {
    borderWidth: 1,
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  invitationTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  invitationName: {
    fontWeight: "700",
    color: "#0F172A",
    fontSize: 14,
  },
  invitationDescription: {
    marginTop: 8,
    color: "#334155",
    fontSize: 12,
    lineHeight: 18,
  },
  invitationActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  acceptButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9,
  },
  acceptButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  declineButton: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9,
  },
  declineButtonText: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 12,
  },
  profileCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  viewProfileButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewProfileButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  emergencyNote: {
    marginTop: 8,
    color: "#9A3412",
    fontSize: 11,
  },
  emergencyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  emergencyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingVertical: 10,
  },
  emergencyButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emergencyButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  quickAccessCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  quickAccessTitle: {
    fontWeight: "800",
    color: "#1E40AF",
    fontSize: 15,
    marginBottom: 6,
  },
  quickAccessText: {
    color: "#1D4ED8",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  emergencyQrButton: {
    backgroundColor: "#DC2626",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center",
  },
  emergencyQrButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  activityDot: {
    marginTop: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#2563EB",
  },
  activityDescription: {
    color: "#334155",
    fontSize: 13,
  },
  activityDate: {
    marginTop: 2,
    color: "#94A3B8",
    fontSize: 11,
  },
});
