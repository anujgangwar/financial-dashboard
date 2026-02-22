const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'financial.db');
const SCHEMA_PATH = path.join(__dirname, 'esop-grants-schema.sql');

console.log('🔄 Migrating ESOP grants data to database...\n');

const db = new sqlite3.Database(DB_PATH);

// Read and execute schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

db.serialize(() => {
    // Create table
    db.exec(schema, (err) => {
        if (err) {
            console.error('❌ Error creating schema:', err);
            process.exit(1);
        }
        console.log('✅ ESOP grants table created');
    });

    // ESOP grants data
    const grants = [
        {
            grant_id: 'ES-1432',
            total_shares: 5799,
            strike_price: 2.46,
            remaining_shares: 386,
            completion_date: '2026-05-31',
            status: 'active',
            monthly_vest: 129,
            monthly_cost: 317,
            return_pct: 110,
            vest_start_date: null,
            notes: '110% return. Completing soon.',
            vesting_schedule_json: JSON.stringify([
                { month: 'Mar 2026', shares: 129, cost: 317, gain: 351 },
                { month: 'Apr 2026', shares: 129, cost: 317, gain: 351 },
                { month: 'May 2026', shares: 128, cost: 315, gain: 348 }
            ])
        },
        {
            grant_id: 'ES-2857',
            total_shares: 390,
            strike_price: 4.01,
            remaining_shares: 460,
            completion_date: '2028-04-30',
            status: 'active',
            monthly_vest: 18,
            monthly_cost: 72,
            return_pct: 29,
            vest_start_date: null,
            notes: 'Exercise monthly as vested',
            vesting_schedule_json: null
        },
        {
            grant_id: 'ES-6251',
            total_shares: 12080,
            strike_price: 5.18,
            remaining_shares: 12080,
            completion_date: null,
            status: 'pending',
            monthly_vest: null,
            monthly_cost: null,
            return_pct: null,
            vest_start_date: '2026-10-01',
            notes: '25% vests Oct 1, 2026. Do NOT exercise until FMV rises above $5.18. Check back then with updated FMV.',
            vesting_schedule_json: null
        }
    ];

    const stmt = db.prepare(`
        INSERT OR REPLACE INTO esop_grants
        (grant_id, total_shares, strike_price, remaining_shares, completion_date, status,
         monthly_vest, monthly_cost, return_pct, vest_start_date, notes, vesting_schedule_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    grants.forEach(grant => {
        stmt.run(
            grant.grant_id,
            grant.total_shares,
            grant.strike_price,
            grant.remaining_shares,
            grant.completion_date,
            grant.status,
            grant.monthly_vest,
            grant.monthly_cost,
            grant.return_pct,
            grant.vest_start_date,
            grant.notes,
            grant.vesting_schedule_json
        );
    });
    stmt.finalize();

    console.log(`✅ Inserted ${grants.length} ESOP grants`);
    console.log('\n✨ Migration complete!');
    console.log('📍 ESOP grants added to:', DB_PATH);
    console.log('\n💡 Next steps:');
    console.log('   1. Add API endpoint: GET /api/esop-grants');
    console.log('   2. Update dashboard to fetch from API\n');
});

db.close();
