import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { M3 } from '@/constants/theme';
import { api, Problem } from '@/services/api';
import { useFocusEffect } from 'expo-router';

const categoryDisplay: Record<string, { label: string; icon: string; color: string }> = {
  dsa: { label: 'DSA', icon: 'code-braces', color: M3.primary },
  language: { label: 'Language', icon: 'language-javascript', color: M3.tertiary },
  photography: { label: 'Photography', icon: 'camera', color: M3.secondary },
  generic: { label: 'Generic', icon: 'book-open-page-variant', color: M3.tertiary },
};

export default function SectionListScreen() {
  const router = useRouter();
  const { id, name, category } = useLocalSearchParams<{ id: string; name: string; category: string }>();
  const [sections, setSections] = useState<Record<string, Problem[]>>({});
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const display = categoryDisplay[category?.toLowerCase()] || categoryDisplay.generic;

  const fetchSections = useCallback(async () => {
    if (!name) return;
    try {
      const res = await api.getSections(name);
      setSections(res.sections);
      // Auto-expand first section
      const keys = Object.keys(res.sections);
      if (keys.length > 0 && !expandedSection) setExpandedSection(keys[0]);
    } catch (e) {
      console.warn('Failed to fetch sections:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [name]);

  useFocusEffect(useCallback(() => { fetchSections(); }, [fetchSections]));

  const sectionEntries = Object.entries(sections).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={M3.primary} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSections(); }} colors={[M3.primary]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={M3.primary} />
        </Pressable>
      </View>

      {/* Category badge — adapts based on category */}
      <View style={[styles.categoryBadge, { backgroundColor: `${display.color}1a` }]}>
        <MaterialCommunityIcons name={display.icon as any} size={14} color={display.color} />
        <Text style={[styles.categoryText, { color: display.color }]}>{display.label}</Text>
      </View>
      <Text style={styles.courseTitle}>{name}</Text>

      {/* Sections */}
      <View style={styles.sectionsList}>
        {sectionEntries.map(([sectionName, problems], index) => {
          const isExpanded = expandedSection === sectionName;
          // Use "Concepts" label for generic content, "Problems" for DSA
          const isGeneric = category !== 'dsa';
          const itemLabel = isGeneric ? 'Concepts' : 'Problems';
          return (
            <View key={sectionName} style={styles.sectionGroup}>
              {/* Section header */}
              <Pressable
                style={[
                  styles.sectionHeader,
                  isExpanded && styles.sectionHeaderExpanded,
                ]}
                onPress={() => setExpandedSection(isExpanded ? null : sectionName)}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Text style={[
                    styles.sectionNumber,
                    isExpanded && { color: M3.secondaryFixedDim },
                  ]}>
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={[
                      styles.sectionName,
                      isExpanded && { color: M3.secondary },
                    ]}>{sectionName}</Text>
                    <Text style={styles.sectionMeta}>{problems.length} {itemLabel}</Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={isExpanded ? M3.secondary : M3.outline}
                />
              </Pressable>

              {/* Problem/Concept items */}
              {isExpanded && (
                <View style={styles.problemList}>
                  {problems.map((problem) => {
                    // Render differently based on category
                    const problemTitle = isGeneric
                      ? (problem.concepts?.[0]?.name || (problem.problemStatement.length > 60
                          ? problem.problemStatement.substring(0, 60) + '...'
                          : problem.problemStatement))
                      : (problem.problemName || (problem.problemStatement.length > 80
                          ? problem.problemStatement.substring(0, 80) + '...'
                          : problem.problemStatement));

                    return (
                      <Pressable
                        key={problem._id}
                        style={styles.problemItem}
                        onPress={() => router.push({ pathname: '/problem/[id]', params: { id: problem._id } })}
                      >
                        <Text style={styles.problemName} numberOfLines={2}>
                          {problemTitle}
                        </Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={M3.outlineVariant} />
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {sectionEntries.length === 0 && (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="folder-open-outline" size={48} color={M3.outlineVariant} />
          <View style={styles.emptyContent}>
            <Text style={styles.emptyText}>No {category !== 'dsa' ? 'concepts' : 'problems'} found</Text>
            <Text style={styles.emptySub}>
              {category !== 'dsa' ? 'Concepts will appear here after processing' : 'Problems will appear here after processing'}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M3.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: M3.surface },
  content: { paddingHorizontal: 24, paddingBottom: 40 },

  header: { paddingTop: 56, marginBottom: 16 },
  backBtn: { padding: 4, alignSelf: 'flex-start' },

  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  categoryText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.5 },

  courseTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 26,
    color: M3.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },

  sectionsList: { gap: 12 },
  sectionGroup: { gap: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: M3.surfaceContainerLow,
    borderRadius: 12,
    padding: 20,
  },
  sectionHeaderExpanded: {
    backgroundColor: `${M3.secondaryFixed}4d`,
    borderWidth: 1,
    borderColor: `${M3.secondaryFixedDim}33`,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  sectionNumber: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 32,
    color: `${M3.primaryFixedDim}80`,
  },
  sectionName: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: M3.onBackground },
  sectionMeta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: M3.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  problemList: { marginLeft: 16, gap: 6 },
  problemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: M3.surfaceContainerLowest,
    borderRadius: 8,
    padding: 16,
  },
  problemName: { fontFamily: 'Inter_500Medium', fontSize: 14, color: M3.onSurface, flex: 1, marginRight: 8 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyContent: { alignItems: 'center' },
  emptyText: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: M3.onSurfaceVariant },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: M3.outline, marginTop: 4 },
});
});
