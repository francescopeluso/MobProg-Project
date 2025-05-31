/**
 * Questo file serve ad inizializzare e popolare il database
 * con dati di esempio per la demo utilizzando Google Books API
 * per ottenere metadati reali dei libri.
 * 
 * Verranno aggiunti libri curati, con una distribuzione
 * tra letti, in lettura e da leggere. Inoltre, verranno generati
 * dati casual per le valutazioni, commenti, e per tutte le statistiche.
 * 
 * Le statistiche avranno date che coprono gli ultimi 4 mesi, ovvero
 * da marzo 2025 a giugno 2025, tutti con numero di giorno casuale.
 * 
 * @file utils/demoInitialize.ts
 */

import { Book } from '../services/bookApi';
import { getDBConnection } from './database';

type ReadingStatus = 'to_read' | 'reading' | 'completed';

/**
 * Genera una data casuale tra marzo e giugno 2025
 */
function getRandomDate(): string {
  const months = ['2025-03', '2025-04', '2025-05', '2025-06'];
  const randomMonth = months[Math.floor(Math.random() * months.length)];
  const randomDay = Math.floor(Math.random() * 28) + 1; // Sicuro per tutti i mesi
  const randomHour = Math.floor(Math.random() * 24);
  const randomMinute = Math.floor(Math.random() * 60);
  
  return `${randomMonth}-${randomDay.toString().padStart(2, '0')} ${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}:00`;
}

// Lista curata di titoli per la ricerca tramite Google Books API
const bookTitles = [
  "Dune Frank Herbert",
  "Foundation Isaac Asimov",
  "The Martian Andy Weir",
  "Il signore degli anelli J.R.R. Tolkien",
  "A Game of Thrones George R.R. Martin",
  "Ready Player One Ernest Cline",
  "Altered Carbon Richard K. Morgan",
  "The Diamond Age Neal Stephenson",
  "Ghost in the Shell Masamune Shirow",
  "Akira Katsuhiro Otomo",
  "1984: Edizione Integrale George Orwell",
  "Guida Galattica per Autostoppisti Douglas Adams",
  "V for Vendetta Alan Moore",
  "Steve Jobs Walter Isaacson",
  "Elon Musk Walter Isaacson",
  "Einstein Walter Isaacson",
  "Il nuovo Java Claudio De Sio Cesari",
  "Il nome della rosa Umberto Eco",
  "Il codice da Vinci Dan Brown",
];

const randomComments = [
  "Un capolavoro assoluto! Ogni pagina è un piacere da leggere.",
  "Molto interessante, mi ha fatto riflettere profondamente sui temi.",
  "Non è riuscito a coinvolgermi completamente, ma ha dei momenti geniali.",
  "Scrittura eccellente e trama avvincente. Consigliatissimo!",
  "Un po' lento all'inizio, ma poi l'azione esplode magnificamente.",
  "Personaggi ben caratterizzati e worldbuilding perfetto.",
  "Un libro che lascia il segno. Cambierà il vostro modo di vedere le cose.",
  "Scrittura all'ennesima potenza. L'autore rimane insuperabile.",
  "Narrativa moderna che rivaleggia con i grandi classici.",
  "Storia inquietante ma necessaria. Molto attuale.",
  "Racconto fatto a regola d'arte. Perfetto nell'esecuzione."
];

/**
 * Cerca un libro tramite Google Books API
 * @param query Query di ricerca (titolo + autore)
 * @returns Primo libro trovato o null
 */
