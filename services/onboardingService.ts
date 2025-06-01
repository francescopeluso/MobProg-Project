/**
 * @file services/onboardingService.ts
 * @description Servizio per la gestione dei libri consigliati durante l'onboarding
 * 
 * In questo file definiamo le funzioni per:
 *   - generazione di raccomandazioni iniziali basate sui generi selezionati
 *   - validazione della completezza dei dati dei libri
 *   - salvataggio delle raccomandazioni per il primo accesso
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Interfaccia per i libri consigliati visualizzati nella Home
 * Contiene tutti i campi necessari per la visualizzazione nelle card di raccomandazione
 */
export interface RecommendedBook {
  id: string;
  title: string;
  authors: string;
  thumbnail: string;
  description: string;
  editor?: string;
  publication?: number;
  isbn10?: string;
  isbn13?: string;
  language?: string;
  genres?: string[];
}

/**
 * Prepara le raccomandazioni iniziali basate sui generi selezionati durante l'onboarding
 * 
 * Questa funzione garantisce che tutti i libri raccomandati abbiano informazioni complete:
 *   - URL immagine copertina valido
 *   - Descrizione significativa (minimo 50 caratteri)
 *   - Titolo e autori
 * 
 * @param selectedGenres - Array dei nomi dei generi selezionati durante l'onboarding
 * @returns Promise che si risolve quando le raccomandazioni sono salvate in AsyncStorage
 */
