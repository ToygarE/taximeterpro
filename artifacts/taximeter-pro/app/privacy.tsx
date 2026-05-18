import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const pt = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const pb = Platform.OS === "web" ? 34 : insets.bottom;

  const Sectie = ({
    titel,
    tekst,
  }: {
    titel: string;
    tekst: string;
  }) => (
    <View style={styles.sectie}>
      <Text style={[styles.sectieTitel, { color: colors.primary }]}>
        {titel}
      </Text>
      <Text style={[styles.sectietekst, { color: colors.foreground }]}>
        {tekst}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.headerBar,
          { paddingTop: pt + 8, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitel, { color: colors.foreground }]}>
          Privacybeleid
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: pb + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.datum, { color: colors.mutedForeground }]}>
          Laatste update: mei 2026
        </Text>

        <Text style={[styles.intro, { color: colors.foreground }]}>
          Taximeter Pro respecteert uw privacy en verwerkt zo min mogelijk persoonsgegevens. Dit privacybeleid legt uit hoe de app omgaat met uw gegevens.
        </Text>

        <Sectie
          titel="1. Welke gegevens verzamelen wij?"
          tekst="Taximeter Pro verzamelt geen persoonsgegevens en verstuurt geen gegevens naar externe servers. Alle berekeningen en rithistorie worden uitsluitend lokaal op uw apparaat opgeslagen via de beveiligde opslag van uw besturingssysteem."
        />

        <Sectie
          titel="2. GPS-locatie"
          tekst="De app kan optioneel gebruik maken van uw GPS-locatie om uw huidige positie als startlocatie van een rit in te vullen. Deze locatiedata wordt alleen op uw apparaat verwerkt en nooit opgeslagen of gedeeld. U heeft altijd de keuze om GPS-toegang te weigeren; de app werkt dan met handmatige invoer."
        />

        <Sectie
          titel="3. Privacy-vriendelijke Locatiediensten"
          tekst="Adreszoekopdrachten worden anoniem en direct verwerkt via open-source locatietechnologie (OpenStreetMap/Photon), rechtstreeks op uw apparaat. Er worden geen privacygevoelige locatiegegevens naar externe cloudservers van derden verstuurd. De routeberekening maakt gebruik van de Google Maps Directions API, die alleen de door u ingevoerde adressen ontvangt — geen persoonsgegevens of GPS-coördinaten. Raadpleeg het privacybeleid van Google (https://policies.google.com/privacy) voor meer informatie."
        />

        <Sectie
          titel="4. Deelfunctie"
          tekst="De deelfunctie verstuurt een prijsoverzicht via de deeloptie van uw apparaat (bijv. WhatsApp of SMS). De inhoud van dit bericht wordt uitsluitend door u bepaald en verwerkt door de door u gekozen app. Taximeter Pro heeft geen toegang tot uw berichten of contacten."
        />

        <Sectie
          titel="5. Gegevensopslag"
          tekst="Alle app-instellingen, tarieven en ritgeschiedenis worden lokaal opgeslagen in de beveiligde opslag van uw apparaat (AsyncStorage). Deze gegevens worden niet gedeeld, gesynchroniseerd of naar externe servers verstuurd. U kunt alle opgeslagen gegevens wissen via de instellingen van de app of door de app te verwijderen."
        />

        <Sectie
          titel="6. Cookies en tracking"
          tekst="Taximeter Pro maakt geen gebruik van cookies, trackingpixels, analysediensten of reclamenetwerken. Er wordt geen gebruiksstatistiek bijgehouden."
        />

        <Sectie
          titel="7. Beveiliging"
          tekst="Alle data op uw apparaat is beschermd door de ingebouwde beveiligingsmaatregelen van uw besturingssysteem (iOS of Android). Wij hanteren het beginsel van minimale dataverzameling: we verzamelen alleen wat strikt noodzakelijk is voor de werking van de app."
        />

        <Sectie
          titel="8. Uw rechten"
          tekst="Aangezien wij geen persoonsgegevens verwerken, zijn de AVG/GDPR-rechten inzake inzage, correctie en verwijdering van toepassing op de lokaal opgeslagen gegevens op uw eigen apparaat. U kunt deze te allen tijde verwijderen via de instellingen van de app."
        />

        <Sectie
          titel="9. Contact"
          tekst="Heeft u vragen over dit privacybeleid? Neem dan contact op via de app-informatie in de betreffende App Store."
        />

        <View
          style={[
            styles.disclaimer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={[styles.disclaimerTekst, { color: colors.mutedForeground }]}>
            Taximeter Pro is gebouwd met respect voor uw privacy. Adreszoekopdrachten verlaten nooit uw apparaat als persoonsgegevens — de app maakt gebruik van anonieme, open-source locatietechnologie.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitel: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },
  datum: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  intro: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  sectie: {
    gap: 8,
  },
  sectieTitel: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  sectietekst: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  disclaimer: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "flex-start",
    marginTop: 8,
  },
  disclaimerTekst: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
});
