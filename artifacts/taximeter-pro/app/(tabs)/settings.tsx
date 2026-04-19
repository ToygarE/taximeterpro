import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTaximeter } from "@/context/TaximeterContext";
import type { TarifSettings } from "@/context/TaximeterContext";
import { useColors } from "@/hooks/useColors";

const DEFAULT_TARIEVEN: TarifSettings = {
  autoStart: 4.31,
  autoKm: 3.17,
  autoMin: 0.52,
  busStart: 8.77,
  busKm: 4.0,
  busMin: 0.59,
  waitPerHour: 59.41,
};

export default function InstellingenScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tarieven, updateTarieven, resetTarieven } = useTaximeter();

  const [lokaal, setLokaal] = useState<Record<string, string>>({});

  useEffect(() => {
    setLokaal({
      autoStart: String(tarieven.autoStart),
      autoKm: String(tarieven.autoKm),
      autoMin: String(tarieven.autoMin),
      busStart: String(tarieven.busStart),
      busKm: String(tarieven.busKm),
      busMin: String(tarieven.busMin),
      waitPerHour: String(tarieven.waitPerHour),
    });
  }, [tarieven]);

  const opslaan = () => {
    const nieuw: TarifSettings = {
      autoStart: parseFloat(lokaal.autoStart) || 0,
      autoKm: parseFloat(lokaal.autoKm) || 0,
      autoMin: parseFloat(lokaal.autoMin) || 0,
      busStart: parseFloat(lokaal.busStart) || 0,
      busKm: parseFloat(lokaal.busKm) || 0,
      busMin: parseFloat(lokaal.busMin) || 0,
      waitPerHour: parseFloat(lokaal.waitPerHour) || 0,
    };
    updateTarieven(nieuw);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Opgeslagen", "Tarieven zijn bijgewerkt.");
  };

  const reset = () => {
    Alert.alert(
      "Tarieven resetten",
      "Wil je de wettelijke standaardtarieven van 2026 herstellen?",
      [
        { text: "Annuleren", style: "cancel" },
        {
          text: "Resetten",
          onPress: () => {
            resetTarieven();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const TarievenSectie = ({
    titel,
    velden,
  }: {
    titel: string;
    velden: { sleutel: keyof TarifSettings; label: string; eenheid: string }[];
  }) => (
    <View
      style={[
        styles.sectie,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.sectieTitel, { color: colors.foreground }]}>
        {titel}
      </Text>
      {velden.map((veld, idx) => (
        <View key={veld.sleutel}>
          {idx > 0 && (
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          )}
          <View style={styles.veldrij}>
            <View style={styles.veldInfo}>
              <Text style={[styles.veldLabel, { color: colors.foreground }]}>
                {veld.label}
              </Text>
              <Text style={[styles.veldStandaard, { color: colors.mutedForeground }]}>
                Standaard: € {DEFAULT_TARIEVEN[veld.sleutel].toFixed(2)}
              </Text>
            </View>
            <View style={styles.veldInputRow}>
              <Text style={[styles.euro, { color: colors.primary }]}>€</Text>
              <TextInput
                value={lokaal[veld.sleutel] ?? ""}
                onChangeText={(val) =>
                  setLokaal((prev) => ({ ...prev, [veld.sleutel]: val }))
                }
                keyboardType="decimal-pad"
                style={[
                  styles.veldInput,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    backgroundColor: colors.input,
                  },
                ]}
              />
              <Text style={[styles.eenheid, { color: colors.mutedForeground }]}>
                {veld.eenheid}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const pt = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const pb = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: pt + 16, paddingBottom: pb + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitel, { color: colors.foreground }]}>
          Tarieven Beheren
        </Text>
        <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
          Wettelijke maxima — jaarlijks geïndexeerd
        </Text>
      </View>

      <View
        style={[
          styles.infoBanner,
          { backgroundColor: colors.primary + "22", borderColor: colors.primary },
        ]}
      >
        <Feather name="info" size={16} color={colors.primary} />
        <Text style={[styles.infoTekst, { color: colors.primary }]}>
          De overheid indexeert de maximumtarieven doorgaans per 1 januari. Pas hier de tarieven aan wanneer nieuwe maxima worden gepubliceerd.
        </Text>
      </View>

      <TarievenSectie
        titel="Personenauto (max 4 pers.)"
        velden={[
          { sleutel: "autoStart", label: "Starttarief", eenheid: "per rit" },
          { sleutel: "autoKm", label: "Kilometertarief", eenheid: "per km" },
          { sleutel: "autoMin", label: "Minuuttarief", eenheid: "per min" },
        ]}
      />

      <TarievenSectie
        titel="Taxibusje (5–8 pers.)"
        velden={[
          { sleutel: "busStart", label: "Starttarief", eenheid: "per rit" },
          { sleutel: "busKm", label: "Kilometertarief", eenheid: "per km" },
          { sleutel: "busMin", label: "Minuuttarief", eenheid: "per min" },
        ]}
      />

      <TarievenSectie
        titel="Wachttarief"
        velden={[
          { sleutel: "waitPerHour", label: "Wachtkosten", eenheid: "per uur" },
        ]}
      />

      <TouchableOpacity
        onPress={opslaan}
        activeOpacity={0.85}
        style={[styles.opslaanKnop, { backgroundColor: colors.primary }]}
      >
        <Feather name="save" size={20} color={colors.primaryForeground} />
        <Text style={[styles.opslaanTekst, { color: colors.primaryForeground }]}>
          Tarieven Opslaan
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={reset} activeOpacity={0.7} style={styles.resetKnop}>
        <Text style={[styles.resetTekst, { color: colors.mutedForeground }]}>
          Herstellen naar wettelijke standaardtarieven 2026
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  pageHeader: {
    gap: 4,
  },
  pageTitel: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  pageSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  infoBanner: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: "flex-start",
  },
  infoTekst: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 19,
  },
  sectie: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 0,
  },
  sectieTitel: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  veldrij: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  veldInfo: {
    flex: 1,
  },
  veldLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  veldStandaard: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  veldInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  euro: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  veldInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    width: 72,
    textAlign: "right",
  },
  eenheid: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    width: 42,
  },
  opslaanKnop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 16,
  },
  opslaanTekst: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  resetKnop: {
    alignItems: "center",
    paddingVertical: 8,
  },
  resetTekst: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
