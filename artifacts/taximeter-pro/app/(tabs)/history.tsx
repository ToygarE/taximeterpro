import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTaximeter } from "@/context/TaximeterContext";
import type { RitResultaat } from "@/context/TaximeterContext";
import { useColors } from "@/hooks/useColors";

export default function GeschiedenisScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { history, clearHistory } = useTaximeter();

  const formatEuro = (val: number) =>
    `€ ${val.toFixed(2).replace(".", ",")}`;

  const formatDatum = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const verwijderAlles = () => {
    Alert.alert(
      "Geschiedenis wissen",
      "Wil je alle rithistorie verwijderen?",
      [
        { text: "Annuleren", style: "cancel" },
        {
          text: "Verwijderen",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearHistory();
          },
        },
      ]
    );
  };

  const pt = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const pb = Platform.OS === "web" ? 34 : insets.bottom;

  const renderItem = ({ item }: { item: RitResultaat }) => (
    <View
      style={[
        styles.ritItem,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.ritHeader}>
        <View style={styles.ritInfo}>
          <Text
            style={[styles.ritRoute, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {item.startLocatie}
          </Text>
          <Feather name="arrow-right" size={12} color={colors.mutedForeground} />
          <Text
            style={[styles.ritRoute, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {item.bestemming}
          </Text>
        </View>
        <Text style={[styles.ritPrijs, { color: colors.primary }]}>
          {formatEuro(item.totaalPrijs)}
        </Text>
      </View>

      <View style={styles.ritMeta}>
        <View style={styles.metaItem}>
          <Feather
            name={item.voertuig === "auto" ? "arrow-right" : "users"}
            size={12}
            color={colors.mutedForeground}
          />
          <Text style={[styles.metaTekst, { color: colors.mutedForeground }]}>
            {item.voertuig === "auto" ? "Auto" : "Bus"}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="activity" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaTekst, { color: colors.mutedForeground }]}>
            {item.afstandKm.toFixed(1)} km
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="clock" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaTekst, { color: colors.mutedForeground }]}>
            {Math.round(item.tijdMin)} min
          </Text>
        </View>
        <Text style={[styles.datumTekst, { color: colors.mutedForeground }]}>
          {formatDatum(item.timestamp)}
        </Text>
      </View>

      {item.extraKosten.length > 0 && (
        <View style={[styles.extraBadge, { backgroundColor: colors.warning + "22" }]}>
          <Feather name="globe" size={11} color={colors.warning} />
          <Text style={[styles.extraTekst, { color: colors.warning }]}>
            +{formatEuro(item.extraKosten.reduce((s, e) => s + e.bedrag, 0))} extra kosten
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={history}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: pt + 16, paddingBottom: pb + 100 },
        ]}
        ListHeaderComponent={
          <View style={styles.lijstHeader}>
            <Text style={[styles.pageTitel, { color: colors.foreground }]}>
              Ritgeschiedenis
            </Text>
            {history.length > 0 && (
              <TouchableOpacity onPress={verwijderAlles} activeOpacity={0.7}>
                <Feather name="trash-2" size={20} color={colors.destructive} />
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.leegState}>
            <Feather name="clock" size={48} color={colors.border} />
            <Text style={[styles.leegTitel, { color: colors.foreground }]}>
              Nog geen ritten
            </Text>
            <Text style={[styles.leegSub, { color: colors.mutedForeground }]}>
              Berekende ritten verschijnen hier
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  lijstHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pageTitel: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  ritItem: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  ritHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  ritInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    overflow: "hidden",
  },
  ritRoute: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  ritPrijs: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    flexShrink: 0,
  },
  ritMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaTekst: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  datumTekst: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginLeft: "auto",
  },
  extraBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  extraTekst: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  leegState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 80,
  },
  leegTitel: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  leegSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
