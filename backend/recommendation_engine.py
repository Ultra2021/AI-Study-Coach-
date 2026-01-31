"""
Study Recommendation Engine

Generates adaptive study suggestions based on session analysis and patterns.
Provides personalized recommendations that update dynamically with new data.
"""

from typing import List, Dict, Any, Tuple
from collections import defaultdict, Counter
from datetime import datetime, timedelta
import random


class StudyRecommendationEngine:
    """
    Generates personalized study recommendations based on session data analysis.
    
    The engine analyzes patterns and provides adaptive suggestions for:
    - Session duration optimization
    - Break interval scheduling
    - Subject scheduling and ordering
    - Focus improvement strategies
    - Difficulty progression
    """
    
    def __init__(self):
        # Recommendation thresholds and parameters
        self.OPTIMAL_SESSION_RANGE = (25, 50)  # Minutes for optimal learning
        self.MAX_CONTINUOUS_STUDY = 120  # Minutes before mandatory break
        self.FOCUS_IMPROVEMENT_THRESHOLD = 3.0  # Focus scores below this need improvement
        self.DIFFICULT_SUBJECT_THRESHOLD = 4.0  # Difficulty rating for challenging subjects
        self.MIN_SESSIONS_FOR_PERSONALIZATION = 5  # Minimum sessions needed for personal recommendations
    
    def generate_recommendations(self, sessions: List[Dict[str, Any]], insights: List[str]) -> Dict[str, Any]:
        """
        Generate comprehensive study recommendations based on session data and insights.
        
        Args:
            sessions: List of session dictionaries
            insights: List of analysis insights
            
        Returns:
            Dictionary containing different types of recommendations
        """
        if not sessions:
            return self._get_beginner_recommendations()
        
        recommendations = {
            'session_structure': self._recommend_session_structure(sessions),
            'break_schedule': self._recommend_break_schedule(sessions),
            'subject_ordering': self._recommend_subject_ordering(sessions),
            'focus_strategies': self._recommend_focus_strategies(sessions, insights),
            'next_session': self._recommend_next_session(sessions),
            'weekly_plan': self._recommend_weekly_plan(sessions),
            'priority_actions': self._get_priority_actions(sessions, insights)
        }
        
        return recommendations
    
    def _get_beginner_recommendations(self) -> Dict[str, Any]:
        """Provide starter recommendations for users with no session history."""
        return {
            'session_structure': [
                "Start with 25-minute focused study sessions (Pomodoro technique)",
                "Begin with subjects you find most interesting to build momentum",
                "Set up a dedicated, distraction-free study space"
            ],
            'break_schedule': [
                "Take 5-minute breaks between 25-minute sessions",
                "Take a longer 15-30 minute break every 2 hours",
                "Use breaks for light movement, hydration, or fresh air"
            ],
            'subject_ordering': [
                "Study your most challenging subject when you're most alert",
                "Alternate between different types of subjects to maintain engagement",
                "End sessions with review or easier material for confidence"
            ],
            'focus_strategies': [
                "Remove distractions (phone, social media, unnecessary tabs)",
                "Use the '2-minute rule': if distracted, refocus within 2 minutes",
                "Try different study techniques to find what works for you"
            ],
            'next_session': [
                "Start with a 25-minute session on your most important subject",
                "Rate your focus and difficulty to begin building your study profile"
            ],
            'weekly_plan': [
                "Aim for 3-5 study sessions this week to establish a routine",
                "Try different times of day to find when you focus best",
                "Track which subjects and durations work best for you"
            ],
            'priority_actions': [
                "Log your first study session to start building personalized recommendations"
            ]
        }
    
    def _recommend_session_structure(self, sessions: List[Dict[str, Any]]) -> List[str]:
        """Generate recommendations for optimal session structure."""
        recommendations = []
        
        # Calculate average duration and focus
        avg_duration = sum(s['duration'] for s in sessions) / len(sessions)
        avg_focus_by_duration = self._analyze_focus_by_duration(sessions)
        
        # Duration recommendations
        if avg_duration < 20:
            recommendations.append(
                f"Your sessions average {avg_duration:.0f} minutes, which is quite short. "
                "Try gradually increasing to 25-30 minutes for better learning retention."
            )
        elif avg_duration > 90:
            recommendations.append(
                f"Your sessions average {avg_duration:.0f} minutes, which might be too long. "
                "Consider breaking them into 45-60 minute chunks with breaks to maintain focus."
            )
        
        # Find optimal duration based on focus data
        if avg_focus_by_duration:
            best_duration_range = max(avg_focus_by_duration.items(), key=lambda x: x[1])
            if best_duration_range[1] > 3.5:  # Good focus score
                recommendations.append(
                    f"You focus best during {best_duration_range[0]} minute sessions "
                    f"(average focus: {best_duration_range[1]:.1f}/5). "
                    "Consider structuring more sessions in this duration range."
                )
        
        # Long session warnings
        long_sessions = [s for s in sessions if s['duration'] > 120]
        if long_sessions:
            avg_long_focus = sum(s['focus_level'] for s in long_sessions) / len(long_sessions)
            if avg_long_focus < 3.0:
                recommendations.append(
                    "Your focus drops significantly during long sessions. "
                    "Break study marathons into 45-60 minute blocks with 10-15 minute breaks."
                )
        
        return recommendations
    
    def _recommend_break_schedule(self, sessions: List[Dict[str, Any]]) -> List[str]:
        """Generate personalized break schedule recommendations."""
        recommendations = []
        
        # Analyze focus decline patterns
        focus_decline_sessions = [s for s in sessions if s['duration'] > 60 and s['focus_level'] <= 2]
        
        if focus_decline_sessions:
            avg_decline_duration = sum(s['duration'] for s in focus_decline_sessions) / len(focus_decline_sessions)
            recommended_interval = max(25, int(avg_decline_duration * 0.6))
            
            recommendations.append(
                f"Based on your focus patterns, take a 5-minute break every {recommended_interval} minutes "
                f"during longer study sessions to maintain concentration."
            )
        
        # General break recommendations based on session patterns
        high_focus_sessions = [s for s in sessions if s['focus_level'] >= 4]
        if high_focus_sessions:
            avg_high_focus_duration = sum(s['duration'] for s in high_focus_sessions) / len(high_focus_sessions)
            recommendations.append(
                f"You maintain excellent focus for about {avg_high_focus_duration:.0f} minutes. "
                f"Use this as your target session length before taking breaks."
            )
        
        # Difficulty-based break recommendations
        high_difficulty_sessions = [s for s in sessions if s['difficulty'] >= 4]
        if high_difficulty_sessions:
            recommendations.append(
                "For challenging subjects, take slightly longer breaks (7-10 minutes) "
                "to allow your brain to process complex information."
            )
        
        return recommendations
    
    def _recommend_subject_ordering(self, sessions: List[Dict[str, Any]]) -> List[str]:
        """Generate recommendations for optimal subject ordering."""
        recommendations = []
        
        # Group sessions by subject
        subject_stats = self._calculate_subject_stats(sessions)
        
        if len(subject_stats) < 2:
            return ["Try studying multiple subjects to get personalized ordering recommendations."]
        
        # Find best and worst performing subjects
        subjects_by_focus = sorted(subject_stats.items(), key=lambda x: x[1]['avg_focus'], reverse=True)
        subjects_by_difficulty = sorted(subject_stats.items(), key=lambda x: x[1]['avg_difficulty'], reverse=True)
        
        best_focus_subject = subjects_by_focus[0][0]
        worst_focus_subject = subjects_by_focus[-1][0]
        hardest_subject = subjects_by_difficulty[0][0]
        
        # Ordering recommendations
        recommendations.append(
            f"Start sessions with {hardest_subject} when your mental energy is highest, "
            f"as it's your most challenging subject (difficulty: {subject_stats[hardest_subject]['avg_difficulty']:.1f}/5)."
        )
        
        if worst_focus_subject != hardest_subject:
            recommendations.append(
                f"Schedule {worst_focus_subject} after easier subjects to build momentum, "
                f"since you have focus challenges with this subject (focus: {subject_stats[worst_focus_subject]['avg_focus']:.1f}/5)."
            )
        
        recommendations.append(
            f"Use {best_focus_subject} as a 'confidence builder' - you perform well in this subject "
            f"(focus: {subject_stats[best_focus_subject]['avg_focus']:.1f}/5). "
            "Schedule it when you need motivation or after difficult sessions."
        )
        
        # Time allocation recommendations
        underrepresented_subjects = [
            subject for subject, stats in subject_stats.items()
            if stats['total_time'] < (sum(s['total_time'] for s in subject_stats.values()) / len(subject_stats)) * 0.7
        ]
        
        if underrepresented_subjects:
            recommendations.append(
                f"Consider spending more time on: {', '.join(underrepresented_subjects)}. "
                "These subjects are getting less attention in your study routine."
            )
        
        return recommendations
    
    def _recommend_focus_strategies(self, sessions: List[Dict[str, Any]], insights: List[str]) -> List[str]:
        """Generate personalized focus improvement strategies."""
        recommendations = []
        
        avg_focus = sum(s['focus_level'] for s in sessions) / len(sessions)
        low_focus_sessions = [s for s in sessions if s['focus_level'] <= 2]
        
        # General focus improvement
        if avg_focus < self.FOCUS_IMPROVEMENT_THRESHOLD:
            recommendations.append(
                f"Your average focus is {avg_focus:.1f}/5. Try the '5-minute focus rule': "
                "commit to just 5 focused minutes, then assess if you can continue."
            )
        
        # Pattern-specific recommendations
        if low_focus_sessions:
            # Analyze common factors in low focus sessions
            long_low_focus = [s for s in low_focus_sessions if s['duration'] > 60]
            if long_low_focus:
                recommendations.append(
                    "You lose focus during longer sessions. Try the Pomodoro technique: "
                    "25 minutes focused work, 5 minute break, repeat."
                )
            
            # Subject-specific focus issues
            low_focus_subjects = Counter(s['subject'] for s in low_focus_sessions)
            if low_focus_subjects:
                most_problematic = low_focus_subjects.most_common(1)[0][0]
                recommendations.append(
                    f"You have particular focus challenges with {most_problematic}. "
                    "Try changing your approach: use different study materials, "
                    "find a study partner, or break the subject into smaller topics."
                )
        
        # Positive reinforcement for good patterns
        high_focus_sessions = [s for s in sessions if s['focus_level'] >= 4]
        if high_focus_sessions:
            focus_conditions = self._analyze_high_focus_conditions(high_focus_sessions)
            recommendations.append(
                f"You achieve high focus {len(high_focus_sessions)} times out of {len(sessions)} sessions. "
                f"Replicate the conditions that work: {focus_conditions}"
            )
        
        return recommendations
    
    def _recommend_next_session(self, sessions: List[Dict[str, Any]]) -> List[str]:
        """Generate recommendations for the next study session."""
        recommendations = []
        
        # Get recent session data
        recent_sessions = sorted(sessions, key=lambda x: x['timestamp'], reverse=True)[:3]
        
        if recent_sessions:
            last_session = recent_sessions[0]
            
            # Follow-up based on last session performance
            if last_session['focus_level'] <= 2:
                recommendations.append(
                    f"Your last session with {last_session['subject']} had low focus. "
                    "For your next session, try a different environment or shorter duration (20-30 minutes)."
                )
            elif last_session['focus_level'] >= 4:
                recommendations.append(
                    f"Great focus in your last {last_session['subject']} session! "
                    f"Try extending to {min(last_session['duration'] + 15, 60)} minutes next time."
                )
            
            # Subject rotation recommendations
            recent_subjects = [s['subject'] for s in recent_sessions]
            subject_stats = self._calculate_subject_stats(sessions)
            
            # Suggest least recently studied subject
            all_subjects = set(subject_stats.keys())
            understudied_subjects = all_subjects - set(recent_subjects)
            
            if understudied_subjects:
                next_subject = min(understudied_subjects, 
                                 key=lambda s: subject_stats[s]['last_studied'])
                recommendations.append(
                    f"Consider studying {next_subject} next - you haven't worked on it recently."
                )
        
        # Time-based recommendations
        now = datetime.now()
        hour = now.hour
        
        if 9 <= hour <= 11:
            recommendations.append(
                "Morning sessions are great for challenging subjects when mental energy is high."
            )
        elif 14 <= hour <= 16:
            recommendations.append(
                "Afternoon is good for review sessions or subjects requiring steady focus."
            )
        elif hour >= 19:
            recommendations.append(
                "Evening sessions work well for lighter review or subjects you enjoy most."
            )
        
        return recommendations
    
    def _recommend_weekly_plan(self, sessions: List[Dict[str, Any]]) -> List[str]:
        """Generate weekly study plan recommendations."""
        recommendations = []
        
        if len(sessions) < 7:
            recommendations.append(
                f"You've completed {len(sessions)} sessions. Aim for 5-7 sessions per week "
                "for consistent progress. Quality over quantity!"
            )
            return recommendations
        
        # Analyze weekly patterns
        subject_stats = self._calculate_subject_stats(sessions)
        total_weekly_time = sum(s['total_time'] for s in subject_stats.values())
        
        # Weekly time distribution
        if total_weekly_time < 300:  # Less than 5 hours per week
            recommendations.append(
                f"Your weekly study time is {total_weekly_time} minutes. "
                "Consider aiming for 6-8 hours (360-480 minutes) per week for better progress."
            )
        
        # Subject balance recommendations
        if len(subject_stats) > 1:
            time_distribution = {s: stats['total_time']/total_weekly_time for s, stats in subject_stats.items()}
            dominant_subject = max(time_distribution, key=time_distribution.get)
            
            if time_distribution[dominant_subject] > 0.6:  # More than 60% on one subject
                recommendations.append(
                    f"You spend {time_distribution[dominant_subject]*100:.0f}% of study time on {dominant_subject}. "
                    "Consider more balanced distribution across subjects for better overall learning."
                )
        
        return recommendations
    
    def _get_priority_actions(self, sessions: List[Dict[str, Any]], insights: List[str]) -> List[str]:
        """Generate top priority actions based on current patterns."""
        actions = []
        
        # Analyze critical issues from insights
        critical_keywords = ['consistently struggle', 'low focus', 'poor', 'trouble', 'declined']
        urgent_insights = [insight for insight in insights if any(keyword in insight.lower() for keyword in critical_keywords)]
        
        if urgent_insights:
            # Extract actionable advice from critical insights
            if any('focus' in insight.lower() for insight in urgent_insights):
                actions.append("PRIORITY: Address focus issues with environment changes or shorter sessions")
            
            if any('long' in insight.lower() and 'low focus' in insight.lower() for insight in urgent_insights):
                actions.append("PRIORITY: Break long sessions into smaller chunks with breaks")
        
        # Performance-based priorities
        avg_focus = sum(s['focus_level'] for s in sessions) / len(sessions)
        if avg_focus < 2.5:
            actions.append("PRIORITY: Focus improvement is critical - try new study environment or techniques")
        
        # Subject-specific priorities
        subject_stats = self._calculate_subject_stats(sessions)
        problematic_subjects = [
            subject for subject, stats in subject_stats.items()
            if stats['avg_focus'] < 2.5 and stats['session_count'] >= 3
        ]
        
        if problematic_subjects:
            actions.append(f"PRIORITY: Develop new strategy for {problematic_subjects[0]} - consider tutoring or different resources")
        
        # Positive momentum actions
        if avg_focus > 3.5:
            actions.append("BUILD ON SUCCESS: Your focus is strong - consider tackling more challenging material")
        
        return actions[:3]  # Return top 3 priorities
    
    # Helper methods
    
    def _analyze_focus_by_duration(self, sessions: List[Dict[str, Any]]) -> Dict[str, float]:
        """Analyze average focus by duration ranges."""
        duration_groups = {
            "15-30": [],
            "30-45": [],
            "45-60": [],
            "60-90": [],
            "90+": []
        }
        
        for session in sessions:
            duration = session['duration']
            focus = session['focus_level']
            
            if 15 <= duration < 30:
                duration_groups["15-30"].append(focus)
            elif 30 <= duration < 45:
                duration_groups["30-45"].append(focus)
            elif 45 <= duration < 60:
                duration_groups["45-60"].append(focus)
            elif 60 <= duration < 90:
                duration_groups["60-90"].append(focus)
            else:
                duration_groups["90+"].append(focus)
        
        return {
            duration_range: sum(focus_scores) / len(focus_scores)
            for duration_range, focus_scores in duration_groups.items()
            if focus_scores
        }
    
    def _calculate_subject_stats(self, sessions: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """Calculate comprehensive statistics for each subject."""
        subject_data = defaultdict(list)
        for session in sessions:
            subject_data[session['subject']].append(session)
        
        subject_stats = {}
        for subject, subject_sessions in subject_data.items():
            stats = {
                'session_count': len(subject_sessions),
                'total_time': sum(s['duration'] for s in subject_sessions),
                'avg_duration': sum(s['duration'] for s in subject_sessions) / len(subject_sessions),
                'avg_focus': sum(s['focus_level'] for s in subject_sessions) / len(subject_sessions),
                'avg_difficulty': sum(s['difficulty'] for s in subject_sessions) / len(subject_sessions),
                'last_studied': max(s['timestamp'] for s in subject_sessions)
            }
            subject_stats[subject] = stats
        
        return subject_stats
    
    def _analyze_high_focus_conditions(self, high_focus_sessions: List[Dict[str, Any]]) -> str:
        """Analyze common conditions in high focus sessions."""
        avg_duration = sum(s['duration'] for s in high_focus_sessions) / len(high_focus_sessions)
        common_subjects = Counter(s['subject'] for s in high_focus_sessions)
        
        conditions = []
        conditions.append(f"sessions around {avg_duration:.0f} minutes")
        
        if common_subjects:
            top_subject = common_subjects.most_common(1)[0][0]
            conditions.append(f"especially when studying {top_subject}")
        
        return ", ".join(conditions)


def get_study_recommendations(sessions_data: List[Dict[str, Any]], insights: List[str]) -> Dict[str, Any]:
    """
    Convenience function to generate study recommendations.
    
    Args:
        sessions_data: List of session dictionaries
        insights: List of analysis insights
        
    Returns:
        Dictionary containing all recommendation categories
    """
    engine = StudyRecommendationEngine()
    recommendations = engine.generate_recommendations(sessions_data, insights)
    
    return {
        'recommendations': recommendations,
        'generated_at': datetime.now().isoformat(),
        'based_on_sessions': len(sessions_data)
    }