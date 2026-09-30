import * as SQLite from 'expo-sqlite';

export const dbPromise = SQLite.openDatabaseAsync('photoflow.db');

export const initDatabase = async (): Promise<void> => {
  const db = await dbPromise;

  await db.execAsync('PRAGMA foreign_keys = ON;');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS media_items(
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      image_uri TEXT,
      file_uri TEXT,
      file_name TEXT,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 1
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_actions(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Database created / updated");
};