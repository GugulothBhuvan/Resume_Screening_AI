import sqlite3

try:
    conn = sqlite3.connect('test.db')
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE candidate_reports ADD COLUMN experience JSON")
    print("Added experience column.")
except Exception as e:
    print(f"Experience column error (might already exist): {e}")

try:
    cursor.execute("ALTER TABLE candidate_reports ADD COLUMN experience_analysis JSON")
    print("Added experience_analysis column.")
except Exception as e:
    print(f"Experience analysis column error: {e}")

conn.commit()
conn.close()
print("Migration completed successfully.")
