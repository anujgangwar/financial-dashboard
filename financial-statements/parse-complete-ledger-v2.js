#!/usr/bin/env node
/**
 * Complete Ledger Parser V2
 * Improved extraction with better patterns and deduplication
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'financial.db');
const BANK_STATEMENTS_DIR = path.join(__dirname, 'bank-statements');
const CREDIT_CARDS_DIR = path.join(__dirname, 'credit-cards');

// Category mapping
function categorizeTransaction(description, amount, isDebit) {
  const desc = description.toLowerCase();

  if (!isDebit) {
    // CREDITS (Money IN)
    if (desc.includes('chase quickpay') || desc.includes('direct dep') || desc.includes('payroll')) {
      return { category: 'income', subcategory: 'salary' };
    }
    if (desc.includes('navan') || desc.includes('perchpeek')) {
      return { category: 'reimbursement', subcategory: 'work' };
    }
    if (desc.includes('transfer from') || desc.includes('online transfer from')) {
      return { category: 'savings_transfer', subcategory: 'from_savings' };
    }
    if (desc.includes('interest')) {
      return { category: 'interest', subcategory: 'bank_interest' };
    }
    return { category: 'reimbursement', subcategory: 'other' };
  }

  // DEBITS (Money OUT)
  if (desc.includes('online transfer to') || desc.includes('transfer to sav')) {
    return { category: 'savings_transfer', subcategory: 'to_savings' };
  }
  if (desc.includes('payment to chase card')) {
    return { category: 'credit_card_payment', subcategory: 'credit_card' };
  }
  if (desc.includes('fee') || desc.includes('monthly service fee')) {
    return { category: 'fee', subcategory: 'bank_fee' };
  }

  // EXPENSES
  if (desc.includes('bilt') || desc.includes('atlantic') || desc.includes('lefrak')) {
    return { category: 'expense', subcategory: 'rent' };
  }
  if (desc.includes('morton williams') || desc.includes('acme') || desc.includes('target') ||
      desc.includes('whole foods') || desc.includes('trader joe') || desc.includes('prime food') ||
      desc.includes('patel') || desc.includes('food market')) {
    return { category: 'expense', subcategory: 'food' };
  }
  if (desc.includes('chipotle') || desc.includes('starbucks') || desc.includes('pizza') ||
      desc.includes('shake shack') || desc.includes('panera') || desc.includes('restaurant') ||
      desc.includes('tst*') || desc.includes('coffee')) {
    return { category: 'expense', subcategory: 'dining' };
  }
  if (desc.includes('path') || desc.includes('mta') || desc.includes('njt') ||
      desc.includes('uber') || desc.includes('lyft')) {
    return { category: 'expense', subcategory: 'commute' };
  }
  if (desc.includes('verizon') || desc.includes('tmobile') || desc.includes('t-mobile') || desc.includes('at&t')) {
    return { category: 'expense', subcategory: 'phone' };
  }
  if (desc.includes('pseg') || desc.includes('electric') || desc.includes('gas') || desc.includes('public service')) {
    return { category: 'expense', subcategory: 'utility' };
  }
  if (desc.includes('amazon') || desc.includes('apple.com') || desc.includes('cvs') ||
      desc.includes('walgreens') || desc.includes('best buy') || desc.includes('kohls') ||
      desc.includes('macys') || desc.includes('duane reade') || desc.includes('samsung')) {
    return { category: 'expense', subcategory: 'shopping' };
  }
  if (desc.includes('barber') || desc.includes('salon') || desc.includes('haircut') || desc.includes('kwik')) {
    return { category: 'expense', subcategory: 'personal' };
  }
  if (desc.includes('zelle')) {
    return { category: 'expense', subcategory: 'zelle' };
  }
  if (desc.includes('spirit') || desc.includes('liquor') || desc.includes('bar') ||
      desc.includes('wine') || desc.includes('beer') || desc.includes('newport')) {
    return { category: 'expense', subcategory: 'drinks' };
  }

  return { category: 'expense', subcategory: 'other' };
}

function getMonth(dateStr) {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

async function parseBankStatement(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  const text = data.text;
  const lines = text.split('\n');

  const transactions = [];
  const filename = path.basename(filePath);
  const accountMatch = filename.match(/(\d{4})/);
  const source = accountMatch ? `Bank-${accountMatch[1]}` : 'Bank-Unknown';

  // Only process checking account (1238), skip savings (9130) to avoid duplicates
  if (source === 'Bank-9130') {
    return [];
  }

  for (const line of lines) {
    // Try multiple patterns

    // Pattern 1: MM/DDTransaction...  Amount Balance
    let match = line.match(/^(\d{2})\/(\d{2})(.+?)\s+(-?[0-9,]+\.[0-9]{2})([0-9,]+\.[0-9]{2})$/);

    if (match) {
      const [, month, day, description, amountStr, balanceStr] = match;

      let year = 2025;
      if (filename.includes('2026')) year = 2026;
      else if (parseInt(month) >= 10) year = 2025;
      else if (parseInt(month) <= 3) year = 2026;

      const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const amount = Math.abs(parseFloat(amountStr.replace(/,/g, '')));
      const balance = parseFloat(balanceStr.replace(/,/g, ''));
      const isDebit = amountStr.startsWith('-');

      const { category, subcategory } = categorizeTransaction(description.trim(), amount, isDebit);

      transactions.push({
        date: dateStr,
        month: getMonth(dateStr),
        description: description.trim(),
        merchant: description.trim().substring(0, 100),
        amount: amount,
        type: isDebit ? 'debit' : 'credit',
        category: category,
        subcategory: subcategory,
        source: source,
        balance_after: balance
      });
    }
  }

  return transactions;
}

async function parseCreditCardStatement(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  const text = data.text;

  const transactions = [];
  const filename = path.basename(filePath);
  const accountMatch = filename.match(/(\d{4})/);
  const source = accountMatch ? `Card-${accountMatch[1]}` : 'Card-Unknown';

  // Extract transactions section
  const lines = text.split('\n');
  let inTransactionSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Start of transactions
    if (line.includes('PAYMENTS AND OTHER CREDITS') || line.includes('PURCHASES') ||
        line.includes('SALE') || line.includes('Trans Date')) {
      inTransactionSection = true;
      continue;
    }

    // End of transactions
    if (line.includes('FEES') || line.includes('Total fees') || line.includes('INTEREST CHARGED')) {
      inTransactionSection = false;
    }

    if (!inTransactionSection) continue;

    // Pattern: MM/DD/YY  Merchant  Amount
    // or: MM/DD  Merchant  Amount
    const match = line.match(/^(\d{2})\/(\d{2})(?:\/(\d{2}))?\s+(.+?)\s+(-?\$?[0-9,]+\.[0-9]{2})\s*$/);

    if (match) {
      const [, month, day, yearShort, description, amountStr] = match;

      let year = 2025;
      if (yearShort) {
        year = parseInt(yearShort) >= 25 ? 2000 + parseInt(yearShort) : 2000 + parseInt(yearShort);
      } else {
        // Infer year from filename
        if (filename.includes('202601') || filename.includes('202602')) year = 2026;
        else if (parseInt(month) >= 10) year = 2025;
        else if (parseInt(month) <= 3) year = 2026;
      }

      const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const amount = Math.abs(parseFloat(amountStr.replace(/[$,]/g, '')));

      if (amount === 0 || isNaN(amount)) continue;

      const { category, subcategory } = categorizeTransaction(description.trim(), amount, true);

      transactions.push({
        date: dateStr,
        month: getMonth(dateStr),
        description: description.trim(),
        merchant: description.trim().substring(0, 100),
        amount: amount,
        type: 'debit',
        category: category,
        subcategory: subcategory,
        source: source,
        balance_after: null
      });
    }
  }

  return transactions;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Complete Ledger Parser V2 - ALL Transactions            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const db = new sqlite3.Database(DB_PATH);

  await new Promise((resolve, reject) => {
    db.run('DELETE FROM ledger', (err) => {
      if (err) reject(err);
      else {
        console.log('✓ Cleared existing ledger\n');
        resolve();
      }
    });
  });

  let allTransactions = [];

  // Parse bank statements
  console.log('📄 Parsing Bank Statements...\n');
  const bankFiles = fs.readdirSync(BANK_STATEMENTS_DIR)
    .filter(f => f.endsWith('.pdf'))
    .sort();

  for (const file of bankFiles) {
    const filePath = path.join(BANK_STATEMENTS_DIR, file);
    try {
      const transactions = await parseBankStatement(filePath);
      allTransactions = allTransactions.concat(transactions);
      if (transactions.length > 0) {
        console.log(`  ✓ ${file}: ${transactions.length} transactions`);
      }
    } catch (err) {
      console.log(`  ✗ ${file}: Error - ${err.message}`);
    }
  }

  // Parse credit card statements
  console.log('\n💳 Parsing Credit Card Statements...\n');
  const ccFiles = fs.readdirSync(CREDIT_CARDS_DIR)
    .filter(f => f.endsWith('.pdf'))
    .sort();

  for (const file of ccFiles) {
    const filePath = path.join(CREDIT_CARDS_DIR, file);
    try {
      const transactions = await parseCreditCardStatement(filePath);
      allTransactions = allTransactions.concat(transactions);
      console.log(`  ✓ ${file}: ${transactions.length} transactions`);
    } catch (err) {
      console.log(`  ✗ ${file}: Error - ${err.message}`);
    }
  }

  // Deduplicate based on date, amount, description
  console.log(`\n🔍 Deduplicating transactions...\n`);
  const seen = new Set();
  const uniqueTransactions = allTransactions.filter(txn => {
    const key = `${txn.date}|${txn.amount}|${txn.description.substring(0, 30)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`  Removed ${allTransactions.length - uniqueTransactions.length} duplicates`);
  console.log(`  ${uniqueTransactions.length} unique transactions\n`);

  // Insert into database
  console.log(`💾 Inserting ${uniqueTransactions.length} transactions into ledger...\n`);

  const stmt = db.prepare(`
    INSERT INTO ledger (date, month, description, merchant, amount, type, category, subcategory, source, balance_after)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const txn of uniqueTransactions) {
    await new Promise((resolve, reject) => {
      stmt.run(
        txn.date, txn.month, txn.description, txn.merchant, txn.amount,
        txn.type, txn.category, txn.subcategory, txn.source, txn.balance_after,
        (err) => err ? reject(err) : resolve()
      );
    });
  }

  stmt.finalize();

  // Generate summary
  console.log('============================================================');
  console.log('COMPLETE LEDGER SUMMARY');
  console.log('============================================================\n');

  const summary = await new Promise((resolve, reject) => {
    db.all(`
      SELECT
        category,
        type,
        COUNT(*) as count,
        SUM(amount) as total
      FROM ledger
      GROUP BY category, type
      ORDER BY category, type
    `, (err, rows) => err ? reject(err) : resolve(rows));
  });

  summary.forEach(row => {
    const sign = row.type === 'credit' ? '+' : '-';
    console.log(`${row.category.padEnd(25)} ${row.type.padEnd(10)} ${row.count.toString().padStart(4)} txns   ${sign}$${row.total.toFixed(2).padStart(12)}`);
  });

  console.log('\n--- By Month (Income vs Expenses) ---\n');

  const monthSummary = await new Promise((resolve, reject) => {
    db.all(`
      SELECT
        month,
        SUM(CASE WHEN category = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN category = 'expense' THEN amount ELSE 0 END) as expenses,
        SUM(CASE WHEN category = 'reimbursement' THEN amount ELSE 0 END) as reimbursements,
        SUM(CASE WHEN category = 'savings_transfer' AND type = 'debit' THEN amount ELSE 0 END) as savings,
        COUNT(*) as total_txns
      FROM ledger
      GROUP BY month
      ORDER BY date(substr(month, -4) || '-' ||
        CASE substr(month, 1, 3)
          WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03'
          WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12'
        END || '-01')
    `, (err, rows) => err ? reject(err) : resolve(rows));
  });

  monthSummary.forEach(row => {
    const net = row.income - row.expenses + row.reimbursements - row.savings;
    console.log(`${row.month.padEnd(12)} │ Income: $${row.income.toFixed(2).padStart(10)} │ Expenses: $${row.expenses.toFixed(2).padStart(10)} │ Saved: $${row.savings.toFixed(2).padStart(10)} │ Net: $${net.toFixed(2).padStart(10)} │ (${row.total_txns} txns)`);
  });

  console.log('\n--- Expense Breakdown by Category ---\n');

  const expenseBreakdown = await new Promise((resolve, reject) => {
    db.all(`
      SELECT
        subcategory,
        COUNT(*) as count,
        SUM(amount) as total
      FROM ledger
      WHERE category = 'expense'
      GROUP BY subcategory
      ORDER BY total DESC
    `, (err, rows) => err ? reject(err) : resolve(rows));
  });

  expenseBreakdown.forEach(row => {
    console.log(`${row.subcategory.padEnd(20)} ${row.count.toString().padStart(4)} txns   $${row.total.toFixed(2).padStart(10)}`);
  });

  console.log('\n============================================================');
  console.log(`✅ Complete! ${uniqueTransactions.length} unique transactions in ledger`);
  console.log('============================================================\n');

  db.close();
}

main().catch(console.error);
