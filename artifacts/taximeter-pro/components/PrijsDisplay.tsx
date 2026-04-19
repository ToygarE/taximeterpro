import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { ExtraKosten } from "@/context/TaximeterContext";

interface Props {
  startTarief: number;
  afstandKm: number;
  kmTarief: number;
  tijdMin: number;
  minTarief: number;
  extraKosten: ExtraKosten[];
  totaalPrijs: number;
}

export function PrijsDisplay({
  startTarief,
  afstandKm,
  kmTarief,
  tijdMin,
  minTarief,
  extraKosten,
  totaalPrijs,
}: Props) {
  const colors = useColors();

  const formatEuro = (val: number) =>
    `€ ${val.toFixed(2).replace(".", ",")}`;

  const extraTotaal = extraKosten.reduce((s, e) => s + e.bedrag, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.header, { color: colors.mutedForeground }]}>
        Prijsopbouw
      </Text>

      <View style={styles.regel}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          Starttarief
        </Text>
        <Text style={[styles.waarde, { color: colors.foreground }]}>
          {formatEuro(startTarief)}
        </Text>
      </View>

      <View style={styles.regel}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {afstandKm.toFixed(1)} km × {formatEuro(kmTarief)}
        </Text>
        <Text style={[styles.waarde, { color: colors.foreground }]}>
          {formatEuro(afstandKm * kmTarief)}
        </Text>
      </View>

      <View style={styles.regel}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {Math.round(tijdMin)} min × {formatEuro(minTarief)}
        </Text>
        <Text style={[styles.waarde, { color: colors.foreground }]}>
          {formatEuro(tijdMin * minTarief)}
        </Text>
      </View>

      {extraKosten.map((ek, idx) => (
        <View style={styles.regel} key={idx}>
          <Text style={[styles.label, { color: colors.warning }]}>
            {ek.beschrijving}
          </Text>
          <Text style={[styles.waarde, { color: colors.warning }]}>
            {formatEuro(ek.bedrag)}
          </Text>
        </View>
      ))}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.regel}>
        <Text style={[styles.totaalLabel, { color: colors.primary }]}>
          Totaal
        </Text>
        <Text style={[styles.totaalWaarde, { color: colors.primary }]}>
          {formatEuro(totaalPrijs)}
        </Text>
      </View>

      <Text style={[styles.formule, { color: colors.mutedForeground }]}>
        {formatEuro(startTarief)} + ({afstandKm.toFixed(1)} × {formatEuro(kmTarief)}) + ({Math.round(tijdMin)} × {formatEuro(minTarief)}){extraTotaal > 0 ? ` + ${formatEuro(extraTotaal)}` : ""} = {formatEuro(totaalPrijs)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  header: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  regel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  waarde: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  totaalLabel: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  totaalWaarde: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  formule: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    lineHeight: 16,
  },
});
