"""
AI Study Coach Backend Application with Supabase Integration

Flask application using Supabase (PostgreSQL) for data persistence.
This version replaces SQLite with Supabase for cloud-based storage.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import os

# Import Supabase integration
from config import Config
from database_service import DatabaseService
from auth_service import AuthService
from study_analyzer import analyze_study_data
from recommendation_engine import get_study_recommendations
from enhanced_analyzer import analyze_study_data_enhanced
from study_groups_service import (
    create_study_group, get_user_groups, get_group_details,
    join_group, leave_group, update_group, delete_group
)
from study_group_tasks_service import (
    create_task, get_group_tasks, get_task_details,
    update_task, delete_task, complete_task
)
from study_group_files_service import (
    upload_file, get_group_files, get_file_details,
    delete_file, increment_download_count
)
from study_group_notes_service import (
    create_note, get_group_notes, get_note_details,
    update_note, delete_note, toggle_pin
)
from study_group_activities_service import (
    get_group_activities, get_user_activities, create_activity
)
from study_group_study_hours_service import (
    log_study_session as log_group_study_hours, get_group_study_stats, get_member_study_hours,
    set_study_goal, get_study_goal_progress
)
from ai_routes import ai_bp

# Initialize Flask application
app = Flask(__name__)

# Load configuration from environment variables
try:
    Config.validate_config()
    app.config.from_object(Config)
    print("✓ Configuration loaded successfully")
except Exception as e:
    print(f"✗ Configuration error: {e}")
    print("Make sure you have a .env file with your Supabase credentials")
    raise

# Enable CORS for all routes to allow frontend communication
CORS(app)

# Register AI features blueprint
app.register_blueprint(ai_bp)
print("\u2713 AI features blueprint registered (/api/ai/...)")

# Initialize database service
try:
    db_service = DatabaseService()
    print("✓ Database service initialized")
except Exception as e:
    print(f"✗ Database service initialization failed: {e}")
    raise

# Initialize authentication service
try:
    auth_service = AuthService()
    print("✓ Authentication service initialized")
except Exception as e:
    print(f"✗ Authentication service initialization failed: {e}")
    raise


# Validation constants (same as SQLite version for consistency)
MIN_DURATION = 1
MAX_DURATION = 1440  # 24 hours in minutes
MIN_RATING = 1
MAX_RATING = 5
MAX_SUBJECT_LENGTH = 100


# Basic route for testing
@app.route('/')
def index():
    """Basic route to test if the application is running."""
    return {
        'message': 'AI Study Coach Backend is running!',
        'version': '2.0.0',
        'database': 'Supabase (PostgreSQL)',
        'status': 'connected'
    }


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify database connection."""
    try:
        # Test database connection
        sessions = db_service.get_all_study_sessions()
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'session_count': len(sessions),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500


# ============================================================
# AUTHENTICATION ENDPOINTS
# ============================================================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """
    Register a new user account
    
    Expected JSON input:
    {
        "username": "string",
        "email": "string",
        "password": "string"
    }
    
    Returns:
        JSON response with user data or error
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        # Validate required fields
        if not all([username, email, password]):
            return jsonify({
                'success': False,
                'error': 'Username, email, and password are required'
            }), 400
        
        # Create user
        result = auth_service.create_user(username, email, password)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in signup: {e}")
        return jsonify({
            'success': False,
            'error': 'Registration failed'
        }), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """
    Authenticate user and login
    
    Expected JSON input:
    {
        "email": "string",
        "password": "string"
    }
    
    Returns:
        JSON response with user data or error
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        email = data.get('email')
        password = data.get('password')
        
        # Validate required fields
        if not all([email, password]):
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400
        
        # Authenticate user
        result = auth_service.authenticate_user(email, password)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 401
            
    except Exception as e:
        print(f"Error in login: {e}")
        return jsonify({
            'success': False,
            'error': 'Login failed'
        }), 500


@app.route('/api/auth/user/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user profile by ID"""
    try:
        result = auth_service.get_user_by_id(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        print(f"Error getting user: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get user'
        }), 500


@app.route('/api/auth/user/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user profile"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        username = data.get('username')
        email = data.get('email')
        
        result = auth_service.update_user_profile(user_id, username=username, email=email)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error updating user: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to update user'
        }), 500


