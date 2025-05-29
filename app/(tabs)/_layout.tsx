// filepath: /Users/fp/GitHub Repos/BookTrack/app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

export default function Layout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#4A90E2',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: { 
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            position: 'absolute',
            height: 90,
            paddingTop: 10,
            paddingBottom: 30,
            ...styles.shadow
          },
          tabBarLabelStyle: { 
            fontSize: 12, 
            fontWeight: '500',
            marginTop: 4 
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({color, size}) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="aggiungi"
          options={{
            title: 'Aggiungi',
            tabBarIcon: ({focused, size}) => (
              <View style={{
                backgroundColor: focused ? '#4A90E2' : '#6BA3E8',
                borderRadius: 20,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: -5
              }}>
                <Ionicons 
                  name="add" 
                  size={24} 
                  color="white" 
                />
              </View>
            ),
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
              marginTop: 4,
              color: '#4A90E2'
            }
          }}
        />
        <Tabs.Screen
          name="profilo"
          options={{
            title: 'Profilo',
            tabBarIcon: ({color, size}) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.5,
    elevation: 5
  }
});
