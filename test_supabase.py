"""
Test Supabase Connection
Run this script to verify your Supabase configuration is working correctly
"""

import sys
import os

# Add the backend directory to the path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
sys.path.insert(0, backend_dir)

def test_supabase_setup():
    """Test all aspects of Supabase setup"""
    
    print("=" * 60)
    print("AI Study Coach - Supabase Connection Test")
    print("=" * 60)
    print()
    
    # Test 1: Check if .env file exists
    print("1. Checking for .env file...")
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        print("   ✓ .env file found")
    else:
        print("   ✗ .env file not found")
        print("   → Copy .env.example to .env and add your credentials")
        return False
    print()
    
    # Test 2: Load configuration
    print("2. Loading configuration...")
    try:
        from config import Config
        Config.validate_config()
        print("   ✓ Configuration loaded successfully")
        print(f"   → Supabase URL: {Config.SUPABASE_URL}")
    except Exception as e:
        print(f"   ✗ Configuration error: {e}")
        return False
    print()
    
    # Test 3: Initialize Supabase client
    print("3. Initializing Supabase client...")
    try:
        from supabase_client import get_supabase_client
        client = get_supabase_client()
        print("   ✓ Supabase client initialized")
    except Exception as e:
        print(f"   ✗ Client initialization failed: {e}")
        return False
    print()
    
    # Test 4: Test database connection
    print("4. Testing database connection...")
    try:
        response = client.table('study_sessions').select('count').execute()
        print("   ✓ Database connection successful")
        print(f"   → study_sessions table is accessible")
    except Exception as e:
        print(f"   ✗ Database connection failed: {e}")
        print("   → Make sure you ran the schema.sql in Supabase SQL Editor")
        return False
    print()
    
    # Test 5: Test database service
    print("5. Testing database service...")
    try:
        from database_service import DatabaseService
        db_service = DatabaseService()
        sessions = db_service.get_all_study_sessions()
        print(f"   ✓ Database service working")
        print(f"   → Found {len(sessions)} study sessions")
    except Exception as e:
        print(f"   ✗ Database service error: {e}")
        return False
    print()
    
    # Test 6: Create a test session
    print("6. Testing create operation...")
    try:
        test_session = {
            'subject': 'Test Subject',
            'duration': 30,
            'focus_level': 4,
            'difficulty': 3
        }
        created = db_service.create_study_session(test_session)
        print(f"   ✓ Test session created with ID: {created['id']}")
        
        # Clean up - delete the test session
        db_service.delete_study_session(created['id'])
        print(f"   ✓ Test session deleted")
    except Exception as e:
        print(f"   ✗ Create operation failed: {e}")
        return False
    print()
    
    print("=" * 60)
    print("All tests passed! ✓")
    print("Your Supabase integration is working correctly.")
    print("=" * 60)
    return True


if __name__ == '__main__':
    try:
        success = test_supabase_setup()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
