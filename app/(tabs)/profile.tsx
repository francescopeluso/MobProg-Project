// app/screens/profile.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProfileScreen: React.FC = () => {
  return (
    <View style={profileStyles.container}>
      <Text>Profile Screen</Text>
    </View>
  );
};

export default ProfileScreen;

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
