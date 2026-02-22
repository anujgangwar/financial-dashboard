-- ESOP Grants Schema

CREATE TABLE IF NOT EXISTS esop_grants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grant_id TEXT NOT NULL UNIQUE,  -- ES-1432, ES-2857, ES-6251
    total_shares INTEGER NOT NULL,
    strike_price REAL NOT NULL,
    remaining_shares INTEGER NOT NULL,
    completion_date TEXT,  -- YYYY-MM-DD or NULL
    status TEXT NOT NULL,  -- 'active', 'completed', 'pending'
    monthly_vest INTEGER,  -- shares per month for active grants
    monthly_cost REAL,  -- $ cost per month
    return_pct REAL,  -- return percentage
    vest_start_date TEXT,  -- when vesting started
    notes TEXT,  -- additional info
    vesting_schedule_json TEXT,  -- JSON array of monthly vesting details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
