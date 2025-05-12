import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const STATES = ['Da leggere', 'In lettura', 'Terminato'];
const GENRES = ['Giallo', 'Rosa', 'Azione', 'Fantasy', 'Storico'];

export default function BookDetailsScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stateIndex, setStateIndex] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const cycleState = () => setStateIndex((stateIndex + 1) % STATES.length);

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((el) => el !== g) : [...prev, g]
    );
  };

  const handleSave = () => {
  if (!title.trim()) {
    Alert.alert('Errore', 'Inserisci un titolo valido.');
    return;
  }

  const newBook = {
    title: title.trim(),
    description: description.trim(),
    state: STATES[stateIndex],
    genres: selectedGenres,
    createdAt: new Date().toISOString(),
  };

  console.log('📚 Nuovo libro da salvare:', newBook);

  Alert.alert(
    'Libro salvato!',
    `Hai aggiunto:\nTitolo: "${newBook.title}"\nDescrizione: "${newBook.description}"\nStato: "${newBook.state}"\nGeneri: "${newBook.genres.join(', ')}"`
  );
};

  const handleDelete = () => {
    Alert.alert('Libro eliminato');
  };

  const getStateStyle = () => {
    switch (STATES[stateIndex]) {
      case 'Da leggere':
        return { backgroundColor: '#FFEDC2', color: '#7B4F00' };
      case 'In lettura':
        return { backgroundColor: '#C2E7FF', color: '#004466' };
      case 'Terminato':
        return { backgroundColor: '#D2F5C2', color: '#2E4E1B' };
      default:
        return { backgroundColor: '#E0E0E0', color: '#333' };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <LinearGradient
          colors={['#A8EAB4', '#BAF0F4', '#FCD9F6', '#FCF7C0']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Titolo + Libro + Stato */}
          <View style={styles.titleRow}>
            <TextInput
              style={styles.bookTitle}
              placeholder="Titolo del libro"
              placeholderTextColor="#666"
              multiline
              value={title}
              onChangeText={(text) =>
                setTitle(text.charAt(0).toUpperCase() + text.slice(1))
              }
            />

            <View style={styles.bookColumn}>
              <View style={styles.bookMock}>
                <View style={styles.ribbon} />
              </View>

              <Pressable
                style={[
                  styles.stateButton,
                  { backgroundColor: getStateStyle().backgroundColor },
                ]}
                onPress={cycleState}
              >
                <Text style={[styles.stateText, { color: getStateStyle().color }]}>
                  {STATES[stateIndex]}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Descrizione */}
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Trama o note..."
            placeholderTextColor="#555"
            multiline
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />

          {/* Generi */}
          <Text style={styles.label}>Generi</Text>
          <View style={styles.genreRow}>
            {GENRES.map((g) => (
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

          {/* Pulsanti */}
          <View style={styles.buttonRow}>
            <Pressable
              onPress={handleSave}
              style={[styles.actionButton, { backgroundColor: 'rgb(145, 192, 136)' }]}
            >
              <Text style={styles.actionText}>Salva libro</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={[styles.actionButton, { backgroundColor: 'rgb(218, 135, 157)' }]}
            >
              <Text style={styles.actionText}>Cancella</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#edede9',
  },
  scroll: {
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    elevation: 6,
    gap: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
    marginBottom: 12,
  },
  bookColumn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  bookMock: {
    width: 80,
    height: 110,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    position: 'relative',
    zIndex: 5,
  },
  ribbon: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 16,
    height: 28,
    backgroundColor: '#F4C430',
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
    zIndex: 6,
  },
  bookTitle: {
    flex: 1,
    padding: 16,
    fontSize: width * 0.1,
    fontWeight: '800',
    color: '#222',
  },
  stateButton: {
    marginTop: 8,
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  stateText: {
    fontSize: width * 0.04,
    fontWeight: '800',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: width * 0.04,
    fontWeight: '800',
    color: '#333',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  genrePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  genreSelected: {
    backgroundColor: '#FFFFFF',
  },
  genreText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: '500',
  },
  genreTextSelected: {
    fontWeight: '700',
    color: '#222',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',  
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});
