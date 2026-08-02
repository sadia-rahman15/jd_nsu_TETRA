import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const isWeb = Platform.OS === 'web';
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const RADIUS_OPTIONS = [2, 3, 5] as const;
const DEFAULT_RADIUS_KM = 2;
const TARGET_ACCURACY_METERS = 100;
const MAX_ACCEPTABLE_ACCURACY_METERS = 500;
const LOCATION_TIMEOUT_MS = 15000;

type RadiusKm = (typeof RADIUS_OPTIONS)[number];
type FacilityKind =
  | 'Hospital'
  | 'Clinic'
  | 'Diagnostic Centre'
  | 'Laboratory'
  | 'Doctor'
  | 'Health Centre';

interface UserCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  source: 'device' | 'manual';
  locationName: string;
}

interface HealthFacility {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  address: string;
  phone?: string;
  website?: string;
  emergency?: string;
  operator?: string;
  kind: FacilityKind;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const showMessage = (title: string, message: string) => {
  if (isWeb && typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

// Haversine straight-line distance.
const calculateDistanceKm = (
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
) => {
  const earthRadiusKm = 6371.0088;
  const latitudeDifference = toRadians(latitude2 - latitude1);
  const longitudeDifference = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const buildAddress = (tags: Record<string, string>) => {
  const street = [tags['addr:housenumber'], tags['addr:street']]
    .filter(Boolean)
    .join(' ');

  return [
    street,
    tags['addr:suburb'] || tags['addr:neighbourhood'],
    tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
    tags['addr:district'],
  ]
    .filter(Boolean)
    .join(', ');
};

const normalizeWebsite = (website?: string) => {
  if (!website) return undefined;
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
};

const buildReadableLocationName = (address: {
  name?: string | null;
  street?: string | null;
  district?: string | null;
  city?: string | null;
  subregion?: string | null;
  region?: string | null;
  country?: string | null;
}) => {
  const parts = [
    address.name,
    address.street,
    address.district,
    address.city,
    address.subregion,
    address.region,
    address.country,
  ]
    .map((part) => String(part || '').trim())
    .filter(Boolean);

  return Array.from(new Set(parts)).slice(0, 4).join(', ');
};

const reverseGeocodeLocation = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    if (!isWeb) {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      const address = results[0];

      if (address) {
        const readableName =
          address.formattedAddress ||
          buildReadableLocationName({
            name: address.name,
            street: address.street,
            district: address.district,
            city: address.city,
            subregion: address.subregion,
            region: address.region,
            country: address.country,
          });

        if (readableName) return readableName;
      }
    }

    const url =
      'https://nominatim.openstreetmap.org/reverse' +
      `?format=jsonv2&lat=${encodeURIComponent(latitude)}` +
      `&lon=${encodeURIComponent(longitude)}` +
      '&zoom=18&addressdetails=1&accept-language=en';

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed with HTTP ${response.status}.`);
    }

    const data = (await response.json()) as {
      display_name?: string;
      name?: string;
      address?: Record<string, string>;
    };

    const address = data.address || {};
    const readableName =
      data.display_name ||
      [
        data.name,
        address.road,
        address.neighbourhood || address.suburb || address.quarter,
        address.city || address.town || address.village || address.municipality,
        address.state_district || address.district,
        address.state,
        address.country,
      ]
        .filter(Boolean)
        .join(', ');

    return readableName || 'Detected location';
  } catch (error) {
    console.warn('Could not convert coordinates to a location name:', error);
    return 'Detected location';
  }
};

const identifyKind = (tags: Record<string, string>): FacilityKind => {
  const amenity = String(tags.amenity || '').toLowerCase();
  const healthcare = String(tags.healthcare || '').toLowerCase();
  const name = String(tags.name || tags['name:en'] || '').toLowerCase();

  if (
    healthcare === 'laboratory' ||
    amenity === 'laboratory' ||
    name.includes('laboratory') ||
    name.includes('lab ')
  ) {
    return 'Laboratory';
  }

  if (
    healthcare === 'diagnostic_centre' ||
    healthcare === 'diagnostic_center' ||
    amenity === 'diagnostic_centre' ||
    amenity === 'diagnostic_center' ||
    name.includes('diagnostic') ||
    name.includes('diagnosis')
  ) {
    return 'Diagnostic Centre';
  }

  if (amenity === 'hospital' || healthcare === 'hospital') return 'Hospital';
  if (amenity === 'clinic' || healthcare === 'clinic') return 'Clinic';
  if (amenity === 'doctors' || healthcare === 'doctor') return 'Doctor';
  return 'Health Centre';
};

const createOverpassQuery = (
  latitude: number,
  longitude: number,
  radiusKm: number
) => {
  const radiusMeters = Math.round(radiusKm * 1000);

  return `
    [out:json][timeout:35];
    (
      nwr["amenity"="hospital"](around:${radiusMeters},${latitude},${longitude});
      nwr["healthcare"="hospital"](around:${radiusMeters},${latitude},${longitude});
      nwr["amenity"="clinic"](around:${radiusMeters},${latitude},${longitude});
      nwr["healthcare"="clinic"](around:${radiusMeters},${latitude},${longitude});
      nwr["amenity"="doctors"](around:${radiusMeters},${latitude},${longitude});
      nwr["healthcare"="doctor"](around:${radiusMeters},${latitude},${longitude});
      nwr["healthcare"="laboratory"](around:${radiusMeters},${latitude},${longitude});
      nwr["amenity"="laboratory"](around:${radiusMeters},${latitude},${longitude});
      nwr["healthcare"="diagnostic_centre"](around:${radiusMeters},${latitude},${longitude});
      nwr["healthcare"="diagnostic_center"](around:${radiusMeters},${latitude},${longitude});
      nwr["amenity"="diagnostic_centre"](around:${radiusMeters},${latitude},${longitude});
      nwr["amenity"="diagnostic_center"](around:${radiusMeters},${latitude},${longitude});
      nwr["healthcare"="centre"](around:${radiusMeters},${latitude},${longitude});
      nwr["healthcare"="center"](around:${radiusMeters},${latitude},${longitude});
    );
    out center tags;
  `;
};

const getBestWebLocation = (): Promise<UserCoordinates> =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('This browser does not support location detection.'));
      return;
    }

    let bestPosition: GeolocationPosition | null = null;
    let finished = false;
    let watchId: number | null = null;

    const finish = (error?: Error) => {
      if (finished) return;
      finished = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timeoutId);

      if (bestPosition) {
        resolve({
          latitude: bestPosition.coords.latitude,
          longitude: bestPosition.coords.longitude,
          accuracy: bestPosition.coords.accuracy,
          source: 'device',
          locationName: '',
        });
        return;
      }

      reject(error || new Error('Could not determine your current location.'));
    };

    const timeoutId = window.setTimeout(
      () => finish(new Error('Location detection timed out. Try again outdoors or enter coordinates manually.')),
      LOCATION_TIMEOUT_MS
    );

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (
          !bestPosition ||
          position.coords.accuracy < bestPosition.coords.accuracy
        ) {
          bestPosition = position;
        }

        if (position.coords.accuracy <= TARGET_ACCURACY_METERS) {
          finish();
        }
      },
      (error) => {
        const messages: Record<number, string> = {
          1: 'Location permission was denied.',
          2: 'Your location is currently unavailable.',
          3: 'Location detection timed out.',
        };
        finish(new Error(messages[error.code] || error.message));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: LOCATION_TIMEOUT_MS,
      }
    );
  });

const getBestNativeLocation = async (): Promise<UserCoordinates> => {
  const samples: Location.LocationObject[] = [];

  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: 10000,
    requiredAccuracy: MAX_ACCEPTABLE_ACCURACY_METERS,
  });
  if (lastKnown) samples.push(lastKnown);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      mayShowUserSettingsDialog: true,
    });
    samples.push(current);

    if (
      current.coords.accuracy != null &&
      current.coords.accuracy <= TARGET_ACCURACY_METERS
    ) {
      break;
    }
  }

  const best = samples.sort(
    (first, second) =>
      (first.coords.accuracy ?? Number.MAX_SAFE_INTEGER) -
      (second.coords.accuracy ?? Number.MAX_SAFE_INTEGER)
  )[0];

  if (!best) throw new Error('Could not determine your current location.');

  return {
    latitude: best.coords.latitude,
    longitude: best.coords.longitude,
    accuracy: best.coords.accuracy,
    source: 'device',
    locationName: '',
  };
};

export default function AvailableHospitalsScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const gridColumns = viewportWidth >= 1100 ? 3 : viewportWidth >= 700 ? 2 : 1;
  const cardWidth = gridColumns === 3 ? '31.8%' : gridColumns === 2 ? '48.8%' : '100%';
  const [radiusKm, setRadiusKm] = useState<RadiusKm>(DEFAULT_RADIUS_KM);
  const [location, setLocation] = useState<UserCoordinates | null>(null);
  const [facilities, setFacilities] = useState<HealthFacility[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const [showManualLocation, setShowManualLocation] = useState(false);

  const fetchNearbyFacilities = useCallback(
    async (coordinates: UserCoordinates, selectedRadiusKm: RadiusKm) => {
      setLoadingFacilities(true);
      setErrorMessage('');
      setFacilities([]);

      try {
        const query = createOverpassQuery(
          coordinates.latitude,
          coordinates.longitude,
          selectedRadiusKm
        );

        let data: { elements?: OverpassElement[] } | null = null;
        let lastError: Error | null = null;

        for (const endpoint of OVERPASS_ENDPOINTS) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
              },
              body: `data=${encodeURIComponent(query)}`,
            });

            if (!response.ok) {
              throw new Error(`Nearby-health service returned HTTP ${response.status}.`);
            }

            data = (await response.json()) as { elements?: OverpassElement[] };
            break;
          } catch (error) {
            lastError =
              error instanceof Error ? error : new Error('Nearby-health search failed.');
          }
        }

        if (!data) throw lastError || new Error('Could not load nearby facilities.');

        const uniqueFacilities = new Map<string, HealthFacility>();

        for (const element of data.elements || []) {
          const latitude = element.lat ?? element.center?.lat;
          const longitude = element.lon ?? element.center?.lon;
          if (typeof latitude !== 'number' || typeof longitude !== 'number') continue;

          const distanceKm = calculateDistanceKm(
            coordinates.latitude,
            coordinates.longitude,
            latitude,
            longitude
          );

          // Strict local filter. Even if Overpass returns an out-of-radius object,
          // the app refuses to display it.
          if (distanceKm > selectedRadiusKm + 0.001) continue;

          const tags = element.tags || {};
          const kind = identifyKind(tags);
          const name =
            tags.name ||
            tags['name:en'] ||
            tags.operator ||
            `Unnamed ${kind}`;

          const dedupeKey = `${name.toLowerCase()}-${latitude.toFixed(5)}-${longitude.toFixed(5)}`;
          if (uniqueFacilities.has(dedupeKey)) continue;

          uniqueFacilities.set(dedupeKey, {
            id: `${element.type}-${element.id}`,
            name,
            latitude,
            longitude,
            distanceKm,
            address: buildAddress(tags) || 'Address not available',
            phone: tags.phone || tags['contact:phone'],
            website: normalizeWebsite(tags.website || tags['contact:website']),
            emergency: tags.emergency,
            operator: tags.operator,
            kind,
          });
        }

        const sorted = Array.from(uniqueFacilities.values())
          .filter((facility) => facility.distanceKm <= selectedRadiusKm)
          .sort((first, second) => first.distanceKm - second.distanceKm);

        setFacilities(sorted);

        if (!sorted.length) {
          setErrorMessage(
            `No mapped hospital, clinic, diagnostic centre, laboratory, doctor, or health centre was found within ${selectedRadiusKm} km of the detected location.`
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Could not load nearby facilities.';
        setErrorMessage(message);
        showMessage('Nearby Search Failed', message);
      } finally {
        setLoadingFacilities(false);
      }
    },
    []
  );

  const detectLocationAndSearch = useCallback(async () => {
    setLoadingLocation(true);
    setErrorMessage('');
    setFacilities([]);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error(
          'Location permission was denied. Allow precise location access and try again.'
        );
      }

      const coordinates = isWeb
        ? await getBestWebLocation()
        : await getBestNativeLocation();

      if (
        coordinates.accuracy != null &&
        coordinates.accuracy > MAX_ACCEPTABLE_ACCURACY_METERS
      ) {
        setLocation(null);
        setShowManualLocation(true);
        setManualLatitude(String(coordinates.latitude));
        setManualLongitude(String(coordinates.longitude));
        throw new Error(
          `The detected position is too inaccurate (±${Math.round(
            coordinates.accuracy
          )} m). For a reliable 2–5 km search, enable precise location/GPS or enter your exact coordinates manually.`
        );
      }

      const locationName = await reverseGeocodeLocation(
        coordinates.latitude,
        coordinates.longitude
      );
      const namedCoordinates = { ...coordinates, locationName };

      setLocation(namedCoordinates);
      setManualLatitude(String(coordinates.latitude));
      setManualLongitude(String(coordinates.longitude));
      await fetchNearbyFacilities(namedCoordinates, radiusKm);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not determine your location.';
      setErrorMessage(message);
    } finally {
      setLoadingLocation(false);
    }
  }, [fetchNearbyFacilities, radiusKm]);

  const useManualLocation = async () => {
    const latitude = Number(manualLatitude.trim());
    const longitude = Number(manualLongitude.trim());

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      showMessage('Invalid Coordinates', 'Enter a valid latitude and longitude.');
      return;
    }

    const coordinates: UserCoordinates = {
      latitude,
      longitude,
      accuracy: 0,
      source: 'manual',
      locationName: '',
    };

    const locationName = await reverseGeocodeLocation(latitude, longitude);
    const namedCoordinates = { ...coordinates, locationName };

    setLocation(namedCoordinates);
    setErrorMessage('');
    await fetchNearbyFacilities(namedCoordinates, radiusKm);
  };

  const changeRadius = async (nextRadius: RadiusKm) => {
    setRadiusKm(nextRadius);
    if (location) await fetchNearbyFacilities(location, nextRadius);
  };

  const openDirections = async (facility: HealthFacility) => {
    const destination = `${facility.latitude},${facility.longitude}`;
    const origin = location
      ? `${location.latitude},${location.longitude}`
      : undefined;

    const url =
      isWeb || Platform.OS === 'android'
        ? `https://www.google.com/maps/dir/?api=1${
            origin ? `&origin=${encodeURIComponent(origin)}` : ''
          }&destination=${encodeURIComponent(destination)}`
        : `http://maps.apple.com/?daddr=${encodeURIComponent(destination)}`;

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      showMessage('Directions Unavailable', 'This device cannot open a maps application.');
      return;
    }

    await Linking.openURL(url);
  };

