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
  cover_url?: string;
  editor?: string;
  publication?: number;
  published?: number;  // anno pubblicazione
  isbn10?: string;
  isbn13?: string;
  created_at?: string;
  authors?: Author[] | string[]; // array -> un libro può avere più autori
  genres?: Genre[] | string[];  // array -> un libro può essere di più generi
  language?: string;
  reading_status?: ReadingStatus;
  notes?: string;
  rating?: Rating;
  is_favorite?: boolean;
  is_in_wishlist?: boolean;
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
 * 
 * @function searchBooksRemote
 * @param query Stringa da cercare nell'API di Google Books
 * @description Funzione per cercare libri su Google Books.
 * @returns {Promise<Book[]>} Array di oggetti Book
 * @async
 */
export async function searchBooksRemote(query: string): Promise<Book[]> {
  // Verifica input
  if (query.trim() === '') {
    return [];
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
      )}&maxResults=20`
    );

    if (!res.ok) {
      console.error(`Errore nella risposta API: ${res.status} ${res.statusText}`);
      throw new Error(`Errore durante la ricerca: ${res.statusText}`);
    }

    const json = await res.json();

    if (!json.items || !Array.isArray(json.items)) {
      console.warn('Nessun risultato trovato da Google Books API');
      return [];
    }

    return json.items.map((item: any) => {
      const volumeInfo = item.volumeInfo;   // l'API restituisce in questa proprietà le info utili

      // nel map restituiamo i campi dell'oggetto con quelli che ci servono dall'API
      return {
        title: volumeInfo.title || 'Titolo sconosciuto',
        authors: volumeInfo.authors || [],
        editor: volumeInfo.publisher,
        publication: volumeInfo.publishedDate ? parseInt(volumeInfo.publishedDate) : undefined,
        description: volumeInfo.description,
        cover_url: volumeInfo.imageLinks?.thumbnail,
        isbn10: volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier,
        isbn13: volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier,
        language: volumeInfo.language,
        genres: volumeInfo.categories || []
      };
    });

  } catch (error) {
    console.error('Errore durante la ricerca su Google Books API: ', error);
    throw new Error('Impossibile completare la ricerca. Controlla la connessione internet e riprova.');
  }
}

/**
 * 
 * @function searchBooksLocal
 * @param query Stringa da cercare all'interno del DB SQLite
 * @description Funzione per cercare libri locali nel DB SQLite.
 * @returns {Promise<Book[]>} Array di oggetti Book
 * @async
 */
export async function searchBooksLocal(query: string): Promise<Book[]> {
  // Rimuoviamo questo controllo per consentire query vuote (es. ricerca solo per categoria)
  // if (query.trim() === '') {
  //   return [];
  // }
  
  const db = getDBConnection();
  const searchTerm = `%${query}%`;

  try {
    // Prima query per ottenere gli ID dei libri che corrispondono al termine di ricerca
    const booksQuery = query.trim() === '' 
      ? `SELECT DISTINCT b.id FROM books b ORDER BY b.title` // Query per ottenere tutti i libri
      : `
        SELECT DISTINCT b.id
        FROM books b
        LEFT JOIN book_authors ba ON b.id = ba.book_id
        LEFT JOIN authors a ON ba.author_id = a.id
        LEFT JOIN book_genres bg ON b.id = bg.book_id
        LEFT JOIN genres g ON bg.genre_id = g.id
        WHERE b.title LIKE ? 
           OR b.isbn10 LIKE ? 
           OR b.isbn13 LIKE ?
           OR a.name LIKE ? 
           OR g.name LIKE ?
        ORDER BY b.title
      `;
    
    // Eseguiamo la query appropriata in base al fatto che la query sia vuota o no
    const matchingBooks = query.trim() === '' 
      ? await db.getAllAsync(booksQuery) as {id: number}[]
      : await db.getAllAsync(booksQuery, 
          searchTerm, searchTerm, searchTerm, searchTerm, searchTerm) as {id: number}[];
    
    if (matchingBooks.length === 0) {
      return [];
    }
    
    // Otteniamo tutti i dettagli dei libri trovati
    const result: Book[] = [];
    
    for (const bookRow of matchingBooks) {
      const book = await getBookById(bookRow.id);
      if (book) {
        result.push(book);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Errore durante la ricerca locale:', error);
    throw new Error('Errore durante la ricerca locale. Riprova più tardi.');
  }
}

/**
 * 
 * @function insertBook
 * @param book Oggetto Book da inserire nel DB SQLite
 * @description Funzione per inserire un libro nel DB SQLite.
 * @returns {Promise<number>} ID del libro inserito
 * @async
 */
export async function insertBook(book: Book): Promise<number> {
  const db = getDBConnection();

  // Recuperiamo i campi necessari per l'inserimento
  const { title, description, cover_url, editor, publication, published, isbn10, isbn13, language } = book;

  // Verifica del titolo (campo obbligatorio)
  if (!title) {
    throw new Error('È richiesto di inserire almeno il titolo.');
  }

  try {
    // Controlliamo se il libro esiste già nel DB
    const existingBooks = await db.getAllAsync(
      `SELECT id FROM books WHERE 
       (isbn10 = ? AND isbn10 IS NOT NULL) OR 
       (isbn13 = ? AND isbn13 IS NOT NULL) OR 
       (title = ? AND 
        (
          (isbn10 IS NULL AND ?) OR 
          (isbn13 IS NULL AND ?)
        )
       )`,
      isbn10 || null, isbn13 || null, title, !isbn10, !isbn13
    ) as {id: number}[];

    if (existingBooks.length > 0) {
      throw new Error('Questo libro è già presente in libreria!');
    }

    // Inseriamo il libro nel database
    const bookResult = await db.runAsync(
      `INSERT INTO books (title, description, cover_url, editor, publication, language, isbn10, isbn13)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, 
        description || null, 
        cover_url || null, 
        editor || null, 
        publication || published || null, 
        language || null, 
        isbn10 || null, 
        isbn13 || null
      ]
    );

    if (!bookResult || !bookResult.lastInsertRowId) {
      throw new Error('Errore durante l\'inserimento del libro nel database.');
    }
    
    const bookId = bookResult.lastInsertRowId;

    // Gestione degli autori
    if (book.authors && book.authors.length > 0) {
      for (const authorItem of book.authors) {
        const authorName = typeof authorItem === 'string' ? authorItem : authorItem.name;
        
        // Verifica se l'autore esiste già
        const existingAuthors = await db.getAllAsync(
          `SELECT id FROM authors WHERE name = ?`,
          authorName
        ) as {id: number}[];
        
        let authorId;
        if (existingAuthors.length === 0) {
          // Crea nuovo autore
          const result = await db.runAsync(
            `INSERT INTO authors (name) VALUES (?)`,
            authorName
          );
          authorId = result.lastInsertRowId;
        } else {
          authorId = existingAuthors[0].id;
        }

        // Crea associazione libro-autore
        await db.runAsync(
          `INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)`,
          bookId, authorId
        );
      }
    }

    // Gestione dei generi
    if (book.genres && book.genres.length > 0) {
      for (const genreItem of book.genres) {
        const genreName = typeof genreItem === 'string' ? genreItem : genreItem.name;
        
        // Verifica se il genere esiste già
        const existingGenres = await db.getAllAsync(
          `SELECT id FROM genres WHERE name = ?`,
          genreName
        ) as {id: number}[];
        
        let genreId;
        if (existingGenres.length === 0) {
          // Crea nuovo genere
          const result = await db.runAsync(
            `INSERT INTO genres (name) VALUES (?)`,
            genreName
          );
          genreId = result.lastInsertRowId;
        } else {
          genreId = existingGenres[0].id;
        }

        // Crea associazione libro-genere
        await db.runAsync(
          `INSERT INTO book_genres (book_id, genre_id) VALUES (?, ?)`,
          bookId, genreId
        );
      }
    }

    /**
     * Il trigger associato alla tabella books si occupa di inserire automaticamente
     * lo status di lettura del libro, che viene inizializzato a "to_read" (da leggere).
     */

    // Restituiamo l'ID del libro inserito
    return bookId;
  } catch (error) {
    console.error('Errore durante l\'inserimento del libro:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Errore durante l\'inserimento del libro nel database.');
  }
}

