"""
Authentication Service
Handles user registration, login, and authentication
"""

from werkzeug.security import generate_password_hash, check_password_hash
from supabase_client import get_supabase_client
import re
from datetime import datetime


class AuthService:
    """Service class for authentication operations"""
    
    def __init__(self):
        self.client = get_supabase_client()
    
    def validate_email(self, email):
        """Validate email format"""
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(email_regex, email) is not None
    
    def validate_password(self, password):
        """
        Validate password strength
        Requirements: At least 6 characters
        """
        if len(password) < 6:
            return False, "Password must be at least 6 characters long"
        return True, "Password is valid"
    
    def validate_username(self, username):
        """Validate username format"""
        if len(username) < 3:
            return False, "Username must be at least 3 characters long"
        if len(username) > 80:
            return False, "Username must be less than 80 characters"
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            return False, "Username can only contain letters, numbers, and underscores"
        return True, "Username is valid"
    
    def user_exists(self, email=None, username=None):
        """Check if user already exists"""
        try:
            if email:
                response = self.client.table('users').select('id').eq('email', email).execute()
                if response.data:
                    return True, "email"
            
            if username:
                response = self.client.table('users').select('id').eq('username', username).execute()
                if response.data:
                    return True, "username"
            
            return False, None
        except Exception as e:
            print(f"Error checking if user exists: {e}")
            raise
    
    def create_user(self, username, email, password):
        """
        Create a new user account
        
        Args:
            username: User's chosen username
            email: User's email address
            password: User's password (will be hashed)
            
        Returns:
            Dictionary with user data or error
        """
        try:
            # Validate username
            valid, message = self.validate_username(username)
            if not valid:
                return {'success': False, 'error': message}
            
            # Validate email
            if not self.validate_email(email):
                return {'success': False, 'error': 'Invalid email format'}
            
            # Validate password
            valid, message = self.validate_password(password)
            if not valid:
                return {'success': False, 'error': message}
            
            # Check if user already exists
            exists, field = self.user_exists(email=email, username=username)
            if exists:
                return {'success': False, 'error': f'User with this {field} already exists'}
            
            # Hash password
            password_hash = generate_password_hash(password, method='pbkdf2:sha256')
            
            # Create user in database
            user_data = {
                'username': username,
                'email': email.lower(),
                'password_hash': password_hash
            }
            
            response = self.client.table('users').insert(user_data).execute()
            
            if response.data:
                user = response.data[0]
                # Don't return password hash
                return {
                    'success': True,
                    'user': {
                        'id': user['id'],
                        'username': user['username'],
                        'email': user['email'],
                        'created_at': user['created_at']
                    }
                }
            else:
                return {'success': False, 'error': 'Failed to create user'}
                
        except Exception as e:
            print(f"Error creating user: {e}")
            return {'success': False, 'error': str(e)}
    
    def authenticate_user(self, email, password):
        """
        Authenticate user with email and password
        
        Args:
            email: User's email
            password: User's password
            
        Returns:
            Dictionary with user data if successful, error otherwise
        """
        try:
            # Get user by email
            response = self.client.table('users').select('*').eq('email', email.lower()).execute()
            
            if not response.data:
                return {'success': False, 'error': 'Invalid email or password'}
            
            user = response.data[0]
            
            # Check password
            if not check_password_hash(user['password_hash'], password):
                return {'success': False, 'error': 'Invalid email or password'}
            
            # Return user data (without password hash)
            return {
                'success': True,
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'created_at': user['created_at']
                }
            }
            
        except Exception as e:
            print(f"Error authenticating user: {e}")
            return {'success': False, 'error': 'Authentication failed'}
    
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        try:
            response = self.client.table('users').select('id, username, email, created_at').eq('id', user_id).execute()
            
            if response.data:
                return {'success': True, 'user': response.data[0]}
            else:
                return {'success': False, 'error': 'User not found'}
                
        except Exception as e:
            print(f"Error getting user: {e}")
            return {'success': False, 'error': str(e)}
    
    def update_user_profile(self, user_id, username=None, email=None):
        """Update user profile information"""
        try:
            update_data = {}
            
            if username:
                valid, message = self.validate_username(username)
                if not valid:
                    return {'success': False, 'error': message}
                update_data['username'] = username
            
            if email:
                if not self.validate_email(email):
                    return {'success': False, 'error': 'Invalid email format'}
                update_data['email'] = email.lower()
            
            if not update_data:
                return {'success': False, 'error': 'No data to update'}
            
            response = self.client.table('users').update(update_data).eq('id', user_id).execute()
            
            if response.data:
                user = response.data[0]
                return {
                    'success': True,
                    'user': {
                        'id': user['id'],
                        'username': user['username'],
                        'email': user['email']
                    }
                }
            else:
                return {'success': False, 'error': 'Failed to update user'}
                
        except Exception as e:
            print(f"Error updating user: {e}")
            return {'success': False, 'error': str(e)}
    
    def change_password(self, user_id, old_password, new_password):
        """Change user password"""
        try:
            # Get user
            response = self.client.table('users').select('password_hash').eq('id', user_id).execute()
            
            if not response.data:
                return {'success': False, 'error': 'User not found'}
            
            user = response.data[0]
            
            # Verify old password
            if not check_password_hash(user['password_hash'], old_password):
                return {'success': False, 'error': 'Current password is incorrect'}
            
            # Validate new password
            valid, message = self.validate_password(new_password)
            if not valid:
                return {'success': False, 'error': message}
            
            # Hash new password
            new_password_hash = generate_password_hash(new_password, method='pbkdf2:sha256')
            
            # Update password
            response = self.client.table('users').update({'password_hash': new_password_hash}).eq('id', user_id).execute()
            
            if response.data:
                return {'success': True, 'message': 'Password changed successfully'}
            else:
                return {'success': False, 'error': 'Failed to change password'}
                
        except Exception as e:
            print(f"Error changing password: {e}")
            return {'success': False, 'error': str(e)}


# Create a global instance
auth_service = AuthService()
