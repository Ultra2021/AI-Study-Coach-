import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    studyReminder: true,
    dailyGoal: 120, // minutes
    notifications: true,
    theme: 'light'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      // Settings saved silently without popup
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Study Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Management</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="notifications-outline" size={22} color="#667EEA" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Study Reminders</Text>
                <Text style={styles.settingDescription}>Get notified to study</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.settingToggle, settings.studyReminder && styles.settingToggleActive]}
              onPress={() => saveSettings({...settings, studyReminder: !settings.studyReminder})}
            >
              <View style={[styles.settingToggleThumb, settings.studyReminder && styles.settingToggleThumbActive]} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="trophy-outline" size={22} color="#667EEA" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Daily Goal</Text>
                <Text style={styles.settingDescription}>{settings.dailyGoal} minutes per day</Text>
              </View>
            </View>
            <View style={styles.goalButtons}>
              <TouchableOpacity 
                style={styles.goalButton}
                onPress={() => saveSettings({...settings, dailyGoal: Math.max(30, settings.dailyGoal - 30)})}
              >
                <Ionicons name="remove" size={20} color="#667EEA" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.goalButton}
                onPress={() => saveSettings({...settings, dailyGoal: Math.min(480, settings.dailyGoal + 30)})}
              >
                <Ionicons name="add" size={20} color="#667EEA" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="alert-circle-outline" size={22} color="#667EEA" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Receive app notifications</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.settingToggle, settings.notifications && styles.settingToggleActive]}
              onPress={() => saveSettings({...settings, notifications: !settings.notifications})}
            >
              <View style={[styles.settingToggleThumb, settings.notifications && styles.settingToggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Appearance Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="color-palette-outline" size={22} color="#667EEA" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Theme</Text>
                <Text style={styles.settingDescription}>Choose your preferred theme</Text>
              </View>
            </View>
            <View style={styles.themeButtons}>
              <TouchableOpacity 
                style={[styles.themeButton, settings.theme === 'light' && styles.themeButtonActive]}
                onPress={() => saveSettings({...settings, theme: 'light'})}
              >
                <Ionicons name="sunny" size={18} color={settings.theme === 'light' ? '#fff' : '#667EEA'} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.themeButton, settings.theme === 'dark' && styles.themeButtonActive]}
                onPress={() => saveSettings({...settings, theme: 'dark'})}
              >
                <Ionicons name="moon" size={18} color={settings.theme === 'dark' ? '#fff' : '#667EEA'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="information-circle-outline" size={22} color="#667EEA" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Version</Text>
                <Text style={styles.settingDescription}>AI Study Coach v2.0.0</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  settingToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    padding: 2,
  },
  settingToggleActive: {
    backgroundColor: '#667EEA',
  },
  settingToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  settingToggleThumbActive: {
    alignSelf: 'flex-end',
  },
  goalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  goalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#667EEA',
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#667EEA',
  },
  themeButtonActive: {
    backgroundColor: '#667EEA',
  },
});
