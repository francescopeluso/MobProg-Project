import { BorderRadius, Colors, CommonStyles, Shadows, Spacing, Typography } from '@/constants/styles';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
  onPress: (book: Book) => void;
}

/**
 * Funzione per validare se un titolo è valido (non generico/sconosciuto)
 */
function isValidTitle(title: string): boolean {
  const invalidTitles = [
    'titolo sconosciuto',
    'unknown title',
    'senza titolo',
    'untitled',
    'no title',
    'title unknown',
    'libro sconosciuto',
    'unknown book'
  ];
  
  const normalizedTitle = title.toLowerCase().trim();
  
  // Filtra titoli vuoti, troppo corti o che contengono termini generici
  if (!normalizedTitle || normalizedTitle.length < 2) {
    return false;
  }
  
  // Controlla se il titolo contiene una delle stringhe non valide
  return !invalidTitles.some(invalid => normalizedTitle.includes(invalid));
}

/**
 * RecommendationCarousel
 * Carousel oizzontale per mostrare libri raccomandati.
 * A differenza di BookCarousel, questo gestisce libri che potrebbero non avere un ID.
 */
export default function RecommendationCarousel({ books, onPress }: Props) {
  // Filtra libri con titoli validi
  const validBooks = books.filter(book => book.title && isValidTitle(book.title));
  
  if (validBooks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={CommonStyles.emptyText}>Nessuna raccomandazione disponibile</Text>
      </View>
    );
  }

  const handleRecommendationPress = async (book: Book) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(book);
  };

  return (
    <FlatList
      data={validBooks}
      horizontal
      keyExtractor={(item, index) => item.id ? item.id.toString() : `recommendation-${index}`}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleRecommendationPress(item)}
        >
          {item.cover_url ? (
            <Image source={{ uri: item.cover_url }} style={styles.cover} />
          ) : (
            <View style={styles.placeholderCover}>
              <Ionicons name="book" size={32} color={Colors.textSecondary} />
            </View>
          )}
          <Text numberOfLines={2} style={styles.title}>
            {item.title}
          </Text>
          <Text numberOfLines={1} style={styles.author}>
            {Array.isArray(item.authors) 
              ? item.authors.map(a => typeof a === 'string' ? a : a.name).join(', ')
              : ''
            }
          </Text>
          {/* Indicatore se il libro non è in libreria */}
          {!item.id && (
            <View style={styles.addIndicator}>
              <Ionicons name="add-circle" size={16} color={Colors.primary} />
            </View>
          )}
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
    width: 120,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cover: {
    width: 120,
    height: 180,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    ...Shadows.medium,
  },
  placeholderCover: {
    width: 120,
    height: 180,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  title: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
    color: Colors.textPrimary,
    lineHeight: 16,
  },
  author: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  addIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 2,
    ...Shadows.small,
  },
});
