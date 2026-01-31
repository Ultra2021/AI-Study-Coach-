import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

export default function StudyGroupsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [studyGroups] = useState([
    {
      id: 1,
      name: 'IELTS Exam',
      members: 48,
      totalHours: 801,
      creator: '@ician',
      location: 'Georgia',
      createdDate: 'February 22, 2023',
      tags: ['College', 'Irish Design']
    },
    {
      id: 2,
      name: 'Mathematics Study',
      members: 32,
      totalHours: 654,
      creator: '@mathpro',
      location: 'USA',
      createdDate: 'January 15, 2023',
      tags: ['Math', 'Advanced']
    },
  ]);

  const createNewGroup = () => {
    if (newGroupName.trim()) {
      Alert.alert('Success', `Study group "${newGroupName}" created! 🎉`);
      setShowModal(false);
      setNewGroupName('');
    } else {
      Alert.alert('Error', 'Please enter a group name');
    }
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
        <TouchableOpacity style={styles.tabActive}>
          <Text style={styles.tabTextActive}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Files</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Notes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {studyGroups
          .filter(group => 
            group.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((group) => (
            <TouchableOpacity key={group.id} style={styles.groupCard}>
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

              <TouchableOpacity style={styles.editButton}>
                <Ionicons name="create-outline" size={20} color="#333" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Study Group</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
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
});
