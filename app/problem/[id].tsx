import { M3 } from '@/constants/theme';
import { api, Problem } from '@/services/api';
import { gemini } from '@/services/gemini';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const STORAGE_KEY_STYLES = 'rephrase_styles';
const STORAGE_KEY_CONTEXTS = 'rephrase_contexts';
const DEFAULT_STYLES = ['Om Swami(Author and Monk)'];
const DEFAULT_CONTEXTS = ['Concise with context', 'Detailed with context', 'TLDR mode', 'Detailed like Author talking to the reader'];

export default function ProblemDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedApproach, setExpandedApproach] = useState<number>(0);

  // Rephrase state
  const [showRephrase, setShowRephrase] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const [rephrasing, setRephrasing] = useState(false);
  const [rephrasedTexts, setRephrasedTexts] = useState<Record<number, string>>({});
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [customStyles, setCustomStyles] = useState<string[]>(DEFAULT_STYLES);
  const [customContexts, setCustomContexts] = useState<string[]>(DEFAULT_CONTEXTS);
  const [newStyleText, setNewStyleText] = useState('');
  const [newContextText, setNewContextText] = useState('');

  useEffect(() => {
    (async () => {
      const [styles, contexts] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_STYLES),
        AsyncStorage.getItem(STORAGE_KEY_CONTEXTS),
      ]);
      if (styles) setCustomStyles(JSON.parse(styles));
      if (contexts) setCustomContexts(JSON.parse(contexts));
    })();
  }, []);

  const saveStyles = async (styles: string[]) => {
    setCustomStyles(styles);
    await AsyncStorage.setItem(STORAGE_KEY_STYLES, JSON.stringify(styles));
  };

  const saveContexts = async (contexts: string[]) => {
    setCustomContexts(contexts);
    await AsyncStorage.setItem(STORAGE_KEY_CONTEXTS, JSON.stringify(contexts));
  };

  const addStyle = () => {
    const val = newStyleText.trim();
    if (!val || customStyles.includes(val)) return;
    saveStyles([...customStyles, val]);
    setNewStyleText('');
  };

  const removeStyle = (style: string) => {
    saveStyles(customStyles.filter((s) => s !== style));
    if (selectedStyle === style) setSelectedStyle('');
  };

  const addContext = () => {
    const val = newContextText.trim();
    if (!val || customContexts.includes(val)) return;
    saveContexts([...customContexts, val]);
    setNewContextText('');
  };

  const removeContext = (ctx: string) => {
    saveContexts(customContexts.filter((c) => c !== ctx));
    if (selectedContext === ctx) setSelectedContext('');
  };

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      api.getProblem(id).then(setProblem).catch(console.warn).finally(() => setLoading(false));
      gemini.hasApiKey().then(setHasGeminiKey);
    }, [id])
  );

  const handleRephrase = async () => {
    if (!problem) return;
    setRephrasing(true);
    setShowRephrase(false);
    try {
      const results = await Promise.all(
        problem.approaches.map((_, i) =>
          api.rephrase(problem._id, selectedStyle, selectedContext, i)
        )
      );
      setRephrasedTexts(
        results.reduce((acc, res, i) => ({ ...acc, [i]: res.rephrased }), {})
      );
    } catch (e) {
      console.warn('Rephrase failed:', e);
    } finally {
      setRephrasing(false);
    }
  };

  if (loading || !problem) {
    return <View style={styles.center}><ActivityIndicator size="large" color={M3.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={M3.primary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {problem.problemStatement.substring(0, 30)}...
          </Text>
        </View>

        {/* Problem Statement */}
        <View style={styles.statementCard}>
          <View style={styles.statementLabel}>
            <Text style={styles.statementLabelText}>PROBLEM STATEMENT</Text>
            <View style={styles.labelLine} />
          </View>
          <Text style={styles.statementText}>{problem.problemStatement}</Text>
          {problem.category && (
            <View style={styles.tags}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{problem.category.toUpperCase()}</Text>
              </View>
              {problem.sectionName && (
                <View style={[styles.tag, { backgroundColor: M3.surfaceContainerHighest }]}>
                  <Text style={[styles.tagText, { color: M3.onSurfaceVariant }]}>{problem.sectionName}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Approaches */}
        <Text style={styles.approachesTitle}>Approaches</Text>
        {[...problem.approaches]
          .sort((a, b) => (a.optimisationScore ?? 0) - (b.optimisationScore ?? 0))
          .map((approach, index, sorted) => {
          const isExpanded = expandedApproach === index;
          const displayText = rephrasedTexts[index] ?? approach.explanation;
          const isBest = index === sorted.length - 1;
          return (
            <Pressable
              key={index}
              style={[
                styles.approachCard,
                isExpanded && styles.approachCardExpanded,
              ]}
              onPress={() => setExpandedApproach(isExpanded ? -1 : index)}
            >
              <View style={styles.approachHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.approachNameRow}>
                    <Text style={styles.approachName}>{approach.name}</Text>
                    {isBest && (
                      <MaterialCommunityIcons name="star" size={14} color={M3.secondary} />
                    )}
                  </View>
                  <View style={styles.complexityRow}>
                    {approach.complexity?.time && (
                      <View style={[styles.complexityBadge, { backgroundColor: `${M3.secondary}1a` }]}>
                        <Text style={[styles.complexityText, { color: M3.secondary }]}>
                          {approach.complexity.time} Time
                        </Text>
                      </View>
                    )}
                    {approach.complexity?.space && (
                      <View style={[styles.complexityBadge, { backgroundColor: `${M3.primary}1a` }]}>
                        <Text style={[styles.complexityText, { color: M3.primary }]}>
                          {approach.complexity.space} Space
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <MaterialCommunityIcons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={M3.outline}
                />
              </View>

              {isExpanded && (
                <View style={styles.approachBody}>
                  {rephrasing ? (
                    <ActivityIndicator color={M3.primary} style={{ paddingVertical: 20 }} />
                  ) : (
                    <Text style={styles.approachExplanation}>{displayText}</Text>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}

        {/* Key Insights */}
        {problem.keyInsights?.length > 0 && (
          <View style={styles.insightsCard}>
            <View style={styles.insightsHeader}>
              <MaterialCommunityIcons name="lightbulb-outline" size={20} color={M3.primary} />
              <Text style={styles.insightsTitle}>Critical Insights</Text>
            </View>
            {problem.keyInsights.map((insight, i) => (
              <View key={i} style={styles.insightRow}>
                <View style={styles.insightDot} />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Rephrase button */}
        <Pressable
          style={[styles.rephraseBtn, rephrasing && styles.rephraseBtnDisabled]}
          onPress={() => !rephrasing && setShowRephrase(true)}
          disabled={rephrasing}
        >
          {rephrasing ? (
            <ActivityIndicator size="small" color={M3.onPrimary} />
          ) : (
            <MaterialCommunityIcons name="auto-fix" size={20} color={M3.onPrimary} />
          )}
          <Text style={styles.rephraseBtnText}>
            {rephrasing ? 'Rephrasing…' : 'Rephrase All Explanations'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Rephrase Bottom Sheet (as Modal) */}
      <Modal visible={showRephrase} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowRephrase(false)}>
          <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Rephrase Settings</Text>

            <Text style={styles.sheetLabel}>INSTRUCTOR STYLE</Text>
            <View style={styles.sheetOptions}>
              {customStyles.map((style) => (
                <Pressable
                  key={style}
                  style={[
                    styles.sheetOption,
                    selectedStyle === style && styles.sheetOptionActive,
                  ]}
                  onPress={() => setSelectedStyle(style)}
                  onLongPress={() =>
                    Alert.alert('Remove Style', `Remove "${style}"?`, [
                      { text: 'Cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => removeStyle(style) },
                    ])
                  }
                >
                  <Text style={[
                    styles.sheetOptionText,
                    selectedStyle === style && styles.sheetOptionTextActive,
                  ]}>{style}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                placeholder="Add author/style…"
                placeholderTextColor={M3.outline}
                value={newStyleText}
                onChangeText={setNewStyleText}
                onSubmitEditing={addStyle}
              />
              <Pressable style={styles.addBtn} onPress={addStyle}>
                <MaterialCommunityIcons name="plus" size={20} color={M3.onPrimary} />
              </Pressable>
            </View>

            <Text style={styles.sheetLabel}>DEPTH</Text>
            <View style={styles.sheetOptions}>
              {customContexts.map((ctx) => (
                <Pressable
                  key={ctx}
                  style={[
                    styles.sheetOption,
                    selectedContext === ctx && styles.sheetOptionActive,
                  ]}
                  onPress={() => setSelectedContext(ctx)}
                  onLongPress={() =>
                    Alert.alert('Remove Depth', `Remove "${ctx}"?`, [
                      { text: 'Cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => removeContext(ctx) },
                    ])
                  }
                >
                  <Text style={[
                    styles.sheetOptionText,
                    selectedContext === ctx && styles.sheetOptionTextActive,
                  ]}>{ctx}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.addRow}>
              <TextInput
                style={styles.addInput}
                placeholder="Add depth/context…"
                placeholderTextColor={M3.outline}
                value={newContextText}
                onChangeText={setNewContextText}
                onSubmitEditing={addContext}
              />
              <Pressable style={styles.addBtn} onPress={addContext}>
                <MaterialCommunityIcons name="plus" size={20} color={M3.onPrimary} />
              </Pressable>
            </View>

            <Pressable style={styles.applyBtn} onPress={handleRephrase}>
              <Text style={styles.applyBtnText}>Apply Transformation</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Floating chat button */}
      <Pressable
        style={[styles.chatFab, !hasGeminiKey && styles.chatFabDisabled]}
        disabled={!hasGeminiKey}
        onPress={() =>
          problem &&
          router.push({
            pathname: '/chat',
            params: {
              problemStatement: problem.problemStatement,
              approaches: JSON.stringify(problem.approaches),
            },
          })
        }
      >
        <MaterialCommunityIcons
          name="chat-outline"
          size={24}
          color={M3.onSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M3.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: M3.surface },
  content: { paddingHorizontal: 24, paddingBottom: 40 },

  header: { paddingTop: 56, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: M3.primary, flex: 1 },

  // Problem statement
  statementCard: {
    backgroundColor: M3.surfaceContainerLow,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  statementLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  statementLabelText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: M3.primary, letterSpacing: 1.5 },
  labelLine: { flex: 1, height: 1, backgroundColor: `${M3.outlineVariant}4d` },
  statementText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 18,
    color: M3.onSurface,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  tags: { flexDirection: 'row', gap: 8, marginTop: 20, flexWrap: 'wrap' },
  tag: { backgroundColor: M3.secondaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, flexShrink: 1, maxWidth: '100%' },
  tagText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: M3.onSecondaryContainer },

  // Approaches
  approachesTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    color: M3.primary,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  approachCard: {
    backgroundColor: M3.surfaceContainerLow,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  approachCardExpanded: {
    backgroundColor: M3.surfaceContainerLowest,
    borderLeftWidth: 4,
    borderLeftColor: M3.secondary,
  },
  approachHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  approachNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  approachName: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: M3.onSurface },
  complexityRow: { flexDirection: 'row', gap: 8 },
  complexityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  complexityText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  approachBody: { marginTop: 16 },
  approachExplanation: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: M3.onSurfaceVariant,
    lineHeight: 22,
  },

  // Insights
  insightsCard: {
    backgroundColor: `${M3.surfaceContainerHighest}4d`,
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    marginBottom: 24,
  },
  insightsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  insightsTitle: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: M3.primary },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 12 },
  insightDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: M3.secondary, marginTop: 6 },
  insightText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: M3.onSurfaceVariant, lineHeight: 22, flex: 1 },

  // Rephrase button
  rephraseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: M3.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  rephraseBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: M3.onPrimary },
  rephraseBtnDisabled: { opacity: 0.5 },

  // Bottom sheet modal
  modalOverlay: {
    flex: 1,
    backgroundColor: `${M3.onBackground}66`,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: M3.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 32,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 48,
    height: 6,
    backgroundColor: M3.outlineVariant,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  sheetTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 22, color: M3.primary, marginBottom: 24 },
  sheetLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: M3.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  sheetOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  sheetOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: M3.outlineVariant,
  },
  sheetOptionActive: {
    borderColor: M3.primary,
    backgroundColor: `${M3.primary}0d`,
  },
  sheetOptionText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: M3.onSurfaceVariant },
  sheetOptionTextActive: { fontFamily: 'Inter_600SemiBold', color: M3.primary },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  addInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: M3.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: M3.onSurface,
  },
  addBtn: {
    backgroundColor: M3.primary,
    borderRadius: 10,
    width: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtn: {
    backgroundColor: M3.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  applyBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: M3.onSecondary },

  // Floating chat button
  chatFab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: M3.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  chatFabDisabled: { opacity: 0.3 },
});
