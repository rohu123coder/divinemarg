import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../../lib/api";
import {
  findCityByCoordinates,
  searchCities,
} from "../../lib/data/indianCities";
import { INDIAN_STATES, type IndianState } from "../../lib/data/indianStates";
import { geocodePlace, type GeocodeResult } from "../../lib/geocode";
import { useAppStore } from "../../lib/store";
import {
  fetchPincodeData,
  getStateCoordinates,
  pincodeStateMatchesSelection,
} from "../../lib/services/pincodeService";

const MARITAL_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "engaged", label: "Engaged" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

const OCCUPATION_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "job", label: "Job/Service" },
  { value: "business", label: "Business" },
  { value: "housewife", label: "Housewife" },
  { value: "retired", label: "Retired" },
  { value: "other", label: "Other" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYmd(s: string | null | undefined): Date {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(1995, 0, 1);
  }
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatHm(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function parseHm(s: string | null | undefined): Date {
  const d = new Date();
  if (s && /^\d{1,2}:\d{2}$/.test(s.trim())) {
    const [h, m] = s.split(":").map(Number);
    d.setHours(h ?? 0, m ?? 0, 0, 0);
  } else {
    d.setHours(12, 0, 0, 0);
  }
  return d;
}

function parseSavedManualPlace(
  placeName: string
): { city: string; state: string; pincode: string } | null {
  const m = placeName.match(/^(.+),\s*(.+)\s-\s*(\d{6})$/);
  if (!m) return null;
  return { city: m[1].trim(), state: m[2].trim(), pincode: m[3] };
}

export default function BirthDetailsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === "true";
  const setProfileComplete = useAppStore((state) => state.setProfileComplete);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dob, setDob] = useState(new Date(1995, 0, 1));
  const [tob, setTob] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showTobPicker, setShowTobPicker] = useState(false);
  const [gender, setGender] = useState<string | null>(null);
  const [maritalStatus, setMaritalStatus] = useState<string | null>(null);
  const [occupation, setOccupation] = useState<string | null>(null);

  const [citySearch, setCitySearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{
    placeName: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [filteredCities, setFilteredCities] = useState<
    ReturnType<typeof searchCities>
  >([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const [geocodeResults, setGeocodeResults] = useState<GeocodeResult[]>([]);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const geocodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCity, setManualCity] = useState("");
  const [manualState, setManualState] = useState<IndianState | null>(null);
  const [manualPincode, setManualPincode] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);

  useEffect(() => {
    if (citySearch.length >= 2) {
      const results = searchCities(citySearch);
      setFilteredCities(results);
    } else {
      setFilteredCities([]);
      setShowCityDropdown(false);
      setShowNoResults(false);
    }

    if (geocodeDebounceRef.current) {
      clearTimeout(geocodeDebounceRef.current);
      geocodeDebounceRef.current = null;
    }

    if (citySearch.length >= 3) {
      setGeocodeLoading(true);
      geocodeDebounceRef.current = setTimeout(() => {
        void geocodePlace(citySearch)
          .then((results) => {
            setGeocodeResults(results);
          })
          .catch(() => {
            setGeocodeResults([]);
          })
          .finally(() => {
            setGeocodeLoading(false);
          });
      }, 400);
    } else {
      setGeocodeResults([]);
      setGeocodeLoading(false);
    }

    return () => {
      if (geocodeDebounceRef.current) {
        clearTimeout(geocodeDebounceRef.current);
        geocodeDebounceRef.current = null;
      }
    };
  }, [citySearch]);

  useEffect(() => {
    if (citySearch.length < 2) return;

    const hasLocal = filteredCities.length > 0;
    const hasGeocode = geocodeResults.length > 0;
    const waitingOnGeocode = citySearch.length >= 3 && geocodeLoading;

    setShowCityDropdown(hasLocal || hasGeocode || waitingOnGeocode);
    setShowNoResults(!hasLocal && !hasGeocode && !waitingOnGeocode);
  }, [citySearch, filteredCities, geocodeResults, geocodeLoading]);

  function getFinalLocationData():
    | { placeName: string; lat: number; lng: number }
    | null {
    return selectedLocation;
  }

  async function resolveManualCoordinates(
    villageName: string,
    district: string,
    stateName: string
  ): Promise<{ lat: number; lng: number } | null> {
    const geocodeQuery = `${villageName}, ${district}, ${stateName}, India`;
    const geo = await geocodePlace(geocodeQuery);
    if (geo.length > 0) {
      return { lat: geo[0].lat, lng: geo[0].lng };
    }
    const fb = getStateCoordinates(stateName);
    return fb ? { lat: fb.lat, lng: fb.lng } : null;
  }

  async function handlePincodeLookup() {
    if (!/^\d{6}$/.test(manualPincode)) {
      Alert.alert("Invalid Pincode", "Pincode 6 digits ka hona chahiye");
      return;
    }
    if (!manualCity.trim()) {
      Alert.alert("City Required", "Apna city/village name daalein");
      return;
    }
    if (!manualState) {
      Alert.alert("State Required", "State select karein");
      return;
    }

    setPincodeLoading(true);
    try {
      const villageName = manualCity.trim();
      const pincodeData = await fetchPincodeData(manualPincode);
      let coords: { lat: number; lng: number } | null = null;

      if (pincodeData) {
        if (!pincodeStateMatchesSelection(pincodeData.state, manualState)) {
          Alert.alert(
            "Mismatch",
            `Pincode ${manualPincode} ${pincodeData.state} ka hai, ${manualState.name} ka nahi. Sahi state select karein.`
          );
          setPincodeLoading(false);
          return;
        }
        coords = await resolveManualCoordinates(
          villageName,
          pincodeData.district,
          pincodeData.state
        );
      } else {
        coords = await resolveManualCoordinates(
          villageName,
          villageName,
          manualState.name
        );
      }

      if (!coords) {
        Alert.alert("Error", "State coordinates missing.");
        setPincodeLoading(false);
        return;
      }

      setSelectedLocation({
        placeName: `${villageName}, ${manualState.name} - ${manualPincode}`,
        lat: coords.lat,
        lng: coords.lng,
      });
      setShowManualEntry(false);

      Alert.alert(
        "Confirmed!",
        `${villageName}, ${manualState.name} - ${manualPincode}\nLocation saved.`
      );
    } catch {
      const villageName = manualCity.trim();
      try {
        const coords = await resolveManualCoordinates(
          villageName,
          villageName,
          manualState!.name
        );
        if (coords) {
          setSelectedLocation({
            placeName: `${villageName}, ${manualState!.name} - ${manualPincode}`,
            lat: coords.lat,
            lng: coords.lng,
          });
          setShowManualEntry(false);
          Alert.alert(
            "Using approximate location",
            "Pincode service unavailable — geocode or state center coordinates use ho rahe hain."
          );
        } else {
          Alert.alert("Error", "Pincode lookup failed. Try again.");
        }
      } catch {
        Alert.alert("Error", "Pincode lookup failed. Try again.");
      }
    } finally {
      setPincodeLoading(false);
    }
  }

  const loadExisting = useCallback(async () => {
    try {
      const res = await api.get("/api/users/birth-details");
      const data = res.data?.data;
      if (data?.dateOfBirth) {
        setDob(parseYmd(data.dateOfBirth));
      }
      if (data?.timeOfBirth) {
        setTob(parseHm(data.timeOfBirth));
      }
      if (data?.gender) {
        setGender(String(data.gender).toLowerCase());
      }
      if (data?.maritalStatus) {
        setMaritalStatus(String(data.maritalStatus).toLowerCase());
      }
      if (data?.occupation) {
        setOccupation(String(data.occupation).toLowerCase());
      }

      const lat = data?.lat != null ? Number(data.lat) : null;
      const lng = data?.lng != null ? Number(data.lng) : null;
      const placeName =
        typeof data?.placeName === "string" ? data.placeName : "";

      if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
        const hit = findCityByCoordinates(lat, lng);
        if (hit) {
          setSelectedLocation({
            placeName: `${hit.name}, ${hit.state}`,
            lat,
            lng,
          });
        } else {
          const parsed = parseSavedManualPlace(placeName);
          if (parsed) {
            setSelectedLocation({
              placeName: `${parsed.city}, ${parsed.state} - ${parsed.pincode}`,
              lat,
              lng,
            });
          } else if (placeName) {
            setSelectedLocation({ placeName, lat, lng });
          }
        }
      }
    } catch {
      Alert.alert("Error", "Could not load your details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !isOnboarding,
    });
  }, [isOnboarding, navigation]);

  const handleSave = async () => {
    const location = getFinalLocationData();
    if (!location) {
      Alert.alert(
        "Birth Place Required",
        "Apna birth place select karein ya manually daalein"
      );
      return;
    }

    const dobStr = formatYmd(dob);
    const tobStr = formatHm(tob);
    setSaving(true);
    try {
      await api.patch("/api/users/birth-details", {
        dateOfBirth: dobStr,
        timeOfBirth: tobStr,
        placeName: location.placeName,
        lat: location.lat,
        lng: location.lng,
        utcOffset: 5.5,
        gender: gender || null,
        maritalStatus: maritalStatus || null,
        occupation: occupation || null,
      });
      setProfileComplete(true);
      if (isOnboarding) {
        router.replace("/(tabs)");
      } else {
        Alert.alert("Saved", "Your details were updated.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Save failed";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 40 }} color="#7C3AED" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        {!isOnboarding ? (
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
        ) : (
          <View style={{ width: 28, marginRight: 8 }} />
        )}
        <Text style={styles.headerTitle}>
          {isOnboarding ? "Complete your profile" : "My details"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <Text style={styles.hint}>
          Birth place and time help us give accurate predictions. You can edit anytime.
        </Text>

        <Text style={styles.label}>Date of birth</Text>
        <Pressable style={styles.fieldBtn} onPress={() => setShowDobPicker(true)}>
          <Text style={styles.fieldTxt}>{formatYmd(dob)}</Text>
        </Pressable>
        {showDobPicker && (
          <DateTimePicker
            value={dob}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              if (Platform.OS === "android") {
                setShowDobPicker(false);
              }
              if (event.type === "dismissed") return;
              if (date) setDob(date);
            }}
          />
        )}
        {Platform.OS === "ios" && showDobPicker ? (
          <Pressable style={styles.doneAndroid} onPress={() => setShowDobPicker(false)}>
            <Text style={styles.doneAndroidTxt}>Done</Text>
          </Pressable>
        ) : null}

        <Text style={styles.label}>Time of birth</Text>
        <Pressable style={styles.fieldBtn} onPress={() => setShowTobPicker(true)}>
          <Text style={styles.fieldTxt}>{formatHm(tob)}</Text>
        </Pressable>
        {showTobPicker && (
          <DateTimePicker
            value={tob}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              if (Platform.OS === "android") {
                setShowTobPicker(false);
              }
              if (event.type === "dismissed") return;
              if (date) setTob(date);
            }}
          />
        )}
        {Platform.OS === "ios" && showTobPicker ? (
          <Pressable style={styles.doneAndroid} onPress={() => setShowTobPicker(false)}>
            <Text style={styles.doneAndroidTxt}>Done</Text>
          </Pressable>
        ) : null}

        <View style={{ marginBottom: 24 }}>
          <Text style={styles.label}>Birth place *</Text>

          {selectedLocation && (() => {
            const parsedManual = parseSavedManualPlace(selectedLocation.placeName);
            return (
            <View
              style={[
                styles.selectedBadge,
                parsedManual ? { flexDirection: "column", alignItems: "stretch" } : undefined,
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.selectedBadgeText}>
                  📍 {selectedLocation.placeName}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedLocation(null);
                    setCitySearch("");
                    setShowManualEntry(false);
                    setManualCity("");
                    setManualState(null);
                    setManualPincode("");
                  }}
                >
                  <Text style={{ color: "#FF6B35", fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              </View>
              {parsedManual ? (
                <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  Pincode: {parsedManual.pincode}
                </Text>
              ) : null}
            </View>
            );
          })()}

          {!selectedLocation && (
            <>
              <TextInput
                value={citySearch}
                onChangeText={(text) => {
                  setCitySearch(text);
                  setSelectedLocation(null);
                }}
                placeholder="Type your city name (e.g., Gwalior, Mumbai, Patna)"
                style={styles.input}
                placeholderTextColor="#999"
              />

              {showCityDropdown &&
                (filteredCities.length > 0 ||
                  geocodeResults.length > 0 ||
                  geocodeLoading) && (
                <View style={styles.dropdown}>
                  <ScrollView
                    style={{ maxHeight: 280 }}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    {filteredCities.map((city, idx) => (
                      <TouchableOpacity
                        key={`${city.name}-${city.state}-${idx}`}
                        onPress={() => {
                          setSelectedLocation({
                            placeName: `${city.name}, ${city.state}`,
                            lat: city.lat,
                            lng: city.lng,
                          });
                          setCitySearch("");
                          setShowCityDropdown(false);
                          setShowNoResults(false);
                          setGeocodeResults([]);
                        }}
                        style={styles.dropdownItem}
                      >
                        <View>
                          <Text style={styles.dropdownCityName}>📍 {city.name}</Text>
                          <Text style={styles.dropdownStateName}>{city.state}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}

                    {(geocodeLoading || geocodeResults.length > 0) &&
                    citySearch.length >= 3 ? (
                      <>
                        <View style={styles.geocodeSectionHeader}>
                          <Text style={styles.geocodeSectionTitle}>More places</Text>
                          {geocodeLoading ? (
                            <ActivityIndicator size="small" color="#FF6B35" />
                          ) : null}
                        </View>
                        {geocodeResults.map((r, idx) => (
                          <TouchableOpacity
                            key={`geo-${r.lat}-${r.lng}-${idx}`}
                            onPress={() => {
                              setSelectedLocation({
                                placeName: r.formattedAddress || r.city,
                                lat: r.lat,
                                lng: r.lng,
                              });
                              setCitySearch("");
                              setShowCityDropdown(false);
                              setShowNoResults(false);
                              setGeocodeResults([]);
                            }}
                            style={styles.dropdownItem}
                          >
                            <Text style={styles.dropdownCityName}>
                              📍 {r.formattedAddress || r.city}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </>
                    ) : null}
                  </ScrollView>
                </View>
              )}

              {showNoResults && !showManualEntry && citySearch.length >= 2 && (
                <View style={styles.noResultsBox}>
                  <Text style={styles.noResultsTitle}>
                    &quot;{citySearch}&quot; nahi mila
                  </Text>
                  <Text style={styles.noResultsSubtitle}>
                    Village ya small town hai? Manually daalein
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowManualEntry(true);
                      setManualCity(citySearch);
                      setShowNoResults(false);
                      setCitySearch("");
                    }}
                    style={styles.manualEntryButton}
                  >
                    <Text style={styles.manualEntryButtonText}>Add Manually</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {showManualEntry && !selectedLocation && (
            <View style={styles.manualForm}>
              <Text style={styles.manualFormTitle}>Apni location daalein</Text>

              <Text style={styles.label}>City / village name *</Text>
              <TextInput
                value={manualCity}
                onChangeText={setManualCity}
                placeholder="e.g., Gohad, Bhind"
                style={styles.input}
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>State *</Text>
              <ScrollView
                style={{ maxHeight: 200, marginVertical: 8 }}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {INDIAN_STATES.map((state) => (
                  <TouchableOpacity
                    key={state.code}
                    onPress={() => setManualState(state)}
                    style={{
                      padding: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: "#eee",
                      backgroundColor:
                        manualState?.code === state.code ? "#FFF4EF" : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        color: manualState?.code === state.code ? "#FF6B35" : "#333",
                        fontWeight: manualState?.code === state.code ? "600" : "400",
                      }}
                    >
                      {state.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                value={manualPincode}
                onChangeText={(text) =>
                  setManualPincode(text.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="e.g., 475220"
                style={styles.input}
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={6}
              />
              <Text style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                Accurate kundali ke liye pincode zaroori hai
              </Text>

              <TouchableOpacity
                onPress={() => void handlePincodeLookup()}
                disabled={pincodeLoading}
                style={[styles.confirmButton, { opacity: pincodeLoading ? 0.6 : 1 }]}
              >
                {pincodeLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm location</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowManualEntry(false);
                  setManualCity("");
                  setManualState(null);
                  setManualPincode("");
                }}
                style={{ alignItems: "center", marginTop: 12 }}
              >
                <Text style={{ color: "#888" }}>← Back to search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.label}>Gender</Text>
        <View style={styles.wrap}>
          {GENDER_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() =>
                setGender(opt.value === gender ? null : opt.value)
              }
              style={[styles.chip, gender === opt.value && styles.chipOn]}
            >
              <Text style={[styles.chipTxt, gender === opt.value && styles.chipTxtOn]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Marital status</Text>
        <View style={styles.wrap}>
          {MARITAL_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() =>
                setMaritalStatus(opt.value === maritalStatus ? null : opt.value)
              }
              style={[styles.chip, maritalStatus === opt.value && styles.chipOn]}
            >
              <Text
                style={[
                  styles.chipTxt,
                  maritalStatus === opt.value && styles.chipTxtOn,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Occupation</Text>
        <View style={styles.wrap}>
          {OCCUPATION_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() =>
                setOccupation(opt.value === occupation ? null : opt.value)
              }
              style={[styles.chip, occupation === opt.value && styles.chipOn]}
            >
              <Text
                style={[styles.chipTxt, occupation === opt.value && styles.chipTxtOn]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={() => void handleSave()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveTxt}>Save</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  back: { fontSize: 28, color: "#1A1A2E", marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  scroll: { padding: 16, paddingBottom: 40 },
  hint: { fontSize: 14, color: "#6B7280", marginBottom: 16, lineHeight: 20 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 4,
  },
  fieldBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  fieldTxt: { fontSize: 16, color: "#1A1A2E" },
  doneAndroid: { alignSelf: "flex-end", marginBottom: 8 },
  doneAndroidTxt: { color: "#7C3AED", fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#1A1A2E",
    marginBottom: 8,
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#FFF4EF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF6B35",
    marginBottom: 8,
  },
  selectedBadgeText: {
    color: "#FF6B35",
    fontWeight: "600",
    fontSize: 14,
    flex: 1,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownCityName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  dropdownStateName: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  geocodeSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  geocodeSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  noResultsBox: {
    padding: 16,
    backgroundColor: "#FFF9E6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFD700",
    marginTop: 8,
    alignItems: "center",
  },
  noResultsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  noResultsSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },
  manualEntryButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  manualEntryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  manualForm: {
    padding: 16,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    marginTop: 8,
  },
  manualFormTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmButton: {
    backgroundColor: "#FF6B35",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipOn: {
    borderColor: "#FF6B35",
    backgroundColor: "#FFF4EF",
  },
  chipTxt: { fontSize: 13, color: "#666", fontWeight: "500" },
  chipTxtOn: { color: "#FF6B35" },
  saveBtn: {
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