/**
 * 
 * @function getBookById
 * @param id ID del libro da recuperare dal database
 * @description Funzione per ottenere un libro specifico dal database attraverso il suo ID.
 * @returns {Promise<Book | null>} Il libro trovato o null se non trovato
 * @async
 */
export async function getBookById(id: number): Promise<Book | null> {
  const db = getDBConnection();

  const row = await db.getFirstAsync(
    `SELECT b.id, b.title, b.description, b.cover_url,
            b.editor, b.publication, b.language, b.isbn10, b.isbn13,
            b.created_at as createdAt,
            rs.status as readingStatus,
            rs.start_time as startTime, rs.end_time as endTime,
            n.notes_text as notes,
            r.rating, r.comment, r.rated_at as ratedAt,
            CASE WHEN f.book_id IS NOT NULL THEN 1 ELSE 0 END as isFavorite,
            CASE WHEN w.book_id IS NOT NULL THEN 1 ELSE 0 END as isInWishlist
      FROM books b
      LEFT JOIN reading_status rs ON b.id = rs.book_id
      LEFT JOIN notes n ON b.id = n.book_id
      LEFT JOIN ratings r ON b.id = r.book_id
      LEFT JOIN favorites f ON b.id = f.book_id
      LEFT JOIN wishlist w ON b.id = w.book_id
      WHERE b.id = ?`,
    id
  ) as any | null;

  if (!row) {
    return null;
  }

  // Recupero gli autori del libro
  const authors = await db.getAllAsync(
    `SELECT a.id, a.name, a.created_at
      FROM authors a
      JOIN book_authors ba ON a.id = ba.author_id
      WHERE ba.book_id = ?`,
    id
  ) as Author[];

  // Recupero i generi del libro
  const genres = await db.getAllAsync(
    `SELECT g.id, g.name, g.description, g.created_at
      FROM genres g
      JOIN book_genres bg ON g.id = bg.genre_id
      WHERE bg.book_id = ?`,
    id
  ) as Genre[];

  return {
    ...row,
    id: row.id,
    created_at: row.createdAt,
    authors,
    genres,
    reading_status: {
      status: row.readingStatus || 'to_read',
      start_time: row.startTime,
      end_time: row.endTime,
    },
    rating: row.rating ? {
      rating: row.rating,
      comment: row.comment,
      rated_at: row.ratedAt,
    } : undefined,
    notes: row.notes,
    is_favorite: Boolean(row.isFavorite),
    is_in_wishlist: Boolean(row.isInWishlist),
  };
}

