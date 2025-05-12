// src/services/profileService.ts
import { getDBConnection } from '../../utils/database';

/** ID sessione aperta o null */
interface SessionRow {
  id: number;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  book_id: number | null;
  status: string;
}

export async function getActiveSessionId(): Promise<number | null> {
  const db = getDBConnection();
  const firstRow = await db.getFirstAsync(
    'SELECT id FROM reading_sessions WHERE end_time IS NULL LIMIT 1'
  ) as SessionRow | null;
  return firstRow ? firstRow.id : null;
}

/** Avvia o riusa la sessione */
export async function startSession(): Promise<number> {
  const db = getDBConnection();
  const existing = await getActiveSessionId();
  if (existing) return existing;

  const now = new Date().toISOString();
  const res = await db.runAsync(
    'INSERT INTO reading_sessions (book_id, start_time) VALUES (?, ?)',
    null,
    now
  );
  return res.lastInsertRowId as number;
}

/** Termina la sessione e restituisce la durata (s) */
export async function endSession(id: number): Promise<number> {
  const db = getDBConnection();
  const startRow = await db.getFirstAsync(
    'SELECT start_time FROM reading_sessions WHERE id = ?',
    id
  );
  if (!startRow) throw new Error('Sessione non trovata');

  const endISO = new Date().toISOString();

  // 1️⃣  aggiorna solo end_time
  await db.runAsync(
    'UPDATE reading_sessions SET end_time = ? WHERE id = ?',
    endISO,
    id
  );

  // 2️⃣  ora SQLite ha calcolato duration: la recupero
  const row = await db.getFirstAsync(
    'SELECT duration FROM reading_sessions WHERE id = ?',
    id
  ) as SessionRow | null;
  return row ? row.duration as number : 0;
}

/** Annulla sessione */
export async function deleteSession(id: number) {
  const db = getDBConnection();
  await db.runAsync('DELETE FROM reading_sessions WHERE id = ?', id);
}

/** Restituisce la durata della sessione in secondi */
export async function getDurationToNow(id: number): Promise<number> {
  const db = getDBConnection();
  const row = await db.getFirstAsync(
    'SELECT start_time FROM reading_sessions WHERE id = ?',
    id
  ) as SessionRow | null;
  if (!row) throw new Error('Sessione non trovata');
  if (row.start_time === null) throw new Error('Sessione non avviata');
  const start = new Date(row.start_time);
  const now = new Date();
  const duration = Math.floor((now.getTime() - start.getTime()) / 1000);
  return duration;
}

/** Salva e aggiorna reading_status */
export async function saveSessionWithBook(
  sessionId: number,
  bookId: number,
  markCompleted: boolean
) {
  const db = getDBConnection();
  await db.runAsync(
    'UPDATE reading_sessions SET book_id = ? WHERE id = ?',
    bookId,
    sessionId
  );

  if (markCompleted) {
    await db.runAsync(
      `UPDATE reading_status
         SET status = 'completed', end_time = datetime('now')
       WHERE book_id = ?`,
      bookId
    );
  } else {
    await db.runAsync(
      `UPDATE reading_status
         SET status = 'reading',
             start_time = COALESCE(start_time, datetime('now'))
       WHERE book_id = ?`,
      bookId
    );
  }
}

/** Libri associabili */
export async function getEligibleBooks(): Promise<
  { id: number; title: string; status: string }[]
> {
  const db = getDBConnection();
  return await db.getAllAsync(
    `SELECT b.id, b.title, rs.status
       FROM books b
       JOIN reading_status rs ON b.id = rs.book_id
      WHERE rs.status IN ('to_read','reading')
   ORDER BY b.title`
  );
}
