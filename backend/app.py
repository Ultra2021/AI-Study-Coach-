"""
AI Study Coach Backend Application

Flask application with SQLAlchemy for managing study sessions.
Uses SQLite database for data persistence.
"""

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
from study_analyzer import analyze_study_data
from recommendation_engine import get_study_recommendations
from enhanced_analyzer import analyze_study_data_enhanced
import os

# Initialize Flask application
app = Flask(__name__)

# Enable CORS for all routes to allow frontend communication
CORS(app)

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "study_coach.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy
db = SQLAlchemy(app)


class StudySession(db.Model):
    """
    StudySession model for tracking individual study sessions.
    
    Design Decision: Uses simple integer ratings (1-5) for focus and difficulty
    to make it easy for students to quickly rate their sessions without
    overthinking the scale. SQLite is chosen for simplicity in development
    and easy deployment.
    
    Attributes:
        id (int): Primary key, auto-incremented
        subject (str): Subject being studied (max 100 chars for database efficiency)
        duration (int): Study session duration in minutes (1-1440 valid range)
        focus_level (int): User's focus level rating (1=Poor to 5=Excellent)
        difficulty (int): Perceived difficulty of the material (1=Very Easy to 5=Very Hard)
        timestamp (datetime): When the session was created (auto-populated, UTC)
    
    Validation Rules:
        - Subject: Non-empty string, max 100 characters
        - Duration: 1-1440 minutes (up to 24 hours)
        - Focus/Difficulty: Integer 1-5 inclusive
    """
    
    # Validation constants for maintainability
    MIN_DURATION = 1
    MAX_DURATION = 1440  # 24 hours in minutes
    MIN_RATING = 1
    MAX_RATING = 5
    MAX_SUBJECT_LENGTH = 100
    
    __tablename__ = 'study_sessions'
    
    # Primary key
    id = db.Column(db.Integer, primary_key=True)
    
    # Study session details
    subject = db.Column(db.String(100), nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # Duration in minutes
    
    # User feedback (1-5 scale)
    focus_level = db.Column(db.Integer, nullable=False)  # 1=Poor, 5=Excellent
    difficulty = db.Column(db.Integer, nullable=False)   # 1=Very Easy, 5=Very Hard
    
    # Timestamp
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        """String representation of StudySession object."""
        return f'<StudySession {self.id}: {self.subject} ({self.duration}min)>'
    
    def to_dict(self):
        """Convert StudySession object to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'subject': self.subject,
            'duration': self.duration,
            'focus_level': self.focus_level,
            'difficulty': self.difficulty,
            'timestamp': self.timestamp.isoformat()
        }


def init_database():
    """
    Initialize the database by creating all tables.
    This function should be called when setting up the application for the first time.
    """
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully!")
        except Exception as e:
            print(f"Error creating database tables: {e}")


# Basic route for testing
@app.route('/')
def index():
    """Basic route to test if the application is running."""
    return {
        'message': 'AI Study Coach Backend is running!',
        'version': '1.0.0',
        'database': 'SQLite'
    }


@app.route('/api/study-sessions', methods=['POST'])
def log_study_session():
    """
    Log a new study session to the database.
    
    Expected JSON input:
    {
        "subject": "string",
        "duration": integer (minutes),
        "focus_level": integer (1-5),
        "difficulty": integer (1-5)
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
        subject = session_data.get('subject')
        duration = session_data.get('duration')
        focus_level = session_data.get('focus_level')
        difficulty = session_data.get('difficulty')
        
        # Validate required fields are present
        if not all([subject, duration is not None, focus_level is not None, difficulty is not None]):
            return jsonify({
                'error': 'Missing required fields: subject, duration, focus_level, difficulty',
                'success': False
            }), 400
        
        # Comprehensive input validation with detailed error messages
        # Design Decision: Validate early and provide specific feedback to help users
        # understand exactly what went wrong and how to fix it
        validation_errors = []
        
        # Subject validation - ensure meaningful study tracking
        if not isinstance(subject, str):
            validation_errors.append('Subject must be text (received: {})'.format(type(subject).__name__))
        elif len(subject.strip()) == 0:
            validation_errors.append('Subject cannot be empty - please specify what you studied')
        elif len(subject) > StudySession.MAX_SUBJECT_LENGTH:
            validation_errors.append(f'Subject must be {StudySession.MAX_SUBJECT_LENGTH} characters or less (current: {len(subject)})')
        
        # Duration validation - prevent unrealistic session lengths
        if not isinstance(duration, int):
            validation_errors.append('Duration must be a whole number of minutes (received: {})'.format(type(duration).__name__))
        elif duration < StudySession.MIN_DURATION:
            validation_errors.append(f'Duration must be at least {StudySession.MIN_DURATION} minute')
        elif duration > StudySession.MAX_DURATION:
            validation_errors.append(f'Duration cannot exceed {StudySession.MAX_DURATION} minutes (24 hours). Consider logging as separate sessions.')
        
        # Focus level validation - ensure valid scale usage
        if not isinstance(focus_level, int):
            validation_errors.append('Focus level must be a whole number (received: {})'.format(type(focus_level).__name__))
        elif focus_level < StudySession.MIN_RATING or focus_level > StudySession.MAX_RATING:
            validation_errors.append(f'Focus level must be between {StudySession.MIN_RATING} (Poor) and {StudySession.MAX_RATING} (Excellent)')
        
        # Difficulty validation - ensure valid scale usage
        if not isinstance(difficulty, int):
            validation_errors.append('Difficulty must be a whole number (received: {})'.format(type(difficulty).__name__))
        elif difficulty < StudySession.MIN_RATING or difficulty > StudySession.MAX_RATING:
            validation_errors.append(f'Difficulty must be between {StudySession.MIN_RATING} (Very Easy) and {StudySession.MAX_RATING} (Very Hard)')
        
        # Return validation errors if any
        if validation_errors:
            return jsonify({
                'error': 'Validation failed',
                'validation_errors': validation_errors,
                'success': False
            }), 400
        
        # Create new StudySession object
        new_session = StudySession(
            subject=subject.strip(),
            duration=duration,
            focus_level=focus_level,
            difficulty=difficulty
        )
        
        # Add to database session and commit
        db.session.add(new_session)
        db.session.commit()
        
        # Return success response with session details
        return jsonify({
            'message': 'Study session logged successfully',
            'success': True,
            'session': new_session.to_dict()
        }), 201
        
    except Exception as database_error:
        # Design Decision: Always rollback on error to maintain database consistency
        # and provide detailed error information for debugging while being safe for production
        db.session.rollback()
        
        # Log error for debugging (in production, use proper logging)
        print(f"Database error in log_study_session: {database_error}")
        
        # Return user-friendly error response without exposing sensitive details
        error_message = 'Failed to log study session due to a server error'
        if app.debug:  # Only show detailed errors in debug mode
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
    
    Returns:
        JSON response with all study sessions sorted by timestamp (newest first)
        
    Response format:
    {
        "success": true,
        "count": integer,
        "sessions": [
            {
                "id": integer,
                "subject": "string",
                "duration": integer,
                "focus_level": integer,
                "difficulty": integer,
                "timestamp": "ISO format datetime"
            }
        ]
    }
    """
    try:
        # Design Decision: Order by timestamp descending to show most recent sessions first
        # This is more useful for students who want to see their latest activity
        # Note: For large datasets, consider adding pagination to improve performance
        all_sessions = StudySession.query.order_by(StudySession.timestamp.desc()).all()
        
        # Convert sessions to dictionary format for JSON response
        sessions_data = []
        for session in all_sessions:
            sessions_data.append(session.to_dict())
        
        # Return success response with sessions data
        return jsonify({
            'success': True,
            'count': len(sessions_data),
            'sessions': sessions_data,
            'message': f'Retrieved {len(sessions_data)} study sessions'
        }), 200
        
    except Exception as database_error:
        # Return error response if database query fails
        return jsonify({
            'error': 'Failed to retrieve study sessions',
            'details': str(database_error),
            'success': False,
            'count': 0,
            'sessions': []
        }), 500


@app.route('/api/study-insights', methods=['GET'])
def get_study_insights():
    """
    Analyze study session data and return insights and patterns.
    
    Returns:
        JSON response with analysis insights, summary, and patterns
        
    Response format:
    {
        "success": true,
        "insights": [
            "Your average study session length of 45.2 minutes is in a good range.",
            "You focus best when studying Mathematics and have most trouble with History."
        ],
        "summary": "You've completed 15 study sessions totaling 678 minutes with good focus (avg: 3.4/5).",
        "analysis": {
            "total_sessions": 15,
            "analysis_timestamp": "2026-01-21T..."
        }
    }
    """
    try:
        # Get all study sessions for analysis
        all_sessions = StudySession.query.order_by(StudySession.timestamp.desc()).all()
        
        if not all_sessions:
            return jsonify({
                'success': True,
                'insights': ["No study sessions found to analyze. Start logging sessions to get personalized insights!"],
                'summary': "No study data available yet.",
                'analysis': {
                    'total_sessions': 0,
                    'analysis_timestamp': datetime.now().isoformat()
                }
            }), 200
        
        # Convert sessions to dictionary format for analysis
        sessions_data = [session.to_dict() for session in all_sessions]
        
        # Analyze the study data
        analysis_result = analyze_study_data(sessions_data)
        
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
        # Design Decision: Graceful degradation - if analysis fails, still provide
        # a basic response so the UI doesn't break completely
        print(f"Analysis error in get_study_insights: {analysis_error}")
        
        error_message = 'Analysis temporarily unavailable'
        if app.debug:
            error_message += f': {str(analysis_error)}'
        
        return jsonify({
            'error': error_message,
            'success': False,
            'insights': ['Unable to generate insights at this time. Please try again later.'],
            'summary': 'Analysis unavailable - your session data is safe.',
            'fallback': True  # Indicates this is a fallback response
        }), 500


@app.route('/api/study-recommendations', methods=['GET'])
def get_study_recommendations_endpoint():
    """
    Generate personalized study recommendations based on session data and analysis.
    
    Returns:
        JSON response with adaptive study recommendations
        
    Response format:
    {
        "success": true,
        "recommendations": {
            "session_structure": ["Recommendation 1", "Recommendation 2"],
            "break_schedule": ["Break recommendation 1"],
            "subject_ordering": ["Subject order recommendation"],
            "focus_strategies": ["Focus strategy 1"],
            "next_session": ["Next session recommendation"],
            "weekly_plan": ["Weekly planning advice"],
            "priority_actions": ["Top priority action"]
        },
        "generated_at": "2026-01-21T...",
        "based_on_sessions": 15
    }
    """
    try:
        # Get all study sessions for analysis
        all_sessions = StudySession.query.order_by(StudySession.timestamp.desc()).all()
        
        # Convert sessions to dictionary format
        sessions_data = [session.to_dict() for session in all_sessions]
        
        # Get analysis insights first
        if sessions_data:
            analysis_result = analyze_study_data(sessions_data)
            insights = analysis_result['insights']
        else:
            insights = []
        
        # Generate recommendations
        recommendation_result = get_study_recommendations(sessions_data, insights)
        
        # Return recommendations
        return jsonify({
            'success': True,
            'recommendations': recommendation_result['recommendations'],
            'generated_at': recommendation_result['generated_at'],
            'based_on_sessions': recommendation_result['based_on_sessions']
        }), 200
        
    except Exception as recommendation_error:
        # Return error response if recommendation generation fails
        return jsonify({
            'error': 'Failed to generate study recommendations',
            'details': str(recommendation_error),
            'success': False,
            'recommendations': {}
        }), 500


@app.route('/api/study-predictions', methods=['GET'])
def get_study_predictions():
    """
    Get enhanced study analysis with statistical predictions and optimal conditions.
    
    This endpoint provides advanced analysis including:
    - Optimal session duration predictions with confidence intervals
    - Best time-of-day recommendations based on historical focus patterns
    - Subject-specific optimization suggestions
    - Trend analysis and pattern detection
    - Statistical correlations between study variables
    
    Returns:
        JSON response with enhanced analysis and explainable predictions
        
    Response format:
    {
        "success": true,
        "enhanced_analysis": {
            "basic_statistics": {...},
            "optimal_conditions": {
                "duration": {
                    "prediction": 45.0,
                    "confidence": 0.8,
                    "reasoning": "Based on analysis of 3 duration ranges..."
                },
                "best_time_window": [9, 11],
                "subject_recommendations": {...}
            },
            "trends": {...},
            "patterns": [...],
            "recommendations": [...]
        },
        "methodology": "Simple statistical methods with explainable predictions"
    }
    """
    try:
        # Get all study sessions for enhanced analysis
        all_sessions = StudySession.query.order_by(StudySession.timestamp.desc()).all()
        
        # Convert sessions to dictionary format for analysis
        sessions_data = [session.to_dict() for session in all_sessions]
        
        # Perform enhanced statistical analysis
        enhanced_result = analyze_study_data_enhanced(sessions_data)
        
        # Return enhanced analysis results
        return jsonify({
            'success': True,
            'enhanced_analysis': enhanced_result['enhanced_analysis'],
            'methodology': enhanced_result['methodology'],
            'analysis_type': enhanced_result['analysis_type'],
            'total_sessions': enhanced_result['total_sessions'],
            'analysis_timestamp': enhanced_result['analysis_timestamp']
        }), 200
        
    except Exception as analysis_error:
        # Design Decision: Graceful degradation for enhanced analysis
        # If statistical analysis fails, provide basic fallback
        print(f"Enhanced analysis error in get_study_predictions: {analysis_error}")
        
        error_message = 'Enhanced analysis temporarily unavailable'
        if app.debug:
            error_message += f': {str(analysis_error)}'
        
        return jsonify({
            'error': error_message,
            'success': False,
            'enhanced_analysis': {
                'basic_statistics': {'session_count': 0},
                'optimal_conditions': None,
                'trends': {'insufficient_data': True},
                'patterns': ['Advanced analysis unavailable'],
                'recommendations': ['Please try again later']
            },
            'fallback': True
        }), 500


@app.route('/api/mobile/login', methods=['POST'])
def mobile_login():
    """
    Mobile login endpoint for React Native app.
    Simple authentication for demo purposes.
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        
        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400
        
        # Simple validation - in production, use proper authentication
        if '@' in email:
            return jsonify({
                'success': True,
                'user': {
                    'email': email,
                    'name': 'Student User',
                    'id': 1
                },
                'token': 'demo_token_12345'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid credentials'
            }), 401
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/mobile/stats', methods=['GET'])
def mobile_stats():
    """
    Get user statistics for mobile dashboard.
    """
    try:
        sessions = StudySession.query.all()
        
        if not sessions:
            return jsonify({
                'success': True,
                'stats': {
                    'todayTime': 0,
                    'weeklyTime': 0,
                    'mostTimeSubject': 'N/A',
                    'bestMonth': {'month': 'N/A', 'value': 0}
                }
            }), 200
        
        # Calculate statistics
        total_time = sum(s.duration for s in sessions)
        
        # Group by subject
        subject_times = {}
        for s in sessions:
            subject_times[s.subject] = subject_times.get(s.subject, 0) + s.duration
        
        most_time_subject = max(subject_times, key=subject_times.get) if subject_times else 'N/A'
        
        return jsonify({
            'success': True,
            'stats': {
                'todayTime': min(total_time // 60, 24),  # Convert to hours
                'weeklyTime': total_time // 60,
                'mostTimeSubject': most_time_subject,
                'bestMonth': {'month': 'June', 'value': 22}
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/mobile/study-groups', methods=['GET'])
def mobile_study_groups():
    """
    Get study groups for mobile app.
    """
    try:
        # Mock data for study groups
        groups = [
            {
                'id': 1,
                'name': 'IELTS Exam',
                'members': 48,
                'totalHours': 801,
                'creator': '@ician',
                'location': 'Georgia',
                'createdDate': 'February 22, 2023',
                'tags': ['College', 'Irish Design']
            }
        ]
        
        return jsonify({
            'success': True,
            'groups': groups
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    # Initialize database on first run
    init_database()
    
    # Run the Flask development server
    # Changed to 0.0.0.0 to allow mobile device connections
    app.run(debug=True, host='0.0.0.0', port=5000)