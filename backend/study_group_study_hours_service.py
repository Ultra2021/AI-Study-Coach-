"""
Study Group Study Hours Service
Handles study hour logging and tracking for study groups
"""

from supabase_client import get_supabase_client
from typing import Optional, Dict, List
from datetime import datetime, timedelta

def format_time(minutes: float) -> str:
    """Format minutes into 'Xh Ym' format"""
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

def log_study_session(group_id: str, user_id: str, subject: str, 
                      duration: int, notes: str = None) -> Dict:
    """Log a study session for a group member"""
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
                'error': 'You must be a member of this group'
            }
        
        # Also log to main study_sessions table
        session_data = {
            'user_id': user_id,
            'subject': subject,
            'duration': duration,
            'study_group_id': group_id,
            'notes': notes,
            'focus_level': 3,  # Default focus level
            'difficulty': 3,   # Default difficulty
        }
        
        result = supabase.table('study_sessions').insert(session_data).execute()
        
        if result.data and len(result.data) > 0:
            return {
                'success': True,
                'session': result.data[0],
                'message': 'Study session logged successfully'
            }
        else:
            return {
                'success': False,
                'error': 'Failed to log study session'
            }
            
    except Exception as e:
        print(f"Error logging study session: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def get_group_study_stats(group_id: str, user_id: str, days: int = 7) -> Dict:
    """Get study statistics for a group"""
    try:
        supabase = get_supabase_client()
        
        # Verify membership
        member_check = supabase.table('study_group_members')\
            .select('id')\
            .eq('group_id', group_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if not member_check.data:
            return {
                'success': False,
                'error': 'You must be a member of this group'
            }
        
        # Get date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get all sessions for this group
        sessions = supabase.table('study_sessions')\
            .select('*, users(username)')\
            .eq('study_group_id', group_id)\
            .gte('created_at', start_date.isoformat())\
            .order('created_at', desc=True)\
            .execute()
        
        sessions_data = sessions.data if sessions.data else []
        
        # Calculate statistics
        total_minutes = sum(s['duration'] for s in sessions_data)
        total_hours = total_minutes / 60
        total_sessions = len(sessions_data)
        
        # Group by member
        member_stats = {}
        for session in sessions_data:
            uid = session['user_id']
            if uid not in member_stats:
                member_stats[uid] = {
                    'user_id': uid,
                    'username': session['users']['username'] if session.get('users') else 'Unknown',
                    'minutes': 0,
                    'sessions': 0
                }
            member_stats[uid]['minutes'] += session['duration']
            member_stats[uid]['sessions'] += 1
        
        # Add formatted time to member stats
        for stats in member_stats.values():
            stats['time'] = format_time(stats['minutes'])
            stats['hours'] = round(stats['minutes'] / 60, 2)
        
        # Group by subject
        subject_stats = {}
        for session in sessions_data:
            subj = session['subject']
            if subj not in subject_stats:
                subject_stats[subj] = {
                    'minutes': 0,
                    'sessions': 0
                }
            subject_stats[subj]['minutes'] += session['duration']
            subject_stats[subj]['sessions'] += 1
        
        # Add formatted time to subject stats
        for stats in subject_stats.values():
            stats['time'] = format_time(stats['minutes'])
            stats['hours'] = round(stats['minutes'] / 60, 2)
        
        # Daily breakdown
        daily_stats = {}
        for session in sessions_data:
            date = session['created_at'][:10]  # YYYY-MM-DD
            if date not in daily_stats:
                daily_stats[date] = {
                    'minutes': 0,
                    'sessions': 0
                }
            daily_stats[date]['minutes'] += session['duration']
            daily_stats[date]['sessions'] += 1
        
        # Add formatted time to daily stats
        for stats in daily_stats.values():
            stats['time'] = format_time(stats['minutes'])
            stats['hours'] = round(stats['minutes'] / 60, 2)
        
        return {
            'success': True,
            'stats': {
                'total_hours': round(total_hours, 2),
                'total_time': format_time(total_minutes),
                'total_sessions': total_sessions,
                'average_session_length': round(total_minutes / total_sessions, 1) if total_sessions > 0 else 0,
                'average_time': format_time(total_minutes / total_sessions) if total_sessions > 0 else '0m',
                'member_breakdown': list(member_stats.values()),
                'subject_breakdown': [{'subject': k, **v} for k, v in subject_stats.items()],
                'daily_breakdown': [{'date': k, **v} for k, v in sorted(daily_stats.items())]
            }
        }
            
    except Exception as e:
        print(f"Error getting group study stats: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def get_member_study_hours(group_id: str, user_id: str, target_user_id: str = None) -> Dict:
    """Get study hours for a specific member"""
    try:
        supabase = get_supabase_client()
        
        # Verify membership
        member_check = supabase.table('study_group_members')\
            .select('id')\
            .eq('group_id', group_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if not member_check.data:
            return {
                'success': False,
                'error': 'You must be a member of this group'
            }
        
        # If no target user specified, use requesting user
        if not target_user_id:
            target_user_id = user_id
        
        # Get sessions
        sessions = supabase.table('study_sessions')\
            .select('*')\
            .eq('study_group_id', group_id)\
            .eq('user_id', target_user_id)\
            .order('created_at', desc=True)\
            .execute()
        
        sessions_data = sessions.data if sessions.data else []
        
        # Calculate stats
        total_minutes = sum(s['duration'] for s in sessions_data)
        total_hours = total_minutes / 60
        
        # This week
        week_ago = datetime.utcnow() - timedelta(days=7)
        week_sessions = [s for s in sessions_data if datetime.fromisoformat(s['created_at'].replace('Z', '+00:00')) >= week_ago]
        week_minutes = sum(s['duration'] for s in week_sessions)
        week_hours = week_minutes / 60
        
        # This month
        month_ago = datetime.utcnow() - timedelta(days=30)
        month_sessions = [s for s in sessions_data if datetime.fromisoformat(s['created_at'].replace('Z', '+00:00')) >= month_ago]
        month_minutes = sum(s['duration'] for s in month_sessions)
        month_hours = month_minutes / 60
        
        return {
            'success': True,
            'hours': {
                'total': round(total_hours, 2),
                'total_time': format_time(total_minutes),
                'this_week': round(week_hours, 2),
                'week_time': format_time(week_minutes),
                'this_month': round(month_hours, 2),
                'month_time': format_time(month_minutes),
                'total_sessions': len(sessions_data),
                'recent_sessions': sessions_data[:10]  # Last 10 sessions
            }
        }
            
    except Exception as e:
        print(f"Error getting member study hours: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def set_study_goal(group_id: str, user_id: str, weekly_hours: int, monthly_hours: int = None) -> Dict:
    """Set study hour goals for the group"""
    try:
        supabase = get_supabase_client()
        
        # Verify user is group admin/creator
        group = supabase.table('study_groups')\
            .select('creator_id')\
            .eq('id', group_id)\
            .single()\
            .execute()
        
        if not group.data or group.data['creator_id'] != user_id:
            return {
                'success': False,
                'error': 'Only group creator can set study goals'
            }
        
        # Update group metadata with goals
        updates = {
            'weekly_study_goal': weekly_hours,
            'monthly_study_goal': monthly_hours
        }
        
        result = supabase.table('study_groups')\
            .update(updates)\
            .eq('id', group_id)\
            .execute()
        
        return {
            'success': True,
            'message': 'Study goals set successfully',
            'goals': updates
        }
            
    except Exception as e:
        print(f"Error setting study goal: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def get_study_goal_progress(group_id: str, user_id: str) -> Dict:
    """Get progress towards study goals"""
    try:
        supabase = get_supabase_client()
        
        # Verify membership
        member_check = supabase.table('study_group_members')\
            .select('id')\
            .eq('group_id', group_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if not member_check.data:
            return {
                'success': False,
                'error': 'You must be a member of this group'
            }
        
        # Get group goals
        group = supabase.table('study_groups')\
            .select('weekly_study_goal, monthly_study_goal')\
            .eq('id', group_id)\
            .single()\
            .execute()
        
        if not group.data:
            return {
                'success': False,
                'error': 'Group not found'
            }
        
        weekly_goal = group.data.get('weekly_study_goal')
        monthly_goal = group.data.get('monthly_study_goal')
        
        # Get actual hours
        week_ago = datetime.utcnow() - timedelta(days=7)
        month_ago = datetime.utcnow() - timedelta(days=30)
        
        # Weekly hours
        week_sessions = supabase.table('study_sessions')\
            .select('duration')\
            .eq('study_group_id', group_id)\
            .gte('created_at', week_ago.isoformat())\
            .execute()
        
        week_minutes = sum(s['duration'] for s in (week_sessions.data or []))
        week_hours = week_minutes / 60
        
        # Monthly hours
        month_sessions = supabase.table('study_sessions')\
            .select('duration')\
            .eq('study_group_id', group_id)\
            .gte('created_at', month_ago.isoformat())\
            .execute()
        
        month_minutes = sum(s['duration'] for s in (month_sessions.data or []))
        month_hours = month_minutes / 60
        
        return {
            'success': True,
            'progress': {
                'weekly': {
                    'goal': weekly_goal,
                    'goal_time': format_time(weekly_goal * 60) if weekly_goal else '0h',
                    'actual': round(week_hours, 2),
                    'actual_time': format_time(week_minutes),
                    'percentage': round((week_hours / weekly_goal * 100), 1) if weekly_goal else 0
                },
                'monthly': {
                    'goal': monthly_goal,
                    'goal_time': format_time(monthly_goal * 60) if monthly_goal else '0h',
                    'actual': round(month_hours, 2),
                    'actual_time': format_time(month_minutes),
                    'percentage': round((month_hours / monthly_goal * 100), 1) if monthly_goal else 0
                }
            }
        }
            
    except Exception as e:
        print(f"Error getting study goal progress: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
