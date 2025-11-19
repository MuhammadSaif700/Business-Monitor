import sqlite3
import sys

conn = sqlite3.connect('business.db')
cursor = conn.cursor()

# Check for data tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'data_%' ORDER BY name DESC LIMIT 5")
tables = [row[0] for row in cursor.fetchall()]
print(f"Data tables in local DB: {tables}")

# If we have tables, check the columns and row count
if tables:
    latest_table = tables[0]
    print(f"\nLatest table: {latest_table}")
    
    # Get columns
    cursor.execute(f"PRAGMA table_info({latest_table})")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Columns: {columns}")
    
    # Get row count
    cursor.execute(f"SELECT COUNT(*) FROM {latest_table}")
    count = cursor.fetchone()[0]
    print(f"Total rows: {count}")
    
    # Check if region column exists and has data
    if 'region' in columns:
        cursor.execute(f"SELECT region, COUNT(*) FROM {latest_table} GROUP BY region")
        regions = cursor.fetchall()
        print(f"\nRegion distribution:")
        for region, cnt in regions:
            print(f"  {region}: {cnt} rows")
    else:
        print("\n⚠️ WARNING: 'region' column not found!")

conn.close()
