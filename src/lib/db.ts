import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data')
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
    console.log('Created data directory at:', dataDir)
  }
} catch (error) {
  console.error('Failed to create data directory:', error)
  throw error
}

const dbPath = path.join(dataDir, 'database.sqlite')
console.log('Database path:', dbPath)

// Initialize database
let db: Database.Database
try {
  db = new Database(dbPath)
  console.log('Database initialized successfully')
} catch (error) {
  console.error('Failed to initialize database:', error)
  throw error
}

// Enable foreign keys
db.pragma('foreign_keys = ON')

// Helper function to run queries with better error handling
export function query<T = any>(sql: string, params: any[] = []): T[] {
  try {
    const stmt = db.prepare(sql)
    return stmt.all(params) as T[]
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Helper function to run a single query (for inserts, updates, deletes)
export function execute(sql: string, params: any[] = []): Database.RunResult {
  try {
    const stmt = db.prepare(sql)
    return stmt.run(params)
  } catch (error) {
    console.error('Database execute error:', error)
    throw error
  }
}

// Helper function to get a single row
export function get<T = any>(sql: string, params: any[] = []): T | undefined {
  try {
    const stmt = db.prepare(sql)
    return stmt.get(params) as T | undefined
  } catch (error) {
    console.error('Database get error:', error)
    throw error
  }
}

// Helper function to ensure default boards exist
function ensureDefaultBoards() {
  const defaultBoards = [
    { id: 'b', name: 'Random' },
    { id: 'a', name: 'Anime & Manga' }
  ]

  for (const board of defaultBoards) {
    const existingBoard = get('SELECT id FROM boards WHERE id = ?', [board.id])
    if (!existingBoard) {
      execute('INSERT INTO boards (id, name) VALUES (?, ?)', [board.id, board.name])
    }
  }
}

// Helper function to initialize tables
export function initTables() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        board_id TEXT NOT NULL,
        parent_id INTEGER,
        message TEXT NOT NULL,
        creation_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id),
        FOREIGN KEY (parent_id) REFERENCES posts(id)
      );

      -- Trigger to automatically update the update_time when a post is modified
      CREATE TRIGGER IF NOT EXISTS update_post_timestamp 
      AFTER UPDATE ON posts
      BEGIN
        UPDATE posts SET update_time = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
      END;
    `)
    console.log('Database tables initialized successfully')

    // Ensure default boards exist after tables are created
    ensureDefaultBoards()
    console.log('Default boards ensured')
  } catch (error) {
    console.error('Failed to initialize database tables:', error)
    throw error
  }
}

// Initialize tables when the module is imported
initTables()

// Export the database instance in case it's needed directly
export { db } 