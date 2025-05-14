// src/components/SearchModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { LocalBook, RemoteBook, searchLocalBooks, searchRemoteBooks } from '../services/bookApi';

export type SearchMode = 'remote' | 'local';

interface Props {
  mode: SearchMode;
  onSelectRemote?: (book: RemoteBook) => void;
  onSelectLocal?: (book: LocalBook) => void;
  onClose: () => void;
}

export default function SearchModal({ mode, onSelectRemote, onSelectLocal, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<(RemoteBook | LocalBook)[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(timeout);
  }, [query]);

  const doSearch = async (q: string) => {
    console.log('[SearchModal] doSearch called with query:', q);
    if (!q.trim()) {
      console.log('[SearchModal] empty query, clearing results');
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = mode === 'remote'
        ? await searchRemoteBooks(q)
        : await searchLocalBooks(q);
      console.log('[SearchModal] search results:', res.length, res);
      setResults(res);
    } catch (e) {
      console.error('[SearchModal] doSearch error:', e);
      setResults([]);
    }
    setLoading(false);
  };

  const handleSelect = (item: any) => {
    console.log('[SearchModal] item selected:', item);
    if (mode === 'remote' && onSelectRemote) {
      onSelectRemote(item as RemoteBook);
    }
    if (mode === 'local' && onSelectLocal) {
      onSelectLocal(item as LocalBook);
    }
    Keyboard.dismiss();
    onClose();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {mode === 'remote' ? 'Cerca Online' : 'Cerca Libri'}
        </Text>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
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
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={20} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          onPress={() => {
            console.log('[SearchModal] onClose pressed');
            onClose();
          }} 
          style={styles.closeBtn}
        >
          <Text style={styles.cancelText}>Annulla</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f4511e" />
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item, idx) =>
          ((item as any).id ?? (item as any).externalId ?? idx).toString()
        }
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.item} 
            onPress={() => handleSelect(item)}
            activeOpacity={0.7}
          >
            {(item as any).coverUrl && (
              <Image 
                source={{ uri: (item as any).coverUrl }} 
                style={styles.coverImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.itemContent}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              {'authors' in item && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {(item as RemoteBook).authors.join(', ')}
                </Text>
              )}
              {'author' in item && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {(item as LocalBook).author}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && query.trim().length > 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={50} color="#ddd" />
              <Text style={styles.noResults}>
                Nessun risultato trovato per "{query}"
              </Text>
              {mode === 'remote' && (
                <Text style={styles.emptyTip}>
                  Prova a modificare i termini di ricerca o controlla l'ortografia
                </Text>
              )}
            </View>
          ) : query.trim().length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={50} color="#ddd" />
              <Text style={styles.emptySearch}>
                {mode === 'remote' 
                  ? 'Cerca libri online per titolo, autore o ISBN'
                  : 'Cerca libri nella tua collezione'}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 15,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    color: '#333',
  },
  clearBtn: {
    padding: 5,
  },
  closeBtn: {
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  cancelText: {
    color: '#f4511e',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
  },
  listContainer: {
    paddingBottom: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  coverImage: {
    width: 50,
    height: 75,
    borderRadius: 4,
    backgroundColor: '#eee',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
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
    color: '#666',
    fontWeight: '500',
  },
  emptyTip: {
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
  },
  emptySearch: {
    textAlign: 'center',
    marginTop: 16,
    color: '#888',
    fontSize: 16,
  },
});
