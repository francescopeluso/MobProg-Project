import { AntDesign, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../../constants/styles';
import React, { useEffect, useState, useRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti'; 
import SearchModal from '../../components/SearchModal';
import { Book, deleteBook, getBookById, insertBook, saveNotes, saveRating, updateBook, updateReadingStatus, toggleWishlist, toggleFavorite, deleteComment, deleteRating } from '../../services/bookApi';

const initialForm = {
  title: '',
  author: '',
  description: '',
  cover_url: '',
  publication: '',
};

export default function AddBookScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; prefilledData?: string }>();
  const [form, setForm] = useState({ ...initialForm });
  const [remoteBook, setRemoteBook] = useState<Book | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [bookImage, setBookImage] = useState<string | undefined>(undefined); // immagine copertina
  const [isDirty, setIsDirty] = useState(false); 
  // scroll 
  const scrollViewRef = useRef<ScrollView>(null);
  // TextInput refs for keyboard navigation
  const titleInputRef = useRef<TextInput>(null);
  const authorInputRef = useRef<TextInput>(null);
  const publicationInputRef = useRef<TextInput>(null);
  const coverUrlInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const commentInputRef = useRef<TextInput>(null);
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
  // per la bottom‐sheet delle note
  const [note, setNote] = useState('')
  // wishlist o preferiti
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false); 
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

  // Funzione per lo scroll automatico ai campi
  const scrollToInput = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 100);
  };

  const toggleGenre = (g: string) => {
    setIsDirty(true);
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
  )}; 

  useEffect(() => {
    if (params.id) {
      setIsEditing(true);
      loadBook(parseInt(params.id));
    } else if (params.prefilledData) {
      // Carica i dati precompilati per una raccomandazione
      try {
        const bookData = JSON.parse(decodeURIComponent(params.prefilledData)) as Book;
        loadPrefilledBook(bookData);
      } catch (error) {
        console.error('Errore nel parsing dei dati precompilati:', error);
        Alert.alert('Errore', 'Impossibile caricare i dati del libro raccomandato.');
      }
    }
  }, [params.id, params.prefilledData]);

  useEffect(() => {
    if (rating >= 1 && comment === '') {
      const labels = ['Terribile','Scarso','Discreto','Buono','Ottimo']
      setComment(labels[rating - 1])
    }
  }, [rating, comment])

  useEffect(() => {
  if (showRating) {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }
}, [showRating]);

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
        setIsInWishlist(bookData.is_in_wishlist || false); 
        setIsFavorite(bookData.is_favorite || false); 
        
        // Set remote book data if ISBN exists to show in display
        if (bookData.isbn10 || bookData.isbn13) {
          setRemoteBook({
            title: bookData.title || '',
            authors: bookData.authors || [],
            isbn10: bookData.isbn10,
            isbn13: bookData.isbn13,
            cover_url: bookData.cover_url,
            description: bookData.description,
            published: bookData.publication,
          } as Book);
        }
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
   * @function loadPrefilledBook
   * @param bookData Dati del libro raccomandato da precompilare
   * @description Funzione per caricare i dati precompilati di un libro raccomandato.
   *              Viene utilizzata quando si aggiunge un libro dalla sezione raccomandazioni.
   * @returns {void}
   */
  const loadPrefilledBook = (bookData: Book) => {
    try {
      setLoading(true);
      
      // Estrai gli autori come una stringa separata da virgole
      const authorString = Array.isArray(bookData.authors) 
        ? bookData.authors.map(a => typeof a === 'string' ? a : a.name).join(', ')
        : '';
      
      setForm({
        title: bookData.title || '',
        author: authorString,
        description: bookData.description ? 
          (bookData.description.length > 300 ? 
            bookData.description.substring(0, 300) + '...' : 
            bookData.description) : '',
        cover_url: bookData.cover_url || '',
        publication: bookData.publication ? bookData.publication.toString() : '',
      });
      
      // Imposta i generi se disponibili
      if (bookData.genres && bookData.genres.length > 0) {
        const genres = Array.isArray(bookData.genres) 
          ? bookData.genres.map(g => typeof g === 'string' ? g : g.name)
          : [];
        setSelectedGenres(genres);
      }
      
      // Imposta il libro remoto per mostrarlo nella UI
      setRemoteBook(bookData);
      
      // Imposta isDirty a true perché ci sono dati precompilati
      setIsDirty(true);
      
    } catch (e) {
      console.error('Error while loading prefilled book data: ', e);
      Alert.alert('Errore', 'Impossibile caricare i dati del libro raccomandato.');
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

    if (isEditing && params.id) {
      bookToSave.id = +params.id;
      const ok = await updateBook(bookToSave);
      if (!ok) throw new Error('updateBook fallito');
      bookId = +params.id;         
    } else {
      const newId = await insertBook(bookToSave);
      if (!newId) throw new Error('insertBook fallito');
      bookId = newId;                  
    }

    // salva stato di lettura, rating e note
    await updateReadingStatus(bookId, activeStatus);
    if (rating > 0) await saveRating(bookId, rating, comment);
    else {
      await deleteRating(bookId);
    }
    if (note.trim()) await saveNotes(bookId, note) 
    else {
      await deleteComment(bookId);
    }
 

    // salva wishlist e favorite
    await toggleWishlist(bookId, isInWishlist);
    await toggleFavorite(bookId, isFavorite);

    setIsDirty(false);
    Alert.alert('Completato', isEditing ? 'Libro aggiornato.' : 'Libro aggiunto.');
    // reset + back
    setForm({ ...initialForm });
    setRemoteBook(null);
    router.replace('/');
  } catch (err: any) {
    console.error(err);
    Alert.alert('Errore', err.message || 'Qualcosa è andato storto.');
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
      <Ionicons name="book-outline" size={56} color="#4A90E2" />
      <Text style={styles.coverPlaceholderText}>
        Tocca per aggiungere copertina
      </Text>
    </View>
  );
};
  
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Caricamento...</Text>
      </View>
    );
  }
  
