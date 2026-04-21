import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTaximeter } from "@/context/TaximeterContext";
import type { TarifSettings } from "@/context/TaximeterContext";
import { useColors } from "@/hooks/useColors";

export default function TarievenScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tarieven } = useTaximeter();

  const formatEuro = (val: number) =>
    "€ " + val.toFixed(2).replace(".", ",");

  const TarievenSectie = ({
    titel,
    velden,
  }: {
    titel: string;
    velden: { sleutel: keyof TarifSettings; label: string; eenheid: string }[];
  }) => (
    <View style={[styles.sectie, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectieTitel, { color: colors.foreground }]}>{titel}</Text>
      {velden.map((veld, idx) => (
        <View key={veld.sleutel}>
          {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          <View style={styles.veldrij}>
            <View style={styles.veldInfo}>
              <Text style={[styles.veldLabel, { color: colors.foreground }]}>{veld.label}</Text>
              <Text style={[styles.veldEenheid, { color: colors.mutedForeground }]}>{veld.eenheid}</Text>
            </View>
            <View style={[styles.waardeBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
              <Text style={[styles.waardeText, { color: colors.primary }]}>{formatEuro(tarieven[veld.sleutel])}</Text>
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
      contentContainerStyle={[styles.content, { paddingTop: pt + 16, paddingBottom: pb + 100 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitel, { color: colors.foreground }]}>Wettelijke Tarieven</Text>
        <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
          Maximumtarieven 2026 - vastgesteld door de overheid
        </Text>
      </View>

      <View style={[styles.infoBanner, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
        <MaterialCommunityIcons name="information" size={16} color={colors.primary} />
        <Text style={[styles.infoTekst, { color: colors.primary }]}>
          De overheid indexeert de maximumtarieven doorgaans per 1 januari. Neem contact op met support als de tarieven zijn gewijzigd.
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
        titel="Taxibusje (5-8 pers.)"
        velden={[
          { sleutel: "busStart", label: "Starttarief", eenheid: "per rit" },
          { sleutel: "busKm", label: "Kilometertarief", eenheid: "per km" },
          { sleutel: "busMin", label: "Minuuttarief", eenheid: "per min" },
        ]}
      />

      <TarievenSectie
        titel="Wachttarief"
        velden={[{ sleutel: "waitPerHour", label: "Wachtkosten", eenheid: "per uur" }]}
      />

      <View style={[styles.juridischSectie, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectieTitel, { color: colors.foreground }]}>Juridisch & Support</Text>

        <TouchableOpacity
          onPress={() => router.push("/support")}
          activeOpacity={0.7}
          style={[styles.juridischRij, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
        >
          <View style={[styles.juridischIcon, { backgroundColor: colors.primary + "22" }]}>
            <MaterialCommunityIcons name="help-circle" size={15} color={colors.primary} />
          </View>
          <Text style={[styles.juridischTekst, { color: colors.foreground }]}>Veelgestelde vragen & Support</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/privacy")}
          activeOpacity={0.7}
          style={[styles.juridischRij, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
        >
          <View style={[styles.juridischIcon, { backgroundColor: colors.primary + "22" }]}>
            <MaterialCommunityIcons name="shield-check" size={15} color={colors.primary} />
          </View>
          <Text style={[styles.juridischTekst, { color: colors.foreground }]}>Privacybeleid</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={styles.juridischRij}>
          <View style={[styles.juridischIcon, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="information" size={15} color={colors.mutedForeground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.juridischTekst, { color: colors.foreground }]}>Versie 1.0.0</Text>
            <Text style={[styles.versieNummer, { color: colors.mutedForeground }]}>Tarieven 2026 - Toygar Consultancy</Text>
          </View>
        </View>
      </View>

      <View style={[styles.disclaimerCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="alert-circle" size={14} color={colors.mutedForeground} />
        <Text style={[styles.disclaimerTekst, { color: colors.mutedForeground }]}>
          Deze prijs is een indicatie op basis van wettelijke maximumtarieven en kan afwijken van de daadwerkelijke taxameter.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  pageHeader: { gap: 4 },
  pageTitel: { fontSize: 24, fontFamily: "Inter_700Bold" },
  pageSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  infoBanner: {
    flexDirection: "row", gap: 10, borderRadius: 12,
    borderWidth: 1, padding: 14, alignItems: "flex-start",
  },
  infoTekst: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 19 },
  sectie: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 0 },
  sectieTitel: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 12 },
  divider: { height: 1, marginVertical: 10 },
  veldrij: { flexDirection: "row", alignItems: "center", gap: 12 },
  veldInfo: { flex: 1 },
  veldLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  veldEenheid: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  waardeBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  waardeText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  juridischSectie: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 0 },
  juridischRij: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  juridischIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  juridischTekst: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  versieNummer: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  disclaimerCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 14,
  },
  disclaimerTekst: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
