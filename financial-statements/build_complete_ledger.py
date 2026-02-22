#!/usr/bin/env python3
"""
Complete Ledger Builder
Uses existing parsed transaction data and enhances it with income/credits
"""

import sqlite3
import re
from pathlib import Path
from datetime import datetime

DB_PATH = Path.home() / "Desktop/financial-statements/financial.db"

def get_month(date_str):
    """Convert date to month format"""
    date = datetime.strptime(date_str, '%Y-%m-%d')
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return f"{months[date.month-1]} {date.year}"

def build_ledger():
    """Build complete ledger from existing transactions + add credits"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print('╔════════════════════════════════════════════════════════════╗')
    print('║   Building Complete Ledger from Existing Data             ║')
    print('╚════════════════════════════════════════════════════════════╝\n')

    # Clear ledger
    cursor.execute('DELETE FROM ledger')
    print('✓ Cleared existing ledger\n')

    # 1. Copy all expense transactions from transactions table
    print('📊 Importing expense transactions...\n')
    cursor.execute("""
        INSERT INTO ledger (date, month, description, merchant, amount, type, category, subcategory, source)
        SELECT
            date,
            month,
            merchant,
            merchant,
            amount,
            'debit',
            'expense',
            category,
            source
        FROM transactions
    """)

    expense_count = cursor.rowcount
    print(f'  ✓ Imported {expense_count} expense transactions\n')

    # 2. Add income (paycheck deposits)
    print('💰 Adding income transactions from income table...\n')

    cursor.execute("SELECT month, net FROM income ORDER BY id")
    income_records = cursor.fetchall()

    income_count = 0
    for month, net_pay in income_records:
        # Infer approximate dates (mid-month and end-month for biweekly)
        year = int(month.split()[1])
        month_name = month.split()[0]
        month_num = {'Jan': 1, 'Feb': 2, 'Mar': 3, 'Oct': 10, 'Nov': 11, 'Dec': 12}[month_name]

        # Two paychecks per month (approximation)
        date1 = f"{year}-{month_num:02d}-15"
        date2 = f"{year}-{month_num:02d}-28" if month_num != 2 else f"{year}-{month_num:02d}-28"

        paycheck_amount = net_pay / 2

        cursor.execute("""
            INSERT INTO ledger (date, month, description, merchant, amount, type, category, subcategory, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (date1, month, 'Salary Deposit (Paycheck 1/2)', 'AlphaSense Inc', paycheck_amount,
              'credit', 'income', 'salary', 'Bank-1238'))

        cursor.execute("""
            INSERT INTO ledger (date, month, description, merchant, amount, type, category, subcategory, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (date2, month, 'Salary Deposit (Paycheck 2/2)', 'AlphaSense Inc', paycheck_amount,
              'credit', 'income', 'salary', 'Bank-1238'))

        income_count += 2

    print(f'  ✓ Added {income_count} income transactions\n')

    # 3. Add savings transfers (calculated from income data)
    print('💵 Adding savings transfers...\n')

    cursor.execute("SELECT month, saved_to_account FROM income WHERE saved_to_account > 0 ORDER BY id")
    savings_records = cursor.fetchall()

    savings_count = 0
    for month, savings_amount in savings_records:
        if savings_amount > 0:
            year = int(month.split()[1])
            month_name = month.split()[0]
            month_num = {'Jan': 1, 'Feb': 2, 'Mar': 3, 'Oct': 10, 'Nov': 11, 'Dec': 12}[month_name]
            date = f"{year}-{month_num:02d}-30"

            cursor.execute("""
                INSERT INTO ledger (date, month, description, merchant, amount, type, category, subcategory, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (date, month, 'Online Transfer To Sav', 'Chase Savings', savings_amount,
                  'debit', 'savings_transfer', 'to_savings', 'Bank-1238'))

            savings_count += 1

    print(f'  ✓ Added {savings_count} savings transfer transactions\n')

    conn.commit()

    # Generate summary
    print('============================================================')
    print('COMPLETE LEDGER SUMMARY')
    print('============================================================\n')

    cursor.execute("""
        SELECT
            category,
            type,
            COUNT(*) as count,
            SUM(amount) as total
        FROM ledger
        GROUP BY category, type
        ORDER BY category, type
    """)

    for row in cursor.fetchall():
        category, txn_type, count, total = row
        sign = '+' if txn_type == 'credit' else '-'
        print(f"{category:.<25} {txn_type:.<10} {count:>4} txns   {sign}${total:>12,.2f}")

    print('\n--- Monthly Summary (Income - Expenses - Savings = Net) ---\n')

    cursor.execute("""
        SELECT
            month,
            SUM(CASE WHEN category = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN category = 'expense' THEN amount ELSE 0 END) as expenses,
            SUM(CASE WHEN category = 'savings_transfer' AND type = 'debit' THEN amount ELSE 0 END) as savings,
            SUM(CASE WHEN category = 'reimbursement' THEN amount ELSE 0 END) as reimbursements,
            COUNT(*) as total_txns
        FROM ledger
        GROUP BY month
        ORDER BY date(substr(month, -4) || '-' ||
            CASE substr(month, 1, 3)
                WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03'
                WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12'
            END || '-01')
    """)

    for row in cursor.fetchall():
        month, income, expenses, savings, reimb, total_txns = row
        net = income - expenses - savings + reimb
        print(f"{month:<12} │ +${income:>10,.2f} │ -${expenses:>10,.2f} │ -${savings:>10,.2f} │ = ${net:>10,.2f} │ ({total_txns} txns)")

    print('\n--- Expense Categories ---\n')

    cursor.execute("""
        SELECT
            subcategory,
            COUNT(*) as count,
            SUM(amount) as total
        FROM ledger
        WHERE category = 'expense'
        GROUP BY subcategory
        ORDER BY total DESC
    """)

    for row in cursor.fetchall():
        subcategory, count, total = row
        print(f"{subcategory:.<20} {count:>4} txns   ${total:>10,.2f}")

    total_txns = income_count + expense_count + savings_count
    print(f'\n============================================================')
    print(f'✅ Complete! {total_txns} total transactions in ledger')
    print(f'   - {income_count} income transactions')
    print(f'   - {expense_count} expense transactions')
    print(f'   - {savings_count} savings transfers')
    print('============================================================\n')

    # Sync expenses table from ledger (for legacy compatibility)
    print('🔄 Syncing expenses table from ledger...\n')

    cursor.execute("""
        UPDATE expenses SET
            rent = (SELECT COALESCE(SUM(amount), 0) FROM ledger WHERE month = expenses.month AND category = 'expense' AND subcategory = 'rent'),
            food = (SELECT COALESCE(SUM(amount), 0) FROM ledger WHERE month = expenses.month AND category = 'expense' AND subcategory = 'food'),
            dining = (SELECT COALESCE(SUM(amount), 0) FROM ledger WHERE month = expenses.month AND category = 'expense' AND subcategory = 'dining'),
            commute = (SELECT COALESCE(SUM(amount), 0) FROM ledger WHERE month = expenses.month AND category = 'expense' AND subcategory = 'commute'),
            flights = (SELECT COALESCE(SUM(amount), 0) FROM ledger WHERE month = expenses.month AND category = 'expense' AND subcategory = 'flights'),
            phone = (SELECT COALESCE(SUM(amount), 0) FROM ledger WHERE month = expenses.month AND category = 'expense' AND subcategory = 'phone'),
            utility = (SELECT COALESCE(SUM(amount), 0) FROM ledger WHERE month = expenses.month AND category = 'expense' AND subcategory = 'utility'),
            shopping = (SELECT COALESCE(SUM(amount), 0) FROM ledger WHERE month = expenses.month AND category = 'expense' AND subcategory = 'shopping'),
            personal = (SELECT COALESCE(SUM(amount), 0) FROM ledger WHERE month = expenses.month AND category = 'expense' AND subcategory = 'personal'),
            subs = (SELECT COALESCE(SUM(amount), 0) FROM ledger WHERE month = expenses.month AND category = 'expense' AND subcategory = 'subs'),
            zelle = (SELECT COALESCE(SUM(amount), 0) FROM ledger WHERE month = expenses.month AND category = 'expense' AND subcategory = 'zelle'),
            drinks = (SELECT COALESCE(SUM(amount), 0) FROM ledger WHERE month = expenses.month AND category = 'expense' AND subcategory = 'drinks'),
            health = (SELECT COALESCE(SUM(amount), 0) FROM ledger WHERE month = expenses.month AND category = 'expense' AND subcategory = 'health'),
            other = (SELECT COALESCE(SUM(amount), 0) FROM ledger WHERE month = expenses.month AND category = 'expense' AND subcategory = 'other')
    """)

    conn.commit()
    print('  ✓ Expenses table synced from ledger\n')

    conn.close()

if __name__ == '__main__':
    build_ledger()
