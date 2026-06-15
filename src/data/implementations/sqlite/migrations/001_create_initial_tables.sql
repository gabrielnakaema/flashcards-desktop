PRAGMA foreign_keys = ON;

CREATE TABLE deck_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE decks (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL REFERENCES deck_categories(id),
  title TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  front TEXT NOT NULL,
  back TEXT,
  content TEXT NOT NULL DEFAULT '{}',
  hint TEXT,
  explanation TEXT,
  source_excerpt TEXT,
  difficulty TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  is_suspended INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE card_schedules (
  card_id TEXT PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'new',
  due_at TEXT,
  interval_days REAL NOT NULL DEFAULT 0,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  repetition_count INTEGER NOT NULL DEFAULT 0,
  lapse_count INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE review_logs (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  deck_id TEXT NOT NULL,
  rating TEXT NOT NULL,
  response TEXT,
  was_correct INTEGER,
  reviewed_at TEXT NOT NULL,
  previous_due_at TEXT,
  next_due_at TEXT,
  elapsed_ms INTEGER
);
