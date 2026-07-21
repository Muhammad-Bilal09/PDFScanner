import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { GlobalProcessor } from "@/components/shared/GlobalProcessor";
import { ThemeProvider, useThemeContext } from "@/context/theme-context";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colorScheme } = useThemeContext();

  return (
    <NavThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <GlobalProcessor />
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ animation: "none" }} />
        <Stack.Screen name="home" options={{ animation: "fade" }} />
        <Stack.Screen
          name="scan"
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="settings" options={{ animation: "fade" }} />
        <Stack.Screen
          name="documentEdit"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="exportShare"
          options={{ animation: "slide_from_bottom" }}
        />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
