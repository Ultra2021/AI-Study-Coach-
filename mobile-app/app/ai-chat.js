import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_CONFIG, COLORS } from '../config';

const BASE_URL = API_CONFIG.BASE_URL;

const QUICK_PROMPTS = [
  'Create a study plan for me',
  'How can I improve my focus?',
  'Give me memory techniques',
  'Help me manage study time',
  'Explain the Pomodoro technique',
  'How to reduce exam anxiety?',
];

export default function AIChatScreen() {
  const router = useRouter();
  const { prefill } = useLocalSearchParams();
  const flatListRef = useRef(null);

  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState(prefill || '');
  const [loading, setLoading]             = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [userId, setUserId]               = useState(null);

  // ─── Load user + chat history ───────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const raw  = await AsyncStorage.getItem('user');
        const user = raw ? JSON.parse(raw) : null;
        if (!user?.id) { router.replace('/'); return; }
        setUserId(user.id);
        await loadHistory(user.id);
      } catch {
        setHistoryLoading(false);
      }
    };
    init();
  }, []);

  const loadHistory = async (uid) => {
    try {
      const res  = await fetch(`${BASE_URL}/api/ai/chat/history?user_id=${uid}&limit=30`);
      const data = await res.json();
      if (data.success && data.history?.length) {
        const mapped = [];
        data.history.forEach(h => {
          mapped.push({ id: `u-${h.id}`, role: 'user',  text: h.user_message, ts: h.created_at });
          mapped.push({ id: `a-${h.id}`, role: 'model', text: h.ai_response,  ts: h.created_at });
        });
        setMessages(mapped);
      }
    } catch { /* ignore */ }
    setHistoryLoading(false);
  };

  // ─── Send message ────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading || !userId) return;

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text: msg, ts: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res  = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, message: msg }),
      });
      const data = await res.json();
      const aiMsg = {
        id:   `a-${Date.now()}`,
        role: 'model',
        text: data.success ? data.reply : `Error: ${data.error || 'Unknown error'}`,
        ts:   new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`, role: 'model',
        text: 'Network error. Please check your connection.', ts: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Clear history ───────────────────────────────────────────────────────
  const clearHistory = () => {
    Alert.alert('Clear History', 'Delete all chat messages?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          await fetch(`${BASE_URL}/api/ai/chat/history`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId }),
          });
          setMessages([]);
        },
      },
    ]);
  };

  // ─── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // ─── Markdown renderer for AI messages ───────────────────────────────
  const renderInline = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*|\^\^[^\^]+\^\^)/);
    return parts.map((part, i) => {
      if (/^\*\*(.+)\*\*$/.test(part))
        return <Text key={i} style={styles.bold}>{part.slice(2, -2)}</Text>;
      if (/^\^\^(.+)\^\^$/.test(part))
        return <Text key={i} style={styles.bold}>{part.slice(2, -2)}</Text>;
      return <Text key={i}>{part}</Text>;
    });
  };

  const renderFormattedText = (text) =>
    text.split('\n').map((line, i) => {
      if (!line.trim()) return <View key={i} style={{ height: 5 }} />;

      // Numbered list: "1. ..."
      const numMatch = line.match(/^\s*(\d+)\.\s(.*)/);
      if (numMatch)
        return (
          <View key={i} style={styles.listRow}>
            <Text style={styles.listNum}>{numMatch[1]}.</Text>
            <Text style={styles.listText}>{renderInline(numMatch[2])}</Text>
          </View>
        );

      // Bullet: "* ..." or "- ..."
      const bulletMatch = line.match(/^\s*[\*\-]\s(.*)/);
      if (bulletMatch)
        return (
          <View key={i} style={styles.listRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>{renderInline(bulletMatch[1])}</Text>
          </View>
        );

      // Header: line that is entirely **bold** or starts with #
      const headerMatch = line.trim().match(/^\*\*(.+)\*\*:?$/) || line.match(/^#+\s(.+)/);
      if (headerMatch)
        return (
          <Text key={i} style={styles.mdHeader}>
            {headerMatch[1]}
          </Text>
        );

      return (
        <Text key={i} style={styles.mdPara}>{renderInline(line)}</Text>
      );
    });

  // ─── Render ───────────────────────────────────────────────────────────
  const renderMessage = ({ item }) => (
    <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
      {item.role === 'model' && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={14} color="#fff" />
        </View>
      )}
      <View style={[styles.bubbleContent, item.role === 'user' ? styles.userContent : styles.aiContent]}>
        {item.role === 'user' ? (
          <Text style={[styles.bubbleText, styles.userText]}>{item.text}</Text>
        ) : (
          <View>{renderFormattedText(item.text)}</View>
        )}
      </View>
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
        <View style={styles.headerCenter}>
          <Ionicons name="sparkles" size={18} color="#667EEA" />
          <Text style={styles.headerTitle}>AI Study Coach</Text>
        </View>
        <TouchableOpacity onPress={clearHistory}>
          <Ionicons name="trash-outline" size={22} color="#999" />
        </TouchableOpacity>
      </View>

      {historyLoading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#667EEA" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {messages.length === 0 ? (
            <ScrollView contentContainerStyle={styles.emptyContainer}>
              <Ionicons name="sparkles" size={48} color="#667EEA" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>Ask your AI Study Coach</Text>
              <Text style={styles.emptySubtitle}>I can help you study smarter and stay on track</Text>
              <View style={styles.quickPrompts}>
                {QUICK_PROMPTS.map((p, i) => (
                  <TouchableOpacity key={i} style={styles.quickChip} onPress={() => sendMessage(p)}>
                    <Text style={styles.quickChipText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {loading && (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#667EEA" />
              <Text style={styles.typingText}>AI is thinking...</Text>
            </View>
          )}

          {/* Input */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask anything about studying..."
              placeholderTextColor="#999"
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8F9FA' },
  flex:           { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
                    borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerCenter:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle:    { fontSize: 17, fontWeight: '600', color: '#333' },
  centerLoader:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:    { marginTop: 10, color: '#666', fontSize: 14 },
  emptyContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center',
                    paddingHorizontal: 24, paddingTop: 40 },
  emptyTitle:     { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptySubtitle:  { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 28 },
  quickPrompts:   { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  quickChip:      { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 14,
                    paddingVertical: 8, marginBottom: 4 },
  quickChipText:  { color: '#667EEA', fontSize: 13, fontWeight: '500' },
  messageList:    { padding: 16, paddingBottom: 8 },
  bubble:         { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  userBubble:     { justifyContent: 'flex-end' },
  aiBubble:       { justifyContent: 'flex-start' },
  aiAvatar:       { width: 28, height: 28, borderRadius: 14, backgroundColor: '#667EEA',
                    alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 2 },
  bubbleContent:  { maxWidth: '80%', borderRadius: 16, padding: 12 },
  userContent:    { backgroundColor: '#667EEA', borderBottomRightRadius: 4 },
  aiContent:      { backgroundColor: '#fff', borderBottomLeftRadius: 4,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  bubbleText:     { fontSize: 15, lineHeight: 22 },
  userText:       { color: '#fff' },
  aiText:         { color: '#333' },
  bold:           { fontWeight: '700', color: '#333' },
  mdHeader:       { fontWeight: '700', fontSize: 15, color: '#333', marginTop: 8, marginBottom: 4 },
  mdPara:         { fontSize: 14, lineHeight: 22, color: '#333', marginBottom: 2 },
  listRow:        { flexDirection: 'row', marginBottom: 4, paddingRight: 4 },
  listNum:        { color: '#667EEA', fontWeight: '700', marginRight: 6, minWidth: 20, fontSize: 14 },
  bullet:         { color: '#667EEA', fontWeight: '700', marginRight: 8, fontSize: 14 },
  listText:       { flex: 1, fontSize: 14, lineHeight: 22, color: '#333' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  typingText:     { color: '#667EEA', fontSize: 13 },
  inputBar:       { flexDirection: 'row', alignItems: 'flex-end', padding: 12,
                    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 8 },
  input:          { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 22, paddingHorizontal: 16,
                    paddingVertical: 10, fontSize: 15, color: '#333', maxHeight: 100,
                    borderWidth: 1, borderColor: '#E8E8E8' },
  sendBtn:        { width: 42, height: 42, borderRadius: 21, backgroundColor: '#667EEA',
                    alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#C5CAE9' },
});
