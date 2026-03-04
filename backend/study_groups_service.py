"""
Study Groups Service
Handles all study group related operations
"""

from supabase_client import get_supabase_client
from typing import Optional, List, Dict
import uuid

def create_study_group(name: str, creator_id: str, description: str = None, 
                       location: str = None, tags: List[str] = None) -> Dict:
    """Create a new study group"""
    try:
        supabase = get_supabase_client()
        
        # Insert study group
        group_data = {
            'name': name,
            'creator_id': creator_id,
            'description': description,
            'location': location,
            'total_hours': 0
        }
        
        result = supabase.table('study_groups').insert(group_data).execute()
        
        if result.data and len(result.data) > 0:
            group = result.data[0]
            group_id = group['id']
            
            # Add creator as a member (with conflict handling in case trigger exists)
            try:
                member_data = {
                    'group_id': group_id,
                    'user_id': creator_id,
                    'role': 'creator'
                }
                # Use upsert with on_conflict to handle duplicates
                supabase.table('study_group_members')\
                    .upsert(member_data, on_conflict='group_id,user_id')\
                    .execute()
            except Exception as member_error:
                # Log but don't fail if member insertion has issues
                print(f"Note: Member insertion handled by trigger or already exists: {member_error}")
            
            # Add tags if provided
            if tags:
                tag_data = [{'group_id': group_id, 'tag': tag} for tag in tags]
                supabase.table('study_group_tags').insert(tag_data).execute()
            
            return {
                'success': True,
                'group': group,
                'message': 'Study group created successfully'
            }
        else:
            return {
                'success': False,
                'error': 'Failed to create study group'
            }
            
    except Exception as e:
        print(f"Error creating study group: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def get_user_groups(user_id: str) -> Dict:
    """Get all groups a user is a member of"""
    try:
        supabase = get_supabase_client()
        
        # Get groups where user is a member
        result = supabase.table('study_group_members')\
            .select('group_id')\
            .eq('user_id', user_id)\
            .execute()
        
        if not result.data:
            print(f"No groups found for user {user_id}")
            return {
                'success': True,
                'groups': []
            }
        
        group_ids = [item['group_id'] for item in result.data]
        print(f"Found {len(group_ids)} groups for user {user_id}: {group_ids}")
        
        # Skip RPC and use manual query directly for reliability
        groups_data = []
        for group_id in group_ids:
            try:
                group = supabase.table('study_groups')\
                    .select('*, users!creator_id(username)')\
                    .eq('id', group_id)\
                    .single()\
                    .execute()
                
                if group.data:
                    # Get member count
                    members = supabase.table('study_group_members')\
                        .select('user_id', count='exact')\
                        .eq('group_id', group_id)\
                        .execute()
                    
                    # Get tags
                    tags = supabase.table('study_group_tags')\
                        .select('tag')\
                        .eq('group_id', group_id)\
                        .execute()
                    
                    # Get total study hours for this group
                    sessions = supabase.table('study_sessions')\
                        .select('duration')\
                        .eq('study_group_id', group_id)\
                        .execute()
                    
                    total_minutes = sum(s['duration'] for s in (sessions.data or []))
                    total_hours = total_minutes / 60
                    
                    # Format time as "Xh Ym"
                    def format_time(minutes):
                        if minutes < 1:
                            return "0m"
                        hours = int(minutes // 60)
                        mins = int(minutes % 60)
                        if hours == 0:
                            return f"{mins}m"
                        elif mins == 0:
                            return f"{hours}h"
                        else:
                            return f"{hours}h {mins}m"
                    
                    group_data = group.data
                    group_data['member_count'] = members.count or 1
                    group_data['tags'] = [t['tag'] for t in tags.data] if tags.data else []
                    group_data['total_hours'] = round(total_hours, 2)
                    group_data['total_time'] = format_time(total_minutes)
                    print(f"Group {group_id}: {group_data['name']}, members: {group_data['member_count']}, tags: {group_data['tags']}, hours: {group_data['total_time']}")
                    groups_data.append(group_data)
            except Exception as group_error:
                print(f"Error fetching group {group_id}: {str(group_error)}")
                continue
        
        print(f"Returning {len(groups_data)} groups")
        return {
            'success': True,
            'groups': groups_data
        }
        
    except Exception as e:
        print(f"Error fetching user groups: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'groups': []
        }

def get_group_details(group_id: str) -> Dict:
    """Get detailed information about a study group"""
    try:
        supabase = get_supabase_client()
        
        # Get group info
        group = supabase.table('study_groups')\
            .select('*, users!creator_id(username, email)')\
            .eq('id', group_id)\
            .single()\
            .execute()
        
        if not group.data:
            return {
                'success': False,
                'error': 'Group not found'
            }
        
        # Get members
        members = supabase.table('study_group_members')\
            .select('*, users(username, email)')\
            .eq('group_id', group_id)\
            .execute()
        
        # Get tags
        tags = supabase.table('study_group_tags')\
            .select('tag')\
            .eq('group_id', group_id)\
            .execute()
        
        group_data = group.data
        group_data['members'] = members.data if members.data else []
        group_data['tags'] = [t['tag'] for t in tags.data] if tags.data else []
        group_data['member_count'] = len(group_data['members'])
        
        return {
            'success': True,
            'group': group_data
        }
        
    except Exception as e:
        print(f"Error fetching group details: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def join_group(group_id: str, user_id: str) -> Dict:
    """Add a user to a study group"""
    try:
        supabase = get_supabase_client()
        
        member_data = {
            'group_id': group_id,
            'user_id': user_id,
            'role': 'member'
        }
        
        result = supabase.table('study_group_members')\
            .insert(member_data)\
            .execute()
        
        if result.data:
            return {
                'success': True,
                'message': 'Successfully joined group'
            }
        else:
            return {
                'success': False,
                'error': 'Failed to join group'
            }
            
    except Exception as e:
        error_msg = str(e)
        if 'duplicate key' in error_msg.lower():
            return {
                'success': False,
                'error': 'Already a member of this group'
            }
        print(f"Error joining group: {error_msg}")
        return {
            'success': False,
            'error': error_msg
        }

def leave_group(group_id: str, user_id: str) -> Dict:
    """Remove a user from a study group (including creators)"""
    try:
        supabase = get_supabase_client()
        
        # Remove user from group members
        result = supabase.table('study_group_members')\
            .delete()\
            .eq('group_id', group_id)\
            .eq('user_id', user_id)\
            .execute()
        
        print(f"User {user_id} left group {group_id}")
        
        return {
            'success': True,
            'message': 'Successfully left group'
        }
        
    except Exception as e:
        print(f"Error leaving group: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def update_group(group_id: str, user_id: str, updates: Dict) -> Dict:
    """Update study group details (creator only)"""
    try:
        supabase = get_supabase_client()
        
        # Verify user is creator
        group = supabase.table('study_groups')\
            .select('creator_id')\
            .eq('id', group_id)\
            .single()\
            .execute()
        
        if not group.data:
            return {
                'success': False,
                'error': 'Group not found'
            }
        
        if group.data['creator_id'] != user_id:
            return {
                'success': False,
                'error': 'Only the creator can update group details'
            }
        
        # Update group
        allowed_fields = ['name', 'description', 'location', 'total_hours']
        update_data = {k: v for k, v in updates.items() if k in allowed_fields}
        
        result = supabase.table('study_groups')\
            .update(update_data)\
            .eq('id', group_id)\
            .execute()
        
        return {
            'success': True,
            'group': result.data[0] if result.data else None,
            'message': 'Group updated successfully'
        }
        
    except Exception as e:
        print(f"Error updating group: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def delete_group(group_id: str, user_id: str) -> Dict:
    """Delete a study group (creator only)"""
    try:
        supabase = get_supabase_client()
        
        # Verify user is creator
        group = supabase.table('study_groups')\
            .select('creator_id')\
            .eq('id', group_id)\
            .single()\
            .execute()
        
        if not group.data:
            return {
                'success': False,
                'error': 'Group not found'
            }
        
        if group.data['creator_id'] != user_id:
            return {
                'success': False,
                'error': 'Only the creator can delete the group'
            }
        
        # Delete group (cascade will handle members and tags)
        supabase.table('study_groups')\
            .delete()\
            .eq('id', group_id)\
            .execute()
        
        return {
            'success': True,
            'message': 'Group deleted successfully'
        }
        
    except Exception as e:
        print(f"Error deleting group: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
