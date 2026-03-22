import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { M3 } from '@/constants/theme';
import { gemini, GeminiMessage } from '@/services/gemini';
import Markdown from 'react-native-markdown-display';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { problemStatement, approaches } = useLocalSearchParams<{
    problemStatement: string;
    approaches: string;
  }>();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const systemContext = buildSystemContext(problemStatement, approaches);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const history: GeminiMessage[] = [...messages, userMsg].map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const reply = await gemini.sendMessage(history, systemContext);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-r`, role: 'model', text: reply },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-e`, role: 'model', text: `Error: ${e.message}` },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, systemContext]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.modelBubble]}>
        {isUser ? (
          <Text style={[styles.bubbleText, styles.userText]}>{item.text}</Text>
        ) : (
          <Markdown style={mdStyles}>{item.text}</Markdown>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="close" size={24} color={M3.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>AI Chat</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="robot-outline" size={48} color={M3.outlineVariant} />
            <Text style={styles.emptyText}>Ask anything about this problem</Text>
            <Text style={styles.emptySub}>
              The AI has full context of the problem statement and all approaches.
            </Text>
          </View>
        }
      />

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your question..."
          placeholderTextColor={M3.outline}
          multiline
          maxLength={2000}
          editable={!sending}
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={M3.onPrimary} />
          ) : (
            <MaterialCommunityIcons name="send" size={20} color={M3.onPrimary} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function buildSystemContext(problemStatement?: string, approachesJson?: string): string {
  let ctx = 'You are a helpful tutor. The student is studying the following problem:\n\n';
  ctx += `Problem Statement:\n${problemStatement ?? 'N/A'}\n\n`;

  try {
    const approaches = JSON.parse(approachesJson ?? '[]');
    if (approaches.length > 0) {
      ctx += 'Approaches:\n';
      for (const a of approaches) {
        ctx += `\n--- ${a.name} ---\n`;
        if (a.complexity?.time) ctx += `Time: ${a.complexity.time}\n`;
        if (a.complexity?.space) ctx += `Space: ${a.complexity.space}\n`;
        ctx += `${a.explanation}\n`;
      }
    }
  } catch {}

  ctx += '\nHelp the student understand this problem. Be concise and clear.';
  return ctx;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M3.surface },

  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: M3.surface,
    borderBottomWidth: 1,
    borderBottomColor: M3.outlineVariant,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Manrope_700Bold', fontSize: 18, color: M3.primary },

  messageList: { padding: 24, paddingBottom: 16, flexGrow: 1 },

  bubble: { maxWidth: '80%', borderRadius: 16, padding: 14, marginBottom: 12 },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: M3.primary,
    borderBottomRightRadius: 4,
  },
  modelBubble: {
    alignSelf: 'flex-start',
    backgroundColor: M3.surfaceContainerLow,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 },
  userText: { color: M3.onPrimary },
  modelText: { color: M3.onSurface },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8, paddingHorizontal: 40 },
  emptyText: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: M3.onSurfaceVariant },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: M3.outline,
    textAlign: 'center',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: M3.outlineVariant,
    backgroundColor: M3.surface,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: M3.onSurface,
    backgroundColor: M3.surfaceContainerLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: M3.outlineVariant,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: M3.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});

const mdStyles = StyleSheet.create({
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22, color: M3.onSurface },
  strong: { fontFamily: 'Inter_600SemiBold' },
  heading1: { fontFamily: 'Manrope_700Bold', fontSize: 18, color: M3.onSurface, marginBottom: 4 },
  heading2: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: M3.onSurface, marginBottom: 4 },
  heading3: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: M3.onSurface, marginBottom: 4 },
  code_inline: {
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: `${M3.outlineVariant}33`,
    paddingHorizontal: 4,
    borderRadius: 4,
    color: M3.primary,
  },
  fence: {
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: `${M3.outlineVariant}33`,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  paragraph: { marginVertical: 2 },
});
