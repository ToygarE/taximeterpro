import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type IconName = "navigation" | "credit-card-outline" | "account-group" | "earth" | "clock-outline" | "wifi-off";

const FUNCTIES: { icoon: IconName; titel: string; tekst: string }[] = [
  { icoon: "navigation", titel: "Straatniveau autocomplete", tekst: "Typ een adres met huisnummer en ontvang directe suggesties via Google Maps." },
  { icoon: "credit-card-outline", titel: "Wettelijke tarieven 2026", tekst: "Berekend op basis van de officieel vastgestelde maximumtarieven van de overheid." },
  { icoon: "account-group", titel: "Auto & Taxibusje", tekst: "Ondersteunt personenauto (max. 4 pers.) en taxibusje (5-8 pers.)." },
  { icoon: "earth", titel: "Internationale ritten", tekst: "Voeg tolkosten, grenstoeslagen en andere extra's toe aan uw berekening." },
  { icoon: "clock-outline", titel: "Ritgeschiedenis", tekst: "Bewaar en deel uitgevoerde berekeningen, inclusief volledige prijsopbouw." },
  { icoon: "wifi-off", titel: "Offline modus", tekst: "Werkt volledig zonder internet via handmatige km- en tijdinvoer." },
];

export default function LandingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const openApp = () => router.push("/app" as any);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="navigation" size={32} color="#000" />
          </View>
          <Text style={[styles.appNaam, { color: colors.primary }]}>Taximeter Pro</Text>
          <Text style={[styles.tagline, { color: colors.foreground }]}>
            De eerlijkste ritprijs,{"\n"}altijd bij de hand.
          </Text>
          <Text style={[styles.subTagline, { color: colors.mutedForeground }]}>
            Professionele taxiprijscalculator op basis van de wettelijke{"\n"}maximumtarieven 2026 voor Nederland.
          </Text>
        </View>

        {/* Open App */}
        <TouchableOpacity onPress={openApp} activeOpacity={0.85} style={[styles.openKnop, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="arrow-right-circle" size={22} color="#000" />
          <Text style={styles.openKnopTekst}>Open de calculator</Text>
        </TouchableOpacity>

        {/* Store badges */}
        <View style={styles.badgesRij}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.storeBadge, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => Linking.openURL("https://play.google.com/store")}
          >
            <MaterialCommunityIcons name="cellphone" size={20} color={colors.foreground} />
            <View>
              <Text style={[styles.badgeLabel, { color: colors.mutedForeground }]}>Beschikbaar op</Text>
              <Text style={[styles.badgeNaam, { color: colors.foreground }]}>Google Play</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.storeBadge, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => Linking.openURL("https://apps.apple.com")}
          >
            <MaterialCommunityIcons name="tablet" size={20} color={colors.foreground} />
            <View>
              <Text style={[styles.badgeLabel, { color: colors.mutedForeground }]}>Beschikbaar in de</Text>
              <Text style={[styles.badgeNaam, { color: colors.foreground }]}>App Store</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tarieven 2026 highlight */}
        <View style={[styles.tarievenCard, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
          <Text style={[styles.tarievenKop, { color: colors.primary }]}>Tarieven 2026</Text>
          <View style={styles.tarievenRij}>
            <View style={styles.tarievenItem}>
              <Text style={[styles.tarievenLabel, { color: colors.mutedForeground }]}>Starttarief auto</Text>
              <Text style={[styles.tarievenWaarde, { color: colors.foreground }]}>€ 4,31</Text>
            </View>
            <View style={[styles.tarievenDivider, { backgroundColor: colors.border }]} />
            <View style={styles.tarievenItem}>
              <Text style={[styles.tarievenLabel, { color: colors.mutedForeground }]}>Per kilometer</Text>
              <Text style={[styles.tarievenWaarde, { color: colors.foreground }]}>€ 3,17</Text>
            </View>
            <View style={[styles.tarievenDivider, { backgroundColor: colors.border }]} />
            <View style={styles.tarievenItem}>
              <Text style={[styles.tarievenLabel, { color: colors.mutedForeground }]}>Per minuut</Text>
              <Text style={[styles.tarievenWaarde, { color: colors.foreground }]}>€ 0,52</Text>
            </View>
          </View>
        </View>

        {/* Functies */}
        <Text style={[styles.sectionKop, { color: colors.foreground }]}>Waarom Taximeter Pro?</Text>
        <View style={styles.functiesGrid}>
          {FUNCTIES.map((f, idx) => (
            <View key={idx} style={[styles.functieKaart, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.functieIcon, { backgroundColor: colors.primary + "22" }]}>
                <MaterialCommunityIcons name={f.icoon} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.functieTitel, { color: colors.foreground }]}>{f.titel}</Text>
              <Text style={[styles.functieTekst, { color: colors.mutedForeground }]}>{f.tekst}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerMerk, { color: colors.mutedForeground }]}>
            Taximeter Pro - een product van Toygar Consultancy
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => router.push("/support" as any)}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Support & FAQ</Text>
            </TouchableOpacity>
            <Text style={[styles.footerDot, { color: colors.mutedForeground }]}>•</Text>
            <TouchableOpacity onPress={() => router.push("/privacy" as any)}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Privacybeleid</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.footerDisclaimer, { color: colors.mutedForeground }]}>
            Berekeningen zijn indicatief op basis van wettelijke maximumtarieven. De taxameter in het voertuig is altijd leidend.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 28 },
  hero: { alignItems: "center", gap: 16 },
  logoBadge: { width: 80, height: 80, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  appNaam: { fontSize: 36, fontFamily: "Inter_700Bold" },
  tagline: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center", lineHeight: 34 },
  subTagline: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  openKnop: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, paddingVertical: 18 },
  openKnopTekst: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#000" },
  badgesRij: { flexDirection: "row", gap: 12 },
  storeBadge: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  badgeLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  badgeNaam: { fontSize: 14, fontFamily: "Inter_700Bold" },
  tarievenCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  tarievenKop: { fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "center" },
  tarievenRij: { flexDirection: "row", alignItems: "center" },
  tarievenItem: { flex: 1, alignItems: "center", gap: 4 },
  tarievenLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  tarievenWaarde: { fontSize: 18, fontFamily: "Inter_700Bold" },
  tarievenDivider: { width: 1, height: 40 },
  sectionKop: { fontSize: 22, fontFamily: "Inter_700Bold" },
  functiesGrid: { gap: 12 },
  functieKaart: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  functieIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  functieTitel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  functieTekst: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  footer: { borderTopWidth: 1, paddingTop: 24, gap: 10, alignItems: "center" },
  footerMerk: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  footerLinks: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerLink: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  footerDot: { fontSize: 13 },
  footerDisclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16, maxWidth: 360 },
});
