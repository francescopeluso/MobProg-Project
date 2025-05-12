import * as SQLite from 'expo-sqlite';

// Singleton pattern for database connection
let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDBConnection = () => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('myapp.db');
    console.log('Database path:', dbInstance.databasePath);
  }
  return dbInstance;
};

export const createTables = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // Enable foreign keys
    await db.execAsync(`PRAGMA foreign_keys = ON;`);

    // Table: authors
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS authors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        bio TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Table: books
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        cover_url TEXT,
        publication INTEGER,
        author_id INTEGER NOT NULL,
        isbn10 TEXT CHECK(length(isbn10) = 10 OR isbn10 IS NULL),
        isbn13 TEXT CHECK(length(isbn13) = 13 OR isbn13 IS NULL),
        external_source TEXT NOT NULL DEFAULT 'manual'
          CHECK(external_source IN ('manual','google','openlibrary')),
        external_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(author_id) REFERENCES authors(id)
          ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);

    // Trigger: auto-create reading_status on new book
    await db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS trg_after_book_insert
      AFTER INSERT ON books
      FOR EACH ROW
      BEGIN
        INSERT OR IGNORE INTO reading_status (book_id) VALUES (NEW.id);
      END;
    `);

    // Table: genres
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS genres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Junction: book_genres
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

    // Table: reading_status
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

    // Table: reading_sessions
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

    // Table: notes
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        book_id INTEGER PRIMARY KEY,
        notes_text TEXT,
        FOREIGN KEY(book_id) REFERENCES books(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Table: ratings
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

    // Table: favorites
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS favorites (
        book_id INTEGER PRIMARY KEY,
        added_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(book_id) REFERENCES books(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Table: wishlist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS wishlist (
        book_id INTEGER PRIMARY KEY,
        added_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(book_id) REFERENCES books(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Table: lists
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Junction: list_items
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