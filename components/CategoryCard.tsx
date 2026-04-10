import { View, StyleSheet, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { M3 } from '@/constants/theme';
import { Problem, Concept } from '@/services/api';
import DSACard from './DSACard';
import GenericCard from './GenericCard';

interface CategoryCardProps {
  problem: Problem;
  expandedApproach: number | null;
  onApproachPress: (index: number) => void;
}

export default function CategoryCard({ problem, expandedApproach, onApproachPress }: CategoryCardProps) {
  // DSA content — render with approaches, complexity, etc.
  if (problem.category === 'dsa' && problem.approaches?.length > 0) {
    return (
      <DSACard
        problemName={problem.problemName || ''}
        problemStatement={problem.problemStatement}
        approaches={problem.approaches}
        keyInsights={problem.keyInsights || []}
        expandedApproach={expandedApproach}
        onPressApproach={onApproachPress}
      />
    );
  }

  // Generic content — render concept cards
  if (problem.concepts && problem.concepts.length > 0) {
    return (
      <View style={styles.genericList}>
        {problem.concepts.map((concept, i) => (
          <GenericCard key={i} concept={concept} />
        ))}
      </View>
    );
  }

  // Fallback: if it has a problemStatement but no approaches, treat as generic
  if (problem.problemStatement) {
    return (
      <View style={styles.fallback}>
        <View style={styles.fallbackCard}>
          <MaterialCommunityIcons name="text-box" size={20} color={M3.tertiary} />
          <Text style={styles.fallbackText} numberOfLines={3}>{problem.problemStatement}</Text>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: M3.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
  },
  fallbackCard: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  fallbackText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: M3.onSurfaceVariant,
    lineHeight: 22,
    flex: 1,
  },
  genericList: { gap: 12 },
});
