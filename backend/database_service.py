"""
Database Service Layer
Handles all database operations using Supabase
"""

from datetime import datetime
from typing import List, Dict, Optional
from supabase_client import get_supabase_client


class DatabaseService:
    """Service class for database operations"""
    
    def __init__(self):
        self.client = get_supabase_client()
    
    def create_study_session(self, session_data: Dict, user_id: str) -> Dict:
        """
        Create a new study session
        
        Args:
            session_data: Dictionary with keys: subject, duration, focus_level, difficulty
            user_id: UUID of the user creating the session
            
        Returns:
            Created session data with id
        """
        try:
            response = self.client.table('study_sessions').insert({
                'user_id': user_id,
                'subject': session_data['subject'],
                'duration': session_data['duration'],
                'focus_level': session_data['focus_level'],
                'difficulty': session_data['difficulty'],
                'notes': session_data.get('notes'),
                'timestamp': datetime.utcnow().isoformat()
            }).execute()
            
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error creating study session: {e}")
            raise
    
    def get_all_study_sessions(self, user_id: str = None) -> List[Dict]:
        """
        Retrieve all study sessions, optionally filtered by user
        
        Args:
            user_id: Optional UUID to filter sessions by user
            
        Returns:
            List of study sessions
        """
        try:
            query = self.client.table('study_sessions').select('*')
            
            if user_id:
                query = query.eq('user_id', user_id)
            
            response = query.order('timestamp', desc=True).execute()
            
            return response.data if response.data else []
        except Exception as e:
            print(f"Error fetching study sessions: {e}")
            raise
    
    def get_study_session_by_id(self, session_id: int) -> Optional[Dict]:
        """
        Get a specific study session by ID
        
        Args:
            session_id: The ID of the session
            
        Returns:
            Session data or None
        """
        try:
            response = self.client.table('study_sessions')\
                .select('*')\
                .eq('id', session_id)\
                .execute()
            
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error fetching study session {session_id}: {e}")
            raise
    
    def get_sessions_by_subject(self, subject: str, user_id: str = None) -> List[Dict]:
        """
        Get all sessions for a specific subject
        
        Args:
            subject: The subject to filter by
            user_id: Optional UUID to filter by user
            
        Returns:
            List of sessions for the subject
        """
        try:
            query = self.client.table('study_sessions')\
                .select('*')\
                .eq('subject', subject)
            
            if user_id:
                query = query.eq('user_id', user_id)
            
            response = query.order('timestamp', desc=True).execute()
            
            return response.data if response.data else []
        except Exception as e:
            print(f"Error fetching sessions for subject {subject}: {e}")
            raise
    
    def update_study_session(self, session_id: int, update_data: Dict) -> Dict:
        """
        Update an existing study session
        
        Args:
            session_id: The ID of the session to update
            update_data: Dictionary with fields to update
            
        Returns:
            Updated session data
        """
        try:
            response = self.client.table('study_sessions')\
                .update(update_data)\
                .eq('id', session_id)\
                .execute()
            
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error updating study session {session_id}: {e}")
            raise
    
    def delete_study_session(self, session_id: int) -> bool:
        """
        Delete a study session
        
        Args:
            session_id: The ID of the session to delete
            
        Returns:
            True if successful
        """
        try:
            self.client.table('study_sessions')\
                .delete()\
                .eq('id', session_id)\
                .execute()
            
            return True
        except Exception as e:
            print(f"Error deleting study session {session_id}: {e}")
            raise
    
    def get_study_statistics(self, user_id: str = None) -> Dict:
        """
        Get aggregated study statistics
        
        Args:
            user_id: Optional UUID to get stats for specific user
            
        Returns:
            Dictionary with statistics
        """
        try:
            sessions = self.get_all_study_sessions()
            
            if not sessions:
                return {
                    'total_sessions': 0,
                    'total_duration': 0,
                    'avg_focus': 0,
                    'avg_difficulty': 0,
                    'subjects': []
                }
            
            total_duration = sum(s['duration'] for s in sessions)
            avg_focus = sum(s['focus_level'] for s in sessions) / len(sessions)
            avg_difficulty = sum(s['difficulty'] for s in sessions) / len(sessions)
            
            # Group by subject
            subjects = {}
            for session in sessions:
                subject = session['subject']
                if subject not in subjects:
                    subjects[subject] = {
                        'count': 0,
                        'total_duration': 0
                    }
                subjects[subject]['count'] += 1
                subjects[subject]['total_duration'] += session['duration']
            
            return {
                'total_sessions': len(sessions),
                'total_duration': total_duration,
                'avg_focus': round(avg_focus, 2),
                'avg_difficulty': round(avg_difficulty, 2),
                'subjects': subjects
            }
        except Exception as e:
            print(f"Error calculating statistics: {e}")
            raise


# Create a global instance
db_service = DatabaseService()
