"""
Study Group Tasks Service
Handles all task-related operations for study groups
"""

from supabase_client import get_supabase_client
from typing import Optional, Dict, List
from datetime import datetime

def create_task(group_id: str, user_id: str, title: str, description: str = None,
                assigned_to: str = None, priority: str = 'medium', 
                due_date: str = None) -> Dict:
    """Create a new task in a study group"""
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
                'error': 'You must be a member of this group to create tasks'
            }
        
        # Insert task
        task_data = {
            'group_id': group_id,
            'title': title,
            'description': description,
            'assigned_to': assigned_to,
            'created_by': user_id,
            'status': 'pending',
            'priority': priority,
            'due_date': due_date
        }
        
        result = supabase.table('study_group_tasks').insert(task_data).execute()
        
        if result.data and len(result.data) > 0:
            return {
                'success': True,
                'task': result.data[0],
                'message': 'Task created successfully'
            }
        else:
            return {
                'success': False,
                'error': 'Failed to create task'
            }
            
    except Exception as e:
        print(f"Error creating task: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def get_group_tasks(group_id: str, user_id: str, status: str = None) -> Dict:
    """Get all tasks for a study group"""
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
                'error': 'You must be a member of this group to view tasks'
            }
        
        # Build query
        query = supabase.from_('study_group_tasks_detailed')\
            .select('*')\
            .eq('group_id', group_id)
        
        if status:
            query = query.eq('status', status)
        
        # Order by priority and due date
        result = query.order('created_at', desc=True).execute()
        
        return {
            'success': True,
            'tasks': result.data if result.data else []
        }
            
    except Exception as e:
        print(f"Error getting tasks: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def get_task_details(task_id: str, user_id: str) -> Dict:
    """Get details of a specific task"""
    try:
        supabase = get_supabase_client()
        
        # Get task with details
        result = supabase.from_('study_group_tasks_detailed')\
            .select('*')\
            .eq('id', task_id)\
            .single()\
            .execute()
        
        if not result.data:
            return {
                'success': False,
                'error': 'Task not found'
            }
        
        task = result.data
        
        # Verify user is a member of the group
        member_check = supabase.table('study_group_members')\
            .select('id')\
            .eq('group_id', task['group_id'])\
            .eq('user_id', user_id)\
            .execute()
        
        if not member_check.data:
            return {
                'success': False,
                'error': 'You must be a member of this group to view this task'
            }
        
        return {
            'success': True,
            'task': task
        }
            
    except Exception as e:
        print(f"Error getting task details: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def update_task(task_id: str, user_id: str, updates: Dict) -> Dict:
    """Update a task"""
    try:
        supabase = get_supabase_client()
        
        # Get task to check permissions
        task = supabase.table('study_group_tasks')\
            .select('*, study_groups!inner(creator_id)')\
            .eq('id', task_id)\
            .single()\
            .execute()
        
        if not task.data:
            return {
                'success': False,
                'error': 'Task not found'
            }
        
        task_data = task.data
        
        # Check if user is creator, group admin, or assigned to task
        is_creator = task_data['created_by'] == user_id
        is_admin = task_data['study_groups']['creator_id'] == user_id
        is_assigned = task_data.get('assigned_to') == user_id
        
        if not (is_creator or is_admin or is_assigned):
            return {
                'success': False,
                'error': 'You do not have permission to update this task'
            }
        
        # If completing task, set completed_at
        if updates.get('status') == 'completed' and 'completed_at' not in updates:
            updates['completed_at'] = datetime.utcnow().isoformat()
        
        # Update task
        result = supabase.table('study_group_tasks')\
            .update(updates)\
            .eq('id', task_id)\
            .execute()
        
        if result.data and len(result.data) > 0:
            return {
                'success': True,
                'task': result.data[0],
                'message': 'Task updated successfully'
            }
        else:
            return {
                'success': False,
                'error': 'Failed to update task'
            }
            
    except Exception as e:
        print(f"Error updating task: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def delete_task(task_id: str, user_id: str) -> Dict:
    """Delete a task"""
    try:
        supabase = get_supabase_client()
        
        # Get task to check permissions
        task = supabase.table('study_group_tasks')\
            .select('*, study_groups!inner(creator_id)')\
            .eq('id', task_id)\
            .single()\
            .execute()
        
        if not task.data:
            return {
                'success': False,
                'error': 'Task not found'
            }
        
        task_data = task.data
        
        # Only creator or group admin can delete
        is_creator = task_data['created_by'] == user_id
        is_admin = task_data['study_groups']['creator_id'] == user_id
        
        if not (is_creator or is_admin):
            return {
                'success': False,
                'error': 'You do not have permission to delete this task'
            }
        
        # Delete task
        supabase.table('study_group_tasks')\
            .delete()\
            .eq('id', task_id)\
            .execute()
        
        return {
            'success': True,
            'message': 'Task deleted successfully'
        }
            
    except Exception as e:
        print(f"Error deleting task: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def complete_task(task_id: str, user_id: str) -> Dict:
    """Mark a task as completed"""
    return update_task(task_id, user_id, {
        'status': 'completed',
        'completed_at': datetime.utcnow().isoformat()
    })
