import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { StyleSheet } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { AnimatePresence, MotiView } from 'moti'
import { Easing } from 'react-native-reanimated';
import {
  Alert,
  Dimensions,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const STATES = ['Da leggere', 'In lettura', 'Terminato'];
const GENRES = ['Giallo', 'Rosa', 'Azione', 'Fantasy', 'Storico'];
const LABELS = ['Terribile', 'Scarso', 'Discreto', 'Buono', 'Ottimo'];

// transizione riusabile con type tipizzato
const entryTransition = {
  type: 'timing' as const,
  duration: 400,
};

export default function BookDetailsScreen() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [stateIndex, setStateIndex] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [note, setNote] = useState('');
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [bookImage, setBookImage] = useState<string | undefined>(undefined);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [pressedCategory, setPressedCategory] = useState(false);
  const [pressedSave, setPressedSave] = useState(false);
  const [pressedDelete, setPressedDelete] = useState(false);
  const [pressedState, setPressedState] = useState(false);

  // Animazione dal basso per la modale delle note
  const bottomEntry = {
  from: { translateY: 300, opacity: 0 },
  animate: { translateY: 0,   opacity: 1 },
  exit:   { translateY: 300, opacity: 0 },
  transition: { type: 'timing', duration: 250 }
  };

  // Funzione che sincronizza commento al rating
  useEffect(() => {
    if (rating >= 1) {
      const idx = Math.min(4, rating - 1);
      setComment(LABELS[idx]);
    } else {
      setComment('');
    }
  }, [rating]);

  // Funzione che sincronizza le categorie selezionate
  const cycleState = () =>
    setStateIndex((stateIndex + 1) % STATES.length);

  const toggleGenre = (g: string) =>
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );

  // Funzione che permette di selezionare le categorie
  const toggleCategory = (c: string) =>
    setSelectedCategories(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );

  // Funzione che permette di selezionare la copertina dalla galleria
  const pickBookImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permesso negato', 'Devi consentire l\'accesso alla galleria');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });
    if (!res.canceled && res.assets.length) {
      setBookImage(res.assets[0].uri);
    }
  };

  // Funzione che prende lo stato del libro e imposta il colore del bottone
  const getStateStyle = () => {
    switch (STATES[stateIndex]) {
      case 'Da leggere': return { backgroundColor: '#FFEDC2', color: '#7B4F00' };
      case 'In lettura': return { backgroundColor: '#C2E7FF', color: '#004466' };
      case 'Terminato':  return { backgroundColor: '#D2F5C2', color: '#2E4E1B' };
      default:           return { backgroundColor: '#E0E0E0', color: '#333' };
    }
  };

  // Funzione che permette di salvare il libro
  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Errore', 'Inserisci un titolo valido.');
      return;
    }
    Alert.alert(
      'Salvato!',
      `"${title}" di ${author}\nRating: ${rating}★\nStato: ${STATES[stateIndex]}`
      // TO DO: aggiungere salvataggio su DB
    );
  };
  // Funzione che permette di eliminare il libro
  // TO DO: aggiungere logica per eliminare il libro
  const handleDelete = () => {
    Alert.alert(
      'Conferma eliminazione',
      'Sei sicuro di voler eliminare il libro?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: () => Alert.alert('Libro eliminato') },
      ]
    );
  };

  // Logica per il bottone Valuta
  const onRatingToggle = () => {
    if (showRating && rating > 0) {
      setRating(0);
      setComment('');
      setShowRating(true);
    } else {
      setShowRating(v => !v);
    }
  };

  // Animazione "entry"
  const entry = {
  from: { translateY: 20, opacity: 0 },
  animate: { translateY: 0, opacity: 1 },
  transition: {
    type: 'spring',
    damping: 50,    // più alto = meno rimbalzo
    stiffness: 10,  // più basso = più lento
    mass: 1.0
  }
};

  return (
    <View style={styles.container}>
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
          {/* Close button */}
          <Pressable onPress={() => setShowNoteModal(false)} style={styles.closeIcon}>
            <Ionicons name="close" size={24} color="#333" />
          </Pressable>

          {/* Titolo */}
          <Text style={styles.label}>Note aggiuntive</Text>

          {/* Input */}
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
                style={[
                  styles.genrePill,
                  styles.genreSelected,
                  { backgroundColor: 'rgb(37, 33, 91)', borderRadius: 30 },
                ]}
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

      <ScrollView contentContainerStyle={styles.scrollFullWidth}>
        {/* Copertina */}
        <MotiView
          {...entry}
          transition={{ ...entryTransition, delay: 100 }}
          style={styles.coverContainer}
        >
          <Pressable onPress={pickBookImage}>
            <ImageBackground
              source={bookImage ? { uri: bookImage } : undefined}
              style={styles.cover}
              imageStyle={{ borderRadius: 12 }}
            >
              {!bookImage && <Ionicons name="image-outline" size={40} color="#999" />}
            </ImageBackground>
          </Pressable>
        </MotiView>

        {/* Titolo */}
        <MotiView {...entry} transition={{ ...entryTransition, delay: 200 }}>
          <TextInput
            style={styles.titleInput}
            placeholder="Titolo"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
          />
        </MotiView>

        {/* Autore */}
        <MotiView
          {...entry}
          transition={{ ...entryTransition, delay: 300 }}
          style={styles.authorRow}
        >
          <TextInput
            style={styles.authorInput}
            placeholder="Autore"
            placeholderTextColor="#666"
            value={author}
            onChangeText={setAuthor}
          />
        </MotiView>

        {/* Sezione Rating */}
        
        {showRating && (
          <MotiView style={styles.ratingContainer}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s, i) => (
                <Pressable key={s} onPress={() => setRating(s)}>
                  <MotiView
                    from={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: rating === s ? 1.3 : 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      damping: 8,
                      mass: 0.5,
                      delay: i * 50,
                    }}
                  >
                    <AntDesign
                      name={s <= rating ? 'star' : 'staro'}
                      size={32}
                      color={s <= rating ? '#FFD700' : '#DDD'}
                      style={{ marginHorizontal: 4 }}
                    />
                  </MotiView>
                </Pressable>
              ))}
            </View>
            <View style={styles.commentWrapper}>
  <Ionicons name="create-outline" size={20} color="#666" style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.input, styles.commentInput]}
          placeholder="Commento..."
          placeholderTextColor="#555"
          value={comment}
          onChangeText={setComment}
        />
      </View>
          </MotiView>
        )}


        {/* Icon-row */}
        <MotiView {...entry} transition={{ ...entryTransition, delay: 500 }} style={styles.iconRow}>
          <Pressable style={styles.iconButton} onPress={() => setShowGenreModal(true)}>
            <Ionicons name="book-outline" size={20} color="#fff" />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => setShowNoteModal(true)}>
            <Ionicons name="create-outline" size={20} color="#fff" />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={onRatingToggle}>
            <Ionicons name="star" size={20} color="#fff" />
          </Pressable>
          <MotiView
            {...entry}
            transition={{ ...entryTransition, delay: 600 }}
            style={styles.iconButton}
          >
            <Pressable
              onPressIn={() => setPressedCategory(true)}
              onPressOut={() => setPressedCategory(false)}
              onPress={() => setShowCategoryModal(true)}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="layers-outline" size={20} color="#fff" />
            </Pressable>
          </MotiView>
        </MotiView>

        {/* Trama */}
        <MotiView {...entry} transition={{ ...entryTransition, delay: 700 }}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Inserisci la trama del libro..."
            placeholderTextColor="#777"
            multiline

            value={description}
            onChangeText={setDescription}
          />
        </MotiView>

        {/* Stato */}
        <MotiView {...entry} transition={{ ...entryTransition, delay: 800 }} style={styles.stateButton}>
          <Pressable
            onPressIn={() => setPressedState(true)}
            onPressOut={() => setPressedState(false)}
            onPress={cycleState}
            style={[styles.stateButton, { backgroundColor: getStateStyle().backgroundColor }]}
          >
            <Text style={[styles.stateText, { color: getStateStyle().color }]}>
              {STATES[stateIndex]}
            </Text>
          </Pressable>
        </MotiView>

        
      </ScrollView>
      {/* Salva / Cancella */}
        <MotiView {...entry} transition={{ ...entryTransition, delay: 900 }} style={styles.buttonRow}>
          <MotiView
            from={{ scale: 1 }}
            animate={{ scale: pressedSave ? 0.95 : 1 }}
            transition={{ type: 'timing' as const, duration: 100 }}
            style={[styles.actionButton, { backgroundColor: 'rgb(37, 33, 91)' }]}
          >
            <Pressable
              onPressIn={() => setPressedSave(true)}
              onPressOut={() => setPressedSave(false)}
              onPress={handleSave}
              style={styles.actionButtonInner}
            >
              <Text style={[styles.actionText, { color: 'white' }]}>Salva libro</Text>
            </Pressable>
          </MotiView>
          <MotiView
            from={{ scale: 1 }}
            animate={{ scale: pressedDelete ? 0.95 : 1 }}
            transition={{ type: 'timing' as const, duration: 100 }}
            style={[styles.actionButton, { backgroundColor: 'rgb(255, 255, 255)' }]}
          >
            <Pressable
              onPressIn={() => setPressedDelete(true)}
              onPressOut={() => setPressedDelete(false)}
              onPress={handleDelete}
              style={styles.actionButtonInner}
            >
              <Text style={[styles.actionText, { color: 'rgb(37, 33, 91)' }]}>
                Cancella
              </Text>
            </Pressable>
          </MotiView>
        </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'linear-gradient( #F0F0F0 50%, #E0E0E0 50%)',
  },
  commentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scrollFullWidth: {
    padding: 24,
    alignItems: 'stretch',
    width: '100%',
  },
  coverContainer: { 
    alignSelf: 'center', 
    marginBottom: 16, 
    shadowColor: 'rgba(0, 0, 0, 0.7)',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    elevation: 10, 
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'solid',
    borderColor: '#ccc',
  },
  cover: {
    width: 150,
    height: 200,
    backgroundColor: '#eee',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',    
  },
  titleInput: {
    fontSize: width * 0.1,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorInput: {
   width: '50%',              
   fontSize: width * 0.05,
   fontWeight: '500',
   color: '#666',
   textAlign: 'center',      
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: 60, 
    height: 40, 
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    elevation: 10,
    backgroundColor: 'rgb(37, 33, 91)',
  },
  ratingContainer: { alignItems: 'center', marginBottom: 16 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  commentInput: {
    backgroundColor: 'transparent',
    marginBottom: 16,
    textAlign: 'center',
    borderBottomColor: 'transparent',
    paddingTop: 0,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    width: '100%',
    
  },
  textArea: { height: 100, 
    backgroundColor: '#fff',
    borderRadius: 15,
    fontWeight: '500', 
    textAlign: 'left' },
  stateButton: {
    padding: 10,
    borderRadius: 20,
    width: 160,
    height: 42,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    elevation: 10,
  },
  stateText: { fontSize: width * 0.04, fontWeight: '800' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    backgroundColor: 'transparent', 
    position: 'absolute',
    bottom: 0,               // oppure bottom: 60 se hai una bottom nav di 60px
    left: 0,
    right: 0,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  actionButton: {
    flex: 1,
    borderRadius: 20,
    height: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgb(37, 33, 91)',
    borderStyle: 'solid',
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    elevation: 10,
  },
  actionButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { 
    fontWeight: '800', 
    fontSize: 15 
  },
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
  label: {
    fontSize: width * 0.04,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  genrePill: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  genreSelected: { backgroundColor: '#A4E8D7' },
  genreText: { fontSize: 13, color: '#666' },
  genreTextSelected: { fontWeight: '700', color: '#222' },
  addCategoryButton: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
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
  closeIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 10,
  },

  bottomSheet: {
  backgroundColor: '#fff',
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  padding: 20,
  width: '100%',
  height: Dimensions.get('window').height * 0.6,
},
});
