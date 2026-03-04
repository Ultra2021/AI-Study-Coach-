"""
Study Group Files Service
Handles all file-related operations for study groups
"""

from supabase_client import get_supabase_client
from typing import Optional, Dict, List

def upload_file(group_id: str, user_id: str, file_name: str, file_type: str,
                file_size: int, file_url: str, description: str = None) -> Dict:
    """Upload a file to a study group"""
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
                'error': 'You must be a member of this group to upload files'
            }
        
        # Insert file record
        file_data = {
            'group_id': group_id,
            'uploaded_by': user_id,
            'file_name': file_name,
            'file_type': file_type,
            'file_size': file_size,
            'file_url': file_url,
            'description': description,
            'download_count': 0
        }
        
        result = supabase.table('study_group_files').insert(file_data).execute()
        
        if result.data and len(result.data) > 0:
            return {
                'success': True,
                'file': result.data[0],
                'message': 'File uploaded successfully'
            }
        else:
            return {
                'success': False,
                'error': 'Failed to upload file'
            }
            
    except Exception as e:
        print(f"Error uploading file: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def get_group_files(group_id: str, user_id: str, file_type: str = None) -> Dict:
    """Get all files for a study group"""
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
                'error': 'You must be a member of this group to view files'
            }
        
        # Build query
        query = supabase.from_('study_group_files_detailed')\
            .select('*')\
            .eq('group_id', group_id)
        
        if file_type:
            query = query.eq('file_type', file_type)
        
        # Order by most recent first
        result = query.order('created_at', desc=True).execute()
        
        return {
            'success': True,
            'files': result.data if result.data else []
        }
            
    except Exception as e:
        print(f"Error getting files: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def get_file_details(file_id: str, user_id: str) -> Dict:
    """Get details of a specific file"""
    try:
        supabase = get_supabase_client()
        
        # Get file with details
        result = supabase.from_('study_group_files_detailed')\
            .select('*')\
            .eq('id', file_id)\
            .single()\
            .execute()
        
        if not result.data:
            return {
                'success': False,
                'error': 'File not found'
            }
        
        file = result.data
        
        # Verify user is a member of the group
        member_check = supabase.table('study_group_members')\
            .select('id')\
            .eq('group_id', file['group_id'])\
            .eq('user_id', user_id)\
            .execute()
        
        if not member_check.data:
            return {
                'success': False,
                'error': 'You must be a member of this group to view this file'
            }
        
        return {
            'success': True,
            'file': file
        }
            
    except Exception as e:
        print(f"Error getting file details: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def delete_file(file_id: str, user_id: str) -> Dict:
    """Delete a file"""
    try:
        supabase = get_supabase_client()
        
        # Get file to check permissions
        file = supabase.table('study_group_files')\
            .select('*, study_groups!inner(creator_id)')\
            .eq('id', file_id)\
            .single()\
            .execute()
        
        if not file.data:
            return {
                'success': False,
                'error': 'File not found'
            }
        
        file_data = file.data
        
        # Only uploader or group admin can delete
        is_uploader = file_data['uploaded_by'] == user_id
        is_admin = file_data['study_groups']['creator_id'] == user_id
        
        if not (is_uploader or is_admin):
            return {
                'success': False,
                'error': 'You do not have permission to delete this file'
            }
        
        # Delete file record
        supabase.table('study_group_files')\
            .delete()\
            .eq('id', file_id)\
            .execute()
        
        return {
            'success': True,
            'message': 'File deleted successfully'
        }
            
    except Exception as e:
        print(f"Error deleting file: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def increment_download_count(file_id: str, user_id: str) -> Dict:
    """Increment the download count for a file"""
    try:
        supabase = get_supabase_client()
        
        # Get current file
        file = supabase.table('study_group_files')\
            .select('download_count, group_id')\
            .eq('id', file_id)\
            .single()\
            .execute()
        
        if not file.data:
            return {
                'success': False,
                'error': 'File not found'
            }
        
        # Verify user is a member
        member_check = supabase.table('study_group_members')\
            .select('id')\
            .eq('group_id', file.data['group_id'])\
            .eq('user_id', user_id)\
            .execute()
        
        if not member_check.data:
            return {
                'success': False,
                'error': 'You must be a member of this group to download files'
            }
        
        # Increment download count
        new_count = (file.data.get('download_count') or 0) + 1
        result = supabase.table('study_group_files')\
            .update({'download_count': new_count})\
            .eq('id', file_id)\
            .execute()
        
        return {
            'success': True,
            'download_count': new_count
        }
            
    except Exception as e:
        print(f"Error incrementing download count: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
