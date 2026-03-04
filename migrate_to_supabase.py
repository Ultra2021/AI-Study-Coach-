"""
Migration Script: SQLite to Supabase
This script helps migrate existing study sessions from SQLite to Supabase
"""

import sys
import os
import sqlite3
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def migrate_sqlite_to_supabase():
    """Migrate data from SQLite database to Supabase"""
    
    print("=" * 60)
    print("SQLite to Supabase Migration Tool")
    print("=" * 60)
    print()
    
    # Check if SQLite database exists
    sqlite_db_path = os.path.join('backend', 'study_coach.db')
    
    if not os.path.exists(sqlite_db_path):
        print("✗ SQLite database not found at:", sqlite_db_path)
        print("→ No migration needed. You can start fresh with Supabase!")
        return True
    
    print(f"✓ Found SQLite database: {sqlite_db_path}")
    print()
    
    # Connect to SQLite database
    try:
        sqlite_conn = sqlite3.connect(sqlite_db_path)
        sqlite_cursor = sqlite_conn.cursor()
        print("✓ Connected to SQLite database")
    except Exception as e:
        print(f"✗ Failed to connect to SQLite: {e}")
        return False
    
    # Count records in SQLite
    try:
        sqlite_cursor.execute("SELECT COUNT(*) FROM study_sessions")
        total_records = sqlite_cursor.fetchone()[0]
        print(f"✓ Found {total_records} records to migrate")
        
        if total_records == 0:
            print("→ No records to migrate. Starting fresh with Supabase!")
            sqlite_conn.close()
            return True
        
        print()
        
    except Exception as e:
        print(f"✗ Error counting records: {e}")
        sqlite_conn.close()
        return False
    
    # Initialize Supabase connection
    try:
        from backend.database_service import DatabaseService
        db_service = DatabaseService()
        print("✓ Connected to Supabase")
        print()
    except Exception as e:
        print(f"✗ Failed to connect to Supabase: {e}")
        print("→ Make sure your .env file is configured correctly")
        sqlite_conn.close()
        return False
    
    # Fetch all records from SQLite
    try:
        sqlite_cursor.execute("""
            SELECT id, subject, duration, focus_level, difficulty, timestamp
            FROM study_sessions
            ORDER BY id
        """)
        sqlite_records = sqlite_cursor.fetchall()
    except Exception as e:
        print(f"✗ Error fetching SQLite records: {e}")
        sqlite_conn.close()
        return False
    
    # Migrate records to Supabase
    print(f"Migrating {len(sqlite_records)} records...")
    print()
    
    migrated = 0
    failed = 0
    
    for record in sqlite_records:
        sqlite_id, subject, duration, focus_level, difficulty, timestamp = record
        
        try:
            # Create session data
            session_data = {
                'subject': subject,
                'duration': duration,
                'focus_level': focus_level,
                'difficulty': difficulty
            }
            
            # Insert into Supabase
            db_service.create_study_session(session_data)
            migrated += 1
            print(f"  ✓ Migrated record {migrated}/{total_records}: {subject}")
            
        except Exception as e:
            failed += 1
            print(f"  ✗ Failed to migrate record (ID: {sqlite_id}): {e}")
    
    # Close SQLite connection
    sqlite_conn.close()
    
    # Print summary
    print()
    print("=" * 60)
    print("Migration Summary")
    print("=" * 60)
    print(f"Total records: {total_records}")
    print(f"Successfully migrated: {migrated}")
    print(f"Failed: {failed}")
    print()
    
    if migrated == total_records:
        print("✓ Migration completed successfully!")
        print()
        print("You can now:")
        print("1. Rename backend/app.py to backend/app_sqlite.py (backup)")
        print("2. Rename backend/app_supabase.py to backend/app.py")
        print("3. Restart your application")
        return True
    else:
        print("⚠ Migration completed with some errors")
        print("→ Please review the failed records and try again")
        return False


if __name__ == '__main__':
    try:
        print()
        confirm = input("This will migrate your SQLite data to Supabase. Continue? (y/n): ")
        
        if confirm.lower() != 'y':
            print("Migration cancelled.")
            sys.exit(0)
        
        print()
        success = migrate_sqlite_to_supabase()
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n\nMigration cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
