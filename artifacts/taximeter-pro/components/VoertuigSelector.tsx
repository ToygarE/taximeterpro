import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type Voertuig = "auto" | "bus";

interface Props {
  value: Voertuig;
  onChange: (v: Voertuig) => void;
}

export function VoertuigSelector({ value, onChange }: Props) {
  const colors = useColors();

  const opties: { key: Voertuig; label: string; sub: string; icon: string }[] = [
    { key: "auto", label: "Personenauto", sub: "max. 4 personen", icon: "truck" },
    { key: "bus", label: "Taxibusje", sub: "5–8 personen", icon: "truck" },
  ];

  return (
    <View style={styles.container}>
      {opties.map((opt) => {
        const actief = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.75}
            style={[
              styles.optie,
              {
                backgroundColor: actief ? colors.primary : colors.card,
                borderColor: actief ? colors.primary : colors.border,
              },
            ]}
          >
            <Feather
              name={opt.key === "auto" ? "navigation" : "users"}
              size={22}
              color={actief ? colors.primaryForeground : colors.mutedForeground}
            />
            <View style={styles.tekst}>
              <Text
                style={[
                  styles.label,
                  { color: actief ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {opt.label}
              </Text>
              <Text
                style={[
                  styles.sub,
                  {
                    color: actief
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                  },
                ]}
              >
                {opt.sub}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
  },
  optie: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 2,
    padding: 14,
  },
  tekst: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
