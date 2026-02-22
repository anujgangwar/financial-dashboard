const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'financial.db');
const db = new sqlite3.Database(DB_PATH);

console.log('🔧 Fixing transaction categories and months...\n');

// Category mapping from current to expected
const categoryMap = {
    'Rent': 'rent',
    'Groceries': 'food',
    'Dining': 'dining',
    'Commute': 'commute',
    'Transportation': 'commute', // Uber, Lyft
    'Shopping': 'shopping',
    'Personal Care': 'personal',
    'Healthcare': 'health',
    'Utilities': 'utility',
    'Entertainment': 'drinks', // bars, entertainment
    'Cash': 'zelle',
    'Fees': 'other',
    'Other': 'other',
    'Flights': 'flights',
    'Phone': 'phone',
    'Subscriptions': 'subs',
    'Drinks': 'drinks'
};

// Month format mapping
const monthMap = {
    '2025-10': 'Oct 2025',
    '2025-11': 'Nov 2025',
    '2025-12': 'Dec 2025',
    '2026-01': 'Jan 2026',
    '2026-02': 'Feb 2026'
};

db.serialize(() => {
    // Update categories
    Object.entries(categoryMap).forEach(([oldCat, newCat]) => {
        db.run(
            'UPDATE transactions SET category = ? WHERE category = ?',
            [newCat, oldCat],
            function(err) {
                if (err) {
                    console.error(`Error updating ${oldCat}:`, err);
                } else if (this.changes > 0) {
                    console.log(`✓ Updated ${this.changes} transactions: ${oldCat} → ${newCat}`);
                }
            }
        );
    });

    // Update month format
    Object.entries(monthMap).forEach(([oldMonth, newMonth]) => {
        db.run(
            'UPDATE transactions SET month = ? WHERE month = ?',
            [newMonth, oldMonth],
            function(err) {
                if (err) {
                    console.error(`Error updating ${oldMonth}:`, err);
                } else if (this.changes > 0) {
                    console.log(`✓ Updated ${this.changes} transactions: ${oldMonth} → ${newMonth}`);
                }
            }
        );
    });

    // Wait a bit then verify
    setTimeout(() => {
        console.log('\n📊 Verification:');
        db.all('SELECT DISTINCT category FROM transactions ORDER BY category', (err, rows) => {
            if (!err) {
                console.log('\nCategories:', rows.map(r => r.category).join(', '));
            }
        });
        db.all('SELECT DISTINCT month FROM transactions ORDER BY month', (err, rows) => {
            if (!err) {
                console.log('Months:', rows.map(r => r.month).join(', '));
            }
        });

        setTimeout(() => {
            console.log('\n✅ Category and month format fixed!');
            db.close();
        }, 500);
    }, 1000);
});
