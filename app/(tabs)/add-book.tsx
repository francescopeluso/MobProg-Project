// app/(tabs)/add-book.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Modal,
  Keyboard,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';

import SearchModal from '../../src/components/SearchModal';
import { RemoteBook } from '../../src/services/bookApi';

interface authorRow {
  id: number;
  name: string;
}

const initialForm = {
  title: '',
  author: '',
  description: '',
  coverUrl: '',
  publication: '',
};

export default function AddBookScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ ...initialForm });
  const [remoteBook, setRemoteBook] = useState<RemoteBook | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const handleRemoteSelect = (book: RemoteBook) => {
    setRemoteBook(book);
    setForm({
      title: book.title,
      author: book.authors.join(', '),
      description: form.description,
      coverUrl: book.coverUrl || '',
      publication: book.published?.toString() || '',
    });
    Keyboard.dismiss();
    setShowSearch(false);
  };

  const handleSave = async () => {
    try {
      const db = await SQLite.openDatabaseAsync('myapp.db');
      await db.execAsync('PRAGMA foreign_keys = ON;');

      // 1. Autore: trova o crea
      const authorName = form.author.trim() || 'Autore Sconosciuto';
      let row = await db.getFirstAsync('SELECT id FROM authors WHERE name = ?', authorName) as authorRow | null;
      let authorId = row?.id;
      if (!authorId) {
        const ins = await db.runAsync('INSERT INTO authors (name) VALUES (?)', authorName);
        authorId = ins.lastInsertRowId as number;
      }

      // 2. Libro: inserisci
      const isbn10 = remoteBook?.isbn10 || null;
      const isbn13 = remoteBook?.isbn13 || null;
      const source = remoteBook?.source || 'manual';
      const externalId = remoteBook?.externalId || null;
      const pub = parseInt(form.publication, 10) || null;

      await db.runAsync(
        `INSERT INTO books
          (title, description, cover_url, publication, author_id,
           isbn10, isbn13, external_source, external_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        form.title.trim() || 'Titolo Sconosciuto',
        form.description.trim() || null,
        form.coverUrl.trim() || null,
        pub,
        authorId,
        isbn10,
        isbn13,
        source,
        externalId
      );

      // 3. reset form e torna indietro
      setForm({ ...initialForm });
      setRemoteBook(null);
      router.back();
    } catch (e) {
      console.error('AddBook save error', e);
      Alert.alert('Errore', 'Impossibile salvare il libro.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Titolo</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(t) => handleChange('title', t)}
          placeholder="Titolo del libro"
        />

        <Text style={styles.label}>Autore</Text>
        <TextInput
          style={styles.input}
          value={form.author}
          onChangeText={(t) => handleChange('author', t)}
          placeholder="Nome autore"
        />

        <Text style={styles.label}>Trama</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={form.description}
          onChangeText={(t) => handleChange('description', t)}
          placeholder="Breve trama"
          multiline
        />

        <Text style={styles.label}>Copertina (URL)</Text>
        <TextInput
          style={styles.input}
          value={form.coverUrl}
          onChangeText={(t) => handleChange('coverUrl', t)}
          placeholder="https://..."
        />

        <Text style={styles.label}>Anno pubblicazione</Text>
        <TextInput
          style={styles.input}
          value={form.publication}
          onChangeText={(t) => handleChange('publication', t)}
          placeholder="YYYY"
          keyboardType="numeric"
        />

        <View style={styles.buttonRow}>
          <Button title="Cerca online" onPress={() => setShowSearch(true)} />
          <Button title="Salva libro" onPress={handleSave} />
        </View>
      </ScrollView>

      <Modal
        visible={showSearch}
        animationType="slide"
        onRequestClose={() => setShowSearch(false)}
      >
        <SearchModal
          mode="remote"
          onSelectRemote={handleRemoteSelect}
          onClose={() => setShowSearch(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginTop: 4 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
});
