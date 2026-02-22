const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'financial.db');
const SCHEMA_PATH = path.join(__dirname, 'database-schema.sql');
const DATA_PATH = path.join(__dirname, 'data.json');

// Initialize database
console.log('📊 Initializing Financial Database...\n');

// Remove old database if exists
if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('🗑️  Removed old database');
}

const db = new sqlite3.Database(DB_PATH);

// Read and execute schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

db.serialize(() => {
    // Create tables
    db.exec(schema, (err) => {
        if (err) {
            console.error('❌ Error creating schema:', err);
            process.exit(1);
        }
        console.log('✅ Database schema created');
    });

    // Load existing data from data.json
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

    // Insert income data
    const incomeStmt = db.prepare(`
        INSERT INTO income (month, gross, net, taxes, k401, hsa, benefits, reimb, perchpeek, saved_to_account)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    data.income.forEach(inc => {
        incomeStmt.run(
            inc.mo,
            inc.gross,
            inc.net,
            inc.taxes,
            inc.k401,
            inc.hsa,
            inc.benefits,
            inc.reimb,
            inc.perchpeek,
            inc.savedToAccount
        );
    });
    incomeStmt.finalize();
    console.log(`✅ Inserted ${data.income.length} income records`);

    // Insert expense data
    const expenseStmt = db.prepare(`
        INSERT INTO expenses (month, rent, food, dining, commute, flights, phone, utility, shopping, personal, subs, zelle, drinks, health, other)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    data.expenses.forEach(exp => {
        expenseStmt.run(
            exp.mo,
            exp.rent,
            exp.food,
            exp.dining,
            exp.commute,
            exp.flights,
            exp.phone,
            exp.utility,
            exp.shopping,
            exp.personal,
            exp.subs,
            exp.zelle,
            exp.drinks,
            exp.health,
            exp.other
        );
    });
    expenseStmt.finalize();
    console.log(`✅ Inserted ${data.expenses.length} expense records`);

    console.log('\n✨ Database initialized successfully!');
    console.log(`📍 Database location: ${DB_PATH}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Run: node parse-transactions.js (to extract transaction details from PDFs)');
    console.log('   2. Run: node start-server.js (to start the API server)');
    console.log('   3. Update dashboard to fetch from http://localhost:3001/api/data\n');
});

db.close();
