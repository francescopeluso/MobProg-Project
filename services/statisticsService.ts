/**
 * @file src/services/statisticsService.ts
 * @description Funzioni per la generazione delle statistiche del profilo utente.
 * 
 *  In questo file definiamo le funzioni per ottenere:
 *    - statistiche generali di lettura (libri letti, in corso, da leggere)
 *    - dati per grafici mensili e progressione lettura
 *    - statistiche per generi letterari
 *    - valutazioni e rating medi
 *    - statistiche temporali e sessioni di lettura
 */

import { getDBConnection } from '../utils/database';

/** Interfaccia per le statistiche generali */
export interface ReadingStats {
  booksRead: number;
  booksReading: number;
  booksToRead: number;
  totalBooks: number;
}

/** Interfaccia per i dati del grafico mensile */
export interface MonthlyData {
  value: number;
  label: string;
  frontColor: string;
}

/** Interfaccia per i dati del grafico dei generi */
export interface GenreData {
  value: number;
  color: string;
  text: string;
  label: string;
}

/** Interfaccia per i dati di progressione settimanale */
export interface ProgressData {
  value: number;
  dataPointText: string;
  label: string;
}

/** Interfaccia per le valutazioni dei libri */
export interface BookRating {
  title: string;
  author: string;
  rating: number;
  comment: string;
  rated_at: string;
}

/** Interfaccia per le statistiche di rating */
export interface RatingStats {
  averageRating: number;
  totalRatings: number;
  ratingsDistribution: { [key: number]: number };
}

/** Interfaccia per le statistiche del tempo di lettura */
export interface TimeStats {
  totalReadingTimeMinutes: number;
  averageReadingTimeHours: number;
  readingStreak: number;
}

/**
 * 
 * @function getReadingStatistics
 * @description Restituisce le statistiche generali di lettura (libri per stato).
 * @returns {Promise<ReadingStats>} Statistiche generali di lettura
 * @async
 */
export async function getReadingStatistics(): Promise<ReadingStats> {
  const db = getDBConnection();
  
  const stats = await db.getFirstAsync(`
    SELECT 
      COUNT(CASE WHEN rs.status = 'completed' THEN 1 END) as booksRead,
      COUNT(CASE WHEN rs.status = 'reading' THEN 1 END) as booksReading,
      COUNT(CASE WHEN rs.status = 'to_read' THEN 1 END) as booksToRead,
      COUNT(*) as totalBooks
    FROM reading_status rs
  `) as any;

  return {
    booksRead: stats?.booksRead || 0,
    booksReading: stats?.booksReading || 0,
    booksToRead: stats?.booksToRead || 0,
    totalBooks: stats?.totalBooks || 0
  };
}

/**
 * 
 * @function getMonthlyReadingData
 * @description Restituisce i dati per il grafico delle letture mensili degli ultimi 6 mesi.
 * @returns {Promise<MonthlyData[]>} Array di dati per il grafico mensile
 * @async
 */
export async function getMonthlyReadingData(): Promise<MonthlyData[]> {
  const db = getDBConnection();
  
  const monthlyStats = await db.getAllAsync(`
    SELECT 
      strftime('%m', rs.end_time) as month,   -- equivale a EXTRACT(MONTH FROM rs.end_time) di psql
      strftime('%Y', rs.end_time) as year,    -- equivale a EXTRACT(YEAR FROM rs.end_time) di psql
      COUNT(*) as count
    FROM reading_status rs
    WHERE rs.status = 'completed' 
      AND rs.end_time IS NOT NULL
      AND rs.end_time >= date('now', '-6 months')
    GROUP BY strftime('%Y-%m', rs.end_time)
    ORDER BY year, month
  `) as any[];

  // Nomi dei mesi abbreviati
  const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 
                     'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  // Crea array degli ultimi 6 mesi
  const result: MonthlyData[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthNum = date.getMonth();
    const yearNum = date.getFullYear();
    
    const stat = monthlyStats.find(s => 
      parseInt(s.month) === monthNum + 1 && parseInt(s.year) === yearNum
    );
    
    result.push({
      value: stat?.count || 0,
      label: monthNames[monthNum],
      frontColor: '#4A90E2'
    });
  }

  return result;
}

/**
 * 
 * @function getYearlyReadingData
 * @description Restituisce i dati per il grafico delle letture annuali a partire dal primo anno con dati.
 * @returns {Promise<MonthlyData[]>} Array di dati per il grafico annuale
 * @async
 */
