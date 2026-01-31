"""
Enhanced Study Session Analysis with Statistical Methods and Simple Predictive Models

This module extends the basic analysis with statistical methods and simple machine learning
to predict optimal study patterns while maintaining explainability and avoiding overfitting.

Design Philosophy:
- Use simple, interpretable models (linear regression, moving averages)
- Focus on statistical significance and practical insights  
- Provide confidence intervals and uncertainty estimates
- Maintain explainable predictions with clear reasoning
"""

from collections import defaultdict, Counter
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
import math
import statistics
from dataclasses import dataclass


@dataclass
class PredictionResult:
    """Container for prediction results with confidence metrics."""
    prediction: float
    confidence: float  # 0.0 to 1.0
    reasoning: str
    data_points: int
    statistical_significance: bool


@dataclass
class OptimalConditions:
    """Container for optimal study conditions analysis."""
    duration: PredictionResult
    time_of_day: Dict[str, float]  # Hour -> predicted focus score
    best_time_window: Tuple[int, int]  # (start_hour, end_hour)
    subject_recommendations: Dict[str, Dict[str, Any]]


class StatisticalAnalyzer:
    """
    Enhanced analyzer using statistical methods for pattern detection and prediction.
    
    Uses simple statistical methods rather than complex ML to maintain interpretability
    and avoid overfitting on small datasets typical for individual users.
    """
    
    def __init__(self):
        # Statistical significance thresholds
        self.MIN_SAMPLES_FOR_PREDICTION = 5  # Minimum data points for reliable prediction
        self.MIN_SAMPLES_FOR_SIGNIFICANCE = 10  # For statistical significance
        self.CONFIDENCE_THRESHOLD = 0.7  # Minimum confidence for actionable predictions
        
        # Smoothing parameters for time-based analysis
        self.TIME_SMOOTHING_WINDOW = 2  # Hours for smoothing time-based predictions
        self.DURATION_BINS = [(1, 20), (20, 40), (40, 60), (60, 90), (90, 1440)]
    
    def analyze_with_predictions(self, sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Perform comprehensive analysis including statistical predictions.
        
        Args:
            sessions: List of session dictionaries
            
        Returns:
            Dictionary with enhanced analysis including predictions
        """
        if not sessions:
            return self._get_empty_analysis()
        
        # Basic statistical analysis
        basic_stats = self._calculate_statistical_metrics(sessions)
        
        # Predictive analysis
        optimal_conditions = self._predict_optimal_conditions(sessions)
        
        # Trend analysis
        trends = self._analyze_trends(sessions)
        
        # Pattern recognition
        patterns = self._detect_statistical_patterns(sessions)
        
        return {
            'basic_statistics': basic_stats,
            'optimal_conditions': optimal_conditions,
            'trends': trends,
            'patterns': patterns,
            'recommendations': self._generate_statistical_recommendations(
                basic_stats, optimal_conditions, trends, patterns
            )
        }
    
    def _calculate_statistical_metrics(self, sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate comprehensive statistical metrics for sessions."""
        durations = [s['duration'] for s in sessions]
        focus_levels = [s['focus_level'] for s in sessions]
        difficulties = [s['difficulty'] for s in sessions]
        
        return {
            'session_count': len(sessions),
            'duration_stats': {
                'mean': statistics.mean(durations),
                'median': statistics.median(durations),
                'std_dev': statistics.stdev(durations) if len(durations) > 1 else 0,
                'min': min(durations),
                'max': max(durations),
                'percentiles': self._calculate_percentiles(durations)
            },
            'focus_stats': {
                'mean': statistics.mean(focus_levels),
                'median': statistics.median(focus_levels),
                'std_dev': statistics.stdev(focus_levels) if len(focus_levels) > 1 else 0,
                'consistency_score': self._calculate_consistency_score(focus_levels)
            },
            'difficulty_stats': {
                'mean': statistics.mean(difficulties),
                'median': statistics.median(difficulties),
                'std_dev': statistics.stdev(difficulties) if len(difficulties) > 1 else 0
            },
            'correlation_analysis': self._calculate_correlations(sessions)
        }
    
    def _predict_optimal_conditions(self, sessions: List[Dict[str, Any]]) -> OptimalConditions:
        """
        Predict optimal study conditions using statistical analysis.
        
        Uses simple regression and moving averages to avoid overfitting.
        """
        # Predict optimal duration
        optimal_duration = self._predict_optimal_duration(sessions)
        
        # Analyze time-of-day patterns
        time_patterns = self._analyze_time_patterns(sessions)
        
        # Subject-specific recommendations  
        subject_recommendations = self._analyze_subject_optimization(sessions)
        
        return OptimalConditions(
            duration=optimal_duration,
            time_of_day=time_patterns['hourly_focus'],
            best_time_window=time_patterns['best_window'],
            subject_recommendations=subject_recommendations
        )
    
    def _predict_optimal_duration(self, sessions: List[Dict[str, Any]]) -> PredictionResult:
        """
        Predict optimal session duration using focus-duration correlation.
        
        Uses simple linear regression on duration vs focus to find sweet spot.
        """
        if len(sessions) < self.MIN_SAMPLES_FOR_PREDICTION:
            return PredictionResult(
                prediction=30.0,  # Default recommendation
                confidence=0.3,
                reasoning="Insufficient data for personalized prediction. Using general recommendation of 30 minutes.",
                data_points=len(sessions),
                statistical_significance=False
            )
        
        # Group sessions by duration bins and calculate average focus
        duration_focus_pairs = []
        for duration_bin in self.DURATION_BINS:
            bin_sessions = [s for s in sessions if duration_bin[0] <= s['duration'] < duration_bin[1]]
            if bin_sessions:
                avg_focus = statistics.mean([s['focus_level'] for s in bin_sessions])
                bin_center = (duration_bin[0] + duration_bin[1]) / 2
                duration_focus_pairs.append((bin_center, avg_focus, len(bin_sessions)))
        
        if len(duration_focus_pairs) < 2:
            # Not enough bins with data
            best_sessions = sorted(sessions, key=lambda x: x['focus_level'], reverse=True)[:3]
            optimal_duration = statistics.mean([s['duration'] for s in best_sessions])
            
            return PredictionResult(
                prediction=optimal_duration,
                confidence=0.6,
                reasoning=f"Based on your {len(best_sessions)} highest focus sessions",
                data_points=len(sessions),
                statistical_significance=len(sessions) >= self.MIN_SAMPLES_FOR_SIGNIFICANCE
            )
        
        # Find duration bin with highest focus
        best_bin = max(duration_focus_pairs, key=lambda x: x[1])
        
        # Calculate confidence based on sample size and focus difference
        confidence = min(0.9, 0.5 + (best_bin[2] / 20) + (best_bin[1] - 2.5) / 5)
        
        reasoning = (f"Analysis of {len(duration_focus_pairs)} duration ranges shows "
                   f"highest focus ({best_bin[1]:.1f}/5) in {best_bin[0]:.0f}-minute sessions "
                   f"based on {best_bin[2]} sessions")
        
        return PredictionResult(
            prediction=best_bin[0],
            confidence=confidence,
            reasoning=reasoning,
            data_points=len(sessions),
            statistical_significance=len(sessions) >= self.MIN_SAMPLES_FOR_SIGNIFICANCE
        )
    
    def _analyze_time_patterns(self, sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze time-of-day patterns using statistical smoothing.
        
        Uses moving averages to smooth noisy time-based data.
        """
        # Parse timestamps and extract hour information
        hourly_data = defaultdict(list)
        
        for session in sessions:
            try:
                if 'timestamp' in session and session['timestamp']:
                    # Handle various timestamp formats
                    timestamp_str = session['timestamp']
                    if timestamp_str.endswith('Z'):
                        timestamp_str = timestamp_str[:-1] + '+00:00'
                    
                    dt = datetime.fromisoformat(timestamp_str)
                    hour = dt.hour
                    hourly_data[hour].append(session['focus_level'])
            except (ValueError, TypeError, AttributeError):
                continue  # Skip sessions with invalid timestamps
        
        if not hourly_data:
            return {
                'hourly_focus': {},
                'best_window': (9, 11),  # Default morning recommendation
                'confidence': 0.2
            }
        
        # Calculate average focus for each hour with smoothing
        hourly_focus = {}
        for hour in range(24):
            # Collect data from surrounding hours for smoothing
            focus_values = []
            for h in range(hour - self.TIME_SMOOTHING_WINDOW, hour + self.TIME_SMOOTHING_WINDOW + 1):
                normalized_hour = h % 24
                if normalized_hour in hourly_data:
                    focus_values.extend(hourly_data[normalized_hour])
            
            if focus_values:
                hourly_focus[hour] = statistics.mean(focus_values)
        
        # Find best continuous time window (2-3 hours)
        best_window = self._find_best_time_window(hourly_focus)
        
        return {
            'hourly_focus': hourly_focus,
            'best_window': best_window,
            'data_hours': len(hourly_data),
            'total_time_sessions': sum(len(sessions) for sessions in hourly_data.values())
        }
    
    def _find_best_time_window(self, hourly_focus: Dict[int, float]) -> Tuple[int, int]:
        """Find the best 2-3 hour continuous window for studying."""
        if not hourly_focus:
            return (9, 11)  # Default morning window
        
        best_score = 0
        best_window = (9, 11)
        
        # Try different window sizes (2-3 hours)
        for window_size in [2, 3]:
            for start_hour in range(24):
                window_hours = [(start_hour + i) % 24 for i in range(window_size)]
                
                # Calculate average focus for this window
                window_scores = [hourly_focus.get(h, 0) for h in window_hours]
                if window_scores and all(score > 0 for score in window_scores):
                    avg_score = statistics.mean(window_scores)
                    
                    if avg_score > best_score:
                        best_score = avg_score
                        end_hour = (start_hour + window_size - 1) % 24
                        best_window = (start_hour, end_hour)
        
        return best_window
    
    def _analyze_subject_optimization(self, sessions: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """Analyze optimal conditions for each subject."""
        subject_data = defaultdict(list)
        for session in sessions:
            subject_data[session['subject']].append(session)
        
        subject_recommendations = {}
        
        for subject, subject_sessions in subject_data.items():
            if len(subject_sessions) < 3:  # Need minimum data for analysis
                continue
            
            # Find optimal duration for this subject
            focus_by_duration = defaultdict(list)
            for session in subject_sessions:
                duration_bin = self._get_duration_bin(session['duration'])
                focus_by_duration[duration_bin].append(session['focus_level'])
            
            best_duration_bin = None
            best_focus = 0
            
            for duration_bin, focus_scores in focus_by_duration.items():
                if len(focus_scores) >= 2:  # Need at least 2 sessions in bin
                    avg_focus = statistics.mean(focus_scores)
                    if avg_focus > best_focus:
                        best_focus = avg_focus
                        best_duration_bin = duration_bin
            
            # Calculate subject difficulty trend
            recent_difficulties = [s['difficulty'] for s in subject_sessions[-5:]]  # Last 5 sessions
            all_difficulties = [s['difficulty'] for s in subject_sessions]
            
            difficulty_trend = 'stable'
            if len(recent_difficulties) >= 3 and len(all_difficulties) >= 5:
                recent_avg = statistics.mean(recent_difficulties)
                overall_avg = statistics.mean(all_difficulties)
                if recent_avg > overall_avg + 0.3:
                    difficulty_trend = 'increasing'
                elif recent_avg < overall_avg - 0.3:
                    difficulty_trend = 'decreasing'
            
            subject_recommendations[subject] = {
                'session_count': len(subject_sessions),
                'optimal_duration': best_duration_bin,
                'average_focus': statistics.mean([s['focus_level'] for s in subject_sessions]),
                'difficulty_trend': difficulty_trend,
                'focus_consistency': self._calculate_consistency_score([s['focus_level'] for s in subject_sessions])
            }
        
        return subject_recommendations
    
    def _analyze_trends(self, sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze trends over time using simple moving averages.
        
        Avoids complex time series analysis to prevent overfitting.
        """
        if len(sessions) < 5:
            return {'insufficient_data': True}
        
        # Sort sessions by timestamp
        sorted_sessions = sorted(sessions, key=lambda x: x.get('timestamp', ''), reverse=False)
        
        # Calculate moving averages for recent vs historical performance
        recent_sessions = sorted_sessions[-5:]  # Last 5 sessions
        historical_sessions = sorted_sessions[:-5] if len(sorted_sessions) > 5 else []
        
        trends = {}
        
        if historical_sessions:
            # Focus trend
            recent_focus = statistics.mean([s['focus_level'] for s in recent_sessions])
            historical_focus = statistics.mean([s['focus_level'] for s in historical_sessions])
            
            trends['focus_trend'] = {
                'direction': 'improving' if recent_focus > historical_focus + 0.2 
                           else 'declining' if recent_focus < historical_focus - 0.2 
                           else 'stable',
                'recent_average': recent_focus,
                'historical_average': historical_focus,
                'change_magnitude': abs(recent_focus - historical_focus)
            }
            
            # Duration trend
            recent_duration = statistics.mean([s['duration'] for s in recent_sessions])
            historical_duration = statistics.mean([s['duration'] for s in historical_sessions])
            
            trends['duration_trend'] = {
                'direction': 'increasing' if recent_duration > historical_duration + 5
                           else 'decreasing' if recent_duration < historical_duration - 5
                           else 'stable',
                'recent_average': recent_duration,
                'historical_average': historical_duration
            }
        
        # Weekly pattern analysis (if enough data spans multiple weeks)
        weekly_patterns = self._analyze_weekly_patterns(sorted_sessions)
        if weekly_patterns:
            trends['weekly_patterns'] = weekly_patterns
        
        return trends
    
    def _analyze_weekly_patterns(self, sorted_sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze weekly patterns in study behavior."""
        if len(sorted_sessions) < 10:  # Need sufficient data
            return {}
        
        daily_data = defaultdict(list)  # weekday -> [focus_levels]
        
        for session in sorted_sessions:
            try:
                if 'timestamp' in session and session['timestamp']:
                    timestamp_str = session['timestamp']
                    if timestamp_str.endswith('Z'):
                        timestamp_str = timestamp_str[:-1] + '+00:00'
                    
                    dt = datetime.fromisoformat(timestamp_str)
                    weekday = dt.weekday()  # 0=Monday, 6=Sunday
                    daily_data[weekday].append(session['focus_level'])
            except (ValueError, TypeError, AttributeError):
                continue
        
        if len(daily_data) < 3:  # Need data for at least 3 different days
            return {}
        
        # Calculate average focus by day of week
        daily_averages = {}
        weekday_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        for weekday, focus_levels in daily_data.items():
            if len(focus_levels) >= 2:  # At least 2 sessions for reliability
                daily_averages[weekday_names[weekday]] = {
                    'average_focus': statistics.mean(focus_levels),
                    'session_count': len(focus_levels)
                }
        
        # Find best and worst days
        if daily_averages:
            best_day = max(daily_averages.items(), key=lambda x: x[1]['average_focus'])
            worst_day = min(daily_averages.items(), key=lambda x: x[1]['average_focus'])
            
            return {
                'daily_averages': daily_averages,
                'best_day': best_day[0],
                'worst_day': worst_day[0],
                'focus_range': best_day[1]['average_focus'] - worst_day[1]['average_focus']
            }
        
        return {}
    
    def _detect_statistical_patterns(self, sessions: List[Dict[str, Any]]) -> List[str]:
        """
        Detect statistically significant patterns using simple statistical tests.
        
        Focus on practically significant patterns rather than complex statistical inference.
        """
        patterns = []
        
        if len(sessions) < self.MIN_SAMPLES_FOR_SIGNIFICANCE:
            return ["Insufficient data for statistical pattern detection"]
        
        # Pattern 1: Duration-Focus correlation
        durations = [s['duration'] for s in sessions]
        focus_levels = [s['focus_level'] for s in sessions]
        
        correlation = self._calculate_correlation(durations, focus_levels)
        if abs(correlation) > 0.5:  # Moderate correlation threshold
            direction = "positive" if correlation > 0 else "negative"
            patterns.append(
                f"Strong {direction} correlation between session duration and focus level "
                f"(r={correlation:.2f}). {'Longer' if correlation > 0 else 'Shorter'} sessions "
                f"tend to have {'higher' if correlation > 0 else 'lower'} focus."
            )
        
        # Pattern 2: Difficulty-Focus relationship
        difficulties = [s['difficulty'] for s in sessions]
        diff_focus_corr = self._calculate_correlation(difficulties, focus_levels)
        
        if diff_focus_corr < -0.4:  # Negative correlation
            patterns.append(
                f"Challenging material significantly impacts focus (r={diff_focus_corr:.2f}). "
                "Consider shorter sessions or more preparation for difficult topics."
            )
        elif diff_focus_corr > 0.3:  # Unexpected positive correlation
            patterns.append(
                f"You maintain better focus on challenging material (r={diff_focus_corr:.2f}). "
                "This suggests you're well-motivated by challenging tasks."
            )
        
        # Pattern 3: Consistency analysis
        focus_consistency = self._calculate_consistency_score(focus_levels)
        if focus_consistency < 0.3:
            patterns.append(
                f"High variability in focus levels detected. "
                f"Consider identifying factors that contribute to your best sessions."
            )
        elif focus_consistency > 0.8:
            patterns.append(
                f"Excellent focus consistency across sessions. "
                f"Your study routine appears well-optimized."
            )
        
        return patterns
    
    def _generate_statistical_recommendations(self, basic_stats: Dict, optimal_conditions: OptimalConditions, 
                                           trends: Dict, patterns: List[str]) -> List[str]:
        """Generate evidence-based recommendations from statistical analysis."""
        recommendations = []
        
        # Duration recommendations based on statistical analysis
        duration_pred = optimal_conditions.duration
        if duration_pred.confidence > self.CONFIDENCE_THRESHOLD:
            recommendations.append(
                f"📊 Statistical Analysis: Your optimal session duration is {duration_pred.prediction:.0f} minutes "
                f"(confidence: {duration_pred.confidence:.0%}). {duration_pred.reasoning}"
            )
        
        # Time-of-day recommendations
        if optimal_conditions.time_of_day and optimal_conditions.best_time_window:
            start_hour, end_hour = optimal_conditions.best_time_window
            recommendations.append(
                f"⏰ Peak Performance Window: {start_hour}:00-{end_hour}:00 shows your highest focus levels. "
                f"Schedule important subjects during this time."
            )
        
        # Subject-specific recommendations
        if optimal_conditions.subject_recommendations:
            best_subject = max(optimal_conditions.subject_recommendations.items(), 
                             key=lambda x: x[1]['average_focus'])
            worst_subject = min(optimal_conditions.subject_recommendations.items(), 
                              key=lambda x: x[1]['average_focus'])
            
            if len(optimal_conditions.subject_recommendations) > 1:
                recommendations.append(
                    f"📚 Subject Optimization: You perform best in {best_subject[0]} "
                    f"(avg focus: {best_subject[1]['average_focus']:.1f}) and need more "
                    f"support for {worst_subject[0]} (avg focus: {worst_subject[1]['average_focus']:.1f})."
                )
        
        # Trend-based recommendations
        if 'focus_trend' in trends:
            focus_trend = trends['focus_trend']
            if focus_trend['direction'] == 'declining':
                recommendations.append(
                    f"⚠️ Focus Declining: Recent sessions show {focus_trend['change_magnitude']:.1f} point "
                    f"drop in focus. Consider adjusting study environment or taking a break."
                )
            elif focus_trend['direction'] == 'improving':
                recommendations.append(
                    f"📈 Focus Improving: Great progress! Recent sessions show {focus_trend['change_magnitude']:.1f} "
                    f"point improvement. Keep up your current study approach."
                )
        
        # Statistical pattern recommendations
        for pattern in patterns:
            if "correlation" in pattern.lower() or "consistency" in pattern.lower():
                recommendations.append(f"🔍 Pattern Detected: {pattern}")
        
        return recommendations
    
    # Utility methods
    
    def _calculate_percentiles(self, data: List[float]) -> Dict[int, float]:
        """Calculate key percentiles for data distribution."""
        if not data:
            return {}
        
        sorted_data = sorted(data)
        n = len(sorted_data)
        
        return {
            25: sorted_data[int(n * 0.25)],
            50: sorted_data[int(n * 0.50)],
            75: sorted_data[int(n * 0.75)],
            90: sorted_data[int(n * 0.90)]
        }
    
    def _calculate_consistency_score(self, values: List[float]) -> float:
        """Calculate consistency score (0-1, higher is more consistent)."""
        if len(values) < 2:
            return 1.0
        
        std_dev = statistics.stdev(values)
        mean_val = statistics.mean(values)
        
        # Coefficient of variation, normalized to 0-1 scale
        if mean_val == 0:
            return 0.0
        
        cv = std_dev / mean_val
        return max(0.0, 1.0 - cv / 2.0)  # Normalize assuming CV rarely exceeds 2
    
    def _calculate_correlation(self, x: List[float], y: List[float]) -> float:
        """Calculate Pearson correlation coefficient."""
        if len(x) != len(y) or len(x) < 2:
            return 0.0
        
        n = len(x)
        mean_x = statistics.mean(x)
        mean_y = statistics.mean(y)
        
        numerator = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
        sum_sq_x = sum((x[i] - mean_x) ** 2 for i in range(n))
        sum_sq_y = sum((y[i] - mean_y) ** 2 for i in range(n))
        
        denominator = math.sqrt(sum_sq_x * sum_sq_y)
        
        if denominator == 0:
            return 0.0
        
        return numerator / denominator
    
    def _calculate_correlations(self, sessions: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate correlations between different session attributes."""
        if len(sessions) < 3:
            return {}
        
        durations = [s['duration'] for s in sessions]
        focus_levels = [s['focus_level'] for s in sessions]
        difficulties = [s['difficulty'] for s in sessions]
        
        return {
            'duration_focus': self._calculate_correlation(durations, focus_levels),
            'duration_difficulty': self._calculate_correlation(durations, difficulties),
            'focus_difficulty': self._calculate_correlation(focus_levels, difficulties)
        }
    
    def _get_duration_bin(self, duration: int) -> str:
        """Get duration bin label for a given duration."""
        for min_dur, max_dur in self.DURATION_BINS:
            if min_dur <= duration < max_dur:
                return f"{min_dur}-{max_dur}min"
        return "unknown"
    
    def _get_empty_analysis(self) -> Dict[str, Any]:
        """Return empty analysis structure for no data scenarios."""
        return {
            'basic_statistics': {'session_count': 0},
            'optimal_conditions': None,
            'trends': {'insufficient_data': True},
            'patterns': ["No data available for analysis"],
            'recommendations': ["Start logging study sessions to get personalized insights"]
        }


def analyze_study_data_enhanced(sessions_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Enhanced analysis function with statistical methods and predictions.
    
    Args:
        sessions_data: List of session dictionaries
        
    Returns:
        Dictionary containing enhanced analysis with predictions
    """
    analyzer = StatisticalAnalyzer()
    enhanced_analysis = analyzer.analyze_with_predictions(sessions_data)
    
    return {
        'enhanced_analysis': enhanced_analysis,
        'analysis_type': 'statistical_with_predictions',
        'total_sessions': len(sessions_data),
        'analysis_timestamp': datetime.now().isoformat(),
        'methodology': 'Simple statistical methods with explainable predictions'
    }