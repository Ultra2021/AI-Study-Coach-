import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  Modal, TextInput, Switch, Alert, StatusBar,
  ActivityIndicator, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG, COLORS } from '../config';
import DateTimePicker from '@react-native-community/datetimepicker';

const BASE_URL = API_CONFIG.BASE_URL;

export default function RemindersScreen() {
  const router = useRouter();

  const [tab, setTab]           = useState('reminders'); // 'reminders' | 'alarms'
  const [userId, setUserId]     = useState(null);
  const [loading, setLoading]   = useState(true);

  // Reminders state
  const [reminders, setReminders]     = useState([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderForm, setReminderForm] = useState({ title: '', description: '', due_date: '', recurrence: 'none' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate]     = useState(new Date());

  // Alarms state
  const [alarms, setAlarms]           = useState([]);
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [alarmForm, setAlarmForm]       = useState({ label: '', alarm_time: '', repeat_days: '' });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTime, setPickerTime]     = useState(new Date());

  // ─── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const raw  = await AsyncStorage.getItem('user');
      const user = raw ? JSON.parse(raw) : null;
      if (!user?.id) { router.replace('/'); return; }
      setUserId(user.id);
    };
    init();
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchReminders();
    fetchAlarms();
    // Poll for due alarms every 30s
    const poll = setInterval(() => checkDueAlarms(), 30000);
    return () => clearInterval(poll);
  }, [userId]);

  // ─── Reminders ────────────────────────────────────────────────────────────
  const fetchReminders = useCallback(async () => {
    if (!userId) return;
    try {
      const res  = await fetch(`${BASE_URL}/api/ai/reminders?user_id=${userId}`);
      const data = await res.json();
      if (data.success) setReminders(data.reminders || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [userId]);

  const saveReminder = async () => {
    if (!reminderForm.title.trim()) {
      Alert.alert('Error', 'Please enter a title'); return;
    }
    try {
      const payload = { user_id: userId, ...reminderForm };
      if (pickerDate) payload.due_date = pickerDate.toISOString();
      await fetch(`${BASE_URL}/api/ai/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setShowReminderModal(false);
      setReminderForm({ title: '', description: '', due_date: '', recurrence: 'none' });
      fetchReminders();
    } catch (e) { Alert.alert('Error', 'Failed to save reminder'); }
  };

  const completeReminder = async (id) => {
    await fetch(`${BASE_URL}/api/ai/reminders/${id}/done`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    fetchReminders();
  };

  const deleteReminder = (id) => {
    Alert.alert('Delete', 'Delete this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await fetch(`${BASE_URL}/api/ai/reminders/${id}?user_id=${userId}`, { method: 'DELETE' });
          fetchReminders();
        },
      },
    ]);
  };

  // ─── Alarms ───────────────────────────────────────────────────────────────
  const fetchAlarms = useCallback(async () => {
    if (!userId) return;
    try {
      const res  = await fetch(`${BASE_URL}/api/ai/alarms?user_id=${userId}`);
      const data = await res.json();
      if (data.success) setAlarms(data.alarms || []);
    } catch { /* ignore */ }
  }, [userId]);

  const checkDueAlarms = async () => {
    if (!userId) return;
    try {
      const res  = await fetch(`${BASE_URL}/api/ai/alarms/due?user_id=${userId}`);
      const data = await res.json();
      if (data.success && data.alarms?.length) {
        data.alarms.forEach(a => Alert.alert('⏰ Alarm', a.label));
        fetchAlarms();
      }
    } catch { /* ignore */ }
  };

  const saveAlarm = async () => {
    if (!alarmForm.label.trim()) {
      Alert.alert('Error', 'Please enter a label'); return;
    }
    try {
      const payload = {
        user_id:     userId,
        label:       alarmForm.label,
        alarm_time:  pickerTime.toISOString(),
        repeat_days: alarmForm.repeat_days || null,
      };
      await fetch(`${BASE_URL}/api/ai/alarms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setShowAlarmModal(false);
      setAlarmForm({ label: '', alarm_time: '', repeat_days: '' });
      fetchAlarms();
    } catch (e) { Alert.alert('Error', 'Failed to save alarm'); }
  };

  const toggleAlarm = async (id, current) => {
    await fetch(`${BASE_URL}/api/ai/alarms/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, is_active: !current }),
    });
    fetchAlarms();
  };

  const deleteAlarm = (id) => {
    Alert.alert('Delete', 'Delete this alarm?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await fetch(`${BASE_URL}/api/ai/alarms/${id}?user_id=${userId}`, { method: 'DELETE' });
          fetchAlarms();
        },
      },
    ]);
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const formatDate = (iso) => {
    if (!iso) return 'No date';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const renderReminder = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardCheck} onPress={() => completeReminder(item.id)}>
        <Ionicons name="checkmark-circle-outline" size={24} color="#667EEA" />
      </TouchableOpacity>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}
        <View style={styles.cardMeta}>
          <Ionicons name="time-outline" size={13} color="#999" />
          <Text style={styles.cardMetaText}>{formatDate(item.due_date)}</Text>
          {item.recurrence !== 'none' && (
            <View style={styles.badge}><Text style={styles.badgeText}>{item.recurrence}</Text></View>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={() => deleteReminder(item.id)}>
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  const renderAlarm = ({ item }) => (
    <View style={[styles.card, !item.is_active && styles.cardInactive]}>
      <View style={styles.alarmIcon}>
        <Ionicons name="alarm" size={22} color={item.is_active ? '#667EEA' : '#ccc'} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.label}</Text>
        <Text style={styles.cardDesc}>{formatDate(item.alarm_time)}</Text>
        {item.repeat_days ? (
          <Text style={styles.repeatText}>Repeats: {item.repeat_days}</Text>
        ) : null}
      </View>
      <Switch
        value={item.is_active}
        onValueChange={() => toggleAlarm(item.id, item.is_active)}
        trackColor={{ true: '#667EEA', false: '#ddd' }}
        thumbColor="#fff"
      />
      <TouchableOpacity onPress={() => deleteAlarm(item.id)} style={{ marginLeft: 8 }}>
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminders & Alarms</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => tab === 'reminders' ? setShowReminderModal(true) : setShowAlarmModal(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'reminders' && styles.tabActive]}
          onPress={() => setTab('reminders')}
        >
          <Ionicons name="notifications" size={16} color={tab === 'reminders' ? '#667EEA' : '#999'} />
          <Text style={[styles.tabText, tab === 'reminders' && styles.tabTextActive]}>Reminders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'alarms' && styles.tabActive]}
          onPress={() => setTab('alarms')}
        >
          <Ionicons name="alarm" size={16} color={tab === 'alarms' ? '#667EEA' : '#999'} />
          <Text style={[styles.tabText, tab === 'alarms' && styles.tabTextActive]}>Alarms</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#667EEA" />
        </View>
      ) : (
        <FlatList
          data={tab === 'reminders' ? reminders : alarms}
          keyExtractor={item => String(item.id)}
          renderItem={tab === 'reminders' ? renderReminder : renderAlarm}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name={tab === 'reminders' ? 'notifications-off' : 'alarm-outline'} size={48} color="#ddd" />
              <Text style={styles.emptyText}>No {tab} yet</Text>
              <Text style={styles.emptySubText}>Tap + to add one</Text>
            </View>
          }
        />
      )}

      {/* ── Reminder Modal ── */}
      <Modal visible={showReminderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Reminder</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Title *"
              value={reminderForm.title}
              onChangeText={v => setReminderForm(f => ({ ...f, title: v }))}
            />
            <TextInput
              style={[styles.modalInput, { height: 72 }]}
              placeholder="Description (optional)"
              value={reminderForm.description}
              onChangeText={v => setReminderForm(f => ({ ...f, description: v }))}
              multiline
            />
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar" size={18} color="#667EEA" />
              <Text style={styles.datePickerText}>
                {pickerDate ? formatDate(pickerDate.toISOString()) : 'Set Date & Time'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={pickerDate}
                mode="datetime"
                display="default"
                minimumDate={new Date()}
                onChange={(_, d) => { setShowDatePicker(false); if (d) setPickerDate(d); }}
              />
            )}
            <View style={styles.recurrenceRow}>
              {['none', 'daily', 'weekly', 'monthly'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.recChip, reminderForm.recurrence === r && styles.recChipActive]}
                  onPress={() => setReminderForm(f => ({ ...f, recurrence: r }))}
                >
                  <Text style={[styles.recChipText, reminderForm.recurrence === r && styles.recChipTextActive]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowReminderModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveReminder}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Alarm Modal ── */}
      <Modal visible={showAlarmModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Alarm</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Label *"
              value={alarmForm.label}
              onChangeText={v => setAlarmForm(f => ({ ...f, label: v }))}
            />
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time" size={18} color="#667EEA" />
              <Text style={styles.datePickerText}>
                {pickerTime ? formatDate(pickerTime.toISOString()) : 'Set Date & Time'}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={pickerTime}
                mode="datetime"
                display="default"
                minimumDate={new Date()}
                onChange={(_, d) => { setShowTimePicker(false); if (d) setPickerTime(d); }}
              />
            )}
            <TextInput
              style={styles.modalInput}
              placeholder="Repeat days (e.g. Mon,Wed,Fri) — leave blank for once"
              value={alarmForm.repeat_days}
              onChangeText={v => setAlarmForm(f => ({ ...f, repeat_days: v }))}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAlarmModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveAlarm}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8F9FA' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
                    borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle:    { fontSize: 17, fontWeight: '600', color: '#333' },
  addBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: '#667EEA',
                    alignItems: 'center', justifyContent: 'center' },
  tabs:           { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1,
                    borderBottomColor: '#F0F0F0' },
  tab:            { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    paddingVertical: 12, gap: 6 },
  tabActive:      { borderBottomWidth: 2, borderBottomColor: '#667EEA' },
  tabText:        { fontSize: 14, color: '#999', fontWeight: '500' },
  tabTextActive:  { color: '#667EEA', fontWeight: '600' },
  list:           { padding: 16, paddingBottom: 80 },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                    borderRadius: 12, padding: 14, marginBottom: 10,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardInactive:   { opacity: 0.5 },
  cardCheck:      { marginRight: 10 },
  alarmIcon:      { marginRight: 10 },
  cardBody:       { flex: 1 },
  cardTitle:      { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 2 },
  cardDesc:       { fontSize: 13, color: '#666', marginBottom: 4 },
  cardMeta:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText:   { fontSize: 12, color: '#999' },
  badge:          { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText:      { fontSize: 11, color: '#667EEA', fontWeight: '600' },
  repeatText:     { fontSize: 12, color: '#667EEA', marginTop: 2 },
  empty:          { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText:      { fontSize: 18, fontWeight: '600', color: '#ccc', marginTop: 12 },
  emptySubText:   { fontSize: 13, color: '#ccc', marginTop: 4 },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox:       { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
                    padding: 24, paddingBottom: 40 },
  modalTitle:     { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16 },
  modalInput:     { borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 10, padding: 12,
                    fontSize: 15, color: '#333', marginBottom: 12, backgroundColor: '#FAFAFA' },
  datePickerBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1,
                    borderColor: '#E8E8E8', borderRadius: 10, padding: 12, marginBottom: 12,
                    backgroundColor: '#FAFAFA' },
  datePickerText: { fontSize: 14, color: '#667EEA' },
  recurrenceRow:  { flexDirection: 'row', gap: 8, marginBottom: 16 },
  recChip:        { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1,
                    borderColor: '#E8E8E8', alignItems: 'center' },
  recChipActive:  { backgroundColor: '#667EEA', borderColor: '#667EEA' },
  recChipText:    { fontSize: 12, color: '#666' },
  recChipTextActive: { color: '#fff', fontWeight: '600' },
  modalActions:   { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn:      { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1,
                    borderColor: '#E8E8E8', alignItems: 'center' },
  cancelText:     { fontSize: 15, color: '#666', fontWeight: '500' },
  saveBtn:        { flex: 1, paddingVertical: 14, borderRadius: 10,
                    backgroundColor: '#667EEA', alignItems: 'center' },
  saveText:       { fontSize: 15, color: '#fff', fontWeight: '600' },
});
