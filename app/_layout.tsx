import { ThemeProvider } from "@react-navigation/native";
import { router, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { MatchdayNavigationTheme } from "@/constants/theme";

function AuthGuard() {
  const { loading, user } = useAuth();
  const segments = useSegments();
  const redirecting = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      redirecting.current = false;
      return;
    }
    const inTabs = segments[0] === "(tabs)";
    if (inTabs && !redirecting.current) {
      redirecting.current = true;
      router.replace("/");
    }
  }, [loading, user, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <ThemeProvider value={MatchdayNavigationTheme}>
      <AuthProvider>
        <AuthGuard />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="verify-email/index" options={{ headerShown: false }} />
          <Stack.Screen name="reset-password/index" options={{ headerShown: false }} />
          <Stack.Screen name="organization/[id]/index" options={{ headerShown: false }} />
          <Stack.Screen name="organization/[id]/invite" options={{ headerShown: false }} />
          <Stack.Screen name="accept-invitation/index" options={{ headerShown: false }} />
          <Stack.Screen name="organizations/[slug]/join" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="light" />
      </AuthProvider>
    </ThemeProvider>
  );
}
