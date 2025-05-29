-- --------------------------------------------------
-- Abilitiamo il supporto ai vincoli di integrità
-- referenziale nel database SQLite
-- --------------------------------------------------

PRAGMA foreign_keys = ON;

-- --------------------------------------------------
-- Table: authors
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS authors (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  bio         TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_author_name
  ON authors(name);

-- --------------------------------------------------
-- Table: books
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  title            TEXT    NOT NULL,
  description      TEXT,
  cover_url        TEXT,
  editor           TEXT,
  publication      INTEGER,
  language         TEXT,
  isbn10           TEXT    CHECK(length(isbn10) = 10 OR isbn10 IS NULL),
  isbn13           TEXT    CHECK(length(isbn13) = 13 OR isbn13 IS NULL),
  external_source  TEXT    NOT NULL DEFAULT 'manual' 
                         CHECK(external_source IN ('manual','google','openlibrary')),
  external_id      TEXT,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_book_title
  ON books(title);
CREATE INDEX IF NOT EXISTS idx_book_created_at
  ON books(created_at);

-- --------------------------------------------------
-- Junction: book_authors (books ↔ authors M:N)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS book_authors (
  book_id   INTEGER NOT NULL,
  author_id INTEGER NOT NULL,
  PRIMARY KEY (book_id, author_id),
  FOREIGN KEY(book_id) REFERENCES books(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY(author_id) REFERENCES authors(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- --------------------------------------------------
-- Trigger: auto-create reading_status on new book
-- --------------------------------------------------
CREATE TRIGGER IF NOT EXISTS trg_after_book_insert
AFTER INSERT ON books
FOR EACH ROW
BEGIN
  INSERT OR IGNORE INTO reading_status(book_id) VALUES (NEW.id);
END;

-- --------------------------------------------------
-- Table: genres
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS genres (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL UNIQUE,
  description TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- --------------------------------------------------
-- Junction: book_genres (books ↔ genres M:N)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS book_genres (
  book_id   INTEGER NOT NULL,
  genre_id  INTEGER NOT NULL,
  PRIMARY KEY (book_id, genre_id),
  FOREIGN KEY(book_id) REFERENCES books(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY(genre_id) REFERENCES genres(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- --------------------------------------------------
-- Table: reading_status (1 row per book)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS reading_status (
  book_id    INTEGER PRIMARY KEY,
  status     TEXT    NOT NULL DEFAULT 'to_read'
                    CHECK(status IN ('to_read','reading','completed')),
  start_time TEXT,
  end_time   TEXT,
  FOREIGN KEY(book_id) REFERENCES books(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reading_status
  ON reading_status(status);
CREATE INDEX IF NOT EXISTS idx_reading_end_time
  ON reading_status(end_time);

-- --------------------------------------------------
-- Table: reading_sessions (history of sessions)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS reading_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id     INTEGER NOT NULL,
  start_time  TEXT    NOT NULL,
  end_time    TEXT,
  duration    INTEGER GENERATED ALWAYS AS (
                 strftime('%s', end_time)
                 - strftime('%s', start_time)
               ) STORED,
  FOREIGN KEY(book_id) REFERENCES books(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_book
  ON reading_sessions(book_id);

-- --------------------------------------------------
-- Table: notes (one-to-one per book)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  book_id    INTEGER PRIMARY KEY,
  notes_text TEXT,
  FOREIGN KEY(book_id) REFERENCES books(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- --------------------------------------------------
-- Table: ratings (mandatory stars + optional comment)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS ratings (
  book_id    INTEGER PRIMARY KEY,
  rating     INTEGER NOT NULL
                    CHECK(rating BETWEEN 1 AND 5),
  comment    TEXT,
  rated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(book_id) REFERENCES books(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rating_value
  ON ratings(rating);
CREATE INDEX IF NOT EXISTS idx_rating_rated_at
  ON ratings(rated_at);

-- --------------------------------------------------
-- Table: favorites (toggle)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS favorites (
  book_id    INTEGER PRIMARY KEY,
  added_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(book_id) REFERENCES books(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- --------------------------------------------------
-- Table: wishlist (toggle)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_title TEXT NOT NULL,
  added_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- --------------------------------------------------
-- Table: lists (custom lists)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS lists (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- --------------------------------------------------
-- Junction: list_items (lists ↔ books)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS list_items (
  list_id    INTEGER NOT NULL,
  book_id    INTEGER NOT NULL,
  added_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (list_id, book_id),
  FOREIGN KEY(list_id) REFERENCES lists(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY(book_id) REFERENCES books(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
