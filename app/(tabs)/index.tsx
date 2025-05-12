// app/(tabs)/index.tsx
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SQLite from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import BookCarousel, { Book } from '../../src/components/BookCarousel';
import SessionButton from '../../src/components/SessionButton';
import SearchModal from '../../src/components/SearchModal';
import { createTables, getDBConnection } from '../../utils/database';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const [dbReady, setDbReady] = useState(false);
  const [toRead, setToRead] = useState<Book[]>([]);
  const [reading, setReading] = useState<Book[]>([]);
  const [completed, setCompleted] = useState<Book[]>([]);
  const [suggested, setSuggested] = useState<Book[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();

  /* Init DB once */
  useEffect(() => {
    const dbSync = getDBConnection();
    createTables(dbSync).then(() => setDbReady(true));
  }, []);

  /* Fetch lists every time screen gains focus */
  const fetchLists = useCallback(async () => {
    const db = await SQLite.openDatabaseAsync('myapp.db');
    await db.execAsync('PRAGMA foreign_keys = ON;');

    const query = (status: string) =>
      db.getAllAsync(
        `SELECT b.id, b.title, b.cover_url as coverUrl
           FROM books b
           JOIN reading_status rs ON rs.book_id = b.id
          WHERE rs.status = ?
          ORDER BY ${status === 'reading' ? 'rs.start_time DESC' : 'b.title'};`,
        status
      ) as Promise<Book[]>;

    const [tr, rd, cp] = await Promise.all([
      query('to_read'),
      query('reading'),
      query('completed'),
    ]);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setToRead(tr);
    setReading(rd);
    setCompleted(cp);
    setSuggested([]); // TODO suggeriti
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (dbReady) fetchLists();
    }, [dbReady, fetchLists])
  );

  if (!dbReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.searchStub} onPress={() => setShowSearch(true)}>
          <Ionicons name="search" size={16} color="#666" style={{ marginRight: 6 }} />
          <Text style={{ color: '#666' }}>Cerca…</Text>
        </Pressable>
        <SessionButton variant="compact" />
      </View>

      <ScrollView style={styles.container} scrollIndicatorInsets={{ right: 1 }}>
        <Section title="Da leggere" books={toRead} router={router} />
        <Section title="In lettura" books={reading} router={router} />
        <Section title="Completati" books={completed} router={router} />
        <Section title="Suggeriti" books={suggested} router={router} />
      </ScrollView>

      <Modal visible={showSearch} animationType="slide" onRequestClose={() => setShowSearch(false)}>
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

function Section({ title, books, router }: { title: string; books: Book[]; router: any }) {
  if (books.length === 0) return null;
  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <BookCarousel books={books} onPress={(id) => router.push({ pathname: '/book-details', params: { id } })} />
    </>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  searchStub: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f1f1', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  container: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 12 },
});