@app.route('/api/auth/change-password', methods=['POST'])
def change_password():
    """Change user password"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        user_id = data.get('user_id')
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        
        if not all([user_id, old_password, new_password]):
            return jsonify({
                'success': False,
                'error': 'User ID, old password, and new password are required'
            }), 400
        
        result = auth_service.change_password(user_id, old_password, new_password)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error changing password: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to change password'
        }), 500


# ============================================================
# STUDY SESSION ENDPOINTS
# ============================================================


@app.route('/api/study-sessions', methods=['POST'])
def log_study_session():
    """
    Log a new study session to the database.
    
    Expected JSON input:
    {
        "user_id": "UUID string",
        "subject": "string",
        "duration": integer (minutes),
        "focus_level": integer (1-5),
        "difficulty": integer (1-5),
        "notes": "string" (optional)
    }
    
    Returns:
        JSON response with success message and session details
    """
    try:
        # Get JSON data from request
        session_data = request.get_json()
        
        # Validate that JSON data was provided
        if not session_data:
            return jsonify({
                'error': 'No JSON data provided',
                'success': False
            }), 400
        
        # Extract and validate required fields
        user_id = session_data.get('user_id')
        subject = session_data.get('subject')
        duration = session_data.get('duration')
        focus_level = session_data.get('focus_level')
        difficulty = session_data.get('difficulty')
        
        # Validate required fields are present
        if not all([user_id, subject, duration is not None, focus_level is not None, difficulty is not None]):
            return jsonify({
                'error': 'Missing required fields: user_id, subject, duration, focus_level, difficulty',
                'success': False
            }), 400
        
        # Comprehensive input validation with detailed error messages
        validation_errors = []
        
        # Subject validation
        if not isinstance(subject, str):
            validation_errors.append(f'Subject must be text (received: {type(subject).__name__})')
        elif len(subject.strip()) == 0:
            validation_errors.append('Subject cannot be empty - please specify what you studied')
        elif len(subject) > MAX_SUBJECT_LENGTH:
            validation_errors.append(f'Subject must be {MAX_SUBJECT_LENGTH} characters or less (current: {len(subject)})')
        
        # Duration validation
        if not isinstance(duration, int):
            validation_errors.append(f'Duration must be a whole number of minutes (received: {type(duration).__name__})')
        elif duration < MIN_DURATION:
            validation_errors.append(f'Duration must be at least {MIN_DURATION} minute')
        elif duration > MAX_DURATION:
            validation_errors.append(f'Duration cannot exceed {MAX_DURATION} minutes (24 hours). Consider logging as separate sessions.')
        
        # Focus level validation
        if not isinstance(focus_level, int):
            validation_errors.append(f'Focus level must be a whole number (received: {type(focus_level).__name__})')
        elif focus_level < MIN_RATING or focus_level > MAX_RATING:
            validation_errors.append(f'Focus level must be between {MIN_RATING} (Poor) and {MAX_RATING} (Excellent)')
        
        # Difficulty validation
        if not isinstance(difficulty, int):
            validation_errors.append(f'Difficulty must be a whole number (received: {type(difficulty).__name__})')
        elif difficulty < MIN_RATING or difficulty > MAX_RATING:
            validation_errors.append(f'Difficulty must be between {MIN_RATING} (Very Easy) and {MAX_RATING} (Very Hard)')
        
        # Return validation errors if any
        if validation_errors:
            return jsonify({
                'error': 'Validation failed',
                'validation_errors': validation_errors,
                'success': False
            }), 400
        
        # Create session data
        new_session_data = {
            'subject': subject.strip(),
            'duration': duration,
            'focus_level': focus_level,
            'difficulty': difficulty,
            'notes': session_data.get('notes', '')
        }
        
        # Save to database using Supabase (pass user_id)
        created_session = db_service.create_study_session(new_session_data, user_id)
        
        # Return success response with session details
        return jsonify({
            'message': 'Study session logged successfully',
            'success': True,
            'session': created_session
        }), 201
        
    except Exception as database_error:
        # Log error for debugging
        print(f"Database error in log_study_session: {database_error}")
        
        # Return user-friendly error response
        error_message = 'Failed to log study session due to a server error'
        if app.debug:
            error_message += f': {str(database_error)}'
        
        return jsonify({
            'error': error_message,
            'success': False,
            'hint': 'Please check your input data and try again'
        }), 500


@app.route('/api/study-sessions', methods=['GET'])
def get_study_sessions():
    """
    Fetch all logged study sessions from the database.
    
    Optional query parameters:
        - user_id: Filter by specific user (UUID)
        - subject: Filter by specific subject
        - limit: Limit number of results
    
    Returns:
        JSON response with study sessions sorted by timestamp (newest first)
    """
    try:
        # Get optional query parameters
        user_id = request.args.get('user_id')
        subject_filter = request.args.get('subject')
        limit = request.args.get('limit', type=int)
        
        # Fetch sessions from database
        if subject_filter:
            sessions = db_service.get_sessions_by_subject(subject_filter, user_id)
        else:
            sessions = db_service.get_all_study_sessions(user_id)
        
        # Apply limit if specified
        if limit and limit > 0:
            sessions = sessions[:limit]
        
        # Return success response with sessions data
        return jsonify({
            'success': True,
            'count': len(sessions),
            'sessions': sessions,
            'message': f'Retrieved {len(sessions)} study sessions'
        }), 200
        
    except Exception as database_error:
        print(f"Error in get_study_sessions: {database_error}")
        return jsonify({
            'error': 'Failed to retrieve study sessions',
            'details': str(database_error) if app.debug else 'Database error',
            'success': False,
            'count': 0,
            'sessions': []
        }), 500


@app.route('/api/study-sessions/<int:session_id>', methods=['GET'])
def get_study_session(session_id):
    """Get a specific study session by ID."""
    try:
        session = db_service.get_study_session_by_id(session_id)
        
        if not session:
            return jsonify({
                'error': f'Study session with ID {session_id} not found',
                'success': False
            }), 404
        
        return jsonify({
            'success': True,
            'session': session
        }), 200
        
    except Exception as e:
        print(f"Error in get_study_session: {e}")
        return jsonify({
            'error': 'Failed to retrieve study session',
            'success': False
        }), 500


@app.route('/api/study-sessions/<int:session_id>', methods=['PUT'])
def update_study_session(session_id):
    """Update an existing study session."""
    try:
        update_data = request.get_json()
        
        if not update_data:
            return jsonify({
                'error': 'No update data provided',
                'success': False
            }), 400
        
        # Validate update data (same validation as create)
        validation_errors = []
        
        if 'subject' in update_data:
            subject = update_data['subject']
            if not isinstance(subject, str) or len(subject.strip()) == 0:
                validation_errors.append('Subject must be non-empty text')
        
        if 'duration' in update_data:
            duration = update_data['duration']
            if not isinstance(duration, int) or duration < MIN_DURATION or duration > MAX_DURATION:
                validation_errors.append(f'Duration must be between {MIN_DURATION} and {MAX_DURATION}')
        
        if validation_errors:
            return jsonify({
                'error': 'Validation failed',
                'validation_errors': validation_errors,
                'success': False
            }), 400
        
        # Update the session
        updated_session = db_service.update_study_session(session_id, update_data)
        
        if not updated_session:
            return jsonify({
                'error': f'Study session with ID {session_id} not found',
                'success': False
            }), 404
        
        return jsonify({
            'message': 'Study session updated successfully',
            'success': True,
            'session': updated_session
        }), 200
        
    except Exception as e:
        print(f"Error in update_study_session: {e}")
        return jsonify({
            'error': 'Failed to update study session',
            'success': False
        }), 500


@app.route('/api/study-sessions/<int:session_id>', methods=['DELETE'])
def delete_study_session(session_id):
    """Delete a study session."""
    try:
        # Check if session exists first
        session = db_service.get_study_session_by_id(session_id)
        
        if not session:
            return jsonify({
                'error': f'Study session with ID {session_id} not found',
                'success': False
            }), 404
        
        # Delete the session
        db_service.delete_study_session(session_id)
        
        return jsonify({
            'message': 'Study session deleted successfully',
            'success': True,
            'deleted_id': session_id
        }), 200
        
    except Exception as e:
        print(f"Error in delete_study_session: {e}")
        return jsonify({
            'error': 'Failed to delete study session',
            'success': False
        }), 500


@app.route('/api/study-insights', methods=['GET'])
def get_study_insights():
    """
    Analyze study session data and return insights and patterns.
    
    Returns:
        JSON response with analysis insights, summary, and patterns
    """
    try:
        # Get all study sessions for analysis
        sessions = db_service.get_all_study_sessions()
        
        if not sessions:
            return jsonify({
                'success': True,
                'insights': ["No study sessions found to analyze. Start logging sessions to get personalized insights!"],
                'summary': "No study data available yet.",
                'analysis': {
                    'total_sessions': 0,
                    'analysis_timestamp': datetime.utcnow().isoformat()
                }
            }), 200
        
        # Analyze the study data
        analysis_result = analyze_study_data(sessions)
        
        # Return analysis results
        return jsonify({
            'success': True,
            'insights': analysis_result['insights'],
            'summary': analysis_result['summary'],
            'analysis': {
                'total_sessions': analysis_result['total_sessions'],
                'analysis_timestamp': analysis_result['analysis_timestamp']
            }
        }), 200
        
    except Exception as analysis_error:
        print(f"Analysis error in get_study_insights: {analysis_error}")
        
        return jsonify({
            'success': False,
            'error': 'Failed to analyze study data',
            'details': str(analysis_error) if app.debug else 'Analysis error',
            'insights': [],
            'summary': 'Analysis temporarily unavailable'
        }), 500


@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    """Get personalized study recommendations based on session history."""
    try:
        sessions = db_service.get_all_study_sessions()
        
        if not sessions:
            return jsonify({
                'success': True,
                'recommendations': ["Start logging study sessions to get personalized recommendations!"],
                'message': 'No data available for recommendations'
            }), 200
        
        # Get recommendations
        recommendations = get_study_recommendations(sessions)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'based_on_sessions': len(sessions)
        }), 200
        
    except Exception as e:
        print(f"Error in get_recommendations: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate recommendations',
            'recommendations': []
        }), 500


@app.route('/api/enhanced-insights', methods=['GET'])
def get_enhanced_insights():
    """Get enhanced study insights with advanced analytics."""
    try:
        sessions = db_service.get_all_study_sessions()
        
        if not sessions:
            return jsonify({
                'success': True,
                'message': 'No study sessions available for analysis',
                'insights': {}
            }), 200
        
        # Get enhanced analysis
        enhanced_analysis = analyze_study_data_enhanced(sessions)
        
        return jsonify({
            'success': True,
            'insights': enhanced_analysis
        }), 200
        
    except Exception as e:
        print(f"Error in get_enhanced_insights: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to generate enhanced insights'
        }), 500


@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Get aggregated study statistics."""
    try:
        stats = db_service.get_study_statistics()
        
        return jsonify({
            'success': True,
            'statistics': stats
        }), 200
        
    except Exception as e:
        print(f"Error in get_statistics: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve statistics'
        }), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'error': 'Endpoint not found',
        'success': False
    }), 404