return (
  <KeyboardAvoidingView 
    style={styles.container}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={0}
  >
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.container}>
        {/*Header*/}
        <View style={[styles.header, {paddingTop: insets.top}]}>
          <View style={styles.headerRow}></View>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#4A90E2" />
            </TouchableOpacity>
            <Text style={styles.title}>
              {isEditing ? 'Modifica Libro' : 'Nuovo Libro'}
            </Text>
            <TouchableOpacity style={styles.searchButton} onPress={() => setShowSearch(true)}>
              <Ionicons name="search-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
          
        <ScrollView ref={scrollViewRef} contentContainerStyle={[styles.contentContainer, {paddingBottom: 80 + insets.bottom, paddingTop: 80 + insets.top}]} showsVerticalScrollIndicator={false}>
      {/* Copertina del libro (click to edit) */}
      <View style={styles.bookCoverSection}>
        <View style={styles.coverContainer}>
          <Pressable onPress={pickBookImage}>
            {renderCoverPreview()}
          </Pressable>
        </View>
      </View>
      {/* Sezione info libro e metadati */}
      <View style={styles.bookInfoSection}>
        <View style={styles.bookMetadata}>
          <Text style={styles.bookTitle} numberOfLines={3}>{form.title || 'Titolo del Libro'}</Text>
          <Text style={styles.bookAuthor} numberOfLines={2}> {form.author || 'Nome Autore'}</Text>
          {/* Tags per anno, generi, ecc... */}
          <View style={styles.tagsContainer}>
            {form.publication && (
              <View style={styles.infoTag}>
                <Ionicons name="calendar-outline" size={14} color="#4A90E2" />
                <Text style={styles.tagText}>{form.publication}</Text>
              </View>
            )}  
            {selectedGenres.map((genre) => (
              <View key={genre} style={styles.infoTag}>
                <Ionicons name="bookmark-outline" size={14} color="#9F7AEA" />
                <Text style={[styles.tagText, { color: '#9F7AEA' }]}>{genre}</Text>
              </View>
            ))}
            {remoteBook?.isbn13 ? (
              <View style={styles.infoTag}>
                <Ionicons name="barcode-outline" size={14} color="#38B2AC" />
                <Text style={[styles.tagText, { color: '#38B2AC' }]}>{remoteBook.isbn13}</Text>
              </View>
            ) : remoteBook?.isbn10 && (
              <View style={styles.infoTag}>
                <Ionicons name="barcode-outline" size={14} color="#38B2AC" />
                <Text style={[styles.tagText, { color: '#38B2AC' }]}>{remoteBook.isbn10}</Text>
              </View>
            )}
            {/* placeholders se non ci sono tags */}
            {!form.publication && selectedGenres.length === 0 && !remoteBook?.isbn10 && !remoteBook?.isbn13 && (
              <View style={[styles.infoTag, { backgroundColor: '#F8F9FA', borderColor: '#E9ECEF' }]}>
                <Ionicons name="information-circle-outline" size={14} color="#6C757D" />
                <Text style={[styles.tagText, { color: '#6C757D', fontStyle: 'italic' }]}>Compila i campi per vedere i dettagli</Text>
              </View>
            )}
          </View>
          {/*{remoteBook && (
            <View style={styles.sourceTagContainer}>
              <View style={styles.sourceTag}>
                <Ionicons name="cloud-download-outline" size={14} color="#4A90E2" />
                <Text style={styles.sourceText}>Dati da ricerca online</Text>
              </View>
            </View>
          )}*/}
        </View> 
        {/* tag fine bookMetadata */}
      </View> 
      {/* tag fine bookInfoSection */}

    {/* Stati */}
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
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          </MotiView>
        );
      })}
    </View> 
    {/* fine tag Stati */}

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
              ref={titleInputRef}
              style={styles.input}
              value={form.title}
              autoCapitalize='sentences'       // prima lettera maiuscola
              onChangeText={(t) => handleChange('title', t)}
              placeholder="Titolo del libro"
              placeholderTextColor="#bbb"
              returnKeyType="next"
              onSubmitEditing={() => {
                authorInputRef.current?.focus();
                scrollToInput(400);
              }}
              onFocus={() => scrollToInput(300)}
              blurOnSubmit={false}
          />
        </View>

        {/* Autore */}
        <View style={styles.formGroup}>
          <View style={styles.labelContainer}>
            <Ionicons name="person-outline" size={18} color="#666" style={styles.labelIcon} />
            <Text style={styles.label}>Autore</Text>
          </View>
          <TextInput
              ref={authorInputRef}
              style={styles.input}
              value={form.author}
              onChangeText={(t) => handleChange('author', t)}
              placeholder="Nome autore"
              placeholderTextColor="#bbb"
              autoCapitalize='words'       // prima lettera maiuscola
              returnKeyType="next"
              onSubmitEditing={() => {
                publicationInputRef.current?.focus();
                scrollToInput(500);
              }}
              onFocus={() => scrollToInput(400)}
              blurOnSubmit={false}
          />
        </View>
          
        <View style={[styles.formRow, {marginBottom:0}]}>
          {/* Anno e copertina */}
          <View style={[styles.formGroup, { width: 100 }]}>
            <View style={styles.labelContainer}>
              <Ionicons name="calendar-outline" size={18} color="#666" style={styles.labelIcon} />
              <Text style={styles.label}>Anno</Text>
            </View>
            <TextInput
              ref={publicationInputRef}
              style={styles.input}
              value={form.publication}
              onChangeText={(t) => handleChange('publication', t)}
              placeholder="YYYY"
              placeholderTextColor="#bbb"
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => {
                coverUrlInputRef.current?.focus();
                scrollToInput(600);
              }}
              onFocus={() => scrollToInput(500)}
              blurOnSubmit={false}
            />
          </View>

          {/* Url Libro */}
          <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
            <View style={styles.labelContainer}>
              <Ionicons name="image-outline" size={18} color="#666" style={styles.labelIcon} />
              <Text style={styles.label}>URL Copertina</Text>
            </View>
            <TextInput
              ref={coverUrlInputRef}
              style={styles.input}
              value={form.cover_url}
              onChangeText={(t) => handleChange('cover_url', t)}
              placeholder="https://..."
              placeholderTextColor="#bbb"
              returnKeyType="next"
              onSubmitEditing={() => {
                descriptionInputRef.current?.focus();
                scrollToInput(700);
              }}
              onFocus={() => scrollToInput(600)}
              blurOnSubmit={false}
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
            ref={descriptionInputRef}
            style={[styles.input, styles.textArea]}
            value={form.description}
            onChangeText={(t) => handleChange('description', t)}
            placeholder="Breve descrizione della trama"
            placeholderTextColor="#bbb"
            multiline
            textAlignVertical="top"
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            onFocus={() => scrollToInput(750)}
            blurOnSubmit={true}
          />
        </View>

        {/* Icon Row per aprire i quattro modal */}
        <View style={[styles.formRow, {flexDirection: 'row', justifyContent: 'space-around'}]}>
          {/* Generi */}
          <Pressable
            onPress={() => setShowGenreModal(true)}
            style={styles.iconButton}
          ><Ionicons name="book-outline" size={24} color="#fff" />
          </Pressable>
          {/* Note */}
          <Pressable
            onPress={() => setShowNoteModal(true)}
            style={styles.iconButton}
          ><Ionicons name="create-outline" size={24} color="#fff" />
          </Pressable>
          {/* Ratings */}
          <Pressable
            onPress={() => { // scorri in fondo
            setShowRating(v => !v);
            scrollViewRef.current?.scrollTo({ y: 99999, animated: true })            }}
            style={styles.iconButton}
          ><Ionicons name="star" size={20} color="#fff" />
          </Pressable>
          {/* Preferiti o Wishlist */}
          <Pressable
            onPress={() => {
            if(!isInWishlist && !isFavorite) {
                  setIsInWishlist(true);
            } else if (isInWishlist && !isFavorite) {
              setIsInWishlist(false);
              setIsFavorite(true);
            } else {
              setIsFavorite(false);
            }
            setIsDirty(true);
            }}
            style={[ styles.iconButton, 
            isFavorite ? { backgroundColor: '#FFA0CC' } :
            isInWishlist ? { backgroundColor: '#79E18F' } :
            { backgroundColor: '#BBB' }
            ]}
          ><Ionicons
            name={
              isInWishlist   ? 'cart'      :
              isFavorite     ? 'heart'     : 'chevron-down-outline'
            }
            size={24}
            color="#fff"
            />
          </Pressable>
        </View> 
        {/* fine tag pulsanti per i Modal */}

          {/* GENRE MODAL */}
          <Modal 
            visible={showGenreModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowGenreModal(false)}>
            <View style={styles.modalOverlay}>
              <MotiView {...entry} transition={entryTransition} style={styles.modalContent}>
                 <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Seleziona Generi</Text>
                  <TouchableOpacity onPress={() => setShowGenreModal(false)}>
                    <Ionicons name="close" size={24} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
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
          {/*Notes Modal*/}
          <Modal
            visible={showNoteModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowNoteModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Note</Text>
                  <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                    <Ionicons name="close" size={24} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
    
                <ScrollView style={styles.notesReadContainer}>
                  <Text style={styles.notesReadText}>{note}</Text>
                </ScrollView>
    
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.primaryButton, {flex: 1}]}
                    onPress={() => setShowNoteModal(false)}
                  >
                    <Text style={styles.primaryButtonText}>Chiudi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          </View>
          {showRating && (
            <View style={[styles.formSection, {paddingBottom: Spacing.xs}]}>
              <MotiView style={styles.ratingContainer}>
                <Text style={[styles.label, {marginBottom: 16}]}>Aggiungi una Valutazione</Text>
                <View style={styles.starsRow}>
                  {[1,2,3,4,5].map((s,i) => (
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
                <TextInput
                  ref={commentInputRef}           // ← qui
                  style={[styles.input, styles.commentInput]}
                  placeholder="Commento..."
                  placeholderTextColor="#555"
                  value={comment}
                  onChangeText={text => {
                    setComment(text);
                    setIsDirty(true);
                  }}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  blurOnSubmit={true}
                />
              </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.primaryButton, {flex: 1}]}
                    onPress={() => {
                      setRating(0);
                      setComment('');
                      setIsDirty(true);
                    }}
                    >
                    <Text style={styles.primaryButtonText}>Rimuovi valutazione</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.primaryButton, {flex: 1}]}
                    onPress={() => {commentInputRef.current?.focus();
                    }} 
                  >
                    <Text style={styles.primaryButtonText}>Modifica commento</Text>
                  </TouchableOpacity>
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
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
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
      bookDisplaySection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
      bookCoverSection: {
        alignItems: 'center',
        marginBottom: 20,
      },
      bookInfoSection: {
        flex: 1,
      },
      bookMetadata: {
        alignItems: 'center',
      },
      publicationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F0F7FF',
        borderRadius: 8,
      },
      publicationText: {
        fontSize: 14,
        color: '#4A90E2',
        fontWeight: '500',
        marginLeft: 6,
      },
      genresPreviewContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 12,
        paddingHorizontal: 12,
      },
      genresPreview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginLeft: 8,
        flex: 1,
      },
      genrePreviewPill: {
        backgroundColor: '#E8F4FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 4,
      },
      genrePreviewText: {
        fontSize: 12,
        color: '#4A90E2',
        fontWeight: '500',
      },
      moreGenresText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
      },
      sourceTagContainer: {
        marginTop: 12,
        alignItems: 'center',
      },
      tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 16,
        paddingHorizontal: 8,
        paddingBottom: 10, 
      },
      infoTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F7FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E0EFFF',
      },
      tagText: {
        fontSize: 13,
        color: '#4A90E2',
        fontWeight: '500',
        marginLeft: 4,
      },
      coverContainer: {
      alignItems: 'center', 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
      },
      coverPreview: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    coverPlaceholder: {
      width: 140,
      height: 210,
      borderRadius: 12,
      backgroundColor: '#f1f1f1',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderWidth: 2,
      borderColor: '#e0e0e0',
      borderStyle: 'dashed',
    },
    coverPlaceholderText: {
      color: '#999',
      fontSize: 13,
      textAlign: 'center',
      marginTop: 8,
      fontWeight: '500',
    },
    cover: {
      width: 140,
      height: 210,
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
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 6, 
      textAlign: 'center',
      lineHeight: 28,
    },
    bookAuthor: {
      fontSize: 18,
      color: '#666',
      marginBottom: 8,
      textAlign: 'center',
      fontWeight: '500',
    },
    placeholderText: {
      fontStyle: 'italic',
      color: '#999',
      fontSize: 16,
      marginBottom: 4,
    },
    sourceTag: {
      backgroundColor: '#E8F4FF',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#D0E7FF',
    },
  sourceText: {
    color: '#4A90E2',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
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
    marginTop: 12,
    justifyContent: 'center',
  },
  isbnTag: {
    flexDirection: 'row',
    backgroundColor: '#F0F7FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F4FF',
  },
  isbnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A90E2',
    marginRight: 6,
    marginLeft: 4,
  },
  isbnValue: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
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

  // Modal buttons
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textOnPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surfaceVariant,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
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
    color: '#666',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  genreTextSelected: {
    fontWeight: '700',
    color: '#fff',
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
    marginBottom: 3,
  },
  commentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: Spacing.xl, 
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderColor: 'transparent',
    textAlign: 'center', 
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

modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...Shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  // Rating modal
  ratingInput: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  starsInput: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Notes modal
  notesInputContainer: {
    marginBottom: Spacing.xl,
  },
  notesTextInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  notesReadContainer: {
    marginBottom: Spacing.xl,
    maxHeight: 400,
  },
  notesReadText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: 24,
  },

});