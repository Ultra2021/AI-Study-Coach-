"""
Study Group Notes Service
Handles all note-related operations for study groups
"""

from supabase_client import get_supabase_client
from typing import Optional, Dict, List

def create_note(group_id: str, user_id: str, title: str, content: str,
                is_pinned: bool = False, tags: List[str] = None) -> Dict:
    """Create a new note in a study group"""
    try:
        supabase = get_supabase_client()
        
        # Verify user is a member of the group
        member_check = supabase.table('study_group_members')\
            .select('id')\
            .eq('group_id', group_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if not member_check.data:
            return {
                'success': False,
                'error': 'You must be a member of this group to create notes'
            }
        
        # Insert note
        note_data = {
            'group_id': group_id,
            'created_by': user_id,
            'title': title,
            'content': content,
            'is_pinned': is_pinned,
            'tags': tags if tags else []
        }
        
        result = supabase.table('study_group_notes').insert(note_data).execute()
        
        if result.data and len(result.data) > 0:
            return {
                'success': True,
                'note': result.data[0],
                'message': 'Note created successfully'
            }
        else:
            return {
                'success': False,
                'error': 'Failed to create note'
            }
            
    except Exception as e:
        print(f"Error creating note: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def get_group_notes(group_id: str, user_id: str, pinned_only: bool = False) -> Dict:
    """Get all notes for a study group"""
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
                'error': 'You must be a member of this group to view notes'
            }
        
        # Build query
        query = supabase.from_('study_group_notes_detailed')\
            .select('*')\
            .eq('group_id', group_id)
        
        if pinned_only:
            query = query.eq('is_pinned', True)
        
        # Order by pinned first, then most recent
        result = query.order('is_pinned', desc=True)\
            .order('created_at', desc=True)\
            .execute()
        
        return {
            'success': True,
            'notes': result.data if result.data else []
        }
            
    except Exception as e:
        print(f"Error getting notes: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def get_note_details(note_id: str, user_id: str) -> Dict:
    """Get details of a specific note"""
    try:
        supabase = get_supabase_client()
        
        # Get note with details
        result = supabase.from_('study_group_notes_detailed')\
            .select('*')\
            .eq('id', note_id)\
            .single()\
            .execute()
        
        if not result.data:
            return {
                'success': False,
                'error': 'Note not found'
            }
        
        note = result.data
        
        # Verify user is a member of the group
        member_check = supabase.table('study_group_members')\
            .select('id')\
            .eq('group_id', note['group_id'])\
            .eq('user_id', user_id)\
            .execute()
        
        if not member_check.data:
            return {
                'success': False,
                'error': 'You must be a member of this group to view this note'
            }
        
        return {
            'success': True,
            'note': note
        }
            
    except Exception as e:
        print(f"Error getting note details: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def update_note(note_id: str, user_id: str, updates: Dict) -> Dict:
    """Update a note"""
    try:
        supabase = get_supabase_client()
        
        # Get note to check permissions
        note = supabase.table('study_group_notes')\
            .select('*, study_groups!inner(creator_id)')\
            .eq('id', note_id)\
            .single()\
            .execute()
        
        if not note.data:
            return {
                'success': False,
                'error': 'Note not found'
            }
        
        note_data = note.data
        
        # Only creator or group admin can update
        is_creator = note_data['created_by'] == user_id
        is_admin = note_data['study_groups']['creator_id'] == user_id
        
        if not (is_creator or is_admin):
            return {
                'success': False,
                'error': 'You do not have permission to update this note'
            }
        
        # Update note
        result = supabase.table('study_group_notes')\
            .update(updates)\
            .eq('id', note_id)\
            .execute()
        
        if result.data and len(result.data) > 0:
            return {
                'success': True,
                'note': result.data[0],
                'message': 'Note updated successfully'
            }
        else:
            return {
                'success': False,
                'error': 'Failed to update note'
            }
            
    except Exception as e:
        print(f"Error updating note: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def delete_note(note_id: str, user_id: str) -> Dict:
    """Delete a note"""
    try:
        supabase = get_supabase_client()
        
        # Get note to check permissions
        note = supabase.table('study_group_notes')\
            .select('*, study_groups!inner(creator_id)')\
            .eq('id', note_id)\
            .single()\
            .execute()
        
        if not note.data:
            return {
                'success': False,
                'error': 'Note not found'
            }
        
        note_data = note.data
        
        # Only creator or group admin can delete
        is_creator = note_data['created_by'] == user_id
        is_admin = note_data['study_groups']['creator_id'] == user_id
        
        if not (is_creator or is_admin):
            return {
                'success': False,
                'error': 'You do not have permission to delete this note'
            }
        
        # Delete note
        supabase.table('study_group_notes')\
            .delete()\
            .eq('id', note_id)\
            .execute()
        
        return {
            'success': True,
            'message': 'Note deleted successfully'
        }
            
    except Exception as e:
        print(f"Error deleting note: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def toggle_pin(note_id: str, user_id: str) -> Dict:
    """Toggle the pinned status of a note"""
    try:
        supabase = get_supabase_client()
        
        # Get current note
        note = supabase.table('study_group_notes')\
            .select('is_pinned, created_by, study_groups!inner(creator_id)')\
            .eq('id', note_id)\
            .single()\
            .execute()
        
        if not note.data:
            return {
                'success': False,
                'error': 'Note not found'
            }
        
        note_data = note.data
        
        # Only creator or group admin can pin/unpin
        is_creator = note_data['created_by'] == user_id
        is_admin = note_data['study_groups']['creator_id'] == user_id
        
        if not (is_creator or is_admin):
            return {
                'success': False,
                'error': 'You do not have permission to pin/unpin this note'
            }
        
        # Toggle pin status
        new_status = not note_data.get('is_pinned', False)
        result = supabase.table('study_group_notes')\
            .update({'is_pinned': new_status})\
            .eq('id', note_id)\
            .execute()
        
        if result.data and len(result.data) > 0:
            return {
                'success': True,
                'note': result.data[0],
                'message': f"Note {'pinned' if new_status else 'unpinned'} successfully"
            }
        else:
            return {
                'success': False,
                'error': 'Failed to update note'
            }
            
    except Exception as e:
        print(f"Error toggling pin: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