  const filteredFacilities = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return facilities;

    return facilities.filter((facility) =>
      [
        facility.name,
        facility.address,
        facility.operator || '',
        facility.kind,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [facilities, searchText]);

  const isBusy = loadingLocation || loadingFacilities;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>🏥 Nearby Healthcare</Text>
          <Text style={styles.subtitle}>
            Find hospitals, clinics, diagnostics, laboratories and doctors strictly within 2, 3 or 5 km.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.locationButton, isBusy && styles.disabledButton]}
          onPress={detectLocationAndSearch}
          disabled={isBusy}
          activeOpacity={0.8}
        >
          {isBusy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Ionicons name="locate-outline" size={19} color="#FFFFFF" />
          )}
          <Text style={styles.locationButtonText}>
            {loadingLocation
              ? 'Locating precisely…'
              : loadingFacilities
                ? 'Searching nearby…'
                : location
                  ? 'Refresh Precise Location'
                  : 'Use Precise Location'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlCard}>
        <View style={styles.radiusSection}>
          <Text style={styles.controlLabel}>Strict search radius</Text>
          <View style={styles.radiusButtons}>
            {RADIUS_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.radiusButton,
                  radiusKm === option && styles.radiusButtonActive,
                ]}
                onPress={() => changeRadius(option)}
                disabled={isBusy}
              >
                <Text
                  style={[
                    styles.radiusButtonText,
                    radiusKm === option && styles.radiusButtonTextActive,
                  ]}
                >
                  {option} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.manualToggle}
          onPress={() => setShowManualLocation((current) => !current)}
        >
          <Ionicons name="map-outline" size={19} color="#2563EB" />
          <Text style={styles.manualToggleText}>Enter exact coordinates</Text>
        </TouchableOpacity>
      </View>

      {showManualLocation ? (
        <View style={styles.manualCard}>
          <Text style={styles.manualTitle}>Exact starting location</Text>
          <Text style={styles.manualHint}>
            Paste your precise latitude and longitude from Google Maps when desktop location is inaccurate.
          </Text>
          <View style={styles.manualInputs}>
            <TextInput
              style={styles.coordinateInput}
              value={manualLatitude}
              onChangeText={setManualLatitude}
              placeholder="Latitude, e.g. 23.81033"
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.coordinateInput}
              value={manualLongitude}
              onChangeText={setManualLongitude}
              placeholder="Longitude, e.g. 90.41252"
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={styles.useCoordinatesButton} onPress={useManualLocation}>
              <Text style={styles.useCoordinatesText}>Use Coordinates</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {location ? (
        <View style={styles.locationSummary}>
          <Ionicons name="location" size={20} color="#047857" />
          <View style={styles.locationSummaryText}>
            <Text style={styles.locationSummaryTitle}>
              {location.source === 'manual' ? 'Selected location' : 'Your current location'}
            </Text>
            <Text style={styles.locationCoordinates}>
              {location.locationName || 'Detected location'}
            </Text>
            {location.accuracy != null && location.source === 'device' ? (
              <Text style={styles.locationAccuracy}>
                Location accuracy: approximately {Math.round(location.accuracy)} metres
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={21} color="#B91C1C" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {facilities.length > 0 ? (
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={19} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search name, type or area"
              placeholderTextColor="#94A3B8"
            />
          </View>
          <Text style={styles.resultCount}>
            {filteredFacilities.length} within {radiusKm} km
          </Text>
        </View>
      ) : null}

      {!location && !isBusy ? (
        <View style={styles.emptyState}>
          <Ionicons name="navigate-circle-outline" size={58} color="#2563EB" />
          <Text style={styles.emptyTitle}>A precise location is required</Text>
          <Text style={styles.emptyText}>
            Select {radiusKm} km, then press “Use Precise Location”. Results farther than the selected radius will never be shown.
          </Text>
        </View>
      ) : isBusy ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.emptyTitle}>
            {loadingLocation ? 'Collecting the best location reading…' : `Searching within ${radiusKm} km…`}
          </Text>
        </View>
      ) : filteredFacilities.length > 0 ? (
        <View style={styles.list}>
          {filteredFacilities.map((facility, index) => (
            <View
              key={facility.id}
              style={[styles.facilityCard, { width: cardWidth }]}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>{index + 1}</Text>
                </View>
                <View style={styles.facilityMainInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.facilityName}>{facility.name}</Text>
                    <View style={styles.kindBadge}>
                      <Text style={styles.kindBadgeText}>{facility.kind}</Text>
                    </View>
                  </View>
                  <View style={styles.distanceRow}>
                    <Ionicons name="navigate-outline" size={16} color="#2563EB" />
                    <Text style={styles.distanceText}>
                      {facility.distanceKm < 1
                        ? `${Math.round(facility.distanceKm * 1000)} m away`
                        : `${facility.distanceKm.toFixed(2)} km away`}
                    </Text>
                    {facility.emergency === 'yes' ? (
                      <View style={styles.emergencyBadge}>
                        <Text style={styles.emergencyBadgeText}>Emergency</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={17} color="#64748B" />
                <Text style={styles.detailText}>{facility.address}</Text>
              </View>

              {facility.operator ? (
                <View style={styles.detailRow}>
                  <Ionicons name="business-outline" size={17} color="#64748B" />
                  <Text style={styles.detailText}>{facility.operator}</Text>
                </View>
              ) : null}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={() => openDirections(facility)}
                >
                  <Ionicons name="navigate" size={17} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Directions</Text>
                </TouchableOpacity>

                {facility.phone ? (
                  <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() => Linking.openURL(`tel:${facility.phone}`)}
                  >
                    <Ionicons name="call-outline" size={17} color="#2563EB" />
                    <Text style={styles.secondaryActionText}>Call</Text>
                  </TouchableOpacity>
                ) : null}

                {facility.website ? (
                  <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() => Linking.openURL(facility.website!)}
                  >
                    <Ionicons name="globe-outline" size={17} color="#2563EB" />
                    <Text style={styles.secondaryActionText}>Website</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : location && !errorMessage ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-circle-outline" size={58} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No nearby facility found</Text>
          <Text style={styles.emptyText}>Try the 3 km or 5 km option.</Text>
        </View>
      ) : null}

      <Text style={styles.attribution}>
        Data © OpenStreetMap contributors. The displayed value is straight-line distance from the shown origin. Only facilities calculated within the selected radius are displayed.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 18,
  },
  headerCopy: { flex: 1, minWidth: 260 },
  title: { fontSize: 27, fontWeight: '800', color: '#0F172A' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#64748B', lineHeight: 21 },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 190,
  },
  disabledButton: { opacity: 0.65 },
  locationButtonText: { color: '#FFFFFF', fontWeight: '700' },
  controlCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 15,
    padding: 15,
    marginBottom: 14,
  },
  radiusSection: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  controlLabel: { color: '#334155', fontWeight: '700' },
  radiusButtons: { flexDirection: 'row', gap: 7 },
  radiusButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radiusButtonActive: { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
  radiusButtonText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  radiusButtonTextActive: { color: '#1D4ED8' },
  manualToggle: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  manualToggleText: { color: '#2563EB', fontWeight: '700' },
  manualCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 15,
    marginBottom: 14,
  },
  manualTitle: { color: '#0F172A', fontWeight: '800', fontSize: 16 },
  manualHint: { marginTop: 4, color: '#64748B', lineHeight: 19 },
  manualInputs: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 12 },
  coordinateInput: {
    minWidth: 190,
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  useCoordinatesButton: {
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  useCoordinatesText: { color: '#FFFFFF', fontWeight: '700' },
  locationSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 13,
    marginBottom: 14,
  },
  locationSummaryText: { flex: 1 },
  locationSummaryTitle: { color: '#065F46', fontWeight: '700' },
  locationCoordinates: {
    marginTop: 4,
    color: '#047857',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  locationAccuracy: {
    marginTop: 3,
    color: '#059669',
    fontSize: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 13,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: { flex: 1, color: '#B91C1C', lineHeight: 19 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  searchBox: {
    flex: 1,
    minWidth: 250,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 11,
    paddingHorizontal: 13,
  },
  searchInput: { flex: 1, height: 44, color: '#0F172A' },
  resultCount: { color: '#64748B', fontWeight: '600' },
  emptyState: {
    minHeight: 270,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    marginTop: 10,
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: { marginTop: 6, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: 13,
  },
  facilityCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    minWidth: 0,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  numberBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeText: { color: '#1D4ED8', fontWeight: '800' },
  facilityMainInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 },
  facilityName: {
    flexShrink: 1,
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 17,
    lineHeight: 23,
  },
  kindBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  kindBadgeText: { color: '#166534', fontSize: 11, fontWeight: '700' },
  distanceRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  distanceText: { color: '#2563EB', fontWeight: '700', fontSize: 13 },
  emergencyBadge: {
    marginLeft: 5,
    backgroundColor: '#FEE2E2',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  emergencyBadgeText: { color: '#B91C1C', fontSize: 11, fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 11 },
  detailText: { flex: 1, color: '#475569', lineHeight: 19 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 15,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#2563EB',
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  primaryActionText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  secondaryActionText: { color: '#2563EB', fontWeight: '700', fontSize: 13 },
  attribution: {
    marginTop: 18,
    color: '#64748B',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
});