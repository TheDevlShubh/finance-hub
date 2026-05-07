import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ThemeContext, getHeroTheme } from '../lib/themeContext';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [heroId, setHeroId] = useState<string>('cap');
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    let unsub: (() => void) | null = null;

    const init = async () => {
      const email = await AsyncStorage.getItem('financehub_user_email');
      if (email) {
        // Subscribe to hero changes live — unsubscribe stored for cleanup
        unsub = onSnapshot(doc(db, 'public_users', email), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.heroId) setHeroId(data.heroId);
          }
          // Only mark ready after we've received the first snapshot
          setIsReady(true);
        });
      } else {
        setIsReady(true);
      }
    };

    init();

    // This cleanup properly runs when the component unmounts
    return () => { if (unsub) unsub(); };
  }, [segments]);

  useEffect(() => {
    if (!isReady) return;

    const checkAuth = async () => {
      const email = await AsyncStorage.getItem('financehub_user_email');
      const isAuthenticated = !!email;
      const inAuthGroup = segments[0] === '(tabs)';
      const isLoginScreen = segments[0] === 'login';

      if (!isAuthenticated && inAuthGroup) {
        router.replace('/login');
      } else if (isAuthenticated && (isLoginScreen || !segments.length)) {
        router.replace('/(tabs)');
      }
    };
    checkAuth();
  }, [segments, isReady]);

  if (!isReady) return null;

  const theme = getHeroTheme(heroId);

  return (
    <ThemeContext.Provider value={theme}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
