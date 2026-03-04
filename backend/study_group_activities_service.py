"""
Study Group Activities Service
Handles activity feed and logging for study groups
"""

from supabase_client import get_supabase_client
from typing import Optional, Dict

def get_group_activities(group_id: str, user_id: str, limit: int = 20) -> Dict:
    """Get recent activities for a study group"""
    try:
        supabase = get_supabase_client()
        
        # Verify user is a member
        member_check = supabase.table('study_group_members')\
            .select('id')\
            .eq('group_id', group_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if not member_check.data:
            return {
                'success': False,
                'error': 'You must be a member of this group to view activities'
            }
        
        # Get activities using the detailed view
        result = supabase.from_('study_group_recent_activities')\
            .select('*')\
            .eq('group_id', group_id)\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()
        
        return {
            'success': True,
            'activities': result.data if result.data else []
        }
            
    except Exception as e:
        print(f"Error getting activities: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def get_user_activities(user_id: str, limit: int = 20) -> Dict:
    """Get recent activities across all groups for a user"""
    try:
        supabase = get_supabase_client()
        
        # Get all groups user is a member of
        groups = supabase.table('study_group_members')\
            .select('group_id')\
            .eq('user_id', user_id)\
            .execute()
        
        if not groups.data:
            return {
                'success': True,
                'activities': []
            }
        
        group_ids = [g['group_id'] for g in groups.data]
        
        # Get activities from all user's groups
        result = supabase.from_('study_group_recent_activities')\
            .select('*')\
            .in_('group_id', group_ids)\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()
        
        return {
            'success': True,
            'activities': result.data if result.data else []
        }
            
    except Exception as e:
        print(f"Error getting user activities: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def create_activity(group_id: str, user_id: str, activity_type: str, 
                   description: str, metadata: Dict = None) -> Dict:
    """Manually create an activity log (most are auto-created by triggers)"""
    try:
        supabase = get_supabase_client()
        
        activity_data = {
            'group_id': group_id,
            'user_id': user_id,
            'activity_type': activity_type,
            'description': description,
            'metadata': metadata if metadata else {}
        }
        
        result = supabase.table('study_group_activities')\
            .insert(activity_data)\
            .execute()
        
        if result.data and len(result.data) > 0:
            return {
                'success': True,
                'activity': result.data[0]
            }
        else:
            return {
                'success': False,
                'error': 'Failed to create activity'
            }
            
    except Exception as e:
        print(f"Error creating activity: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
