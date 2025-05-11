import * as SQLite from 'expo-sqlite';

export const getDBConnection = () => {
  return SQLite.openDatabaseSync('myapp.db');
};

export const createTables = async (db: SQLite.SQLiteDatabase) => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER
      );
    `);
    console.log('Table created successfully');
  } catch (error) {
    console.error('Create table error:', error);
    throw error;
  }
};