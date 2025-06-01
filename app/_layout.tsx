import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '@/constants/styles';

export default function RootLayout() {
  // Stato locale
  const [isReady, setIsReady] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);

  // Leggi il flag dall'AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem('hasSeenIntro');
        setHasSeenIntro(seen === 'true');
      } finally {
        setIsReady(true); // In ogni caso sblocca il layout
      }
    })();
  }, []);

  // Splash finché non siamo pronti
  if (!isReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  // Layout principale con redirect condizionali
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Se l'intro non è ancora stata vista, vai su /onboarding */}
      {hasSeenIntro === false && <Redirect href="/onboarding" />}

      {/* Se l'intro è già stata vista, vai direttamente alle tab */}
      {hasSeenIntro === true && <Redirect href="/(tabs)" />}

      {/* Registriamo comunque entrambe le rotte nello stack */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
