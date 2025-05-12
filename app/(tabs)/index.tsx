// app/(tabs)/index.tsx
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable
} from 'react-native';
import BookCarousel, { Book } from '../../src/components/BookCarousel';
import SessionButton from '../../src/components/SessionButton';
import SearchModal from '../../src/components/SearchModal';
import { createTables, getDBConnection } from '../../utils/database';


/**
 * HomeScreen
 * Schermata principale dell'app.
 */
export default function HomeScreen() {
  const [dbReady, setDbReady] = useState(false);
  const [readingBooks, setReadingBooks] = useState<Book[]>([]);
  const [suggestedBooks, setSuggestedBooks] = useState<Book[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const router = useRouter();

  /* ------------------------------ init db ------------------------------ */
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

  /* -------------------------------- UI -------------------------------- */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Top bar con barra di ricerca tappabile */}
      <View style={styles.topBar}>
        <Pressable style={styles.searchStub} onPress={() => setShowSearch(true)}>
          <Ionicons name="search" size={16} color="#666" style={{ marginRight: 6 }} />
          <Text style={{ color: '#666' }}>Cerca…</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.container} scrollIndicatorInsets={{ right: 1 }}>
        {/* Session Button */}
        <SessionButton />

        {/* Carousel: In lettura */}
        <Text style={styles.sectionTitle}>In lettura</Text>
        <BookCarousel
          books={readingBooks}
          onPress={(id) => router.push({ pathname: '/book-details', params: { id } })}
        />

        {/* Carousel: Suggeriti */}
        <Text style={styles.sectionTitle}>Suggeriti</Text>
        <BookCarousel
          books={suggestedBooks}
          onPress={(id) => router.push({ pathname: '/book-details', params: { id } })}
        />
      </ScrollView>

      {/* Modal di ricerca (solo libri locali) */}
      <Modal
        visible={showSearch}
        animationType="slide"
        onRequestClose={() => setShowSearch(false)}
      >
        <SearchModal
          mode="local"
          onSelectLocal={(b) => {
            setShowSearch(false);
            router.push(`/book-details?id=${b.id}`);
          }}
          onClose={() => setShowSearch(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

/* -------------------------------- styles ------------------------------- */
const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  searchStub: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
  },
});