async function searchBookByTitle(query: string): Promise<Book | null> {
  try {
    console.log(`Ricerca libro: ${query}`);
    
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`
    );

    if (!res.ok) {
      console.error(`Errore nella risposta API: ${res.status} ${res.statusText}`);
      return null;
    }

    const json = await res.json();

    if (!json.items || !Array.isArray(json.items) || json.items.length === 0) {
      console.warn(`Nessun risultato trovato per: ${query}`);
      return null;
    }

    const item = json.items[0];
    const volumeInfo = item.volumeInfo;

    // Mappa i dati API al nostro formato Book
    const book: Book = {
      title: volumeInfo.title || 'Titolo sconosciuto',
      authors: volumeInfo.authors || [],
      editor: volumeInfo.publisher,
      publication: volumeInfo.publishedDate ? parseInt(volumeInfo.publishedDate.split('-')[0]) : undefined,
      description: volumeInfo.description,
      cover_url: volumeInfo.imageLinks?.thumbnail,
      isbn10: volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier,
      isbn13: volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier,
      language: volumeInfo.language,
      genres: volumeInfo.categories || []
    };

    console.log(`Libro trovato: ${book.title} - ${book.authors?.[0] || 'Autore sconosciuto'}`);
    return book;

  } catch (error) {
    console.error(`Errore durante la ricerca per "${query}":`, error);
    return null;
  }
}

/**
 * Genera dati casuali per le sessioni di lettura
 */
function generateReadingSessions(bookId: number, status: ReadingStatus): {start_time: string, end_time: string}[] {
  if (status === 'to_read') return [];
  
  const sessions = [];
  const numSessions = Math.floor(Math.random() * 12) + 1; // 1-12 sessioni per libro
  
  for (let i = 0; i < numSessions; i++) {
    const startTime = getRandomDate();
    // Sessioni di lettura variabili (45min - 3 ore)
    const duration = Math.floor(Math.random() * 8100) + 2700; // 45 minuti - 3 ore in secondi
    const endTime = new Date(new Date(startTime).getTime() + duration * 1000).toISOString().replace('T', ' ').substring(0, 19);
    
    sessions.push({ start_time: startTime, end_time: endTime });
  }
  
  return sessions;
}

/**
 * Delay per evitare rate limiting dell'API
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Popola il database con dati reali da Google Books API
 */
export async function populateWithDemoDataFromAPI(
  onProgress?: (progress: number, message: string) => void
): Promise<void> {
  const db = getDBConnection();
  
  try {
    console.log('Inizio popolamento database con dati reali da Google Books API...');
    console.log(`Cercando ${bookTitles.length} libri...`);
    
    onProgress?.(5, 'Inizializzazione in corso...');
    
    const fetchedBooks: Book[] = [];
    
    // Cerca ogni libro tramite API con delay per evitare rate limiting
    for (let i = 0; i < bookTitles.length; i++) {
      const title = bookTitles[i];
      
      // Progresso fase di ricerca (5% - 40%)
      const searchProgress = 5 + (i / bookTitles.length) * 35;
      onProgress?.(searchProgress, `Ricerca libri... ${i + 1}/${bookTitles.length}`);
      
      try {
        const book = await searchBookByTitle(title);
        if (book) {
          fetchedBooks.push(book);
        } else {
          console.warn(`Libro non trovato: ${title}`);
        }
        
        // Delay tra le richieste per rispettare i rate limits
        if (i < bookTitles.length - 1) {
          await delay(200); // 200ms tra le richieste
        }
        
      } catch (error) {
        console.error(`Errore durante la ricerca di "${title}":`, error);
        continue;
      }
    }
    
    console.log(`Trovati ${fetchedBooks.length} libri. Inserimento nel database...`);
    onProgress?.(40, `Trovati ${fetchedBooks.length} libri. Inserimento nel database...`);
    
    // Inserisce i libri nel database
    for (let i = 0; i < fetchedBooks.length; i++) {
      const book = fetchedBooks[i];
      
      // Progresso fase di inserimento (40% - 85%)
      const insertProgress = 40 + (i / fetchedBooks.length) * 45;
      onProgress?.(insertProgress, `Inserimento libro ${i + 1}/${fetchedBooks.length}: ${book.title}`);
      
      try {
        // Inserisce gli autori
        const authorIds: number[] = [];
        if (book.authors && Array.isArray(book.authors)) {
          for (const author of book.authors) {
            const authorName = typeof author === 'string' ? author : author.name;
            await db.runAsync(
              'INSERT OR IGNORE INTO authors (name) VALUES (?)',
              [authorName]
            );
            
            const authorQuery = await db.getFirstAsync<{id: number}>(
              'SELECT id FROM authors WHERE name = ?',
              [authorName]
            );
            if (authorQuery?.id) {
              authorIds.push(authorQuery.id);
            }
          }
        }
        
        // Inserisce i generi
        const genreIds: number[] = [];
        if (book.genres && Array.isArray(book.genres)) {
          for (const genre of book.genres) {
            const genreName = typeof genre === 'string' ? genre : genre.name;
            await db.runAsync(
              'INSERT OR IGNORE INTO genres (name) VALUES (?)',
              [genreName]
            );
            
            const genreQuery = await db.getFirstAsync<{id: number}>(
              'SELECT id FROM genres WHERE name = ?',
              [genreName]
            );
            if (genreQuery?.id) {
              genreIds.push(genreQuery.id);
            }
          }
        }
        
        // Inserisce il libro
        const bookResult = await db.runAsync(
          `INSERT INTO books (title, description, cover_url, editor, publication, language, isbn10, isbn13, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            book.title, 
            book.description || null, 
            book.cover_url || null,
            book.editor || null, 
            book.publication || null, 
            book.language || null, 
            book.isbn10 || null,
            book.isbn13 || null, 
            getRandomDate()
          ]
        );
        
        const bookId = bookResult.lastInsertRowId;
        
        if (bookId) {
          // Collega libro e autori
          for (const authorId of authorIds) {
            await db.runAsync(
              'INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)',
              [bookId, authorId]
            );
          }
          
          // Collega libro e generi
          for (const genreId of genreIds) {
            await db.runAsync(
              'INSERT INTO book_genres (book_id, genre_id) VALUES (?, ?)',
              [bookId, genreId]
            );
          }
          
          // Genera stato di lettura casuale con distribuzione realistica
          // 30% to_read, 20% reading, 50% completed (i geek leggono molto!)
          const rand = Math.random();
          let status: ReadingStatus;
          if (rand < 0.3) {
            status = 'to_read';
          } else if (rand < 0.5) {
            status = 'reading';
          } else {
            status = 'completed';
          }
          
          await db.runAsync(
            'UPDATE reading_status SET status = ?, start_time = ?, end_time = ? WHERE book_id = ?',
            [
              status,
              status !== 'to_read' ? getRandomDate() : null,
              status === 'completed' ? getRandomDate() : null,
              bookId
            ]
          );
          
          // Genera sessioni di lettura
          const sessions = generateReadingSessions(bookId, status);
          for (const session of sessions) {
            await db.runAsync(
              'INSERT INTO reading_sessions (book_id, start_time, end_time) VALUES (?, ?, ?)',
              [bookId, session.start_time, session.end_time]
            );
          }
          
          // Aggiunge valutazioni e commenti per i libri letti (85% dei completati)
          if (status === 'completed' && Math.random() > 0.15) {
            // Rating tendenzialmente alto per libri curati (bias positivo)
            const rating = Math.random() > 0.3 ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 3) + 2; // 70% sono 4-5 stelle
            const comment = Math.random() > 0.3 ? randomComments[Math.floor(Math.random() * randomComments.length)] : null;
            
            await db.runAsync(
              'INSERT INTO ratings (book_id, rating, comment, rated_at) VALUES (?, ?, ?, ?)',
              [bookId, rating, comment, getRandomDate()]
            );
          }
          
          // Aggiunge alcuni libri ai preferiti (25% di probabilità)
          if (Math.random() > 0.75) {
            await db.runAsync(
              'INSERT INTO favorites (book_id, added_at) VALUES (?, ?)',
              [bookId, getRandomDate()]
            );
          }
          
          console.log(`✓ Inserito: ${book.title} (${status})`);
        }
        
      } catch (error) {
        console.error(`Errore durante l'inserimento di "${book.title}":`, error);
        continue;
      }
    }
    
    onProgress?.(85, 'Aggiunta elementi wishlist...');
    
    // Aggiunge alcuni elementi alla wishlist
    const wishlistItems = [
      "The Expanse Leviathan Wakes - James S.A. Corey",
      "Red Mars - Kim Stanley Robinson", 
      "The Culture Consider Phlebas - Iain M. Banks",
      "Malazan Book of the Fallen - Steven Erikson",
      "The Broken Earth Fifth Season - N.K. Jemisin",
      "Recursion - Blake Crouch",
      "Project Hail Mary - Andy Weir",
      "Klara and the Sun - Kazuo Ishiguro"
    ];
    
    for (let i = 0; i < wishlistItems.length; i++) {
      const item = wishlistItems[i];
      const wishlistProgress = 85 + (i / wishlistItems.length) * 10;
      onProgress?.(wishlistProgress, `Aggiunta wishlist ${i + 1}/${wishlistItems.length}...`);
      
      if (Math.random() > 0.4) { // 60% di probabilità per ogni elemento
        await db.runAsync(
          'INSERT INTO wishlist (book_title, added_at) VALUES (?, ?)',
          [item, getRandomDate()]
        );
      }
    }
    
    onProgress?.(100, 'Completato!');
    
    console.log('✅ Database popolato con successo con dati reali da Google Books API!');
    console.log(`📚 Inseriti ${fetchedBooks.length} libri con metadati reali`);
    
  } catch (error) {
    console.error('❌ Errore durante il popolamento del database:', error);
    throw error;
  }
}

