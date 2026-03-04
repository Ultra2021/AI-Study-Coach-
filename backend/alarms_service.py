"""
Alarms Service
CRUD operations for alarms stored in Supabase.
Mobile polls /api/ai/alarms/due every 30 seconds to trigger notifications.
"""

from supabase_client import get_supabase_client
from datetime import datetime, timezone


def create_alarm(user_id: str, label: str, alarm_time: str,
                 repeat_days: str = None) -> dict:
    """
    Create a new alarm.
    alarm_time: ISO 8601 datetime string
    repeat_days: comma-separated e.g. "Mon,Wed,Fri" or None for one-time
    """
    try:
        supabase = get_supabase_client()
        resp = supabase.table('alarms').insert({
            'user_id':     user_id,
            'label':       label,
            'alarm_time':  alarm_time,
            'repeat_days': repeat_days,
            'is_active':   True,
            'is_fired':    False,
        }).execute()
        return {'success': True, 'alarm': resp.data[0] if resp.data else None}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def get_alarms(user_id: str) -> dict:
    """Get all alarms for a user."""
    try:
        supabase = get_supabase_client()
        resp = (
            supabase.table('alarms')
            .select('*')
            .eq('user_id', user_id)
            .order('alarm_time', desc=False)
            .execute()
        )
        return {'success': True, 'alarms': resp.data or []}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def get_due_alarms(user_id: str) -> dict:
    """
    Return active, unfired alarms whose alarm_time <= now.
    Marks one-time alarms as fired atomically.
    """
    try:
        supabase = get_supabase_client()
        now = datetime.now(timezone.utc).isoformat()
        resp = (
            supabase.table('alarms')
            .select('*')
            .eq('user_id', user_id)
            .eq('is_active', True)
            .eq('is_fired', False)
            .lte('alarm_time', now)
            .execute()
        )
        due = resp.data or []
        for alarm in due:
            if not alarm.get('repeat_days'):  # one-time: mark fired
                supabase.table('alarms').update({'is_fired': True}).eq('id', alarm['id']).execute()
        return {'success': True, 'alarms': due}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def update_alarm(alarm_id: int, user_id: str, updates: dict) -> dict:
    """Update alarm fields."""
    try:
        supabase = get_supabase_client()
        if 'alarm_time' in updates or 'repeat_days' in updates:
            updates['is_fired'] = False
        updates['updated_at'] = datetime.now(timezone.utc).isoformat()
        resp = (
            supabase.table('alarms')
            .update(updates)
            .eq('id', alarm_id)
            .eq('user_id', user_id)
            .execute()
        )
        if not resp.data:
            return {'success': False, 'error': 'Alarm not found'}
        return {'success': True, 'alarm': resp.data[0]}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def toggle_alarm(alarm_id: int, user_id: str, is_active: bool) -> dict:
    """Enable or disable an alarm."""
    return update_alarm(alarm_id, user_id, {'is_active': is_active, 'is_fired': False})


def delete_alarm(alarm_id: int, user_id: str) -> dict:
    """Delete an alarm."""
    try:
        supabase = get_supabase_client()
        supabase.table('alarms').delete().eq('id', alarm_id).eq('user_id', user_id).execute()
        return {'success': True, 'message': 'Alarm deleted'}
    except Exception as e:
        return {'success': False, 'error': str(e)}
