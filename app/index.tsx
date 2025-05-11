import { Button, Text, View } from "react-native";
import { createTables, getDBConnection } from '../utils/database';

export default function Index() {

  const initDatabase = async () => {
    try {
      const db = getDBConnection();
      await createTables(db);
      console.log('Database initialized and tables created');
    } catch (error) {
      console.error('Failed to initialize DB', error);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Button title="Inizializza Database" onPress={initDatabase} />
    </View>
  );
}