# ============================================================
# STUDY GROUPS ENDPOINTS
# ============================================================

@app.route('/api/study-groups', methods=['POST'])
def create_group():
    """Create a new study group."""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'name' not in data or 'creator_id' not in data:
            return jsonify({
                'success': False,
                'error': 'Name and creator_id are required'
            }), 400
        
        name = data.get('name', '').strip()
        creator_id = data.get('creator_id')
        description = data.get('description', '').strip() if data.get('description') else None
        location = data.get('location', '').strip() if data.get('location') else None
        tags = data.get('tags', [])
        
        if not name:
            return jsonify({
                'success': False,
                'error': 'Group name cannot be empty'
            }), 400
        
        result = create_study_group(name, creator_id, description, location, tags)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in create_group endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<user_id>', methods=['GET'])
def get_groups(user_id):
    """Get all study groups for a user."""
    try:
        result = get_user_groups(user_id)
        return jsonify(result), 200
            
    except Exception as e:
        print(f"Error in get_groups endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'groups': []
        }), 500


@app.route('/api/study-groups/details/<group_id>', methods=['GET'])
def group_details(group_id):
    """Get detailed information about a specific group."""
    try:
        result = get_group_details(group_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        print(f"Error in group_details endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/join', methods=['POST'])
def join_study_group(group_id):
    """Join a study group."""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        user_id = data.get('user_id')
        result = join_group(group_id, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in join_study_group endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/leave', methods=['POST'])
def leave_study_group(group_id):
    """Leave a study group."""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        user_id = data.get('user_id')
        result = leave_group(group_id, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in leave_study_group endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>', methods=['PUT'])
def update_study_group(group_id):
    """Update study group details."""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        user_id = data.get('user_id')
        updates = {k: v for k, v in data.items() if k != 'user_id'}
        
        result = update_group(group_id, user_id, updates)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in update_study_group endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>', methods=['DELETE'])
def delete_study_group(group_id):
    """Delete a study group."""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        user_id = data.get('user_id')
        result = delete_group(group_id, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in delete_study_group endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================
# STUDY GROUP TASKS ENDPOINTS
# ============================================================

@app.route('/api/study-groups/<group_id>/tasks', methods=['POST'])
def create_group_task(group_id):
    """Create a new task in a study group."""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data or 'title' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id and title are required'
            }), 400
        
        user_id = data.get('user_id')
        title = data.get('title')
        description = data.get('description')
        assigned_to = data.get('assigned_to')
        priority = data.get('priority', 'medium')
        due_date = data.get('due_date')
        
        result = create_task(group_id, user_id, title, description, 
                           assigned_to, priority, due_date)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in create_group_task endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/tasks', methods=['GET'])
def get_tasks(group_id):
    """Get all tasks for a study group."""
    try:
        user_id = request.args.get('user_id')
        status = request.args.get('status')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        result = get_group_tasks(group_id, user_id, status)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in get_tasks endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/tasks/<task_id>', methods=['GET'])
def get_task(group_id, task_id):
    """Get details of a specific task."""
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        result = get_task_details(task_id, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in get_task endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/tasks/<task_id>', methods=['PUT'])
def update_task_endpoint(group_id, task_id):
    """Update a task."""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        user_id = data.get('user_id')
        updates = {k: v for k, v in data.items() if k != 'user_id'}
        
        result = update_task(task_id, user_id, updates)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in update_task endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/tasks/<task_id>', methods=['DELETE'])
def delete_task_endpoint(group_id, task_id):
    """Delete a task."""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        user_id = data.get('user_id')
        result = delete_task(task_id, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in delete_task endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/tasks/<task_id>/complete', methods=['PATCH'])
def complete_task_endpoint(group_id, task_id):
    """Mark a task as completed."""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        user_id = data.get('user_id')
        result = complete_task(task_id, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in complete_task endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================
# STUDY GROUP FILES ENDPOINTS
# ============================================================

@app.route('/api/study-groups/<group_id>/files', methods=['POST'])
def upload_group_file(group_id):
    """Upload a file to a study group."""
    try:
        data = request.get_json()
        
        required_fields = ['user_id', 'file_name', 'file_type', 'file_size', 'file_url']
        if not data or not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': f'Required fields: {", ".join(required_fields)}'
            }), 400
        
        user_id = data.get('user_id')
        file_name = data.get('file_name')
        file_type = data.get('file_type')
        file_size = data.get('file_size')
        file_url = data.get('file_url')
        description = data.get('description')
        
        result = upload_file(group_id, user_id, file_name, file_type, 
                           file_size, file_url, description)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in upload_group_file endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/files', methods=['GET'])
def get_files(group_id):
    """Get all files for a study group."""
    try:
        user_id = request.args.get('user_id')
        file_type = request.args.get('file_type')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        result = get_group_files(group_id, user_id, file_type)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in get_files endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/files/<file_id>', methods=['GET'])
def get_file(group_id, file_id):
    """Get details of a specific file."""
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        result = get_file_details(file_id, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in get_file endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/files/<file_id>', methods=['DELETE'])
def delete_file_endpoint(group_id, file_id):
    """Delete a file."""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        user_id = data.get('user_id')
        result = delete_file(file_id, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in delete_file endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/files/<file_id>/download', methods=['PATCH'])
def download_file_endpoint(group_id, file_id):
    """Increment download count for a file."""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        user_id = data.get('user_id')
        result = increment_download_count(file_id, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in download_file endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================
# STUDY GROUP NOTES ENDPOINTS
# ============================================================

@app.route('/api/study-groups/<group_id>/notes', methods=['POST'])
def create_group_note(group_id):
    """Create a new note in a study group."""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data or 'title' not in data or 'content' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id, title, and content are required'
            }), 400
        
        user_id = data.get('user_id')
        title = data.get('title')
        content = data.get('content')
        is_pinned = data.get('is_pinned', False)
        tags = data.get('tags', [])
        
        result = create_note(group_id, user_id, title, content, is_pinned, tags)
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in create_group_note endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/notes', methods=['GET'])
def get_notes(group_id):
    """Get all notes for a study group."""
    try:
        user_id = request.args.get('user_id')
        pinned_only = request.args.get('pinned_only', 'false').lower() == 'true'
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        result = get_group_notes(group_id, user_id, pinned_only)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in get_notes endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/notes/<note_id>', methods=['GET'])
def get_note(group_id, note_id):
    """Get details of a specific note."""
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        result = get_note_details(note_id, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in get_note endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/notes/<note_id>', methods=['PUT'])
def update_note_endpoint(group_id, note_id):
    """Update a note."""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        user_id = data.get('user_id')
        updates = {k: v for k, v in data.items() if k != 'user_id'}
        
        result = update_note(note_id, user_id, updates)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in update_note endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/notes/<note_id>', methods=['DELETE'])
def delete_note_endpoint(group_id, note_id):
    """Delete a note."""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        user_id = data.get('user_id')
        result = delete_note(note_id, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in delete_note endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/notes/<note_id>/pin', methods=['PATCH'])
def toggle_note_pin(group_id, note_id):
    """Toggle the pinned status of a note."""
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        user_id = data.get('user_id')
        result = toggle_pin(note_id, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in toggle_note_pin endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================
# STUDY GROUP ACTIVITIES ENDPOINTS
# ============================================================

@app.route('/api/study-groups/<group_id>/activities', methods=['GET'])
def get_activities(group_id):
    """Get recent activities for a study group."""
    try:
        user_id = request.args.get('user_id')
        limit = int(request.args.get('limit', 20))
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        result = get_group_activities(group_id, user_id, limit)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in get_activities endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/activities/user', methods=['GET'])
def get_user_activities_endpoint():
    """Get recent activities across all groups for a user."""
    try:
        user_id = request.args.get('user_id')
        limit = int(request.args.get('limit', 20))
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        result = get_user_activities(user_id, limit)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in get_user_activities endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# STUDY HOURS ENDPOINTS
# ============================================================================

@app.route('/api/study-groups/<group_id>/study-hours/log', methods=['POST'])
def log_group_study_session(group_id):
    """Log a study session for a group member."""
    try:
        data = request.json
        user_id = data.get('user_id')
        subject = data.get('subject')
        duration = data.get('duration')
        notes = data.get('notes')
        
        if not all([user_id, subject, duration]):
            return jsonify({
                'success': False,
                'error': 'user_id, subject, and duration are required'
            }), 400
        
        result = log_group_study_hours(group_id, user_id, subject, duration, notes)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in log_group_study_session endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/study-hours/stats', methods=['GET'])
def get_group_stats(group_id):
    """Get study statistics for a group."""
    try:
        user_id = request.args.get('user_id')
        days = int(request.args.get('days', 7))
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        result = get_group_study_stats(group_id, user_id, days)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in get_group_stats endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/study-hours/member', methods=['GET'])
def get_member_hours(group_id):
    """Get study hours for a specific member."""
    try:
        user_id = request.args.get('user_id')
        target_user_id = request.args.get('target_user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        result = get_member_study_hours(group_id, user_id, target_user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in get_member_hours endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/study-hours/goals', methods=['POST'])
def set_group_study_goals(group_id):
    """Set study hour goals for the group."""
    try:
        data = request.json
        user_id = data.get('user_id')
        weekly_hours = data.get('weekly_hours')
        monthly_hours = data.get('monthly_hours')
        
        if not all([user_id, weekly_hours]):
            return jsonify({
                'success': False,
                'error': 'user_id and weekly_hours are required'
            }), 400
        
        result = set_study_goal(group_id, user_id, weekly_hours, monthly_hours)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in set_group_study_goals endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/study-groups/<group_id>/study-hours/progress', methods=['GET'])
def get_study_goals_progress(group_id):
    """Get progress towards study goals."""
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        result = get_study_goal_progress(group_id, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        print(f"Error in get_study_goals_progress endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({
        'error': 'Internal server error',
        'success': False
    }), 500


if __name__ == '__main__':
    # Run the Flask application
    # Render injects PORT env var — fall back to Config.API_PORT locally
    port = int(os.environ.get('PORT', Config.API_PORT))
    debug = Config.DEBUG
    
    print("=" * 60)
    print("AI Study Coach Backend - Supabase Edition")
    print("=" * 60)
    print(f"Starting server on http://localhost:{port}")
    print(f"Debug mode: {debug}")
    print(f"Database: Supabase (PostgreSQL)")
    print("=" * 60)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )
