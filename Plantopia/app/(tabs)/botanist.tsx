import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { sendBotanistMessage } from '@/services/aiService'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const QUICK_QUESTIONS = [
  'Why are my leaves turning yellow?',
  'How often should I water my fern?',
  'Best low-light plants?',
  'When should I repot?',
]

export default function ChatBotanistScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm your AI botanist 🌱 Ask me anything about your plants — care tips, troubleshooting, or plant recommendations!",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const listRef = useRef<FlatList>(null)
  const hasConversation = messages.length > 1

  async function handleSend(text = input.trim()) {
    if (!text || isLoading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const history = messages
        .filter((m) => m.id !== '0')
        .map((m) => ({ role: m.role, content: m.content }))

      const { assistant_message } = await sendBotanistMessage(
        { plant_name: 'General', scientific_name: '', care_instructions: {} },
        text,
        history
      )

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: assistant_message },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarIcon}>🤖</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>AI Botanist</Text>
          <Text style={styles.headerSubtitle}>Always available</Text>
        </View>
      </View>
      <View style={styles.divider} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={item.role === 'user' ? styles.userRow : styles.assistantRow}>
              {item.role === 'assistant' && (
                <View style={styles.assistantAvatar}>
                  <Text style={styles.assistantAvatarIcon}>🤖</Text>
                </View>
              )}
              <View style={[
                styles.bubble,
                item.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}>
                <Text style={[styles.bubbleText, item.role === 'user' && styles.userBubbleText]}>
                  {item.content}
                </Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            <>
              {isLoading && (
                <View style={styles.assistantRow}>
                  <View style={styles.assistantAvatar}>
                    <Text style={styles.assistantAvatarIcon}>🤖</Text>
                  </View>
                  <View style={styles.typingBubble}>
                    <ActivityIndicator size="small" color="#4a7c59" />
                  </View>
                </View>
              )}
              {!hasConversation && !isLoading && (
                <View style={styles.quickSection}>
                  <Text style={styles.quickLabel}>Quick questions</Text>
                  <View style={styles.quickGrid}>
                    {QUICK_QUESTIONS.map((q) => (
                      <TouchableOpacity key={q} style={styles.quickPill} onPress={() => handleSend(q)}>
                        <Text style={styles.quickPillText}>{q}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your plants..."
              placeholderTextColor="#aaa"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
              onPress={() => handleSend()}
              disabled={!input.trim() || isLoading}
              accessibilityLabel="Send message"
            >
              <Text style={styles.sendIcon}>✈</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EAEAE4' },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: '#EAEAE4',
  },
  botAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D8D8D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botAvatarIcon: { fontSize: 22 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 13, color: '#666', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#D4D4CC', marginHorizontal: 0 },

  // Messages
  messageList: { padding: 16, paddingBottom: 8 },
  assistantRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, gap: 8 },
  userRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D8D8D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantAvatarIcon: { fontSize: 16 },
  bubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  assistantBubble: { backgroundColor: '#fff' },
  userBubble: { backgroundColor: '#3D5A3E' },
  bubbleText: { fontSize: 15, color: '#1a1a1a', lineHeight: 22 },
  userBubbleText: { color: '#fff' },
  typingBubble: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  // Quick questions
  quickSection: { marginTop: 20, paddingHorizontal: 4 },
  quickLabel: { fontSize: 14, color: '#4a7c59', fontWeight: '600', marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickPill: {
    borderWidth: 1.5,
    borderColor: '#C8C8C0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EAEAE4',
  },
  quickPillText: { fontSize: 14, color: '#1a1a1a' },

  // Input
  inputBar: {
    backgroundColor: '#EAEAE4',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    maxHeight: 100,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D4A2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#C8C8C0' },
  sendIcon: { fontSize: 16, color: '#fff' },
})
