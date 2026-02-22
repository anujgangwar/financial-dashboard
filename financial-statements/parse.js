#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Financial Statement Parser v1.0\n');

// Check if pdf-parse is installed
let pdfParse;
try {
  pdfParse = require('pdf-parse');
  console.log('✅ PDF parser loaded');
} catch (e) {
  console.log('⚠️  PDF parser not installed. Run: npm install');
  console.log('   For now, you can use manual entry mode: npm run manual\n');
}

// Load existing data or create new
let data = {
  income: [],
  expenses: []
};

const dataPath = path.join(__dirname, 'data.json');
if (fs.existsSync(dataPath)) {
  data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log('📂 Loaded existing data.json');
}

// Helper: Parse month from filename
function parseMonthFromFilename(filename) {
  const match = filename.match(/(\d{4})-(\d{2})/);
  if (match) {
    const year = match[1];
    const month = match[2];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month) - 1]} ${year}`;
  }
  return null;
}

// Process payslips
async function processPayslips() {
  const payslipDir = path.join(__dirname, 'payslips');
  if (!fs.existsSync(payslipDir)) return;

  const files = fs.readdirSync(payslipDir).filter(f => f.endsWith('.pdf'));
  console.log(`\n💰 Found ${files.length} payslip(s)`);

  for (const file of files) {
    const month = parseMonthFromFilename(file);
    if (!month) {
      console.log(`  ⚠️  Skipping ${file} - invalid name format`);
      continue;
    }

    console.log(`  📄 Processing: ${file} (${month})`);

    // TODO: Extract data from PDF
    // For now, prompt for manual entry
    console.log(`     ℹ️  Manual entry required. Update data.json for ${month}`);
  }
}

// Process bank statements
async function processBankStatements() {
  const bankDir = path.join(__dirname, 'bank-statements');
  if (!fs.existsSync(bankDir)) return;

  const files = fs.readdirSync(bankDir).filter(f => f.endsWith('.pdf') || f.endsWith('.csv'));
  console.log(`\n🏦 Found ${files.length} bank statement(s)`);

  for (const file of files) {
    const month = parseMonthFromFilename(file);
    if (!month) {
      console.log(`  ⚠️  Skipping ${file} - invalid name format`);
      continue;
    }

    console.log(`  📄 Processing: ${file} (${month})`);
    console.log(`     ℹ️  Manual entry required. Update data.json for ${month}`);
  }
}

// Process credit card statements
async function processCreditCards() {
  const ccDir = path.join(__dirname, 'credit-cards');
  if (!fs.existsSync(ccDir)) return;

  const files = fs.readdirSync(ccDir).filter(f => f.endsWith('.pdf') || f.endsWith('.csv'));
  console.log(`\n💳 Found ${files.length} credit card statement(s)`);

  for (const file of files) {
    const month = parseMonthFromFilename(file);
    if (!month) {
      console.log(`  ⚠️  Skipping ${file} - invalid name format`);
      continue;
    }

    console.log(`  📄 Processing: ${file} (${month})`);
    console.log(`     ℹ️  Manual entry required. Update data.json for ${month}`);
  }
}

// Main execution
async function main() {
  await processPayslips();
  await processBankStatements();
  await processCreditCards();

  // Save data
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log(`\n✅ Data saved to: ${dataPath}`);
  console.log(`\n📊 Next steps:`);
  console.log(`   1. Review/edit data.json with your financial data`);
  console.log(`   2. Dashboard will auto-update from data.json`);
  console.log(`\n💡 Tip: Use "npm run manual" for interactive data entry\n`);
}

main().catch(console.error);
