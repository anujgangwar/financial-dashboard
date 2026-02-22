-- Extended Financial Dashboard Database Schema
-- For Portfolio, ESOP, Holdings, and Snapshots

-- Portfolio allocation and ETF configuration
CREATE TABLE IF NOT EXISTS portfolio_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    weight REAL NOT NULL,
    hist_5yr REAL,
    hist_10yr REAL,
    ytd_2025 REAL,
    projected_return REAL,
    dividend_yield REAL,
    color TEXT,
    type TEXT,
    lump_sum_allocation REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Current holdings (shares owned)
CREATE TABLE IF NOT EXISTS holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL UNIQUE,
    shares REAL NOT NULL DEFAULT 0,
    cost_basis REAL NOT NULL DEFAULT 0,
    color TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Current ETF prices
CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    price REAL NOT NULL,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster price lookups
CREATE INDEX IF NOT EXISTS idx_prices_ticker ON prices(ticker);
CREATE INDEX IF NOT EXISTS idx_prices_fetched_at ON prices(fetched_at DESC);

-- ESOP and other accounts
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_type TEXT NOT NULL UNIQUE, -- 'esop', 'k401', 'hsa'
    balance REAL NOT NULL DEFAULT 0,
    shares REAL, -- for ESOP
    fmv REAL, -- fair market value per share for ESOP
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historical snapshots
CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_date TEXT NOT NULL UNIQUE,
    etf_value REAL NOT NULL,
    total_cost REAL NOT NULL,
    total_wealth REAL NOT NULL,
    k401_balance REAL,
    hsa_balance REAL,
    esop_value REAL,
    prices_json TEXT, -- JSON string of prices at snapshot time
    extra_json TEXT, -- JSON string of extra data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
