const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'financial.db');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database');
});

// Helper to promisify database queries
const dbAll = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// API Routes

// Get all financial data (income + expenses) - FROM LEDGER
app.get('/api/data', async (req, res) => {
    try {
        // Get income data from ledger
        const incomeData = await dbAll(`
            SELECT
                month,
                SUM(amount) as net
            FROM ledger
            WHERE category = 'income'
            GROUP BY month
            ORDER BY
                substr(month, -4) ||
                CASE substr(month, 1, 3)
                    WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03'
                    WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06'
                    WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09'
                    WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12'
                END
        `);

        // Get expense breakdown from ledger
        const expenseData = await dbAll(`
            SELECT
                month,
                subcategory,
                SUM(amount) as total
            FROM ledger
            WHERE category = 'expense'
            GROUP BY month, subcategory
            ORDER BY month, subcategory
        `);

        // Get savings from ledger
        const savingsData = await dbAll(`
            SELECT
                month,
                SUM(amount) as saved
            FROM ledger
            WHERE category = 'savings_transfer' AND type = 'debit'
            GROUP BY month
        `);

        // Get income details from income table for additional fields
        const incomeDetails = await dbAll(`
            SELECT * FROM income
            ORDER BY
                substr(month, -4) ||
                CASE substr(month, 1, 3)
                    WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03'
                    WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06'
                    WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09'
                    WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12'
                END
        `);

        // Build income array
        const formattedIncome = incomeDetails.map(row => ({
            mo: row.month,
            gross: row.gross,
            net: row.net,
            taxes: row.taxes,
            k401: row.k401,
            hsa: row.hsa,
            benefits: row.benefits,
            reimb: row.reimb,
            perchpeek: row.perchpeek,
            savedToAccount: row.saved_to_account
        }));

        // Build expenses array from ledger
        const expensesByMonth = {};
        expenseData.forEach(row => {
            if (!expensesByMonth[row.month]) {
                expensesByMonth[row.month] = {
                    mo: row.month,
                    rent: 0, food: 0, dining: 0, commute: 0, flights: 0,
                    phone: 0, utility: 0, shopping: 0, personal: 0, subs: 0,
                    zelle: 0, drinks: 0, health: 0, other: 0
                };
            }
            const category = row.subcategory;
            if (category in expensesByMonth[row.month]) {
                expensesByMonth[row.month][category] = row.total;
            }
        });

        // Sort expenses in same order as income
        const formattedExpenses = formattedIncome.map(inc => {
            return expensesByMonth[inc.mo] || {
                mo: inc.mo,
                rent: 0, food: 0, dining: 0, commute: 0, flights: 0,
                phone: 0, utility: 0, shopping: 0, personal: 0, subs: 0,
                zelle: 0, drinks: 0, health: 0, other: 0
            };
        });

        res.json({
            income: formattedIncome,
            expenses: formattedExpenses
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Get transactions for a specific month and category - FROM LEDGER
app.get('/api/transactions/:month/:category', async (req, res) => {
    try {
        const { month, category } = req.params;
        const transactions = await dbAll(
            'SELECT * FROM ledger WHERE month = ? AND subcategory = ? AND category = \'expense\' ORDER BY date DESC',
            [month, category]
        );
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Get all transactions for a month - FROM LEDGER
app.get('/api/transactions/:month', async (req, res) => {
    try {
        const { month } = req.params;
        const transactions = await dbAll(
            'SELECT * FROM ledger WHERE month = ? ORDER BY date DESC, category',
            [month]
        );
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Get portfolio configuration
app.get('/api/portfolio', async (req, res) => {
    try {
        const portfolio = await dbAll('SELECT * FROM portfolio_config ORDER BY weight DESC');
        res.json(portfolio);
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
});

// Get current holdings
app.get('/api/holdings', async (req, res) => {
    try {
        const holdings = await dbAll('SELECT * FROM holdings');
        res.json(holdings);
    } catch (error) {
        console.error('Error fetching holdings:', error);
        res.status(500).json({ error: 'Failed to fetch holdings' });
    }
});

// Update holdings
app.post('/api/holdings', async (req, res) => {
    try {
        const holdings = req.body; // Array of {ticker, shares, cost_basis}
        const stmt = db.prepare('UPDATE holdings SET shares = ?, cost_basis = ?, updated_at = CURRENT_TIMESTAMP WHERE ticker = ?');

        for (const holding of holdings) {
            stmt.run(holding.shares, holding.cost_basis, holding.ticker);
        }
        stmt.finalize();

        res.json({ success: true, message: 'Holdings updated' });
    } catch (error) {
        console.error('Error updating holdings:', error);
        res.status(500).json({ error: 'Failed to update holdings' });
    }
});

// Get accounts (ESOP, 401k, HSA)
app.get('/api/accounts', async (req, res) => {
    try {
        const accounts = await dbAll('SELECT * FROM accounts');
        const formatted = {};
        accounts.forEach(acc => {
            if (acc.account_type === 'esop') {
                formatted.esopShares = acc.shares;
                formatted.esopFmv = acc.fmv;
            } else if (acc.account_type === 'k401') {
                formatted.k401 = acc.balance;
            } else if (acc.account_type === 'hsa') {
                formatted.hsa = acc.balance;
            }
        });
        res.json(formatted);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

// Update accounts
app.post('/api/accounts', async (req, res) => {
    try {
        const { esopShares, esopFmv, k401, hsa } = req.body;

        if (esopShares !== undefined || esopFmv !== undefined) {
            db.run('UPDATE accounts SET shares = ?, fmv = ?, updated_at = CURRENT_TIMESTAMP WHERE account_type = ?',
                [esopShares, esopFmv, 'esop']);
        }
        if (k401 !== undefined) {
            db.run('UPDATE accounts SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE account_type = ?',
                [k401, 'k401']);
        }
        if (hsa !== undefined) {
            db.run('UPDATE accounts SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE account_type = ?',
                [hsa, 'hsa']);
        }

        res.json({ success: true, message: 'Accounts updated' });
    } catch (error) {
        console.error('Error updating accounts:', error);
        res.status(500).json({ error: 'Failed to update accounts' });
    }
});

// Get latest prices for all tickers
app.get('/api/prices', async (req, res) => {
    try {
        // Get latest price for each ticker
        const prices = await dbAll(`
            SELECT p1.ticker, p1.price, p1.fetched_at
            FROM prices p1
            INNER JOIN (
                SELECT ticker, MAX(fetched_at) as max_date
                FROM prices
                GROUP BY ticker
            ) p2 ON p1.ticker = p2.ticker AND p1.fetched_at = p2.max_date
        `);

        const priceMap = {};
        let lastFetch = null;
        prices.forEach(p => {
            priceMap[p.ticker] = p.price;
            if (!lastFetch || p.fetched_at > lastFetch) {
                lastFetch = p.fetched_at;
            }
        });

        res.json({ prices: priceMap, lastFetch });
    } catch (error) {
        console.error('Error fetching prices:', error);
        res.status(500).json({ error: 'Failed to fetch prices' });
    }
});

// Save new prices
app.post('/api/prices', async (req, res) => {
    try {
        const { prices } = req.body; // {VOO: 520.45, SCHD: 29.87, ...}
        const stmt = db.prepare('INSERT INTO prices (ticker, price) VALUES (?, ?)');

        for (const [ticker, price] of Object.entries(prices)) {
            stmt.run(ticker, price);
        }
        stmt.finalize();

        res.json({ success: true, message: 'Prices saved' });
    } catch (error) {
        console.error('Error saving prices:', error);
        res.status(500).json({ error: 'Failed to save prices' });
    }
});

// Get all snapshots
app.get('/api/snapshots', async (req, res) => {
    try {
        const snapshots = await dbAll('SELECT * FROM snapshots ORDER BY snapshot_date DESC');
        // Parse JSON fields
        const formatted = snapshots.map(snap => ({
            date: snap.snapshot_date,
            etfValue: snap.etf_value,
            totalCost: snap.total_cost,
            totalWealth: snap.total_wealth,
            prices: snap.prices_json ? JSON.parse(snap.prices_json) : {},
            extra: snap.extra_json ? JSON.parse(snap.extra_json) : {}
        }));
        res.json(formatted);
    } catch (error) {
        console.error('Error fetching snapshots:', error);
        res.status(500).json({ error: 'Failed to fetch snapshots' });
    }
});

// Save a new snapshot
app.post('/api/snapshots', async (req, res) => {
    try {
        const { date, etfValue, totalCost, totalWealth, prices, extra } = req.body;

        db.run(`
            INSERT OR REPLACE INTO snapshots
            (snapshot_date, etf_value, total_cost, total_wealth, k401_balance, hsa_balance, esop_value, prices_json, extra_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            date, etfValue, totalCost, totalWealth,
            extra.k401, extra.hsa, extra.esopShares * extra.esopFmv,
            JSON.stringify(prices), JSON.stringify(extra)
        ]);

        res.json({ success: true, message: 'Snapshot saved' });
    } catch (error) {
        console.error('Error saving snapshot:', error);
        res.status(500).json({ error: 'Failed to save snapshot' });
    }
});

// Get ESOP grants
app.get('/api/esop-grants', async (req, res) => {
    try {
        const grants = await dbAll('SELECT * FROM esop_grants ORDER BY status DESC, completion_date ASC');
        // Parse JSON fields
        const formatted = grants.map(grant => ({
            ...grant,
            vesting_schedule: grant.vesting_schedule_json ? JSON.parse(grant.vesting_schedule_json) : null
        }));
        res.json(formatted);
    } catch (error) {
        console.error('Error fetching ESOP grants:', error);
        res.status(500).json({ error: 'Failed to fetch ESOP grants' });
    }
});

// Update ESOP grant
app.post('/api/esop-grants/:grantId', async (req, res) => {
    try {
        const { grantId } = req.params;
        const { remaining_shares, status, notes } = req.body;

        db.run(`
            UPDATE esop_grants
            SET remaining_shares = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE grant_id = ?
        `, [remaining_shares, status, notes, grantId]);

        res.json({ success: true, message: 'Grant updated' });
    } catch (error) {
        console.error('Error updating ESOP grant:', error);
        res.status(500).json({ error: 'Failed to update grant' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: DB_PATH });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Financial Dashboard API Server`);
    console.log(`📍 Running on http://localhost:${PORT}`);
    console.log(`\n📊 Available endpoints:`);
    console.log(`   GET /api/data - All income and expenses`);
    console.log(`   GET /api/transactions/:month - All transactions for a month`);
    console.log(`   GET /api/transactions/:month/:category - Transactions by month and category`);
    console.log(`   GET /api/health - Server health check`);
    console.log(`\n💡 Update your dashboard to fetch from: http://localhost:${PORT}/api/data\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close((err) => {
        if (err) console.error('Error closing database:', err);
        else console.log('✅ Database connection closed');
        process.exit(0);
    });
});
