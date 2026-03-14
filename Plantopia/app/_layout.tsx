import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';

const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function bootstrap() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        let onboarded: boolean

        if (!session) {
          const { data, error } = await supabase.auth.signInAnonymously()
          if (error) throw error
          onboarded = !!data.user?.user_metadata?.onboarded
        } else {
          onboarded = !!session.user.user_metadata?.onboarded
        }

        if (!onboarded) {
          router.replace('/onboarding')
        }
      } catch (error) {
        console.error('Auth bootstrap failed:', error)
        router.replace('/onboarding')
      } finally {
        setReady(true)
      }
    }

    bootstrap()
  }, [router])

  // Show blank beige screen while auth resolves to avoid tab flash
  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: '#EDEAE3' }} />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="(tabs)"      options={{ headerShown: false }} />
        <Stack.Screen name="onboarding"  options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="scan"        options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen
          name="plant/[id]"
          options={{ headerBackTitle: 'Library', title: 'Plant Detail' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
