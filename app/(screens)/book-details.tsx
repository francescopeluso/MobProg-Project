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
import RecommendationCarousel from '../../components/RecommendationCarousel';
import RecommendationDetailModal from '../../components/RecommendationDetailModal';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../../constants/styles';
import { Book, getBookById, saveRating, updateReadingStatus } from '../../services/bookApi';
import { getAuthorRecommendations, getGenreRecommendations, getSimilarBookRecommendations } from '../../services/recommendationApi';

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
  const insets = useSafeAreaInsets();
  const [inWishlist, setInWishlist] = useState(false);
  const [favorite, setFavorite]     = useState(false);

  // Stati per le raccomandazioni
  const [authorRecommendations, setAuthorRecommendations] = useState<Book[]>([]);
  const [genreRecommendations, setGenreRecommendations] = useState<Book[]>([]);
  const [similarRecommendations, setSimilarRecommendations] = useState<Book[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // Stati per il modal dei dettagli delle raccomandazioni
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Book | null>(null);
  const isNotesLong = notes.length > 200; 
  const previewNotes = isNotesLong ? notes.substring(0,200) + '[...]' : notes; 
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
      }
    } catch (loadError) {
      console.error('Error loading book:', loadError);
      Alert.alert('Errore', 'Impossibile caricare i dettagli del libro.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Funzione per caricare le raccomandazioni
  const loadRecommendations = useCallback(async () => {
    if (!book) return;
    
    try {
      setLoadingRecommendations(true);
      
      // Carica raccomandazioni dello stesso autore
      if (book.author) {
        const authorRecs = await getAuthorRecommendations(book.author);
        setAuthorRecommendations(authorRecs.slice(0, 10));
      }
      
      // Carica raccomandazioni per genere
      if (book.genres && book.genres.length > 0) {
        const firstGenre = Array.isArray(book.genres) 
          ? (typeof book.genres[0] === 'string' ? book.genres[0] : book.genres[0].name)
          : book.genres;
        if (firstGenre) {
          const genreRecs = await getGenreRecommendations(firstGenre);
          setGenreRecommendations(genreRecs.slice(0, 10));
        }
      }
      
      // Carica libri simili
      if (book.title) {
        const similarRecs = await getSimilarBookRecommendations(book.title);
        setSimilarRecommendations(similarRecs.slice(0, 10));
      }
      
    } catch (error) {
      console.error('Errore nel caricamento delle raccomandazioni:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  }, [book]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  useEffect(() => {
    if (book) {
      loadRecommendations();
    }
  }, [book, loadRecommendations]);

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

  const handleBack = () => {
    router.back();
  };

  const handleRecommendationPress = (recommendedBook: Book) => {
    if (recommendedBook.id) {
      // Il libro è già nel database, naviga ai suoi dettagli
      router.push(`/book-details?id=${recommendedBook.id}`);
    } else {
      // Il libro non è nel database, mostra i dettagli nel modal
      setSelectedRecommendation(recommendedBook);
      setShowRecommendationModal(true);
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header with gradient background */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={[0, 0]}
          end={[1, 1]}
          style={[styles.headerGradient, { paddingTop: insets.top }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.editButton} onPress={() => router.push(`/add-book?id=${book.id}`)}>
              <Ionicons name="create-outline" size={24} color="#4A90E2" />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.heroSection, {backgroundColor: '#fff'}]}>
            <View style={styles.bookImageContainer}>
              {book.cover_url ? (
                <Image source={{ uri: book.cover_url }} style={styles.bookImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="book" size={48} color={Colors.textSecondary} />
                </View>
              )}
              
              {/* Floating Favorite or Wishlist */}
              {inWishlist && (
                <View style={[styles.statusBadge, { backgroundColor:'#79E18F' }]}>
                  <Ionicons name="cart" size={24} color="#fff" style={{ margin: 13, marginLeft: 12, marginRight: 15 }} />
                </View>
              )}
              {favorite && (
                <View style={[styles.statusBadge, { backgroundColor: '#FFA0CC' }]}>
                  <Ionicons name="heart" size={24} color="#fff" style={{ margin: 13}}  />
                </View>
              )}
            </View>

            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookAuthor}>{book.author}</Text>
              
              {/* Book Metadata Tags */}
                <View style={styles.metadataContainer}>
                {book.publication && (
                  <View style={styles.metadataTag}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                    <Text style={[styles.metadataText, {color: Colors.primary}]}>{book.publication}</Text>
                  </View>
                )}
                
                {book.genres && book.genres.length > 0 && (
                  <View style={styles.metadataTag}>
                    <Ionicons name="bookmark-outline" size={14} color={Colors.accent} />
                    <Text style={[styles.metadataText, {color: Colors.accent} ]}>
                      {Array.isArray(book.genres) 
                        ? book.genres.map(g => typeof g === 'string' ? g : g.name).join(', ')
                        : ''
                      }
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>
        
        {/* Rating Section */}
        {rating > 0 && (
        <View style={styles.savedRatingContainer}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star, i) => (
              <MotiView
                key={star}
                from={{
                  opacity: 0,
                  translateX: -20,   // parte da sinistra
                  scale: 0.5,        // parte piccola
                }}
                animate={{
                  opacity: 1,
                  translateX: 0,
                  scale: star === rating ? 1.3 : 1,  // ingrandisci solo quella selezionata
                }}
                transition={{
                  type: 'spring',
                  damping: 8,
                  mass: 0.5,
                  delay: i * 100,    // sposta l’inizio di 100ms per ogni stella
                }}
                style={{ marginHorizontal: 4 }}     // spacing tra le stelle
              >
                <AntDesign
                  name={star <= rating ? 'star' : 'staro'}
                  size={32}
                  color={star <= rating ? '#f5a623' : '#DDD'}
                />
              </MotiView>
            ))}
          </View>
          {comment.length > 0 && (
            <Text style={styles.savedComment}>&ldquo;{comment}&rdquo;</Text>
          )}
        </View>
        )}

        <View style={[{width: '97%'}]}>
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

        {/* Note */}
        {notes.length > 0 && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Le tue note</Text>

            {/* Anteprima a 200 caratteri */}
            <Text style={styles.description}>
              {previewNotes}
            </Text>

            {/* “Leggi tutto” se veramente ci sono più di 200 caratteri */}
            {isNotesLong && (
              <TouchableOpacity onPress={() => setShowNotesModal(true)}>
                <Text style={styles.expandText}>Leggi tutto</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Recommendations Section */}
        {loadingRecommendations && (
          <View style={styles.recommendationsLoading}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingRecommendationsText}>Caricamento raccomandazioni...</Text>
          </View>
        )}

        {/* Author Recommendations */}
        {!loadingRecommendations && authorRecommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>Altri libri di {book.author}</Text>
            <RecommendationCarousel 
              books={authorRecommendations}
              onPress={handleRecommendationPress}
            />
          </View>
        )}

        {/* Genre Recommendations */}
        {!loadingRecommendations && genreRecommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>
              Libri simili per genere
              {book.genres && book.genres.length > 0 && (
                <Text style={styles.genreSubtitle}> ({Array.isArray(book.genres) 
                  ? (typeof book.genres[0] === 'string' ? book.genres[0] : book.genres[0].name)
                  : book.genres})</Text>
              )}
            </Text>
            <RecommendationCarousel 
              books={genreRecommendations}
              onPress={handleRecommendationPress}
            />
          </View>
        )}

        {/* Similar Books Recommendations */}
        {!loadingRecommendations && similarRecommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>Libri simili a &ldquo;{book.title}&rdquo;</Text>
            <RecommendationCarousel 
              books={similarRecommendations}
              onPress={handleRecommendationPress}
            />
          </View>
        )}

        {/* No recommendations message */}
        {!loadingRecommendations && 
         authorRecommendations.length === 0 && 
         genreRecommendations.length === 0 && 
         similarRecommendations.length === 0 && (
          <View style={styles.noRecommendationsContainer}>
            <Ionicons name="bulb-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.noRecommendationsText}>
              Non siamo riusciti a trovare raccomandazioni per questo libro al momento.
            </Text>
          </View>
        )}

          </View>

          
        </View>
      </LinearGradient>
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
              <Text style={styles.modalTitle}>Note</Text>
              <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notesReadContainer}>
              <Text style={styles.notesReadText}>{notes}</Text>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.primaryButton, {flex: 1}]}
                onPress={() => setShowNotesModal(false)}
              >
                <Text style={styles.primaryButtonText}>Chiudi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Recommendation Detail Modal */}
      <RecommendationDetailModal
        visible={showRecommendationModal}
        book={selectedRecommendation}
        onClose={() => {
          setShowRecommendationModal(false);
          setSelectedRecommendation(null);
        }}
      />
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
    backgroundColor: Colors.background, 
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
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxl, 
  },
  editButton: {
      flexDirection: 'row',
      backgroundColor: '#fff',
      paddingTop: 8,
      paddingBottom: 11,
      paddingRight: 10,
      paddingLeft: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center', 
      marginTop: 10,
      alignSelf: 'center',
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
    borderRadius: BorderRadius.lg, 
    ...Shadows.large,
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
    top: -10,
    right: -10,
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
    marginBottom: Spacing.xl,
  },
  metadataTag: {
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0EFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metadataText: {
    fontSize: Typography.fontSize.sm,
  },

  // Rating section
  savedRatingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  savedComment: {
    fontStyle: 'italic',
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
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
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'left', 
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: '3%',  
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingHorizontal: Spacing.xs, 
    alignItems: 'center',
    width: '33%', 
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

  // Description and notes section
  descriptionSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    width: '100%', 
  },
  description: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: 24,
    textAlign: 'justify',
  },

  expandText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing.md, 
  },

  // Recommendations styles
  recommendationsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  loadingRecommendationsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  recommendationsSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  genreSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing.md, 
  },

  noRecommendationsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  noRecommendationsText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 22,
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
  notesReadContainer: {
    marginBottom: Spacing.xl,
    maxHeight: 400,
  },
  notesReadText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: 24,
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
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textOnPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
});
