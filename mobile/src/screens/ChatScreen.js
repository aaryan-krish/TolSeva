import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, SafeAreaView, StatusBar
} from 'react-native';
import { askBot } from '../services/api';

const SAFFRON = '#FF9933';
const GREEN   = '#138808';
const NAVY    = '#003087';

// Language picker options matching the web portal
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

// Quick-prompt chips for common vendor needs
const QUICK_PROMPTS = [
  { label: '📝 Register Instrument', query: 'How do I register a new weighing instrument?' },
  { label: '📅 Book Inspection',     query: 'How do I book an inspection appointment?' },
  { label: '🔍 Certificate Status',  query: 'How can I check my certificate validity?' },
  { label: '⚠️ Renewal Reminder',    query: 'When should I renew my weighing machine certificate?' },
  { label: '⚖️ Penalties',          query: 'What are the fines for unverified weighing machines?' },
  { label: '📞 Helpline',           query: 'What is the Legal Metrology helpline number?' },
];

// Renders a single chat bubble
function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowBot]}>
      {!isUser && (
        <View style={styles.avatarBot}>
          <Text style={styles.avatarText}>🧙</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
          {msg.text}
        </Text>
        <Text style={styles.bubbleTime}>{msg.time}</Text>
      </View>
      {isUser && (
        <View style={styles.avatarUser}>
          <Text style={styles.avatarText}>🏪</Text>
        </View>
      )}
    </View>
  );
}

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    {
      id: '0',
      role: 'bot',
      text: "🧙‍♂️ Hello! I'm Chat Wizard, your AI assistant for TolSeva Legal Metrology.\n\nI can help you with:\n• Registering new instruments\n• Booking inspection appointments\n• Certificate validity & renewal\n• Legal Metrology Act penalties\n• How to use the TolSeva platform\n\nAsk your question below or tap a quick prompt!",
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [lang, setLang]             = useState('en');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [error, setError]           = useState(null);
  const listRef = useRef(null);

  // Build conversation history for multi-turn context (last 10 turns)
  const buildHistory = useCallback((msgs) => {
    return msgs
      .filter(m => m.role === 'user' || m.role === 'bot')
      .slice(-10)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
  }, []);

  const sendMessage = useCallback(async (text) => {
    const query = (text || inputText).trim();
    if (!query || loading) return;
    setInputText('');
    setError(null);

    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: Date.now().toString(), role: 'user', text: query, time: now };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setLoading(true);

    try {
      const history = buildHistory(nextMsgs);
      const res = await askBot(query, lang, history);
      const reply = res?.data?.reply || 'Sorry, I could not generate a response. Please try again.';
      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: reply,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const status = err?.response?.status;
      let errText;
      if (status === 429) {
        errText = '⏳ Too many requests. Please wait a moment and try again.';
      } else if (!err?.response) {
        errText = '📡 Cannot reach the server. Check your internet connection and try again.';
      } else {
        errText = '⚠️ Chat Wizard is temporarily unavailable. You can still call helpline 1800-11-4000 (Mon–Fri 10AM–5PM).';
      }
      setError(errText);
      const errMsg = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: errText,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [inputText, loading, messages, lang, buildHistory]);

  const selectedLangLabel = LANGUAGES.find(l => l.code === lang)?.label || 'English';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={SAFFRON} barStyle="light-content" />

      {/* Subheader: language picker */}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderTitle}>🧙‍♂️ Chat Wizard</Text>
        <TouchableOpacity
          style={styles.langBtn}
          onPress={() => setShowLangPicker(p => !p)}
          accessibilityLabel="Select language"
        >
          <Text style={styles.langBtnText}>{selectedLangLabel} ▾</Text>
        </TouchableOpacity>
      </View>

      {/* Language dropdown */}
      {showLangPicker && (
        <View style={styles.langDropdown}>
          {LANGUAGES.map(l => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langOption, l.code === lang && styles.langOptionActive]}
              onPress={() => { setLang(l.code); setShowLangPicker(false); }}
            >
              <Text style={[styles.langOptionText, l.code === lang && styles.langOptionTextActive]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {/* Message list */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => <ChatBubble msg={item} />}
          ListFooterComponent={
            loading ? (
              <View style={styles.typingRow}>
                <View style={styles.avatarBot}>
                  <Text style={styles.avatarText}>🧙</Text>
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={SAFFRON} />
                  <Text style={styles.typingText}>Chat Wizard is thinking…</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick prompts — show only when no conversation is underway */}
        {messages.length <= 1 && !loading && (
          <View style={styles.quickRow}>
            <FlatList
              horizontal
              data={QUICK_PROMPTS}
              keyExtractor={item => item.query}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.chip}
                  onPress={() => sendMessage(item.query)}
                >
                  <Text style={styles.chipText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask Chat Wizard…"
            placeholderTextColor="#aaa"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={800}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || loading}
            accessibilityLabel="Send message"
          >
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f4f8' },

  subHeader: {
    backgroundColor: SAFFRON,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subHeaderTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  langBtn: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  langBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  langDropdown: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 6,
    elevation: 4,
    zIndex: 99,
  },
  langOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  langOptionActive: { backgroundColor: '#fff7ed', borderColor: SAFFRON },
  langOptionText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  langOptionTextActive: { color: SAFFRON, fontWeight: 'bold' },

  messageList: { padding: 12, paddingBottom: 4 },

  bubbleRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowBot:  { justifyContent: 'flex-start' },

  avatarBot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#fff3e0',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 6, borderWidth: 1, borderColor: '#ffe0b2'
  },
  avatarUser: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#e8f5e9',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 6, borderWidth: 1, borderColor: '#c8e6c9'
  },
  avatarText: { fontSize: 16 },

  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
  },
  bubbleBot: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bubbleUser: {
    backgroundColor: SAFFRON,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextBot: { color: '#1f2937' },
  bubbleTextUser: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: '#9ca3af', marginTop: 4, textAlign: 'right' },

  typingRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center', paddingLeft: 4 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  typingText: { color: '#9ca3af', fontSize: 12, fontStyle: 'italic' },

  quickRow: { paddingVertical: 8, borderTopWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    elevation: 1,
  },
  chipText: { fontSize: 12, color: '#374151', fontWeight: '600' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 14,
    backgroundColor: '#f9fafb',
    color: '#1f2937',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: SAFFRON,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  sendBtnDisabled: { backgroundColor: '#d1d5db' },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
