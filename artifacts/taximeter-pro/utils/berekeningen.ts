import { Platform } from "react-native";
import type { ExtraKosten, RitResultaat, TarifSettings } from "@/context/TaximeterContext";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? "";

export const MAPS_FETCH_OPTS: RequestInit = Platform.OS !== "web"
  ? { headers: { Referer: "https://taximeterpro.nl", Origin: "https://taximeterpro.nl" } }
  : {};

interface RouteData {
  afstandKm: number;
  tijdMin: number;
}

export async function haalRouteData(
  origin: string,
  destination: string
): Promise<RouteData> {
  if (!GOOGLE_API_KEY) {
    throw new Error("Geen Google Maps API sleutel geconfigureerd");
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
    origin
  )}&destinations=${encodeURIComponent(destination)}&language=nl&key=${GOOGLE_API_KEY}`;

  const res = await fetch(url, MAPS_FETCH_OPTS);
  if (!res.ok) throw new Error("API verzoek mislukt");

  const data = await res.json();

  if (data.status === "REQUEST_DENIED") {
    throw new Error(`API sleutel heeft geen toegang: ${data.error_message ?? "REQUEST_DENIED"}`);
  }

  if (
    data.status !== "OK" ||
    !data.rows?.[0]?.elements?.[0] ||
    data.rows[0].elements[0].status !== "OK"
  ) {
    throw new Error("Route niet gevonden");
  }

  const el = data.rows[0].elements[0];
  const afstandM: number = el.distance.value;
  const tijdSec: number = el.duration.value;

  return {
    afstandKm: afstandM / 1000,
    tijdMin: tijdSec / 60,
  };
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

interface BerekenParams {
  voertuig: "auto" | "bus";
  afstandKm: number;
  tijdMin: number;
  tarieven: TarifSettings;
  extraKosten: ExtraKosten[];
  startLocatie: string;
  bestemming: string;
}

export function berekenRit(params: BerekenParams): RitResultaat {
  const { voertuig, afstandKm, tijdMin, tarieven, extraKosten, startLocatie, bestemming } = params;

  const startTarief = voertuig === "auto" ? tarieven.autoStart : tarieven.busStart;
  const kmTarief = voertuig === "auto" ? tarieven.autoKm : tarieven.busKm;
  const minTarief = voertuig === "auto" ? tarieven.autoMin : tarieven.busMin;

  const kmKosten = afstandKm * kmTarief;
  const minKosten = tijdMin * minTarief;
  const extraTotaal = extraKosten.reduce((sum, ek) => sum + ek.bedrag, 0);

  const totaalPrijs = startTarief + kmKosten + minKosten + extraTotaal;

  return {
    id: genId(),
    voertuig,
    afstandKm,
    tijdMin,
    startTarief,
    kmTarief,
    minTarief,
    extraKosten,
    totaalPrijs,
    startLocatie,
    bestemming,
    timestamp: Date.now(),
  };
}