export async function getYearlyReadingData(): Promise<MonthlyData[]> {
  const db = getDBConnection();
  
  const yearlyStats = await db.getAllAsync(`
    SELECT 
      strftime('%Y', rs.end_time) as year,
      COUNT(*) as count
    FROM reading_status rs
    WHERE rs.status = 'completed' 
      AND rs.end_time IS NOT NULL
    GROUP BY strftime('%Y', rs.end_time)
    ORDER BY year
  `) as any[];

  if (yearlyStats.length === 0) return [];

  // Ottieni il primo e l'ultimo anno con dati
  const firstYear = parseInt(yearlyStats[0].year);
  const lastYear = parseInt(yearlyStats[yearlyStats.length - 1].year);
  
  // Crea array continuo dal primo all'ultimo anno
  const result: MonthlyData[] = [];
  
  for (let year = firstYear; year <= lastYear; year++) {
    const stat = yearlyStats.find(s => parseInt(s.year) === year);
    
    result.push({
      value: stat?.count || 0,
      label: year.toString(),
      frontColor: '#9F7AEA'
    });
  }

  return result;
}

/**
 * 
 * @function getGenreDistribution
 * @description Restituisce la distribuzione dei generi letterari per il grafico a torta.
 * @returns {Promise<GenreData[]>} Array di dati per il grafico dei generi
 * @async
 */
export async function getGenreDistribution(): Promise<GenreData[]> {
  const db = getDBConnection();
  
  // Prima ottieni tutti i generi senza limite
  const allGenreStats = await db.getAllAsync(`
    SELECT 
      g.name,
      COUNT(bg.book_id) as count
    FROM genres g
    JOIN book_genres bg ON g.id = bg.genre_id
    JOIN books b ON bg.book_id = b.id
    GROUP BY g.id, g.name
    ORDER BY count DESC
  `) as any[];

  if (allGenreStats.length === 0) return [];

  const colors = ['#4A90E2', '#9F7AEA', '#38B2AC', '#ED64A6', '#48BB78', '#9e9e9e'];
  const total = allGenreStats.reduce((sum, genre) => sum + genre.count, 0);
  
  let result: GenreData[] = [];
  
  if (allGenreStats.length <= 5) {
    // Se abbiamo 5 o meno generi, mostriamo tutti
    result = allGenreStats.map((genre, index) => {
      const percentage = Math.round((genre.count / total) * 100);
      return {
        value: percentage,
        color: colors[index] || '#9e9e9e',
        text: `${percentage}%`,
        label: genre.name
      };
    });
  } else {
    // Se abbiamo più di 5 generi, mostriamo i primi 4 + "Altri"
    const topGenres = allGenreStats.slice(0, 4);
    const otherGenres = allGenreStats.slice(4);
    const otherCount = otherGenres.reduce((sum, genre) => sum + genre.count, 0);
    
    // Aggiungi i primi 4 generi
    result = topGenres.map((genre, index) => {
      const percentage = Math.round((genre.count / total) * 100);
      return {
        value: percentage,
        color: colors[index],
        text: `${percentage}%`,
        label: genre.name
      };
    });
    
    // Aggiungi la categoria "Altri"
    if (otherCount > 0) {
      const otherPercentage = Math.round((otherCount / total) * 100);
      result.push({
        value: otherPercentage,
        color: colors[4], // Colore grigio per "Altri"
        text: `${otherPercentage}%`,
        label: 'Altri'
      });
    }
  }

  return result;
}

/**
 * 
 * @function getWeeklyProgressData
 * @description Restituisce i dati di progressione settimanale delle sessioni di lettura.
 * @returns {Promise<ProgressData[]>} Array di dati per il grafico di progressione
 * @async
 */
export async function getWeeklyProgressData(): Promise<ProgressData[]> {
  const db = getDBConnection();
  
  const weeklyStats = await db.getAllAsync(`
    SELECT 
      CASE strftime('%w', date(rs.start_time))
        WHEN '0' THEN 'Dom'
        WHEN '1' THEN 'Lun'
        WHEN '2' THEN 'Mar'
        WHEN '3' THEN 'Mer'
        WHEN '4' THEN 'Gio'
        WHEN '5' THEN 'Ven'
        WHEN '6' THEN 'Sab'
      END as day_name,
      strftime('%w', date(rs.start_time)) as day_number,
      COUNT(*) as sessions
    FROM reading_sessions rs
    WHERE rs.start_time >= date('now', '-7 days')
      AND rs.end_time IS NOT NULL
    GROUP BY strftime('%w', date(rs.start_time))
    ORDER BY day_number
  `) as any[];

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  
  return daysOfWeek.map(day => {
    const stat = weeklyStats.find(s => s.day_name === day);
    const value = stat?.sessions || 0;
    return {
      value,
      dataPointText: value.toString(),
      label: day
    };
  });
}

/**
 * 
 * @function getLatestBookRatings
 * @param limit Numero massimo di valutazioni da restituire (default: 5)
 * @description Restituisce le ultime valutazioni dei libri con dettagli.
 * @returns {Promise<BookRating[]>} Array delle ultime valutazioni
 * @async
 */
