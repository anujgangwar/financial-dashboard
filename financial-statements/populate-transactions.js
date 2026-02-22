const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const sqlite3 = require('sqlite3').verbose();

// Database path
const DB_PATH = path.join(__dirname, 'financial.db');

// File paths
const BANK_STATEMENTS_DIR = path.join(__dirname, 'bank-statements');
const CREDIT_CARDS_DIR = path.join(__dirname, 'credit-cards');

// Category patterns
const CATEGORY_PATTERNS = {
    rent: /atlantic|lefrak|rent/i,
    food: /whole foods|trader joe|grocery|supermarket|acme|morton williams|prime food market|food market/i,
    dining: /chipotle|starbucks|restaurant|pizza|shake shack|burger|taco|subway|mcdonalds|dunkin|panera/i,
    commute: /path|mta|uber|lyft|parking|transit|paygo/i,
    flights: /united|southwest|american airlines|delta|jetblue|frontier|spirit airlines|airline/i,
    phone: /verizon|t-mobile|at&t|sprint|phone bill|wireless/i,
    utility: /pseg|electric|gas|internet|utilities|con edison|pge/i,
    shopping: /amazon|amzn\.com|target(?!.*grocery)|cvs|walgreens|walmart|bestbuy|retail/i,
    personal: /haircut|salon|barber|spa|personal care/i,
    subs: /netflix|spotify|apple.*subscription|hulu|disney|prime video|youtube premium/i,
    zelle: /zelle/i,
    drinks: /bar|liquor|wine|beer|alcohol|beverage|newport spirits/i,
    health: /doctor|physician|hospital|pharmacy|prescription|medical|health/i,
};

// Skip patterns - transactions to ignore
const SKIP_PATTERNS = [
    /deposit|credit/i,
    /payment.*credit card|cc payment|card payment|payment to chase card/i,
    /transfer.*from.*checking|transfer.*from.*savings/i,
    /transfer.*to.*sav|online transfer to sav/i,  // Skip savings transfers
    /reimbursement|navan|perchpeek|alphasense.*reimb/i,
    /interest|fee waived/i,
    /atm.*deposit/i,
    /real time transfer recd/i,
    /perchpeek ltd/i,
];

/**
 * Categorize a transaction based on merchant description
 */
function categorizeTransaction(merchant) {
    const lowerMerchant = merchant.toLowerCase();

    for (const [category, pattern] of Object.entries(CATEGORY_PATTERNS)) {
        if (pattern.test(merchant)) {
            return category;
        }
    }

    return 'other';
}

/**
 * Check if transaction should be skipped
 */
function shouldSkipTransaction(description) {
    return SKIP_PATTERNS.some(pattern => pattern.test(description));
}

/**
 * Extract month from date string (format: Oct 2025, Nov 2025, etc.)
 */
