#!/usr/bin/env python3
"""
Complete demonstration of the Enhanced AI Study Coach application.
This script tests both the backend statistical analysis and the frontend functionality.
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import app, db, StudySession
from enhanced_analyzer import analyze_study_data_enhanced
from datetime import datetime, timedelta
import json

def create_sample_data():
    """Create comprehensive sample data for testing."""
    print("📚 Creating sample study sessions...")
    
    with app.app_context():
        # Clear existing data
        StudySession.query.delete()
        db.session.commit()
        
        # Create a realistic dataset spanning 2 weeks with various patterns
        now = datetime.now()
        sessions_data = [
            # Week 1 - Mathematics focus, varying durations
            {'subject': 'Mathematics', 'duration': 45, 'focus_level': 4, 'difficulty': 3, 'days_ago': 14},
            {'subject': 'Mathematics', 'duration': 60, 'focus_level': 3, 'difficulty': 4, 'days_ago': 13},
            {'subject': 'Mathematics', 'duration': 30, 'focus_level': 5, 'difficulty': 2, 'days_ago': 12},
            {'subject': 'Mathematics', 'duration': 90, 'focus_level': 2, 'difficulty': 5, 'days_ago': 11},
            {'subject': 'Mathematics', 'duration': 50, 'focus_level': 4, 'difficulty': 3, 'days_ago': 10},
            
            # Physics sessions - medium difficulty patterns
            {'subject': 'Physics', 'duration': 55, 'focus_level': 3, 'difficulty': 4, 'days_ago': 9},
            {'subject': 'Physics', 'duration': 40, 'focus_level': 4, 'difficulty': 3, 'days_ago': 8},
            {'subject': 'Physics', 'duration': 65, 'focus_level': 3, 'difficulty': 4, 'days_ago': 7},
            {'subject': 'Physics', 'duration': 45, 'focus_level': 5, 'difficulty': 2, 'days_ago': 6},
            
            # Chemistry - short, focused sessions
            {'subject': 'Chemistry', 'duration': 25, 'focus_level': 5, 'difficulty': 2, 'days_ago': 5},
            {'subject': 'Chemistry', 'duration': 35, 'focus_level': 4, 'difficulty': 3, 'days_ago': 4},
            {'subject': 'Chemistry', 'duration': 40, 'focus_level': 4, 'difficulty': 3, 'days_ago': 3},
            {'subject': 'Chemistry', 'duration': 30, 'focus_level': 5, 'difficulty': 2, 'days_ago': 2},
            
            # Recent sessions - mixed pattern
            {'subject': 'Mathematics', 'duration': 75, 'focus_level': 2, 'difficulty': 5, 'days_ago': 1},
            {'subject': 'Physics', 'duration': 50, 'focus_level': 4, 'difficulty': 3, 'days_ago': 0.5},
            
            # Add some time-of-day variation (different hours)
            {'subject': 'English', 'duration': 40, 'focus_level': 3, 'difficulty': 2, 'days_ago': 0.3},
            {'subject': 'English', 'duration': 45, 'focus_level': 4, 'difficulty': 2, 'days_ago': 0.2},
            {'subject': 'History', 'duration': 35, 'focus_level': 4, 'difficulty': 2, 'days_ago': 0.1},
        ]
        
        created_sessions = []
        for session_data in sessions_data:
            timestamp = now - timedelta(days=session_data['days_ago'])
            session = StudySession(
                subject=session_data['subject'],
                duration=session_data['duration'],
                focus_level=session_data['focus_level'],
                difficulty=session_data['difficulty'],
                timestamp=timestamp
            )
            db.session.add(session)
            created_sessions.append(session)
        
        db.session.commit()
        print(f"✅ Created {len(created_sessions)} sample study sessions")
        return created_sessions

def test_enhanced_analysis():
    """Test the enhanced statistical analysis with real data."""
    print("\n🧠 Testing Enhanced Statistical Analysis")
    print("=" * 60)
    
    with app.app_context():
        # Get all sessions from database
        sessions = StudySession.query.all()
        sessions_data = [session.to_dict() for session in sessions]
        
        print(f"📊 Analyzing {len(sessions_data)} study sessions...")
        
        # Run enhanced analysis
        analysis = analyze_study_data_enhanced(sessions_data)
        
        # Display results
        print("\n📈 BASIC STATISTICS:")
        stats = analysis.get('basic_statistics', {})
        for key, value in stats.items():
            if isinstance(value, (int, float)):
                if key.endswith('_average'):
                    print(f"   📊 {key.replace('_', ' ').title()}: {value:.2f}")
                else:
                    print(f"   📊 {key.replace('_', ' ').title()}: {value}")
        
        print("\n🎯 OPTIMAL CONDITIONS:")
        optimal = analysis.get('optimal_conditions', {})
        if optimal and optimal.get('duration'):
            duration_pred = optimal['duration']
            confidence_emoji = "🟢" if duration_pred['confidence'] > 0.7 else "🟡" if duration_pred['confidence'] > 0.5 else "🔴"
            print(f"   {confidence_emoji} Optimal Duration: {duration_pred['prediction']:.1f} minutes")
            print(f"   📊 Confidence: {duration_pred['confidence']:.1%}")
            print(f"   🧠 Reasoning: {duration_pred['reasoning']}")
            print(f"   📈 Statistical Significance: {'Yes' if duration_pred['statistical_significance'] else 'No'}")
            
        if optimal and optimal.get('best_time_window'):
            time_window = optimal['best_time_window']
            print(f"   ⏰ Best Study Time: {time_window[0]:02d}:00 - {time_window[1]:02d}:00")
        
        if not optimal or not optimal.get('duration'):
            print("   ℹ️ Insufficient data for reliable predictions")
        
        print("\n🔍 STATISTICAL PATTERNS:")
        patterns = analysis.get('patterns', [])
        if patterns:
            for i, pattern in enumerate(patterns[:8], 1):  # Show top 8 patterns
                if not pattern.lower().startswith('insufficient'):
                    print(f"   {i}. {pattern}")
        else:
            print("   ℹ️ No significant patterns detected yet")
        
        print("\n📊 TREND ANALYSIS:")
        trends = analysis.get('trends', {})
        if trends and not trends.get('insufficient_data'):
            if 'focus_trend' in trends:
                focus_trend = trends['focus_trend']
                direction = focus_trend.get('direction', 'stable')
                emoji = "📈" if direction == 'improving' else "📉" if direction == 'declining' else "➡️"
                print(f"   {emoji} Focus Trend: {direction.title()}")
                print(f"   📊 Recent Average: {focus_trend.get('recent_average', 0):.1f}/5")
                print(f"   📊 Historical Average: {focus_trend.get('historical_average', 0):.1f}/5")
            
            if 'weekly_patterns' in trends:
                weekly = trends['weekly_patterns']
                print(f"   📅 Best Study Day: {weekly.get('best_day', 'Unknown')}")
                print(f"   📅 Most Challenging Day: {weekly.get('worst_day', 'Unknown')}")
        else:
            print("   ℹ️ Trend analysis requires more study sessions")
        
        print("\n" + "=" * 60)
        print("✅ Enhanced analysis completed successfully!")
        
        return analysis

def print_usage_instructions():
    """Print instructions for using the application."""
    print("\n🚀 AI STUDY COACH - ENHANCED WITH STATISTICAL ANALYSIS")
    print("=" * 80)
    print("🎯 Your AI Study Coach has been enhanced with advanced statistical methods!")
    print("\n📊 NEW FEATURES:")
    print("   • 🧠 Optimal study session duration predictions")
    print("   • ⏰ Best study time recommendations")
    print("   • 📈 Statistical pattern detection")
    print("   • 📊 Trend analysis with confidence intervals")
    print("   • 🔍 Explainable AI predictions")
    print("\n🌐 TO USE THE APPLICATION:")
    print("   1. 📱 Open: http://127.0.0.1:5000")
    print("   2. ✍️ Log study sessions using the form")
    print("   3. 📊 View dashboard for insights and AI predictions")
    print("   4. 🎯 Get personalized study recommendations")
    print("\n🔗 AVAILABLE ENDPOINTS:")
    print("   📝 POST /api/study-sessions - Log new study sessions")
    print("   📊 GET  /api/study-sessions - View all sessions")
    print("   💡 GET  /api/study-recommendations - Get study advice")
    print("   🧠 GET  /api/study-predictions - AI statistical analysis (NEW)")
    print("\n🧪 SAMPLE DATA:")
    print("   ✅ Created comprehensive sample dataset with 18 sessions")
    print("   📈 Includes various subjects, durations, and difficulty levels")
    print("   ⏰ Spans 2 weeks to enable trend analysis")
    print("\n🎓 NEXT STEPS:")
    print("   1. Start the Flask server: python backend/app.py")
    print("   2. Open the application in your browser")
    print("   3. Explore the dashboard to see AI-powered predictions")
    print("   4. Add more study sessions to improve prediction accuracy")
    print("\n" + "=" * 80)

def main():
    """Main demonstration function."""
    print("🎓 AI STUDY COACH - ENHANCED STATISTICAL ANALYSIS DEMO")
    print("=" * 70)
    
    try:
        # Create sample data for testing
        create_sample_data()
        
        # Test enhanced analysis
        analysis_result = test_enhanced_analysis()
        
        # Print usage instructions
        print_usage_instructions()
        
    except Exception as e:
        print(f"❌ Error during demonstration: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()