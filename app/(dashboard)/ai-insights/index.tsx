import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { authorizedFetch } from '@/services/auth-storage';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

const isWeb = Platform.OS === 'web';

// --- CONFIGURATIONS & SYMPTOM DATA ---
interface SymptomDiagnosis {
  cause: string;
  doctorType: string;
}

interface BodyPartConfig {
  name: string;
  symptoms: string[];
  diagnosis: Record<string, SymptomDiagnosis>;
  defaultDoctorType: string;
}

interface UserCoordinates {
  latitude: number;
  longitude: number;
}

interface NearbyDoctor {
  id: string;
  doctorId: number;
  name: string;
  degree: string;
  specialty: string;
  specialties: string;
  experienceYears: number;
  concentrations: string;
  hospital: string;
  area: string;
  city: string;
  address: string;
  appointmentNumbers: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
}

const headConfig: BodyPartConfig = {
  name: "Head / Face / Ears / Eyes",
  symptoms: ["Headache", "Dizziness", "Eye pain", "Ear pain", "Sinus pressure"],
  diagnosis: {
    "headache": { cause: "Often linked with stress, eye strain, lack of sleep or dehydration.", doctorType: "Neurologist" },
    "dizziness": { cause: "Can be from inner-ear problems, low blood pressure or anxiety.", doctorType: "Neurologist" },
    "eye pain": { cause: "May be due to infection, dry eyes or vision issues.", doctorType: "Ophthalmologist" },
    "ear pain": { cause: "Commonly due to infection or fluid in the ear.", doctorType: "ENT Specialist" },
    "sinus pressure": { cause: "Usually from sinus infection or allergy blocking the nose.", doctorType: "ENT Specialist" },
  },
  defaultDoctorType: "Neurologist",
};

const neckConfig: BodyPartConfig = {
  name: "Neck",
  symptoms: ["Neck pain", "Stiffness", "Numbness"],
  diagnosis: {
    "neck pain": { cause: "Often from poor posture, muscle strain or disc problems.", doctorType: "Orthopedic" },
    "stiffness": { cause: "Long sitting, wrong pillow or muscle tension.", doctorType: "Orthopedic" },
    "numbness": { cause: "Can be nerve compression or disc issue in the neck.", doctorType: "Neurologist" },
  },
  defaultDoctorType: "Orthopedic",
};

const chestConfig: BodyPartConfig = {
  name: "Chest & Lungs / Heart",
  symptoms: ["Chest pain", "Breathing difficulty", "Cough", "Burning chest"],
  diagnosis: {
    "chest pain": { cause: "Sometimes from muscle strain or acidity, but can also be heart related.", doctorType: "Cardiologist" },
    "breathing difficulty": { cause: "Can be asthma, lung infection, allergy or heart problem.", doctorType: "Pulmonologist" },
    "cough": { cause: "Often due to infection, allergy or irritation of the airways.", doctorType: "Pulmonologist" },
    "burning chest": { cause: "Mostly acidity or reflux, especially after heavy meals.", doctorType: "Gastroenterologist" },
  },
  defaultDoctorType: "Cardiologist",
};

const abdomenConfig: BodyPartConfig = {
  name: "Stomach & Abdomen",
  symptoms: ["Gas", "Acidity", "Abdominal pain", "Vomiting"],
  diagnosis: {
    "gas": { cause: "Usually from indigestion, spicy food or irregular meals.", doctorType: "Gastroenterologist" },
    "acidity": { cause: "Stomach acid coming up to chest or throat (reflux).", doctorType: "Gastroenterologist" },
    "abdominal pain": { cause: "May be gastric, infection, constipation or food poisoning.", doctorType: "Gastroenterologist" },
    "vomiting": { cause: "Often due to infection, food poisoning or medicine side-effect.", doctorType: "Gastroenterologist" },
  },
  defaultDoctorType: "Gastroenterologist",
};

