import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';

const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const router    = useRouter()
  const navState  = useRootNavigationState()          // ready when key is set
  const [onboarded, setOnboarded] = useState<boolean | null>(null)

  // Step 1 — resolve auth (independent of navigation readiness)
  useEffect(() => {
    async function bootstrap() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        let isOnboarded: boolean
        if (!session) {
          const { data, error } = await supabase.auth.signInAnonymously()
          if (error) throw error
          isOnboarded = !!data.user?.user_metadata?.onboarded
        } else {
          isOnboarded = !!session.user.user_metadata?.onboarded
        }

        setOnboarded(isOnboarded)
      } catch (error) {
        console.error('Auth bootstrap failed:', error)
        setOnboarded(false) // redirect to onboarding on failure
      }
    }

    bootstrap()
  }, [])

  // Step 2 — navigate only once BOTH auth is resolved AND navigation is ready
  useEffect(() => {
    if (!navState?.key)    return  // navigation container not mounted yet
    if (onboarded === null) return  // auth not resolved yet

    if (!onboarded) {
      router.replace('/onboarding')
    }
  }, [navState?.key, onboarded, router])

  return (
    <QueryClientProvider client={queryClient}>
      {/* Stack always renders so all routes are registered before any redirect */}
      <Stack>
        <Stack.Screen name="(tabs)"     options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="scan"       options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen
          name="plant/[id]"
          options={{ headerBackTitle: 'Library', title: 'Plant Detail' }}
        />
      </Stack>

      {/* Overlay while auth resolves — prevents flash of tabs before redirect */}
      {onboarded === null && (
        <View style={styles.overlay} />
      )}

      <StatusBar style="auto" />
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EDEAE3',
  },
})
