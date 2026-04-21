import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? "";

const DEMO_ADRESSEN = [
  "Damrak 1, 1012 LG Amsterdam",
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
  "Am Hauptbahnhof 1, 60329 Frankfurt am Main",
  "Keizersgracht 100, Amsterdam",
  "Herengracht 200, Amsterdam",
  "Jan van Galenstraat 4, Amsterdam",
  "Blaak 40, Rotterdam",
  "Centrumplein 1, Zoetermeer",
  "Lange Poten 50, Den Haag",
];

interface Suggestie {
  place_id: string;
  description: string;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
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

export function LocatieInput({ label, waarde, onVerander, icoon = "map-marker", toonLocatieKnop = false }: Props) {
  const colors = useColors();
  const [suggesties, setSuggesties] = useState<Suggestie[]>([]);
  const [loadingApi, setLoadingApi] = useState(false);
  const [loadingLocatie, setLoadingLocatie] = useState(false);
  const [gefocust, setGefocust] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<View>(null);
  const latestQueryRef = useRef<string>("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onBlurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelectingRef = useRef(false);

  const meetContainer = () => {
    containerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownPos({ top: y + height + 4, left: x, width });
    });
  };

  const zoekSuggesties = useCallback(async (tekst: string) => {
    onVerander(tekst);
    latestQueryRef.current = tekst;

    if (tekst.length < 2) {
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
          if (data.predictions) {
            setSuggesties(
              data.predictions.slice(0, 6).map((p: { place_id: string; description: string }) => ({
                place_id: p.place_id,
                description: p.description,
              }))
            );
          } else {
            setSuggesties(demoSuggesties(query));
          }
        } catch {
          if (latestQueryRef.current === query) setSuggesties(demoSuggesties(query));
        } finally {
          if (latestQueryRef.current === query) setLoadingApi(false);
        }
      } else {
        setSuggesties(demoSuggesties(query));
      }
    }, 280);
  }, [onVerander]);

  const kiesSuggestie = (s: Suggestie) => {
    isSelectingRef.current = true;
    if (onBlurTimeoutRef.current) clearTimeout(onBlurTimeoutRef.current);
    onVerander(s.description);
    setSuggesties([]);
    setGefocust(false);
    isSelectingRef.current = false;
  };

  const handleFocus = () => {
    if (onBlurTimeoutRef.current) clearTimeout(onBlurTimeoutRef.current);
    setGefocust(true);
    meetContainer();
  };

  const handleBlur = () => {
    onBlurTimeoutRef.current = setTimeout(() => {
      if (!isSelectingRef.current) {
        setGefocust(false);
        setSuggesties([]);
      }
    }, 400);
  };

  const gebruikHuidigeLocatie = async () => {
    setLoadingLocatie(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (GOOGLE_API_KEY) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.coords.latitude},${loc.coords.longitude}&language=nl&key=${GOOGLE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.results?.[0]) { onVerander(data.results[0].formatted_address); return; }
      }
      const [adres] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (adres) {
        onVerander([adres.street, adres.streetNumber, adres.city, adres.country].filter(Boolean).join(", "));
      } else {
        onVerander(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
      }
    } catch {} finally {
      setLoadingLocatie(false);
      setSuggesties([]);
    }
  };

  const toonDropdown = gefocust && suggesties.length > 0;

  const renderSuggestie = ({ item, index }: { item: Suggestie; index: number }) => (
    <TouchableOpacity
      onPress={() => kiesSuggestie(item)}
      onPressIn={() => { isSelectingRef.current = true; }}
      activeOpacity={0.7}
      style={[
        styles.suggestieRij,
        index < suggesties.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.suggestieIcon, { backgroundColor: colors.primary + "22" }]}>
        <MaterialCommunityIcons name="map-marker" size={13} color={colors.primary} />
      </View>
      <Text style={[styles.suggestieTekst, { color: colors.foreground }]} numberOfLines={2}>{item.description}</Text>
      <MaterialCommunityIcons name="arrow-top-left" size={13} color={colors.mutedForeground} />
    </TouchableOpacity>
  );

  const DropdownInhoud = () => (
    <View style={[
      styles.dropdownInhoud,
      { backgroundColor: colors.card, borderColor: colors.border },
      Platform.OS === "android" ? { elevation: 20 } : styles.iosShadow,
    ]}>
      <FlatList
        data={suggesties}
        keyExtractor={(item) => item.place_id}
        scrollEnabled={false}
        keyboardShouldPersistTaps="always"
        renderItem={renderSuggestie}
      />
      {!GOOGLE_API_KEY && (
        <View style={[styles.demoRij, { borderTopColor: colors.border }]}>
          <MaterialCommunityIcons name="information" size={11} color={colors.mutedForeground} />
          <Text style={[styles.demoTekst, { color: colors.mutedForeground }]}>Demo-modus - voeg Google Maps API sleutel toe</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <View
        ref={containerRef}
        style={[styles.container, { backgroundColor: colors.input, borderColor: gefocust ? colors.primary : colors.border }]}
      >
        <MaterialCommunityIcons
          name={icoon as any}
          size={18}
          color={gefocust ? colors.primary : colors.mutedForeground}
        />
        <View style={styles.inputArea}>
          <Text style={[styles.labelTekst, { color: colors.mutedForeground }]}>{label}</Text>
          <TextInput
            value={waarde}
            onChangeText={zoekSuggesties}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Typ een adres of straatnaam..."
            placeholderTextColor={colors.mutedForeground}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="done"
            blurOnSubmit={false}
          />
        </View>
        <View style={styles.rechts}>
          {loadingApi && <ActivityIndicator size="small" color={colors.mutedForeground} />}
          {waarde.length > 0 && !loadingApi && (
            <TouchableOpacity
              onPress={() => { onVerander(""); setSuggesties([]); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close-circle" size={17} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          {toonLocatieKnop && (
            <TouchableOpacity
              onPress={gebruikHuidigeLocatie}
              disabled={loadingLocatie}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              style={[styles.gpsBtn, { backgroundColor: colors.primary + "22" }]}
            >
              {loadingLocatie
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <MaterialCommunityIcons name="crosshairs-gps" size={16} color={colors.primary} />}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {toonDropdown && (
        Platform.OS === "web" ? (
          <View style={[styles.dropdownWeb, { zIndex: 9999 }]}>
            <DropdownInhoud />
          </View>
        ) : (
          <Modal
            visible={toonDropdown}
            transparent
            animationType="none"
            onRequestClose={() => { setSuggesties([]); setGefocust(false); }}
          >
            <TouchableWithoutFeedback onPress={() => { setSuggesties([]); setGefocust(false); }}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={[styles.dropdownModal, { top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }]}>
                    <DropdownInhoud />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "relative" },
  container: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 2,
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  inputArea: { flex: 1 },
  labelTekst: {
    fontSize: 10, fontFamily: "Inter_500Medium",
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3,
  },
  input: { fontSize: 16, fontFamily: "Inter_500Medium", padding: 0, margin: 0 },
  rechts: { flexDirection: "row", alignItems: "center", gap: 8 },
  gpsBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  dropdownWeb: { position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: "transparent" },
  dropdownModal: { position: "absolute" },
  dropdownInhoud: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  iosShadow: {
    shadowColor: "#000", shadowOpacity: 0.35,
    shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
  },
  suggestieRij: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  suggestieIcon: {
    width: 26, height: 26, borderRadius: 7,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  suggestieTekst: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  demoRij: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1,
  },
  demoTekst: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
});