/**
 * 
 * @function updateBook
 * @param book Oggetto Book da aggiornare nel database
 * @description Funzione per aggiornare i dati di un libro esistente nel database.
 * @returns {Promise<boolean>} true se l'aggiornamento è andato a buon fine, false altrimenti
 * @async
 */
export async function updateBook(book: Book): Promise<boolean> {
  if (!book.id) {
    throw new Error('ID libro mancante. Impossibile aggiornare.');
  }

  const db = getDBConnection();

  try {
    // Recuperiamo i campi necessari per l'aggiornamento
    const { id, title, description, cover_url, editor, publication, published, language, isbn10, isbn13 } = book;

    // Aggiorna il libro nel database
    await db.runAsync(
      `UPDATE books 
       SET title = ?, description = ?, cover_url = ?, editor = ?, 
           publication = ?, language = ?, isbn10 = ?, isbn13 = ?
       WHERE id = ?`,
      [
        title, 
        description || null, 
        cover_url || null, 
        editor || null, 
        publication || published || null, 
        language || null, 
        isbn10 || null, 
        isbn13 || null,
        id
      ]
    );

    // Gestione autori
    if (book.authors && book.authors.length > 0) {
      // Rimuovi associazioni esistenti
      await db.runAsync(
        `DELETE FROM book_authors WHERE book_id = ?`,
        [id]
      );

      // Crea nuove associazioni
      for (const author of book.authors) {
        const authorName = typeof author === 'string' ? author : author.name;
        
        // Verifica se l'autore esiste già
        const existingAuthor = await db.getAllAsync(
          `SELECT id FROM authors WHERE name = ?`,
          [authorName]
        );
        
        let authorId;
        if (existingAuthor.length === 0) {
          // Crea nuovo autore
          const result = await db.runAsync(
            `INSERT INTO authors (name) VALUES (?)`,
            [authorName]
          );
          authorId = result.lastInsertRowId;
        } else {
          authorId = (existingAuthor[0] as any).id;
        }

        // Crea associazione libro-autore
        await db.runAsync(
          `INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)`,
          [id, authorId]
        );
      }
    }

    // Gestione generi
    if (book.genres && book.genres.length > 0) {
      // Rimuovi associazioni esistenti
      await db.runAsync(
        `DELETE FROM book_genres WHERE book_id = ?`,
        [id]
      );

      // Crea nuove associazioni
      for (const genre of book.genres) {
        const genreName = typeof genre === 'string' ? genre : genre.name;
        
        // Verifica se il genere esiste già
        const existingGenre = await db.getAllAsync(
          `SELECT id FROM genres WHERE name = ?`,
          [genreName]
        );
        
        let genreId;
        if (existingGenre.length === 0) {
          // Crea nuovo genere
          const result = await db.runAsync(
            `INSERT INTO genres (name) VALUES (?)`,
            [genreName]
          );
          genreId = result.lastInsertRowId;
        } else {
          genreId = (existingGenre[0] as any).id;
        }

        // Crea associazione libro-genere
        await db.runAsync(
          `INSERT INTO book_genres (book_id, genre_id) VALUES (?, ?)`,
          [id, genreId]
        );
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating book:', error);
    return false;
  }
}

/**
 * 
 * @function deleteBook
 * @param id ID del libro da eliminare
 * @description Funzione per eliminare un libro dal database.
 * @returns {Promise<boolean>} true se l'eliminazione è andata a buon fine, false altrimenti
 * @async
 */
export async function deleteBook(id: number): Promise<boolean> {
  const db = getDBConnection();

  try {
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.runAsync('DELETE FROM books WHERE id = ?', id);
    
    return true;
  } catch (error) {
    console.error('Error deleting book:', error);
    return false;
  }
}

/**
 * 
 * @function getBooksByStatus
 * @param status Stato di lettura da filtrare ('to_read', 'reading', 'completed')
 * @description Funzione per ottenere tutti i libri con un determinato stato di lettura.
 * @returns {Promise<Book[]>} Array di libri con lo stato specificato
 * @async
 */
export async function getBooksByStatus(status: 'to_read' | 'reading' | 'completed'): Promise<Book[]> {
  const db = getDBConnection();

  const rows = await db.getAllAsync(
    `SELECT b.id, b.title, b.description, b.cover_url,
            b.editor, b.publication, b.language, b.isbn10, b.isbn13,
            b.created_at as createdAt,
            rs.status as readingStatus,
            rs.start_time as startTime, rs.end_time as endTime
      FROM books b
      JOIN reading_status rs ON b.id = rs.book_id
      WHERE rs.status = ?
      ORDER BY ${status === 'reading' ? 'rs.start_time DESC' : 'b.title'}`,
    status
  ) as any[];

  if (rows.length === 0) {
    return [];
  }

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    cover_url: row.cover_url,
    editor: row.editor,
    publication: row.publication,
    language: row.language,
    isbn10: row.isbn10,
    isbn13: row.isbn13,
    created_at: row.createdAt,
    reading_status: {
      status: row.readingStatus,
      start_time: row.startTime,
      end_time: row.endTime,
    }
  }));
}

