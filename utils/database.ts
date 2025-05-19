import * as SQLite from 'expo-sqlite';

/**
 * Utilizziamo un pattern Singleton per la connessione al database
 * per evitare di aprire più connessioni, e per evitare di dover
 * passare il db come argomento a tutte le funzioni
 * che lo utilizzano
 */
let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Restituisce l'istanza del database SQLite.
 * Se non esiste, la crea e la restituisce.
 */
export const getDBConnection = () => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('myapp.db');
    console.log('Database path:', dbInstance.databasePath);
  }
  return dbInstance;
};

/**
 * Funzione utilizzata nella reinizializzazione del database.
 * Elimina tutte le tabelle (dunque anche i dati) e i trigger esistenti.
 */
export const dropTables = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // Disabilita il controllo delle chiavi esterne, in modo da non incorrere in errori durante il drop
    await db.execAsync(`PRAGMA foreign_keys = OFF;`);

    // Droppa tutte le tabelle e i trigger
    await db.execAsync(`DROP TABLE IF EXISTS book_authors;`);
    await db.execAsync(`DROP TABLE IF EXISTS authors;`);
    await db.execAsync(`DROP TABLE IF EXISTS books;`);
    await db.execAsync(`DROP TABLE IF EXISTS genres;`);
    await db.execAsync(`DROP TABLE IF EXISTS book_genres;`);
    await db.execAsync(`DROP TABLE IF EXISTS reading_status;`);
    await db.execAsync(`DROP TABLE IF EXISTS reading_sessions;`);
    await db.execAsync(`DROP TABLE IF EXISTS notes;`);
    await db.execAsync(`DROP TABLE IF EXISTS ratings;`);
    await db.execAsync(`DROP TABLE IF EXISTS favorites;`);
    await db.execAsync(`DROP TABLE IF EXISTS wishlist;`);
    await db.execAsync(`DROP TABLE IF EXISTS lists;`);
    await db.execAsync(`DROP TABLE IF EXISTS list_items;`);
    await db.execAsync(`DROP TRIGGER IF EXISTS trg_after_book_insert;`);

    console.log('All tables and triggers dropped successfully');
  } catch (error) {
    console.error('Error dropping database tables:', error);
    throw error;
  }
};


/**
 * Funzione utilizzata per creare le tabelle e i trigger del database.
 * Viene chiamata una sola volta all'avvio dell'app, o alla reinizializzazione.
 */
export const createTables = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // Abilita il controllo delle chiavi esterne, in modo da garantire l'integrità referenziale
    await db.execAsync(`PRAGMA foreign_keys = ON;`);

    // TABLE: Autori
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS authors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // TABLE: Libri
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        cover_url TEXT,
        editor TEXT,
        publication INTEGER,
        language TEXT,
        isbn10 TEXT CHECK(length(isbn10) = 10 OR isbn10 IS NULL),
        isbn13 TEXT CHECK(length(isbn13) = 13 OR isbn13 IS NULL),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // JUNCTION TABLE: Relazione molti-a-molti tra libri e autori
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS book_authors (
        book_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        PRIMARY KEY (book_id, author_id),
        FOREIGN KEY(book_id) REFERENCES books(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY(author_id) REFERENCES authors(id)
          ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);

    // TRIGGER: Creazione automatica dello stato di lettura per ogni nuovo libro (default è da leggere)
    await db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS trg_after_book_insert
      AFTER INSERT ON books
      FOR EACH ROW
      BEGIN
        INSERT OR IGNORE INTO reading_status (book_id) VALUES (NEW.id);
      END;
    `);

    // TABLE: Generi letterari
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS genres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // JUNCTION TABLE: Relazione molti-a-molti tra libri e generi
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS book_genres (
        book_id INTEGER NOT NULL,
        genre_id INTEGER NOT NULL,
        PRIMARY KEY (book_id, genre_id),
        FOREIGN KEY(book_id) REFERENCES books(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY(genre_id) REFERENCES genres(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // TABLE: Stato di lettura
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS reading_status (
        book_id INTEGER PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'to_read'
          CHECK(status IN ('to_read','reading','completed')),
        start_time TEXT,
        end_time TEXT,
        FOREIGN KEY(book_id) REFERENCES books(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // TABLE: Sessioni di lettura
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS reading_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER,
        start_time TEXT NOT NULL,
        end_time TEXT,
        duration INTEGER GENERATED ALWAYS AS (
          strftime('%s', end_time) - strftime('%s', start_time)
        ) STORED,
        FOREIGN KEY(book_id) REFERENCES books(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // TABLE: Note sui libri
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        book_id INTEGER PRIMARY KEY,
        notes_text TEXT,
        FOREIGN KEY(book_id) REFERENCES books(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // TABLE: Valutazioni personali dei libri
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ratings (
        book_id INTEGER PRIMARY KEY,
        rating INTEGER NOT NULL
          CHECK(rating BETWEEN 1 AND 5),
        comment TEXT,
        rated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(book_id) REFERENCES books(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // TABLE: Preferiti
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS favorites (
        book_id INTEGER PRIMARY KEY,
        added_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(book_id) REFERENCES books(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // TABLE: Wishlist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS wishlist (
        book_id INTEGER PRIMARY KEY,
        added_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(book_id) REFERENCES books(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // TABLE: Liste personalizzate
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // JUNCTION TABLE: Relazione molti-a-molti tra liste e libri
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS list_items (
        list_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        added_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (list_id, book_id),
        FOREIGN KEY(list_id) REFERENCES lists(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY(book_id) REFERENCES books(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log('All tables and triggers created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
};