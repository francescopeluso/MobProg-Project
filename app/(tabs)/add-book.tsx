// app/screens/add-book.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AddBookScreen: React.FC = () => {
  return (
    <View style={addBookStyles.container}>
      <Text>Add Book Screen</Text>
    </View>
  );
};

export default AddBookScreen;

const addBookStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});