import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? "";

const DEMO_ADRESSEN = [
  "Damrak 1, 1012 LG Amsterdam",
  "Aurorastraat 49, 1363 ZH Almere",
  "Aurorastraat 12, 1363 ZH Almere",
  "Aurorastraat 5, 1363 ZG Almere",
  "Binnenhof 1, 2513 AA Den Haag",
  "Coolsingel 40, 3011 AD Rotterdam",
  "Oudegracht 229, 3511 NK Utrecht",
  "Markt 1, 5611 EC Eindhoven",
  "Grote Markt 1, 9712 HN Groningen",
  "Vrijthof 47, 6211 LE Maastricht",
  "Schiphol Plaza, 1118 BG Schiphol",
  "Stationsplein 1, 1012 AB Amsterdam Centraal",
  "Stationsplein 14, 3013 AK Rotterdam Centraal",
  "Luchthavenlaan 1, 1930 Zaventem, Brussel",
  "Grote Markt 1, 2000 Antwerpen",
  "Domplatz 1, 50667 Keulen",
  "Königsallee 1, 40212 Düsseldorf",
  "Keizersgracht 100, 1015 CK Amsterdam",
  "Herengracht 200, 1016 BS Amsterdam",
  "Blaak 40, 3011 TA Rotterdam",
  "Lange Poten 50, 2511 CK Den Haag",
];

interface Suggestie {
  place_id: string;
  description: string;
}

interface Props {
  label: string;
  waarde: string;
  onVerander: (val: string) => void;
  icoon?: string;
  toonLocatieKnop?: boolean;
}

function demoSuggesties(tekst: string): Suggestie[] {
  const q = tekst.toLowerCase();
  return DEMO_ADRESSEN.filter((p) => p.toLowerCase().includes(q))
    .slice(0, 6)
    .map((p, i) => ({ place_id: `demo-${i}-${p}`, description: p }));
}

