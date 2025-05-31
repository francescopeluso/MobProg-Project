import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BookRatingCard,
  GenreChart,
  MonthlyReadingChart,
  RatingDistributionChart,
  ReadingProgressChart,
  SectionCard
} from '@/components';

import { getTabContentBottomPadding } from '@/constants/layout';
import { BorderRadius, Colors, CommonStyles, Spacing, Typography } from '@/constants/styles';
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
    timeStats,
    loading
  } = useStatistics();

  // Funzione helper per formattare il tempo di lettura
  const formatReadingTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}g ${remainingHours}h` : `${days}g`;
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
        {/* Header coerente con l'app */}
        <View style={[CommonStyles.header, { marginTop: insets.top }]}>
          <View style={CommonStyles.headerTop}>
            <TouchableOpacity 
              style={CommonStyles.iconButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={CommonStyles.title}>Statistiche</Text>
              <Text style={CommonStyles.subtitle}>La tua attività di lettura</Text>
            </View>
            <View style={{width: 40}} />
          </View>
        </View>

        {loading ? (
          <View style={CommonStyles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={CommonStyles.loadingText}>Caricamento statistiche...</Text>
          </View>
        ) : (
          <>
            {/* Statistiche principali */}
            <SectionCard title="Le tue statistiche">
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: Colors.completed + '20' }]}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.completed} />
                  </View>
                  <Text style={styles.statValue}>{readingStats.booksRead}</Text>
                  <Text style={styles.statLabel}>Libri letti</Text>
                </View>
                
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: Colors.reading + '20' }]}>
                    <Ionicons name="book" size={24} color={Colors.reading} />
                  </View>
                  <Text style={styles.statValue}>{readingStats.booksReading}</Text>
                  <Text style={styles.statLabel}>In corso</Text>
                </View>
                
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: Colors.toRead + '20' }]}>
                    <Ionicons name="bookmark" size={24} color={Colors.toRead} />
                  </View>
                  <Text style={styles.statValue}>{readingStats.booksToRead}</Text>
                  <Text style={styles.statLabel}>Da leggere</Text>
                </View>
              </View>
            </SectionCard>

            {/* Statistiche del tempo */}
            <SectionCard title="Tempo di lettura">
              <View style={styles.timeStatsGrid}>
                <View style={styles.timeStatRow}>
                  <View style={[styles.timeStatIcon, { backgroundColor: Colors.chart1 + '20' }]}>
                    <Ionicons name="hourglass" size={20} color={Colors.chart1} />
                  </View>
                  <View style={styles.timeStatContent}>
                    <Text style={styles.timeStatLabel}>Tempo totale</Text>
                    <Text style={styles.timeStatValue}>
                      {formatReadingTime(timeStats.totalReadingTimeMinutes)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.timeStatRow}>
                  <View style={[styles.timeStatIcon, { backgroundColor: Colors.chart2 + '20' }]}>
                    <Ionicons name="speedometer" size={20} color={Colors.chart2} />
                  </View>
                  <View style={styles.timeStatContent}>
                    <Text style={styles.timeStatLabel}>Media per libro</Text>
                    <Text style={styles.timeStatValue}>
                      {timeStats.averageReadingTimeHours > 0 ? `${timeStats.averageReadingTimeHours}h` : '0h'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.timeStatRow}>
                  <View style={[styles.timeStatIcon, { backgroundColor: Colors.chart3 + '20' }]}>
                    <Ionicons name="flame" size={20} color={Colors.chart3} />
                  </View>
                  <View style={styles.timeStatContent}>
                    <Text style={styles.timeStatLabel}>Streak di giorni consecutivi</Text>
                    <Text style={styles.timeStatValue}>{timeStats.readingStreak}</Text>
                  </View>
                </View>
              </View>
            </SectionCard>

            {/* Grafici di lettura */}
            <SectionCard title="Andamento letture">
              {monthlyData.length > 0 ? (
                <View style={styles.chartContainer}>
                  <MonthlyReadingChart data={monthlyData} />
                </View>
              ) : (
                <View style={CommonStyles.emptyState}>
                  <Ionicons name="bar-chart" size={48} color={Colors.textTertiary} />
                  <Text style={CommonStyles.emptyText}>Nessuna lettura completata negli ultimi 6 mesi</Text>
                </View>
              )}
            </SectionCard>

            {/* Generi e progressione settimanale */}
            <SectionCard title="La tua libreria">
              {genreData.length > 0 ? (
                <View style={styles.chartContainer}>
                  <GenreChart data={genreData} />
                </View>
              ) : (
                <View style={CommonStyles.emptyState}>
                  <Ionicons name="pie-chart" size={48} color={Colors.textTertiary} />
                  <Text style={CommonStyles.emptyText}>Nessun genere disponibile</Text>
                </View>
              )}
              
              {weeklyData.some(d => d.value > 0) && (
                <View style={[styles.chartContainer, { marginTop: Spacing.lg }]}>
                  <ReadingProgressChart data={weeklyData} />
                </View>
              )}
            </SectionCard>

            {/* Valutazioni */}
            <SectionCard title="Valutazioni">
              {ratingStats.totalRatings > 0 ? (
                <>
                  <View style={styles.ratingOverview}>
                    <View style={styles.averageRatingContainer}>
                      <Text style={styles.averageRatingValue}>
                        {ratingStats.averageRating.toFixed(1)}
                      </Text>
                      <Text style={styles.averageRatingLabel}>/ 5</Text>
                    </View>
                    <Text style={styles.averageRatingSubtext}>
                      Media di {ratingStats.totalRatings} valutazioni
                    </Text>
                  </View>
                  
                  <View style={styles.chartContainer}>
                    <RatingDistributionChart 
                      ratingsDistribution={ratingStats.ratingsDistribution}
                      totalRatings={ratingStats.totalRatings}
                    />
                  </View>
                  
                  {bookRatings.length > 0 && (
                    <View style={{ marginTop: Spacing.lg }}>
                      <Text style={styles.subsectionTitle}>
                        Ultime {bookRatings.length} valutazioni
                      </Text>
                      {bookRatings.map((book, index) => (
                        <View key={`${book.title}-${index}`} style={{ marginTop: Spacing.md }}>
                          <BookRatingCard 
                            title={book.title}
                            author={book.author}
                            rating={book.rating}
                            comment={book.comment}
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <View style={CommonStyles.emptyState}>
                  <Ionicons name="star-outline" size={48} color={Colors.textTertiary} />
                  <Text style={CommonStyles.emptyText}>Nessuna valutazione disponibile</Text>
                  <Text style={styles.emptySubtext}>Inizia a valutare i tuoi libri</Text>
                </View>
              )}
            </SectionCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header personalizzato
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  // Statistiche principali - grid uniforme
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
  },

  // Statistiche del tempo - lista verticale
  timeStatsGrid: {
    marginTop: Spacing.md,
  },
  timeStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  timeStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  timeStatContent: {
    flex: 1,
  },
  timeStatLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  timeStatValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  // Container per grafici - ottimizzato per scroll
  chartContainer: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.md,
    overflow: 'hidden', // Previene overflow dal container
  },

  // Sezione valutazioni
  ratingOverview: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  averageRatingContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  averageRatingValue: {
    fontSize: Typography.fontSize.huge + 8,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.warning,
  },
  averageRatingLabel: {
    fontSize: Typography.fontSize.xl,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  averageRatingSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Sottosezioni
  subsectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Stili per stati vuoti
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
});
