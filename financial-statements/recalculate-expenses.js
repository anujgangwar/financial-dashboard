const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'financial.db');
const db = new sqlite3.Database(DB_PATH);

console.log('🔄 Recalculating expense totals from transactions...\n');

const months = ['Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026'];
const categories = ['rent', 'food', 'dining', 'commute', 'flights', 'phone', 'utility', 'shopping', 'personal', 'subs', 'zelle', 'drinks', 'health', 'other'];

db.serialize(() => {
    months.forEach(month => {
        // Get transaction totals for each category
        const query = `
            SELECT category, ROUND(SUM(amount), 2) as total
            FROM transactions
            WHERE month = ?
            GROUP BY category
        `;

        db.all(query, [month], (err, rows) => {
            if (err) {
                console.error(`Error querying ${month}:`, err);
                return;
            }

            // Build category totals object
            const totals = {};
            categories.forEach(cat => totals[cat] = 0);
            rows.forEach(row => {
                if (categories.includes(row.category)) {
                    totals[row.category] = row.total;
                }
            });

            // Update expenses table
            const updateQuery = `
                UPDATE expenses
                SET rent = ?, food = ?, dining = ?, commute = ?, flights = ?,
                    phone = ?, utility = ?, shopping = ?, personal = ?, subs = ?,
                    zelle = ?, drinks = ?, health = ?, other = ?
                WHERE month = ?
            `;

            db.run(updateQuery, [
                totals.rent, totals.food, totals.dining, totals.commute, totals.flights,
                totals.phone, totals.utility, totals.shopping, totals.personal, totals.subs,
                totals.zelle, totals.drinks, totals.health, totals.other,
                month
            ], function(err) {
                if (err) {
                    console.error(`Error updating ${month}:`, err);
                } else {
                    console.log(`✅ Updated ${month}:`, {
                        rent: totals.rent,
                        food: totals.food,
                        dining: totals.dining,
                        commute: totals.commute,
                        shopping: totals.shopping,
                        total: Object.values(totals).reduce((a, b) => a + b, 0).toFixed(2)
                    });
                }
            });
        });
    });

    setTimeout(() => {
        console.log('\n✨ Expense totals recalculated from transactions!');
        db.close();
    }, 2000);
});
