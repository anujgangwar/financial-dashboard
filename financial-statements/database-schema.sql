-- Financial Dashboard Database Schema

-- Income table (monthly aggregated data)
CREATE TABLE IF NOT EXISTS income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT NOT NULL UNIQUE,
    gross INTEGER NOT NULL,
    net INTEGER NOT NULL,
    taxes INTEGER NOT NULL,
    k401 INTEGER NOT NULL,
    hsa INTEGER NOT NULL,
    benefits INTEGER NOT NULL,
    reimb INTEGER NOT NULL,
    perchpeek INTEGER NOT NULL,
    saved_to_account INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table (monthly aggregated by category)
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT NOT NULL UNIQUE,
    rent REAL NOT NULL,
    food REAL NOT NULL,
    dining REAL NOT NULL,
    commute REAL NOT NULL,
    flights REAL NOT NULL,
    phone REAL NOT NULL,
    utility REAL NOT NULL,
    shopping REAL NOT NULL,
    personal REAL NOT NULL,
    subs REAL NOT NULL,
    zelle REAL NOT NULL,
    drinks REAL NOT NULL,
    health REAL NOT NULL,
    other REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table (individual transaction details)
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    month TEXT NOT NULL,
    merchant TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_month ON transactions(month);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(source);
