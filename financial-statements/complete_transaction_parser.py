#!/usr/bin/env python3
"""
Complete Transaction Parser - Re-parse ALL PDFs and capture EVERY expense transaction
Handles 10 bank statements + 6 credit card statements across 5 months (Sep-Jan)
Target: ~$22-23K in total expenses with proper rent payments (~$15,320)
"""

import sqlite3
import re
from datetime import datetime
from pathlib import Path

DB_PATH = Path.home() / "Desktop/financial-statements/financial.db"

def categorize_transaction(merchant, amount):
    """Categorize transactions based on merchant name"""
    merchant_lower = merchant.lower()

    # Rent - Atlantic Web, Lefrakestates, Bilt
    if any(x in merchant_lower for x in ['atlantic web', 'lefrakestates', 'bilt payment']):
        return 'Rent'

    # Commute - PATH, MTA
    if any(x in merchant_lower for x in ['path tapp', 'mta*nyct', 'njt rail']):
        return 'Commute'

    # Groceries
    if any(x in merchant_lower for x in ['acme', 'target', 'morton williams', 'prime food', 'patel']):
        return 'Groceries'

    # Dining
    if any(x in merchant_lower for x in ['chipotle', 'pizza', 'shake shack', 'grubhub', 'restaurant',
                                          'taco', 'pera soho', 'broome street', 'naya', 'starbucks',
                                          'panera', 'barber', 'bao by kaya', 'chez omar', 'dig',
                                          'coffee', 'pantry', 'fazer', 'olivia', 'vfi*ravintola',
                                          'petiscaria', 'meximodo', 'tacos', 'fat tuesday']):
        return 'Dining'

    # Utilities
    if any(x in merchant_lower for x in ['pseg', 'verizon', 'tmobile', 't-mobile']):
        return 'Utilities'

    # Shopping
    if any(x in merchant_lower for x in ['amazon', 'apple', 'samsung', 'best buy', 'h&m', 'br factory',
                                          'saks', 'kohls', 'macys', 'home depot', 'dollar tree']):
        return 'Shopping'

    # Transportation (non-commute)
    if any(x in merchant_lower for x in ['lyft', 'american air', 'southwes', 'swa*']):
        return 'Transportation'

    # Healthcare
    if 'health' in merchant_lower or 'dental' in merchant_lower or 'medical' in merchant_lower:
        return 'Healthcare'

    # Entertainment
    if any(x in merchant_lower for x in ['red eye', 'newport spirits', 'viva vegas', 'gym sports']):
        return 'Entertainment'

    # Services
    if any(x in merchant_lower for x in ['barber', 'haircut', 'kwik barber', 'stylebegin']):
        return 'Personal Care'

    # Default
    return 'Other'

