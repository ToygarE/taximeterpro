import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
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

interface Suggestie {
  place_id: string;
  description: string;
}

interface Props {
  label: string;
  waarde: string;
  onVerander: (val: string) => void;
  icoon?: string;
}

export function LocatieInput({ label, waarde, onVerander, icoon = "map-pin" }: Props) {
  const colors = useColors();
  const [suggesties, setSuggesties] = useState<Suggestie[]>([]);
  const [loading, setLoading] = useState(false);
  const [gefocust, setGefocust] = useState(false);

  const zoekSuggesties = async (tekst: string) => {
    onVerander(tekst);
    if (tekst.length < 2 || !GOOGLE_API_KEY) {
      setSuggesties([]);
      return;
    }
    setLoading(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        tekst
      )}&types=geocode&language=nl&components=country:nl|country:be|country:de&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.predictions) {
        setSuggesties(
          data.predictions.slice(0, 5).map((p: { place_id: string; description: string }) => ({
            place_id: p.place_id,
            description: p.description,
          }))
        );
      }
    } catch {
      setSuggesties([]);
    } finally {
      setLoading(false);
    }
  };

  const kiesSuggestie = (s: Suggestie) => {
    onVerander(s.description);
    setSuggesties([]);
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
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            {label}
          </Text>
          <TextInput
            value={waarde}
            onChangeText={zoekSuggesties}
            onFocus={() => setGefocust(true)}
            onBlur={() => setTimeout(() => setGefocust(false), 150)}
            style={[styles.input, { color: colors.foreground }]}
            placeholder={`Voer ${label.toLowerCase()} in...`}
            placeholderTextColor={colors.mutedForeground}
            autoCorrect={false}
            returnKeyType="done"
          />
        </View>
        {waarde.length > 0 && (
          <TouchableOpacity onPress={() => { onVerander(""); setSuggesties([]); }}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {toonSuggesties && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...(Platform.OS === "android" ? { elevation: 4 } : {
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
              }),
            },
          ]}
        >
          <FlatList
            data={suggesties}
            keyExtractor={(item) => item.place_id}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => kiesSuggestie(item)}
                style={[
                  styles.suggestie,
                  index < suggesties.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Feather name="map-pin" size={14} color={colors.mutedForeground} />
                <Text
                  style={[styles.suggestieTekst, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
          />
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
    paddingVertical: 10,
    gap: 10,
  },
  inputArea: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  input: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    padding: 0,
    margin: 0,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 100,
  },
  suggestie: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestieTekst: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
});
