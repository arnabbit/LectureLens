import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { M3, CategoryColors, StatusColors } from '@/constants/theme';
import { api, CourseInfo as Course } from '@/services/api';

export default function CourseListScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      const data = await api.getCourses();
      setCourses(data);
    } catch (e) {
      console.warn('Failed to fetch courses:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCourses();
    }, [fetchCourses])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const renderCourse = ({ item }: { item: Course }) => {
    const cat = CategoryColors[item.category] ?? CategoryColors.other;
    const status = StatusColors[item.processingStatus] ?? StatusColors.pending;
    const isError = item.processingStatus === 'done_with_errors';
    const isProcessing = item.processingStatus === 'processing';
    const progress = item.lectureCount > 0
      ? Math.round((item.processedCount / item.lectureCount) * 100)
      : 0;

    return (
      <Pressable
        style={[
          styles.card,
          isError && { borderWidth: 1, borderColor: `${M3.error}1a` },
        ]}
        onPress={() => router.push({ pathname: '/course/[id]', params: { id: item._id, name: item.name, category: item.category } })}
      >
        {/* Top row: category badge + status */}
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: cat.bg }]}>
            <Text style={[styles.badgeText, { color: cat.text }]}>{cat.label}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.cardTitle}>{item.name}</Text>

        {/* Processing progress bar */}
        {isProcessing && (
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>Progressing</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
          </View>
        )}

        {/* Done state */}
        {item.processingStatus === 'done' && (
          <View style={styles.doneRow}>
            <Text style={styles.doneText}>{item.processedCount} Lectures Completed</Text>
          </View>
        )}

        {/* Error state */}
        {isError && (
          <View style={styles.errorBox}>
            <View style={styles.errorIconWrap}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={M3.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Sync Failed</Text>
              <Text style={styles.errorSub}>{item.failedCount} lectures failed to process</Text>
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={M3.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item._id}
        renderItem={renderCourse}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[M3.primary]} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerLabel}>YOUR LIBRARY</Text>
                <Text style={styles.headerTitle}>Active Curations</Text>
              </View>
              <Pressable
                style={styles.settingsBtn}
                onPress={() => router.push('/settings')}
              >
                <MaterialCommunityIcons name="cog-outline" size={24} color={M3.onSurfaceVariant} />
              </Pressable>
            </View>
            <View style={styles.headerAccent} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="book-open-page-variant-outline" size={48} color={M3.outlineVariant} />
            <Text style={styles.emptyText}>No courses yet</Text>
            <Text style={styles.emptySubtext}>Process some lectures from the backend to get started</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M3.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: M3.surface },
  list: { paddingHorizontal: 24, paddingBottom: 100 },

  header: { paddingTop: 60, marginBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  settingsBtn: { padding: 8, marginTop: 4 },
  headerLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: M3.onSurfaceVariant,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 32,
    color: M3.primary,
    letterSpacing: -0.5,
  },
  headerAccent: {
    marginTop: 16,
    height: 4,
    width: 48,
    backgroundColor: M3.secondary,
    borderRadius: 2,
  },

  card: {
    backgroundColor: M3.surfaceContainerLowest,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5, textTransform: 'uppercase' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  cardTitle: { fontFamily: 'Manrope_700Bold', fontSize: 20, color: M3.onSurface, lineHeight: 26 },

  progressSection: { marginTop: 16 },
  progressTrack: { height: 6, backgroundColor: M3.surfaceContainerHigh, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: M3.secondary, borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: M3.secondary, textTransform: 'uppercase' },
  progressPercent: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: M3.onSurfaceVariant, textTransform: 'uppercase' },

  doneRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  doneText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: M3.onSurfaceVariant },

  errorBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: `${M3.errorContainer}33`,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${M3.error}1a`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: M3.onErrorContainer },
  errorSub: { fontSize: 10, color: `${M3.onErrorContainer}cc` },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontFamily: 'Manrope_700Bold', fontSize: 18, color: M3.onSurfaceVariant },
  emptySubtext: { fontFamily: 'Inter_400Regular', fontSize: 13, color: M3.outline, textAlign: 'center', paddingHorizontal: 40 },
});
