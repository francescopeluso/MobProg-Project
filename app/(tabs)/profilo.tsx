import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BookRatingCard,
  GenreChart,
  MonthlyReadingChart,
  ReadingProgressChart,
  SectionCard,
  StatBox
} from '@/components';

import {
  getGenreDistribution,
  getLatestBookRatings,
  getMonthlyReadingData,
  getRatingStatistics,
  getReadingStatistics,
  getWeeklyProgressData,
  type BookRating,
  type GenreData,
  type MonthlyData,
  type ProgressData,
  type RatingStats,
  type ReadingStats
} from '@/services/statisticsService';

export default function ProfiloScreen() {
  const insets = useSafeAreaInsets();
  
  // Stati per i dati delle statistiche
  const [readingStats, setReadingStats] = useState<ReadingStats>({
    booksRead: 0,
    booksReading: 0,
    booksToRead: 0,
    totalBooks: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [genreData, setGenreData] = useState<GenreData[]>([]);
  const [weeklyData, setWeeklyData] = useState<ProgressData[]>([]);
  const [bookRatings, setBookRatings] = useState<BookRating[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats>({
    averageRating: 0,
    totalRatings: 0,
    ratingsDistribution: {}
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Carica tutti i dati delle statistiche
  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      const [
        stats,
        monthly,
        genres,
        weekly,
        ratings,
        ratingStatsData
      ] = await Promise.all([
        getReadingStatistics(),
        getMonthlyReadingData(),
        getGenreDistribution(),
        getWeeklyProgressData(),
        getLatestBookRatings(),
        getRatingStatistics()
      ]);

      setReadingStats(stats);
      setMonthlyData(monthly);
      setGenreData(genres);
      setWeeklyData(weekly);
      setBookRatings(ratings);
      setRatingStats(ratingStatsData);
    } catch (error) {
      console.error('Errore nel caricamento delle statistiche:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gestisce il refresh pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={[
          styles.contentContainer,
          {
            // Applica padding sui lati ma non in alto
            paddingTop: 0,
            paddingBottom: 16 + insets.bottom
          }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#f4511e']}
            tintColor="#f4511e"
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { marginTop: insets.top }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Profilo</Text>
              <Text style={styles.subtitle}>Traccia le tue attività di lettura</Text>
            </View>
            <TouchableOpacity 
              style={styles.settingsButton} 
              onPress={() => router.push('/(screens)/settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#f4511e" />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f4511e" />
            <Text style={styles.loadingText}>Caricamento statistiche...</Text>
          </View>
        ) : (
          <>
            {/* Statistiche di lettura */}
            <SectionCard title="Le tue statistiche">
              <View style={styles.statsRow}>
                <StatBox value={readingStats.booksRead} label="Libri letti" />
                <StatBox value={readingStats.booksReading} label="In corso" />
                <StatBox value={readingStats.booksToRead} label="Da leggere" />
              </View>
              
              {monthlyData.length > 0 ? (
                <MonthlyReadingChart data={monthlyData} />
              ) : (
                <Text style={styles.noDataText}>Nessuna lettura completata negli ultimi 6 mesi</Text>
              )}
            </SectionCard>

            {/* Statistiche libreria */}
            <SectionCard title="La tua libreria">
              {genreData.length > 0 ? (
                <GenreChart data={genreData} />
              ) : (
                <Text style={styles.noDataText}>Nessun genere disponibile</Text>
              )}
              
              {weeklyData.some(d => d.value > 0) ? (
                <ReadingProgressChart data={weeklyData} />
              ) : (
                <Text style={styles.noDataText}>Nessuna sessione di lettura questa settimana</Text>
              )}
            </SectionCard>

            {/* Valutazioni */}
            <SectionCard title="Valutazioni">
              {ratingStats.totalRatings > 0 ? (
                <>
                  <View style={styles.ratingBox}>
                    <Text style={styles.ratingValue}>
                      {ratingStats.averageRating.toFixed(1)}
                    </Text>
                    <Text style={styles.ratingLabel}>/ 5</Text>
                  </View>
                  
                  <Text style={styles.chartTitle}>
                    {bookRatings.length > 0 ? `Ultime ${bookRatings.length} valutazioni` : 'Nessuna valutazione recente'}
                  </Text>
                  {bookRatings.length > 0 && (
                    <View style={styles.ratingsGrid}>
                      {bookRatings.map((book, index) => (
                        <BookRatingCard 
                          key={`${book.title}-${index}`}
                          title={book.title}
                          author={book.author}
                          rating={book.rating}
                          comment={book.comment}
                        />
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.noDataText}>Nessuna valutazione disponibile</Text>
              )}
            </SectionCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  settingsButton: {
    padding: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  ratingValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f4511e',
  },
  ratingLabel: {
    fontSize: 20,
    color: '#555',
    marginLeft: 4,
  },
  ratingsGrid: {
    marginTop: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    color: '#555',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
