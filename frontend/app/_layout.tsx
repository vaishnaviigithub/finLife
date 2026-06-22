import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { useFonts } from "expo-font";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { GameProvider } from "@/src/game/store";

// Suppress dev overlay noise so gameplay UI stays readable.
LogBox.ignoreAllLogs(true);

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [iconsLoaded, iconsError] = useIconFonts();
  const [appFontsLoaded, appFontsError] = useFonts({
    Silkscreen: require("../assets/fonts/Silkscreen-Regular.ttf"),
    SilkscreenBold: require("../assets/fonts/Silkscreen-Bold.ttf"),
    VT323: require("../assets/fonts/VT323-Regular.ttf"),
  });

  const ready = (iconsLoaded || iconsError) && (appFontsLoaded || appFontsError);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <GameProvider>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </GameProvider>
  );
}
