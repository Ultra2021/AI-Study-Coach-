"""
Input Validation and Utility Functions

Centralized validation logic and utility functions for the AI Study Coach backend.
This module improves code reusability and maintainability by separating
validation logic from endpoint handlers.

Design Decision: Centralize validation to ensure consistency across endpoints
and make it easier to update validation rules in the future.
"""

from datetime import datetime
from typing import Dict, List, Tuple, Any, Optional


class ValidationError(Exception):
    """Custom exception for validation errors with detailed messaging."""
    
    def __init__(self, field: str, message: str, value: Any = None):
        self.field = field
        self.message = message
        self.value = value
        super().__init__(f"{field}: {message}")


class StudySessionValidator:
    """
    Validator class for study session data with comprehensive validation rules.
    
    Design Decision: Use a class-based approach to make validation logic
    easily testable and extendable. All validation rules are centralized
    and clearly documented.
    """
    
    # Validation constants - centralized for easy maintenance
    MIN_DURATION = 1
    MAX_DURATION = 1440  # 24 hours in minutes
    MIN_RATING = 1
    MAX_RATING = 5
    MAX_SUBJECT_LENGTH = 100
    
    # Rating scale descriptions for better user feedback
    FOCUS_LABELS = {
        1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent"
    }
    
    DIFFICULTY_LABELS = {
        1: "Very Easy", 2: "Easy", 3: "Moderate", 4: "Hard", 5: "Very Hard"
    }
    
    @classmethod
    def validate_session_data(cls, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate complete study session data.
        
        Args:
            data: Dictionary containing session data
            
        Returns:
            Tuple of (is_valid, list_of_error_messages)
        """
        errors = []
        
        try:
            cls._validate_required_fields(data)
            cls._validate_subject(data.get('subject'))
            cls._validate_duration(data.get('duration'))
            cls._validate_focus_level(data.get('focus_level'))
            cls._validate_difficulty(data.get('difficulty'))
            
        except ValidationError as e:
            errors.append(str(e))
        except Exception as e:
            errors.append(f"Validation error: {str(e)}")
        
        return len(errors) == 0, errors
    
    @classmethod
    def _validate_required_fields(cls, data: Dict[str, Any]) -> None:
        """Validate that all required fields are present."""
        required_fields = ['subject', 'duration', 'focus_level', 'difficulty']
        missing_fields = [field for field in required_fields if field not in data or data[field] is None]
        
        if missing_fields:
            raise ValidationError(
                'required_fields',
                f"Missing required fields: {', '.join(missing_fields)}. "
                f"All fields are required: {', '.join(required_fields)}"
            )
    
    @classmethod
    def _validate_subject(cls, subject: Any) -> None:
        """Validate subject field with detailed error messages."""
        if not isinstance(subject, str):
            raise ValidationError(
                'subject',
                f"Subject must be text (received: {type(subject).__name__})"
            )
        
        subject_clean = subject.strip()
        if len(subject_clean) == 0:
            raise ValidationError(
                'subject',
                "Subject cannot be empty - please specify what you studied"
            )
        
        if len(subject) > cls.MAX_SUBJECT_LENGTH:
            raise ValidationError(
                'subject',
                f"Subject must be {cls.MAX_SUBJECT_LENGTH} characters or less "
                f"(current: {len(subject)} characters)"
            )
    
    @classmethod
    def _validate_duration(cls, duration: Any) -> None:
        """Validate duration field with helpful guidance."""
        if not isinstance(duration, int):
            raise ValidationError(
                'duration',
                f"Duration must be a whole number of minutes (received: {type(duration).__name__})"
            )
        
        if duration < cls.MIN_DURATION:
            raise ValidationError(
                'duration',
                f"Duration must be at least {cls.MIN_DURATION} minute"
            )
        
        if duration > cls.MAX_DURATION:
            raise ValidationError(
                'duration',
                f"Duration cannot exceed {cls.MAX_DURATION} minutes (24 hours). "
                "For longer study periods, consider logging as separate sessions with breaks."
            )
    
    @classmethod
    def _validate_focus_level(cls, focus_level: Any) -> None:
        """Validate focus level with scale explanation."""
        if not isinstance(focus_level, int):
            raise ValidationError(
                'focus_level',
                f"Focus level must be a whole number (received: {type(focus_level).__name__})"
            )
        
        if focus_level < cls.MIN_RATING or focus_level > cls.MAX_RATING:
            scale_desc = ", ".join([f"{k}={v}" for k, v in cls.FOCUS_LABELS.items()])
            raise ValidationError(
                'focus_level',
                f"Focus level must be between {cls.MIN_RATING} and {cls.MAX_RATING}. "
                f"Scale: {scale_desc}"
            )
    
    @classmethod
    def _validate_difficulty(cls, difficulty: Any) -> None:
        """Validate difficulty with scale explanation."""
        if not isinstance(difficulty, int):
            raise ValidationError(
                'difficulty',
                f"Difficulty must be a whole number (received: {type(difficulty).__name__})"
            )
        
        if difficulty < cls.MIN_RATING or difficulty > cls.MAX_RATING:
            scale_desc = ", ".join([f"{k}={v}" for k, v in cls.DIFFICULTY_LABELS.items()])
            raise ValidationError(
                'difficulty',
                f"Difficulty must be between {cls.MIN_RATING} and {cls.MAX_RATING}. "
                f"Scale: {scale_desc}"
            )


class DataSanitizer:
    """
    Utility class for cleaning and sanitizing input data.
    
    Design Decision: Separate sanitization from validation to make
    the code more modular and testable.
    """
    
    @staticmethod
    def sanitize_session_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Clean and sanitize session data before validation/storage.
        
        Args:
            data: Raw input data
            
        Returns:
            Sanitized data dictionary
        """
        sanitized = {}
        
        # Clean subject string
        if 'subject' in data and isinstance(data['subject'], str):
            sanitized['subject'] = data['subject'].strip()
        else:
            sanitized['subject'] = data.get('subject')
        
        # Ensure numeric fields are proper types
        for field in ['duration', 'focus_level', 'difficulty']:
            value = data.get(field)
            if value is not None:
                try:
                    # Convert to int if it's a valid number
                    if isinstance(value, (int, float)):
                        sanitized[field] = int(value)
                    elif isinstance(value, str) and value.isdigit():
                        sanitized[field] = int(value)
                    else:
                        sanitized[field] = value  # Keep original for validation error
                except (ValueError, TypeError):
                    sanitized[field] = value  # Keep original for validation error
            else:
                sanitized[field] = value
        
        return sanitized


class ResponseFormatter:
    """
    Utility class for formatting consistent API responses.
    
    Design Decision: Standardize response format across all endpoints
    to make the API more predictable and easier to consume.
    """
    
    @staticmethod
    def success_response(data: Dict[str, Any], status_code: int = 200, message: str = None) -> Tuple[Dict[str, Any], int]:
        """Format a successful API response."""
        response = {
            'success': True,
            **data
        }
        
        if message:
            response['message'] = message
            
        return response, status_code
    
    @staticmethod
    def error_response(error_message: str, status_code: int = 400, details: List[str] = None, hint: str = None) -> Tuple[Dict[str, Any], int]:
        """Format an error API response with helpful information."""
        response = {
            'success': False,
            'error': error_message
        }
        
        if details:
            response['validation_errors'] = details
            
        if hint:
            response['hint'] = hint
            
        return response, status_code
    
    @staticmethod
    def validation_error_response(validation_errors: List[str]) -> Tuple[Dict[str, Any], int]:
        """Format a validation error response."""
        return ResponseFormatter.error_response(
            error_message='Input validation failed',
            status_code=400,
            details=validation_errors,
            hint='Please check your input data and ensure all fields meet the requirements'
        )


def safe_datetime_parse(date_string: str) -> Optional[datetime]:
    """
    Safely parse datetime strings with multiple format support.
    
    Design Decision: Handle various datetime formats gracefully to
    accommodate different client implementations and data sources.
    
    Args:
        date_string: ISO format datetime string
        
    Returns:
        Parsed datetime object or None if parsing fails
    """
    if not date_string:
        return None
    
    # Common datetime formats to try
    formats = [
        '%Y-%m-%dT%H:%M:%S.%fZ',  # ISO with microseconds and Z
        '%Y-%m-%dT%H:%M:%SZ',     # ISO with Z
        '%Y-%m-%dT%H:%M:%S.%f',   # ISO with microseconds
        '%Y-%m-%dT%H:%M:%S',      # ISO basic
        '%Y-%m-%d %H:%M:%S',      # SQL datetime format
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_string, fmt)
        except ValueError:
            continue
    
    # Try fromisoformat as last resort (Python 3.7+)
    try:
        # Handle 'Z' timezone indicator
        if date_string.endswith('Z'):
            date_string = date_string[:-1] + '+00:00'
        return datetime.fromisoformat(date_string)
    except (ValueError, AttributeError):
        pass
    
    return None


def calculate_session_stats(sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate basic statistics from session data with error handling.
    
    Design Decision: Centralize common calculations to avoid duplication
    and ensure consistent statistical calculations across the application.
    
    Args:
        sessions: List of session dictionaries
        
    Returns:
        Dictionary with calculated statistics
    """
    if not sessions:
        return {
            'total_sessions': 0,
            'total_duration': 0,
            'average_duration': 0.0,
            'average_focus': 0.0,
            'average_difficulty': 0.0
        }
    
    try:
        total_duration = sum(s.get('duration', 0) for s in sessions)
        total_focus = sum(s.get('focus_level', 0) for s in sessions)
        total_difficulty = sum(s.get('difficulty', 0) for s in sessions)
        count = len(sessions)
        
        return {
            'total_sessions': count,
            'total_duration': total_duration,
            'average_duration': round(total_duration / count, 1) if count > 0 else 0.0,
            'average_focus': round(total_focus / count, 1) if count > 0 else 0.0,
            'average_difficulty': round(total_difficulty / count, 1) if count > 0 else 0.0
        }
    except (TypeError, ZeroDivisionError) as e:
        print(f"Error calculating session stats: {e}")
        return calculate_session_stats([])  # Return empty stats on error