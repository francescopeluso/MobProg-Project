// app/(tabs)/book-details.tsx
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Book, getBookById, updateReadingStatus } from '../../services/bookApi';

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
  const [comment, setComment] = useState('');    
  const [rating, setRating] = useState(0);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const insets = useSafeAreaInsets();
  
  const handleBack = () => {
      router.back();
  };

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
        setComment(bookData.rating?.comment || '');
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

  if (!book) {
    return (
      <View style={styles.loader}>
        <Text>Caricamento...</Text>
      </View>
    );
  }

  return (
     <LinearGradient
        // qui definisci i colori del gradiente
        colors={['#4A90E2', '#002D60']}
        // start & end dir (opzionali)
        start={[0, 0]}
        end={[1, 1]}
        style={[{flex:1}]}
      >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top }
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#f4511e" />
          </TouchableOpacity>
          <Text style={styles.title}>
           Dettagli Libro
          </Text>
        </View>
      </View>
      <View style={[styles.containerAll , {marginTop: 70 + insets.top}]}>
      <ScrollView contentContainerStyle={{ ...styles.container}}>
        <View style={styles.coverContainer}>
        {book.cover_url && 
          <Image source={{ uri: book.cover_url }} style={styles.cover} />}
        </View>
        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.bookAuthor}>{book.author}</Text>
        {book.publication && <Text style={styles.pub}>Pubblicato: {book.publication}</Text>}
        {/* ——— Valutazione salvata (solo se rating > 0) ——— */}
        {rating > 0 && (
          <View style={styles.savedRatingContainer}>
            {/* Stelline */}
            <View style={styles.starsRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i}>
                <MotiView
                  from={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: rating === i ? 1.3 : 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 10, mass: 0.8, delay: i * 150 }}
                  style={{ marginHorizontal: 4 }}
                >
                  <AntDesign
                    name={i <= rating ? 'star' : 'staro'}
                    size={30}
                    color={i <= rating ? '#f5a623' : '#DDD'}
                    style={{ marginHorizontal: 4 }}
                  />
                </MotiView>
              </View>
            ))}
          </View>
            {/* Commento */}
            {comment.length > 0 && (
              <Text style={styles.savedComment}>{comment}</Text>
            )}
          </View>
        )}
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
        </View>
      </ScrollView>

      {/* Modal Note & Rating */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        onRequestClose={() => setShowNotesModal(false)}
      >
      </Modal>
    </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { alignItems: 'center', padding: 16 },
  containerAll: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 30,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    flex: 1,
    zIndex: 1,
  },
  // header row:
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 15,
  },
  backButton: {
    padding: 8,
  },
  cover: {
    width: 110,
    height: 165,
    backgroundColor: '#4A90E2',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    margin: 16,
  },
  coverContainer: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  bookTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    marginTop: 10,
    textTransform: 'capitalize',
  },
  bookAuthor: {
    fontSize: 18,
    color: '#555',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  pub: { fontSize: 14, marginBottom: 12 },
  desc: { fontSize: 14, textAlign: 'justify', marginBottom: 20 },
  statusRow: { flexDirection: 'row' },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  // rating e stelle:
  savedRatingContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  savedComment: {
    fontStyle: 'italic',
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  statusActive: { backgroundColor: '#4A90E2' },
  statusTxt: { textAlign: 'center', color: '#555' },
  statusTxtActive: { textAlign: 'center', color: '#fff', fontWeight: 'bold' },
  buttons: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginVertical: 8 },
});
