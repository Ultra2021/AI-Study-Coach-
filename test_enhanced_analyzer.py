#!/usr/bin/env python3
"""
Direct test of the enhanced analyzer without Flask server.
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from enhanced_analyzer import analyze_study_data_enhanced
from datetime import datetime, timedelta
import json

def test_enhanced_analyzer():
    """Test the enhanced analyzer directly."""
    print("🧪 Testing Enhanced Statistical Analyzer")
    print("=" * 50)
    
    # Test with empty data
    print("\n📊 Test 1: Empty dataset")
    empty_result = analyze_study_data_enhanced([])
    print(f"Basic Statistics: {empty_result.get('basic_statistics', {})}")
    print(f"Optimal Conditions: {empty_result.get('optimal_conditions', {})}")
    print(f"Patterns Count: {len(empty_result.get('patterns', []))}")
    
    # Test with sample data
    print("\n📊 Test 2: Sample dataset")
    
    # Create sample study sessions
    now = datetime.now()
    sample_sessions = [
        {
            'id': 1,
            'subject': 'Mathematics',
            'duration': 45,
            'focus_level': 4,
            'difficulty': 3,
            'timestamp': (now - timedelta(days=5)).isoformat()
        },
        {
            'id': 2,
            'subject': 'Physics',
            'duration': 60,
            'focus_level': 3,
            'difficulty': 4,
            'timestamp': (now - timedelta(days=4)).isoformat()
        },
        {
            'id': 3,
            'subject': 'Chemistry',
            'duration': 30,
            'focus_level': 5,
            'difficulty': 2,
            'timestamp': (now - timedelta(days=3)).isoformat()
        },
        {
            'id': 4,
            'subject': 'Mathematics',
            'duration': 90,
            'focus_level': 2,
            'difficulty': 4,
            'timestamp': (now - timedelta(days=2)).isoformat()
        },
        {
            'id': 5,
            'subject': 'Physics',
            'duration': 50,
            'focus_level': 4,
            'difficulty': 3,
            'timestamp': (now - timedelta(days=1)).isoformat()
        }
    ]
    
    result = analyze_study_data_enhanced(sample_sessions)
    
    print(f"✅ Analysis completed successfully!")
    print(f"📈 Basic Statistics:")
    stats = result.get('basic_statistics', {})
    for key, value in stats.items():
        print(f"   - {key}: {value}")
    
    print(f"\n🎯 Optimal Conditions:")
    optimal = result.get('optimal_conditions', {})
    if optimal:
        if 'duration' in optimal and optimal['duration']:
            duration_pred = optimal['duration']
            print(f"   - Optimal Duration: {duration_pred['prediction']:.1f} minutes")
            print(f"   - Confidence: {duration_pred['confidence']:.2f}")
            print(f"   - Reasoning: {duration_pred['reasoning']}")
        
        if 'best_time_window' in optimal and optimal['best_time_window']:
            time_window = optimal['best_time_window']
            print(f"   - Best Time: {time_window[0]}:00 - {time_window[1]}:00")
    else:
        print("   - No optimal conditions calculated (insufficient data)")
    
    print(f"\n🔍 Detected Patterns:")
    patterns = result.get('patterns', [])
    for i, pattern in enumerate(patterns[:5], 1):  # Show first 5 patterns
        print(f"   {i}. {pattern}")
    
    print(f"\n📊 Trends:")
    trends = result.get('trends', {})
    if trends and not trends.get('insufficient_data'):
        if 'focus_trend' in trends:
            focus_trend = trends['focus_trend']
            print(f"   - Focus Trend: {focus_trend.get('direction', 'Unknown')}")
            print(f"   - Recent Avg: {focus_trend.get('recent_average', 0):.1f}")
            print(f"   - Historical Avg: {focus_trend.get('historical_average', 0):.1f}")
    else:
        print("   - Trend analysis requires more data")
    
    print("\n" + "=" * 50)
    print("✅ Enhanced analyzer test completed successfully!")
    return result

if __name__ == "__main__":
    try:
        test_enhanced_analyzer()
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()