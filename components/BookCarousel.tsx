
// app/(components)/BookCarousel.tsx
import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * Book type
 */
export interface Book {
  id: number;
  title: string;
  coverUrl: string;
}

interface Props {
  books: Book[];
  onPress: (id: number) => void;
}

/**
 * BookCarousel
 * Carousel orizzontale per mostrare libri.
 */
export default function BookCarousel({ books, onPress }: Props) {
  if (books.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nessun libro da mostrare</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={books}
      horizontal
      keyExtractor={(item) => item.id.toString()}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => onPress(item.id)}
        >
          <Image source={{ uri: item.coverUrl }} style={styles.cover} />
          <Text numberOfLines={2} style={styles.title}>
            {item.title}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
  listContent: {
    paddingVertical: 8,
  },
  card: {
    marginRight: 16,
    width: 110,
  },
  cover: {
    width: 110,
    height: 165,
    borderRadius: 8,
    backgroundColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    color: '#444',
  },
});

