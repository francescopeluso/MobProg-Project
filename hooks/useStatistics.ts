/**
 * @file hooks/useStatistics.ts
 * @description Hook personalizzato per gestire le statistiche del profilo
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

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
  const [genreData, setGenreData] = useState<GenreData[]>([]);
  const [weeklyData, setWeeklyData] = useState<ProgressData[]>([]);
  const [bookRatings, setBookRatings] = useState<BookRating[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats>({
    averageRating: 0,
    totalRatings: 0,
    ratingsDistribution: {}
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
    genreData,
    weeklyData,
    bookRatings,
    ratingStats,
    loading,
    loadStatistics
  };
};
