import { getDBConnection } from '@/utils/database';

export interface WishlistItem {
  id: number;
  bookTitle: string;
  addedAt: string;
}

/**
 * Aggiunge un elemento alla wishlist
 */
export const addToWishlist = async (title: string): Promise<void> => {
  const db = getDBConnection();
  
  try {
    await db.runAsync(
      'INSERT INTO wishlist (book_title) VALUES (?)',
      [title.trim()]
    );
  } catch (error) {
    console.error('Errore durante l\'aggiunta alla wishlist:', error);
    throw error;
  }
};

/**
 * Rimuove un elemento dalla wishlist
 */
export const removeFromWishlist = async (id: number): Promise<void> => {
  const db = getDBConnection();
  
  try {
    await db.runAsync(
      'DELETE FROM wishlist WHERE id = ?',
      [id]
    );
  } catch (error) {
    console.error('Errore durante la rimozione dalla wishlist:', error);
    throw error;
  }
};

/**
 * Ottiene tutti gli elementi della wishlist
 */
export const getWishlistItems = async (): Promise<WishlistItem[]> => {
  const db = getDBConnection();
  
  try {
    const result = await db.getAllAsync(
      'SELECT id, book_title as bookTitle, added_at as addedAt FROM wishlist ORDER BY added_at DESC'
    );
    
    return result as WishlistItem[];
  } catch (error) {
    console.error('Errore durante il recupero della wishlist:', error);
    throw error;
  }
};

/**
 * Verifica se un titolo è già presente nella wishlist
 */
export const isTitleInWishlist = async (title: string): Promise<boolean> => {
  const db = getDBConnection();
  
  try {
    const result = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM wishlist WHERE LOWER(book_title) = LOWER(?)',
      [title.trim()]
    ) as { count: number };
    
    return result.count > 0;
  } catch (error) {
    console.error('Errore durante la verifica della wishlist:', error);
    throw error;
  }
};
