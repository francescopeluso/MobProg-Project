/**
 * @file src/services/bookApi.ts
 * @description Funzioni per la gestione dei libri, sia remoti che locali.
 * 
 *  In questo file definiamo le funzioni per effettuare:
 *    - ricerca di libri remoti (Google Books e Open Library)
 *    - ricerca di libri locali (SQLite)
 *    - operazioni CRUD su libri locali
 */

import { getDBConnection } from '../utils/database';
export interface Book {
  id?: number;                // facoltativo, nel fetch non ci serve poichè viene generato dal DB sull'insert
  title: string;
  description?: string;
  cover_url?: string;        // Standardizing on cover_url as per database schema
  editor?: string;
  publication?: number;
  published?: number;        // Added from RemoteBook for compatibility
  isbn10?: string;
  isbn13?: string;
  created_at?: string;
  authors?: Author[] | string[]; // Can be either Author[] for DB or string[] for remote books
  genres?: Genre[] | string[];  // Can be either Genre[] for DB or string[] for remote
  language?: string;
  reading_status?: ReadingStatus;
  notes?: string;
  rating?: Rating;
  is_favorite?: boolean;
  is_in_wishlist?: boolean;
  
  // Fields from RemoteBook
  externalId?: string;
  source?: 'google' | 'openlibrary' | 'manual';
}

export interface Author {
  id?: number;
  name: string;
  created_at?: string;
}

export interface Genre {
  id?: number;
  name: string;
  description?: string;
  created_at?: string;
}

export interface ReadingStatus {
  status: 'to_read' | 'reading' | 'completed';
  start_time?: string;
  end_time?: string;
}

export interface ReadingSession {
  id?: number;
  book_id: number;
  start_time: string;
  end_time?: string;
  duration?: number; // seconds
}

export interface Rating {
  rating: number;
  comment?: string;
  rated_at?: string;
}

export interface List {
  id?: number;
  name: string;
  created_at?: string;
  books?: Book[];
}

/**
 *  Funzione per cercare libri su Google Books API.
 *  Restituisce un array di oggetti Book.
 *  Se la query è vuota, o si verifica un'errore durante la richiesta, restituisce un array vuoto.
 */
export async function searchBooksRemote(query: string): Promise<Book[]> {

  if (query.trim() === '') {
    return [];
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
      )}&maxResults=20`
    );

    const json = await res.json();

    return json.items.map((item: any) => {
      const volumeInfo = item.volumeInfo;   // l'API restituisce in questa proprietà le info utili

      // nel map restituiamo i campi dell'oggetto con quelli che ci servono dall'API
      return {
        title: volumeInfo.title,
        authors: volumeInfo.authors || [],
        editor: volumeInfo.publisher,
        publication: volumeInfo.publishedDate ? parseInt(volumeInfo.publishedDate) : undefined,
        published: volumeInfo.publishedDate ? parseInt(volumeInfo.publishedDate) : undefined,
        description: volumeInfo.description,
        cover_url: volumeInfo.imageLinks?.thumbnail,
        isbn10: volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier,
        isbn13: volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier,
        externalId: item.id,
        source: 'google',
        genres: volumeInfo.categories || []
      };

    });

  } catch (error) {
    console.error('Fetching to Google Books API returned an error: ', error);
    return [];
  }

}

/**
 *  Funzione per ottenere tutti i libri salvati sul database SQLite.
 *  Restituisce un array di oggetti Book.
 *  La query riguarda solo quelli che sono stati salvati.
 */
export async function searchLocalBooks(query: string): Promise<Book[]> {
  
  const db = getDBConnection();

  const rows = await db.getAllAsync(
    `SELECT b.id, b.title, b.description, b.cover_url,
            b.editor, b.publication, b.isbn10, b.isbn13,
            b.created_at as createdAt,
            a.id as authorId, a.name as authorName,
            g.id as genreId, g.name as genreName,
            rs.status as readingStatus,
            rs.start_time as startTime, rs.end_time as endTime,
            n.notes_text as notes,
            r.rating, r.comment, r.rated_at as ratedAt,
            CASE WHEN f.book_id IS NOT NULL THEN 1 ELSE 0 END as isFavorite,
            CASE WHEN w.book_id IS NOT NULL THEN 1 ELSE 0 END as isInWishlist
       FROM books b
       LEFT JOIN book_authors ba ON b.id = ba.book_id
       LEFT JOIN authors a ON ba.author_id = a.id
       LEFT JOIN book_genres bg ON b.id = bg.book_id
       LEFT JOIN genres g ON bg.genre_id = g.id
       LEFT JOIN reading_status rs ON b.id = rs.book_id
       LEFT JOIN notes n ON b.id = n.book_id
       LEFT JOIN ratings r ON b.id = r.book_id
       LEFT JOIN favorites f ON b.id = f.book_id
       LEFT JOIN wishlist w ON b.id = w.book_id
      WHERE b.title LIKE ? OR a.name LIKE ? OR g.name LIKE ?
      ORDER BY b.title;`,
    `%${query}%`, `%${query}%`, `%${query}%`
  ) as any[]; // utilizziamo any poichè "non conosciamo" la struttura esatta dei dati
    
  if (rows.length === 0) {  // nessun risultato => restituiamo array vuoto
    return [];
  }

  // Mappiamo i risultati per restituire un array di oggetti Book
  return rows.map((row) => ({
    ...row,
    created_at: row.createdAt,
    reading_status: {
      status: row.readingStatus,
      start_time: row.startTime,
      end_time: row.endTime,
      duration: row.duration,
    },
    rating: {
      rating: row.rating,
      comment: row.comment,
      rated_at: row.ratedAt,
    },
    is_favorite: row.isFavorite,
    is_in_wishlist: row.isInWishlist,
  }));
  
}