"""
Reminders Service
CRUD operations for user reminders stored in Supabase.
"""

from supabase_client import get_supabase_client
from datetime import datetime, timezone


def create_reminder(user_id: str, title: str, description: str = None,
                    due_date: str = None, recurrence: str = 'none') -> dict:
    """Create a new reminder."""
    try:
        supabase = get_supabase_client()
        payload = {
            'user_id':     user_id,
            'title':       title,
            'description': description or '',
            'recurrence':  recurrence or 'none',
            'is_done':     False,
        }
        if due_date:
            payload['due_date'] = due_date
        resp = supabase.table('reminders').insert(payload).execute()
        return {'success': True, 'reminder': resp.data[0] if resp.data else payload}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def get_reminders(user_id: str, include_done: bool = False) -> dict:
    """Get all reminders for a user."""
    try:
        supabase = get_supabase_client()
        query = (
            supabase.table('reminders')
            .select('*')
            .eq('user_id', user_id)
            .order('due_date', desc=False)
        )
        if not include_done:
            query = query.eq('is_done', False)
        resp = query.execute()
        return {'success': True, 'reminders': resp.data or []}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def get_due_reminders(user_id: str) -> dict:
    """Get reminders that are due now or overdue."""
    try:
        supabase = get_supabase_client()
        now = datetime.now(timezone.utc).isoformat()
        resp = (
            supabase.table('reminders')
            .select('*')
            .eq('user_id', user_id)
            .eq('is_done', False)
            .lte('due_date', now)
            .execute()
        )
        return {'success': True, 'reminders': resp.data or []}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def update_reminder(reminder_id: int, user_id: str, updates: dict) -> dict:
    """Update a reminder."""
    try:
        supabase = get_supabase_client()
        updates['updated_at'] = datetime.now(timezone.utc).isoformat()
        resp = (
            supabase.table('reminders')
            .update(updates)
            .eq('id', reminder_id)
            .eq('user_id', user_id)
            .execute()
        )
        if not resp.data:
            return {'success': False, 'error': 'Reminder not found'}
        return {'success': True, 'reminder': resp.data[0]}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def complete_reminder(reminder_id: int, user_id: str) -> dict:
    """Mark a reminder as done."""
    return update_reminder(reminder_id, user_id, {'is_done': True})


def delete_reminder(reminder_id: int, user_id: str) -> dict:
    """Delete a reminder."""
    try:
        supabase = get_supabase_client()
        supabase.table('reminders').delete().eq('id', reminder_id).eq('user_id', user_id).execute()
        return {'success': True, 'message': 'Reminder deleted'}
    except Exception as e:
        return {'success': False, 'error': str(e)}
