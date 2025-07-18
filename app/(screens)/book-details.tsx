import { AntDesign, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Keyboard,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
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
  const [favorite, setFavorite] = useState(false);

  // Stati per le raccomandazioni
  const [authorRecommendations, setAuthorRecommendations] = useState<Book[]>([]);
  const [genreRecommendations, setGenreRecommendations] = useState<Book[]>([]);
  const [similarRecommendations, setSimilarRecommendations] = useState<Book[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // Stati per il modal dei dettagli delle raccomandazioni
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Book | null>(null);
  const forMeIsLongAt = 200; // Costante per la lunghezza del preview delle note
  const isNotesLong = notes.length > forMeIsLongAt;
  const previewNotes = isNotesLong ? notes.substring(0,forMeIsLongAt) + '[...]' : notes; 
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
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const success = await updateReadingStatus(book.id, newStatus);
      
      if (success) {
        setStatus(newStatus);
        // Alert removed: no more "Successo" message
      } else {
        Alert.alert('Errore', 'Impossibile aggiornare lo stato di lettura.');
      }
    } catch (updateError) {
      console.error('Error updating status:', updateError);
      Alert.alert('Errore', 'Errore durante l\'aggiornamento.');
    }
  };

  const handleSaveRating: () => Promise<void> = async () => {
    if (!book) return;
    
    try {
      if (tempRating > 0) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleEditPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/add-book?id=${book?.id}`);
  };

  const handleStarPress = async (star: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempRating(star);
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
        {/* Header */}
              <View style={[styles.header, {paddingTop: insets.top}]}>
                <View style={styles.headerRow}></View>
                <View style={styles.headerRow}>
                  <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color="#4A90E2" />
                  </TouchableOpacity>
                  <Text style={styles.title}>Dettagli Libro</Text>
                  <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
                    <Ionicons name="create-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
        {/* Sezione Principale*/}
        <View style={[styles.heroSection, {alignItems: 'center'}, {marginTop: 135}]}>
          {/* Copertina */}
          <View style={styles.bookImageContainer}>
            {book.cover_url ? (
              <Image source={{ uri: book.cover_url }} style={styles.bookImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="book" size={48} color={Colors.textSecondary} />
              </View>
            )}  
            {/* Floating Favorite */}
            {favorite && (
              <View style={[styles.statusBadge, { backgroundColor: Colors.accent }]}>
                <Ionicons name="heart" size={24} color="#fff" style={{ margin: 13}}  />
              </View>
            )}
          </View> 
          {/*Fine tag copertina*/}

          {/* Info del Libro */}
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
                  <Ionicons name="heart" size={14} color={Colors.accent} />
                  <Text style={[styles.metadataText, {color: Colors.accent} ]}>
                    {Array.isArray(book.genres) 
                      ? book.genres.map(g => typeof g === 'string' ? g : g.name).join(', ')
                      : ''
                    }
                  </Text>
                </View>
              )}
            </View> 
        
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
            
            {/* Contenitore Stati */}
            <View style={[{width: '97%'}]}>
              {/* Stati */}
              <View style={[styles.innerSection, {paddingHorizontal: Spacing.md}]}>
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
                      <View style={[styles.statusIconContainer, { backgroundColor: status === s ? '#fff' : getStatusColor(s) + '20' }]}>
                        <Ionicons 
                          name={getStatusIcon(s)} 
                          size={24} 
                          color={status === s ? getStatusColor(s) : getStatusColor(s)} 
                        />
                      </View>
                      <Text 
                        style={[styles.statusText, status === s && styles.statusTextActive]} 
                        numberOfLines={1} 
                        adjustsFontSizeToFit
                      >
                        {getStatusLabel(s)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Description */}
              {book.description && (
                <View style={styles.innerSection}>
                  <Text style={styles.sectionTitle}>Descrizione</Text>
                  <ScrollView 
                    style={styles.descriptionScrollContainer}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    <Text style={styles.description}>{book.description}</Text>
                  </ScrollView>
                </View>
              )}

              {/* Note */}
              {notes.length > 0 && (
                <View style={styles.innerSection}>
                  <Text style={styles.sectionTitle}>Le tue note</Text>
                  <Text style={styles.description}>{previewNotes}</Text>
                  {isNotesLong && (
                    <TouchableOpacity onPress={() => setShowNotesModal(true)}>
                      <Text style={styles.expandText}>Leggi tutto</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Recommendations Section */}
        <View style={[styles.heroSection, {marginTop: Spacing.xl}]}>
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

      </ScrollView>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRatingModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
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
                      onPress={() => handleStarPress(star)}
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
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  blurOnSubmit={true}
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
        </TouchableWithoutFeedback>
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

            <ScrollView 
              style={styles.notesScrollContainer}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  editButton: {
      flexDirection: 'row',
      backgroundColor: '#4A90E2',
      paddingTop: 6,
      paddingBottom: 9, 
      paddingRight: 10,
      paddingLeft: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center', 
      marginTop: 8,
      alignSelf: 'center',
  },
  backButton: {
    padding: Spacing.sm,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    zIndex: 10,
    elevation: 10, // For Android
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
      fontWeight: 'bold',
      color: '#333',
      fontSize: 15,
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
    backgroundColor: '#fff', 
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg, 
    marginHorizontal: Spacing.md, 
    ...Shadows.large,
  },
  bookImageContainer: {
    position: 'relative',
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },

  bookImage: {
    width: 130,
    height: 200,
    borderRadius: BorderRadius.lg,
    ...Shadows.large,
    overflow: 'hidden',   
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
    ...Shadows.large,
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
  innerSection: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
    width: '100%',
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center', 
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
  description: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: 24,
    textAlign: 'justify',
  },
  descriptionScrollContainer: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
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
  notesScrollContainer: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
    marginBottom: Spacing.xl,
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
