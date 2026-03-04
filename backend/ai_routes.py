"""
AI Routes - Flask Blueprint
All AI feature endpoints mounted at /api/ai/
"""

from flask import Blueprint, request, jsonify
from ai_service import chat_with_ai, get_chat_history, clear_chat_history, generate_study_plan
from reminders_service import (
    create_reminder, get_reminders, get_due_reminders,
    update_reminder, complete_reminder, delete_reminder
)
from alarms_service import (
    create_alarm, get_alarms, get_due_alarms,
    update_alarm, toggle_alarm, delete_alarm
)
from monitoring_service import get_app_metrics, get_recent_logs

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')


# ─── AI Chat ──────────────────────────────────────────────────────────────────

@ai_bp.route('/chat', methods=['POST'])
def chat():
    """Send a message to Groq AI (LLaMA)."""
    data = request.get_json() or {}
    user_id = data.get('user_id')
    message = data.get('message', '').strip()
    if not user_id or not message:
        return jsonify({'success': False, 'error': 'user_id and message are required'}), 400
    result = chat_with_ai(user_id, message, data.get('context_type', 'general'))
    return jsonify(result), 200 if result['success'] else 500


@ai_bp.route('/chat/history', methods=['GET'])
def chat_history():
    """Get chat history for a user."""
    user_id = request.args.get('user_id')
    limit = int(request.args.get('limit', 30))
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id is required'}), 400
    result = get_chat_history(user_id, limit)
    return jsonify(result), 200 if result['success'] else 500


@ai_bp.route('/chat/history', methods=['DELETE'])
def delete_chat_history():
    """Clear chat history for a user."""
    data = request.get_json() or {}
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id is required'}), 400
    result = clear_chat_history(user_id)
    return jsonify(result), 200 if result['success'] else 500


@ai_bp.route('/study-plan', methods=['POST'])
def study_plan():
    """Generate a personalized study plan."""
    data = request.get_json() or {}
    user_id  = data.get('user_id')
    subjects = data.get('subjects', [])
    hours    = float(data.get('hours_per_day', 2))
    goal     = data.get('goal', 'Pass exams')
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id is required'}), 400
    result = generate_study_plan(user_id, subjects, hours, goal)
    return jsonify(result), 200 if result['success'] else 500


# ─── Reminders ────────────────────────────────────────────────────────────────

@ai_bp.route('/reminders', methods=['POST'])
def add_reminder():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    title   = data.get('title', '').strip()
    if not user_id or not title:
        return jsonify({'success': False, 'error': 'user_id and title are required'}), 400
    result = create_reminder(
        user_id, title,
        description=data.get('description'),
        due_date=data.get('due_date'),
        recurrence=data.get('recurrence', 'none')
    )
    return jsonify(result), 201 if result['success'] else 500


@ai_bp.route('/reminders', methods=['GET'])
def list_reminders():
    user_id     = request.args.get('user_id')
    include_done = request.args.get('include_done', 'false').lower() == 'true'
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id is required'}), 400
    result = get_reminders(user_id, include_done)
    return jsonify(result), 200 if result['success'] else 500


@ai_bp.route('/reminders/due', methods=['GET'])
def due_reminders():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id is required'}), 400
    result = get_due_reminders(user_id)
    return jsonify(result), 200 if result['success'] else 500


@ai_bp.route('/reminders/<int:reminder_id>', methods=['PUT'])
def edit_reminder(reminder_id):
    data    = request.get_json() or {}
    user_id = data.pop('user_id', None)
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id is required'}), 400
    result = update_reminder(reminder_id, user_id, data)
    return jsonify(result), 200 if result['success'] else 500


@ai_bp.route('/reminders/<int:reminder_id>/done', methods=['PATCH'])
def mark_done(reminder_id):
    data    = request.get_json() or {}
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id is required'}), 400
    result = complete_reminder(reminder_id, user_id)
    return jsonify(result), 200 if result['success'] else 500


@ai_bp.route('/reminders/<int:reminder_id>', methods=['DELETE'])
def remove_reminder(reminder_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id is required'}), 400
    result = delete_reminder(reminder_id, user_id)
    return jsonify(result), 200 if result['success'] else 500


# ─── Alarms ───────────────────────────────────────────────────────────────────

@ai_bp.route('/alarms', methods=['POST'])
def add_alarm():
    data    = request.get_json() or {}
    user_id    = data.get('user_id')
    label      = data.get('label', '').strip()
    alarm_time = data.get('alarm_time', '').strip()
    if not user_id or not label or not alarm_time:
        return jsonify({'success': False, 'error': 'user_id, label, alarm_time are required'}), 400
    result = create_alarm(user_id, label, alarm_time, data.get('repeat_days'))
    return jsonify(result), 201 if result['success'] else 500


@ai_bp.route('/alarms', methods=['GET'])
def list_alarms():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id is required'}), 400
    result = get_alarms(user_id)
    return jsonify(result), 200 if result['success'] else 500


@ai_bp.route('/alarms/due', methods=['GET'])
def due_alarms():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id is required'}), 400
    result = get_due_alarms(user_id)
    return jsonify(result), 200 if result['success'] else 500


@ai_bp.route('/alarms/<int:alarm_id>', methods=['PUT'])
def edit_alarm(alarm_id):
    data    = request.get_json() or {}
    user_id = data.pop('user_id', None)
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id is required'}), 400
    result = update_alarm(alarm_id, user_id, data)
    return jsonify(result), 200 if result['success'] else 500


@ai_bp.route('/alarms/<int:alarm_id>/toggle', methods=['PATCH'])
def toggle(alarm_id):
    data      = request.get_json() or {}
    user_id   = data.get('user_id')
    is_active = data.get('is_active', True)
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id is required'}), 400
    result = toggle_alarm(alarm_id, user_id, is_active)
    return jsonify(result), 200 if result['success'] else 500


@ai_bp.route('/alarms/<int:alarm_id>', methods=['DELETE'])
def remove_alarm(alarm_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id is required'}), 400
    result = delete_alarm(alarm_id, user_id)
    return jsonify(result), 200 if result['success'] else 500


# ─── Monitoring ───────────────────────────────────────────────────────────────

@ai_bp.route('/monitoring/metrics', methods=['GET'])
def metrics():
    hours = int(request.args.get('hours', 24))
    result = get_app_metrics(hours)
    return jsonify(result), 200 if result['success'] else 500


@ai_bp.route('/monitoring/logs', methods=['GET'])
def logs():
    limit = int(request.args.get('limit', 50))
    result = get_recent_logs(limit)
    return jsonify(result), 200 if result['success'] else 500
