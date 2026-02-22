#!/usr/bin/env node
/**
 * Complete Ledger Parser
 * Extracts ALL transactions (debits and credits) from bank and credit card statements
 * Categorizes as: income, reimbursement, expense, savings, etc.
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'financial.db');
const BANK_STATEMENTS_DIR = path.join(__dirname, 'bank-statements');
const CREDIT_CARDS_DIR = path.join(__dirname, 'credit-cards');

// Category mapping rules
function categorizeTransaction(description, amount, isDebit) {
  const desc = description.toLowerCase();

  // CREDITS (Money IN)
  if (!isDebit) {
    // Salary/Income
    if (desc.includes('chase quickpay') || desc.includes('direct dep') || desc.includes('alphasense')) {
      return { category: 'income', subcategory: 'salary' };
    }

    // Reimbursements
    if (desc.includes('navan') || desc.includes('perchpeek') || desc.includes('alphasense')) {
      return { category: 'reimbursement', subcategory: 'work' };
    }

    // Transfers from savings
    if (desc.includes('transfer from') || desc.includes('online transfer from')) {
      return { category: 'savings_transfer', subcategory: 'from_savings' };
    }

    // Interest
    if (desc.includes('interest')) {
      return { category: 'interest', subcategory: 'bank_interest' };
    }

    // Refunds/Credits
    return { category: 'reimbursement', subcategory: 'other' };
  }

  // DEBITS (Money OUT)

  // Transfers to savings
  if (desc.includes('online transfer to') || desc.includes('transfer to sav')) {
    return { category: 'savings_transfer', subcategory: 'to_savings' };
  }

  // Credit card payments
  if (desc.includes('payment to chase card')) {
    return { category: 'credit_card_payment', subcategory: 'credit_card' };
  }

  // Fees
  if (desc.includes('fee') || desc.includes('charge')) {
    return { category: 'fee', subcategory: 'bank_fee' };
  }

  // EXPENSES - detailed categorization

  // Rent
  if (desc.includes('bilt') || desc.includes('atlantic') || desc.includes('lefrak')) {
    return { category: 'expense', subcategory: 'rent' };
  }

  // Groceries/Food
  if (desc.includes('morton williams') || desc.includes('acme') || desc.includes('target') ||
      desc.includes('whole foods') || desc.includes('trader joe') || desc.includes('prime food') ||
      desc.includes('patel')) {
    return { category: 'expense', subcategory: 'food' };
  }

  // Dining
  if (desc.includes('chipotle') || desc.includes('starbucks') || desc.includes('pizza') ||
      desc.includes('shake shack') || desc.includes('panera') || desc.includes('restaurant') ||
      desc.includes('tst*')) {
    return { category: 'expense', subcategory: 'dining' };
  }

  // Commute
  if (desc.includes('path') || desc.includes('mta') || desc.includes('njt') ||
      desc.includes('uber') || desc.includes('lyft')) {
    return { category: 'expense', subcategory: 'commute' };
  }

  // Phone/Utilities
  if (desc.includes('verizon') || desc.includes('tmobile') || desc.includes('t-mobile')) {
    return { category: 'expense', subcategory: 'phone' };
  }

  if (desc.includes('pseg') || desc.includes('electric') || desc.includes('gas')) {
    return { category: 'expense', subcategory: 'utility' };
  }

  // Shopping
  if (desc.includes('amazon') || desc.includes('apple.com') || desc.includes('cvs') ||
      desc.includes('walgreens') || desc.includes('best buy') || desc.includes('kohls') ||
      desc.includes('macys') || desc.includes('duane reade')) {
    return { category: 'expense', subcategory: 'shopping' };
  }

  // Personal care
  if (desc.includes('barber') || desc.includes('salon') || desc.includes('haircut') ||
      desc.includes('kwik')) {
    return { category: 'expense', subcategory: 'personal' };
  }

  // Zelle/P2P
  if (desc.includes('zelle')) {
    return { category: 'expense', subcategory: 'zelle' };
  }

  // Drinks/Alcohol
  if (desc.includes('spirit') || desc.includes('liquor') || desc.includes('bar') ||
      desc.includes('wine') || desc.includes('beer') || desc.includes('newport spirits')) {
    return { category: 'expense', subcategory: 'drinks' };
  }

  // Default
  return { category: 'expense', subcategory: 'other' };
}

// Extract month from date
function getMonth(dateStr) {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Parse bank statement
async function parseBankStatement(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  const text = data.text;
  const lines = text.split('\n');

  const transactions = [];
  const filename = path.basename(filePath);
  const accountMatch = filename.match(/(\d{4})/);
  const source = accountMatch ? `Bank-${accountMatch[1]}` : 'Bank-Unknown';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Pattern: MM/DD Description ... -/+Amount Balance
    const match = line.match(/^(\d{2})\/(\d{2})(.+?)(-|\+)?([0-9,]+\.[0-9]{2})([0-9,]+\.[0-9]{2})$/);

    if (match) {
      const [, month, day, description, sign, amountStr, balanceStr] = match;

      // Determine year (need to check statement period)
      let year = 2025;
      if (filename.includes('2026')) year = 2026;
      else if (parseInt(month) >= 10) year = 2025;
      else if (parseInt(month) <= 2) year = 2026;

      const dateStr = `${year}-${month}-${day}`;
      const amount = parseFloat(amountStr.replace(/,/g, ''));
      const balance = parseFloat(balanceStr.replace(/,/g, ''));
      const isDebit = sign === '-' || !sign;

      const { category, subcategory } = categorizeTransaction(description.trim(), amount, isDebit);

      transactions.push({
        date: dateStr,
        month: getMonth(dateStr),
        description: description.trim(),
        merchant: description.trim(),
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

// Parse credit card statement
async function parseCreditCardStatement(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  const text = data.text;

  const transactions = [];
  const filename = path.basename(filePath);
  const accountMatch = filename.match(/(\d{4})/);
  const source = accountMatch ? `Card-${accountMatch[1]}` : 'Card-Unknown';

  // Pattern for credit card: MM/DD/YY Description Amount
  const regex = /(\d{2})\/(\d{2})\/(\d{2})\s+(.+?)\s+(-?\$?[0-9,]+\.[0-9]{2})/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const [, month, day, yearShort, description, amountStr] = match;

    const year = parseInt(yearShort) >= 25 ? 2000 + parseInt(yearShort) : 2000 + parseInt(yearShort);
    const dateStr = `${year}-${month}-${day}`;
    const amount = Math.abs(parseFloat(amountStr.replace(/[$,]/g, '')));

    // Skip if zero or invalid
    if (amount === 0) continue;

    // Credit card transactions are always expenses (debits from your perspective)
    const { category, subcategory } = categorizeTransaction(description.trim(), amount, true);

    transactions.push({
      date: dateStr,
      month: getMonth(dateStr),
      description: description.trim(),
      merchant: description.trim(),
      amount: amount,
      type: 'debit',
      category: category,
      subcategory: subcategory,
      source: source,
      balance_after: null
    });
  }

  return transactions;
}

// Main function
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Complete Ledger Parser - ALL Transactions                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const db = new sqlite3.Database(DB_PATH);

  // Clear existing ledger
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
      console.log(`  ✓ ${file}: ${transactions.length} transactions`);
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

  // Insert into database
  console.log(`\n💾 Inserting ${allTransactions.length} transactions into ledger...\n`);

  const stmt = db.prepare(`
    INSERT INTO ledger (date, month, description, merchant, amount, type, category, subcategory, source, balance_after)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const txn of allTransactions) {
    await new Promise((resolve, reject) => {
      stmt.run(
        txn.date,
        txn.month,
        txn.description,
        txn.merchant,
        txn.amount,
        txn.type,
        txn.category,
        txn.subcategory,
        txn.source,
        txn.balance_after,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  stmt.finalize();

  // Generate summary
  console.log('============================================================');
  console.log('LEDGER SUMMARY');
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
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  summary.forEach(row => {
    console.log(`${row.category.padEnd(25)} ${row.type.padEnd(10)} ${row.count.toString().padStart(5)} txns   $${row.total.toFixed(2).padStart(12)}`);
  });

  console.log('\n--- By Month ---\n');

  const monthSummary = await new Promise((resolve, reject) => {
    db.all(`
      SELECT
        month,
        SUM(CASE WHEN category = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN category = 'expense' THEN amount ELSE 0 END) as expenses,
        SUM(CASE WHEN category = 'reimbursement' THEN amount ELSE 0 END) as reimbursements,
        COUNT(*) as total_txns
      FROM ledger
      GROUP BY month
      ORDER BY date(substr(month, -4) || '-' ||
        CASE substr(month, 1, 3)
          WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03'
          WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12'
        END || '-01')
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  monthSummary.forEach(row => {
    console.log(`${row.month.padEnd(15)} Income: $${row.income.toFixed(2).padStart(10)}  Expenses: $${row.expenses.toFixed(2).padStart(10)}  Reimb: $${row.reimbursements.toFixed(2).padStart(10)}  (${row.total_txns} txns)`);
  });

  console.log('\n============================================================');
  console.log(`✅ Complete! ${allTransactions.length} transactions imported to ledger`);
  console.log('============================================================\n');

  db.close();
}

main().catch(console.error);
