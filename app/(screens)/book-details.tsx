import { AntDesign, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../../constants/styles';
import { Book, getBookById, saveNotes, saveRating, updateReadingStatus } from '../../services/bookApi';

interface BookDetails extends Omit<Book, 'reading_status'> {
  id: number;
  author: string;
  status: 'to_read' | 'reading' | 'completed';
}

const { width } = Dimensions.get('window');

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [status, setStatus] = useState<"to_read" | "reading" | "completed">('to_read');
  const [comment, setComment] = useState('');    
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [tempRating, setTempRating] = useState(0);
  const [tempComment, setTempComment] = useState('');
  const [tempNotes, setTempNotes] = useState('');
  const insets = useSafeAreaInsets();
  const [inWishlist, setInWishlist] = useState(false);
  const [favorite, setFavorite]     = useState(false);

  const loadBook = useCallback(async () => {
    try {
      setLoading(true);
      const bookData = await getBookById(Number(id));
      if (bookData) {
        const authorString = Array.isArray(bookData.authors) 
          ? bookData.authors.map(a => typeof a === 'string' ? a : a.name).join(', ')
          : '';
          
        setBook({
          ...bookData,
          id: bookData.id as number,
          author: authorString,
          status: bookData.reading_status?.status || 'to_read'
        });
        
        setInWishlist(bookData.is_in_wishlist ?? false);
        setFavorite(bookData.is_favorite ?? false);
        setStatus(bookData.reading_status?.status || 'to_read');
        setComment(bookData.rating?.comment || '');
        setRating(bookData.rating?.rating || 0);
        setNotes(bookData.notes || '');
        setTempComment(bookData.rating?.comment || '');
        setTempRating(bookData.rating?.rating || 0);
        setTempNotes(bookData.notes || '');
      }
    } catch (loadError) {
      console.error('Error loading book:', loadError);
      Alert.alert('Errore', 'Impossibile caricare i dettagli del libro.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  const updateStatus = async (newStatus: typeof status) => {
    if (!book) return;
    
    try {
      const success = await updateReadingStatus(book.id, newStatus);
      
      if (success) {
        setStatus(newStatus);
        Alert.alert('Successo', 'Stato di lettura aggiornato');
      } else {
        Alert.alert('Errore', 'Impossibile aggiornare lo stato di lettura.');
      }
    } catch (updateError) {
      console.error('Error updating status:', updateError);
      Alert.alert('Errore', 'Errore durante l\'aggiornamento.');
    }
  };

  const handleSaveRating = async () => {
    if (!book) return;
    
    try {
      if (tempRating > 0) {
        const success = await saveRating(book.id, tempRating, tempComment);
        if (success) {
          setRating(tempRating);
          setComment(tempComment);
          setShowRatingModal(false);
          Alert.alert('Successo', 'Valutazione salvata');
        } else {
          Alert.alert('Errore', 'Impossibile salvare la valutazione.');
        }
      }
    } catch (saveError) {
      console.error('Error saving rating:', saveError);
      Alert.alert('Errore', 'Errore durante il salvataggio.');
    }
  };

  const handleSaveNotes = async () => {
    if (!book) return;
    
    try {
      const success = await saveNotes(book.id, tempNotes);
      if (success) {
        setNotes(tempNotes);
        setShowNotesModal(false);
        Alert.alert('Successo', 'Note salvate');
      } else {
        Alert.alert('Errore', 'Impossibile salvare le note.');
      }
    } catch (saveError) {
      console.error('Error saving notes:', saveError);
      Alert.alert('Errore', 'Errore durante il salvataggio.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'to_read': return 'bookmark-outline';
      case 'reading': return 'book-outline';
      case 'completed': return 'checkmark-circle-outline';
      default: return 'bookmark-outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'to_read': return Colors.toRead;
      case 'reading': return Colors.reading;
      case 'completed': return Colors.completed;
      default: return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'to_read': return 'Da leggere';
      case 'reading': return 'In lettura';
      case 'completed': return 'Completato';
      default: return 'Da leggere';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Caricamento...</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorText}>Libro non trovato</Text>
        <TouchableOpacity style={styles.errorButton} onPress={handleBack}>
          <Text style={styles.errorButtonText}>Torna indietro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        start={[0, 0]}
        end={[1, 1]}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top }
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#f4511e" />
          </TouchableOpacity>
        </View>
        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.bookAuthor}>{book.author}</Text>
        {book.publication && <Text style={styles.pub}>Pubblicato: {book.publication}</Text>}

<View style={{ flexDirection: 'row', marginVertical: 8 }}>
  {inWishlist && (
    <Ionicons name="cart"  size={24} color="#4A90E2" style={{ marginRight: 12 }} />
  )}
  {favorite   && (
    <Ionicons name="heart" size={24} color="#f4511e" />
  )}
</View>

        {/* ——— Valutazione salvata (solo se rating > 0) ——— */}
        {rating > 0 && (
          <View style={styles.savedRatingContainer}>
            {/* Stelline */}
            <View style={styles.starsRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i}>
                <MotiView
                  from={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: rating === i ? 1.3 : 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 10, mass: 0.8, delay: i * 150 }}
                  style={{ marginHorizontal: 4 }}
                >
                  <AntDesign
                    name={i <= rating ? 'star' : 'staro'}
                    size={30}
                    color={i <= rating ? '#f5a623' : '#DDD'}
                    style={{ marginHorizontal: 4 }}
                  />
                </MotiView>
              </View>
            )}
            
            {/* Floating Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
              <Ionicons 
                name={getStatusIcon(status)} 
                size={16} 
                color="#fff" 
              />
            </View>
          </View>

          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle}>{book.title}</Text>
            <Text style={styles.bookAuthor}>{book.author}</Text>
            
            {/* Book Metadata Tags */}
            <View style={styles.metadataContainer}>
              {book.publication && (
                <View style={styles.metadataTag}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                  <Text style={styles.metadataText}>{book.publication}</Text>
                </View>
              )}
              
              {book.genres && book.genres.length > 0 && (
                <View style={styles.metadataTag}>
                  <Ionicons name="bookmark-outline" size={14} color={Colors.accent} />
                  <Text style={styles.metadataText}>
                    {Array.isArray(book.genres) 
                      ? book.genres.slice(0, 2).map(g => typeof g === 'string' ? g : g.name).join(', ')
                      : ''
                    }
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Rating Section */}
        {rating > 0 && (
          <MotiView 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.ratingSection}
          >
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <AntDesign
                  key={star}
                  name={star <= rating ? 'star' : 'staro'}
                  size={28}
                  color={star <= rating ? Colors.warning : Colors.borderLight}
                  style={{ marginHorizontal: 2 }}
                />
              ))}
            </View>
            {comment && (
              <Text style={styles.ratingComment}>&ldquo;{comment}&rdquo;</Text>
            )}
          </MotiView>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowRatingModal(true)}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.warning + '20' }]}>
                <Ionicons name="star" size={24} color={Colors.warning} />
              </View>
              <Text style={styles.actionText}>Valuta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowNotesModal(true)}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.info + '20' }]}>
                <Ionicons name="document-text" size={24} color={Colors.info} />
              </View>
              <Text style={styles.actionText}>Note</Text>
              {notes && <View style={styles.notificationDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Selection */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Stato di Lettura</Text>
          <View style={styles.statusGrid}>
            {(['to_read', 'reading', 'completed'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusCard,
                  status === s && styles.statusCardActive,
                ]}
                onPress={() => updateStatus(s)}
              >
                <View style={[
                  styles.statusIconContainer,
                  { backgroundColor: status === s ? '#fff' : getStatusColor(s) + '20' }
                ]}>
                  <Ionicons 
                    name={getStatusIcon(s)} 
                    size={24} 
                    color={status === s ? getStatusColor(s) : getStatusColor(s)} 
                  />
                </View>
                <Text style={[
                  styles.statusText,
                  status === s && styles.statusTextActive
                ]}>
                  {getStatusLabel(s)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        {book.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Descrizione</Text>
            <Text style={styles.description}>{book.description}</Text>
          </View>
        )}

        {/* Notes Preview */}
        {notes && (
          <View style={styles.notesPreviewSection}>
            <Text style={styles.sectionTitle}>Le tue note</Text>
            <View style={styles.notesPreview}>
              <Text style={styles.notesPreviewText} numberOfLines={3}>
                {notes}
              </Text>
              <TouchableOpacity onPress={() => setShowNotesModal(true)}>
                <Text style={styles.expandText}>Leggi tutto</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Valuta questo libro</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingInput}>
              <Text style={styles.inputLabel}>La tua valutazione</Text>
              <View style={styles.starsInput}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setTempRating(star)}
                  >
                    <AntDesign
                      name={star <= tempRating ? 'star' : 'staro'}
                      size={36}
                      color={star <= tempRating ? Colors.warning : Colors.borderLight}
                      style={{ marginHorizontal: 4 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.commentInput}>
              <Text style={styles.inputLabel}>Commento (opzionale)</Text>
              <TextInput
                style={styles.textInput}
                value={tempComment}
                onChangeText={setTempComment}
                placeholder="Scrivi la tua opinione..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRatingModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveRating}
              >
                <Text style={styles.saveButtonText}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNotesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Le tue note</Text>
              <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.notesInputContainer}>
              <TextInput
                style={styles.notesTextInput}
                value={tempNotes}
                onChangeText={setTempNotes}
                placeholder="Scrivi qui le tue note, pensieri o citazioni preferite..."
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNotesModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveNotes}
              >
                <Text style={styles.saveButtonText}>Salva</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  errorButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textOnPrimary,
    fontWeight: Typography.fontWeight.medium,
  },

  // Container styles
  container: { 
    flex: 1,
    backgroundColor: Colors.background
  },
  
  // Header styles
  headerGradient: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  editButton: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
  },
  backButton: {
    padding: Spacing.sm,
  },

  // Scroll content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },

  // Hero section
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  bookImageContainer: {
    position: 'relative',
    marginBottom: Spacing.xl,
  },
  bookImage: {
    width: width * 0.45,
    height: width * 0.65,
    borderRadius: BorderRadius.lg,
    ...Shadows.large,
  },
  placeholderImage: {
    width: width * 0.45,
    height: width * 0.65,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
  },
  statusBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
    ...Shadows.medium,
  },
  bookInfo: {
    alignItems: 'center',
    maxWidth: '90%',
  },
  bookTitle: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  bookAuthor: {
    fontSize: Typography.fontSize.xl,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  metadataTag: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metadataText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // Rating section
  ratingSection: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  ratingComment: {
    fontStyle: 'italic',
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: Typography.fontSize.md,
    maxWidth: '90%',
  },

  // Action section
  actionSection: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.small,
    position: 'relative',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
  },

  // Status section
  statusSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  statusCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.borderLight,
    ...Shadows.small,
  },
  statusCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
  },
  statusTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
  },

  // Description section
  descriptionSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  description: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: 24,
    textAlign: 'justify',
  },

  // Notes preview
  notesPreviewSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  notesPreview: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  notesPreviewText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  expandText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...Shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  // Rating modal
  ratingInput: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  starsInput: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  commentInput: {
    marginBottom: Spacing.xl,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Notes modal
  notesInputContainer: {
    marginBottom: Spacing.xl,
  },
  notesTextInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    minHeight: 200,
    textAlignVertical: 'top',
  },

  // Modal buttons
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surfaceVariant,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textOnPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
});