const armConfig: BodyPartConfig = {
  name: "Shoulder / Arm / Hand",
  symptoms: ["Joint pain", "Muscle pain", "Swelling", "Numbness"],
  diagnosis: {
    "joint pain": { cause: "Common with arthritis, injury or overuse of the joint.", doctorType: "Orthopedic" },
    "muscle pain": { cause: "Usually from strain, heavy work or injury.", doctorType: "Orthopedic" },
    "swelling": { cause: "Can be injury, inflammation or fluid build-up.", doctorType: "Orthopedic" },
    "numbness": { cause: "Can be nerve compression such as carpal tunnel.", doctorType: "Neurologist" },
  },
  defaultDoctorType: "Orthopedic",
};

const legConfig: BodyPartConfig = {
  name: "Thigh / Knee / Leg / Foot",
  symptoms: ["Leg pain", "Knee pain", "Swelling", "Numbness", "Cramp"],
  diagnosis: {
    "leg pain": { cause: "Often from muscle strain, overuse or vein problems.", doctorType: "Orthopedic" },
    "knee pain": { cause: "Can be injury, arthritis or cartilage damage.", doctorType: "Orthopedic" },
    "swelling": { cause: "May be injury, vein problems or fluid retention.", doctorType: "Orthopedic" },
    "numbness": { cause: "May be nerve compression or poor blood flow.", doctorType: "Neurologist" },
    "cramp": { cause: "Often from dehydration, low minerals or long standing.", doctorType: "Orthopedic" },
  },
  defaultDoctorType: "Orthopedic",
};

const backConfig: BodyPartConfig = {
  name: "Back & Spine",
  symptoms: ["Back pain", "Stiffness", "Sciatica", "Posture problem"],
  diagnosis: {
    "back pain": { cause: "Very common from muscle strain, posture or disc issues.", doctorType: "Orthopedic" },
    "stiffness": { cause: "Weak muscles, long sitting or arthritis.", doctorType: "Orthopedic" },
    "sciatica": { cause: "Nerve pain from lower back to leg due to disc or nerve compression.", doctorType: "Orthopedic" },
    "posture problem": { cause: "Long-term sitting and standing habits affecting the spine.", doctorType: "Orthopedic" },
  },
  defaultDoctorType: "Orthopedic",
};

const symptomDatabase: Record<string, BodyPartConfig> = {
  head: headConfig, forehead: headConfig, eyes: headConfig, nose: headConfig,
  "left-ear": headConfig, "right-ear": headConfig, "back-head": headConfig,
  neck: neckConfig,
  chest: chestConfig,
  stomach: abdomenConfig,
  "left-shoulder": armConfig, "right-shoulder": armConfig, "left-hand": armConfig,
  "right-hand": armConfig, "back-left-shoulder": armConfig, "back-right-shoulder": armConfig,
  "left-thigh": legConfig, "right-thigh": legConfig, "left-knee": legConfig,
  "right-knee": legConfig, "left-leg": legConfig, "right-leg": legConfig,
  "left-foot": legConfig, "right-foot": legConfig, "back-left-leg": legConfig, "back-right-leg": legConfig,
  "upper-back": backConfig, "lower-back": backConfig, spine: backConfig,
};

