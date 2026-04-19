import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useState } from "react";
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

// Fallback suggestions voor demo-modus (zonder API sleutel)
const DEMO_PLAATSEN = [
  "Amsterdam, Noord-Holland, Nederland",
  "Rotterdam, Zuid-Holland, Nederland",
  "Den Haag, Zuid-Holland, Nederland",
  "Utrecht, Utrecht, Nederland",
  "Eindhoven, Noord-Brabant, Nederland",
  "Tilburg, Noord-Brabant, Nederland",
  "Groningen, Groningen, Nederland",
  "Almere, Flevoland, Nederland",
  "Breda, Noord-Brabant, Nederland",
  "Nijmegen, Gelderland, Nederland",
  "Enschede, Overijssel, Nederland",
  "Apeldoorn, Gelderland, Nederland",
  "Haarlem, Noord-Holland, Nederland",
  "Arnhem, Gelderland, Nederland",
  "Zaanstad, Noord-Holland, Nederland",
  "Amersfoort, Utrecht, Nederland",
  "Dordrecht, Zuid-Holland, Nederland",
  "Leiden, Zuid-Holland, Nederland",
  "Maastricht, Limburg, Nederland",
  "Zoetermeer, Zuid-Holland, Nederland",
  "Schiphol, Noord-Holland, Nederland",
  "Schiphol Airport, Haarlemmermeer, Nederland",
  "Brussel, België",
  "Antwerpen, België",
  "Gent, België",
  "Luik, België",
  "Keulen, Duitsland",
  "Düsseldorf, Duitsland",
  "Frankfurt am Main, Duitsland",
  "Hamburg, Duitsland",
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

export function LocatieInput({
  label,
  waarde,
  onVerander,
  icoon = "map-pin",
  toonLocatieKnop = false,
}: Props) {
  const colors = useColors();
  const [suggesties, setSuggesties] = useState<Suggestie[]>([]);
  const [loadingApi, setLoadingApi] = useState(false);
  const [loadingLocatie, setLoadingLocatie] = useState(false);
  const [gefocust, setGefocust] = useState(false);

  const zoekSuggesties = async (tekst: string) => {
    onVerander(tekst);

    if (tekst.length < 2) {
      setSuggesties([]);
      return;
    }

    if (GOOGLE_API_KEY) {
      // Echte Google Places Autocomplete
      setLoadingApi(true);
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          tekst
        )}&types=geocode&language=nl&key=${GOOGLE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.predictions) {
          setSuggesties(
            data.predictions
              .slice(0, 6)
              .map((p: { place_id: string; description: string }) => ({
                place_id: p.place_id,
                description: p.description,
              }))
          );
        }
      } catch {
        setSuggesties(demoSuggesties(tekst));
      } finally {
        setLoadingApi(false);
      }
    } else {
      // Demo-modus: filter lokale lijst
      setSuggesties(demoSuggesties(tekst));
    }
  };

  const demoSuggesties = (tekst: string): Suggestie[] => {
    const q = tekst.toLowerCase();
    return DEMO_PLAATSEN.filter((p) => p.toLowerCase().includes(q))
      .slice(0, 6)
      .map((p, i) => ({ place_id: `demo-${i}`, description: p }));
  };

  const kiesSuggestie = (s: Suggestie) => {
    onVerander(s.description);
    setSuggesties([]);
  };

  const gebruikHuidigeLocatie = async () => {
    setLoadingLocatie(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        onVerander("Locatietoegang geweigerd");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (GOOGLE_API_KEY) {
        // Reverse geocoding via Google
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.coords.latitude},${loc.coords.longitude}&language=nl&key=${GOOGLE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.results?.[0]) {
          onVerander(data.results[0].formatted_address);
        } else {
          onVerander(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
        }
      } else {
        // Expo reverse geocoding (geen API key nodig)
        const [adres] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (adres) {
          const onderdelen = [adres.street, adres.city, adres.country].filter(Boolean);
          onVerander(onderdelen.join(", "));
        } else {
          onVerander(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
        }
      }
    } catch (err) {
      // Silently fail
    } finally {
      setLoadingLocatie(false);
      setSuggesties([]);
    }
  };

  const toonSuggesties = gefocust && suggesties.length > 0;

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
        <Feather
          name={icoon as any}
          size={18}
          color={gefocust ? colors.primary : colors.mutedForeground}
        />
        <View style={styles.inputArea}>
          <Text style={[styles.labelTekst, { color: colors.mutedForeground }]}>
            {label}
          </Text>
          <TextInput
            value={waarde}
            onChangeText={zoekSuggesties}
            onFocus={() => setGefocust(true)}
            onBlur={() => setTimeout(() => setGefocust(false), 200)}
            style={[styles.input, { color: colors.foreground }]}
            placeholder={`Typ een adres of plaatsnaam...`}
            placeholderTextColor={colors.mutedForeground}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        <View style={styles.rechts}>
          {loadingApi && (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          )}
          {waarde.length > 0 && !loadingApi && (
            <TouchableOpacity
              onPress={() => {
                onVerander("");
                setSuggesties([]);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x-circle" size={17} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          {toonLocatieKnop && !loadingApi && (
            <TouchableOpacity
              onPress={gebruikHuidigeLocatie}
              disabled={loadingLocatie}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              style={[
                styles.gpsBtn,
                { backgroundColor: colors.primary + "22" },
              ]}
            >
              {loadingLocatie ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Feather name="crosshair" size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Autocomplete dropdown */}
      {toonSuggesties && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...(Platform.OS === "android"
                ? { elevation: 8 }
                : {
                    shadowColor: "#000",
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                  }),
            },
          ]}
        >
          <FlatList
            data={suggesties}
            keyExtractor={(item) => item.place_id}
            scrollEnabled={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => (
              <TouchableOpacity
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
                <View
                  style={[
                    styles.suggestieIconWrapper,
                    { backgroundColor: colors.primary + "22" },
                  ]}
                >
                  <Feather name="map-pin" size={13} color={colors.primary} />
                </View>
                <Text
                  style={[styles.suggestieTekst, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
                <Feather name="arrow-up-left" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          />
          {!GOOGLE_API_KEY && (
            <View
              style={[
                styles.demoLabel,
                { borderTopColor: colors.border, borderTopWidth: 1 },
              ]}
            >
              <Feather name="info" size={11} color={colors.mutedForeground} />
              <Text style={[styles.demoLabelTekst, { color: colors.mutedForeground }]}>
                Demo-modus — voeg Google Maps API sleutel toe voor volledige adreszoekfunctie
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    zIndex: 10,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  inputArea: {
    flex: 1,
  },
  labelTekst: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  input: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    padding: 0,
    margin: 0,
  },
  rechts: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gpsBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 999,
  },
  suggestieRij: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestieIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  suggestieTekst: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  demoLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  demoLabelTekst: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
});
