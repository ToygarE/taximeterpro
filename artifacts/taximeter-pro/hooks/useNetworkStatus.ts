import { useEffect, useState } from "react";
import { Platform } from "react-native";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS === "web") {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    } else {
      // Native: periodically ping a lightweight endpoint
      let interval: ReturnType<typeof setInterval>;

      const check = async () => {
        try {
          await fetch("https://www.google.com/generate_204", {
            method: "HEAD",
            cache: "no-cache",
          });
          setIsOnline(true);
        } catch {
          setIsOnline(false);
        }
      };

      check();
      interval = setInterval(check, 15000);

      return () => clearInterval(interval);
    }
  }, []);

  return { isOnline };
}
