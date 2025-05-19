// app/(tabs)/add-book.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { Book, deleteBook, getBookById, insertBook, updateBook } from '../../services/bookApi';

const initialForm = {
  title: '',
  author: '',
  description: '',
  cover_url: '',
  publication: '',
};

export default function AddBookScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [form, setForm] = useState({ ...initialForm });
  const [remoteBook, setRemoteBook] = useState<Book | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false); // Stato per tracciare il caricamento dei dati

  useEffect(() => {
    if (params.id) {
      setIsEditing(true);
      loadBook(parseInt(params.id));
    }
  }, [params.id]);

  /**
   * 
   * @function loadBook
   * @param id ID del libro da caricare
   * @description Funzione per caricare i dati di un libro esistente dal database locale.
   *              Viene utilizzata quando si modifica un libro già esistente.
   * @returns {Promise<void>}
   * @throws {Error} Se si verifica un errore durante il caricamento dei dati.
   * @async
   */
  const loadBook = async (id: number) => {
    try {
      setLoading(true);
      const bookData = await getBookById(id);
      
      if (bookData) {
        // Estrai gli autori come una stringa separata da virgole
        const authorString = Array.isArray(bookData.authors) 
          ? bookData.authors.map(a => typeof a === 'string' ? a : a.name).join(', ')
          : '';
        
        setForm({
          title: bookData.title || '',
          author: authorString,
          description: bookData.description.substring(0, 300) + ' [...]' || '',
          cover_url: bookData.cover_url || '',
          publication: bookData.publication ? bookData.publication.toString() : '',
        });
      }
    } catch (e) {
      console.error('Error while loading book\'s data: ', e);
      Alert.alert('Errore', 'Impossibile caricare i dati del libro.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 
   * @function handleChange
   * @param key Chiave del form da aggiornare
   * @param value Valore da impostare per la chiave specificata
   * @description Funzione per gestire il cambiamento dei valori nei campi del form.
   *              Viene utilizzata per aggiornare lo stato del form quando l'utente modifica un campo.
   * @returns {void}
   */
  const handleChange = (key: keyof typeof form, value: string) => {
    setForm({ ...form, [key]: value });
  };

  /**
   * 
   * @function handleRemoteSelect
   * @param book Oggetto Book selezionato dalla ricerca remota
   * @description Funzione per gestire la selezione di un libro dalla ricerca remota.
   *              Viene utilizzata per aggiornare il form con i dati del libro selezionato.
   * @returns {void}
   */
  const handleRemoteSelect = (book: Book) => {
    setRemoteBook(book);
    setForm({
      title: book.title,
      author: Array.isArray(book.authors) ? book.authors.join(', ') : '',
      description: book.description.substring(0, 300) + ' [...]' || form.description.substring(0, 300) + ' [...]',
      cover_url: book.cover_url || '',
      publication: book.published?.toString() || book.publication?.toString() || '',
    });
    Keyboard.dismiss();
    setShowSearch(false);
  };

  /**
   * 
   * @function handleSave
   * @description Funzione per gestire il salvataggio del libro.
   *              Viene utilizzata sia per aggiungere un nuovo libro che per aggiornare uno esistente.
   * @returns {Promise<void>}
   * @throws {Error}
   * @async
   */
  const handleSave = async () => {
    try {
      // Preparazione dati comuni
      const title = form.title.trim() || 'Titolo Sconosciuto';
      const description = form.description.trim() || undefined;
      const cover_url = form.cover_url.trim() || undefined;
      const publication = parseInt(form.publication, 10) || undefined;
      const isbn10 = remoteBook?.isbn10 || undefined;
      const isbn13 = remoteBook?.isbn13 || undefined;
      
      // Prepara un array di autori
      const authors = form.author.split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);
      
      if (authors.length === 0) {
        authors.push('Autore Sconosciuto');
      }

      // Crea l'oggetto libro da salvare
      const bookToSave: Book = {
        title,
        description,
        cover_url,
        publication,
        isbn10,
        isbn13,
        authors,
        // Includi i generi dal libro remoto se disponibili
        genres: remoteBook?.genres || []
      };

      // Se stiamo modificando un libro esistente, aggiungi l'ID
      if (isEditing && params.id) {
        bookToSave.id = parseInt(params.id);
        
        // Aggiorna il libro esistente
        const success = await updateBook(bookToSave);
        if (success) {
          Alert.alert('Completato', 'Libro aggiornato con successo.');
          // Reset del form e torna indietro
          setForm({ ...initialForm });
          setRemoteBook(null);
          router.back();
        } else {
          Alert.alert('Errore', 'Impossibile aggiornare il libro.');
        }
      } else {
        // Inserisci nuovo libro
        const newBookId = await insertBook(bookToSave);
        if (newBookId) {
          Alert.alert('Completato', 'Libro aggiunto con successo.');
          // Reset del form e torna indietro
          setForm({ ...initialForm });
          setRemoteBook(null);
          router.back();
        } else {
          Alert.alert('Errore', 'Impossibile aggiungere il libro.');
        }
      }
    } catch (e) {
      console.error('Errore nell\'aggiunta del libro: ', e);
      Alert.alert('Errore', 'Impossibile salvare il libro. ' + (e instanceof Error ? e.message : ''));
    }
  };

  /**
   * 
   * @function handleDelete
   * @description Funzione per gestire l'eliminazione di un libro esistente.
   *              Mostra una conferma prima di procedere con l'eliminazione.
   * @returns {Promise<void>}
   * @async
   */
  const handleDelete = async () => {
    // Chiedi conferma prima di eliminare
    Alert.alert(
      'Elimina libro',
      'Sei sicuro di voler eliminare questo libro? Questa azione non può essere annullata.',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!params.id) return;
              
              const bookId = parseInt(params.id);
              const success = await deleteBook(bookId);
              
              if (success) {
                Alert.alert('Completato', 'Libro eliminato con successo.');
                // Reset del form e torna indietro
                setForm({ ...initialForm });
                setRemoteBook(null);
                router.back();
              } else {
                Alert.alert('Errore', 'Impossibile eliminare il libro.');
              }
            } catch (e) {
              console.error('Errore nell\'eliminazione del libro: ', e);
              Alert.alert('Errore', 'Impossibile eliminare il libro. ' + (e instanceof Error ? e.message : ''));
            }
          }
        }
      ]
    );
  };

  const insets = useSafeAreaInsets();
  
  const renderCoverPreview = () => {
    if (form.cover_url) {
      return (
        <Image 
          source={{ uri: form.cover_url }}
          style={styles.coverPreview}
          resizeMode="cover"
        />
      );
    }
    
    return (
      <View style={styles.coverPlaceholder}>
        <Ionicons name="book-outline" size={42} color="#bbb" />
        <Text style={styles.coverPlaceholderText}>
          Anteprima copertina
        </Text>
      </View>
    );
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text style={styles.loadingText}>Caricamento...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={[styles.header, { marginTop: insets.top, zIndex: 1 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#f4511e" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditing ? 'Modifica Libro' : 'Aggiungi Libro'}
          </Text>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => setShowSearch(true)}
          >
            <Ionicons name="search-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: 80 + insets.bottom } // Aumentato per tener conto del footer fisso
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Anteprima libro e ricerca */}
        <View style={styles.bookPreviewSection}>
          <View style={styles.coverContainer}>
            {renderCoverPreview()}
            
            <TouchableOpacity 
              style={styles.searchButton2}
              onPress={() => setShowSearch(true)}
            >
              <Ionicons name="search-outline" size={16} color="#fff" />
              <Text style={styles.searchButtonText}>Cerca online</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.basicInfo}>
            {form.title ? (
              <Text style={styles.bookTitle} numberOfLines={2}>{form.title}</Text>
            ) : (
              <Text style={styles.placeholderText}>Titolo del libro</Text>
            )}
            
            {form.author ? (
              <Text style={styles.bookAuthor} numberOfLines={1}>{form.author}</Text>
            ) : (
              <Text style={styles.placeholderText}>Autore</Text>
            )}
            
            {remoteBook && (remoteBook.isbn10 || remoteBook.isbn13) && (
              <View style={styles.isbnContainer}>
                {remoteBook.isbn10 && (
                  <View style={styles.isbnTag}>
                    <Text style={styles.isbnLabel}>ISBN-10:</Text>
                    <Text style={styles.isbnValue}>{remoteBook.isbn10}</Text>
                  </View>
                )}
                
                {remoteBook.isbn13 && (
                  <View style={styles.isbnTag}>
                    <Text style={styles.isbnLabel}>ISBN-13:</Text>
                    <Text style={styles.isbnValue}>{remoteBook.isbn13}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Form dei dati del libro */}
        <View style={styles.formSection}>
          {/* Titolo */}
          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="book-outline" size={18} color="#666" style={styles.labelIcon} />
              <Text style={styles.label}>Titolo</Text>
            </View>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(t) => handleChange('title', t)}
              placeholder="Titolo del libro"
              placeholderTextColor="#bbb"
            />
          </View>

          {/* Autore */}
          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="person-outline" size={18} color="#666" style={styles.labelIcon} />
              <Text style={styles.label}>Autore</Text>
            </View>
            <TextInput
              style={styles.input}
              value={form.author}
              onChangeText={(t) => handleChange('author', t)}
              placeholder="Nome autore"
              placeholderTextColor="#bbb"
            />
          </View>
          
          {/* Anno e copertina */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { width: 100 }]}>
              <View style={styles.labelContainer}>
                <Ionicons name="calendar-outline" size={18} color="#666" style={styles.labelIcon} />
                <Text style={styles.label}>Anno</Text>
              </View>
              <TextInput
                style={styles.input}
                value={form.publication}
                onChangeText={(t) => handleChange('publication', t)}
                placeholder="YYYY"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
              <View style={styles.labelContainer}>
                <Ionicons name="image-outline" size={18} color="#666" style={styles.labelIcon} />
                <Text style={styles.label}>URL Copertina</Text>
              </View>
              <TextInput
                style={styles.input}
                value={form.cover_url}
                onChangeText={(t) => handleChange('cover_url', t)}
                placeholder="https://..."
                placeholderTextColor="#bbb"
              />
            </View>
          </View>

          {/* Trama */}
          <View style={styles.formGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="document-text-outline" size={18} color="#666" style={styles.labelIcon} />
              <Text style={styles.label}>Trama</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description.substring(0, 300) + ' [...]'}
              onChangeText={(t) => handleChange('description', t)}
              placeholder="Breve descrizione della trama"
              placeholderTextColor="#bbb"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
        
        {/* Suggerimento ricerca - solo per nuovi libri */}
        {!isEditing && (
          <View style={styles.tipContainer}>
            <Ionicons name="information-circle-outline" size={24} color="#4A90E2" />
            <Text style={styles.tipText}>
              Puoi cercare un libro online per compilare automaticamente tutti i campi
            </Text>
          </View>
        )}
      </ScrollView>
      
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isEditing ? (
          <View style={styles.footerButtons}>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={22} color="#fff" />
              <Text style={styles.deleteButtonText}>Elimina</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Ionicons name="save-outline" size={22} color="#fff" />
              <Text style={styles.saveButtonText}>Aggiorna</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Ionicons name="save-outline" size={22} color="#fff" />
            <Text style={styles.saveButtonText}>Salva libro</Text>
          </TouchableOpacity>
        )}
      </View>

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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 12,  // Ridotto per avere un header più compatto
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20, // Leggermente più piccolo
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  searchButton: {
    backgroundColor: '#f4511e',
    padding: 8,
    borderRadius: 8,
  },
  searchButton2: {
    flexDirection: 'row',
    backgroundColor: '#f4511e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center', 
    marginTop: 10,
    alignSelf: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  contentContainer: {
    padding: 16,
  },
  bookPreviewSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  coverContainer: {
    marginRight: 16,
    alignItems: 'center', 
  },
  coverPreview: {
    width: 110,
    height: 165, // Leggermente più grande
    borderRadius: 8,
  },
  coverPlaceholder: {
    width: 110,
    height: 165,
    borderRadius: 8,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  coverPlaceholderText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  basicInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  placeholderText: {
    fontStyle: 'italic',
    color: '#999',
    fontSize: 16,
    marginBottom: 4,
  },
  sourceTag: {
    backgroundColor: '#f0f7ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  sourceText: {
    color: '#4A90E2',
    fontSize: 12,
    fontWeight: '500',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    flex: 1, // Fa espandere il form a tutta la larghezza
  },
  formGroup: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelIcon: {
    marginRight: 6,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#444',
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 10, 
    padding: 12,
    paddingVertical: 10, 
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  isbnContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  isbnTag: {
    flexDirection: 'row',
    backgroundColor: '#fff4e8',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  isbnLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#f4511e',
    marginRight: 4,
  },
  isbnValue: {
    fontSize: 13,
    color: '#666',
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: '#e8f4ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#4A6FA5',
    marginLeft: 8,
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
    padding: 16,
    position: 'absolute', 
    bottom: 0,
    left: 0,
    right: 0,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4511e',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 0.48,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
});
