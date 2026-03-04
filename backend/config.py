"""
Configuration module for AI Study Coach
Loads environment variables and provides configuration settings
"""

import os
from dotenv import load_dotenv
from pathlib import Path

# Get the root directory (one level up from backend)
root_dir = Path(__file__).resolve().parent.parent
env_path = root_dir / '.env'

# Debug: Print the path being used
print(f"Looking for .env at: {env_path}")
print(f"File exists: {env_path.exists()}")

# Load environment variables from .env file in the project root
# override=True ensures .env values always take precedence over cached shell env vars
loaded = load_dotenv(dotenv_path=str(env_path), override=True)
print(f"Dotenv loaded successfully: {loaded}")

class Config:
    """Application configuration class"""
    
    # Supabase Configuration - strip whitespace from values
    SUPABASE_URL = os.getenv('SUPABASE_URL', '').strip()
    SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', '').strip()
    SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '').strip()
    
    # Debug output
    if SUPABASE_URL:
        print(f"DEBUG: Loaded SUPABASE_URL = {SUPABASE_URL}")
    else:
        print("DEBUG: SUPABASE_URL is None or empty")
    
    # Database Configuration
    DATABASE_URL = os.getenv('DATABASE_URL', '').strip()
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'
    
    # API Configuration
    API_PORT = int(os.getenv('API_PORT', 5000))
    
    # SQLAlchemy Configuration
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    
    @staticmethod
    def validate_config():
        """Validate that required configuration is present"""
        required_vars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'DATABASE_URL']
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        
        if missing_vars:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing_vars)}\n"
                f"Please copy .env.example to .env and fill in your Supabase credentials."
            )
        
        return True
