// app/(tabs)/add-book.tsx
import { SectionCard } from '@/components';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SearchModal from '../../components/SearchModal';
import { RemoteBook } from '../../services/bookApi';

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

  const insets = useSafeAreaInsets();
  
  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: 0,
            paddingBottom: 16 + insets.bottom
          }
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { marginTop: insets.top }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerRow}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#f4511e" />
              </TouchableOpacity>
              <Text style={styles.title}>Aggiungi Libro</Text>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowSearch(true)}
              >
                <Ionicons name="search-outline" size={22} color="#f4511e" />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>
              {remoteBook ? 'Libro trovato online' : 'Inserisci i dettagli del libro'}
            </Text>
          </View>
        </View>

        {/* Form */}
        <SectionCard title="Informazioni libro">
          <View style={styles.formGroup}>
            <Text style={styles.label}>Titolo</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(t) => handleChange('title', t)}
              placeholder="Titolo del libro"
              placeholderTextColor="#bbb"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Autore</Text>
            <TextInput
              style={styles.input}
              value={form.author}
              onChangeText={(t) => handleChange('author', t)}
              placeholder="Nome autore"
              placeholderTextColor="#bbb"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Trama</Text>
            <TextInput
              style={[styles.input, { minHeight: 100 }]}
              value={form.description}
              onChangeText={(t) => handleChange('description', t)}
              placeholder="Breve descrizione della trama"
              placeholderTextColor="#bbb"
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Copertina (URL)</Text>
              <TextInput
                style={styles.input}
                value={form.coverUrl}
                onChangeText={(t) => handleChange('coverUrl', t)}
                placeholder="https://..."
                placeholderTextColor="#bbb"
              />
            </View>

            <View style={[styles.formGroup, { width: 100 }]}>
              <Text style={styles.label}>Anno</Text>
              <TextInput
                style={styles.input}
                value={form.publication}
                onChangeText={(t) => handleChange('publication', t)}
                placeholder="YYYY"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Ionicons name="save-outline" size={22} color="#fff" />
            <Text style={styles.saveButtonText}>Salva libro</Text>
          </TouchableOpacity>
        </SectionCard>

        {remoteBook && (
          <SectionCard title="Informazioni aggiuntive">
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Fonte: </Text>
              {remoteBook.source === 'google' ? 'Google Books' : 'OpenLibrary'}
            </Text>
            {remoteBook.isbn10 && (
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>ISBN-10: </Text>
                {remoteBook.isbn10}
              </Text>
            )}
            {remoteBook.isbn13 && (
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>ISBN-13: </Text>
                {remoteBook.isbn13}
              </Text>
            )}
          </SectionCard>
        )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  backButton: {
    padding: 8,
  },
  actionButton: {
    padding: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: { 
    fontSize: 14, 
    fontWeight: '500', 
    marginBottom: 6,
    color: '#444',
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 10, 
    padding: 12, 
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4511e',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 6,
  },
  infoLabel: {
    fontWeight: '500',
    color: '#444',
  },
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 20 
  },
});