export function LocatieInput({
  label,
  waarde,
  onVerander,
  icoon = "location-outline",
  toonLocatieKnop = false,
}: Props) {
  const colors = useColors();
  const [suggesties, setSuggesties] = useState<Suggestie[]>([]);
  const [loadingApi, setLoadingApi] = useState(false);
  const [loadingLocatie, setLoadingLocatie] = useState(false);
  const [gefocust, setGefocust] = useState(false);

  const latestQueryRef = useRef<string>("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelectingRef = useRef(false);
  const inputRef = useRef<TextInput>(null);

  const zoekSuggesties = useCallback(
    async (tekst: string) => {
      onVerander(tekst);
      latestQueryRef.current = tekst;

      if (tekst.length < 1) {
        setSuggesties([]);
        return;
      }

      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      searchTimeoutRef.current = setTimeout(async () => {
        const query = tekst;

        if (GOOGLE_API_KEY) {
          setLoadingApi(true);
          try {
            const url =
              `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
              `?input=${encodeURIComponent(query)}` +
              `&types=address` +
              `&components=country:nl|country:be|country:de` +
              `&language=nl` +
              `&key=${GOOGLE_API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();
            if (latestQueryRef.current !== query) return;
            if (data.predictions && data.predictions.length > 0) {
              setSuggesties(
                data.predictions
                  .slice(0, 6)
                  .map((p: { place_id: string; description: string }) => ({
                    place_id: p.place_id,
                    description: p.description,
                  }))
              );
            } else {
              if (latestQueryRef.current === query) {
                setSuggesties(demoSuggesties(query));
              }
            }
          } catch {
            if (latestQueryRef.current === query) {
              setSuggesties(demoSuggesties(query));
            }
          } finally {
            if (latestQueryRef.current === query) {
              setLoadingApi(false);
            }
          }
        } else {
          const demo = demoSuggesties(query);
          if (latestQueryRef.current === query) {
            setSuggesties(demo);
          }
        }
      }, 250);
    },
    [onVerander]
  );

  const kiesSuggestie = (s: Suggestie) => {
    isSelectingRef.current = true;
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    onVerander(s.description);
    setSuggesties([]);
    setGefocust(false);
    latestQueryRef.current = s.description;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    setGefocust(true);
    if (waarde.length >= 1) {
      zoekSuggesties(waarde);
    }
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      if (!isSelectingRef.current) {
        setGefocust(false);
        setSuggesties([]);
      }
    }, 500);
  };

  const wis = () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    onVerander("");
    setSuggesties([]);
    latestQueryRef.current = "";
    inputRef.current?.focus();
  };

  const gebruikHuidigeLocatie = async () => {
    setLoadingLocatie(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (GOOGLE_API_KEY) {
        const url =
          `https://maps.googleapis.com/maps/api/geocode/json` +
          `?latlng=${loc.coords.latitude},${loc.coords.longitude}` +
          `&language=nl&key=${GOOGLE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.results?.[0]) {
          onVerander(data.results[0].formatted_address);
          setSuggesties([]);
          return;
        }
      }
      const [adres] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (adres) {
        onVerander(
          [adres.street, adres.streetNumber, adres.city, adres.country]
            .filter(Boolean)
            .join(", ")
        );
      } else {
        onVerander(
          `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`
        );
      }
    } catch {
    } finally {
      setLoadingLocatie(false);
      setSuggesties([]);
    }
  };

  const toonDropdown = gefocust && suggesties.length > 0;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.input,
            borderColor: gefocust ? colors.primary : colors.border,
          },
        ]}
      >
        <Ionicons
          name={icoon as any}
          size={18}
          color={gefocust ? colors.primary : colors.mutedForeground}
        />
        <View style={styles.inputArea}>
          <Text style={[styles.labelTekst, { color: colors.mutedForeground }]}>
            {label}
          </Text>
          <TextInput
            ref={inputRef}
            value={waarde}
            onChangeText={zoekSuggesties}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Typ een adres of straatnaam..."
            placeholderTextColor={colors.mutedForeground}
            autoCorrect={false}
            autoCapitalize="words"
            spellCheck={false}
            returnKeyType="done"
            blurOnSubmit={false}
          />
        </View>
        <View style={styles.rechts}>
          {loadingApi && (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          )}
          {waarde.length > 0 && !loadingApi && (
            <TouchableOpacity
              onPress={wis}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close-circle-outline"
                size={17}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          )}
          {toonLocatieKnop && (
            <TouchableOpacity
              onPress={gebruikHuidigeLocatie}
              disabled={loadingLocatie}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              style={[styles.gpsBtn, { backgroundColor: colors.primary + "22" }]}
            >
              {loadingLocatie ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="locate-outline" size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {toonDropdown && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...(Platform.OS === "android"
                ? { elevation: 20 }
                : {
                    shadowColor: "#000",
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                  }),
            },
          ]}
        >
          <FlatList
            data={suggesties}
            keyExtractor={(item) => item.place_id}
            scrollEnabled={false}
            keyboardShouldPersistTaps="always"
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPressIn={() => {
                  isSelectingRef.current = true;
                  if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                }}
                onPress={() => kiesSuggestie(item)}
                activeOpacity={0.7}
                style={[
                  styles.suggestieRij,
                  index < suggesties.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.suggestieIcon, { backgroundColor: colors.primary + "22" }]}>
                  <Ionicons name="location-outline" size={13} color={colors.primary} />
                </View>
                <Text
                  style={[styles.suggestieTekst, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
                <Ionicons name="return-up-back-outline" size={13} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          />
          {!GOOGLE_API_KEY && (
            <View style={[styles.demoRij, { borderTopColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={11} color={colors.mutedForeground} />
              <Text style={[styles.demoTekst, { color: colors.mutedForeground }]}>
                Demo-modus - voeg Google Maps API-sleutel toe
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "relative", zIndex: 1 },
  container: {
    flexDirection: "row", alignItems: "center", borderRadius: 14,
    borderWidth: 2, paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  inputArea: { flex: 1 },
  labelTekst: {
    fontSize: 10, fontFamily: "Inter_500Medium",
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3,
  },
  input: { fontSize: 16, fontFamily: "Inter_500Medium", padding: 0, margin: 0 },
  rechts: { flexDirection: "row", alignItems: "center", gap: 8 },
  gpsBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  dropdown: {
    position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6,
    borderRadius: 14, borderWidth: 1, overflow: "hidden", zIndex: 9999,
  },
  suggestieRij: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  suggestieIcon: { width: 26, height: 26, borderRadius: 7, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  suggestieTekst: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  demoRij: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1 },
  demoTekst: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
});