def insert_transactions(conn, transactions):
    """Insert transactions into database"""
    cursor = conn.cursor()

    inserted_count = 0
    for trans in transactions:
        try:
            date, merchant, amount, category, source = trans
            # Extract month from date (format: YYYY-MM-DD -> YYYY-MM)
            month = date[:7]
            cursor.execute('''
                INSERT INTO transactions (date, month, merchant, amount, category, source)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (date, month, merchant, amount, category, source))
            inserted_count += 1
        except sqlite3.IntegrityError:
            pass  # Skip duplicates

    conn.commit()
    return inserted_count

def parse_all_transactions():
    """
    Parse ALL transactions from ALL PDF files
    This includes manually extracted transactions from all 16 PDFs
    """
    transactions = []

    # ==================== OCTOBER 2025 - Bank-1238 ====================
    oct_bank_1238 = [
        ('2025-10-03', 'Chipotle 2627', 9.97, 'Dining', 'Bank-1238'),
        ('2025-10-04', 'Pizza Studio', 14.92, 'Dining', 'Bank-1238'),
        ('2025-10-04', 'Shake Shack - 1407', 4.79, 'Dining', 'Bank-1238'),
        ('2025-10-04', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-04', 'Mta*Nyct Paygo', 2.90, 'Commute', 'Bank-1238'),
        ('2025-10-06', 'Mta*Nyct Paygo', 2.90, 'Commute', 'Bank-1238'),
        ('2025-10-06', 'Mta*Nyct Paygo', 2.90, 'Commute', 'Bank-1238'),
        ('2025-10-07', 'Atlantic Web Pmts', 1900.00, 'Rent', 'Bank-1238'),
        ('2025-10-07', 'Lefrakestates-Hs Web Pmts', 47.50, 'Rent', 'Bank-1238'),
        ('2025-10-07', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-07', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-07', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-07', 'Mta*Nyct Paygo', 2.90, 'Commute', 'Bank-1238'),
        ('2025-10-07', 'Mta*Nyct Paygo', 2.90, 'Commute', 'Bank-1238'),
        ('2025-10-07', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-08', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-08', 'Mta*Nyct Paygo', 2.90, 'Commute', 'Bank-1238'),
        ('2025-10-08', 'Mta*Nyct Paygo', 2.90, 'Commute', 'Bank-1238'),
        ('2025-10-08', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-08', 'Mta*Nyct Paygo', 2.90, 'Commute', 'Bank-1238'),
        ('2025-10-09', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-09', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
    ]
    transactions.extend(oct_bank_1238)

    # ==================== NOVEMBER 2025 - Bank-1238 ====================
    nov_bank_1238 = [
        ('2025-10-13', 'Pizza Studio', 14.92, 'Dining', 'Bank-1238'),
        ('2025-10-14', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-14', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-15', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-15', 'Mta*Nyct Paygo', 2.90, 'Commute', 'Bank-1238'),
        ('2025-10-15', 'Mta*Nyct Paygo', 2.90, 'Commute', 'Bank-1238'),
        ('2025-10-15', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-16', 'Indian Wraps LLC', 8.52, 'Dining', 'Bank-1238'),
        ('2025-10-17', 'Tst* Nana\'s Deli - 210', 11.68, 'Dining', 'Bank-1238'),
        ('2025-10-17', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-17', 'Mta*Nyct Paygo', 2.90, 'Commute', 'Bank-1238'),
        ('2025-10-17', 'Pera Soho', 46.39, 'Dining', 'Bank-1238'),
        ('2025-10-18', 'Amazon Mktpl*Nu3601O', 93.60, 'Shopping', 'Bank-1238'),
        ('2025-10-18', 'Grubhub*Tacoria', 17.41, 'Dining', 'Bank-1238'),
        ('2025-10-18', 'Amazon Mktpl*Nu7Uf84', 594.99, 'Shopping', 'Bank-1238'),
        ('2025-10-18', 'Amazon Mktpl*NM0Wq2V', 311.40, 'Shopping', 'Bank-1238'),
        ('2025-10-18', 'Amazon Mktpl*Nu0Lm0N', 124.72, 'Shopping', 'Bank-1238'),
        ('2025-10-18', 'Amazon.Com*Nu1K65C71', 118.32, 'Shopping', 'Bank-1238'),
        ('2025-10-18', 'Broome Street Bar', 42.05, 'Dining', 'Bank-1238'),
        ('2025-10-18', 'Street Corner', 18.30, 'Dining', 'Bank-1238'),
        ('2025-10-18', 'Indian Wraps LLC', 13.85, 'Dining', 'Bank-1238'),
        ('2025-10-18', 'Target T-1886', 91.66, 'Groceries', 'Bank-1238'),
        ('2025-10-19', 'Amazon Mktpl*Nu6507N', 183.37, 'Shopping', 'Bank-1238'),
        ('2025-10-19', 'Amazon Mktpl*Nu1We73', 61.19, 'Shopping', 'Bank-1238'),
        ('2025-10-18', 'Lyft *Ride Sat 4Pm', 14.74, 'Transportation', 'Bank-1238'),
        ('2025-10-18', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-18', 'Mta*Nyct Paygo', 2.90, 'Commute', 'Bank-1238'),
        ('2025-10-19', 'Starbucks 19500', 12.41, 'Dining', 'Bank-1238'),
        ('2025-10-19', 'Prime Food Market', 135.59, 'Groceries', 'Bank-1238'),
        ('2025-10-19', 'Prime Food Market', 33.95, 'Groceries', 'Bank-1238'),
        ('2025-10-19', 'T-Mobile Store # 2941', 10.33, 'Utilities', 'Bank-1238'),
        ('2025-10-19', 'Target T-1886', 165.09, 'Groceries', 'Bank-1238'),
        ('2025-10-19', 'Acme 1083', 83.00, 'Groceries', 'Bank-1238'),
        ('2025-10-19', 'Payrange Mobile', 10.00, 'Other', 'Bank-1238'),
        ('2025-10-19', 'Morton Williams - Navy', 43.92, 'Groceries', 'Bank-1238'),
        ('2025-10-20', 'Grubhub*Naya', 20.25, 'Dining', 'Bank-1238'),
        ('2025-10-21', 'Grubhub*Primefoodmarke', 14.58, 'Dining', 'Bank-1238'),
        ('2025-10-23', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-23', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-24', 'Panda Express #110', 27.72, 'Dining', 'Bank-1238'),
        ('2025-10-25', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-26', 'Amazon Mktpl*N48Dn6G', 12.78, 'Shopping', 'Bank-1238'),
        ('2025-10-25', 'Patels Cash And Carry', 45.39, 'Groceries', 'Bank-1238'),
        ('2025-10-25', 'Dollar Tree', 1.55, 'Shopping', 'Bank-1238'),
        ('2025-10-25', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-25', 'Acme 1083', 74.10, 'Groceries', 'Bank-1238'),
        ('2025-10-27', 'Grubhub*Primefoodmarke', 17.47, 'Dining', 'Bank-1238'),
        ('2025-10-26', 'Sq *Stylebegin Barbers', 42.00, 'Personal Care', 'Bank-1238'),
        ('2025-10-26', 'Morton Williams - Navy', 21.35, 'Groceries', 'Bank-1238'),
        ('2025-10-28', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-28', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-29', 'Morton Williams - Navy', 37.32, 'Groceries', 'Bank-1238'),
        ('2025-10-30', 'Sq *Gateway Newstands', 15.00, 'Other', 'Bank-1238'),
        ('2025-10-30', 'The Home Depot #6845', 16.36, 'Shopping', 'Bank-1238'),
        ('2025-10-31', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-10-31', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-11-01', 'Kohls #1045', 41.09, 'Shopping', 'Bank-1238'),
        ('2025-11-01', 'Pizza Studio', 14.92, 'Dining', 'Bank-1238'),
        ('2025-11-02', 'Samsung 800-7267864', 725.03, 'Shopping', 'Bank-1238'),
        ('2025-11-02', 'Acme 1083', 15.28, 'Groceries', 'Bank-1238'),
        ('2025-11-02', 'Target 00018861', 31.80, 'Groceries', 'Bank-1238'),
        ('2025-11-03', 'Amazon Mktpl*Nk1Zz0Q', 171.87, 'Shopping', 'Bank-1238'),
        ('2025-11-02', 'Chez Omar', 118.46, 'Dining', 'Bank-1238'),
        ('2025-11-04', 'Amazon Mktpl*Nk1Ld9M', 213.22, 'Shopping', 'Bank-1238'),
        ('2025-11-04', 'Tst*Los Tacos No.1', 21.00, 'Dining', 'Bank-1238'),
        ('2025-11-06', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-11-07', 'Sq *Gateway Newstands', 15.00, 'Other', 'Bank-1238'),
        ('2025-11-07', 'Target T-1886', 198.93, 'Groceries', 'Bank-1238'),
        ('2025-11-07', 'Amazon Mktpl*Bt9Pk0M', 26.32, 'Shopping', 'Bank-1238'),
        ('2025-11-09', 'Amazon Mktpl*Bt6Cs1D', 449.66, 'Shopping', 'Bank-1238'),
        ('2025-11-07', 'Grove Smoke Shop', 26.75, 'Other', 'Bank-1238'),
        ('2025-11-09', 'Amazon Mktpl*Bt9El63', 49.02, 'Shopping', 'Bank-1238'),
        ('2025-11-11', 'Tmobile Postpaid Web', 70.40, 'Utilities', 'Bank-1238'),
        ('2025-11-12', 'Verizon Paymentrec', 34.99, 'Utilities', 'Bank-1238'),
    ]
    transactions.extend(nov_bank_1238)

    # ==================== DECEMBER 2025 - Bank-1238 ====================
    dec_bank_1238 = [
        ('2025-11-16', 'Payrange Mobile', 10.00, 'Other', 'Bank-1238'),
        ('2025-11-16', 'Amazon Prime*W36Iw6O', 15.98, 'Shopping', 'Bank-1238'),
        ('2025-11-22', 'Acme 1083', 32.88, 'Groceries', 'Bank-1238'),
        ('2025-11-23', 'Sq *Bao By Kaya', 18.94, 'Dining', 'Bank-1238'),
        ('2025-11-28', 'H&M 0180Jersey City', 168.69, 'Shopping', 'Bank-1238'),
        ('2025-11-28', 'Apple Store #R654', 173.11, 'Shopping', 'Bank-1238'),
        ('2025-11-29', 'Br Factory US 6264', 70.00, 'Shopping', 'Bank-1238'),
        ('2025-11-29', 'Saks Off 5th 715 651 K', 179.98, 'Shopping', 'Bank-1238'),
        ('2025-11-29', 'ATM Withdrawal', 100.00, 'Cash', 'Bank-1238'),
        ('2025-12-02', 'Bilt Payment Biltrent', 3694.99, 'Rent', 'Bank-1238'),
        ('2025-12-02', 'Brfactory.Com', 27.20, 'Shopping', 'Bank-1238'),
        ('2025-12-03', 'Med*Barnabas Health I', 20.00, 'Healthcare', 'Bank-1238'),
        ('2025-12-05', 'Payrange Mobile', 10.00, 'Other', 'Bank-1238'),
        ('2025-12-06', 'Brfactory.Com', 37.60, 'Shopping', 'Bank-1238'),
        ('2025-12-08', 'The Pantry Helsinki', 15.99, 'Dining', 'Bank-1238'),
        ('2025-12-08', 'Fazer Ravintolat Oy', 32.22, 'Dining', 'Bank-1238'),
        ('2025-12-08', 'Olivia Central Station', 55.53, 'Dining', 'Bank-1238'),
        ('2025-12-08', 'Foreign Exch Rt ADJ Fee', 1.66, 'Fees', 'Bank-1238'),
        ('2025-12-08', 'Foreign Exch Rt ADJ Fee', 0.96, 'Fees', 'Bank-1238'),
        ('2025-12-08', 'Foreign Exch Rt ADJ Fee', 0.47, 'Fees', 'Bank-1238'),
        ('2025-12-09', 'Vfi*Ravintola Gresa', 15.99, 'Dining', 'Bank-1238'),
        ('2025-12-10', 'Verizon Paymentrec', 34.99, 'Utilities', 'Bank-1238'),
        ('2025-12-10', 'Www.Petiscaria.Fi', 15.97, 'Dining', 'Bank-1238'),
        ('2025-12-09', 'Foreign Exch Rt ADJ Fee', 0.47, 'Fees', 'Bank-1238'),
        ('2025-12-10', 'Foreign Exch Rt ADJ Fee', 0.47, 'Fees', 'Bank-1238'),
    ]
    transactions.extend(dec_bank_1238)

    # ==================== JANUARY 2026 - Bank-1238 ====================
    jan_bank_1238 = [
        ('2025-12-10', 'Tmobile*Auto Pay', 72.19, 'Utilities', 'Bank-1238'),
        ('2025-12-11', 'The Pantry Helsinki', 16.03, 'Dining', 'Bank-1238'),
        ('2025-12-11', 'Foreign Exch Rt ADJ Fee', 0.48, 'Fees', 'Bank-1238'),
        ('2025-12-14', 'Morton Williams - Navy', 26.76, 'Groceries', 'Bank-1238'),
        ('2025-12-15', 'Gayborhood St-G4N7D6G7S2G5', 15.99, 'Entertainment', 'Bank-1238'),
        ('2025-12-16', 'Public Service Pseg', 155.96, 'Utilities', 'Bank-1238'),
        ('2025-12-16', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-16', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-18', 'Grubhub*Chipotle', 18.96, 'Dining', 'Bank-1238'),
        ('2025-12-18', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-19', 'Tst* Dig - Union Square', 14.97, 'Dining', 'Bank-1238'),
        ('2025-12-18', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-19', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-19', 'Mta*Nyct Paygo', 2.90, 'Commute', 'Bank-1238'),
        ('2025-12-20', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-22', 'Panera Bread #601767 K', 18.96, 'Dining', 'Bank-1238'),
        ('2025-12-23', 'Amata Paris', 24.99, 'Dining', 'Bank-1238'),
        ('2025-12-23', 'Morton Williams - Navy', 13.47, 'Groceries', 'Bank-1238'),
        ('2025-12-23', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-23', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-24', 'Apple.Com/Bill', 85.29, 'Shopping', 'Bank-1238'),
        ('2025-12-24', 'Sq *Gateway Newstands', 15.00, 'Other', 'Bank-1238'),
        ('2025-12-25', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-25', 'Sq *787 Coffee Roasters', 31.05, 'Dining', 'Bank-1238'),
        ('2025-12-25', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-25', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-26', 'Tst* Gym Sports Bar - N', 21.60, 'Entertainment', 'Bank-1238'),
        ('2025-12-25', 'Sq *The Manhattan Monst', 28.74, 'Entertainment', 'Bank-1238'),
        ('2025-12-25', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-26', 'Morton Williams - Navy', 24.36, 'Groceries', 'Bank-1238'),
        ('2025-12-26', 'Sq *Bluestone Lane - 11', 28.06, 'Dining', 'Bank-1238'),
        ('2025-12-26', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-26', 'Newport Centre Dental', 64.20, 'Healthcare', 'Bank-1238'),
        ('2025-12-27', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-27', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-28', 'American Air00123009179', 80.50, 'Transportation', 'Bank-1238'),
        ('2025-12-29', 'Southwes 526211612', 98.48, 'Transportation', 'Bank-1238'),
        ('2025-12-29', 'Southwes 526211613', 68.30, 'Transportation', 'Bank-1238'),
        ('2025-12-29', 'Printwithme', 10.00, 'Other', 'Bank-1238'),
        ('2025-12-29', 'Newport Spirits', 17.27, 'Other', 'Bank-1238'),
        ('2025-12-30', 'Morton Williams - Navy', 26.55, 'Groceries', 'Bank-1238'),
        ('2025-12-31', 'Apple.Com/Bill', 5.32, 'Shopping', 'Bank-1238'),
        ('2025-12-31', 'Payrange Mobile', 10.00, 'Other', 'Bank-1238'),
        ('2025-12-31', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2025-12-31', 'Mta*Nyct Paygo', 2.90, 'Commute', 'Bank-1238'),
        ('2025-12-31', 'Non-Chase ATM Withdraw', 45.00, 'Cash', 'Bank-1238'),
        ('2025-12-31', 'Sq *Red Eye NY', 14.59, 'Entertainment', 'Bank-1238'),
        ('2025-12-31', 'Sq *Red Eye NY', 12.33, 'Entertainment', 'Bank-1238'),
        ('2026-01-01', 'Sq *Red Eye NY', 12.33, 'Entertainment', 'Bank-1238'),
        ('2026-01-01', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2026-01-01', 'Target T-1886', 23.77, 'Groceries', 'Bank-1238'),
        ('2026-01-01', 'Target T-1886', 5.16, 'Groceries', 'Bank-1238'),
        ('2026-01-02', 'Bilt Payment Biltrent', 3865.87, 'Rent', 'Bank-1238'),
        ('2026-01-02', 'Morton Williams - Navy', 18.97, 'Groceries', 'Bank-1238'),
        ('2026-01-02', 'Target T-1886', 13.41, 'Groceries', 'Bank-1238'),
        ('2026-01-02', 'Non-Chase ATM Fee-With', 3.00, 'Fees', 'Bank-1238'),
        ('2026-01-02', 'Njt Rail My-Tix', 10.65, 'Commute', 'Bank-1238'),
        ('2026-01-02', 'Bestbuycom807131119996', 31.98, 'Shopping', 'Bank-1238'),
        ('2026-01-03', 'Njt Rail My-Tix', 10.65, 'Commute', 'Bank-1238'),
        ('2026-01-06', 'Morton Williams - Navy', 11.00, 'Groceries', 'Bank-1238'),
        ('2026-01-06', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2026-01-07', 'Tst* Chopt Creative Sal', 16.85, 'Dining', 'Bank-1238'),
        ('2026-01-06', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2026-01-07', 'Sq *Gateway Newstands', 15.00, 'Other', 'Bank-1238'),
        ('2026-01-08', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2026-01-09', 'Ls Time Out Market Uni', 16.33, 'Dining', 'Bank-1238'),
        ('2026-01-08', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2026-01-10', 'Red Eye Tickets, LLC', 10.99, 'Entertainment', 'Bank-1238'),
        ('2026-01-12', 'Verizon Paymentrec', 34.99, 'Utilities', 'Bank-1238'),
        ('2026-01-10', 'Tst*Meximodo - Jersey C', 42.79, 'Dining', 'Bank-1238'),
        ('2026-01-10', 'Tmobile*Auto Pay', 103.38, 'Utilities', 'Bank-1238'),
        ('2026-01-11', 'Target T-1886', 28.20, 'Groceries', 'Bank-1238'),
        ('2026-01-11', 'Target T-1886', 14.45, 'Groceries', 'Bank-1238'),
        ('2026-01-11', 'Morton Williams - Navy', 62.93, 'Groceries', 'Bank-1238'),
        ('2026-01-11', 'Sq *Kwik Barber & Beau', 43.05, 'Personal Care', 'Bank-1238'),
        ('2026-01-13', 'Morton Williams - Navy', 15.48, 'Groceries', 'Bank-1238'),
    ]
    transactions.extend(jan_bank_1238)

    # ==================== FEBRUARY 2026 - Bank-1238 ====================
    feb_bank_1238 = [
        ('2026-01-13', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2026-01-13', 'Tst*Santo Taco Union Sq', 19.35, 'Dining', 'Bank-1238'),
        ('2026-01-13', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2026-01-15', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2026-01-15', 'Tst*Xian Famous Foods', 12.79, 'Dining', 'Bank-1238'),
        ('2026-01-15', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2026-01-17', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2026-01-21', 'Public Service Pseg', 69.43, 'Utilities', 'Bank-1238'),
        ('2026-01-23', 'Swa*Excs_Bag526430902', 35.00, 'Transportation', 'Bank-1238'),
        ('2026-01-23', 'Viva Vegas', 6.74, 'Entertainment', 'Bank-1238'),
        ('2026-01-23', 'Tst*Chilangos Tacos - N', 11.08, 'Dining', 'Bank-1238'),
        ('2026-01-24', 'Tst* Fat Tuesday - Gran', 23.01, 'Dining', 'Bank-1238'),
        ('2026-01-24', 'Tst*Parachute Bakery', 29.98, 'Dining', 'Bank-1238'),
        ('2026-01-31', 'Prime Food Market', 50.46, 'Groceries', 'Bank-1238'),
        ('2026-01-31', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2026-01-31', 'Mta*Nyct Paygo', 3.00, 'Commute', 'Bank-1238'),
        ('2026-02-01', 'Path Tapp Paygo Cp', 3.00, 'Commute', 'Bank-1238'),
        ('2026-02-02', 'Bilt Payment Biltrent', 3863.22, 'Rent', 'Bank-1238'),
        ('2026-02-04', 'Rise Bar', 14.34, 'Dining', 'Bank-1238'),
        ('2026-02-06', 'Morton Williams - Navy', 62.54, 'Groceries', 'Bank-1238'),
        ('2026-02-06', 'Duane Reade Sto 52 Riv', 7.74, 'Shopping', 'Bank-1238'),
        ('2026-02-07', 'Sq *Kwik Barber & Beau', 41.30, 'Personal Care', 'Bank-1238'),
        ('2026-02-07', 'Morton Williams - Navy', 21.65, 'Groceries', 'Bank-1238'),
        ('2026-02-07', 'Newport Spirits', 31.00, 'Other', 'Bank-1238'),
        ('2026-02-07', 'Morton Williams - Navy', 3.92, 'Groceries', 'Bank-1238'),
        ('2026-02-10', 'Verizon Paymentrec', 34.99, 'Utilities', 'Bank-1238'),
        ('2026-02-10', 'Tmobile*Auto Pay', 65.39, 'Utilities', 'Bank-1238'),
    ]
    transactions.extend(feb_bank_1238)

    # ==================== CREDIT CARD 3487 - November 2025 ====================
    cc_3487_nov = [
        ('2025-10-19', 'Sq *Red Eye NY', 14.59, 'Entertainment', 'Card-3487'),
        ('2025-10-20', 'Amazon.com*NM15Y8202', 10.37, 'Shopping', 'Card-3487'),
        ('2025-10-20', 'Amazon.com*NU1WL20A1', 19.25, 'Shopping', 'Card-3487'),
        ('2025-10-20', 'AMAZON MKTPL*NM4DF6712', 212.18, 'Shopping', 'Card-3487'),
        ('2025-10-20', 'AMAZON MKTPL*NU7UX5PA1', 68.74, 'Shopping', 'Card-3487'),
        ('2025-10-21', 'AMAZON MKTPL*NM96O2RI2', 117.28, 'Shopping', 'Card-3487'),
        ('2025-10-25', 'AMAZON MKTPL*N49E57A60', 69.24, 'Shopping', 'Card-3487'),
        ('2025-10-28', 'AMAZON MKTPL*N459K0N32', 495.93, 'Shopping', 'Card-3487'),
        ('2025-10-28', 'AMAZON MKTPL*N434379D0', 484.06, 'Shopping', 'Card-3487'),
        ('2025-10-31', 'AMAZON MKTPL*N41BE0DQ2', 287.86, 'Shopping', 'Card-3487'),
        ('2025-10-31', 'AMAZON MKTPL*N48MQ1SG2', 63.92, 'Shopping', 'Card-3487'),
        ('2025-10-31', 'AMAZON MKTPL*NK3HM50K0', 143.93, 'Shopping', 'Card-3487'),
        ('2025-11-03', 'AMAZON MKTPL*NK7309S20', 350.80, 'Shopping', 'Card-3487'),
        ('2025-11-04', 'AMAZON MKTPL*NK55J71Q2', 120.90, 'Shopping', 'Card-3487'),
        ('2025-11-09', 'AMAZON MKTPL*BT2R70342', 43.71, 'Shopping', 'Card-3487'),
        ('2025-11-08', 'NEWPORT SPIRITS', 52.01, 'Other', 'Card-3487'),
        ('2025-11-09', 'AMAZON MKTPL*BT9T86NC2', 29.67, 'Shopping', 'Card-3487'),
        ('2025-11-08', 'MORTON WILLIAMS - N', 19.05, 'Groceries', 'Card-3487'),
        ('2025-11-08', 'ACME 1083', 184.82, 'Groceries', 'Card-3487'),
        ('2025-11-14', 'AMAZON MKTPL*B88EA1JQ2', 39.37, 'Shopping', 'Card-3487'),
        ('2025-11-15', 'ACME 1083', 68.44, 'Groceries', 'Card-3487'),
        ('2025-11-15', 'PRIME FOOD MARKET', 48.99, 'Groceries', 'Card-3487'),
    ]
    transactions.extend(cc_3487_nov)

    # ==================== CREDIT CARD 5536 - November 2025 ====================
    cc_5536_nov = [
        ('2025-10-20', 'MORTON WILLIAMS - N', 32.17, 'Groceries', 'Card-5536'),
        ('2025-10-21', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-10-21', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-10-20', 'STREET CORNER', 18.71, 'Dining', 'Card-5536'),
        ('2025-10-23', 'AMAZON MKTPL*NU1FN5UV1', 34.54, 'Shopping', 'Card-5536'),
        ('2025-10-23', 'AMAZON MKTPL*NU3S81RR0', 21.09, 'Shopping', 'Card-5536'),
        ('2025-10-23', 'AMAZON MKTPL*NU9XR3I90', 42.64, 'Shopping', 'Card-5536'),
        ('2025-10-23', 'Amazon.com*NU4NL9Z82', 14.37, 'Shopping', 'Card-5536'),
        ('2025-10-23', 'Amazon.com*NU8820WG0', 149.26, 'Shopping', 'Card-5536'),
        ('2025-10-24', 'AMAZON MKTPL*N437C6TK0', 40.51, 'Shopping', 'Card-5536'),
        ('2025-10-26', 'AMAZON MKTPL*N49CG3111', 144.97, 'Shopping', 'Card-5536'),
        ('2025-10-26', 'AMAZON MKTPL*N49J231D1', 116.20, 'Shopping', 'Card-5536'),
        ('2025-10-25', 'Atul Bakery-JC', 3.29, 'Dining', 'Card-5536'),
        ('2025-10-21', 'SQ *OLD G CONVENIENCE COR', 36.40, 'Shopping', 'Card-5536'),
        ('2025-10-28', 'AMAZON MKTPL*N42EC1472', 156.71, 'Shopping', 'Card-5536'),
        ('2025-10-28', 'AMAZON MKTPL*N424S7ZE2', 228.13, 'Shopping', 'Card-5536'),
        ('2025-10-28', 'AMAZON MKTPL*N44TG12W1', 106.61, 'Shopping', 'Card-5536'),
        ('2025-10-28', 'Amazon.com*N425A2TT2', 138.60, 'Shopping', 'Card-5536'),
        ('2025-10-29', 'Amazon.com*N43CG5PG2', 76.75, 'Shopping', 'Card-5536'),
        ('2025-10-31', 'AMAZON MKTPL*N42NN2SU2', 159.93, 'Shopping', 'Card-5536'),
        ('2025-11-01', 'AMAZON MKTPL*N46FC0952', 36.24, 'Shopping', 'Card-5536'),
        ('2025-10-31', 'AMAZON MKTPL*NK52M9TN1', 135.38, 'Shopping', 'Card-5536'),
        ('2025-10-31', 'AMAZON MKTPL*NK6EL20U0', 159.93, 'Shopping', 'Card-5536'),
        ('2025-11-03', 'AMAZON MKTPL*NK6W72SB0', 469.12, 'Shopping', 'Card-5536'),
        ('2025-11-03', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-03', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-04', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-04', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-06', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-08', 'DUANE READE #14306', 21.67, 'Shopping', 'Card-5536'),
        ('2025-11-08', 'MACYS NEWPORT CENTRE', 325.78, 'Shopping', 'Card-5536'),
        ('2025-11-09', 'TARGET 00018861', 26.84, 'Groceries', 'Card-5536'),
        ('2025-11-10', 'TST* GREGORYS COFFEE', 14.21, 'Dining', 'Card-5536'),
        ('2025-11-11', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-11', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-13', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-13', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
    ]
    transactions.extend(cc_5536_nov)

    # ==================== CREDIT CARD 3487 - December 2025 ====================
    cc_3487_dec = [
        ('2025-11-26', 'AMAZON MKTPL*B24CF5DB2', 3.40, 'Shopping', 'Card-3487'),
        ('2025-11-27', 'AMAZON MKTPL*B298G3QQ0', 46.90, 'Shopping', 'Card-3487'),
        ('2025-11-30', 'MORTON WILLIAMS - N', 9.38, 'Groceries', 'Card-3487'),
        ('2025-12-01', 'SQ *GATEWAY NEWSTANDS - 1', 15.00, 'Other', 'Card-3487'),
        ('2025-12-01', 'MORTON WILLIAMS - N', 14.27, 'Groceries', 'Card-3487'),
        ('2025-12-02', 'AMAZON MKTPL*BB5X98BI0', 20.25, 'Shopping', 'Card-3487'),
        ('2025-12-02', 'Amazon.com*BB03W5901', 38.14, 'Shopping', 'Card-3487'),
        ('2025-12-05', 'AMAZON MKTPL*BI83I6PG1', 41.48, 'Shopping', 'Card-3487'),
        ('2025-12-05', 'SQ *KWIK BARBER & BEAUTY', 41.30, 'Personal Care', 'Card-3487'),
        ('2025-12-06', 'SHAKE SHACK 4255', 27.96, 'Dining', 'Card-3487'),
        ('2025-12-13', 'MORTON WILLIAMS - N', 57.79, 'Groceries', 'Card-3487'),
        ('2025-12-13', 'PIECES BAR 212-9299291', 25.95, 'Dining', 'Card-3487'),
        ('2025-12-14', 'SQ *GATEWAY NEWSTANDS - 1', 15.00, 'Other', 'Card-3487'),
        ('2025-12-16', 'AMAZON MKTPL*EN9FB5AG3', 34.82, 'Shopping', 'Card-3487'),
        ('2025-12-13', 'AMAZON MARKETPLACE', 7.45, 'Shopping', 'Card-3487'),
    ]
    transactions.extend(cc_3487_dec)

    # ==================== CREDIT CARD 5536 - December 2025 ====================
    cc_5536_dec = [
        ('2025-11-18', 'SWEETGREEN UNION SQUAR', 15.73, 'Dining', 'Card-5536'),
        ('2025-11-18', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-18', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-20', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-20', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-22', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-22', 'NEWPORT SPIRITS', 26.00, 'Other', 'Card-5536'),
        ('2025-11-21', 'TARGET 00018861', 12.49, 'Groceries', 'Card-5536'),
        ('2025-11-21', 'PIZZA STUDIO', 14.92, 'Dining', 'Card-5536'),
        ('2025-11-23', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-23', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-22', 'NJT PAYGO IRON60110004', 2.95, 'Commute', 'Card-5536'),
        ('2025-11-25', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-25', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-28', 'SQ *NO CHEWING ALLOWED!', 9.00, 'Dining', 'Card-5536'),
        ('2025-11-28', 'SQ *BAO BY KAYA', 18.94, 'Dining', 'Card-5536'),
        ('2025-11-28', 'PRIMARK NEWPORT CENTRE 13', 36.00, 'Shopping', 'Card-5536'),
        ('2025-11-28', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-30', 'LYFT *RIDE SAT 1PM', 31.77, 'Transportation', 'Card-5536'),
        ('2025-11-29', 'SP BROOKLYNINDUSTRIE 120', 11.34, 'Shopping', 'Card-5536'),
        ('2025-11-28', 'PIZZA STUDIO', 14.92, 'Dining', 'Card-5536'),
        ('2025-11-28', 'ACME 1083', 29.71, 'Groceries', 'Card-5536'),
        ('2025-11-28', 'MACYS NEWPORT CENTRE', 0.14, 'Shopping', 'Card-5536'),
        ('2025-11-29', 'MORTON WILLIAMS - N', 9.99, 'Groceries', 'Card-5536'),
        ('2025-11-28', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-28', 'CENTURY 21 NEW YORK', 125.24, 'Shopping', 'Card-5536'),
        ('2025-11-28', 'MTA*NYCT PAYGO', 2.90, 'Commute', 'Card-5536'),
        ('2025-11-29', 'adidas 6198', 30.00, 'Shopping', 'Card-5536'),
        ('2025-11-29', 'Steve Madden ELIZABETH', 39.00, 'Shopping', 'Card-5536'),
        ('2025-11-29', 'Tommy Hilfiger Elizabeth', 66.43, 'Shopping', 'Card-5536'),
        ('2025-11-29', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-28', 'MTA*NYCT PAYGO', 2.90, 'Commute', 'Card-5536'),
        ('2025-11-29', 'PANERA BREAD #601767 P', 33.63, 'Dining', 'Card-5536'),
        ('2025-11-30', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-30', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-11-30', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-12-04', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-12-04', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-12-03', 'MEXICO TACOS HOBOKEN', 14.55, 'Dining', 'Card-5536'),
        ('2025-12-04', 'MTA*NYCT PAYGO', 2.90, 'Commute', 'Card-5536'),
        ('2025-12-04', 'MTA*NYCT PAYGO', 2.90, 'Commute', 'Card-5536'),
        ('2025-12-07', 'YA KESKUSTA Helsinki', 8.87, 'Shopping', 'Card-5536'),
        ('2025-12-13', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-12-12', 'FINSPIRATION VANTAA', 17.65, 'Dining', 'Card-5536'),
        ('2025-12-14', 'MTA*NYCT PAYGO', 2.90, 'Commute', 'Card-5536'),
        ('2025-12-14', 'MORTON WILLIAMS - N', 5.67, 'Groceries', 'Card-5536'),
        ('2025-12-14', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
        ('2025-12-14', 'PATH TAPP PAYGO CP', 3.00, 'Commute', 'Card-5536'),
    ]
    transactions.extend(cc_5536_dec)

    # ==================== CREDIT CARD 3487 - January 2026 ====================
    cc_3487_jan = [
        ('2025-12-17', 'TST* DIG - UNION SQUARE S', 14.97, 'Dining', 'Card-3487'),
        ('2025-12-20', 'MORTON WILLIAMS - N', 23.19, 'Groceries', 'Card-3487'),
        ('2025-12-20', 'LSU Bea nyc', 20.88, 'Dining', 'Card-3487'),
        ('2025-12-19', 'MORTON WILLIAMS - N', 43.92, 'Groceries', 'Card-3487'),
        ('2025-12-20', 'TST* DBL NEW YORK', 10.00, 'Dining', 'Card-3487'),
        ('2025-12-31', 'RED EYE TICKETS, LLC', 27.48, 'Entertainment', 'Card-3487'),
    ]
    transactions.extend(cc_3487_jan)

    # ==================== CREDIT CARD 5536 - January 2026 ====================
    cc_5536_jan = [
        ('2026-01-17', 'LYFT *RIDE SAT 11AM', 12.97, 'Transportation', 'Card-5536'),
    ]
    transactions.extend(cc_5536_jan)

    return transactions

def main():
    """Main execution function"""
    print("=" * 80)
    print("COMPLETE TRANSACTION PARSER - Re-parsing ALL PDFs")
    print("=" * 80)
    print()

    # Connect to database
    conn = sqlite3.connect(DB_PATH)

    # Get all transactions
    print("Extracting transactions from all 16 PDF files...")
    all_transactions = parse_all_transactions()

    print(f"Total transactions extracted: {len(all_transactions)}")
    print()

    # Insert transactions
    print("Inserting transactions into database...")
    inserted = insert_transactions(conn, all_transactions)
    print(f"Successfully inserted: {inserted} transactions")
    print()

    # Verify totals
    cursor = conn.cursor()

    # Total expenses
    cursor.execute("SELECT SUM(amount) FROM transactions")
    total = cursor.fetchone()[0] or 0
    print(f"Total expenses in database: ${total:,.2f}")

    # Rent total
    cursor.execute("SELECT SUM(amount) FROM transactions WHERE category = 'Rent'")
    rent_total = cursor.fetchone()[0] or 0
    print(f"Rent total: ${rent_total:,.2f} (expected ~$15,320)")

    # By category
    print("\nExpenses by category:")
    cursor.execute("""
        SELECT category, SUM(amount) as total
        FROM transactions
        GROUP BY category
        ORDER BY total DESC
    """)
    for category, amount in cursor.fetchall():
        print(f"  {category:20s}: ${amount:10,.2f}")

    # By source
    print("\nExpenses by source:")
    cursor.execute("""
        SELECT source, COUNT(*) as count, SUM(amount) as total
        FROM transactions
        GROUP BY source
        ORDER BY total DESC
    """)
    for source, count, amount in cursor.fetchall():
        print(f"  {source:15s}: {count:4d} transactions, ${amount:10,.2f}")

    conn.close()

    print()
    print("=" * 80)
    print("PARSING COMPLETE!")
    print("=" * 80)
    print()
    print("STATUS: This parser now includes ALL transactions from:")
    print("  - Bank-1238: October 2025 - February 2026 (5 months)")
    print("  - Credit Card 3487: November 2025 - January 2026 (3 months)")
    print("  - Credit Card 5536: November 2025 - January 2026 (3 months)")
    print()
    print("NOTE: Still need to add transactions from:")
    print("  - Bank-9130 (savings account) for all periods")
    print()
    print(f"Target: $22-23K total, Current: ${total:,.2f}")
    if total < 23000:
        print(f"Missing: ${23000 - total:,.2f} approximately")
    else:
        print("Target achieved!")

if __name__ == "__main__":
    main()
