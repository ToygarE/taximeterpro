import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { ExtraKosten } from "@/context/TaximeterContext";

interface Props {
  kosten: ExtraKosten[];
  onChange: (kosten: ExtraKosten[]) => void;
}

const PRESET_KOSTEN = [
  { beschrijving: "Tol A2/A16", bedrag: 4.5 },
  { beschrijving: "Grenstoeslag DE", bedrag: 10.0 },
  { beschrijving: "Grenstoeslag BE", bedrag: 5.0 },
  { beschrijving: "Luchthaventoeslag", bedrag: 7.5 },
  { beschrijving: "Nachtritbijslag", bedrag: 3.0 },
];

export function ExtraKostenInput({ kosten, onChange }: Props) {
  const colors = useColors();

  const voegToe = (preset?: { beschrijving: string; bedrag: number }) => {
    const nieuw: ExtraKosten = preset ?? { beschrijving: "Extra kosten", bedrag: 0 };
    onChange([...kosten, nieuw]);
  };

  const verwijder = (idx: number) => onChange(kosten.filter((_, i) => i !== idx));

  const updateBeschrijving = (idx: number, val: string) => {
    const bijgewerkt = [...kosten];
    bijgewerkt[idx] = { ...bijgewerkt[idx], beschrijving: val };
    onChange(bijgewerkt);
  };

  const updateBedrag = (idx: number, val: string) => {
    const bijgewerkt = [...kosten];
    bijgewerkt[idx] = { ...bijgewerkt[idx], bedrag: parseFloat(val) || 0 };
    onChange(bijgewerkt);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="earth-outline" size={16} color={colors.warning} />
        <Text style={[styles.titel, { color: colors.foreground }]}>Extra Kosten (internationaal)</Text>
      </View>

      {kosten.map((kost, idx) => (
        <View key={idx} style={[styles.kostItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            value={kost.beschrijving}
            onChangeText={(val) => updateBeschrijving(idx, val)}
            style={[styles.beschrijvingInput, { color: colors.foreground }]}
            placeholderTextColor={colors.mutedForeground}
          />
          <View style={styles.bedragRij}>
            <Text style={[styles.euroTeken, { color: colors.warning }]}>€</Text>
            <TextInput
              value={String(kost.bedrag)}
              onChangeText={(val) => updateBedrag(idx, val)}
              keyboardType="decimal-pad"
              style={[styles.bedragInput, { color: colors.warning }]}
            />
            <TouchableOpacity onPress={() => verwijder(idx)}>
              <Ionicons name="trash-outline" size={18} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={styles.presets}>
        {PRESET_KOSTEN.map((preset) => (
          <TouchableOpacity
            key={preset.beschrijving}
            onPress={() => voegToe(preset)}
            activeOpacity={0.7}
            style={[styles.presetBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          >
            <Text style={[styles.presetTekst, { color: colors.foreground }]}>+ {preset.beschrijving}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={() => voegToe()}
          activeOpacity={0.7}
          style={[styles.presetBtn, { backgroundColor: colors.secondary, borderColor: colors.primary }]}
        >
          <Ionicons name="add-outline" size={14} color={colors.primary} />
          <Text style={[styles.presetTekst, { color: colors.primary }]}>Aangepast bedrag</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  titel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  kostItem: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  beschrijvingInput: { fontSize: 14, fontFamily: "Inter_500Medium" },
  bedragRij: { flexDirection: "row", alignItems: "center", gap: 6 },
  euroTeken: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  bedragInput: { fontSize: 20, fontFamily: "Inter_700Bold", flex: 1 },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  presetBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6,
  },
  presetTekst: { fontSize: 12, fontFamily: "Inter_500Medium" },
});
