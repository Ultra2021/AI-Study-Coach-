"""
Supabase Client Configuration
Initializes and provides access to Supabase client
"""

from supabase import create_client, Client
from config import Config

class SupabaseClient:
    """Singleton class for Supabase client"""
    
    _instance = None
    _client: Client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseClient, cls).__new__(cls)
            cls._instance._initialize_client()
        return cls._instance
    
    def _initialize_client(self):
        """Initialize the Supabase client"""
        try:
            Config.validate_config()
            self._client = create_client(
                Config.SUPABASE_URL,
                Config.SUPABASE_SERVICE_KEY
            )
            print("✓ Supabase client initialized successfully")
            print(f"  Connected to: {Config.SUPABASE_URL}")
        except Exception as e:
            print(f"✗ Failed to initialize Supabase client: {e}")
            print("  Please check your .env file and Supabase credentials")
            raise
    
    @property
    def client(self) -> Client:
        """Get the Supabase client instance"""
        return self._client
    
    def test_connection(self):
        """Test the Supabase connection"""
        try:
            # Try to query the study_sessions table
            response = self._client.table('study_sessions').select('*').limit(1).execute()
            print("✓ Supabase connection test successful")
            return True
        except Exception as e:
            print(f"⚠ Supabase connection test failed: {e}")
            print("→ Make sure you've run the SQL schema in Supabase SQL Editor")
            return False


# Create a global instance
supabase_client = SupabaseClient()

def get_supabase_client() -> Client:
    """Get the Supabase client instance"""
    return supabase_client.client
