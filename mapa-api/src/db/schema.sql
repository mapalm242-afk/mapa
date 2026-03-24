PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS empresas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS setores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS gestores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'gestor' CHECK(role IN ('admin','gestor')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Anônimo: sem user_id por design
CREATE TABLE IF NOT EXISTS respostas_brutas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  setor_id INTEGER NOT NULL REFERENCES setores(id) ON DELETE CASCADE,
  respostas_json TEXT NOT NULL, -- JSON array of integers 1-5
  data_criacao TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS escalas_calculadas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  setor_id INTEGER NOT NULL REFERENCES setores(id) ON DELETE CASCADE,
  dimensao TEXT NOT NULL,
  score_medio REAL NOT NULL DEFAULT 0,
  nivel_risco TEXT NOT NULL DEFAULT 'Verde' CHECK(nivel_risco IN ('Verde','Amarelo','Vermelho')),
  total_respostas INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(setor_id, dimensao)
);
