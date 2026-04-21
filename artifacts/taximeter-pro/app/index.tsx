import { Redirect } from "expo-router";
import { Platform } from "react-native";

export default function RootIndex() {
  if (Platform.OS === "web") {
    return <Redirect href="/landing" />;
  }
  return <Redirect href="/(tabs)" />;
}
