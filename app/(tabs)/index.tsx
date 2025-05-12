// app/(tabs)/index.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import BookCarousel, { Book } from '../../src/components/BookCarousel';
import SessionButton from '../../src/components/SessionButton';
import { createTables, getDBConnection } from '../../utils/database';

/**
 * HomeScreen
 * Schermata principale dell'app.
 */
export default function HomeScreen() {
  const [dbReady, setDbReady] = useState(false);
  const [readingBooks, setReadingBooks] = useState<Book[]>([]);
  const [suggestedBooks, setSuggestedBooks] = useState<Book[]>([]);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const db = getDBConnection();
      await createTables(db);
      // TODO: sostituire con query reali da SQLite
      setReadingBooks([
        { id: 1, title: 'Sample Reading', coverUrl: 'https://via.placeholder.com/100x150' },
      ]);
      setSuggestedBooks([
        { id: 2, title: 'Sample Suggestion', coverUrl: 'https://via.placeholder.com/100x150' },
      ]);
      setDbReady(true);
    })();
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Session Button */}
      <SessionButton />

      {/* Carousel: Attualmente in lettura */}
      <Text style={styles.sectionTitle}>In lettura</Text>
      <BookCarousel
        books={readingBooks}
        onPress={(id) =>
          router.push({ pathname: '/book-details', params: { id } })
        }
      />

      {/* Carousel: Suggeriti */}
      <Text style={styles.sectionTitle}>Suggeriti</Text>
      <BookCarousel
        books={suggestedBooks}
        onPress={(id) =>
          router.push({ pathname: '/book-details', params: { id } })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
  },
});