export async function prepareInitialRecommendations(
  selectedGenres: string[],
): Promise<void> {
  if (!selectedGenres.length) return;

  const recs: RecommendedBook[] = [];
  const addedIds = new Set<string>(); // Previene duplicati

  /**
   * Valida se un libro ha tutti i campi richiesti per essere mostrato come raccomandazione
   * NOTA: nested function - solo prepareInitialRecommendations() può chiamarla
   * 
   * @param book - Oggetto libro dall'API Google Books
   * @returns true se il libro ha copertina valida, descrizione, titolo e autori
   */
  const isCompleteBook = (book: any): boolean => {
    const volumeInfo = book.volumeInfo;
    const hasValidThumbnail = volumeInfo?.imageLinks?.thumbnail && 
                             volumeInfo.imageLinks.thumbnail.trim() !== '' && 
                             volumeInfo.imageLinks.thumbnail.startsWith('http');
    const hasDescription = volumeInfo?.description && 
                          volumeInfo.description.trim().length > 50; // Almeno 50 caratteri per descrizione significativa
    const hasTitle = volumeInfo?.title && volumeInfo.title.trim().length > 0;
    const hasAuthors = volumeInfo?.authors && volumeInfo.authors.length > 0;

    return hasValidThumbnail && hasDescription && hasTitle && hasAuthors;
  };

  /**
   * Aggiunge un libro alla lista delle raccomandazioni se completo e non duplicato
   * NOTA: nested function - solo prepareInitialRecommendations() può chiamarla
   * 
   * @param book - Oggetto libro dall'API Google Books
   * @returns true se il libro è stato aggiunto con successo, false altrimenti
   */
  const addBookIfNew = (book: any) => {
    if (!book?.id || addedIds.has(book.id) || recs.length >= 12) return false;
    
    if (isCompleteBook(book)) {
      const volumeInfo = book.volumeInfo;
      recs.push({
        id: book.id,
        title: volumeInfo.title,
        authors: (volumeInfo.authors ?? []).join(', '),
        thumbnail: volumeInfo.imageLinks.thumbnail,
        description: volumeInfo.description,
        editor: volumeInfo.publisher,
        publication: volumeInfo.publishedDate ? parseInt(volumeInfo.publishedDate) : undefined,
        isbn10: volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier,
        isbn13: volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier,
        language: volumeInfo.language,
        genres: volumeInfo.categories || [],
      });
      addedIds.add(book.id);
      return true;
    }
    return false;
  };

  /**
   * Mappatura generi per query più specifiche
   * Mappa le categorie di genere generali a termini di ricerca più specifici per migliorare i risultati API
   */
  const genreQueries: Record<string, string[]> = {
    'Fiction': ['fiction bestsellers', 'contemporary fiction', 'literary fiction'],
    'Fantasy': ['fantasy novels', 'epic fantasy', 'urban fantasy'],
    'Sci-Fi': ['science fiction', 'sci-fi novels', 'space opera'],
    'Mystery': ['mystery novels', 'detective fiction', 'crime thriller'],
    'Romance': ['romance novels', 'contemporary romance', 'historical romance'],
    'Thriller': ['thriller novels', 'psychological thriller', 'suspense'],
    'Horror': ['horror novels', 'Stephen King', 'gothic horror'],
    'Biography': ['biography', 'autobiography', 'memoir'],
    'History': ['history books', 'historical non-fiction', 'world history'],
    'Self-Help': ['self-help', 'personal development', 'productivity'],
    'Science': ['popular science', 'science books', 'physics'],
    'Philosophy': ['philosophy', 'philosophical works', 'ethics'],
    'Classic': ['classic literature', 'literary classics', 'great books'],
    'Young Adult': ['young adult', 'YA fiction', 'teen novels'],
    'Children': ['children books', 'kids literature', 'picture books'],
  };

  // Prima fase: cerca per generi selezionati
  for (const genre of selectedGenres) {
    if (recs.length >= 12) break;

    const queries = genreQueries[genre] || [genre.toLowerCase()];
    
    for (const query of queries) {
      if (recs.length >= 12) break;

      try {
        const encodedQuery = encodeURIComponent(`subject:${query}`);
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=20&printType=books&orderBy=relevance&filter=partial`,
        );

        const data = await response.json();
        if (data.items) {
          for (const book of data.items) {
            if (recs.length >= 12) break;
            addBookIfNew(book);
          }
        }
      } catch (err) {
        console.warn('Ricerca per genere fallita per', query, err);
      }
    }
  }

  // Seconda fase: se non abbiamo abbastanza libri, aggiungiamo bestsellers
  if (recs.length < 8) {
    const fallbackQueries = [
      'bestsellers fiction',
      'award winning books',
      'popular books 2023',
      'critically acclaimed',
      'book of the year',
      'prize winning novels',
    ];

    for (const query of fallbackQueries) {
      if (recs.length >= 12) break;

      try {
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=15&printType=books&orderBy=relevance&filter=partial`,
        );

        const data = await response.json();
        if (data.items) {
          for (const book of data.items) {
            if (recs.length >= 12) break;
            addBookIfNew(book);
          }
        }
      } catch (err) {
        console.warn('Ricerca fallback fallita per', query, err);
      }
    }
  }

  // Terza fase: autori popolari garantiti
  if (recs.length < 6) {
    const popularAuthors = [
      'Haruki Murakami', 'Margaret Atwood', 'Neil Gaiman', 'Gillian Flynn',
      'John Green', 'Rainbow Rowell', 'Colleen Hoover', 'Taylor Jenkins Reid',
      'Delia Owens', 'Kristin Hannah', 'Agatha Christie', 'Dan Brown'
    ];

    for (const author of popularAuthors) {
      if (recs.length >= 12) break;

      try {
        const encodedQuery = encodeURIComponent(`inauthor:"${author}"`);
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=8&printType=books&orderBy=relevance&filter=partial`,
        );

        const data = await response.json();
        if (data.items) {
          for (const book of data.items) {
            if (recs.length >= 12) break;
            addBookIfNew(book);
          }
        }
      } catch (err) {
        console.warn('Ricerca per autore fallita per', author, err);
      }
    }
  }

  console.log(`Generate ${recs.length} raccomandazioni complete da ${selectedGenres.length} generi selezionati`);

  // Salva le raccomandazioni in AsyncStorage solo se abbiamo un numero minimo di libri completi
  if (recs.length >= 5) {
    await AsyncStorage.setItem(
      'firstLaunchRecommendations',
      JSON.stringify(recs.slice(0, 10)), // Limite massimo di 10 libri per performance
    );
  } else {
    console.warn('Non trovate abbastanza raccomandazioni complete, salvataggio saltato');
  }
}
