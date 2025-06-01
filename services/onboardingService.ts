import AsyncStorage from '@react-native-async-storage/async-storage';

/* Tipo usato dalla Home per visualizzare i consigliati -------------------- */
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
 * Calcola i consigliati per il primissimo accesso basandosi sui generi selezionati.
 * Garantisce che tutti i libri abbiano copertina, descrizione e tutti i campi necessari.
 */
export async function prepareInitialRecommendations(
  selectedGenres: string[],
): Promise<void> {
  if (!selectedGenres.length) return;

  const recs: RecommendedBook[] = [];
  const addedIds = new Set<string>(); // Per evitare duplicati

  // Funzione per verificare se un libro ha tutti i campi necessari
  const isCompleteBook = (book: any): boolean => {
    const volumeInfo = book.volumeInfo;
    const hasValidThumbnail = volumeInfo?.imageLinks?.thumbnail && 
                             volumeInfo.imageLinks.thumbnail.trim() !== '' && 
                             volumeInfo.imageLinks.thumbnail.startsWith('http');
    const hasDescription = volumeInfo?.description && 
                          volumeInfo.description.trim().length > 50; // Almeno 50 caratteri
    const hasTitle = volumeInfo?.title && volumeInfo.title.trim().length > 0;
    const hasAuthors = volumeInfo?.authors && volumeInfo.authors.length > 0;

    return hasValidThumbnail && hasDescription && hasTitle && hasAuthors;
  };

  // Funzione per aggiungere un libro alla lista se completo e non duplicato
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

  // Mappatura generi per query più specifiche
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
        console.warn('Genre search failed for', query, err);
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
        console.warn('Fallback search failed for', query, err);
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
        console.warn('Author search failed for', author, err);
      }
    }
  }

  console.log(`Generated ${recs.length} complete recommendations from ${selectedGenres.length} selected genres`);

  // Salva solo se abbiamo almeno 5 libri completi
  if (recs.length >= 5) {
    await AsyncStorage.setItem(
      'firstLaunchRecommendations',
      JSON.stringify(recs.slice(0, 10)), // Massimo 10 libri
    );
  } else {
    console.warn('Not enough complete recommendations found, skipping save');
  }
}