export default function AiInsightsScreen() {
  const [activePartId, setActivePartId] = useState<string | null>(null);
  const [activePartName, setActivePartName] = useState<string>('None selected');
  const [selectedSymptom, setSelectedSymptom] = useState<string>('');
  const [customSymptomInput, setCustomSymptomInput] = useState<string>('');

  const [diagnosisResult, setDiagnosisResult] = useState<{ cause: string; doctorType: string } | null>(null);

  const [userCity, setUserCity] = useState<string>('Bangladesh');
  const [userArea, setUserArea] = useState<string>('');
  const [userCoordinates, setUserCoordinates] = useState<UserCoordinates | null>(null);
  const [locating, setLocating] = useState<boolean>(false);

  const [doctors, setDoctors] = useState<NearbyDoctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(false);
  const [doctorSearchError, setDoctorSearchError] = useState<string>('');

  useEffect(() => {
    detectUserLocation();
  }, []);

  const fetchDetailedAddress = async (latitude: number, longitude: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=en`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });

      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};

        const areaParts = [
          addr.suburb,
          addr.neighbourhood,
          addr.quarter,
          addr.residential,
          addr.road,
        ].filter(Boolean);

        const areaName = Array.from(new Set(areaParts)).join(', ');
        const cityName = addr.city || addr.town || addr.district || addr.state_district || 'Bangladesh';

        return { area: areaName, city: cityName };
      }
    } catch (e) {
      console.warn('Detailed geocode fetch error:', e);
    }
    return null;
  };

  const detectUserLocation = async (): Promise<UserCoordinates | null> => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserCoordinates(null);
        setDoctorSearchError(
          'Location permission is required to show doctors closest to you.'
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserCoordinates(coordinates);
      setDoctorSearchError('');

      const detailed = await fetchDetailedAddress(
        coordinates.latitude,
        coordinates.longitude
      );

      if (detailed && (detailed.area || detailed.city)) {
        setUserArea(detailed.area);
        setUserCity(detailed.city);
      } else {
        const geocode = await Location.reverseGeocodeAsync(coordinates);

        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          setUserArea(place.district || place.street || '');
          setUserCity(place.city || place.subregion || 'Bangladesh');
        }
      }

      return coordinates;
    } catch (error) {
      console.warn('Location detection failed:', error);
      setUserCoordinates(null);
      setDoctorSearchError(
        'Could not read your precise location. Check location services and try again.'
      );
      return null;
    } finally {
      setLocating(false);
    }
  };

  const fetchNearbyDoctors = async (
    specialty: string,
    coordinates: UserCoordinates
  ) => {
    setLoadingDoctors(true);
    setDoctorSearchError('');
    setDoctors([]);

    try {
      const query = [
        `specialty=${encodeURIComponent(specialty)}`,
        `latitude=${encodeURIComponent(String(coordinates.latitude))}`,
        `longitude=${encodeURIComponent(String(coordinates.longitude))}`,
        'radiusKm=20',
        `city=${encodeURIComponent(userCity)}`,
      ].join('&');

      const response = await authorizedFetch(
        `${API_BASE_URL}/api/doctors/nearby?${query}`
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Could not search for nearby doctors.');
      }

      const returnedDoctors = Array.isArray(data.doctors)
        ? data.doctors
        : Array.isArray(data.results)
          ? data.results
          : [];
      setDoctors(returnedDoctors);
    } catch (error) {
      console.error('Nearby doctor search failed:', error);
      setDoctorSearchError(
        error instanceof Error
          ? error.message
          : 'Could not search for nearby doctors.'
      );
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handlePartClick = (partId: string, partName: string) => {
    setActivePartId(partId);
    setActivePartName(partName);
    setSelectedSymptom('');
    setDiagnosisResult(null);
    setDoctors([]);
    setDoctorSearchError('');
  };

  const handleCheckSymptom = async () => {
    if (!activePartId) {
      Alert.alert('Selection Missing', 'Please select a body part first.');
      return;
    }

    const input = (customSymptomInput.trim() || selectedSymptom).toLowerCase();
    if (!input) {
      Alert.alert('Symptom Missing', 'Please select a symptom or type your problem.');
      return;
    }

    const partConfig = symptomDatabase[activePartId];
    const matchedDiagnosis = partConfig?.diagnosis[input];
    const diag = matchedDiagnosis || {
      cause:
        'This symptom needs an in-person clinical assessment before a cause can be determined.',
      doctorType: partConfig?.defaultDoctorType || 'General Physician',
    };

    setDiagnosisResult(diag);
    setDoctors([]);
    setDoctorSearchError('');

    const coordinates = userCoordinates || (await detectUserLocation());
    if (coordinates) {
      await fetchNearbyDoctors(diag.doctorType, coordinates);
    }
  };

  const clearSelections = () => {
    setActivePartId(null);
    setActivePartName('None selected');
    setSelectedSymptom('');
    setCustomSymptomInput('');
    setDiagnosisResult(null);
    setDoctors([]);
    setDoctorSearchError('');
  };

  const refreshLocationAndDoctors = async () => {
    const coordinates = await detectUserLocation();
    if (coordinates && diagnosisResult) {
      await fetchNearbyDoctors(diagnosisResult.doctorType, coordinates);
    }
  };

  const openDoctorDirections = async (doctor: NearbyDoctor) => {
    const target = doctor.latitude != null && doctor.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${doctor.latitude},${doctor.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctor.address)}`;

    try {
      await Linking.openURL(target);
    } catch {
      Alert.alert('Could not open maps', 'Please try again.');
    }
  };

  const callDoctor = async (phone: string) => {
    const firstNumber = phone.split(',')[0]?.trim() || phone;
    const dialable = firstNumber.replace(/[^+\d]/g, '');
    try {
      await Linking.openURL(`tel:${dialable}`);
    } catch {
      Alert.alert('Call unavailable', 'Calling is not available on this device.');
    }
  };


  const currentPartConfig = activePartId ? symptomDatabase[activePartId] : null;

  const renderHotspot = (partId: string, label: string, top: string, left: string, width: string | number, height: string | number, borderRadius: number = 20) => {
    const isSelected = activePartId === partId;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.invisibleHotspot,
          { top: top as any, left: left as any, width: width as any, height: height as any, borderRadius },
          isSelected && styles.hotspotHighlightActive,
        ]}
        onPress={() => handlePartClick(partId, label)}
      >
        {isSelected && (
          <View style={styles.activeLabelBadge}>
            <Text style={styles.activeLabelText}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Health Insights</Text>
        <Text style={styles.subtitle}>
          Touch an affected body area, choose a symptom, and AmarCure will suggest the relevant specialty and show nearby doctor listings using your live location.
        </Text>
      </View>

      <View style={styles.locationCard}>
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={22} color="#0284c7" />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationTitle}>Your Live Detected Location</Text>
            <Text style={styles.locationText}>
              {locating
                ? 'Detecting live location in Bangladesh...'
                : userArea
                ? `${userArea}, ${userCity}`
                : userCity}
            </Text>
            {userCoordinates && !locating ? (
              <Text style={styles.locationCoordinates}>
                {userCoordinates.latitude.toFixed(5)}, {userCoordinates.longitude.toFixed(5)}
              </Text>
            ) : null}
          </View>
        </View>
        <TouchableOpacity style={styles.refreshLocBtn} onPress={refreshLocationAndDoctors} disabled={locating || loadingDoctors}>
          {locating ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.refreshLocText}>Refresh</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.indicatorBanner}>
        <View style={styles.activeDot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.indicatorTitle}>Touched Area: {activePartName}</Text>
          <Text style={styles.indicatorSub}>
            {activePartId ? 'Select a symptom below or describe your issue.' : 'Touch any part on the human figure to start.'}
          </Text>
        </View>
      </View>

      <View style={styles.bodyCard}>
        <Text style={styles.cardHeader}>Touch Anatomic Body Part</Text>

        <View style={styles.bodyModelsRow}>
          {/* Front Body View */}
          <View style={styles.bodyImageWrapper}>
            <Text style={styles.viewLabel}>Front View</Text>
            <View style={styles.imageContainer}>
              <Image source={require('../../../assets/images/body1299.jpg')} style={styles.bodyImage} resizeMode="contain" />

              {renderHotspot('head', 'Head & Face', '1.5%', '38%', 48, 42, 24)}
              {renderHotspot('neck', 'Neck', '13.5%', '42%', 32, 24, 12)}
              {renderHotspot('left-shoulder', 'Left Shoulder', '19%', '28%', 28, 28, 14)}
              {renderHotspot('right-shoulder', 'Right Shoulder', '19%', '58%', 28, 28, 14)}
              {renderHotspot('chest', 'Chest & Lungs', '23%', '35%', 60, 52, 16)}
              {renderHotspot('stomach', 'Stomach & Abdomen', '37%', '36%', 58, 55, 16)}
              {renderHotspot('left-hand', 'Left Hand', '49%', '18%', 30, 48, 15)}
              {renderHotspot('right-hand', 'Right Hand', '49%', '68%', 30, 48, 15)}
              {renderHotspot('left-thigh', 'Left Thigh', '54%', '37%', 26, 60, 12)}
              {renderHotspot('right-thigh', 'Right Thigh', '54%', '51%', 26, 60, 12)}
              {renderHotspot('left-knee', 'Knees', '69.5%', '37%', 24, 28, 12)}
              {renderHotspot('right-knee', 'Knees', '69.5%', '51%', 24, 28, 12)}
              {renderHotspot('left-foot', 'Feet & Toes', '77%', '36%', 26, 75, 12)}
              {renderHotspot('right-foot', 'Feet & Toes', '77%', '50%', 26, 75, 12)}
            </View>
          </View>

          {/* Back Body View */}
          <View style={styles.bodyImageWrapper}>
            <Text style={styles.viewLabel}>Back View</Text>
            <View style={styles.imageContainer}>
              <Image source={require('../../../assets/images/body2299.jpg')} style={styles.bodyImage} resizeMode="contain" />

              {renderHotspot('back-head', 'Back of Head', '2.5%', '38%', 48, 42, 24)}
              {renderHotspot('back-left-shoulder', 'Back Shoulder', '19%', '28%', 28, 28, 14)}
              {renderHotspot('back-right-shoulder', 'Back Shoulder', '19%', '58%', 28, 28, 14)}
              {renderHotspot('spine', 'Spine', '18%', '46%', 16, 120, 8)}
              {renderHotspot('upper-back', 'Upper Back', '22%', '34%', 64, 52, 16)}
              {renderHotspot('lower-back', 'Lower Back', '37%', '35%', 60, 52, 16)}
              {renderHotspot('left-hand', 'Left Hand & Wrist', '50%', '16%', 28, 45, 14)}
              {renderHotspot('right-hand', 'Right Hand & Wrist', '50%', '70%', 28, 45, 14)}
              {renderHotspot('back-left-leg', 'Back of Leg', '53%', '37%', 26, 110, 12)}
              {renderHotspot('back-right-leg', 'Back of Leg', '53%', '51%', 26, 110, 12)}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardHeader}>Symptoms & Problem</Text>

        <Text style={styles.label}>Select preset symptom for {activePartName}:</Text>
        <View style={styles.symptomPillsRow}>
          {currentPartConfig ? (
            currentPartConfig.symptoms.map((symptom) => {
              const isSelected = selectedSymptom === symptom;
              return (
                <TouchableOpacity
                  key={symptom}
                  style={[styles.pill, isSelected && styles.pillActive]}
                  onPress={() => {
                    setSelectedSymptom(symptom);
                    setCustomSymptomInput('');
                  }}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{symptom}</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Touch any area on the body figure above to load symptoms.</Text>
          )}
        </View>

        <Text style={[styles.label, { marginTop: 14 }]}>Or describe your specific issue:</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Example: sharp pain when walking..."
          placeholderTextColor="#94a3b8"
          value={customSymptomInput}
          onChangeText={(val) => {
            setCustomSymptomInput(val);
            setSelectedSymptom('');
          }}
        />

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.checkBtn} onPress={handleCheckSymptom}>
            <Text style={styles.checkBtnText}>Check Analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearBtn} onPress={clearSelections}>
            <Text style={styles.clearBtnText}>Clear Selections</Text>
          </TouchableOpacity>
        </View>

        {diagnosisResult ? (
          <View style={styles.diagnosisBox}>
            <Text style={styles.diagCauseTitle}>Possible related explanation:</Text>
            <Text style={styles.diagCauseBody}>{diagnosisResult.cause}</Text>
            <Text style={styles.diagDoctorTitle}>
              Suggested Specialty: <Text style={{ color: '#0284c7' }}>{diagnosisResult.doctorType}</Text>
            </Text>
            <Text style={styles.medicalDisclaimer}>
              General guidance only — this is not a medical diagnosis. Seek urgent care for severe, sudden, or worsening symptoms.
            </Text>
          </View>
        ) : null}
      </View>

      {diagnosisResult ? (
        <View style={styles.doctorsCard}>
          <Text style={styles.cardHeader}>
            Nearby {diagnosisResult.doctorType} Doctors
          </Text>

          <Text style={styles.directorySub}>
            Results come from AmarCure's Dhaka doctor directory and are ranked by straight-line distance from your current location. Appointment numbers are shown from the imported hospital/doctor dataset.
          </Text>

          {!userCoordinates && !locating ? (
            <TouchableOpacity
              style={styles.directoryBtnPrimary}
              onPress={refreshLocationAndDoctors}
            >
              <Ionicons name="location-outline" size={20} color="#ffffff" />
              <Text style={styles.directoryBtnTextPrimary}>
                Allow Location & Find Nearby Doctors
              </Text>
            </TouchableOpacity>
          ) : null}

          {loadingDoctors ? (
            <View style={styles.doctorLoadingBox}>
              <ActivityIndicator size="small" color="#0284c7" />
              <Text style={styles.doctorLoadingText}>
                Finding the closest {diagnosisResult.doctorType} doctors...
              </Text>
            </View>
          ) : null}

          {doctorSearchError ? (
            <View style={styles.doctorErrorBox}>
              <Ionicons name="alert-circle-outline" size={20} color="#b91c1c" />
              <Text style={styles.doctorErrorText}>{doctorSearchError}</Text>
            </View>
          ) : null}

          {!loadingDoctors && userCoordinates && !doctorSearchError && doctors.length === 0 ? (
            <View style={styles.doctorEmptyBox}>
              <Text style={styles.doctorEmptyText}>
                No matching doctor was found in the current directory. Try refreshing your location or consult a nearby hospital.
              </Text>
            </View>
          ) : null}

          {doctors.map((doctor, index) => (
            <View key={doctor.id || `${doctor.name}-${index}`} style={styles.doctorItem}>
              <View style={styles.doctorTopRow}>
                <View style={styles.doctorNumberBadge}>
                  <Text style={styles.doctorNumberText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.doctorName}>{doctor.name}</Text>
                  <Text style={styles.doctorSpecialty}>
                    {diagnosisResult.doctorType}
                  </Text>
                </View>
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>
                    {doctor.distanceKm != null ? `${doctor.distanceKm.toFixed(1)} km` : 'Distance pending'}
                  </Text>
                </View>
              </View>

              {doctor.degree ? (
                <View style={styles.doctorMetaRow}>
                  <Ionicons name="school-outline" size={16} color="#64748b" />
                  <Text style={styles.doctorMetaText}>{doctor.degree}</Text>
                </View>
              ) : null}

              <View style={styles.doctorMetaRow}>
                <Ionicons name="business-outline" size={16} color="#64748b" />
                <Text style={styles.doctorMetaText}>{doctor.hospital}</Text>
              </View>

              {doctor.experienceYears > 0 ? (
                <View style={styles.doctorMetaRow}>
                  <Ionicons name="briefcase-outline" size={16} color="#64748b" />
                  <Text style={styles.doctorMetaText}>{doctor.experienceYears} years experience</Text>
                </View>
              ) : null}

              <View style={styles.doctorMetaRow}>
                <Ionicons name="location-outline" size={16} color="#64748b" />
                <Text style={styles.doctorMetaText}>{doctor.address || 'Address unavailable'}</Text>
              </View>

              {doctor.phone ? (
                <View style={styles.doctorMetaRow}>
                  <Ionicons name="call-outline" size={16} color="#64748b" />
                  <Text style={styles.doctorMetaText}>Appointment: {doctor.appointmentNumbers || doctor.phone}</Text>
                </View>
              ) : null}

              <View style={styles.doctorActionsRow}>
                {doctor.phone ? (
                  <TouchableOpacity
                    style={styles.doctorCallBtn}
                    onPress={() => callDoctor(doctor.phone as string)}
                  >
                    <Ionicons name="call-outline" size={17} color="#047857" />
                    <Text style={styles.doctorCallText}>Call</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={styles.doctorDirectionsBtn}
                  onPress={() => openDoctorDirections(doctor)}
                >
                  <Ionicons name="navigate-outline" size={17} color="#0369a1" />
                  <Text style={styles.doctorDirectionsText}>Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 20,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369a1',
  },
  locationText: {
    fontSize: 13,
    color: '#0284c7',
    fontWeight: '600',
  },
  locationCoordinates: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  refreshLocBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshLocText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  indicatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0284c7',
  },
  indicatorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  indicatorSub: {
    fontSize: 12,
    color: '#64748b',
  },
  bodyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 18,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  bodyModelsRow: {
    flexDirection: isWeb ? 'row' : 'column',
    justifyContent: 'space-around',
    gap: 20,
  },
  bodyImageWrapper: {
    alignItems: 'center',
  },
  viewLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  imageContainer: {
    position: 'relative',
    width: 200,
    height: 420,
    alignItems: 'center',
  },
  bodyImage: {
    width: '100%',
    height: '100%',
  },
  invisibleHotspot: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotspotHighlightActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.45)',
    borderWidth: 2,
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  activeLabelBadge: {
    position: 'absolute',
    bottom: -22,
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 100,
  },
  activeLabelText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  symptomPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  pillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  pillText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
    fontSize: 14,
    color: '#0f172a',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  checkBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#10b981',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  clearBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 14,
  },
  diagnosisBox: {
    marginTop: 18,
    padding: 14,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
  },
  diagCauseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  diagCauseBody: {
    fontSize: 13,
    color: '#15803d',
    marginTop: 2,
    marginBottom: 8,
  },
  diagDoctorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  medicalDisclaimer: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    color: '#475569',
  },
  doctorsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  directorySub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 14,
  },
  doctorLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    marginBottom: 12,
  },
  doctorLoadingText: {
    flex: 1,
    fontSize: 13,
    color: '#0369a1',
    fontWeight: '600',
  },
  doctorErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    marginBottom: 12,
  },
  doctorErrorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#b91c1c',
  },
  doctorEmptyBox: {
    padding: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
  },
  doctorEmptyText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
  },
  doctorItem: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  doctorTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  doctorNumberBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
  },
  doctorNumberText: {
    color: '#0369a1',
    fontWeight: '800',
    fontSize: 12,
  },
  doctorName: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '800',
  },
  doctorSpecialty: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '600',
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  distanceText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '800',
  },
  doctorMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginTop: 5,
  },
  doctorMetaText: {
    flex: 1,
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
  },
  doctorActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  doctorCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 9,
  },
  doctorCallText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 12,
  },
  doctorDirectionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 9,
  },
  doctorDirectionsText: {
    color: '#0369a1',
    fontWeight: '700',
    fontSize: 12,
  },
  directoryBtnPrimary: {
    height: 48,
    backgroundColor: '#0284c7',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 14,
  },
  directoryBtnTextPrimary: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  directoryBtnSecondary: {
    height: 46,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 14,
  },
  directoryBtnTextSecondary: {
    color: '#0369a1',
    fontWeight: '700',
    fontSize: 13,
  },
});
