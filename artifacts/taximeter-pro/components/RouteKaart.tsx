import * as FileSystem from "expo-file-system";
import React, { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MAPS_FETCH_OPTS } from "@/utils/berekeningen";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? "";

interface Props {
  startLocatie: string;
  bestemming: string;
  hoogte?: number;
  onMapUrl?: (url: string) => void;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

async function geocode(adres: string): Promise<Coordinate | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(adres)}&language=nl&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url, MAPS_FETCH_OPTS);
    const data = await res.json();
    if (data.results?.[0]) {
      const loc = data.results[0].geometry.location;
      return { latitude: loc.lat, longitude: loc.lng };
    }
  } catch {}
  return null;
}

function bouwStaticMapUrl(
  start: Coordinate,
  eind: Coordinate,
  encodedPolyline: string | null,
  breedte: number,
  hoogte: number
): string {
  const w = Math.round(breedte * 2);
  const h = Math.round(hoogte * 2);

  const darkStyles = [
    "style=element:geometry|color:0x1a1a2e",
    "style=element:labels.text.fill|color:0x888888",
    "style=element:labels.text.stroke|color:0x1a1a2e",
    "style=feature:road|element:geometry|color:0x2d2d2d",
    "style=feature:road.arterial|element:geometry|color:0x3a3a3a",
    "style=feature:road.highway|element:geometry|color:0x4a4a4a",
    "style=feature:water|element:geometry|color:0x0d1117",
    "style=feature:poi|visibility:off",
    "style=feature:transit|visibility:off",
  ].join("&");

  const markerStart = `markers=color:0xFFD700|label:A|${start.latitude},${start.longitude}`;
  const markerEind = `markers=color:0xFF6B35|label:B|${eind.latitude},${eind.longitude}`;

  const path = encodedPolyline
    ? `path=color:0xFFD700FF|weight:4|enc:${encodeURIComponent(encodedPolyline)}`
    : `path=color:0xFFD700FF|weight:3|${start.latitude},${start.longitude}|${eind.latitude},${eind.longitude}`;

  return (
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?size=${w}x${h}` +
    `&scale=1` +
    `&maptype=roadmap` +
    `&${darkStyles}` +
    `&${markerStart}` +
    `&${markerEind}` +
    `&${path}` +
    `&key=${GOOGLE_API_KEY}`
  );
}

export function RouteKaart({ startLocatie, bestemming, hoogte = 250, onMapUrl }: Props) {
  const colors = useColors();
  const [displayUri, setDisplayUri] = useState<string | null>(null);
  const [fout, setFout] = useState(false);
  const [breedte, setBreedte] = useState(350);

  useEffect(() => {
    if (!startLocatie || !bestemming || !GOOGLE_API_KEY) {
      setFout(true);
      return;
    }
    setFout(false);
    setDisplayUri(null);

    (async () => {
      try {
        let encodedPolyline: string | null = null;
        let start: Coordinate | null = null;
        let eind: Coordinate | null = null;

        const dirUrl =
          `https://maps.googleapis.com/maps/api/directions/json` +
          `?origin=${encodeURIComponent(startLocatie)}` +
          `&destination=${encodeURIComponent(bestemming)}` +
          `&language=nl&key=${GOOGLE_API_KEY}`;

        const res = await fetch(dirUrl, MAPS_FETCH_OPTS);
        const data = await res.json();

        if (data.status === "OK" && data.routes?.[0]) {
          const route = data.routes[0];
          const leg = route.legs[0];
          start = { latitude: leg.start_location.lat, longitude: leg.start_location.lng };
          eind = { latitude: leg.end_location.lat, longitude: leg.end_location.lng };
          encodedPolyline = route.overview_polyline.points;
        } else {
          [start, eind] = await Promise.all([geocode(startLocatie), geocode(bestemming)]);
        }

        if (!start || !eind) { setFout(true); return; }

        const mapUrl = bouwStaticMapUrl(start, eind, encodedPolyline, breedte, hoogte);
        onMapUrl?.(mapUrl);

        if (Platform.OS !== "web" && FileSystem.cacheDirectory) {
          const localPath = FileSystem.cacheDirectory + "taximeter-map.png";
          const result = await FileSystem.downloadAsync(mapUrl, localPath, {
            headers: { Referer: "https://taximeterpro.nl", Origin: "https://taximeterpro.nl" },
          });
          if (result.status === 200) {
            setDisplayUri(result.uri);
          } else {
            setDisplayUri(mapUrl);
          }
        } else {
          setDisplayUri(mapUrl);
        }
      } catch {
        setFout(true);
      }
    })();
  }, [startLocatie, bestemming, breedte, hoogte]);

  if (fout || !GOOGLE_API_KEY) {
    return (
      <View
        style={[
          styles.placeholder,
          { height: hoogte, backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.placeholderTekst, { color: colors.mutedForeground }]}>
          {startLocatie}
        </Text>
        <Text style={[styles.pijl, { color: colors.primary }]}>↓</Text>
        <Text style={[styles.placeholderTekst, { color: colors.mutedForeground }]}>
          {bestemming}
        </Text>
      </View>
    );
  }

  if (!displayUri) {
    return (
      <View
        style={[
          styles.placeholder,
          { height: hoogte, backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.ladenTekst, { color: colors.mutedForeground }]}>
          Kaart laden...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.kaart, { height: hoogte, borderColor: colors.border }]}
      onLayout={(e) => setBreedte(e.nativeEvent.layout.width)}
    >
      <Image
        source={{ uri: displayUri }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  kaart: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  placeholder: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 16,
  },
  placeholderTekst: {
    fontSize: 13,
    textAlign: "center",
  },
  pijl: {
    fontSize: 20,
    fontWeight: "bold",
  },
  ladenTekst: {
    fontSize: 13,
  },
});
