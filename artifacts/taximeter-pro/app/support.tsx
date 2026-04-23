import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const FAQ = [
  {
    vraag: "Hoe nauwkeurig is de berekende prijs?",
    antwoord: "De berekening is gebaseerd op de wettelijke maximumtarieven 2026 en de route-informatie van Google Maps. De werkelijke ritprijs kan licht afwijken door bijvoorbeeld verkeer, omrijden of wachttijd. De taxameter in het voertuig is altijd leidend.",
  },
  {
    vraag: "Zijn dit de officiële wettelijke tarieven?",
    antwoord: "Ja. De tarieven zijn gebaseerd op de officieel vastgestelde maximumtarieven voor 2026 zoals gepubliceerd door de Nederlandse overheid. Taxichauffeurs mogen nooit meer rekenen dan deze maxima. Tarieven worden doorgaans per 1 januari geïndexeerd.",
  },
  {
    vraag: "Waarom wijkt de prijs af van de taxameter?",
    antwoord: "De app berekent een schatting op basis van de verwachte route en rijtijd. De taxameter meet de werkelijke gereden afstand en verstreken tijd seconde voor seconde. Verkeer, wachten bij stoplichten of een alternatieve route kunnen een verschil veroorzaken.",
  },
  {
    vraag: "Werkt de app ook zonder internetverbinding?",
    antwoord: "Ja. Wanneer er geen internetverbinding is, schakelt de app automatisch over naar de handmatige modus. Vul dan zelf de afstand (km) en de reistijd (minuten) in. De prijsberekening werkt volledig offline.",
  },
  {
    vraag: "Hoe gebruik ik de GPS-locatiefunctie?",
    antwoord: "Tik op het kruisje-icoon naast het startlocatieveld. De app vraagt dan om toegang tot uw locatie. Na goedkeuring wordt uw huidige adres automatisch ingevuld als startlocatie.",
  },
  {
    vraag: "Kan ik de app ook voor internationale ritten gebruiken?",
    antwoord: "Ja. Tik op 'Internationale rit / extra kosten' om toeslagen toe te voegen, zoals tolkosten voor de A2 of grenstoeslagen voor Duitsland en Belgie. U kunt ook eigen bedragen invoeren.",
  },
  {
    vraag: "Hoe deel ik een ritprijs met mijn klant?",
    antwoord: "Na het berekenen van de prijs verschijnt een gele 'Deel'-knop. Tik hierop om de prijsberekening te delen via WhatsApp, SMS of andere apps op uw telefoon. De boodschap bevat route, afstand en het totaalbedrag.",
  },
  {
    vraag: "Hoe voeg ik de app toe aan mijn startscherm?",
    antwoord: "Op Android: open de app in Chrome en tik op de drie puntjes rechtsboven en kies 'Toevoegen aan startscherm'. Op iOS: open de app in Safari en tik op het deel-icoon en kies 'Zet op beginscherm'. De app werkt dan als een native app zonder browser-interface.",
  },
  {
    vraag: "Kan ik de tarieven aanpassen als de overheid ze wijzigt?",
    antwoord: "De tarieven in de app worden centraal beheerd en bijgewerkt bij elke nieuwe indexatie door de overheid. Neem contact op via info@auradigital.nl als u een tariefwijziging wilt melden.",
  },
];

export default function SupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [opengeklapt, setOpengeklapt] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setOpengeklapt((prev) => (prev === idx ? null : idx));
  };

  const stuurEmail = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("mailto:info@auradigital.nl?subject=Support%20Taximeter%20Pro&body=Hallo%20Aura%20Digital%2C%0A%0A");
  };

  const pt = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const pb = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBar, { paddingTop: pt + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitel, { color: colors.foreground }]}>Support & FAQ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: pb + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.contactKaart, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
          <View style={styles.contactKop}>
            <View>
              <Text style={[styles.contactBedrijf, { color: colors.primary }]}>Aura Digital</Text>
              <Text style={[styles.contactSub, { color: colors.foreground }]}>Ontwikkelaar van Taximeter Pro</Text>
            </View>
            <View style={[styles.contactIconWrap, { backgroundColor: colors.primary }]}>
              <Ionicons name="flash-outline" size={20} color="#000" />
            </View>
          </View>
          <TouchableOpacity onPress={stuurEmail} activeOpacity={0.8} style={[styles.emailKnop, { backgroundColor: colors.primary }]}>
            <Ionicons name="mail-outline" size={16} color="#000" />
            <Text style={styles.emailTekst}>info@auradigital.nl</Text>
          </TouchableOpacity>
          <Text style={[styles.contactInfo, { color: colors.mutedForeground }]}>Reactietijd: doorgaans binnen 1 werkdag</Text>
        </View>

        <View style={[styles.klantKaart, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="briefcase-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.klantTekst, { color: colors.mutedForeground }]}>
            Taximeter Pro is een product van{" "}
            <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>Aura Digital</Text>.
          </Text>
        </View>

        <Text style={[styles.faqTitel, { color: colors.foreground }]}>Veelgestelde vragen</Text>

        {FAQ.map((item, idx) => {
          const isOpen = opengeklapt === idx;
          return (
            <View key={idx} style={[styles.faqItem, { backgroundColor: colors.card, borderColor: isOpen ? colors.primary : colors.border }]}>
              <TouchableOpacity onPress={() => toggleFaq(idx)} activeOpacity={0.75} style={styles.faqKop}>
                <View style={[styles.faqNummer, { backgroundColor: isOpen ? colors.primary : colors.secondary }]}>
                  <Text style={[styles.faqNummerTekst, { color: isOpen ? "#000" : colors.mutedForeground }]}>{idx + 1}</Text>
                </View>
                <Text style={[styles.faqVraag, { color: isOpen ? colors.primary : colors.foreground }]}>{item.vraag}</Text>
                <Ionicons name={isOpen ? "chevron-up-outline" : "chevron-down-outline"} size={18} color={isOpen ? colors.primary : colors.mutedForeground} />
              </TouchableOpacity>
              {isOpen && <Text style={[styles.faqAntwoord, { color: colors.foreground }]}>{item.antwoord}</Text>}
            </View>
          );
        })}

        <View style={[styles.footer, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="alert-circle-outline" size={13} color={colors.mutedForeground} />
          <Text style={[styles.footerTekst, { color: colors.mutedForeground }]}>
            Deze prijs is een indicatie op basis van wettelijke maximumtarieven en kan afwijken van de daadwerkelijke taxameter.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitel: { fontSize: 17, fontFamily: "Inter_700Bold" },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  contactKaart: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  contactKop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  contactBedrijf: { fontSize: 20, fontFamily: "Inter_700Bold" },
  contactSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  contactIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  emailKnop: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 12 },
  emailTekst: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#000" },
  contactInfo: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  klantKaart: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  klantTekst: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 19 },
  faqTitel: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 4 },
  faqItem: { borderRadius: 14, borderWidth: 1.5, overflow: "hidden" },
  faqKop: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  faqNummer: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  faqNummerTekst: { fontSize: 12, fontFamily: "Inter_700Bold" },
  faqVraag: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 19 },
  faqAntwoord: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 0 },
  footer: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 4 },
  footerTekst: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
});
