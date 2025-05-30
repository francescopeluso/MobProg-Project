import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/styles';
import { Book } from '../services/bookApi';
import { addToWishlist } from '../services/wishlistService';

interface Props {
  visible: boolean;
  book: Book | null;
  onClose: () => void;
}

export default function RecommendationDetailModal({ visible, book, onClose }: Props) {
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  const handleAddToWishlist = async () => {
    if (!book) return;

    try {
      setAddingToWishlist(true);
      await addToWishlist(book.title);
      
      Alert.alert(
        'Successo!',
        `"${book.title}" è stato aggiunto alla tua wishlist.`,
        [
          {
            text: 'OK',
            onPress: onClose
          }
        ]
      );
    } catch (error) {
      console.error('Errore nell\'aggiunta alla wishlist:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante l\'aggiunta alla wishlist.');
    } finally {
      setAddingToWishlist(false);
    }
  };

  if (!book) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Dettagli Libro</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Book Cover and Basic Info */}
            <View style={styles.bookHeader}>
              {book.cover_url ? (
                <Image source={{ uri: book.cover_url }} style={styles.bookCover} />
              ) : (
                <View style={styles.placeholderCover}>
                  <Ionicons name="book" size={48} color={Colors.textSecondary} />
                </View>
              )}
              
              <View style={styles.bookBasicInfo}>
                <Text style={styles.bookTitle} numberOfLines={3}>
                  {book.title}
                </Text>
                <Text style={styles.bookAuthor}>
                  {Array.isArray(book.authors) 
                    ? book.authors.map(a => typeof a === 'string' ? a : a.name).join(', ')
                    : book.authors || 'Autore sconosciuto'
                  }
                </Text>
                
                {/* Metadata */}
                <View style={styles.metadata}>
                  {book.publication && (
                    <View style={styles.metadataItem}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                      <Text style={styles.metadataText}>{book.publication}</Text>
                    </View>
                  )}
                  
                  {book.editor && (
                    <View style={styles.metadataItem}>
                      <Ionicons name="business-outline" size={16} color={Colors.accent} />
                      <Text style={styles.metadataText}>{book.editor}</Text>
                    </View>
                  )}
                  
                  {book.language && (
                    <View style={styles.metadataItem}>
                      <Ionicons name="language-outline" size={16} color={Colors.info} />
                      <Text style={styles.metadataText}>{book.language.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Genres */}
            {book.genres && book.genres.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Generi</Text>
                <View style={styles.genresContainer}>
                  {(Array.isArray(book.genres) ? book.genres : []).slice(0, 5).map((genre, index) => (
                    <View key={index} style={styles.genreTag}>
                      <Text style={styles.genreText}>
                        {typeof genre === 'string' ? genre : genre.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Description */}
            {book.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Descrizione</Text>
                <Text style={styles.description}>{book.description}</Text>
              </View>
            )}

            {/* ISBN Information */}
            {(book.isbn10 || book.isbn13) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Informazioni ISBN</Text>
                {book.isbn13 && (
                  <View style={styles.isbnItem}>
                    <Text style={styles.isbnLabel}>ISBN-13:</Text>
                    <Text style={styles.isbnValue}>{book.isbn13}</Text>
                  </View>
                )}
                {book.isbn10 && (
                  <View style={styles.isbnItem}>
                    <Text style={styles.isbnLabel}>ISBN-10:</Text>
                    <Text style={styles.isbnValue}>{book.isbn10}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              disabled={addingToWishlist}
            >
              <Text style={styles.cancelButtonText}>Chiudi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.wishlistButton, addingToWishlist && styles.wishlistButtonDisabled]} 
              onPress={handleAddToWishlist}
              disabled={addingToWishlist}
            >
              {addingToWishlist ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="heart-outline" size={20} color="#fff" />
                  <Text style={styles.wishlistButtonText}>Aggiungi alla Wishlist</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    width: '100%',
    maxWidth: 400,
    height: '80%', 
    ...Shadows.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  bookHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  placeholderCover: {
    width: 80,
    height: 120,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  bookBasicInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  bookTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  bookAuthor: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  metadata: {
    gap: Spacing.xs,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metadataText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  genreTag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  genreText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  description: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
    textAlign: 'justify',
  },
  isbnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  isbnLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  isbnValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  wishlistButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  wishlistButtonDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  wishlistButtonText: {
    fontSize: Typography.fontSize.md,
    color: '#fff',
    fontWeight: Typography.fontWeight.medium,
  },
});
