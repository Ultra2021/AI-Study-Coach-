import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config';

const { width } = Dimensions.get('window');

export default function StudyGroupsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupLocation, setNewGroupLocation] = useState('');
  const [studyGroups, setStudyGroups] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [activeTab, setActiveTab] = useState('Tasks');
  const [mainActiveTab, setMainActiveTab] = useState('Tasks');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Files state
  const [groupFiles, setGroupFiles] = useState([]);
  const [showUploadFileModal, setShowUploadFileModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  // Notes state
  const [groupNotes, setGroupNotes] = useState([]);
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState(null);

  // Study Hours state
  const [studyHoursStats, setStudyHoursStats] = useState(null);
  const [showLogSessionModal, setShowLogSessionModal] = useState(false);
  const [sessionSubject, setSessionSubject] = useState('');
  const [sessionDuration, setSessionDuration] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [showSetGoalsModal, setShowSetGoalsModal] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState('');
  const [monthlyGoal, setMonthlyGoal] = useState('');
  const [goalProgress, setGoalProgress] = useState(null);
  const [statsDays, setStatsDays] = useState(7);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Fetch study groups from backend with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}/api/study-groups/${parsedUser.id}`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Backend response:', JSON.stringify(data, null, 2));
            
            // Transform backend data to match UI expectations
            const transformedGroups = (data.groups || []).map(group => {
              console.log('Transforming group:', group);
              return {
                id: group.id,
                name: group.name,
                description: group.description,
                location: group.location || 'Remote',
                tags: Array.isArray(group.tags) ? group.tags : [],
                members: group.member_count || 1,
                totalHours: group.total_hours || 0,
                totalTime: group.total_time || '0m',
                creator: group.users?.username || group.creator_name || 'Unknown',
                createdDate: group.created_at ? new Date(group.created_at).toLocaleDateString() : new Date().toLocaleDateString()
              };
            });
            console.log('Transformed groups:', transformedGroups);
            setStudyGroups(transformedGroups);
          } else {
            console.error('Error fetching study groups:', response.status);
            setError('Failed to load study groups');
            setStudyGroups([]);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            setError('Request timeout. Please check your connection.');
          } else {
            setError('Network error. Please try again.');
          }
          setStudyGroups([]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
      setStudyGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewGroup = async () => {
    if (newGroupName.trim()) {
      try {
        // Create group via backend API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/study-groups`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newGroupName,
            creator_id: user?.id,
            description: newGroupDescription.trim() || 'Study group created from mobile app',
            location: newGroupLocation.trim() || 'Remote',
            tags: ['Personal']
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          // Reload groups to get updated list from backend
          await loadData();
          setShowModal(false);
          setNewGroupName('');
          setNewGroupDescription('');
          setNewGroupLocation('');
          // Success - no popup alert
        } else {
          const error = await response.json();
          Alert.alert('Error', error.error || 'Failed to create study group');
        }
      } catch (error) {
        console.error('Error creating study group:', error);
        if (error.name === 'AbortError') {
          Alert.alert('Error', 'Request timeout. Please try again.');
        } else {
          Alert.alert('Error', 'Network error. Please try again.');
        }
      }
    } else {
      Alert.alert('Error', 'Please enter a group name');
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup || !user) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/study-groups/${selectedGroup.id}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        setShowGroupDetailsModal(false);
        // Reload the groups list
        loadData();
      } else {
        Alert.alert('Error', data.error || 'Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      if (error.name === 'AbortError') {
        Alert.alert('Error', 'Request timeout. Please try again.');
      } else {
        Alert.alert('Error', 'Network error. Please try again.');
      }
    }
  };

  const loadGroupFiles = async (groupId) => {
    if (!user) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/study-groups/${groupId}/files?user_id=${user.id}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        setGroupFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const loadGroupNotes = async (groupId) => {
    if (!user) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/study-groups/${groupId}/notes?user_id=${user.id}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        setGroupNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleUploadFile = async () => {
    if (!fileName.trim() || !fileUrl.trim()) {
      Alert.alert('Error', 'Please enter file name and URL');
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/study-groups/${selectedGroup.id}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          file_name: fileName,
          file_type: 'document',
          file_size: 0,
          file_url: fileUrl,
          description: fileDescription,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        setFileName('');
        setFileUrl('');
        setFileDescription('');
        setShowUploadFileModal(false);
        loadGroupFiles(selectedGroup.id);
      } else {
        Alert.alert('Error', data.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const handleCreateNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      Alert.alert('Error', 'Please enter note title and content');
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const url = editingNote 
        ? `${API_CONFIG.BASE_URL}/api/study-groups/${selectedGroup.id}/notes/${editingNote.id}`
        : `${API_CONFIG.BASE_URL}/api/study-groups/${selectedGroup.id}/notes`;

      const response = await fetch(url, {
        method: editingNote ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          title: noteTitle,
          content: noteContent,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        setNoteTitle('');
        setNoteContent('');
        setEditingNote(null);
        setShowCreateNoteModal(false);
        loadGroupNotes(selectedGroup.id);
      } else {
        Alert.alert('Error', data.error || 'Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  // Study Hours Functions
  const loadStudyHoursStats = async (groupId, days = 7) => {
    if (!user) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/study-groups/${groupId}/study-hours/stats?user_id=${user.id}&days=${days}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        setStudyHoursStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading study hours stats:', error);
    }
  };

  const loadGoalProgress = async (groupId) => {
    if (!user) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/study-groups/${groupId}/study-hours/progress?user_id=${user.id}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        setGoalProgress(data.progress);
      }
    } catch (error) {
      console.error('Error loading goal progress:', error);
    }
  };

  const handleLogSession = async () => {
    if (!sessionSubject.trim() || !sessionDuration.trim()) {
      Alert.alert('Error', 'Please enter subject and duration');
      return;
    }

    const duration = parseInt(sessionDuration);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Error', 'Please enter a valid duration in minutes');
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/study-groups/${selectedGroup.id}/study-hours/log`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            subject: sessionSubject,
            duration: duration,
            notes: sessionNotes,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        setSessionSubject('');
        setSessionDuration('');
        setSessionNotes('');
        setShowLogSessionModal(false);
        loadStudyHoursStats(selectedGroup.id, statsDays);
        loadGoalProgress(selectedGroup.id);
        Alert.alert('Success', 'Study session logged successfully!');
      } else {
        Alert.alert('Error', data.error || 'Failed to log session');
      }
    } catch (error) {
      console.error('Error logging session:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const handleSetGoals = async () => {
    const weekly = parseInt(weeklyGoal);
    const monthly = parseInt(monthlyGoal);

    if (isNaN(weekly) || weekly <= 0) {
      Alert.alert('Error', 'Please enter a valid weekly goal');
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/study-groups/${selectedGroup.id}/study-hours/goals`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            weekly_hours: weekly,
            monthly_hours: !isNaN(monthly) ? monthly : null,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        setWeeklyGoal('');
        setMonthlyGoal('');
        setShowSetGoalsModal(false);
        loadGoalProgress(selectedGroup.id);
        Alert.alert('Success', 'Study goals set successfully!');
      } else {
        Alert.alert('Error', data.error || 'Failed to set goals');
      }
    } catch (error) {
      console.error('Error setting goals:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/study-groups/${selectedGroup.id}/files/${fileId}?user_id=${user.id}`, {
        method: 'DELETE',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        loadGroupFiles(selectedGroup.id);
      } else {
        Alert.alert('Error', data.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/study-groups/${selectedGroup.id}/notes/${noteId}?user_id=${user.id}`, {
        method: 'DELETE',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        loadGroupNotes(selectedGroup.id);
      } else {
        Alert.alert('Error', data.error || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const openGroupDetails = (group) => {
    setSelectedGroup(group);
    setActiveTab('Tasks'); // Reset to Tasks tab when opening group
    setShowGroupDetailsModal(true);
    loadGroupFiles(group.id);
    loadGroupNotes(group.id);
    loadStudyHoursStats(group.id, statsDays);
    loadGoalProgress(group.id);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Groups</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle" size={24} color="#667EEA" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search in members, tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={mainActiveTab === 'Tasks' ? styles.tabActive : styles.tab}
          onPress={() => setMainActiveTab('Tasks')}
        >
          <Text style={mainActiveTab === 'Tasks' ? styles.tabTextActive : styles.tabText}>
            Tasks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={mainActiveTab === 'Files' ? styles.tabActive : styles.tab}
          onPress={() => setMainActiveTab('Files')}
        >
          <Text style={mainActiveTab === 'Files' ? styles.tabTextActive : styles.tabText}>
            Files
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={mainActiveTab === 'Notes' ? styles.tabActive : styles.tab}
          onPress={() => setMainActiveTab('Notes')}
        >
          <Text style={mainActiveTab === 'Notes' ? styles.tabTextActive : styles.tabText}>
            Notes
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {mainActiveTab === 'Tasks' ? (
          // Tasks Tab - Show Study Groups
          loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading study groups...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : studyGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No Study Groups Yet</Text>
              <Text style={styles.emptyStateText}>Create your first study group to collaborate with others!</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => setShowModal(true)}
              >
                <Text style={styles.emptyStateButtonText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          ) : (
            studyGroups
              .filter(group => 
                group.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((group) => (
              <TouchableOpacity 
                key={group.id} 
                style={styles.groupCard}
                onPress={() => openGroupDetails(group)}
              >
                <View style={styles.groupHeader}>
                  <View style={styles.groupLabels}>
                    {group.tags.map((tag, index) => (
                      <Text key={index} style={styles.groupLabel}>{tag}</Text>
                    ))}
                  </View>
                  <View style={styles.groupMembers}>
                    <Ionicons name="person" size={16} color="#666" />
                    <Ionicons name="person" size={16} color="#666" style={{ marginLeft: -8 }} />
                    <Ionicons name="person" size={16} color="#666" style={{ marginLeft: -8 }} />
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
                    <Text style={styles.groupStatValue} numberOfLines={1}>{group.totalTime}</Text>
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

                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    openGroupDetails(group);
                  }}
                >
                  <Ionicons name="create-outline" size={20} color="#333" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )
        ) : mainActiveTab === 'Files' ? (
          // Files Tab - Show message to select a group
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Group Files</Text>
            <Text style={styles.emptyStateText}>
              Select a study group from the Tasks tab to view and manage files
            </Text>
          </View>
        ) : (
          // Notes Tab - Show message to select a group
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Group Notes</Text>
            <Text style={styles.emptyStateText}>
              Select a study group from the Tasks tab to view and manage notes
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.createGroupContent}>
            <View style={styles.createGroupHeader}>
              <Text style={styles.modalTitle}>Create New Study Group</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.createGroupForm}>
              <Text style={styles.inputLabel}>Group Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter group name"
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholderTextColor="#999"
              />
              
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What is this group about?"
                value={newGroupDescription}
                onChangeText={setNewGroupDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#999"
              />
              
              <Text style={styles.inputLabel}>Location (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Where will you meet?"
                value={newGroupLocation}
                onChangeText={setNewGroupLocation}
                placeholderTextColor="#999"
              />
              
              <View style={styles.createGroupButtons}>
                <TouchableOpacity 
                  style={[styles.createGroupButton, styles.createGroupButtonCancel]}
                  onPress={() => {
                    setShowModal(false);
                    setNewGroupName('');
                    setNewGroupDescription('');
                    setNewGroupLocation('');
                  }}
                >
                  <Text style={styles.createGroupButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.createGroupButton, styles.createGroupButtonCreate]}
                  onPress={createNewGroup}
                >
                  <Ionicons name="add-circle" size={20} color="#fff" style={{marginRight: 5}} />
                  <Text style={styles.createGroupButtonCreateText}>Create Group</Text>
                </TouchableOpacity>
              </View>
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
        <View style={styles.modalContainer}>
          <View style={styles.groupDetailsContent}>
            <View style={styles.groupDetailsHeader}>
              <Text style={styles.groupDetailsTitle}>{selectedGroup?.name}</Text>
              <TouchableOpacity onPress={() => setShowGroupDetailsModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.groupDetailsScroll}>
              {/* Tabs */}
              <View style={styles.tabsContainer}>
                {['Tasks', 'Files', 'Notes', 'Study Hours'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.groupTab, activeTab === tab && styles.groupActiveTab]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text style={[styles.groupTabText, activeTab === tab && styles.groupActiveTabText]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Group Info Section */}
              <View style={styles.groupDetailSection}>
                <Text style={styles.groupDetailLabel}>Description</Text>
                <Text style={styles.groupDetailValue}>
                  {selectedGroup?.description || 'No description available'}
                </Text>
              </View>
              
              <View style={styles.groupDetailSection}>
                <Text style={styles.groupDetailLabel}>Location</Text>
                <View style={styles.groupDetailRow}>
                  <Ionicons name="location" size={18} color="#667EEA" />
                  <Text style={styles.groupDetailValueInline}>
                    {selectedGroup?.location || 'Remote'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.groupDetailSection}>
                <Text style={styles.groupDetailLabel}>Created By</Text>
                <View style={styles.groupDetailRow}>
                  <Ionicons name="person" size={18} color="#667EEA" />
                  <Text style={styles.groupDetailValueInline}>
                    {selectedGroup?.creator_name || user?.username || 'Unknown'}
                  </Text>
                </View>
              </View>

              <View style={styles.groupStatsRow}>
                <View style={styles.groupStatBox}>
                  <Ionicons name="people" size={24} color="#667EEA" />
                  <Text style={styles.groupStatNumber}>{selectedGroup?.member_count || 1}</Text>
                  <Text style={styles.groupStatText}>Members</Text>
                </View>
                <View style={styles.groupStatBox}>
                  <Ionicons name="time" size={24} color="#667EEA" />
                  <Text style={styles.groupStatNumber} numberOfLines={1}>{selectedGroup?.totalTime || '0m'}</Text>
                  <Text style={styles.groupStatText}>Total Hours</Text>
                </View>
              </View>

              {/* Content based on active tab */}
              <View style={styles.tabContent}>
                {activeTab === 'Tasks' && (
                  <View style={styles.emptyTabContent}>
                    <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyTabText}>No tasks yet</Text>
                    <Text style={styles.emptyTabSubtext}>Create tasks to track your group's progress!</Text>
                  </View>
                )}
                {activeTab === 'Files' && (
                  <View style={styles.tabContentList}>
                    {groupFiles.length === 0 ? (
                      <View style={styles.emptyTabContent}>
                        <Ionicons name="document-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyTabText}>No files yet</Text>
                        <Text style={styles.emptyTabSubtext}>Share study materials with your group!</Text>
                      </View>
                    ) : (
                      groupFiles.map((file, index) => (
                        <View key={index} style={styles.fileItem}>
                          <View style={styles.fileIcon}>
                            <Ionicons name="document-text" size={24} color="#667EEA" />
                          </View>
                          <View style={styles.fileInfo}>
                            <Text style={styles.fileName}>{file.file_name}</Text>
                            {file.description && (
                              <Text style={styles.fileDescription}>{file.description}</Text>
                            )}
                            <Text style={styles.fileMetadata}>
                              Uploaded {new Date(file.created_at).toLocaleDateString()}
                            </Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.fileDeleteButton}
                            onPress={() => handleDeleteFile(file.id)}
                          >
                            <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                    <TouchableOpacity 
                      style={styles.addItemButton}
                      onPress={() => setShowUploadFileModal(true)}
                    >
                      <Ionicons name="add-circle" size={24} color="#667EEA" />
                      <Text style={styles.addItemButtonText}>Upload File</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {activeTab === 'Notes' && (
                  <View style={styles.tabContentList}>
                    {groupNotes.length === 0 ? (
                      <View style={styles.emptyTabContent}>
                        <Ionicons name="clipboard-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyTabText}>No notes yet</Text>
                        <Text style={styles.emptyTabSubtext}>Add shared notes for your group!</Text>
                      </View>
                    ) : (
                      groupNotes.map((note, index) => (
                        <View key={index} style={styles.noteItem}>
                          <View style={styles.noteHeader}>
                            <Text style={styles.noteTitle}>{note.title}</Text>
                            <View style={styles.noteActions}>
                              <TouchableOpacity 
                                style={styles.noteEditButton}
                                onPress={() => {
                                  setEditingNote(note);
                                  setNoteTitle(note.title);
                                  setNoteContent(note.content);
                                  setShowCreateNoteModal(true);
                                }}
                              >
                                <Ionicons name="create-outline" size={20} color="#667EEA" />
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.noteDeleteButton}
                                onPress={() => handleDeleteNote(note.id)}
                              >
                                <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                              </TouchableOpacity>
                            </View>
                          </View>
                          <Text style={styles.noteContent} numberOfLines={3}>{note.content}</Text>
                          <Text style={styles.noteMetadata}>
                            {new Date(note.created_at).toLocaleDateString()}
                            {note.is_pinned && ' • Pinned'}
                          </Text>
                        </View>
                      ))
                    )}
                    <TouchableOpacity 
                      style={styles.addItemButton}
                      onPress={() => {
                        setEditingNote(null);
                        setNoteTitle('');
                        setNoteContent('');
                        setShowCreateNoteModal(true);
                      }}
                    >
                      <Ionicons name="add-circle" size={24} color="#667EEA" />
                      <Text style={styles.addItemButtonText}>Create Note</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Study Hours Tab */}
                {activeTab === 'Study Hours' && (
                  <View style={styles.tabContentList}>
                    {/* Goal Progress Section */}
                    {goalProgress && (goalProgress.weekly.goal || goalProgress.monthly.goal) && (
                      <View style={styles.goalsSection}>
                        <Text style={styles.goalsSectionTitle}>📊 Goal Progress</Text>
                        
                        {goalProgress.weekly.goal && (
                          <View style={styles.goalCard}>
                            <View style={styles.goalHeader}>
                              <Text style={styles.goalTitle}>Weekly Goal</Text>
                              <Text style={styles.goalPercentage}>{goalProgress.weekly.percentage}%</Text>
                            </View>
                            <View style={styles.goalProgressBar}>
                              <View 
                                style={[
                                  styles.goalProgressFill, 
                                  { width: `${Math.min(goalProgress.weekly.percentage, 100)}%` }
                                ]} 
                              />
                            </View>
                            <Text style={styles.goalText}>
                              {goalProgress.weekly.actual_time} / {goalProgress.weekly.goal_time}
                            </Text>
                          </View>
                        )}

                        {goalProgress.monthly.goal && (
                          <View style={styles.goalCard}>
                            <View style={styles.goalHeader}>
                              <Text style={styles.goalTitle}>Monthly Goal</Text>
                              <Text style={styles.goalPercentage}>{goalProgress.monthly.percentage}%</Text>
                            </View>
                            <View style={styles.goalProgressBar}>
                              <View 
                                style={[
                                  styles.goalProgressFill, 
                                  { width: `${Math.min(goalProgress.monthly.percentage, 100)}%` }
                                ]} 
                              />
                            </View>
                            <Text style={styles.goalText}>
                              {goalProgress.monthly.actual_time} / {goalProgress.monthly.goal_time}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Stats Summary */}
                    {studyHoursStats && (
                      <View style={styles.statsSection}>
                        <View style={styles.statsSummary}>
                          <View style={styles.statBox}>
                            <Ionicons name="time-outline" size={24} color="#667EEA" />
                            <Text style={styles.statNumber}>{studyHoursStats.total_time}</Text>
                            <Text style={styles.statLabel}>Total Time</Text>
                          </View>
                          <View style={styles.statBox}>
                            <Ionicons name="book-outline" size={24} color="#667EEA" />
                            <Text style={styles.statNumber}>{studyHoursStats.total_sessions}</Text>
                            <Text style={styles.statLabel}>Sessions</Text>
                          </View>
                          <View style={styles.statBox}>
                            <Ionicons name="speedometer-outline" size={24} color="#667EEA" />
                            <Text style={styles.statNumber}>{studyHoursStats.average_time}</Text>
                            <Text style={styles.statLabel}>Avg Time</Text>
                          </View>
                        </View>

                        {/* Member Breakdown */}
                        {studyHoursStats.member_breakdown && studyHoursStats.member_breakdown.length > 0 && (
                          <View style={styles.breakdownSection}>
                            <Text style={styles.breakdownTitle}>👥 Member Contributions</Text>
                            {studyHoursStats.member_breakdown.map((member, index) => (
                              <View key={index} style={styles.breakdownItem}>
                                <View style={styles.breakdownItemHeader}>
                                  <Ionicons name="person-circle-outline" size={20} color="#667EEA" />
                                  <Text style={styles.breakdownItemName}>{member.username}</Text>
                                </View>
                                <Text style={styles.breakdownItemValue}>
                                  {member.time} ({member.sessions} sessions)
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Subject Breakdown */}
                        {studyHoursStats.subject_breakdown && studyHoursStats.subject_breakdown.length > 0 && (
                          <View style={styles.breakdownSection}>
                            <Text style={styles.breakdownTitle}>📚 Subject Breakdown</Text>
                            {studyHoursStats.subject_breakdown.map((subject, index) => (
                              <View key={index} style={styles.breakdownItem}>
                                <View style={styles.breakdownItemHeader}>
                                  <Ionicons name="book" size={20} color="#667EEA" />
                                  <Text style={styles.breakdownItemName}>{subject.subject}</Text>
                                </View>
                                <Text style={styles.breakdownItemValue}>
                                  {subject.time} ({subject.sessions} sessions)
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {!studyHoursStats && (
                      <View style={styles.emptyTabContent}>
                        <Ionicons name="time-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyTabText}>No study hours logged yet</Text>
                        <Text style={styles.emptyTabSubtext}>Start logging your study sessions!</Text>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.studyHoursActions}>
                      <TouchableOpacity 
                        style={styles.studyHoursActionButton}
                        onPress={() => setShowLogSessionModal(true)}
                      >
                        <Ionicons name="add-circle" size={24} color="#667EEA" />
                        <Text style={styles.studyHoursActionText}>Log Session</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.studyHoursActionButton, styles.studyHoursActionButtonSecondary]}
                        onPress={() => setShowSetGoalsModal(true)}
                      >
                        <Ionicons name="flag-outline" size={24} color="#667EEA" />
                        <Text style={styles.studyHoursActionText}>Set Goals</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.groupActionButtons}>
                <TouchableOpacity 
                  style={styles.groupActionButton}
                  onPress={() => {
                    setShowGroupDetailsModal(false);
                    setShowAddMemberModal(true);
                  }}
                >
                  <Ionicons name="person-add" size={20} color="#fff" />
                  <Text style={styles.groupActionButtonText}>Add Member</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.groupActionButton, styles.groupActionButtonSecondary]}
                  onPress={handleLeaveGroup}
                >
                  <Ionicons name="exit-outline" size={20} color="#FF6B6B" />
                  <Text style={[styles.groupActionButtonText, styles.groupActionButtonLeaveText]}>
                    Leave Group
                  </Text>
                </TouchableOpacity>
              </View>
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
        <View style={styles.modalContainer}>
          <View style={styles.addMemberContent}>
            <Text style={styles.addMemberTitle}>Add Member</Text>
            <Text style={styles.addMemberSubtitle}>
              Enter the email address of the person you'd like to invite
            </Text>
            
            <TextInput
              style={styles.addMemberInput}
              placeholder="Email address"
              value={memberEmail}
              onChangeText={setMemberEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            
            <View style={styles.addMemberButtons}>
              <TouchableOpacity 
                style={[styles.addMemberButton, styles.addMemberButtonCancel]}
                onPress={() => {
                  setShowAddMemberModal(false);
                  setMemberEmail('');
                }}
              >
                <Text style={styles.addMemberButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.addMemberButton, styles.addMemberButtonSend]}
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
                <Text style={styles.addMemberButtonSendText}>Send Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Upload File Modal */}
      <Modal
        visible={showUploadFileModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUploadFileModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.addMemberContent}>
            <Text style={styles.addMemberTitle}>Upload File</Text>
            <Text style={styles.addMemberSubtitle}>
              Add study materials to share with your group
            </Text>
            
            <TextInput
              style={styles.addMemberInput}
              placeholder="File name"
              value={fileName}
              onChangeText={setFileName}
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={styles.addMemberInput}
              placeholder="File URL"
              value={fileUrl}
              onChangeText={setFileUrl}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={[styles.addMemberInput, styles.textArea]}
              placeholder="Description (optional)"
              value={fileDescription}
              onChangeText={setFileDescription}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />
            
            <View style={styles.addMemberButtons}>
              <TouchableOpacity 
                style={[styles.addMemberButton, styles.addMemberButtonCancel]}
                onPress={() => {
                  setShowUploadFileModal(false);
                  setFileName('');
                  setFileUrl('');
                  setFileDescription('');
                }}
              >
                <Text style={styles.addMemberButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.addMemberButton, styles.addMemberButtonSend]}
                onPress={handleUploadFile}
              >
                <Ionicons name="cloud-upload" size={18} color="#fff" style={{marginRight: 5}} />
                <Text style={styles.addMemberButtonSendText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create/Edit Note Modal */}
      <Modal
        visible={showCreateNoteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateNoteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.addMemberContent}>
            <Text style={styles.addMemberTitle}>
              {editingNote ? 'Edit Note' : 'Create Note'}
            </Text>
            <Text style={styles.addMemberSubtitle}>
              Add shared notes for your study group
            </Text>
            
            <TextInput
              style={styles.addMemberInput}
              placeholder="Note title"
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={[styles.addMemberInput, styles.textArea]}
              placeholder="Note content"
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
            
            <View style={styles.addMemberButtons}>
              <TouchableOpacity 
                style={[styles.addMemberButton, styles.addMemberButtonCancel]}
                onPress={() => {
                  setShowCreateNoteModal(false);
                  setNoteTitle('');
                  setNoteContent('');
                  setEditingNote(null);
                }}
              >
                <Text style={styles.addMemberButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.addMemberButton, styles.addMemberButtonSend]}
                onPress={handleCreateNote}
              >
                <Ionicons name="save" size={18} color="#fff" style={{marginRight: 5}} />
                <Text style={styles.addMemberButtonSendText}>
                  {editingNote ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Log Session Modal */}
      <Modal
        visible={showLogSessionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogSessionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.addMemberContent}>
            <Text style={styles.addMemberTitle}>Log Study Session</Text>
            <Text style={styles.addMemberSubtitle}>
              Record your study time for this group
            </Text>
            
            <TextInput
              style={styles.addMemberInput}
              placeholder="Subject (e.g., Mathematics)"
              value={sessionSubject}
              onChangeText={setSessionSubject}
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={styles.addMemberInput}
              placeholder="Duration (minutes)"
              value={sessionDuration}
              onChangeText={setSessionDuration}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={[styles.addMemberInput, styles.textArea]}
              placeholder="Notes (optional)"
              value={sessionNotes}
              onChangeText={setSessionNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
            
            <View style={styles.addMemberButtons}>
              <TouchableOpacity 
                style={[styles.addMemberButton, styles.addMemberButtonCancel]}
                onPress={() => {
                  setShowLogSessionModal(false);
                  setSessionSubject('');
                  setSessionDuration('');
                  setSessionNotes('');
                }}
              >
                <Text style={styles.addMemberButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.addMemberButton, styles.addMemberButtonSend]}
                onPress={handleLogSession}
              >
                <Ionicons name="checkmark" size={18} color="#fff" style={{marginRight: 5}} />
                <Text style={styles.addMemberButtonSendText}>Log Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Set Goals Modal */}
      <Modal
        visible={showSetGoalsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSetGoalsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.addMemberContent}>
            <Text style={styles.addMemberTitle}>Set Study Goals</Text>
            <Text style={styles.addMemberSubtitle}>
              Set weekly and monthly study hour goals for your group
            </Text>
            
            <Text style={styles.inputLabel}>Weekly Goal (hours) *</Text>
            <TextInput
              style={styles.addMemberInput}
              placeholder="e.g., 10"
              value={weeklyGoal}
              onChangeText={setWeeklyGoal}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.inputLabel}>Monthly Goal (hours)</Text>
            <TextInput
              style={styles.addMemberInput}
              placeholder="e.g., 40 (optional)"
              value={monthlyGoal}
              onChangeText={setMonthlyGoal}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            
            <View style={styles.addMemberButtons}>
              <TouchableOpacity 
                style={[styles.addMemberButton, styles.addMemberButtonCancel]}
                onPress={() => {
                  setShowSetGoalsModal(false);
                  setWeeklyGoal('');
                  setMonthlyGoal('');
                }}
              >
                <Text style={styles.addMemberButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.addMemberButton, styles.addMemberButtonSend]}
                onPress={handleSetGoals}
              >
                <Ionicons name="flag" size={18} color="#fff" style={{marginRight: 5}} />
                <Text style={styles.addMemberButtonSendText}>Set Goals</Text>
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 15,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  tabActive: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#FFE5F1',
    borderRadius: 20,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  groupCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    position: 'relative',
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
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  groupMembers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  groupStats: {
    flexDirection: 'row',
    gap: 40,
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
    gap: 40,
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
  editButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: width - 60,
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
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
  closeButton: {
    backgroundColor: '#667EEA',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateButton: {
    backgroundColor: '#667EEA',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 30,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Group Details Modal Styles
  groupDetailsContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingTop: 0,
    width: width * 0.95,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  groupDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  groupDetailsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  groupDetailsScroll: {
    padding: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  groupTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  groupActiveTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  groupActiveTabText: {
    color: '#667EEA',
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
  groupDetailValueInline: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  groupStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667EEA',
    marginVertical: 5,
  },
  groupStatText: {
    fontSize: 13,
    color: '#666',
  },
  tabContent: {
    marginTop: 10,
    marginBottom: 20,
  },
  emptyTabContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTabText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
  },
  emptyTabSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  groupActionButtons: {
    marginTop: 10,
    marginBottom: 20,
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
    borderColor: '#FF6B6B',
  },
  groupActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  groupActionButtonLeaveText: {
    color: '#FF6B6B',
  },
  // Add Member Modal Styles
  addMemberContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: width * 0.9,
  },
  addMemberTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  addMemberSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  addMemberInput: {
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  addMemberButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addMemberButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  addMemberButtonCancel: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 8,
  },
  addMemberButtonSend: {
    backgroundColor: '#667EEA',
    marginLeft: 8,
  },
  addMemberButtonCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  addMemberButtonSendText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Create Group Modal Styles
  createGroupContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.95,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  createGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  createGroupForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  createGroupButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  createGroupButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  createGroupButtonCancel: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 8,
  },
  createGroupButtonCreate: {
    backgroundColor: '#667EEA',
    marginLeft: 8,
  },
  createGroupButtonCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createGroupButtonCreateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#667EEA',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContentList: {
    flex: 1,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  fileDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  fileMetadata: {
    fontSize: 11,
    color: '#999',
  },
  fileDeleteButton: {
    padding: 8,
  },
  noteItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  noteEditButton: {
    padding: 4,
  },
  noteDeleteButton: {
    padding: 4,
  },
  noteContent: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 6,
  },
  noteMetadata: {
    fontSize: 11,
    color: '#999',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#667EEA',
    borderStyle: 'dashed',
  },
  addItemButtonText: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '600',
    marginLeft: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  goalsSection: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
  },
  goalsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  goalCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  goalPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667EEA',
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#667EEA',
    borderRadius: 4,
  },
  goalText: {
    fontSize: 12,
    color: '#666',
  },
  statsSection: {
    marginBottom: 15,
  },
  statsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  breakdownSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  breakdownItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownItemName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  breakdownItemValue: {
    fontSize: 13,
    color: '#666',
  },
  studyHoursActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  studyHoursActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#667EEA',
  },
  studyHoursActionButtonSecondary: {
    backgroundColor: '#F8F9FA',
  },
  studyHoursActionText: {
    fontSize: 14,
    color: '#667EEA',
    fontWeight: '600',
    marginLeft: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 8,
  },
});