/**
 * 
 * @function updateReadingStatus
 * @param bookId ID del libro di cui aggiornare lo stato
 * @param status Nuovo stato di lettura ('to_read', 'reading', 'completed')
 * @description Funzione per aggiornare lo stato di lettura di un libro.
 * @returns {Promise<boolean>} true se l'aggiornamento è andato a buon fine, false altrimenti
 * @async
 */
export async function updateReadingStatus(bookId: number, status: 'to_read' | 'reading' | 'completed'): Promise<boolean> {
  const db = getDBConnection();

  try {
    if (status === 'reading') {
      // Imposta l'inizio della lettura
      await db.runAsync(
        `UPDATE reading_status
         SET status = ?, 
             start_time = COALESCE(start_time, datetime('now'))
         WHERE book_id = ?`,
        status, bookId
      );
    } else if (status === 'completed') {
      // Imposta la fine della lettura
      await db.runAsync(
        `UPDATE reading_status
         SET status = ?, 
             end_time = datetime('now')
         WHERE book_id = ?`,
        status, bookId
      );
    } else {
      // Reimposta i tempi per lo stato "da leggere"
      await db.runAsync(
        `UPDATE reading_status
         SET status = ?, 
             start_time = NULL, 
             end_time = NULL
         WHERE book_id = ?`,
        status, bookId
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error updating reading status:', error);
    return false;
  }
}

/**
 * 
 * @function saveNotes
 * @param bookId ID del libro a cui associare le note
 * @param notesText Testo delle note
 * @description Funzione per salvare o aggiornare le note di un libro.
 * @returns {Promise<boolean>} true se il salvataggio è andato a buon fine, false altrimenti
 * @async
 */
export async function saveNotes(bookId: number, notesText: string): Promise<boolean> {
  const db = getDBConnection();

  try {
    await db.runAsync(
      `INSERT INTO notes (book_id, notes_text)
       VALUES (?, ?)
       ON CONFLICT(book_id) DO UPDATE SET notes_text = excluded.notes_text`,
      bookId, notesText
    );
    return true;
  } catch (error) {
    console.error('Error saving notes:', error);
    return false;
  }
}

/**
 * 
 * @function saveRating
 * @param bookId ID del libro da valutare
 * @param rating Valutazione (1-5)
 * @param comment Commento opzionale
 * @description Funzione per salvare o aggiornare la valutazione di un libro.
 * @returns {Promise<boolean>} true se il salvataggio è andato a buon fine, false altrimenti
 * @async
 */
export async function saveRating(bookId: number, rating: number, comment?: string): Promise<boolean> {
  if (rating < 1 || rating > 5) {
    throw new Error('La valutazione deve essere compresa tra 1 e 5');
  }

  const db = getDBConnection();

  try {
    await db.runAsync(
      `INSERT INTO ratings (book_id, rating, comment)
       VALUES (?, ?, ?)
       ON CONFLICT(book_id) DO UPDATE 
       SET rating = excluded.rating, 
           comment = excluded.comment, 
           rated_at = datetime('now')`,
      bookId, rating, comment || null
    );
    
    return true;
  } catch (error) {
    console.error('Error saving rating:', error);
    return false;
  }
}

/**
 * 
 * @function toggleFavorite
 * @param bookId ID del libro da aggiungere/rimuovere dai preferiti
 * @param isFavorite true per aggiungere ai preferiti, false per rimuovere
 * @description Funzione per aggiungere o rimuovere un libro dai preferiti.
 * @returns {Promise<boolean>} true se l'operazione è andata a buon fine, false altrimenti
 * @async
 */
export async function toggleFavorite(bookId: number, isFavorite: boolean): Promise<boolean> {
  const db = getDBConnection();

  try {
    if (isFavorite) {
      await db.runAsync(
        `INSERT OR IGNORE INTO favorites (book_id)
         VALUES (?)`,
        bookId
      );
    } else {
      await db.runAsync(
        `DELETE FROM favorites
         WHERE book_id = ?`,
        bookId
      );
    }
    return true;
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    return false;
  }
}

/**
 * 
 * @function toggleWishlist
 * @param bookId ID del libro da aggiungere/rimuovere dalla wishlist
 * @param isInWishlist true per aggiungere alla wishlist, false per rimuovere
 * @description Funzione per aggiungere o rimuovere un libro dalla wishlist.
 * @returns {Promise<boolean>} true se l'operazione è andata a buon fine, false altrimenti
 * @async
 */
export async function toggleWishlist(bookId: number, isInWishlist: boolean): Promise<boolean> {
  const db = getDBConnection();

  try {
    if (isInWishlist) {
      await db.runAsync(
        `INSERT OR IGNORE INTO wishlist (book_id)
         VALUES (?)`,
        bookId
      );
    } else {
      await db.runAsync(
        `DELETE FROM wishlist
         WHERE book_id = ?`,
        bookId
      );
    }
    return true;
  } catch (error) {
    console.error('Error toggling wishlist status:', error);
    return false;
  }
}

/**
 * 
 * @function startReadingSession
 * @param bookId ID del libro per cui iniziare la sessione di lettura
 * @description Funzione per iniziare una nuova sessione di lettura.
 * @returns {Promise<number>} ID della sessione creata
 * @async
 */
export async function startReadingSession(bookId: number): Promise<number> {
  const db = getDBConnection();

  try {
    // Assicuriamoci che il libro sia nello stato "in lettura"
    await updateReadingStatus(bookId, 'reading');
    
    const result = await db.runAsync(
      `INSERT INTO reading_sessions (book_id, start_time)
       VALUES (?, datetime('now'))`,
      bookId
    );
    
    return result.lastInsertRowId as number;
  } catch (error) {
    console.error('Error starting reading session:', error);
    throw error;
  }
}

/**
 * 
 * @function endReadingSession
 * @param sessionId ID della sessione di lettura da completare
 * @description Funzione per terminare una sessione di lettura in corso.
 * @returns {Promise<boolean>} true se l'operazione è andata a buon fine, false altrimenti
 * @async
 */
export async function endReadingSession(sessionId: number): Promise<boolean> {
  const db = getDBConnection();

  try {
    await db.runAsync(
      `UPDATE reading_sessions
       SET end_time = datetime('now')
       WHERE id = ? AND end_time IS NULL`,
      sessionId
    );
    return true;
  } catch (error) {
    console.error('Error ending reading session:', error);
    return false;
  }
}

/**
 * 
 * @function getReadingSessions
 * @param bookId ID del libro di cui recuperare le sessioni di lettura
 * @description Funzione per ottenere tutte le sessioni di lettura di un libro.
 * @returns {Promise<ReadingSession[]>} Array delle sessioni di lettura
 * @async
 */
export async function getReadingSessions(bookId: number): Promise<ReadingSession[]> {
  const db = getDBConnection();

  const rows = await db.getAllAsync(
    `SELECT id, book_id, start_time, end_time, duration
     FROM reading_sessions
     WHERE book_id = ?
     ORDER BY start_time DESC`,
    bookId
  ) as ReadingSession[];

  return rows;
}


/**
 * Rimuove la valutazione di un libro
 */
export async function deleteRating(bookId: number): Promise<boolean> {
  const db = getDBConnection();
  try {
    await db.runAsync(
      `DELETE FROM ratings WHERE book_id = ?`,
      bookId
    );
    return true;
  } catch (error) {
    console.error('Error deleting rating:', error);
    return false;
  }
}

/**
 * Rimuove le note di un libro
 */
export async function deleteComment(bookId: number): Promise<boolean> {
  const db = getDBConnection();
  try {
    await db.runAsync(
      `DELETE FROM comment WHERE book_id = ?`,
      bookId
    );
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
}