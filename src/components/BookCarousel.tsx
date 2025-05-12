
// app/(components)/BookCarousel.tsx
import React from 'react';
import {
  FlatList,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
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
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => onPress(item.id)}
        >
          <Image source={{ uri: item.coverUrl }} style={styles.cover} />
          <Text numberOfLines={1} style={styles.title}>
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
  },
  card: {
    marginRight: 12,
    width: 100,
  },
  cover: {
    width: 100,
    height: 150,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  title: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
});

