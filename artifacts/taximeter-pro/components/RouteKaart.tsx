import React, { useEffect, useState } from "react";
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const PHOTON_URL = "https://photon.komoot.io/api/";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving/";

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

interface RouteState {
  startCoord: Coordinate | null;
  eindCoord: Coordinate | null;
  routeCoords: Coordinate[];
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
}

async function geocodeerAdres(adres: string): Promise<Coordinate | null> {
  try {
    const res = await fetch(
      `${PHOTON_URL}?q=${encodeURIComponent(adres)}&limit=1&lang=nl`
    );
    const data = await res.json();
    if (data.features?.[0]) {
      const [lon, lat] = data.features[0].geometry.coordinates as [number, number];
      return { latitude: lat, longitude: lon };
    }
  } catch {}
  return null;
}

async function haalOsrmRoute(
  start: Coordinate,
  eind: Coordinate
): Promise<Coordinate[]> {
  try {
    const url =
      `${OSRM_URL}${start.longitude},${start.latitude};${eind.longitude},${eind.latitude}` +
      `?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === "Ok" && data.routes?.[0]) {
      return (data.routes[0].geometry.coordinates as [number, number][]).map(
        ([lon, lat]) => ({ latitude: lat, longitude: lon })
      );
    }
  } catch {}
  return [];
}

function berekenRegion(
  start: Coordinate,
  eind: Coordinate
): RouteState["region"] {
  const minLat = Math.min(start.latitude, eind.latitude);
  const maxLat = Math.max(start.latitude, eind.latitude);
  const minLon = Math.min(start.longitude, eind.longitude);
  const maxLon = Math.max(start.longitude, eind.longitude);
  const latDelta = Math.max((maxLat - minLat) * 1.5, 0.02);
  const lonDelta = Math.max((maxLon - minLon) * 1.5, 0.02);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
}

function WebKaartPlaceholder({
  startLocatie,
  bestemming,
  hoogte,
  colors,
}: {
  startLocatie: string;
  bestemming: string;
  hoogte: number;
  colors: ReturnType<typeof useColors>;
}) {
  const mapsUrl =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(startLocatie)}` +
    `&destination=${encodeURIComponent(bestemming)}` +
    `&travelmode=driving`;

  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(mapsUrl)}
      activeOpacity={0.8}
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
      <Text style={[styles.linkTekst, { color: colors.primary }]}>
        Bekijk route op kaart ↗
      </Text>
    </TouchableOpacity>
  );
}

export function RouteKaart({ startLocatie, bestemming, hoogte = 250, onMapUrl }: Props) {
  const colors = useColors();
  const [routeState, setRouteState] = useState<RouteState>({
    startCoord: null,
    eindCoord: null,
    routeCoords: [],
    region: null,
  });
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState(false);

  useEffect(() => {
    if (!startLocatie || !bestemming) {
      setFout(true);
      setLaden(false);
      return;
    }
    setFout(false);
    setLaden(true);
    setRouteState({ startCoord: null, eindCoord: null, routeCoords: [], region: null });

    (async () => {
      try {
        const [start, eind] = await Promise.all([
          geocodeerAdres(startLocatie),
          geocodeerAdres(bestemming),
        ]);

        if (!start || !eind) {
          setFout(true);
          setLaden(false);
          return;
        }

        const [routeCoords] = await Promise.all([haalOsrmRoute(start, eind)]);

        const region = berekenRegion(start, eind);

        setRouteState({ startCoord: start, eindCoord: eind, routeCoords, region });
        onMapUrl?.(
          `https://www.google.com/maps/dir/?api=1` +
            `&origin=${encodeURIComponent(startLocatie)}` +
            `&destination=${encodeURIComponent(bestemming)}` +
            `&travelmode=driving`
        );
        setLaden(false);
      } catch {
        setFout(true);
        setLaden(false);
      }
    })();
  }, [startLocatie, bestemming]);

  if (Platform.OS === "web") {
    return (
      <WebKaartPlaceholder
        startLocatie={startLocatie}
        bestemming={bestemming}
        hoogte={hoogte}
        colors={colors}
      />
    );
  }

  if (fout) {
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

  if (laden || !routeState.region) {
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

  const NativeMap = require("react-native-maps").default;
  const { Polyline, Marker } = require("react-native-maps");

  return (
    <View style={[styles.kaart, { height: hoogte, borderColor: colors.border }]}>
      <NativeMap
        style={StyleSheet.absoluteFillObject}
        region={routeState.region}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
      >
        {routeState.routeCoords.length > 1 && (
          <Polyline
            coordinates={routeState.routeCoords}
            strokeColor="#FFD700"
            strokeWidth={4}
          />
        )}
        {routeState.startCoord && (
          <Marker
            coordinate={routeState.startCoord}
            pinColor="#FFD700"
            title="Start"
          />
        )}
        {routeState.eindCoord && (
          <Marker
            coordinate={routeState.eindCoord}
            pinColor="#FF6B35"
            title="Bestemming"
          />
        )}
      </NativeMap>
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
  linkTekst: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
  },
});
