// src/components/SearchModal.tsx
import { Colors, CommonStyles } from '@/constants/styles';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Book, searchBooksLocal, searchBooksRemote } from '../services/bookApi';

export type SearchMode = 'remote' | 'local';

interface Props {
  mode: SearchMode;
  onSelectRemote?: (book: Book) => void;
  onSelectLocal?: (book: Book) => void;
  onClose: () => void;
}

export default function SearchModal({ mode, onSelectRemote, onSelectLocal, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Book[]>([]);
  const [searchedOnce, setSearchedOnce] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // definiamo doSearch qui per evitare problemi di dipendenze
  // e per poterlo usare nel useEffect senza creare un loop infinito
  const doSearch = useCallback(async (q: string) => {
    console.log('[SearchModal] doSearch called with query:', q);
    if (!q.trim()) {
      console.log('[SearchModal] empty query, clearing results');
      setResults([]);
      return;
    }
    
    setLoading(true);
    setSearchedOnce(true);
    
    try {
      const res = mode === 'remote'
        ? await searchBooksRemote(q)
        : await searchBooksLocal(q);
      console.log('[SearchModal] search results:', res.length, res);
      setResults(res);
    } catch (e) {
      console.error('[SearchModal] doSearch error:', e);
      setResults([]);
    }
    setLoading(false);
  }, [mode]);

  // Then use it in the effect
  useEffect(() => {
    const timeout = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(timeout);
  }, [query, doSearch]);

  const handleSelect = (item: Book) => {
    console.log('[SearchModal] item selected:', item);
    if (mode === 'remote' && onSelectRemote) {
      onSelectRemote(item);
    }
    if (mode === 'local' && onSelectLocal) {
      onSelectLocal(item);
    }
    Keyboard.dismiss();
    onClose();
  };

  const closeWithAnimation = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  };
  
  const renderSearchGuide = () => {
    if (loading || searchedOnce || query.trim().length > 0) return null;
    
    return (
      <View style={styles.searchGuide}>
        <Ionicons 
          name={mode === 'remote' ? 'globe-outline' : 'library-outline'} 
          size={50} 
          color="#e0e0e0"
        />
        <Text style={styles.searchGuideTitle}>
          {mode === 'remote' ? 'Ricerca Online' : 'Cerca nella tua libreria'}
        </Text>
        <Text style={styles.searchGuideText}>
          {mode === 'remote' 
            ? 'Cerca per titolo, autore o ISBN per trovare libri da aggiungere alla tua collezione'
            : 'Cerca tra i libri che hai già aggiunto alla tua libreria'}
        </Text>
        
        <View style={styles.searchTips}>
          <View style={styles.searchTip}>
            <Ionicons name="search-outline" size={18} color={Colors.primary} />
            <Text style={styles.searchTipText}>
              {mode === 'remote' 
                ? 'Per risultati migliori, usa titoli esatti o ISBN'
                : 'Puoi cercare per titolo o autore'}
            </Text>
          </View>
          
          <View style={styles.searchTip}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.searchTipText}>
              {mode === 'remote'
                ? 'La ricerca usa Google Books come fonte'
                : 'I risultati mostrano i libri presenti nel tuo database'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {mode === 'remote' ? 'Cerca Online' : 'Cerca Libri'}
          </Text>
        </View>

        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              placeholder={
                mode === 'remote'
                  ? 'Cerca titolo / ISBN / autore…'
                  : 'Cerca nella tua libreria…'
              }
              value={query}
              onChangeText={text => {
                console.log('[SearchModal] query changed to:', text);
                setQuery(text);
              }}
              style={styles.input}
              autoFocus
              returnKeyType="search"
              blurOnSubmit={false}
              clearButtonMode="never"
              textContentType="none"
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={closeWithAnimation} 
            style={styles.closeBtn}
          >
            <Text style={styles.cancelText}>Annulla</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={CommonStyles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.secondary} />
            <Text style={CommonStyles.loadingText}>Ricerca in corso...</Text>
          </View>
        )}

        {renderSearchGuide()}

        <FlatList
          data={results}
          keyExtractor={(item, idx) =>
            ((item.id ?? idx).toString())
          }
          contentContainerStyle={styles.listContainer}
          style={styles.flatListStyle}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.item} 
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              {item.cover_url ? (
                <Image 
                  source={{ uri: item.cover_url }} 
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.noCoverContainer}>
                  <Ionicons name="book" size={28} color="#ddd" />
                </View>
              )}
              
              <View style={styles.itemContent}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                {item.authors && Array.isArray(item.authors) && (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {Array.isArray(item.authors) 
                      ? (item.authors.length > 0 && typeof item.authors[0] === 'string'
                        ? item.authors.join(', ')
                        : item.authors.map((a: any) => a.name).join(', '))
                      : ''
                    }
                  </Text>
                )}
              </View>
              <View style={styles.itemAction}>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading && searchedOnce && query.trim().length > 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={50} color="#ddd" />
                <Text style={styles.noResults}>
                  Nessun risultato trovato per &quot;{query}&quot;
                </Text>
                {mode === 'remote' && (
                  <Text style={styles.emptyTip}>
                    Prova a modificare i termini di ricerca o controlla l&apos;ortografia
                  </Text>
                )}
                
                <TouchableOpacity 
                  style={styles.retryButton} 
                  onPress={() => setQuery('')}
                >
                  <Text style={styles.retryText}>Prova una nuova ricerca</Text>
                </TouchableOpacity>
              </View>
            ) : query.trim().length === 0 && searchedOnce ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="book-outline" size={50} color={Colors.textTertiary} />
                <Text style={styles.emptySearch}>
                  Inserisci un termine di ricerca
                </Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  header: {
    backgroundColor: Colors.surface,
    paddingTop: 15,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexShrink: 0, // L'header non deve mai ridursi
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    minHeight: 60,
    maxHeight: 60, // Altezza fissa per evitare cambiamenti
    flexShrink: 0,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    height: 40, // Altezza fissa invece di minHeight
    minWidth: 200,
  },
  searchIcon: {
    marginRight: 8,
    flexShrink: 0, // Non si riduce mai
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    color: Colors.textPrimary,
    minWidth: 120, // Larghezza minima garantita
    // Rimuoviamo width: '100%' che causa conflitti con flex
  },
  clearBtn: {
    padding: 5,
    marginLeft: 4, // Margine sinistro ridotto
    flexShrink: 0, // Non si riduce mai
  },
  closeBtn: {
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 5,
    minWidth: 70, // Larghezza minima per il pulsante Annulla
    flexShrink: 0, // Non si riduce mai
  },
  cancelText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 24,
  },
  flatListStyle: {
    flex: 1,
    width: '100%',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  coverImage: {
    width: 50,
    height: 75,
    borderRadius: 4,
    backgroundColor: Colors.surfaceVariant,
    marginRight: 12,
  },
  noCoverContainer: {
    width: 50,
    height: 75,
    borderRadius: 4,
    backgroundColor: Colors.surfaceVariant,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    marginRight: 10,
  },
  itemAction: {
    paddingLeft: 8,
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  sourceTag: {
    marginTop: 4,
    backgroundColor: Colors.accentLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sourceText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyTip: {
    textAlign: 'center',
    color: Colors.textTertiary,
    fontSize: 14,
    marginBottom: 16,
  },
  emptySearch: {
    textAlign: 'center',
    marginTop: 16,
    color: Colors.textTertiary,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryText: {
    color: Colors.textOnPrimary,
    fontWeight: '500',
  },
  searchGuide: {
    alignItems: 'center',
    padding: 30,
  },
  searchGuideTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  searchGuideText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  searchTips: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchTip: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  searchTipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
});
