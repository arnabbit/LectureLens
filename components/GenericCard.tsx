import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { M3 } from '@/constants/theme';
import { Concept } from '@/services/api';

interface GenericCardProps {
  concept: Concept;
}

const importanceConfig = {
  high: { label: 'HIGH', color: M3.error, bg: `${M3.error}1a` },
  medium: { label: 'MEDIUM', color: M3.secondary, bg: `${M3.secondary}1a` },
  low: { label: 'LOW', color: M3.outline, bg: `${M3.outline}1a` },
};

export default function GenericCard({ concept }: GenericCardProps) {
  const importance = (concept.importance || 'medium') as keyof typeof importanceConfig;
  const conf = importanceConfig[importance];

  return (
    <View style={styles.container}>
      {/* Title row with importance badge */}
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="book-open-page-variant"
          size={20}
          color={M3.tertiary}
        />
        <Text style={styles.conceptName}>{concept.name}</Text>
        <View style={[styles.importanceBadge, { backgroundColor: conf.bg }]}>
          <Text style={[styles.importanceText, { color: conf.color }]}>
            {conf.label}
          </Text>
        </View>
      </View>

      {/* Explanation */}
      <View style={styles.explanationCard}>
        <Text style={styles.explanationText}>{concept.explanation}</Text>
      </View>

      {/* Key takeaways */}
      {concept.keyTakeaways.length > 0 && (
        <View style={styles.takeawaysSection}>
          <View style={styles.takeawaysHeader}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={M3.primary} />
            <Text style={styles.takeawaysLabel}>Key Takeaways</Text>
          </View>
          {concept.keyTakeaways.map((takeaway, i) => (
            <View key={i} style={styles.takeawayRow}>
              <View style={styles.takeawayDot} />
              <Text style={styles.takeawayText}>{takeaway}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  conceptName: { fontFamily: 'Manrope_700Bold', fontSize: 18, color: M3.onSurface, flex: 1 },
  importanceBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  importanceText: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1 },
  explanationCard: {
    backgroundColor: M3.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
  },
  explanationText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: M3.onSurfaceVariant, lineHeight: 22 },
  takeawaysSection: { gap: 8, marginTop: 4 },
  takeawaysHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  takeawaysLabel: { fontFamily: 'Manrope_700Bold', fontSize: 14, color: M3.primary },
  takeawayRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginLeft: 4 },
  takeawayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: M3.primary, marginTop: 7 },
  takeawayText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: M3.onSurfaceVariant, lineHeight: 20, flex: 1 },
});
