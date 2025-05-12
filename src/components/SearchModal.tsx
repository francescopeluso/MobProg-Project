// src/components/SearchModal.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchRemoteBooks, RemoteBook, searchLocalBooks, LocalBook } from '../services/bookApi';

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
        <TouchableOpacity onPress={() => {
          console.log('[SearchModal] onClose pressed');
          onClose();
        }} style={styles.closeBtn} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
          <Ionicons name="close" size={26} color="#444" />
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}

      <FlatList
        data={results}
        keyExtractor={(item, idx) =>
          ((item as any).id ?? (item as any).externalId ?? idx).toString()
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
            <Text style={styles.title}>{item.title}</Text>
            {'authors' in item && (
              <Text style={styles.subtitle}>
                {(item as RemoteBook).authors.join(', ')}
              </Text>
            )}
            {'author' in item && (
              <Text style={styles.subtitle}>
                {(item as LocalBook).author}
              </Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.noResults}>Nessun risultato</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeBtn: {
    marginLeft: 12,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
  },
  subtitle: {
    color: '#555',
    marginTop: 4,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
});
