import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
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

export function RouteKaart({ startLocatie, bestemming, hoogte = 250 }: Props) {
  const colors = useColors();
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const [startCoord, setStartCoord] = useState<Coordinate | null>(null);
  const [eindCoord, setEindCoord] = useState<Coordinate | null>(null);
  const [fout, setFout] = useState(false);
  const [klaar, setKlaar] = useState(false);

  useEffect(() => {
    if (!startLocatie || !bestemming) return;
    setFout(false);
    setKlaar(false);
    (async () => {
      try {
        let sCoord: Coordinate | null = null;
        let eCoord: Coordinate | null = null;
        let coords: Coordinate[] = [];

        if (GOOGLE_API_KEY) {
          const url =
            `https://maps.googleapis.com/maps/api/directions/json` +
            `?origin=${encodeURIComponent(startLocatie)}` +
            `&destination=${encodeURIComponent(bestemming)}` +
            `&language=nl&key=${GOOGLE_API_KEY}`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.status === "OK" && data.routes?.[0]) {
            const route = data.routes[0];
            coords = decodePolyline(route.overview_polyline.encoded);
            const leg = route.legs[0];
            sCoord = { latitude: leg.start_location.lat, longitude: leg.start_location.lng };
            eCoord = { latitude: leg.end_location.lat, longitude: leg.end_location.lng };
          } else {
            // Geocode fallback
            const [geoStart, geoEnd] = await Promise.all([
              geocode(startLocatie),
              geocode(bestemming),
            ]);
            if (geoStart && geoEnd) {
              sCoord = geoStart;
              eCoord = geoEnd;
              coords = [geoStart, geoEnd];
            }
          }
        }

        if (!sCoord || !eCoord) { setFout(true); return; }
        setRouteCoords(coords);
        setStartCoord(sCoord);
        setEindCoord(eCoord);
        setKlaar(true);
      } catch { setFout(true); }
    })();
  }, [startLocatie, bestemming]);

  if (fout || !klaar) return null;
  if (!startCoord || !eindCoord) return null;

  const allLats = routeCoords.map((c) => c.latitude);
  const allLngs = routeCoords.map((c) => c.longitude);
  const midLat = (Math.max(...allLats) + Math.min(...allLats)) / 2;
  const midLng = (Math.max(...allLngs) + Math.min(...allLngs)) / 2;
  const deltaLat = Math.max((Math.max(...allLats) - Math.min(...allLats)) * 1.5, 0.02);
  const deltaLng = Math.max((Math.max(...allLngs) - Math.min(...allLngs)) * 1.5, 0.02);

  return (
    <View style={[styles.kaart, { height: hoogte, borderColor: colors.border }]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        userInterfaceStyle="dark"
        initialRegion={{
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: deltaLat,
          longitudeDelta: deltaLng,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        showsCompass={false}
        showsUserLocation={false}
      >
        <Marker coordinate={startCoord} pinColor="#FFD700" title="Start" />
        <Marker coordinate={eindCoord} pinColor="#FF6B35" title="Bestemming" />
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#FFD700"
            strokeWidth={4}
          />
        )}
      </MapView>
    </View>
  );
}

async function geocode(adres: string): Promise<Coordinate | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(adres)}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results?.[0]) {
      const loc = data.results[0].geometry.location;
      return { latitude: loc.lat, longitude: loc.lng };
    }
  } catch {}
  return null;
}

const styles = StyleSheet.create({
  kaart: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
});
