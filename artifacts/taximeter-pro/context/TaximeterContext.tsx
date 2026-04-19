import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface TarifSettings {
  autoStart: number;
  autoKm: number;
  autoMin: number;
  busStart: number;
  busKm: number;
  busMin: number;
  waitPerHour: number;
}

export interface ExtraKosten {
  beschrijving: string;
  bedrag: number;
}

export interface RitResultaat {
  voertuig: "auto" | "bus";
  afstandKm: number;
  tijdMin: number;
  startTarief: number;
  kmTarief: number;
  minTarief: number;
  extraKosten: ExtraKosten[];
  totaalPrijs: number;
  startLocatie: string;
  bestemming: string;
  timestamp: number;
}

const DEFAULT_TARIEVEN: TarifSettings = {
  autoStart: 4.31,
  autoKm: 3.17,
  autoMin: 0.52,
  busStart: 8.77,
  busKm: 4.0,
  busMin: 0.59,
  waitPerHour: 59.41,
};

const STORAGE_KEY_TARIEVEN = "@taximeter_tarieven";
const STORAGE_KEY_HISTORY = "@taximeter_history";

interface TaximeterContextType {
  tarieven: TarifSettings;
  updateTarieven: (t: TarifSettings) => void;
  resetTarieven: () => void;
  history: RitResultaat[];
  addRit: (rit: RitResultaat) => void;
  clearHistory: () => void;
}

const TaximeterContext = createContext<TaximeterContextType | null>(null);

export function TaximeterProvider({ children }: { children: React.ReactNode }) {
  const [tarieven, setTarieven] = useState<TarifSettings>(DEFAULT_TARIEVEN);
  const [history, setHistory] = useState<RitResultaat[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_TARIEVEN).then((val) => {
      if (val) {
        try {
          setTarieven(JSON.parse(val));
        } catch {}
      }
    });
    AsyncStorage.getItem(STORAGE_KEY_HISTORY).then((val) => {
      if (val) {
        try {
          setHistory(JSON.parse(val));
        } catch {}
      }
    });
  }, []);

  const updateTarieven = useCallback((t: TarifSettings) => {
    setTarieven(t);
    AsyncStorage.setItem(STORAGE_KEY_TARIEVEN, JSON.stringify(t));
  }, []);

  const resetTarieven = useCallback(() => {
    setTarieven(DEFAULT_TARIEVEN);
    AsyncStorage.setItem(STORAGE_KEY_TARIEVEN, JSON.stringify(DEFAULT_TARIEVEN));
  }, []);

  const addRit = useCallback((rit: RitResultaat) => {
    setHistory((prev) => {
      const next = [rit, ...prev].slice(0, 50);
      AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    AsyncStorage.removeItem(STORAGE_KEY_HISTORY);
  }, []);

  return (
    <TaximeterContext.Provider
      value={{
        tarieven,
        updateTarieven,
        resetTarieven,
        history,
        addRit,
        clearHistory,
      }}
    >
      {children}
    </TaximeterContext.Provider>
  );
}

export function useTaximeter() {
  const ctx = useContext(TaximeterContext);
  if (!ctx) throw new Error("useTaximeter must be used within TaximeterProvider");
  return ctx;
}
