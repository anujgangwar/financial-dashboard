#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const dataPath = path.join(__dirname, 'data.json');

// Load existing data
let data = {
  income: [],
  expenses: []
};

if (fs.existsSync(dataPath)) {
  data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

console.log('✏️  Manual Financial Data Entry\n');

function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function addIncomeEntry() {
  console.log('\n💰 Income Entry');
  const month = await prompt('Month (e.g., Mar 2026): ');
  const gross = parseInt(await prompt('Gross pay: '));
  const net = parseInt(await prompt('Net pay: '));
  const taxes = parseInt(await prompt('Taxes: '));
  const k401 = parseInt(await prompt('401(k) contribution: '));
  const hsa = parseInt(await prompt('HSA contribution: ') || '0');
  const benefits = parseInt(await prompt('Benefits (medical/dental): ') || '0');
  const reimb = parseInt(await prompt('Reimbursements: ') || '0');
  const perchpeek = parseInt(await prompt('Perchpeek/bonuses: ') || '0');
  const savedToAccount = parseInt(await prompt('Amount sent to savings: ') || '0');

  const entry = {
    mo: month,
    gross,
    net,
    taxes,
    k401,
    hsa,
    benefits,
    reimb,
    perchpeek,
    savedToAccount
  };

  // Check if month exists
  const existingIndex = data.income.findIndex(i => i.mo === month);
  if (existingIndex >= 0) {
    data.income[existingIndex] = entry;
    console.log(`✅ Updated income for ${month}`);
  } else {
    data.income.push(entry);
    console.log(`✅ Added income for ${month}`);
  }
}

async function addExpenseEntry() {
  console.log('\n💸 Expense Entry');
  const month = await prompt('Month (e.g., Mar 2026): ');

  const entry = {
    mo: month,
    rent: parseInt(await prompt('Rent: ') || '0'),
    food: parseInt(await prompt('Groceries: ') || '0'),
    dining: parseInt(await prompt('Dining out: ') || '0'),
    commute: parseInt(await prompt('Commute (transit): ') || '0'),
    flights: parseInt(await prompt('Flights: ') || '0'),
    phone: parseInt(await prompt('Phone/Internet: ') || '0'),
    utility: parseInt(await prompt('Utilities: ') || '0'),
    shopping: parseInt(await prompt('Shopping: ') || '0'),
    personal: parseInt(await prompt('Personal care: ') || '0'),
    subs: parseInt(await prompt('Subscriptions: ') || '0'),
    zelle: parseInt(await prompt('Zelle/P2P: ') || '0'),
    drinks: parseInt(await prompt('Drinks/social: ') || '0'),
    health: parseInt(await prompt('Healthcare: ') || '0'),
    other: parseInt(await prompt('Other: ') || '0')
  };

  const existingIndex = data.expenses.findIndex(e => e.mo === month);
  if (existingIndex >= 0) {
    data.expenses[existingIndex] = entry;
    console.log(`✅ Updated expenses for ${month}`);
  } else {
    data.expenses.push(entry);
    console.log(`✅ Added expenses for ${month}`);
  }
}

async function main() {
  let continueEntry = true;

  while (continueEntry) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('What would you like to do?');
    console.log('1. Add/Update Income');
    console.log('2. Add/Update Expenses');
    console.log('3. View Current Data');
    console.log('4. Save & Exit');
    const choice = await prompt('\nEnter choice (1-4): ');

    switch (choice) {
      case '1':
        await addIncomeEntry();
        break;
      case '2':
        await addExpenseEntry();
        break;
      case '3':
        console.log('\n📊 Current Data:');
        console.log('Income entries:', data.income.length);
        console.log('Expense entries:', data.expenses.length);
        console.log('\nMonths:', data.income.map(i => i.mo).join(', '));
        break;
      case '4':
        continueEntry = false;
        break;
      default:
        console.log('Invalid choice');
    }
  }

  // Save data
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log(`\n✅ Data saved to: ${dataPath}`);
  console.log('📊 Dashboard will update automatically!\n');

  rl.close();
}

main().catch(console.error);
