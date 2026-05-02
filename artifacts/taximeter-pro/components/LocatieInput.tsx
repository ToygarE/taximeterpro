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
import { MAPS_FETCH_OPTS } from "@/utils/berekeningen";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? "";

const DEMO_SUGGESTIES: Suggestie[] = [
  { place_id: "demo-0", description: "Damrak 1, 1012 LG Amsterdam", mainText: "Damrak 1", secondaryText: "Amsterdam", isPoi: false },
  { place_id: "demo-1", description: "Hotel Krasnapolsky, Dam 9, Amsterdam", mainText: "Hotel Krasnapolsky", secondaryText: "Dam 9, Amsterdam", isPoi: true },
  { place_id: "demo-2", description: "Johan Cruijff Arena, Amsterdam Zuidoost", mainText: "Johan Cruijff Arena", secondaryText: "Amsterdam Zuidoost", isPoi: true },
  { place_id: "demo-3", description: "Amsterdam Airport Schiphol, 1118 CP Schiphol", mainText: "Amsterdam Airport Schiphol", secondaryText: "Schiphol", isPoi: true },
  { place_id: "demo-4", description: "Binnenhof 1, 2513 AA Den Haag", mainText: "Binnenhof 1", secondaryText: "Den Haag", isPoi: false },
  { place_id: "demo-5", description: "Coolsingel 40, 3011 AD Rotterdam", mainText: "Coolsingel 40", secondaryText: "Rotterdam", isPoi: false },
  { place_id: "demo-6", description: "Rotterdam Centraal, Stationsplein, Rotterdam", mainText: "Rotterdam Centraal", secondaryText: "Stationsplein, Rotterdam", isPoi: true },
  { place_id: "demo-7", description: "Markthal Rotterdam, Dominee Jan Scharpstraat 298, Rotterdam", mainText: "Markthal Rotterdam", secondaryText: "Rotterdam", isPoi: true },
  { place_id: "demo-8", description: "Oudegracht 229, 3511 NK Utrecht", mainText: "Oudegracht 229", secondaryText: "Utrecht", isPoi: false },
  { place_id: "demo-9", description: "Rijksmuseum, Museumstraat 1, Amsterdam", mainText: "Rijksmuseum", secondaryText: "Museumstraat 1, Amsterdam", isPoi: true },
  { place_id: "demo-10", description: "De Bijenkorf, Dam 1, Amsterdam", mainText: "De Bijenkorf", secondaryText: "Dam 1, Amsterdam", isPoi: true },
  { place_id: "demo-11", description: "Keizersgracht 100, 1015 CK Amsterdam", mainText: "Keizersgracht 100", secondaryText: "Amsterdam", isPoi: false },
  { place_id: "demo-12", description: "Vrijthof 47, 6211 LE Maastricht", mainText: "Vrijthof 47", secondaryText: "Maastricht", isPoi: false },
  { place_id: "demo-13", description: "Grote Markt 1, 9712 HN Groningen", mainText: "Grote Markt 1", secondaryText: "Groningen", isPoi: false },
  { place_id: "demo-14", description: "Eindhoven Airport, Luchthavenweg 25, Eindhoven", mainText: "Eindhoven Airport", secondaryText: "Luchthavenweg, Eindhoven", isPoi: true },
];

interface Suggestie {
  place_id: string;
  description: string;
  mainText: string;
  secondaryText: string;
  isPoi: boolean;
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
    (s) =>
      s.description.toLowerCase().includes(q) ||
      s.mainText.toLowerCase().includes(q)
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

        if (GOOGLE_API_KEY) {
          setLoadingApi(true);
          try {
            const url =
              `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
              `?input=${encodeURIComponent(query)}` +
              `&components=country:nl|country:be|country:de` +
              `&language=nl` +
              `&key=${GOOGLE_API_KEY}`;
            const res = await fetch(url, MAPS_FETCH_OPTS);
            const data = await res.json();
            if (latestQueryRef.current !== query) return;
            if (data.predictions && data.predictions.length > 0) {
              setSuggesties(
                data.predictions
                  .slice(0, 6)
                  .map((p: {
                    place_id: string;
                    description: string;
                    types?: string[];
                    structured_formatting?: {
                      main_text?: string;
                      secondary_text?: string;
                    };
                  }) => ({
                    place_id: p.place_id,
                    description: p.description,
                    mainText: p.structured_formatting?.main_text ?? p.description,
                    secondaryText: p.structured_formatting?.secondary_text ?? "",
                    isPoi: !!(p.types && (
                      p.types.includes("establishment") ||
                      p.types.includes("point_of_interest") ||
                      p.types.includes("lodging") ||
                      p.types.includes("stadium") ||
                      p.types.includes("airport")
                    )),
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

  const kiesSuggestie = async (s: Suggestie) => {
    isSelectingRef.current = true;
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    onVerander(s.description);
    latestQueryRef.current = s.description;
    setSuggesties([]);
    setGefocust(false);

    if (GOOGLE_API_KEY && !s.place_id.startsWith("demo-")) {
      setLoadingApi(true);
      try {
        const detailsUrl =
          `https://maps.googleapis.com/maps/api/place/details/json` +
          `?place_id=${encodeURIComponent(s.place_id)}` +
          `&fields=formatted_address,geometry` +
          `&language=nl` +
          `&key=${GOOGLE_API_KEY}`;
        const res = await fetch(detailsUrl, MAPS_FETCH_OPTS);
        const data = await res.json();
        if (data.result?.formatted_address) {
          onVerander(data.result.formatted_address);
          latestQueryRef.current = data.result.formatted_address;
        }
      } catch {}
      finally {
        setLoadingApi(false);
      }
    }

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
        const res = await fetch(url, MAPS_FETCH_OPTS);
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
          {!GOOGLE_API_KEY && (
            <View style={[styles.demoRij, { borderTopColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={11} color={colors.mutedForeground} />
              <Text style={[styles.demoTekst, { color: colors.mutedForeground }]}>
                Demo-modus — voeg Google Maps API-sleutel toe
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
    paddingHorizontal: 14, paddingVertical: 11,
  },
  suggestieIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  suggestieTekstWrapper: { flex: 1, gap: 1 },
  suggestieHoofd: { fontSize: 14, fontFamily: "Inter_500Medium" },
  suggestieSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  demoRij: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1 },
  demoTekst: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
});
