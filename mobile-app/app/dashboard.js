import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  Modal,
  Animated,
  Alert,
  TextInput,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config';

const { width } = Dimensions.get('window');
const BASE_URL = API_CONFIG.BASE_URL;

// Format minutes to "Xh Ym" format
const formatTime = (minutes) => {
  if (minutes < 1) return "0m";
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export default function DashboardScreen() {
  const router = useRouter();
  const [isStudying, setIsStudying] = useState(false);
  const [studyTime, setStudyTime] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [currentSubject, setCurrentSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(-250)).current;
  const [user, setUser] = useState(null);
  const [studySessions, setStudySessions] = useState([]);
  const [stats, setStats] = useState({
    todayTime: 0,
    todayTimeFormatted: '0m',
    weeklyTime: 0,
    weeklyTimeFormatted: '0m',
    mostTimeSubject: '-',
    bestMonth: { month: '-', value: 0, formatted: '0m' }
  });
  const [studyGroups, setStudyGroups] = useState([]);
  const [showSubjectBreakdown, setShowSubjectBreakdown] = useState(false);
  const [subjectStats, setSubjectStats] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [groupDetailsTab, setGroupDetailsTab] = useState('overview');
  const [groupTasks, setGroupTasks] = useState([]);
  const [groupFiles, setGroupFiles] = useState([]);
  const [groupNotes, setGroupNotes] = useState([]);
  const [groupActivities, setGroupActivities] = useState([]);
  const [sessionFilter, setSessionFilter] = useState('all'); // 'today', 'week', 'all'
  const [sessionsModalTitle, setSessionsModalTitle] = useState('Study Sessions');

  // Update current date every minute
  useEffect(() => {
    const dateInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(dateInterval);
  }, []);

  // Load user data from AsyncStorage and fetch study sessions
  useEffect(() => {
    loadUserData();
    loadStudyGroups();
  }, []);

  // Auto-refresh data every minute
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (user?.id) {
        fetchStudySessions(user.id);
        loadStudyGroups();
      }
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(refreshInterval);
  }, [user]);


  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('User loaded from AsyncStorage:', parsedUser);
        setUser(parsedUser);
        fetchStudySessions(parsedUser.id);
      } else {
        // No user data, redirect to login
        console.log('No user data found, redirecting to login');
        router.replace('/');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/');
    }
  };

  const loadStudyGroups = async () => {
    try {
      // Get user from AsyncStorage first
      const userData = await AsyncStorage.getItem('user');
      if (!userData) return;
      
      const parsedUser = JSON.parse(userData);
      
      // Fetch from backend API
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/study-groups/${parsedUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setStudyGroups(data.groups || []);
      } else {
        console.error('Error fetching study groups:', response.status);
        setStudyGroups([]);
      }
    } catch (error) {
      console.error('Error loading study groups:', error);
      setStudyGroups([]);
    }
  };

  const fetchGroupTasks = async (groupId) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/study-groups/${groupId}/tasks?user_id=${user?.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setGroupTasks(data.tasks || []);
      } else {
        setGroupTasks([]);
      }
    } catch (error) {
      console.error('Error fetching group tasks:', error);
      setGroupTasks([]);
    }
  };

  const fetchGroupFiles = async (groupId) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/study-groups/${groupId}/files?user_id=${user?.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setGroupFiles(data.files || []);
      } else {
        setGroupFiles([]);
      }
    } catch (error) {
      console.error('Error fetching group files:', error);
      setGroupFiles([]);
    }
  };

  const fetchGroupNotes = async (groupId) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/study-groups/${groupId}/notes?user_id=${user?.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setGroupNotes(data.notes || []);
      } else {
        setGroupNotes([]);
      }
    } catch (error) {
      console.error('Error fetching group notes:', error);
      setGroupNotes([]);
    }
  };

  const fetchGroupActivities = async (groupId) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/study-groups/${groupId}/activities?user_id=${user?.id}&limit=20`
      );
      if (response.ok) {
        const data = await response.json();
        setGroupActivities(data.activities || []);
      } else {
        setGroupActivities([]);
      }
    } catch (error) {
      console.error('Error fetching group activities:', error);
      setGroupActivities([]);
    }
  };

  const loadGroupDetails = async (group) => {
    setSelectedGroup(group);
    setShowGroupDetailsModal(true);
    setGroupDetailsTab('overview');
    
    // Fetch all group data
    if (group?.id) {
      fetchGroupTasks(group.id);
      fetchGroupFiles(group.id);
      fetchGroupNotes(group.id);
      fetchGroupActivities(group.id);
    }
  };

  const fetchStudySessions = async (userId) => {
    try {
      console.log('Fetching study sessions for user:', userId);
      const response = await fetch(`${BASE_URL}/api/study-sessions?user_id=${userId}`);
      const data = await response.json();
      
      console.log('Study sessions API response:', data);
      
      if (data.success && data.sessions) {
        console.log('Setting study sessions:', data.sessions.length, 'sessions');
        // Log session data to verify enhanced fields
        data.sessions.slice(0, 3).forEach(session => {
          console.log('Session sample:', {
            subject: session.subject,
            difficulty: session.difficulty,
            focus_level: session.focus_level,
            duration: session.duration
          });
        });
        setStudySessions(data.sessions);
        calculateStats(data.sessions);
        calculateSubjectStats(data.sessions);
      } else {
        console.error('Failed to fetch study sessions:', data.error);
        setStudySessions([]);
      }
    } catch (error) {
      console.error('Error fetching study sessions:', error);
      setStudySessions([]);
    }
  };

  const calculateSubjectStats = (sessions) => {
    if (!sessions || sessions.length === 0) {
      setSubjectStats([]);
      return;
    }

    // Group sessions by subject
    const subjectData = {};
    sessions.forEach(session => {
      const subject = session.subject;
      if (!subjectData[subject]) {
        subjectData[subject] = {
          subject: subject,
          totalTime: 0,
          sessions: 0,
          lastStudied: session.created_at
        };
      }
      subjectData[subject].totalTime += session.duration;
      subjectData[subject].sessions += 1;
      
      // Update last studied if this session is more recent
      if (new Date(session.created_at) > new Date(subjectData[subject].lastStudied)) {
        subjectData[subject].lastStudied = session.created_at;
      }
    });

    // Convert to array and calculate averages
    const statsArray = Object.values(subjectData).map(stat => ({
      ...stat,
      avgTime: Math.round(stat.totalTime / stat.sessions)
    }));

    // Sort by total time (most studied first)
    statsArray.sort((a, b) => b.totalTime - a.totalTime);

    setSubjectStats(statsArray);
  };

  const calculateStats = (sessions) => {
    console.log('Calculating stats from', sessions?.length || 0, 'sessions');
    
    if (!sessions || sessions.length === 0) {
      console.log('No sessions found, setting default stats');
      setStats({
        todayTime: 0,
        todayTimeFormatted: '0m',
        weeklyTime: 0,
        weeklyTimeFormatted: '0m',
        mostTimeSubject: '-',
        bestMonth: { month: 'This Month', value: 0, formatted: '0m' }
      });
      return;
    }

    // Calculate today's study time
    const today = new Date().toDateString();
    const todayMinutes = sessions
      .filter(s => new Date(s.created_at).toDateString() === today)
      .reduce((sum, s) => sum + (s.duration || 0), 0);

    // Calculate this week's study time
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekMinutes = sessions
      .filter(s => new Date(s.created_at) >= weekAgo)
      .reduce((sum, s) => sum + (s.duration || 0), 0);

    // Find most studied subject
    const subjectTotals = {};
    sessions.forEach(s => {
      if (s.subject) {
        subjectTotals[s.subject] = (subjectTotals[s.subject] || 0) + (s.duration || 0);
      }
    });
    const mostTimeSubject = Object.keys(subjectTotals).length > 0
      ? Object.entries(subjectTotals).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : '-';

    // Calculate best month (using weekly data for now)
    const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });

    const newStats = {
      todayTime: Math.round(todayMinutes / 60 * 10) / 10, // Round to 1 decimal
      todayTimeFormatted: formatTime(todayMinutes),
      weeklyTime: Math.round(weekMinutes / 60 * 10) / 10, // Round to 1 decimal
      weeklyTimeFormatted: formatTime(weekMinutes),
      mostTimeSubject,
      bestMonth: { 
        month: monthName, 
        value: Math.round(weekMinutes / 60 * 10) / 10,
        formatted: formatTime(weekMinutes)
      }
    };
    
    console.log('New stats calculated:', newStats);
    setStats(newStats);
  };

  // Detailed stats calculation functions
  const getTodayDetails = () => {
    console.log('=== getTodayDetails called ===');
    console.log('studySessions:', studySessions?.length || 0);
    
    if (!studySessions || studySessions.length === 0) {
      console.log('No studySessions available');
      return null;
    }
    
    const today = new Date().toDateString();
    console.log('Today date string:', today);
    
    const todaySessions = studySessions.filter(s => {
      const sessionDate = new Date(s.created_at).toDateString();
      console.log('Session date:', sessionDate, 'matches today:', sessionDate === today);
      return sessionDate === today;
    });
    
    console.log('Today sessions found:', todaySessions.length);
    
    const totalMinutes = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const subjects = [...new Set(todaySessions.map(s => s.subject))];
    const avgSessionLength = todaySessions.length > 0 ? 
      Math.round(totalMinutes / todaySessions.length) : 0;
    
    // Calculate daily average for comparison
    const allDays = [...new Set(studySessions.map(s => 
      new Date(s.created_at).toDateString()
    ))];
    const dailyAvg = allDays.length > 0 ? 
      Math.round((studySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / allDays.length)) : 0;
    
    return {
      sessions: todaySessions,
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      sessionCount: todaySessions.length,
      subjects,
      avgSessionLength,
      dailyAvg,
      comparedToAvg: totalMinutes - dailyAvg
    };
  };

  const getWeekDetails = () => {
    if (!studySessions || studySessions.length === 0) return null;
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSessions = studySessions.filter(s => 
      new Date(s.created_at) >= weekAgo
    );
    
    const totalMinutes = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const subjects = [...new Set(weekSessions.map(s => s.subject))];
    
    // Daily breakdown for this week
    const dailyBreakdown = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      const dateString = date.toDateString();
      
      const dayMinutes = weekSessions
        .filter(s => new Date(s.created_at).toDateString() === dateString)
        .reduce((sum, s) => sum + (s.duration || 0), 0);
      
      dailyBreakdown[dayName] = {
        minutes: dayMinutes,
        hours: Math.round(dayMinutes / 60 * 10) / 10,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    }
    
    return {
      sessions: weekSessions,
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      sessionCount: weekSessions.length,
      subjects,
      dailyBreakdown,
      avgDaily: Math.round(totalMinutes / 7 * 10) / 10
    };
  };

  const getMonthlyDetails = () => {
    if (!studySessions || studySessions.length === 0) return null;
    
    // Group sessions by month
    const monthlyData = {};
    
    studySessions.forEach(session => {
      const date = new Date(session.created_at);
      const monthKey = date.getFullYear() + '-' + (date.getMonth() + 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          name: monthName,
          minutes: 0,
          sessions: 0,
          subjects: new Set()
        };
      }
      
      monthlyData[monthKey].minutes += session.duration || 0;
      monthlyData[monthKey].sessions += 1;
      monthlyData[monthKey].subjects.add(session.subject);
    });
    
    // Convert to array and sort by month
    const monthlyArray = Object.entries(monthlyData).map(([key, data]) => ({
      key,
      name: data.name,
      minutes: data.minutes,
      hours: Math.round(data.minutes / 60 * 10) / 10,
      sessions: data.sessions,
      subjects: Array.from(data.subjects)
    })).sort((a, b) => b.key.localeCompare(a.key)); // Most recent first
    
    const bestMonth = monthlyArray.length > 0 ? 
      monthlyArray.reduce((best, current) => 
        current.minutes > best.minutes ? current : best
      ) : null;
    
    return {
      monthlyBreakdown: monthlyArray,
      bestMonth,
      totalMonths: monthlyArray.length,
      avgMonthly: monthlyArray.length > 0 ? 
        Math.round((monthlyArray.reduce((sum, m) => sum + m.minutes, 0) / monthlyArray.length) / 60 * 10) / 10 : 0
    };
  };

  // Recalculate stats when study sessions change
  useEffect(() => {
    if (studySessions && studySessions.length > 0) {
      calculateStats(studySessions);
      calculateSubjectStats(studySessions);
    }
  }, [studySessions]);

  useEffect(() => {
    let interval;
    if (isStudying) {
      interval = setInterval(() => {
        setStudyTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStudying]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showSidebar ? 0 : -250,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showSidebar]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showSidebar) {
        setShowSidebar(false);
        return true;
      }
      return true; // Prevent back navigation from dashboard
    });

    return () => backHandler.remove();
  }, [showSidebar]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleStudying = async () => {
    if (isStudying && studyTime > 60) {
      // Stopping - save the session
      try {
        const duration = Math.floor(studyTime / 60); // Convert seconds to minutes
        const response = await fetch(`${BASE_URL}/api/study-sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user?.id,
            subject: currentSubject || 'General Study', // Use selected subject
            duration: duration,
            focus_level: 4, // Default focus level
            difficulty: 3, // Default difficulty
            notes: `Timed study session of ${duration} minutes`
          }),
        });

        const data = await response.json();
        if (data.success) {
          // Refresh sessions
          fetchStudySessions(user.id);
        }
      } catch (error) {
        console.error('Error saving study session:', error);
      }
      
      // Reset timer and subject
      setStudyTime(0);
      setCurrentSubject('');
    }
    
    setIsStudying(!isStudying);
  };

  const resetTimer = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    setStudyTime(0);
    setIsStudying(false);
    setCurrentSubject('');
    setShowResetModal(false);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
      router.replace('/');
    }
  };

  const handleNewGroup = () => {
    setShowNewGroupModal(true);
  };

  const createNewGroup = async () => {
    if (newGroupName.trim()) {
      try {
        // Create group via backend API
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/study-groups`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newGroupName,
            creator_id: user?.id,
            description: 'Study group created from mobile app',
            location: 'Remote',
            tags: ['Personal']
          })
        });

        if (response.ok) {
          const data = await response.json();
          // Reload groups to get updated list from backend
          await loadStudyGroups();
          setShowNewGroupModal(false);
          setNewGroupName('');
        } else {
          const error = await response.json();
          Alert.alert('Error', error.error || 'Failed to create study group');
        }
      } catch (error) {
        console.error('Error creating study group:', error);
        Alert.alert('Error', 'Network error. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Please enter a group name');
    }
  };

  const startStudyingWithSubject = () => {
    setShowSubjectModal(true);
  };

  const selectSubject = (subject) => {
    setCurrentSubject(subject);
    setCustomSubject('');
    setShowSubjectModal(false);
    if (!isStudying) {
      setIsStudying(true);
    }
  };

  const selectCustomSubject = () => {
    if (customSubject.trim()) {
      setCurrentSubject(customSubject);
      setShowSubjectModal(false);
      if (!isStudying) {
        setIsStudying(true);
      }
      setCustomSubject('');
    }
  };

  const showTodaySessions = () => {
    setSessionFilter('today');
    setSessionsModalTitle("Today's Study Sessions");
    setShowSessionsModal(true);
  };

  const showWeeklySessions = () => {
    setSessionFilter('week');
    setSessionsModalTitle("This Week's Study Sessions");
    setShowSessionsModal(true);
  };

  const showSubjectBreakdownModal = () => {
    setShowSubjectBreakdown(true);
  };

  const showAllSessions = () => {
    setSessionFilter('monthly');
    setSessionsModalTitle('Monthly Study Overview');
    setShowSessionsModal(true);
  };

  const getFilteredSessions = () => {
    console.log('=== getFilteredSessions ===');
    console.log('Total sessions:', studySessions?.length || 0);
    console.log('Session filter:', sessionFilter);
    
    if (!studySessions || studySessions.length === 0) {
      console.log('No study sessions available');
      return [];
    }

    const now = new Date();
    const today = now.toDateString();

    if (sessionFilter === 'today') {
      const filtered = studySessions.filter(session => {
        const sessionDate = new Date(session.created_at).toDateString();
        return sessionDate === today;
      });
      console.log('Today sessions:', filtered.length);
      return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sessionFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const filtered = studySessions.filter(session => 
        new Date(session.created_at) >= weekAgo
      );
      console.log('Week sessions:', filtered.length);
      return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sessionFilter === 'monthly') {
      // Group by month for monthly overview
      console.log('Monthly overview:', studySessions.length);
      return studySessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    console.log('All sessions:', studySessions.length);
    return studySessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const showStatsDetails = () => {
    setShowStatsModal(true);
  };

  const showDetailedStats = () => {
    setShowStatsModal(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E3F2FD" />
      
      {/* Sidebar Menu */}
      {showSidebar && (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={toggleSidebar}
        />
      )}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <View style={styles.sidebarProfile}>
            <Ionicons name="person-circle" size={50} color="#667EEA" />
            <View style={styles.sidebarUserInfo}>
              <Text style={styles.sidebarUserName}>{user?.username || 'User'}</Text>
              <Text style={styles.sidebarUserEmail}>{user?.email || 'email@example.com'}</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.sidebarItem} onPress={toggleSidebar}>
          <Ionicons name="home" size={20} color="#667EEA" />
          <Text style={styles.sidebarItemText}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sidebarItem} onPress={() => {
          toggleSidebar();
          router.push('/groups');
        }}>
          <Ionicons name="people" size={20} color="#666" />
          <Text style={styles.sidebarItemText}>Study Groups</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sidebarItem} onPress={() => {
          toggleSidebar();
          setShowSessionsModal(true);
        }}>
          <Ionicons name="checkmark-circle" size={20} color="#666" />
          <Text style={styles.sidebarItemText}>Study Sessions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sidebarItem} onPress={() => {
          toggleSidebar();
          showDetailedStats();
        }}>
          <Ionicons name="bar-chart" size={20} color="#666" />
          <Text style={styles.sidebarItemText}>Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={() => { toggleSidebar(); router.push('/ai-chat'); }}>
          <Ionicons name="sparkles" size={20} color="#667EEA" />
          <Text style={[styles.sidebarItemText, { color: '#667EEA' }]}>AI Study Coach</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={() => { toggleSidebar(); router.push('/reminders'); }}>
          <Ionicons name="notifications" size={20} color="#667EEA" />
          <Text style={[styles.sidebarItemText, { color: '#667EEA' }]}>Reminders & Alarms</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sidebarItem} onPress={() => {
          toggleSidebar();
          setShowProfileModal(true);
        }}>
          <Ionicons name="person" size={20} color="#666" />
          <Text style={styles.sidebarItemText}>Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sidebarItem} onPress={() => {
          toggleSidebar();
          router.push('/settings');
        }}>
          <Ionicons name="settings" size={20} color="#666" />
          <Text style={styles.sidebarItemText}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sidebarItemLogout} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <Text style={styles.sidebarItemTextLogout}>Log Out</Text>
        </TouchableOpacity>
      </Animated.View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={toggleSidebar}>
              <Ionicons name="menu" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileCircle} onPress={() => setShowProfileModal(true)}>
              <Ionicons name="person" size={20} color="#667EEA" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.date}>
            {currentDate.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
          <Text style={styles.greeting}>Hello {user?.username || 'there'}!</Text>
          
          <TouchableOpacity 
            style={styles.startButton}
            onPress={startStudyingWithSubject}
          >
            <Text style={styles.startButtonText}>
              {isStudying ? `Studying: ${currentSubject || 'General'} →` : 'Start Studying →'}
            </Text>
          </TouchableOpacity>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <TouchableOpacity style={styles.statBox} onPress={showTodaySessions}>
              <Text style={styles.statLabel}>Today's</Text>
              <Text style={styles.statLabel}>Study Time</Text>
              <Text style={styles.statValue}>{stats.todayTimeFormatted}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statBox} onPress={showWeeklySessions}>
              <Text style={styles.statLabel}>Weekly</Text>
              <Text style={styles.statLabel}>Study Time</Text>
              <Text style={styles.statValue}>{stats.weeklyTimeFormatted}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statBox} onPress={showSubjectBreakdownModal}>
              <Text style={styles.statLabel}>Most Time</Text>
              <Text style={styles.statLabel}>Spent on</Text>
              <Text style={styles.statSubjectValue} numberOfLines={1} adjustsFontSizeToFit>{stats.mostTimeSubject}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statBox} onPress={showAllSessions}>
              <Text style={styles.statLabel}>Your Best</Text>
              <Text style={styles.statLabel}>Month</Text>
              <Text style={styles.statValue}>{stats.bestMonth.formatted}</Text>
              <Text style={styles.statMonth}>{stats.bestMonth.month}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <TouchableOpacity onPress={showDetailedStats}>
              <Text style={styles.detailsLink}>Details</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chartPlaceholder}>
            <View style={styles.chartBars}>
              {[3, 5, 2, 4, 6, 3, 4, 5].map((height, index) => (
                <View key={index} style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { height: height * 15 },
                      index % 2 === 0 ? styles.barBlue : styles.barRed
                    ]} 
                  />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* AI Features Section */}
        <View style={styles.aiSection}>
          <Text style={styles.sectionTitle}>AI Features</Text>
          <View style={styles.aiCardRow}>
            <TouchableOpacity style={styles.aiCard} onPress={() => router.push('/ai-chat')}>
              <View style={styles.aiCardIcon}>
                <Ionicons name="sparkles" size={22} color="#667EEA" />
              </View>
              <View style={styles.aiCardInfo}>
                <Text style={styles.aiCardTitle}>AI Study Coach</Text>
                <Text style={styles.aiCardDesc}>Get personalized study help</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.aiCard} onPress={() => router.push('/reminders')}>
              <View style={styles.aiCardIcon}>
                <Ionicons name="notifications" size={22} color="#667EEA" />
              </View>
              <View style={styles.aiCardInfo}>
                <Text style={styles.aiCardTitle}>Reminders & Alarms</Text>
                <Text style={styles.aiCardDesc}>Stay on top of your schedule</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
          </View>
          <Text style={styles.aiQuickLabel}>Quick Ask</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.aiQuickScroll}>
            {['Make me a study plan', 'Focus tips', 'Memory techniques', 'Beat procrastination'].map((q, i) => (
              <TouchableOpacity key={i} style={styles.aiQuickChip} onPress={() => router.push({ pathname: '/ai-chat', params: { prefill: q } })}>
                <Text style={styles.aiQuickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Timer Section */}
        <View style={styles.timerSection}>
          {currentSubject && isStudying && (
            <View style={styles.currentSubjectBadge}>
              <Ionicons name="book" size={16} color="#667EEA" />
              <Text style={styles.currentSubjectText}>{currentSubject}</Text>
            </View>
          )}
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{formatTime(studyTime)}</Text>
          </View>
          <View style={styles.timerControls}>
            <TouchableOpacity style={styles.timerButton} onPress={resetTimer}>
              <Ionicons name="refresh" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.timerPlayButton}
              onPress={toggleStudying}
            >
              <Ionicons 
                name={isStudying ? "pause" : "play"} 
                size={24} 
                color="#333" 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.timerButton} onPress={startStudyingWithSubject}>
              <Ionicons name="list" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          {isStudying && (
            <TouchableOpacity style={styles.stopButton} onPress={toggleStudying}>
              <Text style={styles.stopButtonText}>Stop Studying</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Study Groups Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Study Groups</Text>
            <TouchableOpacity onPress={handleNewGroup}>
              <Text style={styles.newLink}>+ New</Text>
            </TouchableOpacity>
          </View>
          
          {studyGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No study groups yet</Text>
              <Text style={styles.emptyStateSubtext}>Create your first study group to get started!</Text>
            </View>
          ) : (
            studyGroups.map((group) => (
              <TouchableOpacity 
                key={group.id} 
                style={styles.groupCard}
                onPress={() => loadGroupDetails(group)}
              >
                <View style={styles.groupHeader}>
                  <View style={styles.groupLabels}>
                    {group.tags.map((tag, idx) => (
                      <Text key={idx} style={styles.groupLabel}>{tag}</Text>
                    ))}
                  </View>
                </View>
                <Text style={styles.groupDate}>Created On {group.createdDate}</Text>
                <Text style={styles.groupName}>{group.name}</Text>
                <View style={styles.groupStats}>
                  <View style={styles.groupStat}>
                    <Text style={styles.groupStatLabel}>Members</Text>
                    <Text style={styles.groupStatValue}>{group.members} People</Text>
                  </View>
                  <View style={styles.groupStat}>
                    <Text style={styles.groupStatLabel}>Total Hours</Text>
                    <Text style={styles.groupStatValue}>{group.totalHours} hrs</Text>
                  </View>
                </View>
                <View style={styles.groupFooter}>
                  <View>
                    <View style={styles.creatorInfo}>
                      <Ionicons name="person-circle-outline" size={16} color="#666" />
                      <Text style={styles.creatorLabel}>Creator</Text>
                    </View>
                    <Text style={styles.creatorValue}>{group.creator}</Text>
                  </View>
                  <View>
                    <View style={styles.creatorInfo}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.creatorLabel}>Located in</Text>
                    </View>
                    <Text style={styles.creatorValue}>{group.location}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Studment CTA */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Studment.</Text>
            <Text style={styles.ctaText}>Let's Go To</Text>
            <Text style={styles.ctaText}>Track Your</Text>
            <Text style={styles.ctaHighlight}>Study Time.</Text>
          </View>
        </View>
      </ScrollView>

      {/* New Group Modal */}
      <Modal
        visible={showNewGroupModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNewGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Study Group</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Group Name"
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowNewGroupModal(false);
                  setNewGroupName('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonCreate}
                onPress={createNewGroup}
              >
                <Text style={styles.modalButtonCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subject Selection Modal */}
      <Modal
        visible={showSubjectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Study Subject</Text>
            
            <ScrollView style={styles.subjectList}>
              {['Mathematics', 'Science', 'English', 'History', 'Programming', 'Languages', 'Arts', 'Music'].map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={styles.subjectOption}
                  onPress={() => selectSubject(subject)}
                >
                  <Ionicons name="book-outline" size={20} color="#667EEA" />
                  <Text style={styles.subjectOptionText}>{subject}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.customSubjectContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="Or enter custom subject..."
                value={customSubject}
                onChangeText={setCustomSubject}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => setShowSubjectModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={selectCustomSubject}
              >
                <Ionicons name="checkmark" size={18} color="#fff" style={{marginRight: 5}} />
                <Text style={styles.modalButtonPrimaryText}>Start Studying</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Statistics Modal */}
      <Modal
        visible={showStatsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.statsModalContent}>
            <View style={styles.statsModalHeader}>
              <Ionicons name="bar-chart" size={32} color="#667EEA" />
              <Text style={styles.statsModalTitle}>Statistics Details</Text>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statsCard}>
                <Ionicons name="today" size={24} color="#667EEA" />
                <Text style={styles.statsCardLabel}>Today's Study Time</Text>
                <Text style={styles.statsCardValue}>{stats.todayTimeFormatted}</Text>
              </View>
              
              <View style={styles.statsCard}>
                <Ionicons name="calendar" size={24} color="#667EEA" />
                <Text style={styles.statsCardLabel}>Weekly Study Time</Text>
                <Text style={styles.statsCardValue}>{stats.weeklyTimeFormatted}</Text>
              </View>
              
              <View style={styles.statsCard}>
                <Ionicons name="book" size={24} color="#667EEA" />
                <Text style={styles.statsCardLabel}>Most Studied</Text>
                <Text style={styles.statsCardValue}>{stats.mostTimeSubject}</Text>
              </View>
              
              <View style={styles.statsCard}>
                <Ionicons name="school" size={24} color="#667EEA" />
                <Text style={styles.statsCardLabel}>Total Sessions</Text>
                <Text style={styles.statsCardValue}>{studySessions.length}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.subjectBreakdownButton}
              onPress={() => {
                setShowStatsModal(false);
                setShowSubjectBreakdown(true);
              }}
            >
              <Ionicons name="list-outline" size={18} color="#667EEA" />
              <Text style={styles.subjectBreakdownButtonText}>View Subject Breakdown</Text>
            </TouchableOpacity>

            <Text style={styles.encouragementText}>Keep up the great work! 📚</Text>
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowStatsModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reset Timer Confirmation Modal */}
      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <Ionicons name="alert-circle" size={64} color="#FFA500" />
            <Text style={styles.confirmModalTitle}>Reset Timer?</Text>
            <Text style={styles.confirmModalText}>
              Are you sure you want to reset the timer? {studyTime > 60 ? 'Your current session will not be saved.' : ''}
            </Text>
            
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                style={styles.confirmCancelButton}
                onPress={() => setShowResetModal(false)}
              >
                <Text style={styles.confirmCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmResetButton}
                onPress={confirmReset}
              >
                <Text style={styles.confirmResetButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Study Sessions History Modal */}
      <Modal
        visible={showSessionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSessionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sessionsModalContent}>
            <View style={styles.sessionsModalHeader}>
              <View>
                <Text style={styles.sessionsModalTitle}>{sessionsModalTitle}</Text>
                <Text style={styles.sessionCountText}>
                  {(() => {
                    const count = getFilteredSessions().length;
                    return count === 0 ? 'No sessions' : `${count} session${count === 1 ? '' : 's'}`;
                  })()}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSessionsModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.sessionsList} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{paddingBottom: 20}}
            >
              {(() => {
                const filteredSessions = getFilteredSessions();
                console.log('=== MODAL RENDERING ===');
                console.log('Session filter:', sessionFilter);
                console.log('Filtered sessions count:', filteredSessions.length);
                console.log('StudySessions in state:', studySessions?.length || 0);
                
                // Render detailed content based on filter type
                if (sessionFilter === 'today') {
                  const todayDetails = getTodayDetails();
                  console.log('Today details:', todayDetails);
                  
                  if (!todayDetails || todayDetails.sessions.length === 0) {
                    console.log('Showing empty state for today');
                    return (
                      <View style={styles.emptySessionsView}>
                        <Ionicons name="sunny-outline" size={64} color="#ccc" />
                        <Text style={styles.emptySessionsText}>No study sessions today</Text>
                        <Text style={styles.emptySessionsSubtext}>Start studying to track today's progress!</Text>
                        <Text style={styles.debugText}>Debug: {studySessions?.length || 0} total sessions in database</Text>
                      </View>
                    );
                  }
                  
                  console.log('Rendering', todayDetails.sessions.length, "today's sessions");
                  
                  return (
                    <>
                      {/* Today's Summary */}
                      <View style={styles.detailsSummaryCard}>
                        <View style={styles.summaryRow}>
                          <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total Time</Text>
                            <Text style={styles.summaryValue}>{todayDetails.totalHours}h</Text>
                          </View>
                          <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Sessions</Text>
                            <Text style={styles.summaryValue}>{todayDetails.sessionCount}</Text>
                          </View>
                          <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Avg Length</Text>
                            <Text style={styles.summaryValue}>{todayDetails.avgSessionLength}m</Text>
                          </View>
                        </View>
                        
                        <View style={styles.comparisonRow}>
                          <Text style={styles.comparisonLabel}>
                            {todayDetails.comparedToAvg >= 0 ? '↗️' : '↘️'} 
                            {Math.abs(todayDetails.comparedToAvg)}m vs daily avg
                          </Text>
                        </View>
                        
                        <View style={styles.subjectsRow}>
                          <Text style={styles.subjectsLabel}>Subjects studied:</Text>
                          <Text style={styles.subjectsValue}>{todayDetails.subjects.join(', ') || 'None'}</Text>
                        </View>
                      </View>
                      
                      {/* Today's Sessions List */}
                      <Text style={styles.sectionTitle}>Today's Sessions ({todayDetails.sessions.length})</Text>
                      {todayDetails.sessions.map((session, index) => {
                        console.log('Rendering session', index, ':', session.subject);
                        return (
                        <View key={session.id || index} style={styles.sessionItem}>
                          {/* Main Session Row */}
                          <View style={styles.sessionItemRow}>
                            <View style={styles.sessionIcon}>
                              <Ionicons name="book" size={20} color="#667EEA" />
                            </View>
                            <View style={styles.sessionDetails}>
                              <Text style={styles.sessionSubject}>{session.subject || 'Unknown'}</Text>
                              <Text style={styles.sessionDate}>
                                {new Date(session.created_at).toLocaleTimeString('en-US', { 
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                              {/* Show basic info first for debugging */}
                              <View style={styles.sessionMeta}>
                                <Text style={styles.sessionMetaText}>
                                  Difficulty: {session.difficulty || 'N/A'} | Focus: {session.focus_level || 'N/A'}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.sessionDurationContainer}>
                              <Text style={styles.sessionDuration}>{formatTime(session.duration || 0)}</Text>
                            </View>
                          </View>
                          
                          {/* ENHANCED SESSION ANALYTICS - Full width below */}
                          <View style={styles.enhancedSessionDetails}>
                            <View style={styles.sessionAnalytics}>
                                {/* Difficulty Stars - Always show */}
                                <View style={styles.analyticsRow}>
                                  <Text style={styles.analyticsLabel}>Difficulty</Text>
                                  <View style={styles.ratingStars}>
                                    {[...Array(5)].map((_, i) => (
                                      <Text key={i} style={[styles.star, { 
                                        color: i < (session.difficulty || 0) ? '#FFD700' : '#DDD',
                                        fontSize: 14,
                                        marginHorizontal: 1
                                      }]}>★</Text>
                                    ))}
                                  </View>
                                  <Text style={styles.analyticsValue}>{session.difficulty || 0}/5</Text>
                                </View>
                                
                                {/* Focus Circles - Always show */}
                                <View style={styles.analyticsRow}>
                                  <Text style={styles.analyticsLabel}>Focus</Text>
                                  <View style={styles.ratingStars}>
                                    {[...Array(5)].map((_, i) => (
                                      <Text key={i} style={[styles.star, { 
                                        color: i < (session.focus_level || 0) ? '#4CAF50' : '#DDD',
                                        fontSize: 14,
                                        marginHorizontal: 1
                                      }]}>●</Text>
                                    ))}
                                  </View>
                                  <Text style={styles.analyticsValue}>{session.focus_level || 0}/5</Text>
                                </View>
                                
                                {/* Study Effectiveness */}
                                <View style={styles.sessionInsights}>
                                  <Text style={styles.insightLabel}>Study Effectiveness</Text>
                                  <Text style={styles.insightValue}>
                                    {(() => {
                                      const effectiveness = ((session.difficulty || 2.5) + (session.focus_level || 2.5)) / 2;
                                      if (effectiveness >= 4) return '🔥 Excellent';
                                      if (effectiveness >= 3) return '✅ Good';
                                      if (effectiveness >= 2) return '📚 Average';
                                      return '💪 Needs Focus';
                                    })()} 
                                  </Text>
                                </View>
                                
                                {/* Session Timing */}
                                <View style={styles.sessionTiming}>
                                  <Text style={styles.timingLabel}>Session Time</Text>
                                  <Text style={styles.timingValue}>
                                    {new Date(session.created_at).toLocaleTimeString('en-US', { 
                                      hour: 'numeric', minute: '2-digit' 
                                    })}
                                  </Text>
                                </View>
                              </View>
                            </View>
                        </View>
                        );
                      })}
                    </>
                  );
                } else if (sessionFilter === 'week') {
                  const weekDetails = getWeekDetails();
                  if (!weekDetails || weekDetails.sessions.length === 0) {
                    return (
                      <View style={styles.emptySessionsView}>
                        <Ionicons name="calendar-outline" size={64} color="#ccc" />
                        <Text style={styles.emptySessionsText}>No study sessions this week</Text>
                        <Text style={styles.emptySessionsSubtext}>Study this week to see your progress!</Text>
                      </View>
                    );
                  }
                  
                  return (
                    <>
                      {/* Week Summary */}
                      <View style={styles.detailsSummaryCard}>
                        <View style={styles.summaryRow}>
                          <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total Time</Text>
                            <Text style={styles.summaryValue}>{weekDetails.totalHours}h</Text>
                          </View>
                          <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Sessions</Text>
                            <Text style={styles.summaryValue}>{weekDetails.sessionCount}</Text>
                          </View>
                          <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Daily Avg</Text>
                            <Text style={styles.summaryValue}>{weekDetails.avgDaily}h</Text>
                          </View>
                        </View>
                        
                        <View style={styles.subjectsRow}>
                          <Text style={styles.subjectsLabel}>Subjects this week:</Text>
                          <Text style={styles.subjectsValue}>{weekDetails.subjects.join(', ') || 'None'}</Text>
                        </View>
                      </View>
                      
                      {/* Daily Breakdown */}
                      <Text style={styles.sectionTitle}>Daily Breakdown</Text>
                      {Object.entries(weekDetails.dailyBreakdown).map(([day, data]) => (
                        <View key={day} style={styles.dailyBreakdownItem}>
                          <View style={styles.dayInfo}>
                            <Text style={styles.dayName}>{day}</Text>
                            <Text style={styles.dayDate}>{data.date}</Text>
                          </View>
                          <View style={styles.dayStats}>
                            <Text style={styles.dayHours}>{data.hours}h</Text>
                            <View style={[styles.progressBar, {width: Math.min(data.hours * 20, 100)}]} />
                          </View>
                        </View>
                      ))}
                      
                      {/* Week Sessions List */}
                      <Text style={styles.sectionTitle}>All Sessions This Week</Text>
                      {weekDetails.sessions.map((session, index) => (
                        <View key={session.id || index} style={styles.sessionItem}>
                          {/* Main Session Row */}
                          <View style={styles.sessionItemRow}>
                            <View style={styles.sessionIcon}>
                              <Ionicons name="book" size={20} color="#667EEA" />
                            </View>
                            <View style={styles.sessionDetails}>
                              <Text style={styles.sessionSubject}>{session.subject || 'Unknown'}</Text>
                              <Text style={styles.sessionDate}>
                                {new Date(session.created_at).toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                            </View>
                            <View style={styles.sessionDurationContainer}>
                              <Text style={styles.sessionDuration}>{formatTime(session.duration || 0)}</Text>
                            </View>
                          </View>
                          
                          {/* WEEKLY ENHANCED ANALYTICS - Full width below */}
                          <View style={styles.weeklySessionDetails}>
                              <View style={styles.sessionScoreCard}>
                                {/* Difficulty Progress Bar - Always show */}
                                <View style={styles.scoreItem}>
                                  <Text style={styles.scoreLabel}>Difficulty</Text>
                                  <View style={styles.scoreBar}>
                                    <View style={[styles.scoreBarFill, { 
                                      width: `${((session.difficulty || 0)  / 5) * 100}%`,
                                      backgroundColor: '#FF6B6B'
                                    }]} />
                                  </View>
                                  <Text style={styles.scoreValue}>{session.difficulty || 0}/5</Text>
                                </View>
                                
                                {/* Focus Progress Bar - Always show */}
                                <View style={styles.scoreItem}>
                                  <Text style={styles.scoreLabel}>Focus</Text>
                                  <View style={styles.scoreBar}>
                                    <View style={[styles.scoreBarFill, { 
                                      width: `${((session.focus_level || 0) / 5) * 100}%`,
                                      backgroundColor: '#4ECDC4'
                                    }]} />
                                  </View>
                                  <Text style={styles.scoreValue}>{session.focus_level || 0}/5</Text>
                                </View>
                                
                                {/* Day Context */}
                                <View style={styles.sessionContext}>
                                  <Text style={styles.contextLabel}>Day</Text>
                                  <Text style={styles.contextValue}>
                                    {new Date(session.created_at).toLocaleDateString('en-US', { weekday: 'short' })}
                                  </Text>
                                </View>
                                
                                {/* Productivity Badge */}
                                <View style={styles.productivityBadge}>
                                  <Text style={styles.productivityText}>
                                    {session.duration >= 60 ? '🏆 Long' : session.duration >= 30 ? '✨ Med' : '⚡ Quick'}
                                  </Text>
                                </View>
                              </View>
                            </View>
                        </View>
                      ))}
                    </>
                  );
                } else if (sessionFilter === 'monthly') {
                  const monthlyDetails = getMonthlyDetails();
                  if (!monthlyDetails || monthlyDetails.monthlyBreakdown.length === 0) {
                    return (
                      <View style={styles.emptySessionsView}>
                        <Ionicons name="stats-chart-outline" size={64} color="#ccc" />
                        <Text style={styles.emptySessionsText}>No monthly data available</Text>
                        <Text style={styles.emptySessionsSubtext}>Study more to see monthly trends!</Text>
                      </View>
                    );
                  }
                  
                  return (
                    <>
                      {/* Monthly Overview */}
                      <View style={styles.detailsSummaryCard}>
                        <View style={styles.summaryRow}>
                          <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Best Month</Text>
                            <Text style={styles.summaryValue}>{monthlyDetails.bestMonth.hours}h</Text>
                            <Text style={styles.summarySubtext}>{monthlyDetails.bestMonth.name}</Text>
                          </View>
                          <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total Months</Text>
                            <Text style={styles.summaryValue}>{monthlyDetails.totalMonths}</Text>
                          </View>
                          <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Monthly Avg</Text>
                            <Text style={styles.summaryValue}>{monthlyDetails.avgMonthly}h</Text>
                          </View>
                        </View>
                      </View>
                      
                      {/* Monthly Breakdown */}
                      <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
                      {monthlyDetails.monthlyBreakdown.map((month, index) => (
                        <View key={month.key} style={[styles.monthlyBreakdownItem, 
                          month === monthlyDetails.bestMonth && styles.bestMonthItem]}>
                          <View style={styles.monthInfo}>
                            <Text style={styles.monthName}>{month.name}</Text>
                            {month === monthlyDetails.bestMonth && (
                              <Text style={styles.bestMonthBadge}>🏆 Best</Text>
                            )}
                            <Text style={styles.monthSubjects}>
                              {month.subjects.join(', ')}
                            </Text>
                          </View>
                          <View style={styles.monthStats}>
                            <Text style={styles.monthHours}>{month.hours}h</Text>
                            <Text style={styles.monthSessions}>{month.sessions} sessions</Text>
                          </View>
                        </View>
                      ))}
                    </>
                  );
                }
                
                // Default: All sessions (fallback)
                if (filteredSessions.length === 0) {
                  return (
                    <View style={styles.emptySessionsView}>
                      <Ionicons name="book-outline" size={64} color="#ccc" />
                      <Text style={styles.emptySessionsText}>No study sessions yet</Text>
                      <Text style={styles.emptySessionsSubtext}>Start studying to track your progress!</Text>
                    </View>
                  );
                }
                
                return (
                  <>
                    <View style={styles.sessionsSummary}>
                      <Text style={styles.sessionsSummaryText}>
                        Showing all {filteredSessions.length} study sessions (sorted by newest first)
                      </Text>
                    </View>
                    {filteredSessions.map((session, index) => (
                      <View key={session.id || index} style={styles.sessionItem}>
                        <View style={styles.sessionIcon}>
                          <Ionicons name="book" size={20} color="#667EEA" />
                        </View>
                        <View style={styles.sessionDetails}>
                          <Text style={styles.sessionSubject}>{session.subject || 'Unknown'}</Text>
                          <Text style={styles.sessionDate}>
                            {new Date(session.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                          {(session.difficulty || session.focus_level) && (
                            <View style={styles.sessionMeta}>
                              {session.difficulty && (
                                <Text style={styles.sessionMetaText}>
                                  Difficulty: {session.difficulty}/5
                                </Text>
                              )}
                              {session.focus_level && (
                                <Text style={styles.sessionMetaText}>
                                  Focus: {session.focus_level}/5
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                        <View style={styles.sessionDurationContainer}>
                          <Text style={styles.sessionDuration}>{formatTime(session.duration || 0)}</Text>
                          <View style={styles.comprehensiveSessionDetails}>
                            <View style={styles.studyQualityIndicrators}>
                              {session.difficulty && (
                                <View style={styles.qualityMetric}>
                                  <Text style={styles.qualityLabel}>Difficulty Level</Text>
                                  <View style={styles.qualityVisualization}>
                                    <View style={styles.difficultyScale}>
                                      {[1,2,3,4,5].map(level => (
                                        <View key={level} style={[
                                          styles.difficultyDot,
                                          { backgroundColor: level <= session.difficulty ? '#FF4757' : '#DDD' }
                                        ]} />
                                      ))}
                                    </View>
                                    <Text style={styles.qualityScore}>{session.difficulty}/5</Text>
                                  </View>
                                </View>
                              )}
                              {session.focus_level && (
                                <View style={styles.qualityMetric}>
                                  <Text style={styles.qualityLabel}>Focus Quality</Text>
                                  <View style={styles.qualityVisualization}>
                                    <View style={styles.focusScale}>
                                      {[1,2,3,4,5].map(level => (
                                        <View key={level} style={[
                                          styles.focusDot,
                                          { backgroundColor: level <= session.focus_level ? '#2ED573' : '#DDD' }
                                        ]} />
                                      ))}
                                    </View>
                                    <Text style={styles.qualityScore}>{session.focus_level}/5</Text>
                                  </View>
                                </View>
                              )}
                            </View>
                            <View style={styles.sessionPerformanceCard}>
                              <Text style={styles.performanceTitle}>Study Performance</Text>
                              <View style={styles.performanceMetrics}>
                                <View style={styles.performanceItem}>
                                  <Text style={styles.performanceLabel}>Duration Type</Text>
                                  <Text style={[styles.performanceValue, {
                                    color: session.duration >= 60 ? '#27AE60' : session.duration >= 30 ? '#F39C12' : '#E74C3C'
                                  }]}>
                                    {session.duration >= 60 ? 'Deep Study' : session.duration >= 30 ? 'Focused' : 'Quick Review'}
                                  </Text>
                                </View>
                                <View style={styles.performanceItem}>
                                  <Text style={styles.performanceLabel}>Study Score</Text>
                                  <Text style={styles.performanceValue}>
                                    {(() => {
                                      const score = ((session.difficulty || 2.5) + (session.focus_level || 2.5)) * (session.duration / 30) * 10;
                                      return Math.round(score);
                                    })()}pts
                                  </Text>
                                </View>
                                <View style={styles.performanceItem}>
                                  <Text style={styles.performanceLabel}>Time Started</Text>
                                  <Text style={styles.performanceValue}>
                                    {new Date(session.created_at).toLocaleTimeString('en-US', { 
                                      hour: 'numeric', minute: '2-digit' 
                                    })}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalContent}>
            <View style={styles.profileModalHeader}>
              <Text style={styles.profileModalTitle}>My Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileSection}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={64} color="#667EEA" />
              </View>
              
              <View style={styles.profileInfoCard}>
                <View style={styles.profileInfoRow}>
                  <Ionicons name="person-outline" size={20} color="#666" />
                  <View style={styles.profileInfoText}>
                    <Text style={styles.profileLabel}>Username</Text>
                    <Text style={styles.profileValue}>{user?.username || 'User'}</Text>
                  </View>
                </View>
                
                <View style={styles.profileInfoRow}>
                  <Ionicons name="mail-outline" size={20} color="#666" />
                  <View style={styles.profileInfoText}>
                    <Text style={styles.profileLabel}>Email</Text>
                    <Text style={styles.profileValue}>{user?.email || 'email@example.com'}</Text>
                  </View>
                </View>
                
                <View style={styles.profileInfoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <View style={styles.profileInfoText}>
                    <Text style={styles.profileLabel}>Member Since</Text>
                    <Text style={styles.profileValue}>
                      {user?.created_at 
                        ? new Date(user.created_at).toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })
                        : 'Recently'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.profileStats}>
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatValue}>{studySessions.length}</Text>
                  <Text style={styles.profileStatLabel}>Sessions</Text>
                </View>
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatValue}>{stats.weeklyTimeFormatted}</Text>
                  <Text style={styles.profileStatLabel}>Study Time</Text>
                </View>
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatValue}>{studyGroups.length}</Text>
                  <Text style={styles.profileStatLabel}>Groups</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subject Breakdown Modal */}
      <Modal
        visible={showSubjectBreakdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubjectBreakdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sessionsModalContent}>
            <View style={styles.sessionsModalHeader}>
              <View>
                <Text style={styles.sessionsModalTitle}>Subject Breakdown</Text>
                <Text style={styles.sessionCountText}>
                  {(() => {
                    const count = subjectStats.length;
                    return count === 0 ? 'No subjects' : `${count} subject${count === 1 ? '' : 's'} studied`;
                  })()}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSubjectBreakdown(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.sessionsList} showsVerticalScrollIndicator={true}>
              {(() => {
                console.log('Subject Breakdown - stats count:', subjectStats.length);
                
                if (subjectStats.length === 0) {
                  return (
                    <View style={styles.emptySessionsView}>
                      <Ionicons name="book-outline" size={64} color="#ccc" />
                      <Text style={styles.emptySessionsText}>No subjects studied yet</Text>
                      <Text style={styles.emptySessionsSubtext}>Start studying to see your subject stats!</Text>
                      <Text style={styles.debugText}>
                        Total sessions: {studySessions?.length || 0}
                      </Text>
                    </View>
                  );
                }
                
                return subjectStats.map((stat, index) => {
                  console.log('Rendering subject:', stat.subject, stat.totalTime, 'min');
                  return (
                    <View key={index} style={styles.subjectStatCard}>
                      <View style={styles.subjectStatHeader}>
                        <View style={styles.subjectStatIcon}>
                          <Ionicons name="book" size={24} color="#667EEA" />
                        </View>
                        <View style={styles.subjectStatInfo}>
                          <Text style={styles.subjectStatName}>{stat.subject}</Text>
                          <Text style={styles.subjectStatLastStudied}>
                            Last studied: {new Date(stat.lastStudied).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.subjectStatDetails}>
                        <View style={styles.subjectStatItem}>
                          <Ionicons name="time-outline" size={18} color="#666" />
                          <Text style={styles.subjectStatLabel}>Total: {formatTime(stat.totalTime)}</Text>
                        </View>
                        <View style={styles.subjectStatItem}>
                          <Ionicons name="calendar-outline" size={18} color="#666" />
                          <Text style={styles.subjectStatLabel}>{stat.sessions} sessions</Text>
                        </View>
                        <View style={styles.subjectStatItem}>
                          <Ionicons name="stats-chart-outline" size={18} color="#666" />
                          <Text style={styles.subjectStatLabel}>Avg: {formatTime(stat.avgTime)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                });
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Group Details Modal */}
      <Modal
        visible={showGroupDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGroupDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalContent}>
            <View style={styles.profileModalHeader}>
              <Text style={styles.profileModalTitle}>{selectedGroup?.name}</Text>
              <TouchableOpacity onPress={() => setShowGroupDetailsModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* Tab Navigation */}
            <View style={styles.tabNavigation}>
              <TouchableOpacity 
                style={[styles.tabButton, groupDetailsTab === 'overview' && styles.tabButtonActive]}
                onPress={() => setGroupDetailsTab('overview')}
              >
                <Text style={[styles.tabButtonText, groupDetailsTab === 'overview' && styles.tabButtonTextActive]}>
                  Overview
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabButton, groupDetailsTab === 'tasks' && styles.tabButtonActive]}
                onPress={() => setGroupDetailsTab('tasks')}
              >
                <Text style={[styles.tabButtonText, groupDetailsTab === 'tasks' && styles.tabButtonTextActive]}>
                  Tasks
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabButton, groupDetailsTab === 'files' && styles.tabButtonActive]}
                onPress={() => setGroupDetailsTab('files')}
              >
                <Text style={[styles.tabButtonText, groupDetailsTab === 'files' && styles.tabButtonTextActive]}>
                  Files
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabButton, groupDetailsTab === 'notes' && styles.tabButtonActive]}
                onPress={() => setGroupDetailsTab('notes')}
              >
                <Text style={[styles.tabButtonText, groupDetailsTab === 'notes' && styles.tabButtonTextActive]}>
                  Notes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabButton, groupDetailsTab === 'activities' && styles.tabButtonActive]}
                onPress={() => setGroupDetailsTab('activities')}
              >
                <Text style={[styles.tabButtonText, groupDetailsTab === 'activities' && styles.tabButtonTextActive]}>
                  Activity
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <ScrollView style={styles.tabContent}>
              {/* Overview Tab */}
              {groupDetailsTab === 'overview' && (
                <View>
                  <View style={styles.groupDetailSection}>
                    <Text style={styles.groupDetailLabel}>Description</Text>
                    <Text style={styles.groupDetailValue}>{selectedGroup?.description || 'No description'}</Text>
                  </View>
                  
                  <View style={styles.groupDetailSection}>
                    <Text style={styles.groupDetailLabel}>Location</Text>
                    <View style={styles.groupDetailRow}>
                      <Ionicons name="location" size={18} color="#667EEA" />
                      <Text style={styles.groupDetailValue}>{selectedGroup?.location || 'Online'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.groupDetailSection}>
                    <Text style={styles.groupDetailLabel}>Stats</Text>
                    <View style={styles.groupStatsRow}>
                      <View style={styles.groupStatBox}>
                        <Text style={styles.groupStatNumber}>{selectedGroup?.member_count || 0}</Text>
                        <Text style={styles.groupStatText}>Members</Text>
                      </View>
                      <View style={styles.groupStatBox}>
                        <Text style={styles.groupStatNumber}>{selectedGroup?.total_hours || 0}</Text>
                        <Text style={styles.groupStatText}>Total Hours</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.groupDetailSection}>
                    <Text style={styles.groupDetailLabel}>Tags</Text>
                    <View style={styles.groupTagsContainer}>
                      {(selectedGroup?.tags || ['Personal']).map((tag, idx) => (
                        <View key={idx} style={styles.groupTag}>
                          <Text style={styles.groupTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {/* Tasks Tab */}
              {groupDetailsTab === 'tasks' && (
                <View>
                  {groupTasks.length === 0 ? (
                    <View style={styles.emptyTabView}>
                      <Ionicons name="checkbox-outline" size={64} color="#ccc" />
                      <Text style={styles.emptyTabText}>No tasks yet</Text>
                      <Text style={styles.emptyTabSubtext}>Create tasks to organize your group work</Text>
                    </View>
                  ) : (
                    groupTasks.map((task, index) => (
                      <View key={task.id || index} style={styles.taskCard}>
                        <View style={styles.taskHeader}>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                          <View style={[styles.taskStatusBadge, 
                            task.status === 'completed' && styles.taskStatusCompleted,
                            task.status === 'in_progress' && styles.taskStatusProgress,
                            task.status === 'pending' && styles.taskStatusPending
                          ]}>
                            <Text style={styles.taskStatusText}>{task.status}</Text>
                          </View>
                        </View>
                        {task.description && (
                          <Text style={styles.taskDescription}>{task.description}</Text>
                        )}
                        <View style={styles.taskFooter}>
                          <View style={styles.taskMeta}>
                            <Ionicons name="alert-circle-outline" size={14} color="#666" />
                            <Text style={styles.taskMetaText}>{task.priority}</Text>
                          </View>
                          {task.due_date && (
                            <View style={styles.taskMeta}>
                              <Ionicons name="calendar-outline" size={14} color="#666" />
                              <Text style={styles.taskMetaText}>
                                {new Date(task.due_date).toLocaleDateString()}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* Files Tab */}
              {groupDetailsTab === 'files' && (
                <View>
                  {groupFiles.length === 0 ? (
                    <View style={styles.emptyTabView}>
                      <Ionicons name="document-outline" size={64} color="#ccc" />
                      <Text style={styles.emptyTabText}>No files yet</Text>
                      <Text style={styles.emptyTabSubtext}>Share files with your group members</Text>
                    </View>
                  ) : (
                    groupFiles.map((file, index) => (
                      <View key={file.id || index} style={styles.fileCard}>
                        <View style={styles.fileIcon}>
                          <Ionicons 
                            name={
                              file.file_type === 'pdf' ? 'document-text' :
                              file.file_type === 'image' ? 'image' :
                              file.file_type === 'video' ? 'videocam' :
                              'document'
                            } 
                            size={24} 
                            color="#667EEA" 
                          />
                        </View>
                        <View style={styles.fileDetails}>
                          <Text style={styles.fileName}>{file.file_name}</Text>
                          <View style={styles.fileMetaRow}>
                            <Text style={styles.fileMetaText}>
                              {(file.file_size / 1024).toFixed(1)} KB
                            </Text>
                            <Text style={styles.fileMetaText}>•</Text>
                            <Text style={styles.fileMetaText}>
                              {file.download_count || 0} downloads
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* Notes Tab */}
              {groupDetailsTab === 'notes' && (
                <View>
                  {groupNotes.length === 0 ? (
                    <View style={styles.emptyTabView}>
                      <Ionicons name="create-outline" size={64} color="#ccc" />
                      <Text style={styles.emptyTabText}>No notes yet</Text>
                      <Text style={styles.emptyTabSubtext}>Create notes to share knowledge</Text>
                    </View>
                  ) : (
                    groupNotes.map((note, index) => (
                      <View key={note.id || index} style={styles.noteCard}>
                        <View style={styles.noteHeader}>
                          <Text style={styles.noteTitle}>{note.title}</Text>
                          {note.is_pinned && (
                            <Ionicons name="pin" size={18} color="#667EEA" />
                          )}
                        </View>
                        <Text style={styles.noteContent} numberOfLines={3}>
                          {note.content}
                        </Text>
                        {note.tags && note.tags.length > 0 && (
                          <View style={styles.noteTagsRow}>
                            {note.tags.map((tag, idx) => (
                              <Text key={idx} style={styles.noteTag}>#{tag}</Text>
                            ))}
                          </View>
                        )}
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* Activities Tab */}
              {groupDetailsTab === 'activities' && (
                <View>
                  {groupActivities.length === 0 ? (
                    <View style={styles.emptyTabView}>
                      <Ionicons name="time-outline" size={64} color="#ccc" />
                      <Text style={styles.emptyTabText}>No recent activity</Text>
                      <Text style={styles.emptyTabSubtext}>Group activity will appear here</Text>
                    </View>
                  ) : (
                    groupActivities.map((activity, index) => (
                      <View key={activity.id || index} style={styles.activityCard}>
                        <View style={styles.activityIcon}>
                          <Ionicons 
                            name={
                              activity.activity_type === 'task_created' ? 'checkbox' :
                              activity.activity_type === 'file_uploaded' ? 'document' :
                              activity.activity_type === 'note_added' ? 'create' :
                              activity.activity_type === 'member_joined' ? 'person-add' :
                              'flash'
                            } 
                            size={20} 
                            color="#667EEA" 
                          />
                        </View>
                        <View style={styles.activityDetails}>
                          <Text style={styles.activityDescription}>{activity.description}</Text>
                          <Text style={styles.activityTime}>
                            {new Date(activity.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Member</Text>
            <Text style={styles.modalSubtitle}>Enter the email address of the person you'd like to invite</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Email address"
              value={memberEmail}
              onChangeText={setMemberEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            
            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => {
                  setShowAddMemberModal(false);
                  setMemberEmail('');
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={async () => {
                  if (!memberEmail.trim()) {
                    Alert.alert('Error', 'Please enter an email address');
                    return;
                  }
                  // TODO: Implement invite member API call
                  Alert.alert('Success', `Invitation sent to ${memberEmail}!`);
                  setShowAddMemberModal(false);
                  setMemberEmail('');
                }}
              >
                <Ionicons name="send" size={18} color="#fff" style={{marginRight: 5}} />
                <Text style={styles.modalButtonPrimaryText}>Send Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  header: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F5E6FF',
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
    minHeight: 90,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  statUnit: {
    fontSize: 12,
    color: '#666',
  },
  statSubjectValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
    width: '100%',
  },
  statMonth: {
    fontSize: 10,
    color: '#4CAF50',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 15,
    borderRadius: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsLink: {
    fontSize: 14,
    color: '#667EEA',
  },
  newLink: {
    fontSize: 14,
    color: '#667EEA',
  },
  chartPlaceholder: {
    height: 100,
    justifyContent: 'flex-end',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 90,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  barBlue: {
    backgroundColor: '#667EEA',
  },
  barRed: {
    backgroundColor: '#EF4444',
  },
  timerSection: {
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  currentSubjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 15,
  },
  currentSubjectText: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '600',
    marginLeft: 6,
  },
  timerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#333',
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  timerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerPlayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  groupCard: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  groupLabels: {
    flexDirection: 'row',
    gap: 10,
  },
  groupLabel: {
    fontSize: 10,
    color: '#667EEA',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  groupDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  groupStats: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 15,
  },
  groupStat: {
    gap: 5,
  },
  groupStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  groupStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  groupFooter: {
    flexDirection: 'row',
    gap: 30,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  creatorLabel: {
    fontSize: 12,
    color: '#666',
  },
  creatorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  ctaSection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  ctaCard: {
    backgroundColor: '#000',
    padding: 30,
    borderRadius: 20,
    minHeight: 200,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  ctaText: {
    fontSize: 20,
    color: '#fff',
  },
  ctaHighlight: {
    fontSize: 20,
    color: '#667EEA',
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 250,
    backgroundColor: '#fff',
    zIndex: 1000,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  sidebarHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sidebarProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sidebarUserInfo: {
    flex: 1,
  },
  sidebarUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sidebarUserEmail: {
    fontSize: 12,
    color: '#666',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },
  sidebarItemText: {
    fontSize: 15,
    color: '#333',
  },
  sidebarItemLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sidebarItemTextLogout: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width - 60,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  modalButtonCreate: {
    flex: 1,
    backgroundColor: '#667EEA',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCreateText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  subjectList: {
    maxHeight: 300,
    width: '100%',
  },
  subjectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subjectOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  customSubjectContainer: {
    width: '100%',
    marginTop: 20,
  },
  // Statistics Modal Styles
  statsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: width * 0.9,
    maxHeight: '80%',
  },
  statsModalHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  statsModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: {
    width: '48%',
    backgroundColor: '#F8F9FF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  statsCardLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  statsCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
  encouragementText: {
    fontSize: 16,
    color: '#667EEA',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#667EEA',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Reset Confirmation Modal Styles
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: width * 0.85,
    alignItems: 'center',
  },
  confirmModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  confirmModalText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  confirmCancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmResetButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmResetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Study Sessions Modal Styles
  sessionsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 0,
    width: width * 0.95,
    height: '85%',
    overflow: 'hidden',
  },
  sessionsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sessionsModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  sessionCountText: {
    fontSize: 14,
    color: '#667EEA',
    marginTop: 4,
    fontWeight: '500',
  },
  sessionsList: {
    flex: 1,
    padding: 15,
    backgroundColor: '#FAFAFA',
  },
  sessionsSummary: {
    backgroundColor: '#F0F4FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#667EEA',
  },
  sessionsSummaryText: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySessionsView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptySessionsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
  },
  emptySessionsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#667EEA',
    marginTop: 12,
    fontWeight: '600',
  },
  sessionItem: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 13,
    color: '#999',
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  sessionMetaText: {
    fontSize: 11,
    color: '#667EEA',
    fontWeight: '500',
  },
  sessionDurationContainer: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  sessionDuration: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667EEA',
  },
  sessionNumber: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  sessionMetrics: {
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    color: '#999',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 12,
    color: '#667EEA',
    fontWeight: 'bold',
  },
  sessionDetailsRight: {
    alignItems: 'flex-end',
    marginTop: 4,
    gap: 2,
  },
  sessionMetricBadge: {
    fontSize: 10,
    color: '#667EEA',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: '600',
  },
  sessionTimeBadge: {
    fontSize: 10,
    color: '#666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  weekDayBadge: {
    fontSize: 10,
    color: '#667EEA',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: '600',
  },
  
  // Enhanced Session Details Styles
  enhancedSessionDetails: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E7FF',
    paddingTop: 12,
    width: '100%',
  },
  sessionAnalytics: {
    gap: 8,
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
  },
  analyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  analyticsLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    minWidth: 60,
  },
  ratingStars: {
    flexDirection: 'row',
    marginHorizontal: 8,
    gap: 2,
  },
  star: {
    fontSize: 12,
  },
  analyticsValue: {
    fontSize: 11,
    color: '#333',
    fontWeight: 'bold',
  },
  sessionInsights: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingVertical: 3,
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  insightLabel: {
    fontSize: 10,
    color: '#667EEA',
    fontWeight: '600',
  },
  insightValue: {
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
  },
  sessionTiming: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timingLabel: {
    fontSize: 10,
    color: '#999',
  },
  timingValue: {
    fontSize: 10,
    color: '#667EEA',
    fontWeight: '500',
  },
  
  // Weekly Session Details Styles  
  weeklySessionDetails: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E7FF',
    paddingTop: 12,
    width: '100%',
  },
  sessionScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#667EEA',
    fontWeight: '600',
    minWidth: 60,
  },
  scoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
    minWidth: 30,
  },
  sessionContext: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  contextLabel: {
    fontSize: 9,
    color: '#999',
  },
  contextValue: {
    fontSize: 10,
    color: '#667EEA',
    fontWeight: '600',
  },
  productivityBadge: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  productivityText: {
    fontSize: 9,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  
  // Comprehensive Session Details Styles
  comprehensiveSessionDetails: {
    marginLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E7FF',
    paddingLeft: 12,
    marginTop: 8,
  },
  studyQualityIndicrators: {
    marginBottom: 8,
    gap: 6,
  },
  qualityMetric: {
    backgroundColor: '#FAFBFF',
    borderRadius: 6,
    padding: 6,
  },
  qualityLabel: {
    fontSize: 9,
    color: '#667EEA',
    fontWeight: '600',
    marginBottom: 4,
  },
  qualityVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  difficultyScale: {
    flexDirection: 'row',
    gap: 3,
  },
  focusScale: {
    flexDirection: 'row', 
    gap: 3,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  focusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  qualityScore: {
    fontSize: 11,
    color: '#333',
    fontWeight: 'bold',
  },
  sessionPerformanceCard: {
    backgroundColor: '#F8F9FF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  performanceTitle: {
    fontSize: 11,
    color: '#667EEA',
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  performanceMetrics: {
    gap: 4,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  performanceLabel: {
    fontSize: 9,
    color: '#666',
    flex: 1,
  },
  performanceValue: {
    fontSize: 10,
    color: '#333',
    fontWeight: '600',
  },
  // Profile Modal Styles
  profileModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 0,
    width: width * 0.95,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  profileModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  profileSection: {
    padding: 20,
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 25,
  },
  profileInfoCard: {
    backgroundColor: '#F8F9FF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E7FF',
  },
  profileInfoText: {
    marginLeft: 15,
    flex: 1,
  },
  profileLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FF',
    borderRadius: 15,
    padding: 20,
  },
  profileStatItem: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667EEA',
    marginBottom: 5,
  },
  profileStatLabel: {
    fontSize: 13,
    color: '#666',
  },
  // Subject Breakdown Styles
  subjectBreakdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FF',
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 10,
  },
  subjectBreakdownButtonText: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '600',
    marginLeft: 8,
  },
  subjectStatCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  subjectStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectStatIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectStatInfo: {
    flex: 1,
  },
  subjectStatName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subjectStatLastStudied: {
    fontSize: 13,
    color: '#999',
  },
  subjectStatDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  subjectStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 5,
  },
  subjectStatLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 5,
  },
  // Group Details Styles
  groupDetailsScroll: {
    padding: 20,
  },
  groupDetailSection: {
    marginBottom: 20,
  },
  groupDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupDetailValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  groupDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  groupStatBox: {
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  groupStatNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667EEA',
    marginBottom: 5,
  },
  groupStatText: {
    fontSize: 13,
    color: '#666',
  },
  groupTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  groupTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  groupTagText: {
    fontSize: 13,
    color: '#667EEA',
    fontWeight: '500',
  },
  groupActionButtons: {
    marginTop: 20,
    marginBottom: 10,
  },
  groupActionButton: {
    backgroundColor: '#667EEA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  groupActionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#667EEA',
  },
  groupActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  groupActionButtonTextSecondary: {
    color: '#667EEA',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButtonPrimary: {
    backgroundColor: '#667EEA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    marginLeft: 8,
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondary: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  modalButtonSecondaryText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  // Tab Navigation Styles
  tabNavigation: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    marginBottom: 15,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#667EEA',
  },
  tabButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#667EEA',
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
  },
  // Empty Tab View Styles
  emptyTabView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTabText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '600',
    marginTop: 15,
  },
  emptyTabSubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 5,
  },
  // Task Card Styles
  taskCard: {
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  taskStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8E8E8',
  },
  taskStatusCompleted: {
    backgroundColor: '#D4EDDA',
  },
  taskStatusProgress: {
    backgroundColor: '#FFF3CD',
  },
  taskStatusPending: {
    backgroundColor: '#D1ECF1',
  },
  taskStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textTransform: 'capitalize',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  taskMetaText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  // File Card Styles
  fileCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
  },
  fileIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileMetaText: {
    fontSize: 12,
    color: '#999',
  },
  // Note Card Styles
  noteCard: {
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  noteContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  noteTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noteTag: {
    fontSize: 12,
    color: '#667EEA',
    fontWeight: '500',
  },
  // Activity Card Styles
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  
  // Detailed Modal Styles
  detailsSummaryCard: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#667EEA',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#667EEA',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  summarySubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  comparisonRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '500',
  },
  subjectsRow: {
    marginTop: 8,
  },
  subjectsLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  subjectsValue: {
    fontSize: 14,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  
  // Daily Breakdown Styles
  dailyBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dayDate: {
    fontSize: 12,
    color: '#999',
  },
  dayStats: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  dayHours: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667EEA',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#667EEA',
    borderRadius: 2,
    minWidth: 4,
  },
  
  // Monthly Breakdown Styles
  monthlyBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  bestMonthItem: {
    backgroundColor: '#FFF8E1',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  monthInfo: {
    flex: 1,
  },
  monthName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bestMonthBadge: {
    fontSize: 12,
    color: '#FF8F00',
    fontWeight: '600',
    marginBottom: 4,
  },
  monthSubjects: {
    fontSize: 13,
    color: '#666',
  },
  monthStats: {
    alignItems: 'flex-end',
  },
  monthHours: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667EEA',
  },
  monthSessions: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  aiSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  aiCardRow: {
    marginTop: 10,
    gap: 10,
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 2,
  },
  aiCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiCardInfo: {
    flex: 1,
  },
  aiCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  aiCardDesc: {
    fontSize: 12,
    color: '#999',
  },
  aiQuickLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 14,
    marginBottom: 8,
  },
  aiQuickScroll: {
    marginBottom: 4,
  },
  aiQuickChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  aiQuickChipText: {
    color: '#667EEA',
    fontSize: 13,
    fontWeight: '500',
  },
});
