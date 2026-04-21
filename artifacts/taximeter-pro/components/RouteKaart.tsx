import MapView, { Marker, Polyline } from "react-native-maps";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? "";

interface Props {
  startLocatie: string;
  bestemming: string;
  hoogte?: number;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

function decodePolyline(encoded: string): Coordinate[] {
  const coords: Coordinate[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
}

export function RouteKaart({ startLocatie, bestemming, hoogte = 200 }: Props) {
  const colors = useColors();
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const [startCoord, setStartCoord] = useState<Coordinate | null>(null);
  const [eindCoord, setEindCoord] = useState<Coordinate | null>(null);
  const [fout, setFout] = useState(false);

  useEffect(() => {
    if (!startLocatie || !bestemming || !GOOGLE_API_KEY) return;
    setFout(false);
    (async () => {
      try {
        const url =
          `https://maps.googleapis.com/maps/api/directions/json` +
          `?origin=${encodeURIComponent(startLocatie)}` +
          `&destination=${encodeURIComponent(bestemming)}` +
          `&language=nl&key=${GOOGLE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status !== "OK" || !data.routes?.[0]) { setFout(true); return; }
        const route = data.routes[0];
        const coords = decodePolyline(route.overview_polyline.encoded);
        setRouteCoords(coords);
        const leg = route.legs[0];
        setStartCoord({ latitude: leg.start_location.lat, longitude: leg.start_location.lng });
        setEindCoord({ latitude: leg.end_location.lat, longitude: leg.end_location.lng });
      } catch { setFout(true); }
    })();
  }, [startLocatie, bestemming]);

  if (fout || routeCoords.length === 0 || !startCoord || !eindCoord) return null;

  const allLats = routeCoords.map((c) => c.latitude);
  const allLngs = routeCoords.map((c) => c.longitude);
  const midLat = (Math.max(...allLats) + Math.min(...allLats)) / 2;
  const midLng = (Math.max(...allLngs) + Math.min(...allLngs)) / 2;
  const deltaLat = (Math.max(...allLats) - Math.min(...allLats)) * 1.4 + 0.01;
  const deltaLng = (Math.max(...allLngs) - Math.min(...allLngs)) * 1.4 + 0.01;

  return (
    <View style={[styles.kaart, { height: hoogte, borderColor: colors.border }]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        userInterfaceStyle="dark"
        initialRegion={{ latitude: midLat, longitude: midLng, latitudeDelta: deltaLat, longitudeDelta: deltaLng }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <Marker coordinate={startCoord} pinColor="#FFD700" title="Start" />
        <Marker coordinate={eindCoord} pinColor="#FF6B35" title="Bestemming" />
        <Polyline coordinates={routeCoords} strokeColor="#FFD700" strokeWidth={4} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  kaart: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
});
