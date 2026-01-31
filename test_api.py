import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const BASE_URL = 'http://192.168.1.5:5000';

export default function StudyCoachScreen() {
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('');
  const [focusLevel, setFocusLevel] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${BASE_URL}/api/study-sessions`);
      const data = await response.json();
      
      if (data.success && data.sessions) {
        setSessions(data.sessions);
      } else {
        setSessions([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch study sessions. Check if backend is running.');
      setSessions([]);
    } finally {
      setRefreshing(false);
    }
  };

  const validateForm = () => {
    if (!subject.trim()) {
      Alert.alert('Validation Error', 'Please enter a subject');
      return false;
    }

    const durationNum = parseInt(duration);
    if (!duration || isNaN(durationNum) || durationNum < 1 || durationNum > 1440) {
      Alert.alert('Validation Error', 'Duration must be between 1 and 1440 minutes');
      return false;
    }

    const focusNum = parseInt(focusLevel);
    if (!focusLevel || isNaN(focusNum) || focusNum < 1 || focusNum > 5) {
      Alert.alert('Validation Error', 'Focus level must be between 1 and 5');
      return false;
    }

    const diffNum = parseInt(difficulty);
    if (!difficulty || isNaN(diffNum) || diffNum < 1 || diffNum > 5) {
      Alert.alert('Validation Error', 'Difficulty must be between 1 and 5');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/study-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: subject.trim(),
          duration: parseInt(duration),
          focus_level: parseInt(focusLevel),
          difficulty: parseInt(difficulty),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Success', 'Study session logged successfully!');
        setSubject('');
        setDuration('');
        setFocusLevel('');
        setDifficulty('');
        fetchSessions();
      } else {
        Alert.alert('Error', data.error || 'Failed to log study session');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const renderSession = ({ item }) => (
    <View style={styles.sessionCard}>
      <Text style={styles.sessionSubject}>{item.subject}</Text>
      <View style={styles.sessionDetails}>
        <Text style={styles.sessionText}>Duration: {item.duration} min</Text>
        <Text style={styles.sessionText}>Focus: {item.focus_level}/5</Text>
        <Text style={styles.sessionText}>Difficulty: {item.difficulty}/5</Text>
      </View>
      <Text style={styles.sessionDate}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>🎓 AI Study Coach</Text>
          <Text style={styles.subtitle}>Track your study sessions</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Log Study Session</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Mathematics, Physics"
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              placeholder="1-1440"
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Focus Level (1-5)</Text>
            <TextInput
              style={styles.input}
              placeholder="1 (Poor) - 5 (Excellent)"
              value={focusLevel}
              onChangeText={setFocusLevel}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Difficulty (1-5)</Text>
            <TextInput
              style={styles.input}
              placeholder="1 (Very Easy) - 5 (Very Hard)"
              value={difficulty}
              onChangeText={setDifficulty}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log Study Session</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.sessionsSection}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            <TouchableOpacity onPress={fetchSessions} disabled={refreshing}>
              <Text style={styles.refreshButton}>
                {refreshing ? '⟳' : '🔄'}
              </Text>
            </TouchableOpacity>
          </View>

          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No study sessions yet</Text>
              <Text style={styles.emptySubtext}>
                Log your first session to get started!
              </Text>
            </View>
          ) : (
            <FlatList
              data={sessions}
              renderItem={renderSession}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#667eea',
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  formSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionsSection: {
    margin: 15,
    marginTop: 0,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshButton: {
    fontSize: 24,
    color: '#667eea',
  },
  sessionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sessionSubject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionText: {
    fontSize: 14,
    color: '#666',
  },
  sessionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
});