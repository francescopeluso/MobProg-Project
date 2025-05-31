/**
 * @file hooks/useStatistics.ts
 * @description Hook personalizzato per gestire le statistiche del profilo
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import {
    getAverageReadingTime,
    getGenreDistribution,
    getLatestBookRatings,
    getMonthlyReadingData,
    getRatingStatistics,
    getReadingStatistics,
    getReadingStreak,
    getTotalReadingTime,
    getWeeklyProgressData,
    getYearlyReadingData,
    type BookRating,
    type GenreData,
    type MonthlyData,
    type ProgressData,
    type RatingStats,
    type ReadingStats,
    type TimeStats
} from '@/services/statisticsService';

/**
 * Hook personalizzato per la gestione delle statistiche del profilo
 * @returns Oggetto con dati delle statistiche e funzioni di controllo
 */
export const useStatistics = () => {
  // Stati per i dati delle statistiche
  const [readingStats, setReadingStats] = useState<ReadingStats>({
    booksRead: 0,
    booksReading: 0,
    booksToRead: 0,
    totalBooks: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [yearlyData, setYearlyData] = useState<MonthlyData[]>([]);
  const [genreData, setGenreData] = useState<GenreData[]>([]);
  const [weeklyData, setWeeklyData] = useState<ProgressData[]>([]);
  const [bookRatings, setBookRatings] = useState<BookRating[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats>({
    averageRating: 0,
    totalRatings: 0,
    ratingsDistribution: {}
  });
  const [timeStats, setTimeStats] = useState<TimeStats>({
    totalReadingTimeMinutes: 0,
    averageReadingTimeHours: 0,
    readingStreak: 0
  });

  // Stati di caricamento
  const [loading, setLoading] = useState(true);

  /**
   * Carica tutti i dati delle statistiche
   */
  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true);
      
      const [
        stats,
        monthly,
        yearly,
        genres,
        weekly,
        ratings,
        ratingStatsData,
        totalTime,
        avgTime,
        streak
      ] = await Promise.all([
        getReadingStatistics(),
        getMonthlyReadingData(),
        getYearlyReadingData(),
        getGenreDistribution(),
        getWeeklyProgressData(),
        getLatestBookRatings(),
        getRatingStatistics(),
        getTotalReadingTime(),
        getAverageReadingTime(),
        getReadingStreak()
      ]);

      setReadingStats(stats);
      setMonthlyData(monthly);
      setYearlyData(yearly);
      setGenreData(genres);
      setWeeklyData(weekly);
      setBookRatings(ratings);
      setRatingStats(ratingStatsData);
      setTimeStats({
        totalReadingTimeMinutes: totalTime,
        averageReadingTimeHours: avgTime,
        readingStreak: streak
      });
    } catch (error) {
      console.error('Errore nel caricamento delle statistiche:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carica i dati al primo mount
  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  // Ricarica i dati ogni volta che la schermata ottiene il focus
  useFocusEffect(
    useCallback(() => {
      loadStatistics();
    }, [loadStatistics])
  );

  return {
    readingStats,
    monthlyData,
    yearlyData,
    genreData,
    weeklyData,
    bookRatings,
    ratingStats,
    timeStats,
    loading,
    loadStatistics
  };
};
