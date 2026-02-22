const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'financial.db');
const SCHEMA_PATH = path.join(__dirname, 'extended-schema.sql');

console.log('🔄 Migrating portfolio data to database...\n');

const db = new sqlite3.Database(DB_PATH);

// Read and execute extended schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

db.serialize(() => {
    // Create new tables
    db.exec(schema, (err) => {
        if (err) {
            console.error('❌ Error creating schema:', err);
            process.exit(1);
        }
        console.log('✅ Extended schema created');
    });

    // Portfolio configuration data (from ETFS array in App.tsx)
    const portfolioConfig = [
        { ticker: "VOO", name: "S&P 500", weight: 45, h5: 14.5, h10: 15.8, y25: 25.0, proj: 22, div: 1.1, color: "#3B82F6", type: "Core", lump: 6827 },
        { ticker: "SCHD", name: "Dividend", weight: 15, h5: 11.1, h10: 13.6, y25: 18.6, proj: 18, div: 3.3, color: "#10B981", type: "Dividend", lump: 2276 },
        { ticker: "QQQ", name: "Nasdaq 100", weight: 10, h5: 20.0, h10: 18.3, y25: 25.6, proj: 20, div: 0.5, color: "#8B5CF6", type: "Tech/AI", lump: 1517 },
        { ticker: "PAVE", name: "Infrastructure", weight: 10, h5: 18.5, h10: 0, y25: 19.4, proj: 18, div: 0.5, color: "#F97316", type: "Thematic", lump: 1517 },
        { ticker: "VXUS", name: "International", weight: 10, h5: 9.2, h10: 9.8, y25: 32.4, proj: 14, div: 3.2, color: "#F59E0B", type: "Intl", lump: 1517 },
        { ticker: "XLU", name: "Utilities", weight: 5, h5: 10.0, h10: 9.5, y25: 22.0, proj: 17, div: 2.7, color: "#06B6D4", type: "AI Power", lump: 759 },
        { ticker: "AMZN", name: "Amazon", weight: 3, h5: 18.0, h10: 25.0, y25: 49.0, proj: 25, div: 0, color: "#EC4899", type: "Growth", lump: 455 },
        { ticker: "KO", name: "Coca-Cola", weight: 2, h5: 8.0, h10: 9.0, y25: 6.0, proj: 10, div: 2.8, color: "#EF4444", type: "Defensive", lump: 303 },
    ];

    const portfolioStmt = db.prepare(`
        INSERT OR REPLACE INTO portfolio_config
        (ticker, name, weight, hist_5yr, hist_10yr, ytd_2025, projected_return, dividend_yield, color, type, lump_sum_allocation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    portfolioConfig.forEach(etf => {
        portfolioStmt.run(
            etf.ticker, etf.name, etf.weight, etf.h5, etf.h10, etf.y25,
            etf.proj, etf.div, etf.color, etf.type, etf.lump
        );
    });
    portfolioStmt.finalize();
    console.log(`✅ Inserted ${portfolioConfig.length} portfolio configurations`);

    // Initialize holdings (empty initially)
    const holdingsStmt = db.prepare(`
        INSERT OR REPLACE INTO holdings (ticker, shares, cost_basis, color)
        VALUES (?, ?, ?, ?)
    `);

    portfolioConfig.forEach(etf => {
        holdingsStmt.run(etf.ticker, 0, etf.lump, etf.color);
    });
    holdingsStmt.finalize();
    console.log(`✅ Initialized ${portfolioConfig.length} holdings records`);

    // Initialize accounts (ESOP, 401k, HSA)
    const accountsStmt = db.prepare(`
        INSERT OR REPLACE INTO accounts (account_type, balance, shares, fmv)
        VALUES (?, ?, ?, ?)
    `);

    // Default values from App.tsx extra state
    accountsStmt.run('esop', 0, 5092, 5.18); // ESOP: 5092 shares at $5.18
    accountsStmt.run('k401', 4054, null, null); // 401k: $4054
    accountsStmt.run('hsa', 254, null, null); // HSA: $254
    accountsStmt.finalize();
    console.log('✅ Initialized account balances');

    console.log('\n✨ Migration complete!');
    console.log('📍 Extended tables added to:', DB_PATH);
    console.log('\n💡 Next steps:');
    console.log('   1. Update API endpoints to serve portfolio/account data');
    console.log('   2. Update dashboard to fetch from API');
    console.log('   3. Remove hardcoded data from App.tsx\n');
});

db.close();
