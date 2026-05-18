import type { ExtraKosten, RitResultaat, TarifSettings } from "@/context/TaximeterContext";

const PHOTON_URL = "https://photon.komoot.io/api/";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving/";

interface RouteData {
  afstandKm: number;
  tijdMin: number;
}

async function geocodeerAdres(adres: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `${PHOTON_URL}?q=${encodeURIComponent(adres)}&limit=1&lang=nl`
    );
    const data = await res.json();
    if (data.features?.[0]) {
      const [lon, lat] = data.features[0].geometry.coordinates as [number, number];
      return [lon, lat];
    }
  } catch {}
  return null;
}

export async function haalRouteData(
  origin: string,
  destination: string
): Promise<RouteData> {
  const [startCoord, eindCoord] = await Promise.all([
    geocodeerAdres(origin),
    geocodeerAdres(destination),
  ]);

  if (!startCoord || !eindCoord) {
    throw new Error("Locaties niet gevonden via Photon");
  }

  const [startLon, startLat] = startCoord;
  const [eindLon, eindLat] = eindCoord;

  const url =
    `${OSRM_URL}${startLon},${startLat};${eindLon},${eindLat}` +
    `?overview=false`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("OSRM verzoek mislukt");

  const data = await res.json();

  if (data.code !== "Ok" || !data.routes?.[0]) {
    throw new Error("Route niet gevonden via OSRM");
  }

  return {
    afstandKm: data.routes[0].distance / 1000,
    tijdMin: data.routes[0].duration / 60,
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

  const afstandKmAfgerond = Math.round(afstandKm * 10) / 10;
  const tijdMinAfgerond = Math.round(tijdMin);

  const kmKosten = afstandKmAfgerond * kmTarief;
  const minKosten = tijdMinAfgerond * minTarief;
  const extraTotaal = extraKosten.reduce((sum, ek) => sum + ek.bedrag, 0);

  const totaalPrijs = startTarief + kmKosten + minKosten + extraTotaal;

  return {
    id: genId(),
    voertuig,
    afstandKm: afstandKmAfgerond,
    tijdMin: tijdMinAfgerond,
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
