import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionCard } from '@/components';

import { getTabContentBottomPadding } from '@/constants/layout';
import { Colors, CommonStyles, Spacing, Typography } from '@/constants/styles';
import { FavoriteBook, getFavoriteBooks } from '@/services/favoritesService';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const [favoriteBooks, setFavoriteBooks] = useState<FavoriteBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavoriteBooks();
  }, []);

  const loadFavoriteBooks = async () => {
    try {
      setLoading(true);
      const favorites = await getFavoriteBooks();
      setFavoriteBooks(favorites);
    } catch (error) {
      console.error('Errore nel caricamento dei libri preferiti:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={16}
        color={Colors.warning}
      />
    ));
  };

  return (
    <View style={CommonStyles.container}>
      <ScrollView 
        contentContainerStyle={[
          CommonStyles.contentContainer,
          {
            paddingTop: 0,
            paddingBottom: getTabContentBottomPadding(insets.bottom)
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[CommonStyles.header, { marginTop: insets.top }]}>
          <View style={CommonStyles.headerTop}>
            <TouchableOpacity 
              style={CommonStyles.iconButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={CommonStyles.title}>Preferiti</Text>
              <Text style={CommonStyles.subtitle}>I tuoi libri del cuore</Text>
            </View>
            <View style={{width: 40}} />
          </View>
        </View>

        {loading ? (
          <View style={CommonStyles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={CommonStyles.loadingText}>Caricamento preferiti...</Text>
          </View>
        ) : (
          <>
            {favoriteBooks.length > 0 ? (
              <SectionCard title={`${favoriteBooks.length} libri preferiti`}>
                <View style={styles.booksGrid}>
                  {favoriteBooks.map((book) => (
                    <TouchableOpacity 
                      key={book.id} 
                      style={styles.bookCard}
                      activeOpacity={0.7}
                      onPress={() => router.push(`/(screens)/book-details?id=${book.id}`)}
                    >
                      <View style={styles.bookCover}>
                        {book.cover_url ? (
                          <Image 
                            source={{ uri: book.cover_url }} 
                            style={styles.coverImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.coverPlaceholder}>
                            <Ionicons name="book" size={24} color={Colors.textSecondary} />
                          </View>
                        )}
                      </View>
                      <View style={styles.bookInfo}>
                        <Text style={styles.bookTitle}>{book.title}</Text>
                        <Text style={styles.bookAuthor}>{book.author}</Text>
                        {book.rating && (
                          <View style={styles.ratingContainer}>
                            {renderStars(book.rating)}
                          </View>
                        )}
                        <Text style={styles.dateAdded}>
                          Aggiunto il {new Date(book.dateAdded).toLocaleDateString('it-IT')}
                        </Text>
                      </View>
                      <View style={styles.actionButton}>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </SectionCard>
            ) : (
              <SectionCard title="Preferiti">
                <View style={CommonStyles.emptyState}>
                  <Ionicons name="heart-outline" size={64} color={Colors.textTertiary} />
                  <Text style={CommonStyles.emptyText}>Nessun libro preferito</Text>
                  <Text style={styles.emptySubtext}>
                    Aggiungi i tuoi libri preferiti dalla biblioteca per vederli qui
                  </Text>
                </View>
              </SectionCard>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  booksGrid: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bookCover: {
    width: 48,
    height: 64,
    borderRadius: 8,
    marginRight: Spacing.lg,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  bookAuthor: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  dateAdded: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  actionButton: {
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
});
