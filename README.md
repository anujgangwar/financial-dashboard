# Financial Dashboard

A comprehensive personal finance dashboard built with React, TypeScript, and SQLite for tracking income, expenses, investments, and financial projections.

## Features

### 📊 Income & Expenses Tracking
- Monthly income and expense tracking with 14 categories
- Fixed vs Personal expense breakdown
- Transaction-level details with collapsible accordions
- Reimbursement tracking (work + relocation)
- Month-by-month financial summary

### 💰 Investment Planning
- Portfolio tracker with live price updates
- ESOP management with vesting schedules
- 12-month growth projections
- Asset allocation visualization

### 🗄️ Database Backend
- SQLite database with 353+ transactions
- RESTful API serving financial data
- PDF parsing for bank statements and payslips

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Node.js + Express + SQLite3
- PDF parsing

## Quick Start

```bash
# Install dependencies
npm install

# Start dashboard
npm run dev

# Start API server (in separate terminal)
cd ../financial-statements
npm install
npm run server
```

Open http://localhost:5173

## License

MIT
