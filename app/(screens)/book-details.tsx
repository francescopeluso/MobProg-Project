// app/(tabs)/book-details.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Book, getBookById, saveNotes, saveRating, updateReadingStatus } from '../../services/bookApi';

interface BookDetails extends Omit<Book, 'reading_status'> {
  id: number;
  author: string;
  status: 'to_read' | 'reading' | 'completed';
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
      const bookData = await getBookById(Number(id));
      
      if (bookData) {
        // Adatta l'oggetto Book al formato BookDetails
        const authorString = Array.isArray(bookData.authors) 
          ? bookData.authors.map(a => typeof a === 'string' ? a : a.name).join(', ')
          : '';
          
        setBook({
          ...bookData,
          id: bookData.id as number,
          author: authorString,
          status: bookData.reading_status?.status || 'to_read'
        });
        
        setStatus(bookData.reading_status?.status || 'to_read');
        setNotes(bookData.notes || '');
        setRating(bookData.rating?.rating || 0);
      }
    })();
  }, [id]);

  const updateStatus = async (newStatus: typeof status) => {
    if (!book) return;
    
    const success = await updateReadingStatus(book.id, newStatus);
    
    if (success) {
      setStatus(newStatus);
      Alert.alert('Stato aggiornato', `Libro segnato come ${newStatus.replace('_', ' ')}`);
    } else {
      Alert.alert('Errore', 'Impossibile aggiornare lo stato di lettura.');
    }
  };

  const saveNotesAndRating = async () => {
    if (!book) return;
    
    const notesSuccess = await saveNotes(book.id, notes);
    const ratingSuccess = await saveRating(book.id, rating);
    
    if (notesSuccess && ratingSuccess) {
      Alert.alert('Salvato', 'Note e valutazione aggiornate.');
      setShowNotesModal(false);
    } else {
      Alert.alert('Errore', 'Impossibile salvare note e valutazione.');
    }
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
        {book.cover_url && <Image source={{ uri: book.cover_url }} style={styles.cover} />}
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>{book.author}</Text>
        {book.publication && <Text style={styles.pub}>Pubblicato nel {book.publication}</Text>}
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
