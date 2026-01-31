"""
Test Suite for AI Study Coach Backend

Tests all API endpoints, data validation, analysis logic, and recommendation engine.
Covers edge cases, extreme values, and error handling scenarios.
"""

import unittest
import json
import tempfile
import os
from datetime import datetime, timedelta
from unittest.mock import patch

# Import the Flask app and components
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, db, StudySession
from study_analyzer import StudyAnalyzer, analyze_study_data
from recommendation_engine import StudyRecommendationEngine, get_study_recommendations


class TestStudyCoachBackend(unittest.TestCase):
    """Test cases for the AI Study Coach backend functionality."""
    
    def setUp(self):
        """Set up test database and Flask test client."""
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'  # In-memory test DB
        
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
    
    def tearDown(self):
        """Clean up test database."""
        with self.app.app_context():
            db.drop_all()


class TestAPIEndpoints(TestStudyCoachBackend):
    """Test all Flask API endpoints with various scenarios."""
    
    def test_index_endpoint(self):
        """Test the basic index endpoint returns correct response."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('message', data)
        self.assertIn('AI Study Coach Backend', data['message'])
    
    def test_log_study_session_valid_data(self):
        """Test logging a valid study session."""
        session_data = {
            'subject': 'Mathematics',
            'duration': 45,
            'focus_level': 4,
            'difficulty': 3
        }
        
        response = self.client.post('/api/study-sessions',
                                  data=json.dumps(session_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('session', data)
        self.assertEqual(data['session']['subject'], 'Mathematics')
    
    def test_log_study_session_missing_fields(self):
        """Test validation when required fields are missing."""
        # Missing focus_level
        incomplete_data = {
            'subject': 'Physics',
            'duration': 30,
            'difficulty': 4
        }
        
        response = self.client.post('/api/study-sessions',
                                  data=json.dumps(incomplete_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('Missing required fields', data['error'])
    
    def test_log_study_session_invalid_values(self):
        """Test validation with invalid field values."""
        test_cases = [
            # Invalid focus level (out of range)
            {'subject': 'Test', 'duration': 30, 'focus_level': 6, 'difficulty': 3},
            # Invalid duration (negative)
            {'subject': 'Test', 'duration': -10, 'focus_level': 3, 'difficulty': 3},
            # Invalid difficulty (zero)
            {'subject': 'Test', 'duration': 30, 'focus_level': 3, 'difficulty': 0},
            # Empty subject
            {'subject': '', 'duration': 30, 'focus_level': 3, 'difficulty': 3},
            # Extremely long duration
            {'subject': 'Test', 'duration': 2000, 'focus_level': 3, 'difficulty': 3}
        ]
        
        for invalid_data in test_cases:
            with self.subTest(data=invalid_data):
                response = self.client.post('/api/study-sessions',
                                          data=json.dumps(invalid_data),
                                          content_type='application/json')
                
                self.assertEqual(response.status_code, 400)
                data = json.loads(response.data)
                self.assertFalse(data['success'])
                self.assertIn('validation_errors', data)
    
    def test_log_study_session_no_json(self):
        """Test endpoint behavior with no JSON data."""
        response = self.client.post('/api/study-sessions',
                                  data='not json',
                                  content_type='text/plain')
        
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertFalse(data['success'])
        self.assertIn('No JSON data provided', data['error'])
    
    def test_get_study_sessions_empty_database(self):
        """Test fetching sessions when database is empty."""
        response = self.client.get('/api/study-sessions')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['count'], 0)
        self.assertEqual(len(data['sessions']), 0)
    
    def test_get_study_sessions_with_data(self):
        """Test fetching sessions with data in database."""
        # Add test sessions
        with self.app.app_context():
            session1 = StudySession(subject='Math', duration=30, focus_level=4, difficulty=2)
            session2 = StudySession(subject='Physics', duration=45, focus_level=3, difficulty=4)
            db.session.add(session1)
            db.session.add(session2)
            db.session.commit()
        
        response = self.client.get('/api/study-sessions')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['count'], 2)
        self.assertEqual(len(data['sessions']), 2)
    
    def test_get_study_insights_no_data(self):
        """Test insights endpoint with no session data."""
        response = self.client.get('/api/study-insights')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('No study sessions found', data['insights'][0])
    
    def test_get_study_recommendations_no_data(self):
        """Test recommendations endpoint with no session data."""
        response = self.client.get('/api/study-recommendations')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('recommendations', data)


class TestStudyAnalyzer(unittest.TestCase):
    """Test the study session analysis logic."""
    
    def setUp(self):
        """Set up test analyzer instance."""
        self.analyzer = StudyAnalyzer()
    
    def test_empty_sessions_analysis(self):
        """Test analysis with no session data."""
        insights = self.analyzer.analyze_sessions([])
        self.assertEqual(len(insights), 1)
        self.assertIn('No study sessions found', insights[0])
    
    def test_single_session_analysis(self):
        """Test analysis with single session (minimal data)."""
        session = {
            'id': 1,
            'subject': 'Test',
            'duration': 30,
            'focus_level': 3,
            'difficulty': 2,
            'timestamp': datetime.now().isoformat()
        }
        
        insights = self.analyzer.analyze_sessions([session])
        self.assertIsInstance(insights, list)
        self.assertGreater(len(insights), 0)
    
    def test_extreme_values_analysis(self):
        """Test analysis with extreme session values."""
        extreme_sessions = [
            # Extremely long session with low focus
            {'id': 1, 'subject': 'Math', 'duration': 300, 'focus_level': 1, 'difficulty': 5, 'timestamp': datetime.now().isoformat()},
            # Extremely short session with high focus
            {'id': 2, 'subject': 'Physics', 'duration': 5, 'focus_level': 5, 'difficulty': 1, 'timestamp': datetime.now().isoformat()},
            # Normal session for comparison
            {'id': 3, 'subject': 'Chemistry', 'duration': 45, 'focus_level': 3, 'difficulty': 3, 'timestamp': datetime.now().isoformat()}
        ]
        
        insights = self.analyzer.analyze_sessions(extreme_sessions)
        self.assertIsInstance(insights, list)
        
        # Should detect long session with low focus
        long_session_warning = any('long' in insight.lower() and 'low focus' in insight.lower() for insight in insights)
        self.assertTrue(long_session_warning, "Should detect problematic long sessions")
    
    def test_consistent_pattern_detection(self):
        """Test detection of consistent patterns across subjects."""
        # Create sessions showing consistent low focus in one subject
        sessions = []
        base_time = datetime.now()
        
        # Math sessions with consistently low focus
        for i in range(5):
            sessions.append({
                'id': i + 1,
                'subject': 'Mathematics',
                'duration': 40,
                'focus_level': 2,  # Consistently low
                'difficulty': 3,
                'timestamp': (base_time - timedelta(days=i)).isoformat()
            })
        
        # Physics sessions with good focus
        for i in range(3):
            sessions.append({
                'id': i + 6,
                'subject': 'Physics',
                'duration': 35,
                'focus_level': 4,  # Consistently high
                'difficulty': 3,
                'timestamp': (base_time - timedelta(days=i)).isoformat()
            })
        
        insights = self.analyzer.analyze_sessions(sessions)
        
        # Should identify subject with focus issues
        math_focus_issue = any('Mathematics' in insight and 'focus' in insight.lower() for insight in insights)
        self.assertTrue(math_focus_issue, "Should identify subject with consistent focus issues")
    
    def test_quick_summary_generation(self):
        """Test quick summary generation with various data sizes."""
        test_cases = [
            [],  # Empty
            [{'duration': 30, 'focus_level': 3}],  # Single session
            [{'duration': 45, 'focus_level': 4}, {'duration': 60, 'focus_level': 3}]  # Multiple sessions
        ]
        
        for sessions in test_cases:
            with self.subTest(sessions=len(sessions)):
                summary = self.analyzer.get_quick_summary(sessions)
                self.assertIsInstance(summary, str)
                self.assertGreater(len(summary), 10)  # Should be meaningful text


class TestRecommendationEngine(unittest.TestCase):
    """Test the recommendation generation logic."""
    
    def setUp(self):
        """Set up test recommendation engine."""
        self.engine = StudyRecommendationEngine()
    
    def test_beginner_recommendations(self):
        """Test recommendations for users with no session history."""
        recommendations = self.engine.generate_recommendations([], [])
        
        # Should return beginner-friendly recommendations
        self.assertIn('session_structure', recommendations)
        self.assertIn('break_schedule', recommendations)
        self.assertIn('subject_ordering', recommendations)
        
        # Check that recommendations are actionable
        session_recs = recommendations['session_structure']
        self.assertTrue(any('25-minute' in rec for rec in session_recs))
    
    def test_personalized_recommendations(self):
        """Test personalized recommendations based on session patterns."""
        # Create sessions with identifiable patterns
        sessions = [
            {'subject': 'Math', 'duration': 90, 'focus_level': 2, 'difficulty': 4, 'timestamp': datetime.now().isoformat()},
            {'subject': 'Math', 'duration': 85, 'focus_level': 1, 'difficulty': 4, 'timestamp': datetime.now().isoformat()},
            {'subject': 'English', 'duration': 30, 'focus_level': 4, 'difficulty': 2, 'timestamp': datetime.now().isoformat()},
        ]
        
        insights = ['You have long sessions with low focus in Math']
        recommendations = self.engine.generate_recommendations(sessions, insights)
        
        # Should provide specific recommendations based on patterns
        self.assertIn('session_structure', recommendations)
        self.assertIn('focus_strategies', recommendations)
        
        # Check for duration-related recommendations
        structure_recs = recommendations['session_structure']
        duration_advice = any('break' in rec.lower() or 'shorter' in rec.lower() for rec in structure_recs)
        self.assertTrue(duration_advice, "Should provide duration-related advice for long sessions")
    
    def test_recommendation_categories_completeness(self):
        """Test that all recommendation categories are included."""
        sample_sessions = [
            {'subject': 'Test', 'duration': 45, 'focus_level': 3, 'difficulty': 3, 'timestamp': datetime.now().isoformat()}
        ]
        
        recommendations = self.engine.generate_recommendations(sample_sessions, [])
        
        expected_categories = [
            'session_structure', 'break_schedule', 'subject_ordering',
            'focus_strategies', 'next_session', 'weekly_plan', 'priority_actions'
        ]
        
        for category in expected_categories:
            self.assertIn(category, recommendations, f"Missing recommendation category: {category}")


class TestDataModels(TestStudyCoachBackend):
    """Test database models and data integrity."""
    
    def test_study_session_creation(self):
        """Test creating StudySession instances."""
        with self.app.app_context():
            session = StudySession(
                subject='Test Subject',
                duration=60,
                focus_level=4,
                difficulty=3
            )
            db.session.add(session)
            db.session.commit()
            
            # Verify session was created
            saved_session = StudySession.query.first()
            self.assertIsNotNone(saved_session)
            self.assertEqual(saved_session.subject, 'Test Subject')
            self.assertEqual(saved_session.duration, 60)
            self.assertIsNotNone(saved_session.timestamp)  # Should auto-populate
    
    def test_study_session_to_dict(self):
        """Test StudySession to_dict method."""
        with self.app.app_context():
            session = StudySession(
                subject='Math',
                duration=45,
                focus_level=3,
                difficulty=4
            )
            db.session.add(session)
            db.session.commit()
            
            session_dict = session.to_dict()
            
            # Verify all fields are present
            expected_fields = ['id', 'subject', 'duration', 'focus_level', 'difficulty', 'timestamp']
            for field in expected_fields:
                self.assertIn(field, session_dict)
    
    def test_study_session_repr(self):
        """Test StudySession string representation."""
        session = StudySession(
            subject='Physics',
            duration=30,
            focus_level=5,
            difficulty=2
        )
        
        repr_str = repr(session)
        self.assertIn('Physics', repr_str)
        self.assertIn('30min', repr_str)


class TestEdgeCases(TestStudyCoachBackend):
    """Test various edge cases and error conditions."""
    
    def test_repeated_identical_sessions(self):
        """Test behavior with multiple identical sessions."""
        identical_session_data = {
            'subject': 'Duplicate Test',
            'duration': 30,
            'focus_level': 3,
            'difficulty': 2
        }
        
        # Add multiple identical sessions
        for _ in range(5):
            response = self.client.post('/api/study-sessions',
                                      data=json.dumps(identical_session_data),
                                      content_type='application/json')
            self.assertEqual(response.status_code, 201)
        
        # Verify all sessions were saved
        response = self.client.get('/api/study-sessions')
        data = json.loads(response.data)
        self.assertEqual(data['count'], 5)
        
        # Test analysis handles duplicate data gracefully
        response = self.client.get('/api/study-insights')
        self.assertEqual(response.status_code, 200)
        
        insights_data = json.loads(response.data)
        self.assertTrue(insights_data['success'])
    
    def test_malformed_timestamps(self):
        """Test analysis with various timestamp formats."""
        sessions_with_timestamps = [
            {'subject': 'Test1', 'duration': 30, 'focus_level': 3, 'difficulty': 2, 'timestamp': 'invalid'},
            {'subject': 'Test2', 'duration': 30, 'focus_level': 3, 'difficulty': 2, 'timestamp': None},
            {'subject': 'Test3', 'duration': 30, 'focus_level': 3, 'difficulty': 2, 'timestamp': datetime.now().isoformat()}
        ]
        
        # Analysis should handle malformed timestamps gracefully
        analyzer = StudyAnalyzer()
        insights = analyzer.analyze_sessions(sessions_with_timestamps)
        self.assertIsInstance(insights, list)
        self.assertGreater(len(insights), 0)
    
    def test_unicode_subjects(self):
        """Test handling of Unicode characters in subjects."""
        unicode_session = {
            'subject': '数学 (Mathematics) 📚',
            'duration': 45,
            'focus_level': 4,
            'difficulty': 3
        }
        
        response = self.client.post('/api/study-sessions',
                                  data=json.dumps(unicode_session),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['session']['subject'], '数学 (Mathematics) 📚')
    
    def test_boundary_values(self):
        """Test boundary values for all numeric fields."""
        boundary_test_cases = [
            # Minimum valid values
            {'subject': 'Min Test', 'duration': 1, 'focus_level': 1, 'difficulty': 1},
            # Maximum valid values
            {'subject': 'Max Test', 'duration': 1440, 'focus_level': 5, 'difficulty': 5}
        ]
        
        for test_data in boundary_test_cases:
            with self.subTest(data=test_data):
                response = self.client.post('/api/study-sessions',
                                          data=json.dumps(test_data),
                                          content_type='application/json')
                
                self.assertEqual(response.status_code, 201)
                data = json.loads(response.data)
                self.assertTrue(data['success'])


def run_all_tests():
    """Run all test suites and return results."""
    # Create test suite
    test_loader = unittest.TestLoader()
    test_suite = unittest.TestSuite()
    
    # Add all test classes
    test_classes = [
        TestAPIEndpoints,
        TestStudyAnalyzer,
        TestRecommendationEngine,
        TestDataModels,
        TestEdgeCases
    ]
    
    for test_class in test_classes:
        tests = test_loader.loadTestsFromTestCase(test_class)
        test_suite.addTests(tests)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    return result


if __name__ == '__main__':
    print("🧪 Running AI Study Coach Test Suite")
    print("=" * 50)
    
    result = run_all_tests()
    
    print("\n" + "=" * 50)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.failures:
        print("\nFailures:")
        for test, failure in result.failures:
            print(f"- {test}: {failure}")
    
    if result.errors:
        print("\nErrors:")
        for test, error in result.errors:
            print(f"- {test}: {error}")
    
    if result.wasSuccessful():
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Some tests failed. Check the output above.")