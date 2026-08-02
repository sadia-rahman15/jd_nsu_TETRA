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
  const [locating, setLocating] = useState<boolean>(false);

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

  const detectUserLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserCity('Dhaka');
        setLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const detailed = await fetchDetailedAddress(location.coords.latitude, location.coords.longitude);

      if (detailed && (detailed.area || detailed.city)) {
        setUserArea(detailed.area);
        setUserCity(detailed.city);
      } else {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          setUserArea(place.district || place.street || '');
          setUserCity(place.city || place.subregion || 'Dhaka');
        }
      }
    } catch (error) {
      console.warn('Location detection failed:', error);
      setUserCity('Dhaka');
    } finally {
      setLocating(false);
    }
  };

  const handlePartClick = (partId: string, partName: string) => {
    setActivePartId(partId);
    setActivePartName(partName);
    setSelectedSymptom('');
    setDiagnosisResult(null);
  };

  const handleCheckSymptom = () => {
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
    const diag = partConfig?.diagnosis[input];

    if (diag) {
      setDiagnosisResult(diag);
    } else {
      const fallbackDoctor = partConfig?.defaultDoctorType || 'General Specialist';
      setDiagnosisResult({
        cause: 'General symptom reported. A physical consultation with a specialist is recommended.',
        doctorType: fallbackDoctor,
      });
    }
  };

  const clearSelections = () => {
    setActivePartId(null);
    setActivePartName('None selected');
    setSelectedSymptom('');
    setCustomSymptomInput('');
    setDiagnosisResult(null);
  };

  // Open Live Doctor Directory for exact User City & Area anywhere in Bangladesh
  const openDirectorySearch = (platform: 'google' | 'sasthyaseba' | 'doctorbd') => {
    const specialty = diagnosisResult?.doctorType || 'Specialist Doctor';
    const loc = userArea ? `${userArea.split(',')[0]}, ${userCity}` : userCity;

    if (platform === 'sasthyaseba') {
      const query = encodeURIComponent(`${specialty} ${loc}`);
      Linking.openURL(`https://sasthyaseba.com/search?q=${query}`);
    } else if (platform === 'doctorbd') {
      const query = encodeURIComponent(`${specialty} doctor in ${loc}`);
      Linking.openURL(`https://www.google.com/search?q=${query}+site:docbd.com+OR+site:doctorbangladesh.com`);
    } else {
      const query = encodeURIComponent(`${specialty} doctors near ${loc} Bangladesh`);
      Linking.openURL(`https://www.google.com/search?q=${query}`);
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
          Touch any area on the body model to reveal related health insights and find verified doctors in your exact district across Bangladesh.
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
          </View>
        </View>
        <TouchableOpacity style={styles.refreshLocBtn} onPress={detectUserLocation} disabled={locating}>
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
              <Image source={require('./body1299.jpg')} style={styles.bodyImage} resizeMode="contain" />

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
              <Image source={require('./body2299.jpg')} style={styles.bodyImage} resizeMode="contain" />

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
            <Text style={styles.diagCauseTitle}>Possible Cause:</Text>
            <Text style={styles.diagCauseBody}>{diagnosisResult.cause}</Text>
            <Text style={styles.diagDoctorTitle}>
              Suggested Specialty: <Text style={{ color: '#0284c7' }}>{diagnosisResult.doctorType}</Text>
            </Text>
          </View>
        ) : null}
      </View>

      {diagnosisResult ? (
        <View style={styles.doctorsCard}>
          <Text style={styles.cardHeader}>
            Find {diagnosisResult.doctorType} Doctors near {userArea ? userArea.split(',')[0] : userCity}
          </Text>

          <Text style={styles.directorySub}>
            Select a verified healthcare registry to browse active {diagnosisResult.doctorType} specialists in {userCity}:
          </Text>

          <TouchableOpacity
            style={styles.directoryBtnPrimary}
            onPress={() => openDirectorySearch('google')}
          >
            <Ionicons name="search-outline" size={20} color="#ffffff" />
            <Text style={styles.directoryBtnTextPrimary}>
              Find Local {diagnosisResult.doctorType} Doctors near {userArea ? userArea.split(',')[0] : userCity}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.directoryBtnSecondary}
            onPress={() => openDirectorySearch('sasthyaseba')}
          >
            <Ionicons name="medical-outline" size={20} color="#0284c7" />
            <Text style={styles.directoryBtnTextSecondary}>
              Search on Sasthya Seba Bangladesh
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.directoryBtnSecondary}
            onPress={() => openDirectorySearch('doctorbd')}
          >
            <Ionicons name="newspaper-outline" size={20} color="#0284c7" />
            <Text style={styles.directoryBtnTextSecondary}>
              Search Doctor Bangladesh Registry
            </Text>
          </TouchableOpacity>
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
