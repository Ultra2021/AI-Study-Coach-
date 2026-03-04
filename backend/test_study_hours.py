"""
Test Script for Study Hours Endpoints
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_study_hours():
    print("=" * 60)
    print("Testing Study Hours Endpoints")
    print("=" * 60)
    
    # Step 1: Login
    print("\n1. Login...")
    login_response = requests.post(
        f"{BASE_URL}/api/login",
        json={
            "email": "noel@test.com",
            "password": "password123"
        }
    )
    user_data = login_response.json()
    user_id = user_data['user']['id']
    print(f"✓ Logged in as: {user_data['user']['username']}")
    print(f"  User ID: {user_id}")
    
    # Step 2: Get user's study groups
    print("\n2. Getting user's study groups...")
    groups_response = requests.get(f"{BASE_URL}/api/study-groups/{user_id}")
    groups_data = groups_response.json()
    
    if not groups_data.get('groups'):
        print("✗ No study groups found. Create a group first!")
        return
    
    group_id = groups_data['groups'][0]['id']
    group_name = groups_data['groups'][0]['name']
    print(f"✓ Using group: {group_name}")
    print(f"  Group ID: {group_id}")
    
    # Step 3: Log a study session
    print("\n3. Logging a study session...")
    log_response = requests.post(
        f"{BASE_URL}/api/study-groups/{group_id}/study-hours/log",
        json={
            "user_id": user_id,
            "subject": "Mathematics",
            "duration": 60,  # 60 minutes
            "notes": "Studied calculus"
        }
    )
    log_data = log_response.json()
    if log_data['success']:
        print(f"✓ Session logged successfully")
        print(f"  Session ID: {log_data['session']['id']}")
    else:
        print(f"✗ Failed: {log_data.get('error')}")
    
    # Step 4: Log another session
    print("\n4. Logging another study session...")
    log_response2 = requests.post(
        f"{BASE_URL}/api/study-groups/{group_id}/study-hours/log",
        json={
            "user_id": user_id,
            "subject": "Programming",
            "duration": 45,  # 45 minutes
            "notes": "Python practice"
        }
    )
    log_data2 = log_response2.json()
    if log_data2['success']:
        print(f"✓ Session logged successfully")
    else:
        print(f"✗ Failed: {log_data2.get('error')}")
    
    # Step 5: Get group study stats
    print("\n5. Getting group study statistics...")
    stats_response = requests.get(
        f"{BASE_URL}/api/study-groups/{group_id}/study-hours/stats",
        params={"user_id": user_id, "days": 7}
    )
    stats_data = stats_response.json()
    if stats_data['success']:
        stats = stats_data['stats']
        print(f"✓ Group Study Stats (Last 7 days):")
        print(f"  Total Hours: {stats['total_hours']} hours")
        print(f"  Total Sessions: {stats['total_sessions']}")
        print(f"  Average Session Length: {stats['average_session_length']} minutes")
        
        if stats['member_breakdown']:
            print(f"\n  Member Breakdown:")
            for member in stats['member_breakdown']:
                print(f"    - {member['username']}: {member['hours']:.2f} hours ({member['sessions']} sessions)")
        
        if stats['subject_breakdown']:
            print(f"\n  Subject Breakdown:")
            for subject in stats['subject_breakdown']:
                print(f"    - {subject['subject']}: {subject['hours']:.2f} hours ({subject['sessions']} sessions)")
    else:
        print(f"✗ Failed: {stats_data.get('error')}")
    
    # Step 6: Get member study hours
    print("\n6. Getting member study hours...")
    member_hours_response = requests.get(
        f"{BASE_URL}/api/study-groups/{group_id}/study-hours/member",
        params={"user_id": user_id}
    )
    member_hours_data = member_hours_response.json()
    if member_hours_data['success']:
        hours = member_hours_data['hours']
        print(f"✓ Your Study Hours in this group:")
        print(f"  Total: {hours['total']} hours")
        print(f"  This Week: {hours['this_week']} hours")
        print(f"  This Month: {hours['this_month']} hours")
        print(f"  Total Sessions: {hours['total_sessions']}")
    else:
        print(f"✗ Failed: {member_hours_data.get('error')}")
    
    # Step 7: Set study goals
    print("\n7. Setting study goals...")
    goals_response = requests.post(
        f"{BASE_URL}/api/study-groups/{group_id}/study-hours/goals",
        json={
            "user_id": user_id,
            "weekly_hours": 10,
            "monthly_hours": 40
        }
    )
    goals_data = goals_response.json()
    if goals_data['success']:
        print(f"✓ Study goals set successfully")
        print(f"  Weekly Goal: {goals_data['goals']['weekly_study_goal']} hours")
        print(f"  Monthly Goal: {goals_data['goals']['monthly_study_goal']} hours")
    else:
        print(f"✗ Failed: {goals_data.get('error')}")
    
    # Step 8: Get goal progress
    print("\n8. Getting goal progress...")
    progress_response = requests.get(
        f"{BASE_URL}/api/study-groups/{group_id}/study-hours/progress",
        params={"user_id": user_id}
    )
    progress_data = progress_response.json()
    if progress_data['success']:
        progress = progress_data['progress']
        print(f"✓ Goal Progress:")
        print(f"\n  Weekly:")
        print(f"    Goal: {progress['weekly']['goal']} hours")
        print(f"    Actual: {progress['weekly']['actual']} hours")
        print(f"    Progress: {progress['weekly']['percentage']}%")
        
        print(f"\n  Monthly:")
        print(f"    Goal: {progress['monthly']['goal']} hours")
        print(f"    Actual: {progress['monthly']['actual']} hours")
        print(f"    Progress: {progress['monthly']['percentage']}%")
    else:
        print(f"✗ Failed: {progress_data.get('error')}")
    
    print("\n" + "=" * 60)
    print("Testing Complete!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_study_hours()
    except requests.exceptions.ConnectionError:
        print("✗ Error: Could not connect to the server.")
        print("  Make sure the backend server is running on http://localhost:5000")
    except Exception as e:
        print(f"✗ Error: {str(e)}")
