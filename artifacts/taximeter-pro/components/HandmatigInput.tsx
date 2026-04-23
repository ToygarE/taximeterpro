import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  kmWaarde: string;
  onKmVerander: (val: string) => void;
  minWaarde: string;
  onMinVerander: (val: string) => void;
}

export function HandmatigInput({ kmWaarde, onKmVerander, minWaarde, onMinVerander }: Props) {
  const colors = useColors();

  const NumInput = ({
    value, onChange, label, eenheid,
  }: { value: string; onChange: (val: string) => void; label: string; eenheid: string }) => {
    const num = parseFloat(value) || 0;
    const increment = () => onChange(String(Math.max(0, num + 1)));
    const decrement = () => onChange(String(Math.max(0, num - 1)));

    return (
      <View style={[styles.numContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.numLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <View style={styles.numRow}>
          <TouchableOpacity onPress={decrement} activeOpacity={0.7}
            style={[styles.numBtn, { backgroundColor: colors.secondary }]}>
            <Ionicons name="remove-outline" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              style={[styles.numInput, { color: colors.foreground, borderColor: colors.border }]}
              textAlign="center"
            />
            <Text style={[styles.eenheid, { color: colors.mutedForeground }]}>{eenheid}</Text>
          </View>
          <TouchableOpacity onPress={increment} activeOpacity={0.7}
            style={[styles.numBtn, { backgroundColor: colors.secondary }]}>
            <Ionicons name="add-outline" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <NumInput value={kmWaarde} onChange={onKmVerander} label="Afstand" eenheid="km" />
      <NumInput value={minWaarde} onChange={onMinVerander} label="Reistijd" eenheid="min" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  numContainer: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  numLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.8 },
  numRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  numBtn: { width: 52, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  inputWrapper: { flex: 1, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 },
  numInput: {
    fontSize: 28, fontFamily: "Inter_700Bold",
    borderBottomWidth: 2, minWidth: 80, paddingVertical: 4,
  },
  eenheid: { fontSize: 16, fontFamily: "Inter_500Medium" },
});
