import sqlite3
import sys
sys.path.insert(0, 'backend')

conn = sqlite3.connect('backend/business.db')

# Get all tables
cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [t[0] for t in cursor.fetchall()]
print("Tables in database:")
for t in tables:
    print(f"  - {t}")

# Check the latest data table
latest_table = [t for t in tables if t.startswith('data_')]
if latest_table:
    latest = sorted(latest_table)[-1]
    print(f"\nChecking columns in latest table: {latest}")
    cursor = conn.execute(f"SELECT * FROM {latest} LIMIT 1")
    cols = [desc[0] for desc in cursor.description]
    print(f"Columns: {', '.join(cols)}")
    
    # Check if region or customer columns exist
    print(f"\nHas 'region' column: {'region' in cols}")
    print(f"Has 'customer' column: {'customer' in cols}")
    
    # Check sample data
    cursor = conn.execute(f"SELECT * FROM {latest} LIMIT 3")
    rows = cursor.fetchall()
    print(f"\nSample data ({len(rows)} rows):")
    for row in rows[:3]:
        print(f"  {row}")

conn.close()
