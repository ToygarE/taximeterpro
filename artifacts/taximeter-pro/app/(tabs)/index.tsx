import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ExtraKostenInput } from "@/components/ExtraKostenInput";
import { HandmatigInput } from "@/components/HandmatigInput";
import { LocatieInput } from "@/components/LocatieInput";
import { PrijsDisplay } from "@/components/PrijsDisplay";
import { RouteKaart } from "@/components/RouteKaart";
import { VoertuigSelector } from "@/components/VoertuigSelector";
import { useTaximeter } from "@/context/TaximeterContext";
import type { ExtraKosten, RitResultaat } from "@/context/TaximeterContext";
import { useColors } from "@/hooks/useColors";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { berekenRit, haalRouteData } from "@/utils/berekeningen";

export default function CalculatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tarieven, addRit } = useTaximeter();
  const { isOnline } = useNetworkStatus();

  const [voertuig, setVoertuig] = useState<"auto" | "bus">("auto");
  const [startLocatie, setStartLocatie] = useState("");
  const [bestemming, setBestemming] = useState("");
  const [handmatigKm, setHandmatigKm] = useState("0");
  const [handmatigMin, setHandmatigMin] = useState("0");
  const [extraKosten, setExtraKosten] = useState<ExtraKosten[]>([]);
  const [modus, setModus] = useState<"api" | "handmatig">("api");
  const [laden, setLaden] = useState(false);
  const [resultaat, setResultaat] = useState<RitResultaat | null>(null);
  const [internationaal, setInternationaal] = useState(false);

  useEffect(() => {
    if (!isOnline && modus === "api") setModus("handmatig");
  }, [isOnline]);

  const berekenScale = new Animated.Value(1);
  const animeerKnop = () => {
    Animated.sequence([
      Animated.timing(berekenScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(berekenScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const berekenPrijs = async () => {
    animeerKnop();
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (modus === "api") {
      if (!startLocatie.trim() || !bestemming.trim()) {
        Alert.alert("Vereiste velden", "Vul een startlocatie en bestemming in, of schakel over naar handmatige invoer.");
        return;
      }
      setLaden(true);
      try {
        const routeData = await haalRouteData(startLocatie, bestemming);
        const rit = berekenRit({ voertuig, afstandKm: routeData.afstandKm, tijdMin: routeData.tijdMin, tarieven, extraKosten, startLocatie, bestemming });
        setResultaat(rit);
        setHandmatigKm(routeData.afstandKm.toFixed(1));
        setHandmatigMin(String(Math.round(routeData.tijdMin)));
        addRit(rit);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Route niet beschikbaar", "Schakel over naar handmatige invoer om de prijs te berekenen.", [
          { text: "Handmatig invoeren", onPress: () => setModus("handmatig") },
          { text: "Annuleren", style: "cancel" },
        ]);
      } finally {
        setLaden(false);
      }
    } else {
      const km = parseFloat(handmatigKm) || 0;
      const min = parseFloat(handmatigMin) || 0;
      if (km === 0 && min === 0) {
        Alert.alert("Voer gegevens in", "Vul de afstand (km) en/of reistijd (min) in.");
        return;
      }
      const rit = berekenRit({ voertuig, afstandKm: km, tijdMin: min, tarieven, extraKosten, startLocatie: startLocatie || "Onbekend", bestemming: bestemming || "Onbekend" });
      setResultaat(rit);
      addRit(rit);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const deelResultaat = async () => {
    if (!resultaat) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const prijs = "€ " + resultaat.totaalPrijs.toFixed(2).replace(".", ",");
    const googleMapsUrl =
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${encodeURIComponent(resultaat.startLocatie)}` +
      `&destination=${encodeURIComponent(resultaat.bestemming)}` +
      `&travelmode=driving`;

    const tekst =
      "🚕 Taximeter Pro — Ritprijsberekening\n\n" +
      "Van: " + resultaat.startLocatie + "\n" +
      "Naar: " + resultaat.bestemming + "\n\n" +
      "Afstand: " + resultaat.afstandKm.toFixed(1) + " km  •  Reistijd: " + Math.round(resultaat.tijdMin) + " min\n" +
      "Voertuig: " + (resultaat.voertuig === "auto" ? "Personenauto" : "Taxibusje") + "\n\n" +
      "Geschatte ritprijs: " + prijs + "\n" +
      "(Gebaseerd op wettelijke maximumtarieven)" +
      (resultaat.extraKosten.length > 0
        ? "\n\n🧾 Extra kosten:\n" +
          resultaat.extraKosten
            .map((ek) => ek.beschrijving + ": € " + ek.bedrag.toFixed(2).replace(".", ","))
            .join("\n")
        : "") +
      "\n\nBerekend via https://taximeterpro.nl";

    try {
      if (Platform.OS === "ios") {
        await Share.share({
          message: tekst,
          url: googleMapsUrl,
        });
      } else {
        await Share.share({
          message: tekst + "\n\n📍 " + googleMapsUrl,
          title: "Taximeter Pro - Ritprijs",
        });
      }
    } catch {}
  };

  const reset = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResultaat(null);
    setStartLocatie("");
    setBestemming("");
    setHandmatigKm("0");
    setHandmatigMin("0");
    setExtraKosten([]);
  };

  const pt = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const pb = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: pt + 16, paddingBottom: pb + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.appTitel, { color: colors.primary }]}>Taximeter Pro</Text>
            <Text style={[styles.subTitel, { color: colors.mutedForeground }]}>
              Tarieven 2026 - wettelijke maxima
            </Text>
          </View>
          <View style={styles.headerRechts}>
            {!isOnline && (
              <View style={[styles.offlineBadge, { backgroundColor: colors.warning + "22", borderColor: colors.warning }]}>
                <Ionicons name="cloud-offline-outline" size={12} color={colors.warning} />
                <Text style={[styles.offlineTekst, { color: colors.warning }]}>Offline</Text>
              </View>
            )}
            <View style={[styles.tarievenBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.tarievenBadgeTekst, { color: colors.primaryForeground }]}>
                {voertuig === "auto" ? `€ ${tarieven.autoKm.toFixed(2)}/km` : `€ ${tarieven.busKm.toFixed(2)}/km`}
              </Text>
            </View>
          </View>
        </View>

        {/* Voertuig */}
        <VoertuigSelector value={voertuig} onChange={setVoertuig} />

        {/* Modus toggle */}
        <View style={styles.modusRow}>
          <TouchableOpacity
            onPress={() => {
              if (!isOnline) { Alert.alert("Offline", "Geen internetverbinding. Gebruik handmatige invoer."); return; }
              setModus("api");
            }}
            style={[styles.modusBtn, { backgroundColor: modus === "api" ? colors.primary : colors.secondary, opacity: !isOnline ? 0.4 : 1 }]}
            activeOpacity={0.7}
          >
            <Ionicons name="navigate-outline" size={16} color={modus === "api" ? colors.primaryForeground : colors.mutedForeground} />
            <Text style={[styles.modus, { color: modus === "api" ? colors.primaryForeground : colors.mutedForeground }]}>Route opzoeken</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setModus("handmatig"); }}
            style={[styles.modusBtn, { backgroundColor: modus === "handmatig" ? colors.primary : colors.secondary }]}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color={modus === "handmatig" ? colors.primaryForeground : colors.mutedForeground} />
            <Text style={[styles.modus, { color: modus === "handmatig" ? colors.primaryForeground : colors.mutedForeground }]}>Handmatig</Text>
          </TouchableOpacity>
        </View>

        {/* Locatie invoer */}
        {modus === "api" ? (
          <View style={[styles.sectie, { overflow: "visible" }]}>
            <View style={{ zIndex: 20, overflow: "visible" }}>
              <LocatieInput label="Startlocatie" waarde={startLocatie} onVerander={setStartLocatie} icoon="location-outline" toonLocatieKnop />
            </View>
            <View style={[styles.routePijl, { backgroundColor: colors.border }]}>
              <Ionicons name="arrow-down-outline" size={16} color={colors.mutedForeground} />
            </View>
            <View style={{ zIndex: 10, overflow: "visible" }}>
              <LocatieInput label="Bestemming" waarde={bestemming} onVerander={setBestemming} icoon="flag-outline" />
            </View>
          </View>
        ) : (
          <View style={[styles.sectie, { overflow: "visible" }]}>
            <View style={{ flex: 1, zIndex: 20, overflow: "visible" }}>
              <LocatieInput label="Van (optioneel)" waarde={startLocatie} onVerander={setStartLocatie} icoon="location-outline" toonLocatieKnop />
            </View>
            <View style={{ zIndex: 10, overflow: "visible" }}>
              <LocatieInput label="Naar (optioneel)" waarde={bestemming} onVerander={setBestemming} icoon="flag-outline" />
            </View>
            <HandmatigInput kmWaarde={handmatigKm} onKmVerander={setHandmatigKm} minWaarde={handmatigMin} onMinVerander={setHandmatigMin} />
          </View>
        )}

        {/* Internationaal */}
        <TouchableOpacity
          onPress={() => { if (Platform.OS !== "web") Haptics.selectionAsync(); setInternationaal(!internationaal); }}
          activeOpacity={0.7}
          style={[styles.internationaalBtn, { backgroundColor: internationaal ? "#f97316" + "22" : colors.secondary, borderColor: internationaal ? colors.warning : colors.border }]}
        >
          <Ionicons name="earth-outline" size={16} color={internationaal ? colors.warning : colors.mutedForeground} />
          <Text style={[styles.internationaalTekst, { color: internationaal ? colors.warning : colors.mutedForeground }]}>
            Internationale rit / extra kosten
          </Text>
          <Ionicons name={internationaal ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={internationaal ? colors.warning : colors.mutedForeground} />
        </TouchableOpacity>

        {internationaal && <ExtraKostenInput kosten={extraKosten} onChange={setExtraKosten} />}

        {/* Bereken knop */}
        <Animated.View style={{ transform: [{ scale: berekenScale }] }}>
          <TouchableOpacity
            onPress={berekenPrijs}
            activeOpacity={0.85}
            disabled={laden}
            style={[styles.berekenKnop, { backgroundColor: laden ? colors.muted : colors.primary }]}
          >
            {laden ? (
              <Text style={[styles.berekenTekst, { color: colors.mutedForeground }]}>Route ophalen...</Text>
            ) : (
              <>
                <Ionicons name="arrow-forward-circle-outline" size={24} color={colors.primaryForeground} />
                <Text style={[styles.berekenTekst, { color: colors.primaryForeground }]}>Bereken Ritprijs</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Resultaat */}
        {resultaat && (
          <View style={styles.resultaatWrapper}>
            <View style={styles.resultaatHeader}>
              <Text style={[styles.resultaatTitel, { color: colors.foreground }]}>Resultaat</Text>
              <View style={styles.resultaatActies}>
                <TouchableOpacity onPress={deelResultaat} activeOpacity={0.7}
                  style={[styles.deelKnop, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
                  <Ionicons name="share-social-outline" size={16} color={colors.primary} />
                  <Text style={[styles.deelTekst, { color: colors.primary }]}>Deel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={reset} style={[styles.resetBtn, { backgroundColor: colors.secondary }]} activeOpacity={0.7}>
                  <Ionicons name="refresh-outline" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Routekaart */}
            <RouteKaart
              startLocatie={resultaat.startLocatie}
              bestemming={resultaat.bestemming}
              hoogte={250}
            />

            <View style={[styles.routeInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.routeRegel}>
                <Ionicons name="location-outline" size={14} color={colors.primary} />
                <Text style={[styles.routeTekst, { color: colors.foreground }]} numberOfLines={1}>{resultaat.startLocatie}</Text>
              </View>
              <View style={[styles.routeDivider, { backgroundColor: colors.border }]} />
              <View style={styles.routeRegel}>
                <Ionicons name="flag-outline" size={14} color={colors.primary} />
                <Text style={[styles.routeTekst, { color: colors.foreground }]} numberOfLines={1}>{resultaat.bestemming}</Text>
              </View>
              <View style={styles.statsRij}>
                <View style={styles.statItem}>
                  <Ionicons name="stats-chart-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.statTekst, { color: colors.mutedForeground }]}>{resultaat.afstandKm.toFixed(1)} km</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.statTekst, { color: colors.mutedForeground }]}>{Math.round(resultaat.tijdMin)} min</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name={resultaat.voertuig === "auto" ? "car-outline" : "bus-outline"} size={13} color={colors.mutedForeground} />
                  <Text style={[styles.statTekst, { color: colors.mutedForeground }]}>
                    {resultaat.voertuig === "auto" ? "Personenauto" : "Taxibusje"}
                  </Text>
                </View>
              </View>
            </View>

            <PrijsDisplay
              startTarief={resultaat.startTarief}
              afstandKm={resultaat.afstandKm}
              kmTarief={resultaat.kmTarief}
              tijdMin={resultaat.tijdMin}
              minTarief={resultaat.minTarief}
              extraKosten={resultaat.extraKosten}
              totaalPrijs={resultaat.totaalPrijs}
            />

            <View style={[styles.disclaimerCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={13} color={colors.mutedForeground} />
              <Text style={[styles.disclaimerTekst, { color: colors.mutedForeground }]}>
                Deze prijs is een indicatie op basis van wettelijke maximumtarieven en kan afwijken van de daadwerkelijke taxameter.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, gap: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  appTitel: { fontSize: 28, fontFamily: "Inter_700Bold" },
  subTitel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  headerRechts: { alignItems: "flex-end", gap: 6 },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  offlineTekst: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tarievenBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  tarievenBadgeTekst: { fontSize: 13, fontFamily: "Inter_700Bold" },
  sectie: { gap: 10 },
  modusRow: { flexDirection: "row", gap: 8 },
  modusBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, paddingVertical: 10 },
  modus: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  routePijl: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  internationaalBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  internationaalTekst: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  berekenKnop: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, paddingVertical: 18, marginTop: 4 },
  berekenTekst: { fontSize: 18, fontFamily: "Inter_700Bold" },
  resultaatWrapper: { gap: 12 },
  resultaatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultaatTitel: { fontSize: 18, fontFamily: "Inter_700Bold" },
  resultaatActies: { flexDirection: "row", alignItems: "center", gap: 8 },
  deelKnop: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  deelTekst: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  resetBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  routeInfo: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  routeRegel: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeTekst: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  routeDivider: { height: 1, marginLeft: 22 },
  statsRij: { flexDirection: "row", gap: 16, marginTop: 4 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statTekst: { fontSize: 12, fontFamily: "Inter_400Regular" },
  disclaimerCard: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  disclaimerTekst: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
