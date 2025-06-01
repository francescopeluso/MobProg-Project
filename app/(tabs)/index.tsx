import { getTabContentBottomPadding } from '@/constants/layout';
import { Colors, CommonStyles } from '@/constants/styles';
import { createTables, getDBConnection } from '@/utils/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionCard } from '../../components';
import BookCarousel from '../../components/BookCarousel';
import RecommendationCarousel from '../../components/RecommendationCarousel';
import RecommendationDetailModal from '../../components/RecommendationDetailModal';
import SearchModal from '../../components/SearchModal';
import SessionButton from '../../components/SessionButton';
import { Book, getBooksByStatus } from '../../services/bookApi';
import { getPersonalizedWishlistRecommendations } from '../../services/recommendationApi';

// Import per i suggerimenti al primo avvio
import type { RecommendedBook } from '@/services/onboardingService';
import { useFirstLaunchRecommendations } from '../../hooks/useFirstLaunchRecommendations';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const [dbReady, setDbReady] = useState(false);
  const [toRead, setToRead] = useState<Book[]>([]);
  const [reading, setReading] = useState<Book[]>([]);
  const [completed, setCompleted] = useState<Book[]>([]);
  const [wishlistRecommendations, setWishlistRecommendations] = useState<Book[]>([]);
  const [loadingWishlistRecommendations, setLoadingWishlistRecommendations] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Book | null>(null);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  /* Questo hook legge da AsyncStorage i "first launch recommendations" */
  const { recommendations: firstLaunchRecs, isLoading: loadingFirstLaunch } = useFirstLaunchRecommendations();

  /* Init DB una volta */
  useEffect(() => {
    const dbSync = getDBConnection();
    createTables(dbSync).then(() => setDbReady(true));
  }, []);

  /* Fetch liste ogni volta che lo screen torna in focus */
  const fetchLists = useCallback(async () => {
    const toReadBooks = await getBooksByStatus('to_read');
    const readingBooks = await getBooksByStatus('reading');
    const completedBooks = await getBooksByStatus('completed');

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setToRead(toReadBooks);
    setReading(readingBooks);
    setCompleted(completedBooks);
  }, []);

  /* Fetch delle raccomandazioni "wishlist" (personalizzate) */
  const fetchWishlistRecommendations = useCallback(async () => {
    try {
      setLoadingWishlistRecommendations(true);
      const recommendations = await getPersonalizedWishlistRecommendations();
      setWishlistRecommendations(recommendations);
    } catch (error) {
      console.error('Errore nel caricamento delle raccomandazioni wishlist:', error);
      setWishlistRecommendations([]);
    } finally {
      setLoadingWishlistRecommendations(false);
    }
  }, []);

  const handleRecommendationPress = (recommendedBook: Book) => {
    if (recommendedBook.id) {
      // Il libro è già nel database, naviga ai dettagli
      router.push(`/book-details?id=${recommendedBook.id}`);
    } else {
      // Mostra il modal per i dettagli del libro (non ancora nel DB)
      setSelectedRecommendation(recommendedBook);
      setShowRecommendationModal(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (dbReady && !loadingFirstLaunch) {
        fetchLists();
        // Se non ci sono first-launch-recs, facciamo partire quelle "wishlist"
        if (!firstLaunchRecs) {
          fetchWishlistRecommendations();
        }
      }
    }, [dbReady, loadingFirstLaunch, fetchLists, fetchWishlistRecommendations, firstLaunchRecs])
  );

  if (!dbReady || loadingFirstLaunch) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>
          {loadingFirstLaunch ? 'Preparando i tuoi consigli...' : 'Caricamento...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={CommonStyles.container}>
      <ScrollView
        contentContainerStyle={[
          CommonStyles.contentContainer,
          {
            paddingTop: 0,
            paddingBottom: getTabContentBottomPadding(insets.bottom),
          },
        ]}
        scrollIndicatorInsets={{ right: 1 }}
      >
        {/* Header */}
        <View style={[CommonStyles.header, { marginTop: insets.top }]}>
          <View style={CommonStyles.headerTop}>
            <View>
              <Text style={CommonStyles.title}>La tua libreria</Text>
              <Text style={CommonStyles.subtitle}>Scopri i tuoi libri</Text>
            </View>
            <View style={CommonStyles.headerActions}>
              <TouchableOpacity
                style={CommonStyles.iconButton}
                onPress={() => setShowSearch(true)}
              >
                <Ionicons name="search-outline" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <SessionButton variant="compact" />
            </View>
          </View>
        </View>

        {/* Raccomandazioni primo avvio - solo se la libreria è vuota */}
        {firstLaunchRecs && 
         firstLaunchRecs.length > 0 && 
         toRead.length === 0 && 
         reading.length === 0 && 
         completed.length === 0 && (
          <SectionCard title="Consigliati per te">
            <RecommendationCarousel
              books={firstLaunchRecs.map((rb: RecommendedBook) => ({
                // Converto RecommendedBook in Book per il carousel
                id: undefined, // Questi libri non sono ancora nel database
                title: rb.title,
                authors: [rb.authors],
                cover_url: rb.thumbnail,
                description: rb.description,
                editor: rb.editor,
                publication: rb.publication,
                isbn10: rb.isbn10,
                isbn13: rb.isbn13,
                language: rb.language,
                genres: rb.genres,
              }))}
              onPress={(b) => handleRecommendationPress(b)}
            />
          </SectionCard>
        )}

        {/* Sezione "In lettura" */}
        <SectionCard title="In lettura">
          {reading.length > 0 ? (
            <BookCarousel
              books={reading}
              onPress={(id) => router.push({ pathname: '/book-details', params: { id } })}
            />
          ) : (
            <Text style={styles.emptyText}>Nessun libro in lettura</Text>
          )}
        </SectionCard>

        {/* Sezione "Da leggere" */}
        <SectionCard title="Da leggere">
          {toRead.length > 0 ? (
            <BookCarousel
              books={toRead}
              onPress={(id) => router.push({ pathname: '/book-details', params: { id } })}
            />
          ) : (
            <Text style={styles.emptyText}>Nessun libro da leggere</Text>
          )}
        </SectionCard>

        {/* Sezione "Completati" */}
        <SectionCard title="Completati">
          {completed.length > 0 ? (
            <BookCarousel
              books={completed}
              onPress={(id) => router.push({ pathname: '/book-details', params: { id } })}
            />
          ) : (
            <Text style={styles.emptyText}>Nessun libro completato</Text>
          )}
        </SectionCard>

        {/* Consigli personalizzati - quando non ci sono raccomandazioni primo avvio o la libreria non è vuota */}
        {((!firstLaunchRecs || firstLaunchRecs.length === 0) || 
          (toRead.length > 0 || reading.length > 0 || completed.length > 0)) && (
          <SectionCard title="Consigli personalizzati per te">
            {loadingWishlistRecommendations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>
                  Caricamento consigli personalizzati...
                </Text>
              </View>
            ) : wishlistRecommendations.length > 0 ? (
              <RecommendationCarousel
                books={wishlistRecommendations}
                onPress={handleRecommendationPress}
              />
            ) : (
              <Text style={styles.emptyText}>
                Aggiungi più libri alla tua libreria per ricevere consigli personalizzati
              </Text>
            )}
          </SectionCard>
        )}
      </ScrollView>

      {/* Modale di ricerca */}
      <Modal visible={showSearch} animationType="slide" onRequestClose={() => setShowSearch(false)}>
        <SearchModal
          mode="local"
          onSelectLocal={(b) => {
            setShowSearch(false);
            router.push(`/book-details?id=${b.id}`);
          }}
          onClose={() => setShowSearch(false)}
        />
      </Modal>

      {/* Modale dettagli raccomandazione */}
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

// Stili componente
const styles = StyleSheet.create({
  emptyText: {
    textAlign: 'center',
    color: '#888',
    padding: 16,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
