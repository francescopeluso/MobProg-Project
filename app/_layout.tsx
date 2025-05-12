import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen
      name="index"
      options={{
        title: 'Home',
        tabBarIcon: ({ color, size }) => (
        <Ionicons name="home" color={color} size={size} />
        ),
      }}
      />
      <Tabs.Screen
      name="add-book"
      options={{
        title: 'Add a Book',
        tabBarIcon: ({ color, size }) => (
        <Ionicons name="book" color={color} size={size} />
        ),
      }}
      />
      <Tabs.Screen
      name="profile"
      options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => (
        <Ionicons name="person" color={color} size={size} />
        ),
      }}
      />
    </Tabs>
  );
}

