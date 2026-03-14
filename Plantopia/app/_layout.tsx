import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';

const queryClient = new QueryClient();

type Dest = null | 'auth' | 'onboarding' | 'tabs';

function resolveDest(session: { user: { is_anonymous?: boolean; user_metadata?: { onboarded?: boolean } } } | null): Dest {
  if (!session || session.user.is_anonymous === true) {
    return 'auth';
  }
  if (session.user.user_metadata?.onboarded !== true) {
    return 'onboarding';
  }
  return 'tabs';
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const router   = useRouter();
  const navState = useRootNavigationState();   // ready when key is set
  const [dest, setDest] = useState<Dest>(null);

  // Step 1 — resolve initial session
  useEffect(() => {
    async function bootstrap() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setDest(resolveDest(session));
      } catch (error) {
        console.error('Auth bootstrap failed:', error);
        setDest('auth');
      }
    }
    bootstrap();
  }, []);

  // Subscribe to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        queryClient.clear()   // wipe all cached data so next user starts fresh
        setDest('auth');
      } else if (event === 'SIGNED_IN') {
        setDest(resolveDest(session));
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Step 2 — navigate once BOTH auth is resolved AND navigation is ready
  useEffect(() => {
    if (!navState?.key) return;   // navigation container not mounted yet
    if (dest === null)  return;   // auth not resolved yet

    if (dest === 'auth') {
      router.replace('/landing');
    } else if (dest === 'onboarding') {
      router.replace('/onboarding');
    } else if (dest === 'tabs') {
      router.replace('/(tabs)');
    }
  }, [navState?.key, dest, router]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Stack always renders so all routes are registered before any redirect */}
      <Stack>
        <Stack.Screen name="(tabs)"      options={{ headerShown: false }} />
        <Stack.Screen name="onboarding"  options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="landing"      options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="auth/sign-in" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="auth/sign-up" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="scan"        options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen
          name="plant/[id]"
          options={{ headerBackTitle: 'Library', title: 'Plant Detail' }}
        />
      </Stack>

      {/* Overlay while auth resolves — prevents flash of tabs before redirect */}
      {dest === null && (
        <View style={styles.overlay} />
      )}

      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EDEAE3',
  },
});
