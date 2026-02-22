# Financial Statements Processing

This folder is used to store your financial documents and automatically update your dashboard.

## Folder Structure

```
financial-statements/
├── payslips/              # Drop your monthly payslips here (PDF)
├── bank-statements/       # Drop your bank statements here (PDF/CSV)
├── credit-cards/          # Drop your credit card statements here (PDF/CSV)
├── processed/             # Processed files are moved here
└── data.json             # Generated data file (auto-updated)
```

## How to Use

### Option 1: Populate Transaction Database (Recommended)

This method parses all PDF statements and populates a SQLite database with individual transactions for detailed analysis.

```bash
cd ~/Desktop/financial-statements
npm run populate
```

This will:
1. Parse all bank statements and credit card PDFs
2. Extract every expense transaction with categorization
3. Populate the `financial.db` SQLite database
4. Print a detailed summary by month, category, and source

**Features:**
- Automatic categorization (rent, food, dining, commute, shopping, etc.)
- Deduplication of transactions from multiple account statements
- Year-boundary handling for cross-month statements
- Skip payments, transfers, and reimbursements
- Extract 260+ transactions from 16 PDF files

**Database Schema:**
- `date`: YYYY-MM-DD format
- `month`: "Oct 2025", "Nov 2025", etc.
- `merchant`: Cleaned merchant/description
- `amount`: Transaction amount (positive number)
- `category`: Auto-categorized (rent, food, dining, commute, etc.)
- `source`: Bank-1238, Card-3487, Card-5536

### Option 2: Legacy Summary Parser

This method extracts monthly totals and generates `data.json`:

```bash
cd ~/Desktop/financial-statements
npm run parse
```

This will:
1. Parse all documents in the folders
2. Extract income and expense data
3. Generate/update `data.json`
4. Move processed files to `processed/` folder

### Dashboard Auto-Updates
The dashboard automatically reads from `data.json` or queries `financial.db`, so your latest financial data will appear immediately.

## File Naming Convention

For best results, name your files:
- Payslips: `payslip-YYYY-MM.pdf` (e.g., `payslip-2026-02.pdf`)
- Bank: `bank-YYYY-MM.pdf` or `bank-YYYY-MM.csv`
- Credit Cards: `credit-card-YYYY-MM.pdf` or `credit-card-YYYY-MM.csv`

## Manual Entry

If you prefer manual entry, edit `data.json` directly:

```json
{
  "income": [
    {
      "mo": "Mar 2026",
      "gross": 15737,
      "net": 9980,
      "taxes": 4801,
      ...
    }
  ],
  "expenses": [
    {
      "mo": "Mar 2026",
      "rent": 3866,
      "food": 450,
      ...
    }
  ]
}
```

## Supported Formats

- **PDF**: Extracts text from statements
- **CSV**: Direct import from bank exports
- **Excel**: Coming soon

## Transaction Categories

The `populate-transactions.js` script automatically categorizes expenses:

| Category | Examples |
|----------|----------|
| **rent** | Atlantic, Lefrak, rent payments |
| **food** | Whole Foods, Trader Joe's, ACME, Morton Williams, grocery stores |
| **dining** | Chipotle, Starbucks, Pizza, Shake Shack, restaurants |
| **commute** | PATH, MTA, Uber, Lyft, parking |
| **flights** | Airlines (United, Southwest, Delta, etc.) |
| **phone** | Verizon, T-Mobile, AT&T, phone bills |
| **utility** | PSEG, electric, gas, internet |
| **shopping** | Amazon, CVS, Walgreens, Target, retail stores |
| **personal** | Haircut, salon, barber, personal care |
| **subs** | Netflix, Spotify, Apple subscriptions |
| **zelle** | Zelle payments to others |
| **drinks** | Bars, liquor stores, beverages |
| **health** | Doctor, pharmacy, prescriptions, medical |
| **other** | Everything else not categorized |

**Skipped Transactions:**
- Deposits and credits
- Payments TO credit cards
- Transfers between your own accounts
- Reimbursements (Navan, Perchpeek, AlphaSense)

## Querying Transaction Data

Access the SQLite database directly:

```bash
# View all transactions
sqlite3 ~/Desktop/financial-statements/financial.db "SELECT * FROM transactions ORDER BY date DESC LIMIT 10"

# Monthly spending by category
sqlite3 ~/Desktop/financial-statements/financial.db "SELECT month, category, SUM(amount) as total FROM transactions GROUP BY month, category ORDER BY month, total DESC"

# Top merchants
sqlite3 ~/Desktop/financial-statements/financial.db "SELECT merchant, COUNT(*) as count, SUM(amount) as total FROM transactions GROUP BY merchant ORDER BY total DESC LIMIT 20"
```

## Troubleshooting

- **Parser not working?** Check file names follow the convention
- **Missing data?** Verify PDFs are text-based (not scanned images)
- **Transactions not extracted?** Check PDF format matches Chase bank/credit card statements
- **Need help?** Check the logs in `parse.log`
