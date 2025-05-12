// src/services/bookApi.ts

/**
 * bookApi – wrapper minimale per cercare libri online (Google Books + Open Library)
 */
export interface RemoteBook {
  title: string;
  authors: string[];
  coverUrl?: string;
  published?: number;
  isbn10?: string;
  isbn13?: string;
  externalId: string;
  source: 'google' | 'openlibrary';
}

// converte item Google Books → RemoteBook
function googleToBook(item: any): RemoteBook {
  const v = item.volumeInfo || {};
  const industry = v.industryIdentifiers || [];
  return {
    title: v.title,
    authors: v.authors || [],
    coverUrl: v.imageLinks?.thumbnail,
    published: parseInt(v.publishedDate?.slice(0, 4)) || undefined,
    isbn10: industry.find((i: any) => i.type === 'ISBN_10')?.identifier,
    isbn13: industry.find((i: any) => i.type === 'ISBN_13')?.identifier,
    externalId: item.id,
    source: 'google',
  };
}

// converte doc OpenLibrary → RemoteBook
function olToBook(doc: any): RemoteBook {
  return {
    title: doc.title,
    authors: doc.author_name || [],
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
    published: doc.first_publish_year,
    isbn10: doc.isbn?.find((i: string) => i.length === 10),
    isbn13: doc.isbn?.find((i: string) => i.length === 13),
    externalId: doc.key,
    source: 'openlibrary',
  };
}

export async function searchRemoteBooks(query: string): Promise<RemoteBook[]> {
  if (!query.trim()) return [];
  try {
    console.log('searchRemoteBooks', query);
    // 1️⃣ Google Books
    const gRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`);
    const gJson = await gRes.json();
    const google = (gJson.items || []).map(googleToBook);

    // 2️⃣ Open Library (fallback)
    const olRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`);
    const olJson = await olRes.json();
    const ol = (olJson.docs || []).map(olToBook);

    // merge (dedup per ISBN/ID)
    const seen = new Set<string>();
    const out: RemoteBook[] = [];
    [...google, ...ol].forEach((b) => {
      const key = b.isbn13 || b.isbn10 || b.externalId;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(b);
      }
    });
    return out;
  } catch (err) {
    console.error('searchRemoteBooks error', err);
    return [];
  }
}

// ---------------- LOCAL SEARCH ------------------
import { getDBConnection } from '../../utils/database';
export interface LocalBook {
  id: number;
  title: string;
  author: string;
  coverUrl?: string;
  status: string;
}

export async function searchLocalBooks(query: string): Promise<LocalBook[]> {
  const db = getDBConnection();
  const rows = await db.getAllAsync(
    `SELECT b.id, b.title, a.name AS author, b.cover_url AS coverUrl, rs.status
       FROM books b
       JOIN authors a ON a.id = b.author_id
       JOIN reading_status rs ON rs.book_id = b.id
      WHERE b.title LIKE ? OR a.name LIKE ?
      ORDER BY b.title`,
    `%${query}%`,
    `%${query}%`
  );
  return rows as LocalBook[];
}

// -------------------------------------------------
