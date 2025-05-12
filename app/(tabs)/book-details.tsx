// app/(tabs)/book-details.tsx
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Button,
  Modal,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';

interface BookDetails {
  id: number;
  title: string;
  author: string;
  description: string;
  coverUrl?: string;
  publication?: number;
status: 'to_read' | 'reading' | 'completed';
}

interface NoteRow {
  book_id: number;
  notes_text: string;
}
interface RatingRow {
  book_id: number;
  rating: number;
}
export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [book, setBook] = useState<BookDetails | null>(null);
  const [status, setStatus] = useState<"to_read" | "reading" | "completed">('to_read');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [showNotesModal, setShowNotesModal] = useState(false);

  useEffect(() => {
    (async () => {
      const db = await SQLite.openDatabaseAsync('myapp.db');
      await db.execAsync('PRAGMA foreign_keys = ON;');

      const row = await db.getFirstAsync(
        `SELECT b.id, b.title, b.description, b.cover_url AS coverUrl,
                b.publication, a.name AS author, rs.status
           FROM books b
           JOIN authors a ON a.id = b.author_id
           JOIN reading_status rs ON rs.book_id = b.id
          WHERE b.id = ?;`,
        Number(id)
      ) as BookDetails;
      if (row) {
        setBook(row as BookDetails);
        setStatus(row.status as any);
      }

      const noteRow = await db.getFirstAsync(
        'SELECT notes_text FROM notes WHERE book_id = ?;',
        Number(id)
      ) as NoteRow | null;
      setNotes(noteRow?.notes_text || '');

      const ratingRow = await db.getFirstAsync(
        'SELECT rating FROM ratings WHERE book_id = ?;',
        Number(id)
      ) as RatingRow | null;
      setRating(ratingRow?.rating || 0);
    })();
  }, [id]);

  const updateStatus = async (newStatus: typeof status) => {
    const db = await SQLite.openDatabaseAsync('myapp.db');
    await db.execAsync('PRAGMA foreign_keys = ON;');
    if (newStatus === 'reading') {
      // set reading start
      await db.runAsync(
        `UPDATE reading_status
           SET status = ?, start_time = COALESCE(start_time, datetime('now'))
         WHERE book_id = ?;`,
        newStatus,
        Number(id)
      );
    } else if (newStatus === 'completed') {
      // set completed end
      await db.runAsync(
        `UPDATE reading_status
           SET status = ?, end_time = datetime('now')
         WHERE book_id = ?;`,
        newStatus,
        Number(id)
      );
    } else {
      // to_read: reset times
      await db.runAsync(
        `UPDATE reading_status
           SET status = ?, start_time = NULL, end_time = NULL
         WHERE book_id = ?;`,
        newStatus,
        Number(id)
      );
    }
    setStatus(newStatus);
    Alert.alert('Stato aggiornato', `Libro segnato come ${newStatus.replace('_', ' ')}`);
  };

  const saveNotesAndRating = async () => {
    if (!book) return;
    const db = await SQLite.openDatabaseAsync('myapp.db');
    await db.execAsync('PRAGMA foreign_keys = ON;');

    await db.runAsync(
      `INSERT INTO notes (book_id, notes_text)
         VALUES (?, ?)
       ON CONFLICT(book_id) DO UPDATE SET notes_text=excluded.notes_text;`,
      Number(id),
      notes
    );

    await db.runAsync(
      `INSERT INTO ratings (book_id, rating)
         VALUES (?, ?)
       ON CONFLICT(book_id) DO UPDATE SET rating=excluded.rating;`,
      Number(id),
      rating
    );

    Alert.alert('Salvato', 'Note e valutazione aggiornate.');
    setShowNotesModal(false);
  };

  if (!book) {
    return (
      <View style={styles.loader}>
        <Text>Caricamento...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {book.coverUrl && <Image source={{ uri: book.coverUrl }} style={styles.cover} />}
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>{book.author}</Text>
        {book.publication && <Text style={styles.pub}>Pubblicato: {book.publication}</Text>}
        <Text style={styles.desc}>{book.description}</Text>

        {/* Status selector */}
        <View style={styles.statusRow}>
          {(['to_read', 'reading', 'completed'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusBtn,
                status === s && styles.statusActive,
              ]}
              onPress={() => updateStatus(s)}
            >
              <Text
                style={
                  status === s ? styles.statusTxtActive : styles.statusTxt
                }
              >
                {s === 'to_read'
                  ? 'Da leggere'
                  : s === 'reading'
                  ? 'In lettura'
                  : 'Completato'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttons}>
          <Button
            title="Modifica libro"
            onPress={() =>
              router.push({ pathname: '/add-book', params: { id: book.id } })
            }
          />
          <Button
            title="Note e valutazione"
            onPress={() => setShowNotesModal(true)}
          />
        </View>
      </ScrollView>

      {/* Modal Note & Rating */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Note personali</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            multiline
            value={notes}
            onChangeText={setNotes}
            placeholder="I tuoi pensieri…"
          />
          <Text style={{ fontWeight: 'bold', marginVertical: 8 }}>Valutazione</Text>
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Text
                key={i}
                style={i < rating ? styles.starOn : styles.starOff}
                onPress={() => setRating(i + 1)}
              >
                ★
              </Text>
            ))}
          </View>
          <Button title="Salva" onPress={saveNotesAndRating} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { alignItems: 'center', padding: 16 },
  cover: { width: 120, height: 180, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  author: { fontSize: 16, color: '#555', marginBottom: 8 },
  pub: { fontSize: 14, marginBottom: 12 },
  desc: { fontSize: 14, textAlign: 'justify', marginBottom: 20 },
  statusRow: { flexDirection: 'row', marginVertical: 12 },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  statusActive: { backgroundColor: '#4A90E2' },
  statusTxt: { textAlign: 'center', color: '#555' },
  statusTxtActive: { textAlign: 'center', color: '#fff', fontWeight: 'bold' },
  buttons: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginVertical: 8 },
  starOn: { fontSize: 32, color: '#f5a623', marginHorizontal: 4 },
  starOff: { fontSize: 32, color: '#ccc', marginHorizontal: 4 },
});
