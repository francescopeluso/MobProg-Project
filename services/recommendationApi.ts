/**
 * @file src/services/recommendationApi.ts
 * @description Funzioni per creare suggerimenti di libri da acquistare (aggiungere alla wishlist)
 * 
 * Tutte i suggerimenti verranno presi da Google Books API, in maniera casuale.
 * Le raccomandazioni saranno basate su autori, generi e libri simili.
 */

import { getDBConnection } from '../utils/database';
import { Book } from './bookApi';

/**
 * 
 * @function getAuthorRecommendations
 * @description Ottiene raccomandazioni di libri dello stesso autore
 * @param {string} authorName - Nome dell'autore per cui ottenere raccomandazioni
 * @returns {Promise<Book[]>} - Lista di libri raccomandati
 */
export const getAuthorRecommendations = async (authorName: string): Promise<Book[]> => {

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=inauthor:${encodeURIComponent(
        authorName
      )}&maxResults=40`
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

    // Prendo i titoli dei libri già presenti nel database
    const db = getDBConnection();
    const existingBooks = await db.getAllAsync(
      'SELECT title FROM books'
    ) as { title: string }[];

    const existingTitles = new Set(existingBooks.map((book: { title: string }) => book.title.toLowerCase()));
    const recommendations: Book[] = [];

    // Normalizzo il nome dell'autore per il confronto
    const normalizedAuthorName = authorName.toLowerCase().trim();

    for (const item of json.items) {
      const volumeInfo = item.volumeInfo;
      const title = volumeInfo.title;
      const authors = volumeInfo.authors || [];
      
      // Salta elementi senza titolo o con titoli non validi
      if (!title || title.trim().length < 2) {
        continue;
      }

      // Verifica che almeno uno degli autori corrisponda esattamente all'autore richiesto
      const hasMatchingAuthor = authors.some((author: string) => 
        author.toLowerCase().trim() === normalizedAuthorName
      );

      if (!hasMatchingAuthor) {
        continue;
      }
      
      if (!existingTitles.has(title.toLowerCase())) {
        // Creo l'oggetto Book completo usando la stessa logica di bookApi
        const book: Book = {
          title: title,
          authors: authors,
          editor: volumeInfo.publisher,
          publication: volumeInfo.publishedDate ? parseInt(volumeInfo.publishedDate) : undefined,
          description: volumeInfo.description,
          cover_url: volumeInfo.imageLinks?.thumbnail,
          isbn10: volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier,
          isbn13: volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier,
          language: volumeInfo.language,
          genres: volumeInfo.categories || []
        };
        
        recommendations.push(book);
      }
    }

    // Restituisco tutti i libri trovati per quello specifico autore (senza limite fisso)
    // Se non ci sono libri per quell'autore, restituisco array vuoto
    return recommendations;

  } catch (error) {
    console.error('Errore durante la ricerca su Google Books API: ', error);
    throw new Error('Impossibile completare la ricerca. Controlla la connessione internet e riprova.');
  }

}

/**
 * 
 * @function getGenreRecommendations
 * @description Ottiene raccomandazioni di libri basate su un genere specifico
 * @param {string} genre - Genere per cui ottenere raccomandazioni
 * @returns {Promise<Book[]>} - Lista di libri raccomandati
 */
export const getGenreRecommendations = async (genre: string): Promise<Book[]> => {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(
        genre
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

    // Prendo i titoli dei libri già presenti nel database
    const db = getDBConnection();
    const existingBooks = await db.getAllAsync(
      'SELECT title FROM books'
    ) as { title: string }[];

    const existingTitles = new Set(existingBooks.map((book: { title: string }) => book.title.toLowerCase()));
    const recommendations: Book[] = [];

    for (const item of json.items) {
      const volumeInfo = item.volumeInfo;
      const title = volumeInfo.title;
      
      // Salta elementi senza titolo o con titoli non validi
      if (!title || title.trim().length < 2) {
        continue;
      }
      
      if (!existingTitles.has(title.toLowerCase())) {
        // Creo l'oggetto Book completo usando la stessa logica di bookApi
        const book: Book = {
          title: title,
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
        
        recommendations.push(book);
      }
    }

    return recommendations.slice(0, 10); // Limito a 10 raccomandazioni

  } catch (error) {
    console.error('Errore durante la ricerca su Google Books API: ', error);
    throw new Error('Impossibile completare la ricerca. Controlla la connessione internet e riprova.');
  }
}

/**
 * 
 * @function getSimilarBookRecommendations
 * @description Ottiene raccomandazioni di libri simili a un titolo specifico
 * @param {string} bookTitle - Titolo del libro per cui ottenere raccomandazioni
 * @returns {Promise<Book[]>} - Lista di libri raccomandati
 */
export const getSimilarBookRecommendations = async (bookTitle: string): Promise<Book[]> => {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        bookTitle
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

    // Prendo i titoli dei libri già presenti nel database
    const db = getDBConnection();
    const existingBooks = await db.getAllAsync(
      'SELECT title FROM books'
    ) as { title: string }[];

    const existingTitles = new Set(existingBooks.map((book: { title: string }) => book.title.toLowerCase()));
    const recommendations: Book[] = [];

    for (const item of json.items) {
      const volumeInfo = item.volumeInfo;
      const title = volumeInfo.title;
      
      // Salta elementi senza titolo o con titoli non validi
      if (!title || title.trim().length < 2) {
        continue;
      }
      
      if (!existingTitles.has(title.toLowerCase())) {
        // Creo l'oggetto Book completo usando la stessa logica di bookApi
        const book: Book = {
          title: title,
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
        
        recommendations.push(book);
      }
    }

    return recommendations.slice(0, 10); // Limito a 10 raccomandazioni

  } catch (error) {
    console.error('Errore durante la ricerca su Google Books API: ', error);
    throw new Error('Impossibile completare la ricerca. Controlla la connessione internet e riprova.');
  }
}