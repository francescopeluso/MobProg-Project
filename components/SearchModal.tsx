// src/components/SearchModal.tsx
import { Colors, CommonStyles } from '@/constants/styles';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Book, searchBooksLocal, searchBooksRemote } from '../services/bookApi';
import { getDBConnection } from '../utils/database';

export type SearchMode = 'remote' | 'local';
export type FilterType = null | 'to_read' | 'reading' | 'completed' | 'favorites' | 'genres';
export type SortType = 'title' | 'author' | 'recent' | 'rating';

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
  const [allBooks, setAllBooks] = useState<Book[]>([]);  // Nuova variabile per memorizzare tutti i libri
  const [searchedOnce, setSearchedOnce] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const resultsAnim = useState(new Animated.Value(1))[0];  // Animazione per i risultati
  
  // Nuovi stati per i filtri
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('title');
  const [showGenreSelector, setShowGenreSelector] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);  // Nuovo stato per gestire il caricamento dei filtri
  const [genres, setGenres] = useState<string[]>([]);  // Aggiungi questo stato per memorizzare i generi disponibili
  const genreSelectorAnim = useRef(new Animated.Value(0)).current;
  
  // Aggiungi un ref per memorizzare l'ultima query cercata
  const lastQueryRef = useRef('');
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Funzione per applicare filtri e ordinamento in modo animato
  const applyFiltersAndSort = useCallback((books: Book[]) => {
    if (!books) return [];
    
    // Filtra per categoria
    let filteredBooks = [...books];
    
    if (activeFilter) {
      switch (activeFilter) {
        case 'to_read':
          filteredBooks = filteredBooks.filter(book => 
            book.reading_status?.status === 'to_read');
          break;
        case 'reading':
          filteredBooks = filteredBooks.filter(book => 
            book.reading_status?.status === 'reading');
          break;
        case 'completed':
          filteredBooks = filteredBooks.filter(book => 
            book.reading_status?.status === 'completed');
          break;
        case 'favorites':
          filteredBooks = filteredBooks.filter(book => book.is_favorite);
          break;
        case 'genres':
          if (activeGenre) {
            filteredBooks = filteredBooks.filter(book => 
              book.genres?.some(g => 
                (typeof g === 'string' ? g : g.name).toLowerCase() === activeGenre.toLowerCase()
              )
            );
          }
          break;
      }
    }
    
    // Applica ordinamento
    let sortedBooks = [...filteredBooks];
    
    switch (sortBy) {
      case 'title':
        sortedBooks.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'author':
        sortedBooks.sort((a, b) => {
          const authorA = Array.isArray(a.authors) && a.authors.length > 0
            ? (typeof a.authors[0] === 'string' ? a.authors[0] : a.authors[0].name)
            : '';
          const authorB = Array.isArray(b.authors) && b.authors.length > 0 
            ? (typeof b.authors[0] === 'string' ? b.authors[0] : b.authors[0].name)
            : '';
          return authorA.localeCompare(authorB);
        });
        break;
      case 'recent':
        sortedBooks.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA; // Più recenti prima
        });
        break;
      case 'rating':
        sortedBooks.sort((a, b) => {
          const ratingA = a.rating?.rating || 0;
          const ratingB = b.rating?.rating || 0;
          return ratingB - ratingA; // Valutazione più alta prima
        });
        break;
    }
    
    return sortedBooks;
  }, [activeFilter, activeGenre, sortBy]);

  // Modifichiamo doSearch per applicare i filtri e migliorare le transizioni
  const doSearch = useCallback(async (q: string, isFilterChange = false) => {
    console.log('[SearchModal] doSearch called with query:', q);
    if (!q.trim() && mode === 'remote') {
      console.log('[SearchModal] empty query for remote search, clearing results');
      setResults([]);
      return;
    }
    
    // Se è un cambio filtro e abbiamo già tutti i libri, applichiamo solo i filtri localmente
    if (mode === 'local' && isFilterChange && allBooks.length > 0) {
      // Anima la transizione
      Animated.sequence([
        Animated.timing(resultsAnim, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(resultsAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
      
      // Applica filtri localmente
      const filteredResults = applyFiltersAndSort(allBooks);
      setResults(filteredResults);
      return;
    }
    
    // Altrimenti facciamo una ricerca normale
    setIsFilterLoading(isFilterChange);  // Usa il nuovo flag invece di loading per i filtri
    setLoading(!isFilterChange);  // Se è un cambio filtro, non mostriamo il caricamento principale
    setSearchedOnce(true);
    
    try {
      // Per la ricerca locale, permettiamo di visualizzare tutti i libri con query vuota
      let res;
      if (mode === 'remote') {
        res = await searchBooksRemote(q);
      } else {
        res = q.trim() ? await searchBooksLocal(q) : await searchBooksLocal('');
        
        // Salva tutti i libri per i filtri futuri
        if (res.length > 0) {
          setAllBooks(res);
        }
      }
      
      // Applica filtri solo per la modalità locale
      if (mode === 'local') {
        res = applyFiltersAndSort(res);
      }
      
      // Anima i nuovi risultati
      Animated.sequence([
        Animated.timing(resultsAnim, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(resultsAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
      
      console.log('[SearchModal] search results:', res.length, res);
      setResults(res);
    } catch (e) {
      console.error('[SearchModal] doSearch error:', e);
      setResults([]);
    }
    setLoading(false);
    setIsFilterLoading(false);
  }, [mode, applyFiltersAndSort, allBooks, resultsAnim]);

  // Nuovo useEffect per ricaricare i libri quando si apre la modale
  useEffect(() => {
    if (mode === 'local') {
      const loadInitialBooks = async () => {
        try {
          const books = await searchBooksLocal('');
          setAllBooks(books);
          const filteredBooks = applyFiltersAndSort(books);
          setResults(filteredBooks);
          setSearchedOnce(true);
        } catch (e) {
          console.error('Error loading initial books:', e);
        }
      };
      
      loadInitialBooks();
    }
  }, [mode, applyFiltersAndSort]);

  // Modifica l'useEffect che gestisce la ricerca
  useEffect(() => {
    // Evita ricerche duplicate
    if (query === lastQueryRef.current) {
      return;
    }
    
    if (query.trim() === '' && mode === 'local' && allBooks.length > 0) {
      // Se abbiamo già i libri e la query è vuota, filtriamo localmente
      const filteredBooks = applyFiltersAndSort(allBooks);
      setResults(filteredBooks);
      lastQueryRef.current = query; // Aggiorna il riferimento alla query
      return;
    }
    
    const timeout = setTimeout(() => {
      lastQueryRef.current = query; // Salva la query prima di eseguire la ricerca
      doSearch(query);
    }, 400);
    
    return () => clearTimeout(timeout);
  }, [query, mode]); // Rimuovi dipendenze problematiche che causano il ciclo

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

  // Componente per visualizzare i filtri disponibili
  const renderFilterOptions = () => {
    const filters = [
      { id: null, label: 'Tutti', icon: 'book-outline' },
      { id: 'to_read', label: 'Da leggere', icon: 'time-outline' },
      { id: 'reading', label: 'In lettura', icon: 'bookmark-outline' },
      { id: 'completed', label: 'Completati', icon: 'checkmark-circle-outline' },
      { id: 'favorites', label: 'Preferiti', icon: 'heart-outline' },
      { id: 'genres', label: activeGenre || 'Generi', icon: 'list-outline' },
    ];
    
    return (
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filtra per:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filtersScrollContent}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id || 'all'}
              style={[
                styles.filterChip,
                activeFilter === filter.id && styles.filterChipActive,
                filter.id === 'genres' && activeGenre && styles.filterChipActive,
                (isFilterLoading && 
                 ((activeFilter === filter.id) || 
                  (filter.id === 'genres' && activeGenre))) && 
                 styles.filterChipLoading
              ]}
              onPress={() => {
                // Evita di ricaricare se è già lo stesso filtro
                if (activeFilter === filter.id && 
                    !(filter.id === 'genres')) {
                  return;
                }
                
                if (filter.id === 'genres') {
                  // Sempre toggle del selettore per il filtro generi
                  setShowGenreSelector(!showGenreSelector);
                  setActiveFilter('genres');
                } else {
                  setActiveFilter(filter.id as FilterType);
                  setShowGenreSelector(false);
                  setActiveGenre(null);
                  // Passa true per indicare che è un cambio di filtro
                  doSearch(query, true);
                }
              }}
            >
              {isFilterLoading && 
               ((activeFilter === filter.id) || 
                (filter.id === 'genres' && activeGenre)) ? (
                <ActivityIndicator 
                  size="small" 
                  color={Colors.textOnPrimary} 
                  style={styles.filterChipLoader}
                />
              ) : (
                <Ionicons
                  name={filter.icon as any}
                  size={16}
                  color={(activeFilter === filter.id || 
                        (filter.id === 'genres' && activeGenre)) 
                        ? Colors.textOnPrimary : Colors.textPrimary}
                  style={styles.filterIcon}
                />
              )}
              <Text
                style={[
                  styles.filterChipText,
                  (activeFilter === filter.id || 
                   (filter.id === 'genres' && activeGenre)) && 
                   styles.filterChipTextActive
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {filter.id === 'genres' && activeGenre ? activeGenre : filter.label}
              </Text>
              {filter.id === 'genres' && (
                <Ionicons
                  name={showGenreSelector ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={(activeGenre) ? Colors.textOnPrimary : Colors.textPrimary}
                  style={{marginLeft: 4}}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Selettore generi che appare quando showGenreSelector è true */}
        {showGenreSelector && (
          <Animated.View 
            style={[
              styles.genreSelectorContainer,
              {
                opacity: genreSelectorAnim,
                transform: [{
                  translateY: genreSelectorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.genreSelectorTitle}>Seleziona un genere:</Text>
            <View style={styles.genreList}>
              {genres.length > 0 ? (
                genres.map(genre => (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.genreOption,
                      activeGenre === genre && styles.genreOptionActive
                    ]}
                    onPress={() => {
                      setActiveGenre(genre);
                      setShowGenreSelector(false);
                      doSearch(query, true);
                    }}
                  >
                    <Text 
                      style={[
                        styles.genreOptionText,
                        activeGenre === genre && styles.genreOptionTextActive
                      ]}
                    >
                      {genre}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyGenresText}>
                  Nessun genere disponibile. Aggiungi libri con generi per visualizzarli qui.
                </Text>
              )}
            </View>
            {activeGenre && (
              <TouchableOpacity
                style={styles.clearGenreButton}
                onPress={() => {
                  setActiveGenre(null);
                  setShowGenreSelector(false);
                  if (activeFilter === 'genres') {
                    setActiveFilter(null);
                  }
                  doSearch(query, true);
                }}
              >
                <Text style={styles.clearGenreText}>Rimuovi filtro per genere</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </View>
    );
  };

  // Componente per visualizzare le opzioni di ordinamento
  const renderSortOptions = () => {
    const sortOptions = [
      { id: 'title', label: 'Titolo (A-Z)', icon: 'text-outline' },
      { id: 'author', label: 'Autore', icon: 'person-outline' },
      { id: 'recent', label: 'Più recenti', icon: 'calendar-outline' },
      { id: 'rating', label: 'Valutazione', icon: 'star-outline' },
    ];
    
    return (
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Ordina per:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortScrollContent}
        >
          {sortOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.sortOption,
                sortBy === option.id && styles.sortOptionActive
              ]}
              onPress={() => {
                setSortBy(option.id as SortType);
                doSearch(query);
              }}
            >
              <Ionicons
                name={option.icon as any}
                size={14}
                color={sortBy === option.id ? Colors.textOnPrimary : Colors.textSecondary}
              />
              <Text style={[
                styles.sortOptionText,
                sortBy === option.id && styles.sortOptionTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Nuovo useEffect per caricare i generi disponibili
  useEffect(() => {
    if (mode === 'local') {
      const loadGenres = async () => {
        try {
          const db = getDBConnection();
          const genreRows = await db.getAllAsync(
            `SELECT DISTINCT name FROM genres ORDER BY name`
          ) as {name: string}[];
          
          const extractedGenres = genreRows.map(row => row.name);
          console.log('Generi caricati:', extractedGenres);
          setGenres(extractedGenres);
        } catch (error) {
          console.error('Error loading genres:', error);
        }
      };
      
      loadGenres();
    }
  }, [mode]);
  
  // Gestisci animazione del selettore generi
  useEffect(() => {
    if (showGenreSelector) {
      // Mostra il selettore con animazione
      Animated.timing(genreSelectorAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Nascondi il selettore con animazione
      Animated.timing(genreSelectorAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showGenreSelector, genreSelectorAnim]);
  
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
              autoFocus={mode === 'remote'}
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

        {/* Rendering dei filtri e ordinamento solo per ricerca locale */}
        {mode === 'local' && (
          <>
            {renderFilterOptions()}
            {renderSortOptions()}
          </>
        )}

        {loading && (
          <View style={CommonStyles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.secondary} />
            <Text style={CommonStyles.loadingText}>Ricerca in corso...</Text>
          </View>
        )}

        {renderSearchGuide()}

        <Animated.View style={{ opacity: resultsAnim, flex: 1 }}>
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
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

// Aggiungiamo i nuovi stili
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
    maxHeight: 60,
    flexShrink: 0,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 12,  // Rimosso paddingVertical
    borderWidth: 1,
    borderColor: 'transparent',
    height: 40,
    minWidth: 200,
  },
  searchIcon: {
    marginRight: 8,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: 40,  // Altezza esplicita che corrisponde al contenitore
    paddingVertical: 0,  // Zero padding verticale
    color: Colors.textPrimary,
    minWidth: 120,
  },
  clearBtn: {
    height: 40,  // Altezza fissa uguale alla barra di ricerca
    width: 30,   // Larghezza fissa per un'area di tocco adeguata
    alignItems: 'center',  // Centra orizzontalmente
    justifyContent: 'center',  // Centra verticalmente
    marginLeft: 4,
    flexShrink: 0,
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
  filtersContainer: {
    paddingTop: 12,
    paddingBottom: 8, 
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filtersTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  filtersScrollContent: {
    paddingRight: 16,
    paddingBottom: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  filterChipTextActive: {
    color: Colors.textOnPrimary,
  },
  sortContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginRight: 8,
  },
  sortScrollContent: {
    flexDirection: 'row',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  sortOptionActive: {
    backgroundColor: Colors.primary,
  },
  sortOptionText: {
    fontSize: 12,
    marginLeft: 4,
    color: Colors.textSecondary,
  },
  sortOptionTextActive: {
    color: Colors.textOnPrimary,
  },
  filterChipLoading: {
    opacity: 0.8,
  },
  filterChipLoader: {
    marginRight: 4,
    height: 16,
    width: 16,
  },
  genreSelectorContainer: {
    backgroundColor: Colors.surfaceVariant,
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  genreSelectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  genreList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreOption: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  genreOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genreOptionText: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  genreOptionTextActive: {
    color: Colors.textOnPrimary,
  },
  emptyGenresText: {
    color: Colors.textTertiary,
    fontStyle: 'italic',
    padding: 8,
  },
  clearGenreButton: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearGenreText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
});