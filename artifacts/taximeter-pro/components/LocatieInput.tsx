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

const PHOTON_URL = "https://photon.komoot.io/api/";
const PHOTON_REVERSE_URL = "https://photon.komoot.io/reverse";

const DEMO_SUGGESTIES: Suggestie[] = [
  { place_id: "demo-0", description: "Damrak 1, 1012 LG Amsterdam", mainText: "Damrak 1", secondaryText: "1012 LG Amsterdam", isPoi: false },
  { place_id: "demo-1", description: "Hotel Krasnapolsky, Dam 9, 1012 JS Amsterdam", mainText: "Hotel Krasnapolsky", secondaryText: "Dam 9, Amsterdam", isPoi: true },
  { place_id: "demo-2", description: "Johan Cruijff Arena, Arena Boulevard 1, 1101 AX Amsterdam", mainText: "Johan Cruijff Arena", secondaryText: "Amsterdam Zuidoost", isPoi: true },
  { place_id: "demo-3", description: "Amsterdam Airport Schiphol, 1118 CP Schiphol", mainText: "Amsterdam Airport Schiphol", secondaryText: "Schiphol", isPoi: true },
  { place_id: "demo-4", description: "Binnenhof 1, 2513 AA Den Haag", mainText: "Binnenhof 1", secondaryText: "2513 AA Den Haag", isPoi: false },
  { place_id: "demo-5", description: "Coolsingel 40, 3011 AD Rotterdam", mainText: "Coolsingel 40", secondaryText: "3011 AD Rotterdam", isPoi: false },
  { place_id: "demo-6", description: "Rotterdam Centraal, Stationsplein, 3013 AJ Rotterdam", mainText: "Rotterdam Centraal", secondaryText: "Rotterdam", isPoi: true },
  { place_id: "demo-7", description: "Markthal Rotterdam, Dominee Jan Scharpstraat 298, Rotterdam", mainText: "Markthal Rotterdam", secondaryText: "Rotterdam", isPoi: true },
  { place_id: "demo-8", description: "Oudegracht 229, 3511 NK Utrecht", mainText: "Oudegracht 229", secondaryText: "3511 NK Utrecht", isPoi: false },
  { place_id: "demo-9", description: "Rijksmuseum, Museumstraat 1, 1071 XX Amsterdam", mainText: "Rijksmuseum", secondaryText: "Amsterdam", isPoi: true },
];

interface Suggestie {
  place_id: string;
  description: string;
  mainText: string;
  secondaryText: string;
  isPoi: boolean;
}

interface PhotonProperties {
  osm_id?: number;
  osm_type?: string;
  osm_key?: string;
  osm_value?: string;
  name?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  district?: string;
  county?: string;
  country?: string;
  type?: string;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: PhotonProperties;
}

const POI_WAARDEN = new Set([
  "hospital", "hotel", "restaurant", "museum", "stadium", "airport",
  "station", "university", "school", "theatre", "cinema", "supermarket",
  "park", "attraction", "monument", "library", "pharmacy", "bank",
  "shopping_mall", "department_store", "marketplace", "sports_centre",
  "zoo", "theme_park", "aquarium", "place_of_worship", "nursing_home",
  "clinic", "kindergarten", "college", "bus_station", "ferry_terminal",
]);

function bouwAdres(props: PhotonProperties): string {
  const delen: string[] = [];
  if (props.name) delen.push(props.name);
  if (props.street) {
    delen.push(props.housenumber ? `${props.street} ${props.housenumber}` : props.street);
  }
  if (props.postcode && props.city) delen.push(`${props.postcode} ${props.city}`);
  else if (props.city) delen.push(props.city);
  else if (props.district) delen.push(props.district);
  else if (props.county) delen.push(props.county);
  if (props.country && props.country !== "Netherlands" && props.country !== "Nederland") {
    delen.push(props.country);
  }
  return delen.filter(Boolean).join(", ");
}

function photonNaarSuggestie(f: PhotonFeature): Suggestie | null {
  const props = f.properties;
  const description = bouwAdres(props);
  if (!description) return null;

  const heeftNaam = !!props.name;
  const mainText = heeftNaam
    ? props.name!
    : props.street
    ? props.housenumber
      ? `${props.street} ${props.housenumber}`
      : props.street
    : description;
  const secondaryText = props.city
    ? props.postcode
      ? `${props.postcode} ${props.city}`
      : props.city
    : props.country ?? "";
  const isPoi =
    heeftNaam &&
    (POI_WAARDEN.has(props.osm_value ?? "") || POI_WAARDEN.has(props.osm_key ?? ""));
  const placeId = `${props.osm_type ?? "X"}${props.osm_id ?? String(Math.random())}`;

  return { place_id: placeId, description, mainText, secondaryText, isPoi };
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
  return DEMO_SUGGESTIES.filter(
    (s) => s.description.toLowerCase().includes(q) || s.mainText.toLowerCase().includes(q)
  ).slice(0, 6);
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
        setLoadingApi(true);
        try {
          let lat: number | null = null;
          let lon: number | null = null;
          try {
            const loc = await Location.getLastKnownPositionAsync();
            if (loc) {
              lat = loc.coords.latitude;
              lon = loc.coords.longitude;
            }
          } catch {}

          const url =
            `${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=8&lang=nl` +
            (lat !== null && lon !== null ? `&lat=${lat}&lon=${lon}` : "");

          const res = await fetch(url);
          if (latestQueryRef.current !== query) return;
          const data = await res.json();
          if (latestQueryRef.current !== query) return;

          const gevonden: Suggestie[] = (data.features ?? [])
            .map((f: PhotonFeature) => photonNaarSuggestie(f))
            .filter((s: Suggestie | null): s is Suggestie => s !== null)
            .slice(0, 8);

          if (gevonden.length > 0) {
            setSuggesties(gevonden);
          } else {
            setSuggesties(demoSuggesties(query));
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
      }, 300);
    },
    [onVerander]
  );

  const kiesSuggestie = (s: Suggestie) => {
    isSelectingRef.current = true;
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    onVerander(s.description);
    latestQueryRef.current = s.description;
    setSuggesties([]);
    setGefocust(false);

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

      try {
        const reverseUrl =
          `${PHOTON_REVERSE_URL}?lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&lang=nl`;
        const res = await fetch(reverseUrl);
        const data = await res.json();
        if (data.features?.[0]) {
          const adres = bouwAdres(data.features[0].properties);
          if (adres) {
            onVerander(adres);
            setSuggesties([]);
            return;
          }
        }
      } catch {}

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
            placeholder="Adres, hotel, bedrijf of locatie..."
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
                  <Ionicons
                    name={item.isPoi ? "business-outline" : "location-outline"}
                    size={13}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.suggestieTekstWrapper}>
                  <Text
                    style={[styles.suggestieHoofd, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {item.mainText}
                  </Text>
                  {item.secondaryText ? (
                    <Text
                      style={[styles.suggestieSub, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {item.secondaryText}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="return-up-back-outline" size={13} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "relative", zIndex: 1, overflow: "visible" },
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
    paddingHorizontal: 14, paddingVertical: 11,
  },
  suggestieIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  suggestieTekstWrapper: { flex: 1, gap: 1 },
  suggestieHoofd: { fontSize: 14, fontFamily: "Inter_500Medium" },
  suggestieSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
