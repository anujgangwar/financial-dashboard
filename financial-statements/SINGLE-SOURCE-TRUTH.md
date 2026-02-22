# ✅ Single Source of Truth Architecture

## Overview

Your financial system now uses **`ledger` as the single source of truth**. All data flows from the ledger, eliminating sync issues and data inconsistencies.

---

## 🏗️ Architecture

```
PDF Statements
      ↓
populate-transactions.js
      ↓
transactions table (temp)
      ↓
build_complete_ledger.py
      ↓
┌─────────────────────────┐
│   LEDGER (SOURCE)       │  ← SINGLE SOURCE OF TRUTH
│   - All transactions    │
│   - Income + Expenses   │
│   - Debits + Credits    │
└─────────────────────────┘
      ↓
   API Server (queries ledger)
      ↓
   Dashboard (displays)
```

---

## 📊 Data Flow

### 1. Add New Statements
```bash
# Drop PDFs in folders
~/Desktop/financial-statements/
├── bank-statements/     # New bank PDFs here
├── credit-cards/        # New credit card PDFs here
└── payslips/            # New payslips here
```

### 2. Rebuild Ledger
```bash
cd ~/Desktop/financial-statements
npm run rebuild-ledger
```

This single command:
1. ✅ Parses all PDFs → extracts expenses
2. ✅ Builds complete ledger (income + expenses + savings)
3. ✅ Syncs legacy tables for compatibility
4. ✅ Ready to serve!

### 3. Data is Automatically Available
- API server queries ledger directly
- Dashboard gets fresh data
- No manual sync needed

---

## 🗄️ Database Tables

### Primary Table: `ledger`
**THE SINGLE SOURCE OF TRUTH**

All financial data lives here:
- Income (credits)
- Expenses (debits)
- Savings transfers
- Fees, reimbursements

```sql
SELECT * FROM ledger WHERE month = 'Feb 2026';
```

### Legacy Tables (Auto-Synced)
These tables are **automatically synced from ledger** for compatibility:

- `income` - Monthly income summaries
- `expenses` - Monthly expense breakdowns
- `transactions` - Individual expense transactions

**You never need to update these manually!**

---

## 🔄 What Changed

### Before (Multiple Sources)
```
❌ transactions table → expenses by category
❌ income table → income data
❌ Manual updates to expenses table
❌ Data inconsistencies
❌ Syncing issues
```

### After (Single Source)
```
✅ ledger table → ALL financial data
✅ API queries ledger directly
✅ Auto-sync to legacy tables
✅ Always consistent
✅ One rebuild command
```

---

## 📡 API Endpoints (Ledger-Powered)

All endpoints now query from `ledger`:

### Get All Data
```bash
GET http://localhost:3001/api/data
```

Returns income + expenses aggregated from ledger.

### Get Transactions by Month
```bash
GET http://localhost:3001/api/transactions/Feb%202026
```

Returns all ledger entries for February 2026.

### Get Transactions by Category
```bash
GET http://localhost:3001/api/transactions/Feb%202026/rent
```

Returns rent transactions from ledger.

---

## ✅ Benefits

### 1. Data Consistency
- **One source** = no conflicts
- All views show same data
- Impossible to have mismatches

### 2. Simplified Updates
- **One command**: `npm run rebuild-ledger`
- No manual syncing
- No forgotten tables

### 3. Complete Financial Picture
- See income AND expenses together
- Track net cashflow
- Monitor savings rate

### 4. Audit Trail
- Every transaction recorded
- Balance tracking
- Easy verification

### 5. Flexibility
- Query any way you want
- Create new reports easily
- Add categories without schema changes

---

## 🎯 Key Rules

### ✅ DO:
- Always use `npm run rebuild-ledger` to update data
- Query from `ledger` for any custom reports
- Trust the ledger data as canonical

### ❌ DON'T:
- Manually update `income` or `expenses` tables
- Query old tables for new features
- Skip rebuilding after adding PDFs

---

## 📊 Current Data Status

**Ledger Contains:**
- **281 total transactions**
  - 10 income entries (salary deposits)
  - 267 expense transactions
  - 4 savings transfers

**Monthly Summary (from ledger):**

| Month | Income | Expenses | Savings | Net |
|-------|--------|----------|---------|-----|
| Oct 2025 | $12,114 | $6,702 | $0 | **+$5,412** |
| Nov 2025 | $10,019 | $4,089 | $11,025 | **-$5,095** |
| Dec 2025 | $10,019 | $4,719 | $5,025 | **+$275** |
| Jan 2026 | $9,941 | $4,770 | $5,025 | **+$146** |
| Feb 2026 | $9,941 | $4,224 | $5,000 | **+$717** |

**No double-counting:**
- ✅ Credit card payments excluded
- ✅ Savings transfers excluded
- ✅ Only actual expenses counted

---

## 🔍 Verification

### Check Ledger Data
```sql
sqlite3 ~/Desktop/financial-statements/financial.db "SELECT * FROM v_monthly_summary"
```

### Check API Response
```bash
curl http://localhost:3001/api/data | python3 -m json.tool
```

### Check Specific Month
```sql
sqlite3 ~/Desktop/financial-statements/financial.db "
SELECT subcategory, SUM(amount) as total
FROM ledger
WHERE month = 'Feb 2026' AND category = 'expense'
GROUP BY subcategory
ORDER BY total DESC"
```

---

## 🚀 Quick Reference

### Monthly Update Process
```bash
# 1. Add new PDFs to folders

# 2. Rebuild ledger (one command!)
cd ~/Desktop/financial-statements
npm run rebuild-ledger

# 3. Done! Dashboard auto-updates
```

### Restart Servers
```bash
# API server
cd ~/Desktop/financial-statements
npm run server

# Dashboard
cd ../financial-dashboard
npm run dev
```

### Query Ledger
```bash
# All transactions for a month
sqlite3 financial.db "SELECT * FROM ledger WHERE month = 'Feb 2026'"

# Monthly summary
sqlite3 financial.db "SELECT * FROM v_monthly_summary"

# Expense breakdown
sqlite3 financial.db "SELECT * FROM v_monthly_expenses WHERE month = 'Feb 2026'"
```

---

## 📚 Related Documentation

- **LEDGER-SYSTEM.md** - Complete technical docs
- **SETUP-COMPLETE.md** - Setup guide
- **README.md** - General overview

---

**Last Updated**: February 20, 2026
**Architecture**: Single Source of Truth (Ledger)