export async function getLatestBookRatings(limit: number = 5): Promise<BookRating[]> {
  const db = getDBConnection();
  
  const ratings = await db.getAllAsync(`
    SELECT 
      b.title,
      COALESCE(
        (SELECT GROUP_CONCAT(a.name, ', ') 
         FROM book_authors ba 
         JOIN authors a ON ba.author_id = a.id 
         WHERE ba.book_id = b.id), 
        'Autore sconosciuto'
      ) as author,
      r.rating,
      COALESCE(r.comment, '') as comment,
      r.rated_at
    FROM ratings r
    JOIN books b ON r.book_id = b.id
    ORDER BY r.rated_at DESC
    LIMIT ?
  `, [limit]) as any[];

  return ratings.map(rating => ({
    title: rating.title,
    author: rating.author,
    rating: rating.rating,
    comment: rating.comment,
    rated_at: rating.rated_at
  }));
}

/**
 * 
 * @function getRatingStatistics
 * @description Restituisce le statistiche sui rating (media, totale, distribuzione).
 * @returns {Promise<RatingStats>} Statistiche sui rating
 * @async
 */
export async function getRatingStatistics(): Promise<RatingStats> {
  const db = getDBConnection();
  
  // Media e totale
  const overallStats = await db.getFirstAsync(`
    SELECT 
      AVG(CAST(rating as FLOAT)) as avgRating,
      COUNT(*) as totalRatings
    FROM ratings
  `) as any;

  // Distribuzione per stella
  const distribution = await db.getAllAsync(`
    SELECT 
      rating,
      COUNT(*) as count
    FROM ratings
    GROUP BY rating
    ORDER BY rating
  `) as any[];

  const ratingsDistribution: { [key: number]: number } = {};
  for (let i = 1; i <= 5; i++) {
    ratingsDistribution[i] = 0;
  }
  distribution.forEach(d => {
    ratingsDistribution[d.rating] = d.count;
  });

  return {
    averageRating: parseFloat((overallStats?.avgRating || 0).toFixed(1)),
    totalRatings: overallStats?.totalRatings || 0,
    ratingsDistribution
  };
}

/**
 * 
 * @function getTotalReadingTime
 * @description Calcola il tempo totale di lettura in minuti dalle sessioni completate.
 * @returns {Promise<number>} Tempo totale di lettura in minuti
 * @async
 */
export async function getTotalReadingTime(): Promise<number> {
  const db = getDBConnection();
  
  const result = await db.getFirstAsync(`
    SELECT SUM(duration) as totalSeconds
    FROM reading_sessions
    WHERE end_time IS NOT NULL
      AND duration IS NOT NULL
  `) as any;

  const totalSeconds = result?.totalSeconds || 0;
  return Math.round(totalSeconds / 60); // Converti in minuti
}

/**
 * 
 * @function getAverageReadingTime
 * @description Calcola il tempo medio di lettura per libro completato in ore.
 * @returns {Promise<number>} Tempo medio di lettura per libro in ore
 * @async
 */
export async function getAverageReadingTime(): Promise<number> {
  const db = getDBConnection();
  
  const result = await db.getFirstAsync(`
    SELECT 
      COUNT(DISTINCT rs.book_id) as completedBooks,
      SUM(session.duration) as totalSeconds
    FROM reading_status rs
    LEFT JOIN reading_sessions session ON rs.book_id = session.book_id
    WHERE rs.status = 'completed'
      AND session.end_time IS NOT NULL
      AND session.duration IS NOT NULL
  `) as any;

  const completedBooks = result?.completedBooks || 0;
  const totalSeconds = result?.totalSeconds || 0;
  
  if (completedBooks === 0) return 0;
  
  const averageSecondsPerBook = totalSeconds / completedBooks;
  return Math.round((averageSecondsPerBook / 3600) * 10) / 10; // Converti in ore con 1 decimale
}

/**
 * 
 * @function getReadingStreak
 * @description Calcola la streak corrente di giorni consecutivi di lettura.
 * @returns {Promise<number>} Numero di giorni consecutivi di lettura
 * @async
 */
export async function getReadingStreak(): Promise<number> {
  const db = getDBConnection();
  
  // Ottieni tutti i giorni con sessioni di lettura negli ultimi 30 giorni
  const readingDays = await db.getAllAsync(`
    SELECT DISTINCT date(start_time) as reading_date
    FROM reading_sessions
    WHERE start_time >= date('now', '-30 days')
      AND end_time IS NOT NULL
    ORDER BY reading_date DESC
  `) as any[];

  if (readingDays.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  
  // Controlla se abbiamo letto oggi o ieri (per mantenere la streak)
  const latestDate = readingDays[0].reading_date;
  const daysDiff = (new Date(today).getTime() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysDiff > 1) return 0; // Streak interrotta
  
  // Calcola la streak consecutiva
  for (let i = 0; i < readingDays.length; i++) {
    const currentDate = new Date(readingDays[i].reading_date);
    const expectedDate = new Date(latestDate);
    expectedDate.setDate(expectedDate.getDate() - i);
    
    if (currentDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}




