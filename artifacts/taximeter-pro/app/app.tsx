import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
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

function DesktopOverlay({ colors }: { colors: any }) {
  const [zichtbaar, setZichtbaar] = useState(true);
  if (!zichtbaar) return null;
  return (
    <Modal transparent animationType="fade" visible={zichtbaar}>
      <View style={overlayStyles.achtergrond}>
        <View style={[overlayStyles.kaart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[overlayStyles.icon, { backgroundColor: colors.primary }]}>
            <Ionicons name="phone-portrait-outline" size={32} color="#000" />
          </View>
          <Text style={[overlayStyles.titel, { color: colors.foreground }]}>
            Taximeter Pro werkt het best op mobiel
          </Text>
          <Text style={[overlayStyles.tekst, { color: colors.mutedForeground }]}>
            Download de mobiele app voor de beste ervaring. U kunt de calculator ook direct hier gebruiken.
          </Text>
          <View style={overlayStyles.knoppen}>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://play.google.com/store")}
              style={[overlayStyles.knop, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Ionicons name="phone-portrait-outline" size={16} color="#000" />
              <Text style={overlayStyles.knopTekst}>Google Play</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://apps.apple.com")}
              style={[overlayStyles.knop, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Ionicons name="tablet-portrait-outline" size={16} color="#000" />
              <Text style={overlayStyles.knopTekst}>App Store</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setZichtbaar(false)} activeOpacity={0.7}>
            <Text style={[overlayStyles.doorgaan, { color: colors.mutedForeground }]}>
              Toch doorgaan op desktop
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function AppScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tarieven, addRit } = useTaximeter();
  const { isOnline } = useNetworkStatus();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width > 768;

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

  if (Platform.OS === "web") {
    return <Redirect href="/landing" />;
  }

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
        Alert.alert("Vereiste velden", "Vul een startlocatie en bestemming in.");
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
        Alert.alert("Route niet beschikbaar", "Schakel over naar handmatige invoer.", [
          { text: "Handmatig invoeren", onPress: () => setModus("handmatig") },
          { text: "Annuleren", style: "cancel" },
        ]);
      } finally {
        setLaden(false);
      }
    } else {
      const km = parseFloat(handmatigKm) || 0;
      const min = parseFloat(handmatigMin) || 0;
      if (km === 0 && min === 0) { Alert.alert("Voer gegevens in", "Vul de afstand en/of reistijd in."); return; }
      const rit = berekenRit({ voertuig, afstandKm: km, tijdMin: min, tarieven, extraKosten, startLocatie: startLocatie || "Onbekend", bestemming: bestemming || "Onbekend" });
      setResultaat(rit);
      addRit(rit);
    }
  };

  const deelResultaat = async () => {
    if (!resultaat) return;
    const prijs = "€ " + resultaat.totaalPrijs.toFixed(2).replace(".", ",");
    const tekst =
      "Taximeter Pro - Ritprijsberekening\n\n" +
      "Van: " + resultaat.startLocatie + "\nNaar: " + resultaat.bestemming + "\n\n" +
      "Afstand: " + resultaat.afstandKm.toFixed(1) + " km | Reistijd: " + Math.round(resultaat.tijdMin) + " min\n" +
      "Voertuig: " + (resultaat.voertuig === "auto" ? "Personenauto" : "Taxibusje") + "\n\n" +
      "Uw geschatte ritprijs via Taximeter Pro bedraagt: " + prijs + "\n\n" +
      "(Gebaseerd op wettelijke maximumtarieven 2026.)";
    try { await Share.share({ message: tekst }); } catch {}
  };

  const reset = () => {
    setResultaat(null); setStartLocatie(""); setBestemming("");
    setHandmatigKm("0"); setHandmatigMin("0"); setExtraKosten([]);
  };

  const pt = insets.top + 16;
  const pb = insets.bottom + 40;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.background }}>
      {isDesktop && <DesktopOverlay colors={colors} />}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: pt, paddingBottom: pb }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.appTitel, { color: colors.primary }]}>Taximeter Pro</Text>
            <Text style={[styles.subTitel, { color: colors.mutedForeground }]}>Tarieven 2026 - wettelijke maxima</Text>
          </View>
          <View style={[styles.tarievenBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.tarievenBadgeTekst, { color: "#000" }]}>
              {voertuig === "auto" ? "€ " + tarieven.autoKm.toFixed(2) + "/km" : "€ " + tarieven.busKm.toFixed(2) + "/km"}
            </Text>
          </View>
        </View>

        <VoertuigSelector value={voertuig} onChange={setVoertuig} />

        <View style={styles.modusRow}>
          <TouchableOpacity onPress={() => setModus("api")} style={[styles.modusBtn, { backgroundColor: modus === "api" ? colors.primary : colors.secondary }]} activeOpacity={0.7}>
            <Ionicons name="navigate-outline" size={14} color={modus === "api" ? "#000" : colors.mutedForeground} />
            <Text style={[styles.modusT, { color: modus === "api" ? "#000" : colors.mutedForeground }]}>Route opzoeken</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModus("handmatig")} style={[styles.modusBtn, { backgroundColor: modus === "handmatig" ? colors.primary : colors.secondary }]} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={14} color={modus === "handmatig" ? "#000" : colors.mutedForeground} />
            <Text style={[styles.modusT, { color: modus === "handmatig" ? "#000" : colors.mutedForeground }]}>Handmatig</Text>
          </TouchableOpacity>
        </View>

        {modus === "api" ? (
          <View style={{ gap: 10 }}>
            <View style={{ zIndex: 20 }}>
              <LocatieInput label="Startlocatie" waarde={startLocatie} onVerander={setStartLocatie} icoon="location-outline" toonLocatieKnop />
            </View>
            <View style={[styles.pijlWrap, { backgroundColor: colors.border }]}>
              <Ionicons name="arrow-down-outline" size={16} color={colors.mutedForeground} />
            </View>
            <View style={{ zIndex: 10 }}>
              <LocatieInput label="Bestemming" waarde={bestemming} onVerander={setBestemming} icoon="flag-outline" />
            </View>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <View style={{ zIndex: 20 }}>
              <LocatieInput label="Van (optioneel)" waarde={startLocatie} onVerander={setStartLocatie} icoon="location-outline" toonLocatieKnop />
            </View>
            <View style={{ zIndex: 10 }}>
              <LocatieInput label="Naar (optioneel)" waarde={bestemming} onVerander={setBestemming} icoon="flag-outline" />
            </View>
            <HandmatigInput kmWaarde={handmatigKm} onKmVerander={setHandmatigKm} minWaarde={handmatigMin} onMinVerander={setHandmatigMin} />
          </View>
        )}

        <TouchableOpacity onPress={() => setInternationaal(!internationaal)} activeOpacity={0.7}
          style={[styles.intlBtn, { backgroundColor: internationaal ? "#f97316" + "22" : colors.secondary, borderColor: internationaal ? colors.warning : colors.border }]}>
          <Ionicons name="earth-outline" size={16} color={internationaal ? colors.warning : colors.mutedForeground} />
          <Text style={[styles.intlT, { color: internationaal ? colors.warning : colors.mutedForeground }]}>Internationale rit / extra kosten</Text>
          <Ionicons name={internationaal ? "chevron-up-outline" : "chevron-down-outline"} size={16} color={internationaal ? colors.warning : colors.mutedForeground} />
        </TouchableOpacity>

        {internationaal && <ExtraKostenInput kosten={extraKosten} onChange={setExtraKosten} />}

        <Animated.View style={{ transform: [{ scale: berekenScale }] }}>
          <TouchableOpacity onPress={berekenPrijs} activeOpacity={0.85} disabled={laden}
            style={[styles.berekenKnop, { backgroundColor: laden ? colors.muted : colors.primary }]}>
            {laden ? (
              <Text style={[styles.berekenT, { color: colors.mutedForeground }]}>Route ophalen...</Text>
            ) : (
              <>
                <Ionicons name="arrow-forward-circle-outline" size={22} color="#000" />
                <Text style={[styles.berekenT, { color: "#000" }]}>Bereken Ritprijs</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {resultaat && (
          <View style={{ gap: 12 }}>
            <View style={styles.resultaatHeader}>
              <Text style={[styles.resultaatTitel, { color: colors.foreground }]}>Resultaat</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity onPress={deelResultaat} activeOpacity={0.7}
                  style={[styles.deelKnop, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
                  <Ionicons name="share-social-outline" size={16} color={colors.primary} />
                  <Text style={[styles.deelT, { color: colors.primary }]}>Deel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={reset} style={[styles.resetBtn, { backgroundColor: colors.secondary }]} activeOpacity={0.7}>
                  <Ionicons name="refresh-outline" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            <RouteKaart startLocatie={resultaat.startLocatie} bestemming={resultaat.bestemming} hoogte={200} />

            <View style={[styles.routeInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.routeRegel}>
                <Ionicons name="location-outline" size={14} color={colors.primary} />
                <Text style={[styles.routeT, { color: colors.foreground }]} numberOfLines={1}>{resultaat.startLocatie}</Text>
              </View>
              <View style={[styles.routeDivider, { backgroundColor: colors.border }]} />
              <View style={styles.routeRegel}>
                <Ionicons name="flag-outline" size={14} color={colors.primary} />
                <Text style={[styles.routeT, { color: colors.foreground }]} numberOfLines={1}>{resultaat.bestemming}</Text>
              </View>
              <View style={styles.statsRij}>
                <View style={styles.statItem}>
                  <Ionicons name="stats-chart-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.statT, { color: colors.mutedForeground }]}>{resultaat.afstandKm.toFixed(1)} km</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.statT, { color: colors.mutedForeground }]}>{Math.round(resultaat.tijdMin)} min</Text>
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

            <View style={[styles.disclaimer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={13} color={colors.mutedForeground} />
              <Text style={[styles.disclaimerT, { color: colors.mutedForeground }]}>
                Indicatie op basis van wettelijke maximumtarieven 2026. De taxameter is altijd leidend.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const overlayStyles = StyleSheet.create({
  achtergrond: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", alignItems: "center", justifyContent: "center", padding: 24 },
  kaart: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: "center", gap: 16, maxWidth: 440, width: "100%" },
  icon: { width: 72, height: 72, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  titel: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  tekst: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  knoppen: { flexDirection: "row", gap: 12, width: "100%" },
  knop: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 14 },
  knopTekst: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#000" },
  doorgaan: { fontSize: 13, fontFamily: "Inter_400Regular", textDecorationLine: "underline" },
});

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, gap: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  appTitel: { fontSize: 28, fontFamily: "Inter_700Bold" },
  subTitel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  tarievenBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  tarievenBadgeTekst: { fontSize: 13, fontFamily: "Inter_700Bold" },
  modusRow: { flexDirection: "row", gap: 8 },
  modusBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, paddingVertical: 10 },
  modusT: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  pijlWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  intlBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  intlT: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  berekenKnop: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, paddingVertical: 18, marginTop: 4 },
  berekenT: { fontSize: 18, fontFamily: "Inter_700Bold" },
  resultaatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultaatTitel: { fontSize: 18, fontFamily: "Inter_700Bold" },
  deelKnop: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  deelT: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  resetBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  routeInfo: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  routeRegel: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeT: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  routeDivider: { height: 1, marginLeft: 22 },
  statsRij: { flexDirection: "row", gap: 16, marginTop: 4 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statT: { fontSize: 12, fontFamily: "Inter_400Regular" },
  disclaimer: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  disclaimerT: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
