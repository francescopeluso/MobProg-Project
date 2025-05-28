/**
 * @file src/services/profileService.ts
 * @description Funzioni per la gestione delle sessioni di lettura e del profilo utente.
 * 
 *  In questo file definiamo le funzioni per effettuare:
 *    - gestione delle sessioni di lettura (start, end, delete)
 *    - calcolo durate e tracking temporale
 *    - associazione libri a sessioni
 *    - aggiornamento stato di lettura
 */

import { getDBConnection } from '../utils/database';

/** Interfaccia per le righe delle sessioni di lettura */
interface SessionRow {
  id: number;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  book_id: number | null;
  status: string;
}

/**
 * 
 * @function getActiveSessionId
 * @description Verifica se esiste una sessione di lettura attiva (senza end_time).
 * @returns {Promise<number | null>} ID della sessione attiva o null se non presente
 * @async
 */
export async function getActiveSessionId(): Promise<number | null> {
  const db = getDBConnection();
  const firstRow = await db.getFirstAsync(
    'SELECT id FROM reading_sessions WHERE end_time IS NULL LIMIT 1'
  ) as SessionRow | null;
  return firstRow ? firstRow.id : null;
}

/**
 * 
 * @function startSession
 * @description Avvia una nuova sessione di lettura o riutilizza quella esistente se già attiva.
 * @returns {Promise<number>} ID della sessione avviata o riutilizzata
 * @async
 */
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

/**
 * 
 * @function endSession
 * @param id ID della sessione da terminare
 * @description Termina una sessione di lettura impostando l'end_time e calcola la durata totale.
 * @returns {Promise<number>} Durata della sessione in secondi
 * @async
 */
export async function endSession(id: number): Promise<number> {
  const db = getDBConnection();
  const startRow = await db.getFirstAsync(
    'SELECT start_time FROM reading_sessions WHERE id = ?',
    id
  );
  if (!startRow) throw new Error('Sessione non trovata');

  const endISO = new Date().toISOString();

  // aggiorna solo end_time
  await db.runAsync(
    'UPDATE reading_sessions SET end_time = ? WHERE id = ?',
    endISO,
    id
  );

  const row = await db.getFirstAsync(
    'SELECT duration FROM reading_sessions WHERE id = ?',
    id
  ) as SessionRow | null;
  return row ? row.duration as number : 0;
}

/**
 * 
 * @function deleteSession
 * @param id ID della sessione da eliminare
 * @description Elimina completamente una sessione di lettura dal database.
 * @returns {Promise<void>}
 * @async
 */
export async function deleteSession(id: number) {
  const db = getDBConnection();
  await db.runAsync('DELETE FROM reading_sessions WHERE id = ?', id);
}

/**
 * 
 * @function getDurationToNow
 * @param id ID della sessione di cui calcolare la durata
 * @description Calcola la durata di una sessione attiva dal momento di inizio fino ad ora.
 * @returns {Promise<number>} Durata in secondi dall'inizio della sessione ad ora
 * @async
 */
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

/**
 * 
 * @function saveSessionWithBook
 * @param sessionId ID della sessione da associare al libro
 * @param bookId ID del libro da associare alla sessione
 * @param markCompleted Se true, marca il libro come completato, altrimenti come in lettura
 * @description Salva l'associazione tra sessione e libro e aggiorna lo stato di lettura del libro.
 * @returns {Promise<void>}
 * @async
 */
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

/**
 * 
 * @function getEligibleBooks
 * @description Restituisce i libri che possono essere associati a una sessione (con stato 'to_read' o 'reading').
 * @returns {Promise<{ id: number; title: string; status: string }[]>} Array di libri associabili con id, titolo e stato
 * @async
 */
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
