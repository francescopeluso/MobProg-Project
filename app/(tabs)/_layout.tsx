import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          // cast icon name as any to satisfy TS
          let iconName: any;
          switch (route.name) {
            case 'index':
              iconName = 'home-outline';
              break;
            case 'add-book':
              iconName = 'book-outline';
              break;
            case 'profile':
              iconName = 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: { fontSize: 12 },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home' }}
      />
      <Tabs.Screen
        name="add-book"
        options={{ title: 'Aggiungi' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profilo' }}
      />
      {/* modali */}
      <Tabs.Screen name="search" options={{ title: 'Cerca' }} />
      <Tabs.Screen name="book-details" options={{ title: 'Dettagli' }} />
      <Tabs.Screen name="list-details" options={{ title: 'Lista' }} />
    </Tabs>
  );
}
