import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RouteKaart } from "@/components/RouteKaart";
import { useTaximeter } from "@/context/TaximeterContext";
import type { RitResultaat } from "@/context/TaximeterContext";
import { useColors } from "@/hooks/useColors";

export default function GeschiedenisScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { history, clearHistory, deleteRit } = useTaximeter();
  const [vernieuwen, setVernieuwen] = useState(false);
  const [opengeklapt, setOpengeklapt] = useState<string | null>(null);

  const formatEuro = (val: number) =>
    "€ " + val.toFixed(2).replace(".", ",");

  const formatDatum = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const onVernieuwen = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVernieuwen(true);
    setTimeout(() => setVernieuwen(false), 600);
  }, []);

  const toggleAccordion = (id: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setOpengeklapt((prev) => (prev === id ? null : id));
  };

  const deelRit = async (item: RitResultaat) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const prijs = "€ " + item.totaalPrijs.toFixed(2).replace(".", ",");
    const tekst =
      "Taximeter Pro - Ritprijsberekening\n\n" +
      "Van: " + item.startLocatie + "\n" +
      "Naar: " + item.bestemming + "\n\n" +
      "Afstand: " + item.afstandKm.toFixed(1) + " km | Reistijd: " + Math.round(item.tijdMin) + " min\n" +
      "Voertuig: " + (item.voertuig === "auto" ? "Personenauto" : "Taxibusje") + "\n\n" +
      "Uw geschatte ritprijs via Taximeter Pro bedraagt: " + prijs + "\n\n" +
      "(Gebaseerd op wettelijke maximumtarieven 2026. Definitieve prijs volgens taxameter.)";
    try {
      await Share.share({ message: tekst, title: "Taximeter Pro - Ritprijs" });
    } catch {}
  };

  const verwijderRit = (item: RitResultaat) => {
    Alert.alert(
      "Rit verwijderen",
      "Rit van " + item.startLocatie + " naar " + item.bestemming + " verwijderen?",
      [
        { text: "Annuleren", style: "cancel" },
        {
          text: "Verwijderen",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteRit(item.id);
            if (opengeklapt === item.id) setOpengeklapt(null);
          },
        },
      ]
    );
  };

  const verwijderAlles = () => {
    Alert.alert(
      "Alles wissen",
      "Wil je alle rithistorie definitief verwijderen?",
      [
        { text: "Annuleren", style: "cancel" },
        {
          text: "Verwijderen",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearHistory();
            setOpengeklapt(null);
          },
        },
      ]
    );
  };

  const pt = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const pb = Platform.OS === "web" ? 34 : insets.bottom;

  const renderItem = ({ item }: { item: RitResultaat }) => {
    const isOpen = opengeklapt === item.id;

    return (
      <View style={[styles.ritItem, { backgroundColor: colors.card, borderColor: isOpen ? colors.primary : colors.border }]}>
        <TouchableOpacity onPress={() => toggleAccordion(item.id)} activeOpacity={0.75} style={styles.ritHoofd}>
          <View style={styles.ritInfo}>
            <View style={styles.routeRij}>
              <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.routeTekst, { color: colors.foreground }]} numberOfLines={1}>{item.startLocatie}</Text>
            </View>
            <View style={[styles.routeLijn, { backgroundColor: colors.border }]} />
            <View style={styles.routeRij}>
              <Feather name="flag" size={12} color={colors.primary} />
              <Text style={[styles.routeTekst, { color: colors.foreground }]} numberOfLines={1}>{item.bestemming}</Text>
            </View>
          </View>
          <View style={styles.ritRechts}>
            <Text style={[styles.ritPrijs, { color: colors.primary }]}>{formatEuro(item.totaalPrijs)}</Text>
            <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
          </View>
        </TouchableOpacity>

        <View style={styles.metaRij}>
          <View style={styles.metaItem}>
            <Feather name={item.voertuig === "auto" ? "navigation" : "users"} size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaTekst, { color: colors.mutedForeground }]}>{item.voertuig === "auto" ? "Auto" : "Bus"}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="activity" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaTekst, { color: colors.mutedForeground }]}>{item.afstandKm.toFixed(1)} km</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaTekst, { color: colors.mutedForeground }]}>{Math.round(item.tijdMin)} min</Text>
          </View>
          <Text style={[styles.datumTekst, { color: colors.mutedForeground }]}>
            {new Date(item.timestamp).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>

        {isOpen && (
          <View>
            <View style={[styles.accordionDivider, { backgroundColor: colors.border }]} />

            {/* Routekaart */}
            <View style={{ padding: 14, paddingBottom: 0 }}>
              <RouteKaart startLocatie={item.startLocatie} bestemming={item.bestemming} hoogte={160} />
            </View>

            {/* Prijsopbouw */}
            <View style={styles.prijsDetail}>
              <Text style={[styles.detailKop, { color: colors.mutedForeground }]}>Prijsopbouw</Text>
              <View style={styles.prijsRegel}>
                <Text style={[styles.prijsLabel, { color: colors.foreground }]}>Starttarief</Text>
                <Text style={[styles.prijsWaarde, { color: colors.foreground }]}>{formatEuro(item.startTarief)}</Text>
              </View>
              <View style={styles.prijsRegel}>
                <Text style={[styles.prijsLabel, { color: colors.foreground }]}>
                  {item.afstandKm.toFixed(1)} km x {formatEuro(item.kmTarief)}
                </Text>
                <Text style={[styles.prijsWaarde, { color: colors.foreground }]}>{formatEuro(item.afstandKm * item.kmTarief)}</Text>
              </View>
              <View style={styles.prijsRegel}>
                <Text style={[styles.prijsLabel, { color: colors.foreground }]}>
                  {Math.round(item.tijdMin)} min x {formatEuro(item.minTarief)}
                </Text>
                <Text style={[styles.prijsWaarde, { color: colors.foreground }]}>{formatEuro(item.tijdMin * item.minTarief)}</Text>
              </View>
              {item.extraKosten.map((ek, idx) => (
                <View style={styles.prijsRegel} key={idx}>
                  <Text style={[styles.prijsLabel, { color: colors.warning }]}>{ek.beschrijving}</Text>
                  <Text style={[styles.prijsWaarde, { color: colors.warning }]}>{formatEuro(ek.bedrag)}</Text>
                </View>
              ))}
              <View style={[styles.totaalRegel, { borderTopColor: colors.border }]}>
                <Text style={[styles.totaalLabel, { color: colors.primary }]}>Totaal</Text>
                <Text style={[styles.totaalWaarde, { color: colors.primary }]}>{formatEuro(item.totaalPrijs)}</Text>
              </View>
            </View>

            <Text style={[styles.volledigeDatum, { color: colors.mutedForeground }]}>{formatDatum(item.timestamp)}</Text>

            <View style={styles.actiesRij}>
              <TouchableOpacity onPress={() => deelRit(item)} activeOpacity={0.7}
                style={[styles.actieKnop, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
                <Feather name="share-2" size={15} color={colors.primary} />
                <Text style={[styles.actieTekst, { color: colors.primary }]}>Delen</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => verwijderRit(item)} activeOpacity={0.7}
                style={[styles.actieKnop, { backgroundColor: colors.destructive + "22", borderColor: colors.destructive }]}>
                <Feather name="trash-2" size={15} color={colors.destructive} />
                <Text style={[styles.actieTekst, { color: colors.destructive }]}>Verwijderen</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id ?? String(item.timestamp)}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingTop: pt + 16, paddingBottom: pb + 100 }]}
        refreshControl={
          <RefreshControl refreshing={vernieuwen} onRefresh={onVernieuwen} tintColor={colors.primary} colors={[colors.primary]} progressBackgroundColor={colors.card} />
        }
        ListHeaderComponent={
          <View style={styles.lijstHeader}>
            <View>
              <Text style={[styles.pageTitel, { color: colors.foreground }]}>Ritgeschiedenis</Text>
              {history.length > 0 && (
                <Text style={[styles.aantalTekst, { color: colors.mutedForeground }]}>
                  {history.length} {history.length === 1 ? "rit" : "ritten"} - tik voor details
                </Text>
              )}
            </View>
            {history.length > 0 && (
              <TouchableOpacity onPress={verwijderAlles} activeOpacity={0.7}
                style={[styles.wisBtn, { backgroundColor: colors.destructive + "22" }]}>
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </TouchableOpacity>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.leegState}>
            <View style={[styles.leegIconWrapper, { backgroundColor: colors.card }]}>
              <Feather name="clock" size={40} color={colors.border} />
            </View>
            <Text style={[styles.leegTitel, { color: colors.foreground }]}>Nog geen ritten</Text>
            <Text style={[styles.leegSub, { color: colors.mutedForeground }]}>Berekende ritten verschijnen hier automatisch</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 20, gap: 10 },
  lijstHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  pageTitel: { fontSize: 24, fontFamily: "Inter_700Bold" },
  aantalTekst: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  wisBtn: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  ritItem: { borderRadius: 14, borderWidth: 1.5, overflow: "hidden" },
  ritHoofd: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  ritInfo: { flex: 1, gap: 5 },
  routeRij: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLijn: { width: 1, height: 12, marginLeft: 3.5 },
  routeTekst: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  ritRechts: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
  ritPrijs: { fontSize: 18, fontFamily: "Inter_700Bold" },
  metaRij: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap", paddingHorizontal: 14, paddingBottom: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaTekst: { fontSize: 12, fontFamily: "Inter_400Regular" },
  datumTekst: { fontSize: 11, fontFamily: "Inter_400Regular", marginLeft: "auto" },
  accordionDivider: { height: 1, marginHorizontal: 14 },
  prijsDetail: { padding: 14, gap: 8 },
  detailKop: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  prijsRegel: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  prijsLabel: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  prijsWaarde: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  totaalRegel: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
  totaalLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  totaalWaarde: { fontSize: 20, fontFamily: "Inter_700Bold" },
  volledigeDatum: { fontSize: 11, fontFamily: "Inter_400Regular", paddingHorizontal: 14, paddingBottom: 10 },
  actiesRij: { flexDirection: "row", gap: 10, padding: 14, paddingTop: 0 },
  actieKnop: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingVertical: 10 },
  actieTekst: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  leegState: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 80 },
  leegIconWrapper: { width: 80, height: 80, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  leegTitel: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  leegSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", maxWidth: 220 },
});
