"""
Study Session Analysis Module

Analyzes study session data to identify patterns and provide insights.
Uses rule-based logic to detect issues and generate actionable recommendations.
"""

from collections import defaultdict
from datetime import datetime, timedelta
from typing import List, Dict, Any


class StudyAnalyzer:
    """
    Analyzes study session data to identify patterns and generate insights.
    
    This class uses rule-based analysis to detect:
    - Sessions with poor focus vs duration ratios
    - Subjects with consistently low performance
    - Study duration patterns
    - Focus and difficulty trends
    """
    
    def __init__(self):
        # Thresholds for analysis (configurable)
        self.LOW_FOCUS_THRESHOLD = 2  # Focus levels 1-2 considered low
        self.LONG_SESSION_THRESHOLD = 90  # Minutes - sessions longer than this are "long"
        self.SHORT_SESSION_THRESHOLD = 15  # Minutes - sessions shorter than this are "short"
        self.HIGH_DIFFICULTY_THRESHOLD = 4  # Difficulty levels 4-5 considered high
        self.MIN_SESSIONS_FOR_PATTERN = 3  # Minimum sessions needed to identify a pattern
    
    def analyze_sessions(self, sessions: List[Dict[str, Any]]) -> List[str]:
        """
        Analyze study sessions and return insights in plain English.
        
        Args:
            sessions: List of session dictionaries with keys:
                     id, subject, duration, focus_level, difficulty, timestamp
        
        Returns:
            List of insight strings in plain English
        """
        if not sessions:
            return ["No study sessions found to analyze."]
        
        insights = []
        
        # Basic statistics
        insights.extend(self._analyze_basic_stats(sessions))
        
        # Duration and focus patterns
        insights.extend(self._analyze_duration_focus_patterns(sessions))
        
        # Subject-specific analysis
        insights.extend(self._analyze_subject_patterns(sessions))
        
        # Difficulty analysis
        insights.extend(self._analyze_difficulty_patterns(sessions))
        
        # Time patterns (if timestamps available)
        insights.extend(self._analyze_time_patterns(sessions))
        
        return insights if insights else ["Your study sessions look balanced. Keep up the good work!"]
    
    def _analyze_basic_stats(self, sessions: List[Dict[str, Any]]) -> List[str]:
        """Analyze basic session statistics."""
        insights = []
        
        total_sessions = len(sessions)
        total_duration = sum(session['duration'] for session in sessions)
        avg_duration = total_duration / total_sessions
        avg_focus = sum(session['focus_level'] for session in sessions) / total_sessions
        avg_difficulty = sum(session['difficulty'] for session in sessions) / total_sessions
        
        # Average session length insights
        if avg_duration < self.SHORT_SESSION_THRESHOLD:
            insights.append(f"Your average study session is {avg_duration:.1f} minutes, which is quite short. "
                          "Consider extending sessions to 30-45 minutes for better learning retention.")
        elif avg_duration > 120:  # 2 hours
            insights.append(f"Your average study session is {avg_duration:.1f} minutes, which is quite long. "
                          "Consider taking regular breaks to maintain focus and prevent burnout.")
        else:
            insights.append(f"Your average study session length of {avg_duration:.1f} minutes is in a good range.")
        
        # Overall focus insights
        if avg_focus < 2.5:
            insights.append("Your overall focus level is below average. Consider studying in a quieter environment "
                          "or reducing distractions during study sessions.")
        elif avg_focus > 4.0:
            insights.append("Excellent! You maintain high focus levels across your study sessions.")
        
        # Overall difficulty insights
        if avg_difficulty < 2.0:
            insights.append("You tend to study easier material. Consider challenging yourself with more difficult topics "
                          "to accelerate your learning.")
        elif avg_difficulty > 4.0:
            insights.append("You're consistently tackling challenging material. Make sure to balance this with "
                          "review of fundamentals to solidify your understanding.")
        
        return insights
    
    def _analyze_duration_focus_patterns(self, sessions: List[Dict[str, Any]]) -> List[str]:
        """Analyze patterns between session duration and focus levels."""
        insights = []
        
        # Find long sessions with low focus
        problematic_sessions = []
        efficient_long_sessions = []
        
        for session in sessions:
            if session['duration'] >= self.LONG_SESSION_THRESHOLD:
                if session['focus_level'] <= self.LOW_FOCUS_THRESHOLD:
                    problematic_sessions.append(session)
                elif session['focus_level'] >= 4:
                    efficient_long_sessions.append(session)
        
        if problematic_sessions:
            subjects = [session['subject'] for session in problematic_sessions]
            unique_subjects = list(set(subjects))
            
            if len(problematic_sessions) == 1:
                insights.append(f"You had a long study session ({problematic_sessions[0]['duration']} minutes) "
                              f"with low focus in {problematic_sessions[0]['subject']}. "
                              "Consider breaking long sessions into shorter chunks with breaks.")
            else:
                insights.append(f"You've had {len(problematic_sessions)} long study sessions with low focus. "
                              f"This happened most in: {', '.join(unique_subjects[:3])}. "
                              "Try the Pomodoro technique (25-minute focused sessions with 5-minute breaks).")
        
        if efficient_long_sessions:
            insights.append(f"Great job! You maintained high focus during {len(efficient_long_sessions)} "
                          "long study sessions. This shows excellent concentration skills.")
        
        return insights
    
    def _analyze_subject_patterns(self, sessions: List[Dict[str, Any]]) -> List[str]:
        """Analyze patterns specific to different subjects."""
        insights = []
        
        # Group sessions by subject
        subject_data = defaultdict(list)
        for session in sessions:
            subject_data[session['subject']].append(session)
        
        # Analyze each subject with enough data
        for subject, subject_sessions in subject_data.items():
            if len(subject_sessions) < self.MIN_SESSIONS_FOR_PATTERN:
                continue
            
            avg_focus = sum(s['focus_level'] for s in subject_sessions) / len(subject_sessions)
            avg_difficulty = sum(s['difficulty'] for s in subject_sessions) / len(subject_sessions)
            avg_duration = sum(s['duration'] for s in subject_sessions) / len(subject_sessions)
            
            # Low focus subjects
            if avg_focus <= self.LOW_FOCUS_THRESHOLD:
                insights.append(f"You consistently struggle with focus in {subject} "
                              f"(average focus: {avg_focus:.1f}/5). "
                              "Try changing your study environment or approach for this subject.")
            
            # High difficulty with low focus
            if avg_difficulty >= self.HIGH_DIFFICULTY_THRESHOLD and avg_focus <= 2.5:
                insights.append(f"{subject} seems challenging for you (difficulty: {avg_difficulty:.1f}/5) "
                              f"and you have trouble focusing on it (focus: {avg_focus:.1f}/5). "
                              "Consider getting additional help or breaking this subject into smaller topics.")
            
            # Very short sessions for difficult subjects
            if avg_difficulty >= 4 and avg_duration < 30:
                insights.append(f"You spend relatively little time on {subject} despite its high difficulty "
                              f"({avg_duration:.1f} minutes average). "
                              "Consider dedicating more time to challenging subjects.")
        
        # Find best and worst subjects
        if len(subject_data) > 1:
            subject_focus_scores = {
                subject: sum(s['focus_level'] for s in sessions) / len(sessions)
                for subject, sessions in subject_data.items()
                if len(sessions) >= 2
            }
            
            if subject_focus_scores:
                best_subject = max(subject_focus_scores, key=subject_focus_scores.get)
                worst_subject = min(subject_focus_scores, key=subject_focus_scores.get)
                
                if subject_focus_scores[best_subject] - subject_focus_scores[worst_subject] > 1.0:
                    insights.append(f"You focus best when studying {best_subject} "
                                  f"({subject_focus_scores[best_subject]:.1f}/5) and have most trouble "
                                  f"with {worst_subject} ({subject_focus_scores[worst_subject]:.1f}/5). "
                                  "Try applying successful strategies from your best subject to others.")
        
        return insights
    
    def _analyze_difficulty_patterns(self, sessions: List[Dict[str, Any]]) -> List[str]:
        """Analyze patterns related to difficulty levels."""
        insights = []
        
        # Group by difficulty level
        difficulty_groups = defaultdict(list)
        for session in sessions:
            difficulty_groups[session['difficulty']].append(session)
        
        # Analyze focus vs difficulty relationship
        difficulty_focus_avg = {}
        for difficulty, sessions_group in difficulty_groups.items():
            if sessions_group:
                difficulty_focus_avg[difficulty] = sum(s['focus_level'] for s in sessions_group) / len(sessions_group)
        
        # Check if focus decreases with difficulty (expected pattern)
        difficulties = sorted(difficulty_focus_avg.keys())
        if len(difficulties) >= 3:
            focus_values = [difficulty_focus_avg[d] for d in difficulties]
            
            # Check if focus generally decreases with difficulty
            decreasing_trend = all(focus_values[i] >= focus_values[i+1] - 0.5 for i in range(len(focus_values)-1))
            
            if not decreasing_trend:
                # Find if easier material has lower focus (unusual pattern)
                if difficulties[0] in [1, 2] and difficulty_focus_avg[difficulties[0]] < 3.0:
                    insights.append("Interestingly, you have lower focus on easier material. "
                                  "You might find easy topics boring - try mixing in more challenging content "
                                  "to maintain engagement.")
        
        # Check for high difficulty with high focus (good pattern)
        high_diff_high_focus = [s for s in sessions if s['difficulty'] >= 4 and s['focus_level'] >= 4]
        if len(high_diff_high_focus) >= 2:
            insights.append(f"Excellent! You maintain high focus even on difficult material "
                          f"in {len(high_diff_high_focus)} sessions. This is a sign of strong study discipline.")
        
        return insights
    
    def _analyze_time_patterns(self, sessions: List[Dict[str, Any]]) -> List[str]:
        """Analyze time-based patterns in study sessions."""
        insights = []
        
        # Check if sessions have timestamp data
        sessions_with_time = [s for s in sessions if 'timestamp' in s and s['timestamp']]
        if len(sessions_with_time) < 3:
            return insights
        
        try:
            # Parse timestamps and analyze patterns
            for session in sessions_with_time:
                if isinstance(session['timestamp'], str):
                    session['parsed_time'] = datetime.fromisoformat(session['timestamp'].replace('Z', '+00:00'))
                else:
                    session['parsed_time'] = session['timestamp']
            
            # Find sessions within last 7 days
            now = datetime.now()
            recent_sessions = [
                s for s in sessions_with_time 
                if (now - s['parsed_time']).days <= 7
            ]
            
            if len(recent_sessions) >= 3:
                avg_recent_focus = sum(s['focus_level'] for s in recent_sessions) / len(recent_sessions)
                avg_all_focus = sum(s['focus_level'] for s in sessions) / len(sessions)
                
                if avg_recent_focus > avg_all_focus + 0.5:
                    insights.append("Your focus has been improving recently! "
                                  f"Recent sessions average {avg_recent_focus:.1f}/5 focus, "
                                  f"compared to {avg_all_focus:.1f}/5 overall.")
                elif avg_recent_focus < avg_all_focus - 0.5:
                    insights.append("Your focus has declined in recent sessions. "
                                  "Consider taking a break or adjusting your study environment.")
            
        except (ValueError, TypeError, KeyError):
            # Skip time analysis if timestamp parsing fails
            pass
        
        return insights
    
    def get_quick_summary(self, sessions: List[Dict[str, Any]]) -> str:
        """
        Generate a quick one-sentence summary of study patterns.
        
        Args:
            sessions: List of session dictionaries
            
        Returns:
            Single summary string
        """
        if not sessions:
            return "No study sessions to analyze."
        
        total_time = sum(s['duration'] for s in sessions)
        avg_focus = sum(s['focus_level'] for s in sessions) / len(sessions)
        
        if avg_focus >= 4.0:
            performance = "excellent focus"
        elif avg_focus >= 3.0:
            performance = "good focus"
        else:
            performance = "room for focus improvement"
        
        return (f"You've completed {len(sessions)} study sessions totaling "
                f"{total_time} minutes with {performance} (avg: {avg_focus:.1f}/5).")


def analyze_study_data(sessions_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Convenience function to analyze study session data.
    
    Args:
        sessions_data: List of session dictionaries
        
    Returns:
        Dictionary containing insights and summary
    """
    analyzer = StudyAnalyzer()
    
    return {
        'insights': analyzer.analyze_sessions(sessions_data),
        'summary': analyzer.get_quick_summary(sessions_data),
        'total_sessions': len(sessions_data),
        'analysis_timestamp': datetime.now().isoformat()
    }