# Complete Ledger System

## Overview

The financial dashboard now uses a **complete ledger system** that tracks ALL transactions:
- ✅ **Credits (Money IN)**: Income, reimbursements, interest
- ✅ **Debits (Money OUT)**: Expenses, savings transfers, fees

This eliminates data inconsistencies and provides a single source of truth.

---

## Database Schema

### Main Ledger Table: `ledger`

```sql
CREATE TABLE ledger (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,              -- YYYY-MM-DD
    month TEXT NOT NULL,              -- "Jan 2026"
    description TEXT NOT NULL,        -- Full transaction description
    merchant TEXT,                    -- Merchant/payee name
    amount REAL NOT NULL,             -- Transaction amount (always positive)
    type TEXT NOT NULL,               -- 'debit' or 'credit'
    category TEXT NOT NULL,           -- Main category (see below)
    subcategory TEXT,                 -- Detailed category
    source TEXT NOT NULL,             -- Bank-1238, Card-3487, Card-5536
    balance_after REAL,               -- Account balance after transaction
    notes TEXT,                       -- Optional notes
    created_at TIMESTAMP
);
```

### Categories

**Main Categories:**
- `income` - Salary, wages (credit)
- `expense` - All spending (debit)
- `reimbursement` - Work reimbursements, refunds (credit)
- `savings_transfer` - Transfers to/from savings (debit/credit)
- `credit_card_payment` - Payments to credit cards (debit)
- `fee` - Bank fees, charges (debit)
- `interest` - Interest earned (credit)

**Expense Subcategories:**
- `rent`, `food`, `dining`, `commute`, `flights`
- `phone`, `utility`, `shopping`, `personal`
- `subs`, `zelle`, `drinks`, `health`, `other`

---

## How to Use

### 1. Add New Statements

Drop your new PDFs in the appropriate folders:
```bash
~/Desktop/financial-statements/
├── bank-statements/     # Bank statements here
├── credit-cards/        # Credit card statements here
└── payslips/            # Payslips here
```

### 2. Rebuild the Complete Ledger

```bash
cd ~/Desktop/financial-statements
npm run rebuild-ledger
```

This command:
1. ✅ Parses ALL bank and credit card statements
2. ✅ Extracts expense transactions
3. ✅ Adds income from payslip data
4. ✅ Adds savings transfers
5. ✅ Builds complete ledger with debits + credits

### 3. Query the Ledger

The system provides convenient SQL views:

**Monthly Summary:**
```sql
SELECT * FROM v_monthly_summary ORDER BY month;
```

**Monthly Expenses by Category:**
```sql
SELECT * FROM v_monthly_expenses WHERE month = 'Feb 2026';
```

**Monthly Income:**
```sql
SELECT * FROM v_monthly_income ORDER BY month;
```

**All Transactions for a Month:**
```sql
SELECT date, type, category, subcategory, merchant, amount
FROM ledger
WHERE month = 'Feb 2026'
ORDER BY date, id;
```

**Income vs Expenses:**
```sql
SELECT
    month,
    SUM(CASE WHEN type = 'credit' AND category = 'income' THEN amount ELSE 0 END) as income,
    SUM(CASE WHEN type = 'debit' AND category = 'expense' THEN amount ELSE 0 END) as expenses
FROM ledger
GROUP BY month
ORDER BY month;
```

---

## Data Flow

```
PDF Statements
      ↓
populate-transactions.js (extracts expenses)
      ↓
transactions table (expenses only)
      ↓
build_complete_ledger.py (adds income, savings)
      ↓
ledger table (complete record)
      ↓
v_monthly_summary view → Dashboard
```

---

## API Endpoints

The dashboard API serves data from the ledger:

```javascript
// Get monthly summary
GET /api/ledger/summary/:month

// Get all transactions for a month
GET /api/ledger/transactions/:month

// Get expense breakdown
GET /api/ledger/expenses/:month

// Get complete data (income + expenses)
GET /api/data
```

---

## Benefits

### ✅ Single Source of Truth
- All financial data in one table
- No more syncing between multiple tables
- Consistent data across the dashboard

### ✅ Complete Financial Picture
- Track income AND expenses
- See net cashflow per month
- Identify savings rate

### ✅ Audit Trail
- Every transaction recorded
- Balance tracking (bank statements)
- Easy to verify against statements

### ✅ Flexible Querying
- SQL views for common queries
- Easy to add new reports
- Filter by category, date, source

---

## Maintenance

### When You Get New Statements

1. **Add PDFs** to appropriate folders
2. **Run**: `npm run rebuild-ledger`
3. **Verify**: Check monthly summary
4. **Restart API**: `npm run server`
5. **Refresh Dashboard**: Reload browser

### Monthly Routine

```bash
cd ~/Desktop/financial-statements

# 1. Add new bank/credit card/payslip PDFs
# 2. Rebuild ledger
npm run rebuild-ledger

# 3. Verify data
sqlite3 financial.db "SELECT * FROM v_monthly_summary ORDER BY month DESC LIMIT 3"

# 4. Restart API server
npm run server
```

---

## Troubleshooting

### Missing Transactions?

```sql
-- Check what was extracted
SELECT source, COUNT(*), SUM(amount)
FROM ledger
WHERE month = 'Feb 2026'
GROUP BY source;
```

### Duplicate Transactions?

The system automatically deduplicates based on date, amount, and description.

### Wrong Category?

Update the categorization logic in `build_complete_ledger.py` and rebuild.

---

## Future Enhancements

- [ ] Auto-detect and parse payslips for income
- [ ] Handle split transactions
- [ ] Add tags/labels for custom categorization
- [ ] Budget vs actual tracking
- [ ] Recurring transaction detection
- [ ] Multi-currency support

---

## Database Backup

```bash
# Backup your ledger
sqlite3 ~/Desktop/financial-statements/financial.db ".backup financial-backup-$(date +%Y%m%d).db"
```

---

**Last Updated**: February 2026
