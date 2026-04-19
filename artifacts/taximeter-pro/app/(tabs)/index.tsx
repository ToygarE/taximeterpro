import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { VoertuigSelector } from "@/components/VoertuigSelector";
import { useTaximeter } from "@/context/TaximeterContext";
import type { ExtraKosten, RitResultaat } from "@/context/TaximeterContext";
import { useColors } from "@/hooks/useColors";
import { berekenRit, haalRouteData } from "@/utils/berekeningen";

export default function CalculatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tarieven, addRit } = useTaximeter();

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

  const berekenPrijs = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (modus === "api") {
      if (!startLocatie.trim() || !bestemming.trim()) {
        Alert.alert("Vereiste velden", "Vul start- en bestemmingslocatie in.");
        return;
      }

      setLaden(true);
      try {
        const routeData = await haalRouteData(startLocatie, bestemming);
        const rit = berekenRit({
          voertuig,
          afstandKm: routeData.afstandKm,
          tijdMin: routeData.tijdMin,
          tarieven,
          extraKosten,
          startLocatie,
          bestemming,
        });
        setResultaat(rit);
        setHandmatigKm(routeData.afstandKm.toFixed(1));
        setHandmatigMin(String(Math.round(routeData.tijdMin)));
        addRit(rit);
      } catch (err: any) {
        Alert.alert(
          "API niet beschikbaar",
          "Stel handmatig de afstand en tijd in om de prijs te berekenen.",
          [{ text: "Handmatig", onPress: () => setModus("handmatig") }, { text: "OK" }]
        );
      } finally {
        setLaden(false);
      }
    } else {
      const km = parseFloat(handmatigKm) || 0;
      const min = parseFloat(handmatigMin) || 0;
      if (km === 0 && min === 0) {
        Alert.alert("Voer gegevens in", "Vul de afstand en/of reistijd in.");
        return;
      }
      const rit = berekenRit({
        voertuig,
        afstandKm: km,
        tijdMin: min,
        tarieven,
        extraKosten,
        startLocatie: startLocatie || "Onbekend",
        bestemming: bestemming || "Onbekend",
      });
      setResultaat(rit);
      addRit(rit);
    }
  };

  const reset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: pt + 16, paddingBottom: pb + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.appTitel, { color: colors.primary }]}>
              Taximeter Pro
            </Text>
            <Text style={[styles.subTitel, { color: colors.mutedForeground }]}>
              Tarieven 2026 — wettelijke maxima
            </Text>
          </View>
          <View
            style={[styles.tarievenBadge, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.tarievenBadgeTekst, { color: colors.primaryForeground }]}>
              {voertuig === "auto"
                ? `€ ${tarieven.autoKm.toFixed(2)}/km`
                : `€ ${tarieven.busKm.toFixed(2)}/km`}
            </Text>
          </View>
        </View>

        {/* Voertuig selectie */}
        <View style={styles.sectie}>
          <VoertuigSelector value={voertuig} onChange={setVoertuig} />
        </View>

        {/* Invoer modus toggle */}
        <View style={styles.modusRow}>
          <TouchableOpacity
            onPress={() => setModus("api")}
            style={[
              styles.modusBtn,
              {
                backgroundColor: modus === "api" ? colors.primary : colors.secondary,
              },
            ]}
            activeOpacity={0.7}
          >
            <Feather
              name="navigation"
              size={14}
              color={modus === "api" ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text
              style={[
                styles.modus,
                {
                  color:
                    modus === "api"
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                },
              ]}
            >
              Route opzoeken
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setModus("handmatig")}
            style={[
              styles.modusBtn,
              {
                backgroundColor:
                  modus === "handmatig" ? colors.primary : colors.secondary,
              },
            ]}
            activeOpacity={0.7}
          >
            <Feather
              name="edit-3"
              size={14}
              color={
                modus === "handmatig"
                  ? colors.primaryForeground
                  : colors.mutedForeground
              }
            />
            <Text
              style={[
                styles.modus,
                {
                  color:
                    modus === "handmatig"
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                },
              ]}
            >
              Handmatig
            </Text>
          </TouchableOpacity>
        </View>

        {/* Locatie invoer */}
        {modus === "api" ? (
          <View style={styles.sectie}>
            <View style={{ zIndex: 20 }}>
              <LocatieInput
                label="Startlocatie"
                waarde={startLocatie}
                onVerander={setStartLocatie}
                icoon="map-pin"
              />
            </View>
            <View style={[styles.routePijl, { backgroundColor: colors.border }]}>
              <Feather name="arrow-down" size={16} color={colors.mutedForeground} />
            </View>
            <View style={{ zIndex: 10 }}>
              <LocatieInput
                label="Bestemming"
                waarde={bestemming}
                onVerander={setBestemming}
                icoon="flag"
              />
            </View>
          </View>
        ) : (
          <View style={styles.sectie}>
            <HandmatigInput
              kmWaarde={handmatigKm}
              onKmVerander={setHandmatigKm}
              minWaarde={handmatigMin}
              onMinVerander={setHandmatigMin}
            />
          </View>
        )}

        {/* Internationaal toggle */}
        <TouchableOpacity
          onPress={() => setInternationaal(!internationaal)}
          activeOpacity={0.7}
          style={[
            styles.internationaalBtn,
            {
              backgroundColor: internationaal ? "#f97316" + "22" : colors.secondary,
              borderColor: internationaal ? colors.warning : colors.border,
            },
          ]}
        >
          <Feather
            name="globe"
            size={16}
            color={internationaal ? colors.warning : colors.mutedForeground}
          />
          <Text
            style={[
              styles.internationaalTekst,
              { color: internationaal ? colors.warning : colors.mutedForeground },
            ]}
          >
            Internationale rit / extra kosten
          </Text>
          <Feather
            name={internationaal ? "chevron-up" : "chevron-down"}
            size={16}
            color={internationaal ? colors.warning : colors.mutedForeground}
          />
        </TouchableOpacity>

        {internationaal && (
          <View style={styles.sectie}>
            <ExtraKostenInput kosten={extraKosten} onChange={setExtraKosten} />
          </View>
        )}

        {/* Bereken knop */}
        <TouchableOpacity
          onPress={berekenPrijs}
          activeOpacity={0.85}
          disabled={laden}
          style={[
            styles.berekenKnop,
            { backgroundColor: laden ? colors.muted : colors.primary },
          ]}
        >
          {laden ? (
            <Text style={[styles.berekenTekst, { color: colors.mutedForeground }]}>
              Route ophalen...
            </Text>
          ) : (
            <>
              <Feather name="arrow-right-circle" size={22} color={colors.primaryForeground} />
              <Text style={[styles.berekenTekst, { color: colors.primaryForeground }]}>
                Bereken Ritprijs
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Resultaat */}
        {resultaat && (
          <View style={styles.resultaatWrapper}>
            <View style={styles.resultaatHeader}>
              <Text style={[styles.resultaatTitel, { color: colors.foreground }]}>
                Resultaat
              </Text>
              <TouchableOpacity onPress={reset}>
                <Feather name="refresh-ccw" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.routeInfo,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.routeRegel}>
                <Feather name="map-pin" size={14} color={colors.primary} />
                <Text
                  style={[styles.routeTekst, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {resultaat.startLocatie}
                </Text>
              </View>
              <View style={[styles.routeDivider, { backgroundColor: colors.border }]} />
              <View style={styles.routeRegel}>
                <Feather name="flag" size={14} color={colors.primary} />
                <Text
                  style={[styles.routeTekst, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {resultaat.bestemming}
                </Text>
              </View>
              <View style={styles.statsRij}>
                <View style={styles.statItem}>
                  <Feather name="activity" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.statTekst, { color: colors.mutedForeground }]}>
                    {resultaat.afstandKm.toFixed(1)} km
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Feather name="clock" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.statTekst, { color: colors.mutedForeground }]}>
                    {Math.round(resultaat.tijdMin)} min
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Feather
                    name={resultaat.voertuig === "auto" ? "arrow-right" : "users"}
                    size={14}
                    color={colors.mutedForeground}
                  />
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
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  appTitel: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  subTitel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  tarievenBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tarievenBadgeTekst: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  sectie: {
    gap: 10,
  },
  modusRow: {
    flexDirection: "row",
    gap: 8,
  },
  modusBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
  },
  modus: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  routePijl: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  internationaalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  internationaalTekst: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  berekenKnop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 4,
  },
  berekenTekst: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  resultaatWrapper: {
    gap: 12,
  },
  resultaatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultaatTitel: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  routeInfo: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  routeRegel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeTekst: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  routeDivider: {
    height: 1,
    marginLeft: 22,
  },
  statsRij: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statTekst: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
