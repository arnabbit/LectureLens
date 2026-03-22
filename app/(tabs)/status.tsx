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

export default function StatusScreen() {
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

  useFocusEffect(useCallback(() => { fetchCourses(); }, [fetchCourses]));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={M3.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCourses(); }} colors={[M3.primary]} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerLabel}>PROCESSING</Text>
            <Text style={styles.headerTitle}>Status Overview</Text>
          </View>
        }
        renderItem={({ item }) => <StatusCard course={item} onRetry={fetchCourses} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="progress-check" size={48} color={M3.outlineVariant} />
            <Text style={styles.emptyText}>No courses to show</Text>
          </View>
        }
      />
    </View>
  );
}

function StatusCard({ course, onRetry }: { course: Course; onRetry: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [failedLectures, setFailedLectures] = useState<any[]>([]);
  const [retrying, setRetrying] = useState(false);
  const [loadingFailed, setLoadingFailed] = useState(false);

  const progress = course.lectureCount > 0
    ? Math.round((course.processedCount / course.lectureCount) * 100)
    : 0;
  const isError = course.processingStatus === 'done_with_errors';

  const loadFailed = async () => {
    if (failedLectures.length > 0) { setExpanded(!expanded); return; }
    setLoadingFailed(true);
    try {
      const res = await api.getFailedLectures(course._id);
      setFailedLectures(res.lectures);
      setExpanded(true);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingFailed(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await api.retryFailed(course._id);
      onRetry();
    } catch (e) {
      console.warn(e);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View style={styles.statusCard}>
      {/* Header */}
      <View style={styles.statusCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.statusCardLabel}>CURRENT PROGRESS</Text>
          <Text style={styles.statusCardTitle}>{course.name}</Text>
        </View>
        <Text style={styles.statusCount}>
          {course.processedCount}
          <Text style={styles.statusCountTotal}>/{course.lectureCount}</Text>
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <View style={styles.progressLabels}>
        <Text style={styles.progressText}>{progress}% Compiled</Text>
        <Text style={[styles.progressStatus, { color: isError ? M3.error : M3.secondary }]}>
          {StatusColors[course.processingStatus]?.label ?? course.processingStatus}
        </Text>
      </View>

      {/* Counts */}
      <View style={styles.countsRow}>
        <View style={[styles.countCard, { borderLeftColor: M3.secondary }]}>
          <View style={styles.countHeader}>
            <MaterialCommunityIcons name="check-circle" size={18} color={M3.secondary} />
            <Text style={styles.countLabel}>Verified</Text>
          </View>
          <Text style={styles.countValue}>{String(course.processedCount - course.failedCount).padStart(2, '0')}</Text>
        </View>
        <View style={[styles.countCard, { borderLeftColor: M3.error, backgroundColor: `${M3.errorContainer}33` }]}>
          <View style={styles.countHeader}>
            <MaterialCommunityIcons name="alert-circle" size={18} color={M3.error} />
            <Text style={[styles.countLabel, { color: M3.onErrorContainer }]}>Errors</Text>
          </View>
          <Text style={[styles.countValue, { color: M3.error }]}>{String(course.failedCount).padStart(2, '0')}</Text>
        </View>
      </View>

      {/* Failed lectures toggle */}
      {course.failedCount > 0 && (
        <>
          <Pressable style={styles.viewFailedBtn} onPress={loadFailed}>
            {loadingFailed ? (
              <ActivityIndicator size="small" color={M3.onSecondaryContainer} />
            ) : (
              <>
                <Text style={styles.viewFailedText}>View Failed</Text>
                <MaterialCommunityIcons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={M3.onSecondaryContainer}
                />
              </>
            )}
          </Pressable>

          {expanded && failedLectures.map((lecture, i) => (
            <View key={i} style={styles.failedItem}>
              <View style={styles.failedIcon}>
                <MaterialCommunityIcons name="file-document-outline" size={18} color={M3.onErrorContainer} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.failedItemHeader}>
                  <Text style={styles.failedName}>{lecture.lectureName}</Text>
                  <View style={styles.failedBadge}>
                    <Text style={styles.failedBadgeText}>Failed</Text>
                  </View>
                </View>
                <Text style={styles.failedReason}>{lecture.failReason}</Text>
              </View>
            </View>
          ))}

          {/* Retry */}
          <Pressable style={styles.retryBtn} onPress={handleRetry} disabled={retrying}>
            {retrying ? (
              <ActivityIndicator color={M3.onPrimary} />
            ) : (
              <>
                <MaterialCommunityIcons name="refresh" size={20} color={M3.onPrimary} />
                <Text style={styles.retryBtnText}>Retry Failed Lectures</Text>
              </>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M3.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: M3.surface },
  list: { paddingHorizontal: 24, paddingBottom: 100 },

  header: { paddingTop: 60, marginBottom: 24 },
  headerLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, color: M3.onSurfaceVariant, letterSpacing: 2 },
  headerTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 28, color: M3.primary, letterSpacing: -0.5 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: M3.onSurfaceVariant },

  statusCard: {
    backgroundColor: M3.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  statusCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  statusCardLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, color: M3.onSurfaceVariant, letterSpacing: 1.5 },
  statusCardTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 22, color: M3.primary, letterSpacing: -0.5 },
  statusCount: { fontFamily: 'Manrope_700Bold', fontSize: 32, color: M3.primary },
  statusCountTotal: { fontFamily: 'Manrope_700Bold', fontSize: 20, color: M3.outlineVariant },

  progressTrack: { height: 12, backgroundColor: M3.surfaceContainerHigh, borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: M3.primary, borderRadius: 6 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  progressText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: M3.onSurfaceVariant },
  progressStatus: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },

  countsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  countCard: {
    flex: 1,
    backgroundColor: M3.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  countHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  countLabel: { fontFamily: 'Manrope_700Bold', fontSize: 13, color: M3.onSurface },
  countValue: { fontFamily: 'Manrope_800ExtraBold', fontSize: 24, color: M3.primary },

  viewFailedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: M3.secondaryContainer,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  viewFailedText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: M3.onSecondaryContainer },

  failedItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: M3.surfaceContainer,
    borderRadius: 12,
    marginBottom: 8,
  },
  failedIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: M3.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  failedItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  failedName: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: M3.onSurface, flex: 1 },
  failedBadge: { borderWidth: 1, borderColor: M3.error, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  failedBadgeText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: M3.error, textTransform: 'uppercase' },
  failedReason: { fontFamily: 'Inter_500Medium', fontSize: 12, color: M3.error, marginTop: 4 },

  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: M3.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  retryBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: M3.onPrimary },
});
