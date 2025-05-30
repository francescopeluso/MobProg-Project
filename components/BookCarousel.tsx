
import { BorderRadius, Colors, CommonStyles, Shadows, Spacing, Typography } from '@/constants/styles';
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
 * Import the Book interface from bookApi
 */
import { Book } from '../services/bookApi';

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
        <Text style={CommonStyles.emptyText}>Nessun libro da mostrare</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={books}
      horizontal
      keyExtractor={(item) => (item.id || 0).toString()}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => item.id && onPress(item.id)}
        >
          <Image source={{ uri: item.cover_url }} style={styles.cover} />
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
    padding: Spacing.lg,
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  card: {
    marginRight: Spacing.lg,
    width: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cover: {
    width: 110,
    height: 165,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    ...Shadows.medium,
  },
  title: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm + 1,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    color: Colors.textPrimary,
  },
});

