"""
AI Service - Groq (LLaMA) Integration
Handles chat with Groq AI, study plan generation, and chat history.
Free at: https://console.groq.com/keys
"""

import os
from groq import Groq
from supabase_client import get_supabase_client

SYSTEM_PROMPT = (
    "You are an expert AI Study Coach. Help students study more effectively, "
    "manage their time, create study plans, explain concepts, and stay motivated.\n"
    "Format every response clearly:\n"
    "- Use numbered lists (1. 2. 3.) for steps, plans, or sequences\n"
    "- Use bullet points (* item) for tips, options, or shorter lists\n"
    "- Use **bold** for section headers and key terms\n"
    "- Keep paragraphs to 1-2 sentences; prefer lists over long paragraphs\n"
    "- Be concise, practical, and encouraging"
)

GROQ_MODEL = "llama-3.1-8b-instant"


def _get_client() -> Groq:
    """Initialize and return the Groq client."""
    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key:
        raise ValueError("GROQ_API_KEY not set in environment variables")
    return Groq(api_key=api_key)


def chat_with_ai(user_id: str, message: str, context_type: str = 'general') -> dict:
    """
    Send a message to Groq LLaMA and return the response.
    Loads recent chat history to maintain context.
    """
    try:
        client = _get_client()

        # Try to load history — if Supabase times out, continue without it
        raw_history = []
        try:
            supabase = get_supabase_client()
            history_resp = (
                supabase.table('ai_chat_history')
                .select('user_message, ai_response')
                .eq('user_id', user_id)
                .order('created_at', desc=True)
                .limit(10)
                .execute()
            )
            raw_history = list(reversed(history_resp.data or []))
        except Exception:
            pass  # Proceed without history on timeout/error

        # Build messages list (OpenAI-compatible format)
        messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]
        for h in raw_history:
            messages.append({'role': 'user',      'content': h['user_message']})
            messages.append({'role': 'assistant', 'content': h['ai_response']})
        messages.append({'role': 'user', 'content': message})

        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        )
        ai_reply = completion.choices[0].message.content.strip()

        # Try to persist conversation — don't fail if Supabase is slow
        try:
            supabase = get_supabase_client()
            supabase.table('ai_chat_history').insert({
                'user_id': user_id,
                'user_message': message,
                'ai_response': ai_reply,
                'context_type': context_type,
            }).execute()
        except Exception:
            pass  # Non-critical — reply is already generated

        return {'success': True, 'reply': ai_reply}

    except ValueError as e:
        return {'success': False, 'error': str(e)}
    except Exception as e:
        return {'success': False, 'error': f"AI service error: {str(e)}"}


def get_chat_history(user_id: str, limit: int = 30) -> dict:
    """Retrieve recent chat history for a user."""
    try:
        supabase = get_supabase_client()
        resp = (
            supabase.table('ai_chat_history')
            .select('id, user_message, ai_response, context_type, created_at')
            .eq('user_id', user_id)
            .order('created_at', desc=False)
            .limit(limit)
            .execute()
        )
        return {'success': True, 'history': resp.data or []}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def clear_chat_history(user_id: str) -> dict:
    """Delete all chat history for a user."""
    try:
        supabase = get_supabase_client()
        supabase.table('ai_chat_history').delete().eq('user_id', user_id).execute()
        return {'success': True, 'message': 'Chat history cleared'}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def generate_study_plan(user_id: str, subjects: list, hours_per_day: float, goal: str) -> dict:
    """Generate a personalized study plan using Groq LLaMA."""
    try:
        client = _get_client()
        subjects_str = ', '.join(subjects) if subjects else 'General Studies'
        prompt = (
            f"Create a detailed weekly study plan:\n"
            f"- Subjects: {subjects_str}\n"
            f"- Hours per day: {hours_per_day}\n"
            f"- Goal: {goal}\n\n"
            "Include: day-by-day schedule, study techniques, break intervals, "
            "weekly milestones, and motivation tips. Use bullet points."
        )
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user',   'content': prompt},
            ],
            max_tokens=2048,
            temperature=0.7,
        )
        plan_text = completion.choices[0].message.content.strip()

        try:
            supabase = get_supabase_client()
            supabase.table('ai_chat_history').insert({
                'user_id': user_id,
                'user_message': f"Generate study plan for: {subjects_str} ({goal})",
                'ai_response': plan_text,
                'context_type': 'study_plan',
            }).execute()
        except Exception:
            pass  # Non-critical

        return {'success': True, 'plan': plan_text}
    except Exception as e:
        return {'success': False, 'error': str(e)}
