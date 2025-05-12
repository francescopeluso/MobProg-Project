import { StyleSheet, Text, View } from 'react-native';

export default function AggiungiScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Aggiungi</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
});
