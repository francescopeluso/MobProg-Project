import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BookRatingCard,
  GenreChart,
  MonthlyReadingChart,
  ReadingProgressChart,
  SectionCard,
  StatBox
} from '@/components';

import { getTabContentBottomPadding } from '@/constants/layout';
import { Colors, CommonStyles, Typography } from '@/constants/styles';
import { useStatistics } from '@/hooks/useStatistics';

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();
  
  // Utilizziamo il hook personalizzato per le statistiche
  const {
    readingStats,
    monthlyData,
    genreData,
    weeklyData,
    bookRatings,
    ratingStats,
    loading
  } = useStatistics();

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
      >
        {/* Header */}
        <View style={[CommonStyles.header, { marginTop: insets.top }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={CommonStyles.iconButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={CommonStyles.title}>Statistiche</Text>
            <View style={{width: 24}} />
          </View>
        </View>

        {loading ? (
          <View style={CommonStyles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.secondary} />
            <Text style={CommonStyles.loadingText}>Caricamento statistiche...</Text>
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
                <Text style={CommonStyles.emptyText}>Nessuna lettura completata negli ultimi 6 mesi</Text>
              )}
            </SectionCard>

            {/* Statistiche libreria */}
            <SectionCard title="La tua libreria">
              {genreData.length > 0 ? (
                <GenreChart data={genreData} />
              ) : (
                <Text style={CommonStyles.emptyText}>Nessun genere disponibile</Text>
              )}
              
              {weeklyData.some(d => d.value > 0) ? (
                <ReadingProgressChart data={weeklyData} />
              ) : (
                <Text style={CommonStyles.emptyText}>Nessuna sessione di lettura questa settimana</Text>
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
                <Text style={CommonStyles.emptyText}>Nessuna valutazione disponibile</Text>
              )}
            </SectionCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
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
    fontSize: Typography.fontSize.huge + 8,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.secondary,
  },
  ratingLabel: {
    fontSize: Typography.fontSize.xl,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  ratingsGrid: {
    marginTop: 10,
  },
  chartTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