function getMonthFromDate(dateStr) {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Parse bank statement transactions
 */
function parseBankStatement(text, accountNumber) {
    const transactions = [];
    const lines = text.split('\n');

    // Extract statement year and month from date range (end date)
    let statementYear = 2025;
    let statementMonth = 12;
    const dateRangeMatch = text.match(/(\w+)\s+\d{2},\s+(\d{4})\s*through\s*(\w+)\s+\d{2},\s+(\d{4})/i);
    if (dateRangeMatch) {
        const endMonth = dateRangeMatch[3];
        statementYear = parseInt(dateRangeMatch[4]);
        const monthMap = { 'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
                          'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12 };
        statementMonth = monthMap[endMonth] || 12;
    }

    // Process each line
    for (const line of lines) {
        // Format: MM/DDDescription-AmountBalance
        // Example: 10/06Card Purchase           10/03 Chipotle 2627 Jersey City NJ Card 9231-9.972,047.53

        // Match pattern: starts with MM/DD, ends with -Amount and Balance
        const match = line.match(/^(\d{2}\/\d{2})(.+?)-([\d,]+\.\d{2})([\d,]+\.\d{2})$/);

        if (!match) continue;

        const [_, dateStr, description, amount, balance] = match;
        const fullDescription = description.trim();

        // Skip if matches skip patterns
        if (shouldSkipTransaction(fullDescription)) {
            continue;
        }

        const amountValue = parseFloat(amount.replace(/,/g, ''));

        // Parse date - format MM/DD, need to add year
        const [month, day] = dateStr.split('/');
        const txnMonth = parseInt(month);

        // Handle year boundary: if transaction month is 12 and statement month is 1, use previous year
        let txnYear = statementYear;
        if (txnMonth === 12 && statementMonth === 1) {
            txnYear = statementYear - 1;
        }
        // If transaction month is 1 and statement month is 12, use next year
        else if (txnMonth === 1 && statementMonth === 12) {
            txnYear = statementYear + 1;
        }

        const transactionDate = `${txnYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        // Extract merchant name from description
        let merchant = fullDescription;

        // Clean up common patterns
        merchant = merchant.replace(/^Card Purchase\s+\d{2}\/\d{2}\s+/i, '');
        merchant = merchant.replace(/^Electronic Withdrawal\s+/i, '');
        merchant = merchant.replace(/^Web Pmts\s+/i, '');
        merchant = merchant.replace(/\s+Card\s+\d+.*$/i, '');
        merchant = merchant.replace(/\s+Web ID:.*$/i, '');
        merchant = merchant.replace(/\s{2,}/g, ' ').trim();

        if (merchant && merchant.length > 2) {
            transactions.push({
                date: transactionDate,
                month: getMonthFromDate(transactionDate),
                merchant: merchant.substring(0, 200),
                amount: amountValue,
                category: categorizeTransaction(merchant),
                source: `Bank-${accountNumber}`
            });
        }
    }

    return transactions;
}

/**
 * Parse credit card statement transactions
 */
function parseCreditCardStatement(text, accountNumber) {
    const transactions = [];

    // Extract statement year and month from closing date
    let statementYear = 2025;
    let statementMonth = 12;
    const dateRangeMatch = text.match(/(\d{2})\/(\d{2})\/(\d{2})\s*-\s*(\d{2})\/(\d{2})\/(\d{2})/);
    if (dateRangeMatch) {
        statementYear = 2000 + parseInt(dateRangeMatch[6]); // Use ending date year
        statementMonth = parseInt(dateRangeMatch[4]); // Use ending month
    }

    // Split into lines
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Format: MM/DD     Description [STATE]Amount
        // Example: 10/20     Amazon.com*NM15Y8202 Amzn.com/bill WA10.37
        // Example: 11/08     ACME 1083 JERSEY CITY NJ184.82
        // Note: Multiple spaces between date and description
        // State code (2 letters) directly before amount with NO space OR amount with dash separator

        // Match date at start, followed by spaces, description, optional state code, and amount
        const match = line.match(/^(\d{2}\/\d{2})\s{2,}(.+?)(\s+[A-Z]{2})?([\d,]+\.\d{2})$/);

        if (!match) continue;

        const [_, dateStr, description, stateCode, amount] = match;

        // Skip if matches skip patterns
        if (shouldSkipTransaction(description)) {
            continue;
        }

        // Skip payments and credits
        if (/payment|credit|thank you/i.test(description)) {
            continue;
        }

        const amountValue = parseFloat(amount.replace(/,/g, ''));

        // Parse date
        const [month, day] = dateStr.split('/');
        const txnMonth = parseInt(month);

        // Handle year boundary: if transaction month is 12 and statement month is 1, use previous year
        let txnYear = statementYear;
        if (txnMonth === 12 && statementMonth === 1) {
            txnYear = statementYear - 1;
        }
        // If transaction month is 1 and statement month is 12, use next year
        else if (txnMonth === 1 && statementMonth === 12) {
            txnYear = statementYear + 1;
        }

        const transactionDate = `${txnYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        let merchant = description.trim();

        // Clean up merchant name
        merchant = merchant.replace(/\s{2,}/g, ' ');

        if (merchant && merchant.length > 2) {
            transactions.push({
                date: transactionDate,
                month: getMonthFromDate(transactionDate),
                merchant: merchant.substring(0, 200),
                amount: amountValue,
                category: categorizeTransaction(merchant),
                source: `Card-${accountNumber}`
            });
        }
    }

    return transactions;
}

/**
 * Process all PDF files
 */
async function processPDFFiles() {
    const allTransactions = [];

    console.log('Starting PDF processing...\n');

    // Process bank statements
    const bankFiles = fs.readdirSync(BANK_STATEMENTS_DIR)
        .filter(f => f.endsWith('.pdf'))
        .sort();

    console.log(`Found ${bankFiles.length} bank statement files`);

    // Track unique transactions to avoid duplicates from multiple accounts
    const seenTransactions = new Set();

    for (const file of bankFiles) {
        try {
            const filePath = path.join(BANK_STATEMENTS_DIR, file);
            console.log(`Processing: ${file}`);

            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);

            // Extract account number from filename - pattern: statements-XXXX-
            const accountMatch = file.match(/statements-(\d{4})-/);
            const accountNumber = accountMatch ? accountMatch[1] : 'XXXX';

            const transactions = parseBankStatement(data.text, accountNumber);

            // Deduplicate transactions (checking/savings accounts may have same transactions)
            let uniqueCount = 0;
            for (const txn of transactions) {
                const key = `${txn.date}|${txn.merchant}|${txn.amount}`;
                if (!seenTransactions.has(key)) {
                    seenTransactions.add(key);
                    allTransactions.push(txn);
                    uniqueCount++;
                }
            }

            console.log(`  → Extracted ${transactions.length} transactions (${uniqueCount} unique)\n`);
        } catch (error) {
            console.error(`Error processing ${file}:`, error.message);
        }
    }

    // Process credit card statements
    const ccFiles = fs.readdirSync(CREDIT_CARDS_DIR)
        .filter(f => f.endsWith('.pdf'))
        .sort();

    console.log(`Found ${ccFiles.length} credit card statement files`);

    for (const file of ccFiles) {
        try {
            const filePath = path.join(CREDIT_CARDS_DIR, file);
            console.log(`Processing: ${file}`);

            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);

            // Extract account number from filename - pattern: statements-XXXX-
            const accountMatch = file.match(/statements-(\d{4})-/);
            const accountNumber = accountMatch ? accountMatch[1] : 'XXXX';

            const transactions = parseCreditCardStatement(data.text, accountNumber);
            allTransactions.push(...transactions);

            console.log(`  → Extracted ${transactions.length} transactions\n`);
        } catch (error) {
            console.error(`Error processing ${file}:`, error.message);
        }
    }

    return allTransactions;
}

/**
 * Insert transactions into database
 */
function insertTransactions(transactions) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH);

        // Clear existing transactions
        db.run('DELETE FROM transactions', (err) => {
            if (err) {
                reject(err);
                return;
            }

            console.log('Cleared existing transactions');

            // Prepare insert statement
            const stmt = db.prepare(`
                INSERT INTO transactions (date, month, merchant, amount, category, source)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            let inserted = 0;
            let errors = 0;

            for (const txn of transactions) {
                stmt.run(
                    txn.date,
                    txn.month,
                    txn.merchant,
                    txn.amount,
                    txn.category,
                    txn.source,
                    (err) => {
                        if (err) {
                            errors++;
                            console.error('Insert error:', err.message);
                        } else {
                            inserted++;
                        }
                    }
                );
            }

            stmt.finalize((err) => {
                if (err) {
                    reject(err);
                    return;
                }

                console.log(`\n✓ Inserted ${inserted} transactions`);
                if (errors > 0) {
                    console.log(`✗ ${errors} errors occurred`);
                }

                db.close();
                resolve({ inserted, errors });
            });
        });
    });
}

/**
 * Print summary statistics
 */
function printSummary(transactions) {
    console.log('\n' + '='.repeat(60));
    console.log('TRANSACTION SUMMARY');
    console.log('='.repeat(60));

    console.log(`\nTotal Transactions: ${transactions.length}`);
    console.log(`Total Amount: $${transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`);

    // By month
    console.log('\n--- By Month ---');
    const byMonth = {};
    transactions.forEach(t => {
        if (!byMonth[t.month]) byMonth[t.month] = { count: 0, amount: 0 };
        byMonth[t.month].count++;
        byMonth[t.month].amount += t.amount;
    });
    Object.entries(byMonth)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([month, data]) => {
            console.log(`${month.padEnd(15)} ${String(data.count).padStart(4)} transactions   $${data.amount.toFixed(2).padStart(10)}`);
        });

    // By category
    console.log('\n--- By Category ---');
    const byCategory = {};
    transactions.forEach(t => {
        if (!byCategory[t.category]) byCategory[t.category] = { count: 0, amount: 0 };
        byCategory[t.category].count++;
        byCategory[t.category].amount += t.amount;
    });
    Object.entries(byCategory)
        .sort((a, b) => b[1].amount - a[1].amount)
        .forEach(([category, data]) => {
            console.log(`${category.padEnd(15)} ${String(data.count).padStart(4)} transactions   $${data.amount.toFixed(2).padStart(10)}`);
        });

    // By source
    console.log('\n--- By Source ---');
    const bySource = {};
    transactions.forEach(t => {
        if (!bySource[t.source]) bySource[t.source] = { count: 0, amount: 0 };
        bySource[t.source].count++;
        bySource[t.source].amount += t.amount;
    });
    Object.entries(bySource)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([source, data]) => {
            console.log(`${source.padEnd(15)} ${String(data.count).padStart(4)} transactions   $${data.amount.toFixed(2).padStart(10)}`);
        });

    console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Main execution
 */
async function main() {
    try {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║   Financial Statements Transaction Parser                 ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        // Process all PDFs
        const transactions = await processPDFFiles();

        // Print summary
        printSummary(transactions);

        // Insert into database
        await insertTransactions(transactions);

        console.log('✓ Processing complete!\n');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run the script
main();
