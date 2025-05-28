import { AntDesign, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AnimatePresence, MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchModal from '../../components/SearchModal';
import { Book, deleteBook, getBookById, insertBook, saveNotes, saveRating, updateBook, updateReadingStatus } from '../../services/bookApi';

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
  const [bookImage, setBookImage] = useState<string | undefined>(undefined); // immagine copertina
  const [isDirty, setIsDirty] = useState(false); 
  // stati
  const STATI = ['to_read', 'reading', 'completed'] as const;
  const [activeStatus, setActiveStatus] = useState<typeof STATI[number]>('to_read');
  // per il rating 
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false); // Stato per tracciare il caricamento dei dati
  // per i tre modal
  const [showGenreModal, setShowGenreModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  // per la bottom‐sheet delle note
  const [note, setNote] = useState('')
  // lista categorie custom
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  // lista generi e selezione
  const GENRES = ['Giallo','Rosa','Azione','Fantasy','Storico']
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  // transizione riutilizzabile
  const entryTransition = { type: 'timing' as const, duration: 400 }
  const entry = {
    from: { translateY: 20, opacity: 0 },
    animate: { translateY: 0, opacity: 1 },
    transition: { type: 'spring', damping: 50, stiffness: 10, mass: 1 }
  }

  const toggleGenre = (g: string) => {
    setIsDirty(true);
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
  )}; 

  const toggleCategory = (c: string) =>
    setSelectedCategories(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
  )

  useEffect(() => {
    if (params.id) {
      setIsEditing(true);
      loadBook(parseInt(params.id));
    }
  }, [params.id]);

  useEffect(() => {
    if (rating >= 1 && comment === '') {
      const labels = ['Terribile','Scarso','Discreto','Buono','Ottimo']
      setComment(labels[rating - 1])
    }
  }, [rating, comment])

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
          description: bookData.description ? bookData.description.substring(0, 300) + ' [...]' : '',
          cover_url: bookData.cover_url || '',
          publication: bookData.publication ? bookData.publication.toString() : '',
        });
        setActiveStatus(bookData.reading_status?.status || 'to_read');
        const existingGenres: string[] = (bookData.genres ?? []).map(g =>
          typeof g === 'string' ? g : g.name
        );
        setSelectedGenres(existingGenres);
        setRating(bookData.rating?.rating || 0);
        setComment(bookData.rating?.comment || '');
        setNote(bookData.notes || '');
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
    setIsDirty(true);
  };

  const handleBack = () => {
    if (isDirty) {
      Alert.alert(
        'Modifiche non salvate',
        'Hai modifiche non salvate. Vuoi davvero uscire?',
        [
          { text: 'Resta', style: 'cancel' },
          { text: 'Esci', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
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
      description: (book.description ? book.description.substring(0, 300) + ' [...]' : '') || (form.description ? form.description.substring(0, 300) + ' [...]' : ''),
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
      // 1. Prepara i campi standard
      const title = form.title.trim() || 'Titolo Sconosciuto';
      const description = form.description.trim() || undefined;
      const cover_url = form.cover_url.trim() || undefined;
      const publication = parseInt(form.publication, 10) || undefined;
      const isbn10 = remoteBook?.isbn10;
      const isbn13 = remoteBook?.isbn13;
      const authors = form.author
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);
      if (!authors.length) authors.push('Autore Sconosciuto');
      
      // Crea l'oggetto libro da salvare
      const bookToSave: Book = {
        title,
        description,
        cover_url,
        publication,
        isbn10,
        isbn13,
        authors,
        editor: remoteBook?.editor,
        language: remoteBook?.language,
        genres: selectedGenres.length > 0 ? selectedGenres : remoteBook?.genres || []
      };

      let bookId: number;

      // Se stiamo modificando un libro esistente, aggiungi l'ID
      if (isEditing && params.id) {
        bookToSave.id = parseInt(params.id);
        bookId = bookToSave.id;
        
        // Aggiorna il libro esistente
        const success = await updateBook(bookToSave);
        if (!success) {
          Alert.alert('Errore', 'Impossibile aggiornare il libro.');
          return;
        }
      } else {
        // Inserisci nuovo libro
        const newBookId = await insertBook(bookToSave);
        if (!newBookId) {
          Alert.alert('Errore', 'Impossibile aggiungere il libro.');
          return;
        }
        bookId = newBookId;
      }

      // 2. Salva lo stato di lettura
      await updateReadingStatus(bookId, activeStatus);
      
      // 3. Salva la valutazione se presente
      if (rating > 0) {
        await saveRating(bookId, rating, comment);
      }
      
      // 4. Salva le note se presenti
      if (note.trim().length > 0) {
        await saveNotes(bookId, note);
      }

      // 5. Reset dello stato e navigazione
      setIsDirty(false);
      setForm({ ...initialForm });
      setRemoteBook(null);
      setRating(0);
      setComment('');
      setNote('');
      setSelectedGenres([]);
      
      // 6. Messaggio di conferma e ritorno alla schermata precedente
      Alert.alert('Completato', isEditing ? 'Libro aggiornato con successo.' : 'Libro aggiunto con successo.');
      router.back();

    } catch (err: any) {
      console.error('Errore nel salvataggio del libro:', err);
      Alert.alert('Errore', err.message || 'Qualcosa è andato storto durante il salvataggio.');
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

// Funzione che permette di selezionare la copertina dalla galleria
  const pickBookImage = async () => {
  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!granted) {
    Alert.alert('Permesso negato', 'Devi consentire l\'accesso alla galleria');
    return;
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [3, 4],
    quality: 1,
  });
  if (!res.canceled && res.assets.length) {
    const uri = res.assets[0].uri;
    setBookImage(uri);
    // **qui** aggiorniamo anche il form
    setForm(prev => ({ ...prev, cover_url: uri }));
  }
};


  const insets = useSafeAreaInsets();
  
  const renderCoverPreview = () => {
  const uri = bookImage || form.cover_url;
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={styles.cover}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={styles.coverPlaceholder}>
      <Ionicons name="book-outline" size={42} color="#bbb" />
      <Text style={styles.coverPlaceholderText}>
        Clicca per selezionare un&apos;immagine dalla galleria 
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
        <View
          style={[
            styles.header,
            { paddingTop: insets.top }  
          ]}
        >
        <View style={styles.headerRow}></View>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#f4511e" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditing ? 'Modifica Libro' : 'Aggiungi Libro'}
          </Text>
          <TouchableOpacity style={styles.searchButton} onPress={() => setShowSearch(true)}>
            <Ionicons name="search-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: 80 + insets.bottom, paddingTop: 80 + insets.top}]} // per tenere conto del footer e dell'header fissi
        showsVerticalScrollIndicator={false}
      >
        {/* Anteprima libro e ricerca */}
        <View style={styles.bookPreviewSection}>
          <View style={styles.coverContainer}>
            <Pressable onPress={pickBookImage}>
              {renderCoverPreview()}
            </Pressable>
          </View>
          
          <View style={styles.basicInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>{form.title || 'Titolo'}</Text>
                <Text style={styles.bookAuthor} numberOfLines={1}>{form.author || 'Nome Autore'}</Text>
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

 {/* Status selector */}
  <View style={styles.tabRow}>
  {STATI.map(s => {
    const label = s === 'to_read' ? 'Da leggere' 
                : s === 'reading' ? 'In lettura' 
                : 'Completato';
    const isActive = activeStatus === s;
    return (
      <MotiView
        key={s}
        from={{ backgroundColor: '#eee', translateY: 0 }}
        animate={{
          backgroundColor: isActive ? '#4A90E2' : '#eee',
          translateY: isActive ? -4 : 0,
        }}
        transition={{ type: 'timing', duration: 300, easing: Easing.out(Easing.exp) }}
        style={styles.tabButton}
      >
        <Pressable
          onPress={() => { setActiveStatus(s); setIsDirty(true); }}
          style={styles.tabButton}
        >
          <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
            {label}
          </Text>
        </Pressable>
      </MotiView>
    );
  })}
</View>

        {/* Form dei dati del libro */}
        <View style={[styles.formSection, { backgroundColor: '#4A90E2', paddingBottom: 0, marginTop: -12 }]}>
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
              autoCapitalize='sentences'       // prima lettera maiuscola
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
              autoCapitalize='words'       // prima lettera maiuscola
            />
          </View>
          
          {/* Anno e copertina */}
          <View style={[styles.formRow, {marginBottom:0}]}>
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
              value={form.description}
              onChangeText={(t) => handleChange('description', t)}
              placeholder="Breve descrizione della trama"
              placeholderTextColor="#bbb"
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Icon Row per aprire i tre modal */}
          <View style={[styles.formRow, {flexDirection: 'row', justifyContent: 'space-around'}]}>
            {/* Generi */}
            <Pressable
              onPress={() => setShowGenreModal(true)}
              style={styles.iconButton}
            >
              <Ionicons name="book-outline" size={24} color="#fff" />
            </Pressable>

            {/* Note */}
            <Pressable
              onPress={() => setShowNoteModal(true)}
              style={styles.iconButton}
            >
              <Ionicons name="create-outline" size={24} color="#fff" />
            </Pressable>

            {/* Categorie */}
            <Pressable
              onPress={() => setShowCategoryModal(true)}
              style={styles.iconButton}
            >
              <Ionicons name="layers-outline" size={24} color="#fff" />
            </Pressable>

            <Pressable 
              onPress={() => setShowRating(v => !v)} 
              style={styles.iconButton}
            >
              <Ionicons name="star" size={20} color="#fff" />
            </Pressable>
          </View>

          {/* GENRE MODAL */}
          <Modal visible={showGenreModal} transparent animationType="none">
            <View style={styles.modalOverlay}>
              <MotiView {...entry} transition={entryTransition} style={styles.modalContent}>
                <Pressable onPress={() => setShowGenreModal(false)} style={styles.closeIcon}>
                  <Ionicons name="close" size={24} color="#333" />
                </Pressable>
                <Text style={styles.label}>Seleziona Generi</Text>
                <View style={styles.genreRow}>
                  {GENRES.map(g => (
                    <Pressable
                      key={g}
                      onPress={() => toggleGenre(g)}
                      style={[
                        styles.genrePill,
                        selectedGenres.includes(g) && styles.genreSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genreText,
                          selectedGenres.includes(g) && styles.genreTextSelected,
                        ]}
                      >
                        {g}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </MotiView>
            </View>
          </Modal>

          {/* NOTE BOTTOM‐SHEET */}
          <Modal visible={showNoteModal} transparent animationType="none">
            <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
              <AnimatePresence>
                {showNoteModal && (
                  <MotiView style={styles.bottomSheet}>
                    <Pressable onPress={() => setShowNoteModal(false)} style={styles.closeIcon}>
                      <Ionicons name="close" size={24} color="#333" />
                    </Pressable>
                    <Text style={styles.label}>Note aggiuntive</Text>
                    <TextInput
                      style={styles.noteInput}
                      placeholder="Scrivi una nota..."
                      placeholderTextColor="#555"
                      multiline
                      value={note}
                      onChangeText={setNote}
                    />
                  </MotiView>
                )}
              </AnimatePresence>
            </View>
          </Modal>

          {/* CATEGORY MODAL */}
          <Modal visible={showCategoryModal} transparent animationType="none">
            <View style={styles.modalOverlay}>
              <MotiView {...entry} transition={entryTransition} style={styles.modalContent}>
                <Pressable onPress={() => setShowCategoryModal(false)} style={styles.closeIcon}>
                  <Ionicons name="close" size={24} color="#333" />
                </Pressable>
                <Text style={styles.label}>Categorie</Text>
                <View style={styles.genreRow}>
                  {categories.map(c => (
                    <Pressable
                      key={c}
                      onPress={() => toggleCategory(c)}
                      style={[
                        styles.genrePill,
                        selectedCategories.includes(c) && styles.genreSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genreText,
                          selectedCategories.includes(c) && styles.genreTextSelected,
                        ]}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', width: '100%', marginTop: 12, gap: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    placeholder="Nuova categoria"
                    placeholderTextColor="#666"
                    value={newCategory}
                    onChangeText={setNewCategory}
                  />
                  <Pressable
                    style={[styles.genrePill, styles.genreSelected, { backgroundColor: '#4A90E2', borderRadius: 8}]}
                    onPress={() => {
                      const t = newCategory.trim();
                      if (t && !categories.includes(t)) {
                        setCategories(prev => [...prev, t]);
                        setSelectedCategories(prev => [...prev, t]);
                      }
                      setNewCategory('');
                    }}
                  >
                    <Text style={styles.addCategoryButton}>Aggiungi</Text>
                  </Pressable>
                </View>
              </MotiView>
            </View>
          </Modal>
          </View>
          {showRating && (
            <View style={styles.formSection}>
              <MotiView style={styles.ratingContainer}>
                <Text style={[styles.label, {marginBottom: 16}]}>Aggiungi una Valutazione</Text>
                <View style={styles.starsRow}>
                  {[0,1,2,3,4].map((s,i) => (
                    <Pressable key={s} onPress={() => {
                      setRating(s);
                      setIsDirty(true);    
                    }}>
                      <MotiView
                        from={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: rating === s ? 1.3 : 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 10, mass: 0.8, delay: i * 150 }}
                      >
                        <AntDesign
                          name={s <= rating ? 'star' : 'staro'}
                          size={32}
                          color={s <= rating ? '#f5a623' : '#DDD'}
                          style={{ marginHorizontal: 4 }}
                        />
                      </MotiView>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.commentWrapper}>
                  <Ionicons name="create-outline" size={20} color="#666"/>
                  <TextInput
                    style={[styles.input, styles.commentInput]}
                    placeholder="Commento..."
                    placeholderTextColor="#555"
                    value={comment}
                    onChangeText={text => {
                      setComment(text);
                      setIsDirty(true);   
                    }}
                  />
                </View>
              </MotiView>
            </View>
          )}
          {/* Suggerimento ricerca - solo per nuovi libri */}
          {!isEditing && (
            <View style={styles.tipContainer}>
              <Ionicons name="information-circle-outline" size={24} color="#4A90E2" />
              <Text style={styles.tipText}>
                Puoi cercare un libro online per compilare automaticamente tutti i campi
              </Text>
            </View>
          )}
        </View>
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

// STILI
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
      searchButton: {
      flexDirection: 'row',
      backgroundColor: '#4A90E2',
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
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: 16,
      },
      coverContainer: {
      alignItems: 'center', 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
      },
      coverPreview: {
      width: '100%',
      height: '100%',
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
  cover: {
    width: 110,
    height: 165,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',   
  },
  basicInfo: {
    flex: 1,
    alignItems: 'center', 
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
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textTransform: 'capitalize'
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
    flex: 1,  
    zIndex: 1, 
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
    fontSize: 16, 
    fontWeight: '600', 
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
    backgroundColor: '#4A90E2',
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
  // stili modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
    gap: 12,
    marginTop: '40%',
  },
  closeIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 10,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  genrePill: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  genreSelected: {
    backgroundColor: '#A4E8D7',
  },
  genreText: {
    fontSize: 13,
    color: '#666',
  },
  genreTextSelected: {
    fontWeight: '700',
    color: '#222',
  },
  addCategoryButton: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
    borderRadius: 8, 
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    width: '100%',
    height: Dimensions.get('window').height * 0.6,
  },
  noteInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    height: 100,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
    textDecorationLine: 'underline',
    textDecorationColor: '#ccc',
  },
  iconButton: {
    width: '22%',
    height:35,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // rating 
  ratingContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  commentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderColor: 'transparent',
  },
  // stato lettura
  tabRow: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginVertical: 0,
  paddingHorizontal: 16,
  paddingTop: 8,    
  gap: 5, 
  backgroundColor: 'transparent',
},
tabButton: {
  flex: 1,
  paddingTop: 5,
  paddingBottom: 10,
  marginHorizontal: 4,
  borderRadius: 8,
  borderBottomLeftRadius: 0, 
  borderBottomRightRadius: 0, 
  alignItems: 'center',
  zIndex: 1, 
},
tabButtonActive: {
  backgroundColor: '#4A90E2', 
},
tabText: {
  color: '#555',
  fontWeight: '500',
},
tabTextActive: {
  color: '#fff',
},
});