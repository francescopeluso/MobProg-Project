import { getDBConnection } from '@/utils/database';

export interface FavoriteBook {
  id: number;
  title: string;
  author: string;
  cover_url?: string;
  rating?: number;
  dateAdded: string;
}

/**
 * Ottiene tutti i libri preferiti dell'utente
 * @returns {Promise<FavoriteBook[]>} Array dei libri preferiti
 */
export const getFavoriteBooks = async (): Promise<FavoriteBook[]> => {
  const db = getDBConnection();
  
  try {
    const result = await db.getAllAsync(`
      SELECT 
        b.id,
        b.title,
        b.cover_url,
        COALESCE(
          (SELECT GROUP_CONCAT(a.name, ', ') 
           FROM book_authors ba 
           JOIN authors a ON ba.author_id = a.id 
           WHERE ba.book_id = b.id), 
          'Autore sconosciuto'
        ) as author,
        r.rating,
        f.added_at as dateAdded
      FROM favorites f
      JOIN books b ON f.book_id = b.id
      LEFT JOIN ratings r ON b.id = r.book_id
      ORDER BY f.added_at DESC
    `);
    
    return result as FavoriteBook[];
  } catch (error) {
    console.error('Errore durante il recupero dei libri preferiti:', error);
    throw error;
  }
};

/**
 * Aggiunge un libro ai preferiti
 * @param bookId ID del libro da aggiungere ai preferiti
 * @returns {Promise<boolean>} true se l'operazione è andata a buon fine
 */
export const addToFavorites = async (bookId: number): Promise<boolean> => {
  const db = getDBConnection();
  
  try {
    await db.runAsync(
      'INSERT OR IGNORE INTO favorites (book_id) VALUES (?)',
      [bookId]
    );
    return true;
  } catch (error) {
    console.error('Errore durante l\'aggiunta ai preferiti:', error);
    return false;
  }
};

/**
 * Rimuove un libro dai preferiti
 * @param bookId ID del libro da rimuovere dai preferiti
 * @returns {Promise<boolean>} true se l'operazione è andata a buon fine
 */
export const removeFromFavorites = async (bookId: number): Promise<boolean> => {
  const db = getDBConnection();
  
  try {
    await db.runAsync(
      'DELETE FROM favorites WHERE book_id = ?',
      [bookId]
    );
    return true;
  } catch (error) {
    console.error('Errore durante la rimozione dai preferiti:', error);
    return false;
  }
};

/**
 * Verifica se un libro è tra i preferiti
 * @param bookId ID del libro da verificare
 * @returns {Promise<boolean>} true se il libro è tra i preferiti
 */
export const isBookFavorite = async (bookId: number): Promise<boolean> => {
  const db = getDBConnection();
  
  try {
    const result = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM favorites WHERE book_id = ?',
      [bookId]
    ) as { count: number };
    
    return result.count > 0;
  } catch (error) {
    console.error('Errore durante la verifica dei preferiti:', error);
    return false;
  }
};

/**
 * Ottiene il numero totale di libri preferiti
 * @returns {Promise<number>} Numero di libri preferiti
 */
export const getFavoritesCount = async (): Promise<number> => {
  const db = getDBConnection();
  
  try {
    const result = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM favorites'
    ) as { count: number };
    
    return result.count;
  } catch (error) {
    console.error('Errore durante il conteggio dei preferiti:', error);
    return 0;
  }
};
