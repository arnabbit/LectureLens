import { StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { M3 } from '@/constants/theme';

interface Approach {
  name: string;
  complexity?: { time: string; space: string };
  optimisationScore?: number;
  explanation: string;
}

interface DSACardProps {
  problemName: string;
  problemStatement: string;
  approaches: Approach[];
  keyInsights: string[];
  onPressApproach: (index: number) => void;
  expandedApproach: number | null;
}

export default function DSACard({
  problemName,
  problemStatement,
  approaches,
  keyInsights,
  onPressApproach,
  expandedApproach,
}: DSACardProps) {
  const sorted = [...approaches].sort(
    (a, b) => (a.optimisationScore ?? 0) - (b.optimisationScore ?? 0)
  );
  const bestScore = Math.max(...sorted.map((a) => a.optimisationScore ?? 0), 0);

  return (
    <View style={styles.container}>
      {/* Problem name header */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="code-braces"
          size={22}
          color={M3.secondary}
        />
        <Text style={styles.problemName}>{problemName || problemStatement.substring(0, 40)}</Text>
      </View>

      {/* Problem statement */}
      <Text style={styles.problemStatement}>{problemStatement}</Text>

      {/* Approaches section */}
      <Text style={styles.sectionLabel}>
        APPROACHES ({sorted.length})
      </Text>

      {sorted.map((approach, index) => {
        const isExpanded = expandedApproach === index;
        const isBest = approach.optimisationScore === bestScore && bestScore > 1;

        return (
          <Pressable
            key={index}
            style={[
              styles.approachCard,
              isExpanded && styles.approachCardExpanded,
            ]}
            onPress={() => onPressApproach(index)}
          >
            <View style={styles.approachHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.approachNameRow}>
                  <Text style={styles.approachName}>{approach.name}</Text>
                  {isBest && (
                    <MaterialCommunityIcons name="star" size={14} color={M3.secondary} />
                  )}
                </View>
                {/* Complexity badges — only show if available */}
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
                  {!approach.complexity && (
                    <Text style={styles.noComplexity}>No complexity data</Text>
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
                <Text style={styles.approachExplanation}>{approach.explanation}</Text>
              </View>
            )}
          </Pressable>
        );
      })}

      {/* Key insights */}
      {keyInsights.length > 0 && (
        <View style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <MaterialCommunityIcons name="lightbulb-outline" size={20} color={M3.primary} />
            <Text style={styles.insightsTitle}>Critical Insights</Text>
          </View>
          {keyInsights.map((insight, i) => (
            <View key={i} style={styles.insightRow}>
              <View style={styles.insightDot} />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  problemName: { fontFamily: 'Manrope_700Bold', fontSize: 18, color: M3.onSurface },
  problemStatement: { fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: M3.onSurfaceVariant, lineHeight: 22 },
  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: M3.onSurfaceVariant, letterSpacing: 1.5 },
  approachCard: { backgroundColor: M3.surfaceContainerLow, borderRadius: 12, padding: 16, marginBottom: 8 },
  approachCardExpanded: { backgroundColor: M3.surfaceContainerLowest, borderLeftWidth: 4, borderLeftColor: M3.secondary },
  approachHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  approachNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  approachName: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: M3.onSurface },
  complexityRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  complexityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  complexityText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  noComplexity: { fontFamily: 'Inter_400Regular', fontSize: 10, color: M3.outline },
  approachBody: { marginTop: 16 },
  approachExplanation: { fontFamily: 'Inter_400Regular', fontSize: 14, color: M3.onSurfaceVariant, lineHeight: 22 },
  insightsCard: { backgroundColor: `${M3.surfaceContainerHighest}4d`, borderRadius: 16, padding: 20, marginTop: 8 },
  insightsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  insightsTitle: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: M3.primary },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  insightDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: M3.secondary, marginTop: 6 },
  insightText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: M3.onSurfaceVariant, lineHeight: 22, flex: 1 },
});
