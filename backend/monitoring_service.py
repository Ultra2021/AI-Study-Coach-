"""
Monitoring Service
Logs app events and aggregates metrics stored in Supabase
"""

import time
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import request as flask_request
from supabase_client import get_supabase_client


def log_event(event_type: str, user_id: str = None, endpoint: str = None,
              status_code: int = None, duration_ms: int = None,
              error_msg: str = None, metadata: dict = None) -> None:
    """
    Log an event to monitoring_logs.
    Non-blocking — swallows all errors so it never breaks the main flow.
    """
    try:
        supabase = get_supabase_client()
        payload = {
            'event_type': event_type,
            'created_at': datetime.now(timezone.utc).isoformat(),
        }
        if user_id:     payload['user_id']     = user_id
        if endpoint:    payload['endpoint']    = endpoint
        if status_code: payload['status_code'] = status_code
        if duration_ms: payload['duration_ms'] = duration_ms
        if error_msg:   payload['error_msg']   = error_msg
        if metadata:    payload['metadata']    = metadata
        supabase.table('monitoring_logs').insert(payload).execute()
    except Exception:
        pass  # Never crash the app due to monitoring


def monitor_request(f):
    """
    Decorator: wraps a Flask route to automatically log request metrics.
    Usage:
        @app.route('/api/...')
        @monitor_request
        def my_view(): ...
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        start = time.time()
        status = 200
        err = None
        try:
            result = f(*args, **kwargs)
            if hasattr(result, 'status_code'):
                status = result.status_code
            return result
        except Exception as e:
            status = 500
            err = str(e)
            raise
        finally:
            ms = int((time.time() - start) * 1000)
            log_event(
                event_type='api_request',
                endpoint=flask_request.path,
                status_code=status,
                duration_ms=ms,
                error_msg=err,
                metadata={'method': flask_request.method},
            )
    return wrapper


def get_app_metrics(hours: int = 24) -> dict:
    """Return aggregated request stats for the last N hours."""
    try:
        supabase = get_supabase_client()
        since = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
        res = supabase.table('monitoring_logs') \
            .select('event_type, status_code, duration_ms, endpoint') \
            .eq('event_type', 'api_request') \
            .gte('created_at', since) \
            .execute()

        logs = res.data or []
        total = len(logs)
        errors = sum(1 for l in logs if l.get('status_code', 200) >= 400)
        durations = [l['duration_ms'] for l in logs if l.get('duration_ms')]
        avg_ms = int(sum(durations) / len(durations)) if durations else 0

        # Endpoint hit counts
        endpoints: dict = {}
        for l in logs:
            ep = l.get('endpoint', 'unknown')
            endpoints[ep] = endpoints.get(ep, 0) + 1

        return {
            'success': True,
            'period_hours': hours,
            'total_requests': total,
            'error_count': errors,
            'success_count': total - errors,
            'avg_response_ms': avg_ms,
            'top_endpoints': sorted(endpoints.items(), key=lambda x: x[1], reverse=True)[:10],
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


def get_recent_logs(limit: int = 50) -> dict:
    """Return the most recent monitoring log entries."""
    try:
        supabase = get_supabase_client()
        res = supabase.table('monitoring_logs') \
            .select('*') \
            .order('created_at', desc=True) \
            .limit(limit) \
            .execute()
        return {'success': True, 'logs': res.data or []}
    except Exception as e:
        return {'success': False, 'error': str(e)}
