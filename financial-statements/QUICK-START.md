# 🚀 Quick Start Guide

## Your Financial Statement System is Ready!

### 📁 Folder Location
`~/Desktop/financial-statements/`

---

## 🎯 Two Ways to Update Your Dashboard

### Option 1: Interactive Manual Entry (Recommended for Monthly Updates)

```bash
cd ~/Desktop/financial-statements
npm run manual
```

This will guide you through adding:
- ✅ Income data (gross, net, taxes, deductions)
- ✅ Expense data (all categories)
- ✅ Savings amounts

### Option 2: Document Upload (Future Enhancement)

1. Drop files in appropriate folders:
   - `payslips/` - Name as `payslip-2026-03.pdf`
   - `bank-statements/` - Name as `bank-2026-03.pdf`
   - `credit-cards/` - Name as `credit-card-2026-03.pdf`

2. Run the parser:
```bash
cd ~/Desktop/financial-statements
npm run parse
```

---

## 📊 Sync to Dashboard

After updating data, sync to the dashboard:

```bash
cd ~/Desktop/financial-statements
./sync-to-dashboard.sh
```

Or simply reload your browser - the dashboard auto-checks for updates!

---

## 📝 Example: Adding March 2026 Data

```bash
cd ~/Desktop/financial-statements
npm run manual
```

Then follow the prompts:

```
What would you like to do?
1. Add/Update Income          ← Choose this first
2. Add/Update Expenses
3. View Current Data
4. Save & Exit

Month (e.g., Mar 2026): Mar 2026
Gross pay: 15737
Net pay: 9941
Taxes: 4801
401(k) contribution: 630
...
```

Repeat for expenses, then:
- Choose option 4 to save
- Run `./sync-to-dashboard.sh`
- Reload browser

---

## 📂 File Structure

```
financial-statements/
├── data.json              ← Your financial data
├── manual-entry.js        ← Interactive entry tool
├── parse.js               ← Document parser
├── sync-to-dashboard.sh   ← Sync script
├── payslips/              ← Drop payslips here
├── bank-statements/       ← Drop bank statements here
├── credit-cards/          ← Drop credit card statements here
└── processed/             ← Processed files move here
```

---

## 💡 Tips

1. **Monthly Routine:**
   - Run `npm run manual` at month-end
   - Add your income & expenses for the month
   - Sync to dashboard
   - Take a snapshot in the Tracker tab

2. **File Naming:**
   - Use format: `payslip-YYYY-MM.pdf`
   - Example: `payslip-2026-03.pdf`

3. **Backup:**
   - `data.json` contains all your financial data
   - Back it up regularly to cloud storage

4. **Categories:**
   - rent, food, dining, commute, flights
   - phone, utility, shopping, personal
   - subs, zelle, drinks, health, other

---

## 🔧 Installation (First Time Only)

```bash
cd ~/Desktop/financial-statements
npm install
```

---

## 🆘 Help

- **Dashboard not updating?**
  Run: `./sync-to-dashboard.sh`

- **Lost your data?**
  It's in: `~/Desktop/financial-statements/data.json`

- **Want to see current data?**
  Run: `npm run manual` → Choose option 3

---

## 📱 Access Dashboard

Development: http://localhost:3000
(Must have `npm run dev` running in the dashboard folder)

---

Happy tracking! 📈💰
