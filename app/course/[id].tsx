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

export default function SectionListScreen() {
  const router = useRouter();
  const { id, name, category } = useLocalSearchParams<{ id: string; name: string; category: string }>();
  const [sections, setSections] = useState<Record<string, Problem[]>>({});
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const sectionEntries = Object.entries(sections);

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

      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{category?.toUpperCase() ?? 'COURSE'}</Text>
      </View>
      <Text style={styles.courseTitle}>{name}</Text>

      {/* Sections */}
      <View style={styles.sectionsList}>
        {sectionEntries.map(([sectionName, problems], index) => {
          const isExpanded = expandedSection === sectionName;
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
                    <Text style={styles.sectionMeta}>{problems.length} Problems</Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={isExpanded ? M3.secondary : M3.outline}
                />
              </Pressable>

              {/* Problem items */}
              {isExpanded && (
                <View style={styles.problemList}>
                  {problems.map((problem) => (
                    <Pressable
                      key={problem._id}
                      style={styles.problemItem}
                      onPress={() => router.push({ pathname: '/problem/[id]', params: { id: problem._id } })}
                    >
                      <Text style={styles.problemName} numberOfLines={2}>
                        {problem.problemName || (problem.problemStatement.length > 80
                          ? problem.problemStatement.substring(0, 80) + '...'
                          : problem.problemStatement)}
                      </Text>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={M3.outlineVariant} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {sectionEntries.length === 0 && (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="folder-open-outline" size={48} color={M3.outlineVariant} />
          <Text style={styles.emptyText}>No problems found</Text>
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
    alignSelf: 'flex-start',
    backgroundColor: M3.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  categoryText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: M3.onSecondaryContainer, letterSpacing: 1.5 },

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
  emptyText: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: M3.onSurfaceVariant },
});
