// app/_layout.tsx
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Navigator primario: Tabs */}
        <Stack.Screen name="(tabs)" />
        {/* Modali e dettagli come stack separati */}
        <Stack.Screen
          name="search"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="book-details"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="list-details"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}