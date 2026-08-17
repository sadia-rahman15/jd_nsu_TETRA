
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAccessToken } from '@/services/auth-storage';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

type Donor = {
  id: number;
  name: string;
  bloodGroup: string;
  phone: string | null;
  location: string;
  sourceName?: string;
  sourceUrl?: string;
  localScore?: number;
};

type UserCoordinates = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

type ReadableLocation = {
  displayName: string;
  thana: string;
};

export default function BloodSearchScreen() {
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [coordinates, setCoordinates] = useState<UserCoordinates | null>(null);
  const [userLocation, setUserLocation] = useState<ReadableLocation | null>(null);
  const [results, setResults] = useState<Donor[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void detectUserLocation();
  }, []);

  const fetchDetectedThana = async (
    latitude: number,
    longitude: number
  ): Promise<ReadableLocation> => {
    const token = await getAccessToken();

    if (!token) {
      throw new Error('Your login session has expired. Please sign in again.');
    }

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/blood-donors/detect-thana?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.thana) {
      throw new Error(
        data?.error || 'GPS was detected, but AmarCure could not determine the thana.'
      );
    }

    const thana = String(data.thana).trim();
    return {
      thana,
      displayName: `${thana} Thana`,
    };
  };

  const detectUserLocation = async () => {
    setLoadingLocation(true);
    setMessage('');
    setResults([]);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setCoordinates(null);
        setUserLocation(null);
        setMessage(
          'Location permission is required. Allow precise location access and press Refresh Location.'
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const detectedCoordinates: UserCoordinates = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy ?? null,
      };

      setCoordinates(detectedCoordinates);

      // The backend converts local neighbourhood names (for example Solmaid)
      // into the canonical police-thana name (for example Vatara).
      const readable = await fetchDetectedThana(
        detectedCoordinates.latitude,
        detectedCoordinates.longitude
      );

      setUserLocation(readable);
    } catch (error) {
      console.error('Blood Search location detection failed:', error);
      setCoordinates(null);
      setUserLocation(null);
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not detect your current thana. Check location settings and try again.'
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const search = async () => {
    if (!coordinates || !userLocation?.thana) {
      setResults([]);
      setMessage('AmarCure could not determine your thana. Refresh location and try again.');
      return;
    }

    setLoadingResults(true);
    setMessage('');
    setResults([]);

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error('Your login session has expired. Please sign in again.');
      }

      const params = new URLSearchParams({
        bloodGroup,
        latitude: String(coordinates.latitude),
        longitude: String(coordinates.longitude),
      });

      const response = await fetch(
        `${API_BASE_URL}/api/blood-donors/search?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseText = await response.text();
      let data: any = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `The blood-search API did not return JSON (HTTP ${response.status}). Confirm that the backend is running on ${API_BASE_URL}.`
        );
      }

      if (!response.ok) {
        throw new Error(data.error || 'Blood donor search failed.');
      }

      if (data.centerDisplayName) {
        setUserLocation({
          displayName: String(data.centerDisplayName),
          thana: String(data.thana || userLocation.thana),
        });
      }


      const donors: Donor[] = Array.isArray(data.results) ? data.results : [];
      setResults(donors);

      if (!donors.length) {
        setMessage(
          `No ${bloodGroup} donor was found in the database for ${userLocation.thana} thana.`
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not search blood donors.'
      );
    } finally {
      setLoadingResults(false);
    }
  };

  const openPhone = async (phone: string) => {
    const normalized = phone.replace(/[^0-9+]/g, '');
    if (!normalized) return;
    await Linking.openURL(`tel:${normalized}`);
  };

  const canSearch = !!coordinates && !!userLocation?.thana && !loadingLocation && !loadingResults;

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>🩸 Search Blood Donors</Text>
        <Text style={styles.subtitle}>
          AmarCure uses your GPS to detect the correct police thana, then matches only donors stored under that same thana.
        </Text>
      </View>

      <View style={styles.locationCard}>
        <View style={styles.locationIconWrap}>
          {loadingLocation ? (
            <ActivityIndicator color="#dc2626" />
          ) : (
            <Ionicons name="location" size={23} color="#dc2626" />
          )}
        </View>

        <View style={styles.locationContent}>
          <Text style={styles.locationLabel}>Your current location</Text>

          {loadingLocation ? (
            <Text style={styles.locationValue}>Detecting your location…</Text>
          ) : userLocation ? (
            <>
              <Text style={styles.locationValue}>{userLocation.displayName}</Text>
              {coordinates?.accuracy != null ? (
                <Text style={styles.locationStatus}>
                  Device accuracy: approximately ±{Math.round(coordinates.accuracy)} m
                </Text>
              ) : null}
              <Text style={styles.locationStatus}>Detected thana used for donor matching</Text>
            </>
          ) : (
            <Text style={styles.locationUnavailable}>Current location is not available.</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => void detectUserLocation()}
          disabled={loadingLocation}
        >
          <Ionicons name="refresh" size={17} color="#991b1b" />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Blood group</Text>
      <View style={styles.groupWrap}>
        {GROUPS.map((group) => (
          <TouchableOpacity
            key={group}
            onPress={() => setBloodGroup(group)}
            style={[styles.groupButton, bloodGroup === group && styles.groupActive]}
          >
            <Text style={[styles.groupText, bloodGroup === group && styles.groupTextActive]}>
              {group}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.searchButton, !canSearch && styles.disabledButton]}
        onPress={() => void search()}
        disabled={!canSearch}
      >
        {loadingResults ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="search" size={19} color="#fff" />
            <Text style={styles.searchText}>
              Search {bloodGroup} Donors in My Thana
            </Text>
          </>
        )}
      </TouchableOpacity>

      {message ? <Text style={styles.message}>{message}</Text> : null}


      {results.length > 0 ? (
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>
            {bloodGroup} donors in {userLocation?.thana || 'your thana'}
          </Text>
          <Text style={styles.resultCount}>{results.length} found</Text>
        </View>
      ) : null}

      <View style={styles.results}>
        {results.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.drop}>
                <Text style={styles.dropText}>{item.bloodGroup}</Text>
              </View>

              <View style={styles.donorMain}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={17} color="#64748b" />
                  <Text style={styles.locationText}>
                    {item.location || 'Location not listed'}
                  </Text>
                </View>
                <Text style={styles.localBadge}>
                  Matched by thana name
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              {item.phone ? (
                <TouchableOpacity
                  style={styles.call}
                  onPress={() => void openPhone(item.phone!)}
                >
                  <Ionicons name="call-outline" size={18} color="#fff" />
                  <Text style={styles.callText}>{item.phone}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.noPhone}>No valid phone number</Text>
              )}

              {item.sourceUrl ? (
                <TouchableOpacity
                  style={styles.source}
                  onPress={() => Linking.openURL(item.sourceUrl!)}
                >
                  <Ionicons name="open-outline" size={16} color="#334155" />
                  <Text style={styles.sourceText}>Source</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.notice}>
        AmarCure detects your thana from your current GPS location and matches the thana name with the location stored in the donor database. Always call and confirm availability, blood group, and willingness to donate before travelling.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    paddingBottom: 30,
  },
  hero: {
    padding: 22,
    borderRadius: 18,
    backgroundColor: '#7f1d1d',
    marginBottom: 18,
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    marginTop: 7,
    color: '#fee2e2',
    lineHeight: 21,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff',
    marginBottom: 21,
  },
  locationIconWrap: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationContent: {
    flex: 1,
    minWidth: 0,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991b1b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationValue: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  locationStatus: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 12,
  },
  locationUnavailable: {
    marginTop: 3,
    color: '#b45309',
    fontWeight: '700',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#fff1f2',
  },
  refreshText: {
    color: '#991b1b',
    fontWeight: '800',
    fontSize: 13,
  },
  label: {
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 9,
    marginTop: 8,
  },
  groupWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 18,
  },
  groupButton: {
    minWidth: 62,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff',
  },
  groupActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  groupText: {
    textAlign: 'center',
    color: '#991b1b',
    fontWeight: '800',
  },
  groupTextActive: {
    color: '#fff',
  },
  searchButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  disabledButton: {
    opacity: 0.45,
  },
  searchText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  message: {
    marginTop: 14,
    padding: 13,
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    color: '#9a3412',
    lineHeight: 20,
  },
  areaBox: {
    marginTop: 14,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  areaTitle: {
    fontWeight: '800',
    color: '#334155',
    marginBottom: 5,
  },
  areaText: {
    color: '#64748b',
    lineHeight: 19,
    fontSize: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 25,
    marginBottom: 10,
  },
  resultTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
  },
  resultCount: {
    color: '#64748b',
    fontWeight: '700',
  },
  results: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 13,
    alignItems: 'flex-start',
  },
  drop: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropText: {
    color: '#b91c1c',
    fontWeight: '900',
  },
  donorMain: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  detailRow: {
    marginTop: 7,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  locationText: {
    flex: 1,
    color: '#475569',
  },
  localBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#ecfdf5',
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  call: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#dc2626',
  },
  callText: {
    color: '#fff',
    fontWeight: '800',
  },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  sourceText: {
    color: '#334155',
    fontWeight: '700',
  },
  noPhone: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  notice: {
    marginTop: 20,
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
  },
});
