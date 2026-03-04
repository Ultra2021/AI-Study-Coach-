"""
Generate Secure Secret Key for Flask
Run this to generate a random secret key for your .env file
"""

import secrets

def generate_secret_key():
    """Generate a secure random secret key"""
    key = secrets.token_hex(32)
    return key

if __name__ == '__main__':
    print("=" * 60)
    print("Flask Secret Key Generator")
    print("=" * 60)
    print()
    print("Generated secure secret key:")
    print()
    print(generate_secret_key())
    print()
    print("Copy this key and add it to your .env file:")
    print("SECRET_KEY=<paste_the_key_here>")
    print("=" * 60)
