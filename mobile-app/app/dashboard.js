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
import { API_CONFIG, USER_DATA } from '../config';

const { width } = Dimensions.get('window');
const BASE_URL = API_CONFIG.BASE_URL;

export default function DashboardScreen() {
  const router = useRouter();
  const [isStudying, setIsStudying] = useState(false);
  const [studyTime, setStudyTime] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const slideAnim = useRef(new Animated.Value(-250)).current;
  const [stats, setStats] = useState({
    todayTime: 4,
    weeklyTime: 17,
    mostTimeSubject: 'Math',
    bestMonth: { month: 'June', value: 22 }
  });
  const [studyGroups, setStudyGroups] = useState([
    {
      id: 1,
      name: 'IELTS Exam',
      members: 48,
      totalHours: 801,
      creator: '@ician',
      location: 'Georgia',
      createdDate: 'February 22, 2023',
      tags: ['College', 'Irish Design']
    }
  ]);

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

  const toggleStudying = () => {
    setIsStudying(!isStudying);
  };

  const resetTimer = () => {
    Alert.alert(
      'Reset Timer',
      'Are you sure you want to reset the timer?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: () => {
            setStudyTime(0);
            setIsStudying(false);
          },
          style: 'destructive'
        }
      ]
    );
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          onPress: () => router.replace('/'),
          style: 'destructive'
        }
      ]
    );
  };

  const handleNewGroup = () => {
    setShowNewGroupModal(true);
  };

  const createNewGroup = () => {
    if (newGroupName.trim()) {
      Alert.alert('Success', `Study group "${newGroupName}" created! 🎉`);
      setShowNewGroupModal(false);
      setNewGroupName('');
    } else {
      Alert.alert('Error', 'Please enter a group name');
    }
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
              <Text style={styles.sidebarUserName}>John Doe</Text>
              <Text style={styles.sidebarUserEmail}>john.doe@example.com</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.sidebarItem} onPress={toggleSidebar}>
          <Ionicons name="home" size={20} color="#667EEA" />
          <Text style={styles.sidebarItemText}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sidebarItem}>
          <Ionicons name="checkmark-circle" size={20} color="#666" />
          <Text style={styles.sidebarItemText}>Study Sessions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sidebarItem}>
          <Ionicons name="bar-chart" size={20} color="#666" />
          <Text style={styles.sidebarItemText}>Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sidebarItem}>
          <Ionicons name="person" size={20} color="#666" />
          <Text style={styles.sidebarItemText}>Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.sidebarItem}>
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
            <TouchableOpacity style={styles.profileCircle}>
              <Ionicons name="person" size={20} color="#667EEA" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.date}>March 22th.</Text>
          <Text style={styles.greeting}>Hello {USER_DATA.name}!</Text>
          
          <TouchableOpacity 
            style={styles.startButton}
            onPress={toggleStudying}
          >
            <Text style={styles.startButtonText}>
              {isStudying ? 'Stop Studying →' : 'Start Studying →'}
            </Text>
          </TouchableOpacity>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Today's</Text>
              <Text style={styles.statLabel}>Study Time</Text>
              <Text style={styles.statValue}>{stats.todayTime}</Text>
              <Text style={styles.statUnit}>hrs</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Weekly</Text>
              <Text style={styles.statLabel}>Study Time</Text>
              <Text style={styles.statValue}>{stats.weeklyTime}</Text>
              <Text style={styles.statUnit}>hrs</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Most Time</Text>
              <Text style={styles.statLabel}>Spent on</Text>
              <Text style={styles.statSubjectValue}>{stats.mostTimeSubject}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Your Best</Text>
              <Text style={styles.statLabel}>Month</Text>
              <Text style={styles.statValue}>{stats.bestMonth.value}</Text>
              <Text style={styles.statMonth}>{stats.bestMonth.month}</Text>
            </View>
          </View>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <TouchableOpacity onPress={() => Alert.alert('Statistics', 'Detailed statistics view coming soon!')}>
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

        {/* Timer Section */}
        <View style={styles.timerSection}>
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
            <TouchableOpacity style={styles.timerButton}>
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
          
          {studyGroups.map((group) => (
            <TouchableOpacity key={group.id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupLabels}>
                  <Text style={styles.groupLabel}>College</Text>
                  <Text style={styles.groupLabel}>Irish Design</Text>
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
          ))}
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
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 5,
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
  },});
