
// app/components/SearchDrawer.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SearchDrawer: React.FC = () => {
  return (
    <View style={styles.drawerContainer}>
      <Text>Search Drawer</Text>
    </View>
  );
};

export default SearchDrawer;

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
});
