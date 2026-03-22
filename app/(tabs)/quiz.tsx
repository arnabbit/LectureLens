import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { M3, GradeColors } from '@/constants/theme';
import { api, CourseInfo as Course, Problem, GradeResult } from '@/services/api';

type Phase = 'pick' | 'answer' | 'result';

export default function QuizScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Record<string, Problem[]>>({});
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [phase, setPhase] = useState<Phase>('pick');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      api.getCourses().then(setCourses).catch(console.warn).finally(() => setLoading(false));
    }, [])
  );

  useEffect(() => {
    if (!selectedCourse) return;
    api.getSections(selectedCourse.name).then((res) => {
      setSections(res.sections);
      setSelectedSection(null);
    }).catch(console.warn);
  }, [selectedCourse]);

  const pickRandomProblem = (sectionKey?: string) => {
    const key = sectionKey ?? selectedSection;
    if (!key || !sections[key]?.length) return;
    const problems = sections[key];
    const problem = problems[Math.floor(Math.random() * problems.length)];
    setCurrentProblem(problem);
    setUserAnswer('');
    setResult(null);
    setPhase('answer');
  };

  const handleSubmit = async () => {
    if (!currentProblem || !userAnswer.trim()) return;
    setGrading(true);
    try {
      const res = await api.gradeAnswer(currentProblem._id, 0, userAnswer);
      setResult(res);
      setPhase('result');
    } catch (e) {
      console.warn('Grading failed:', e);
    } finally {
      setGrading(false);
    }
  };

  const handleNext = () => pickRandomProblem();

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={M3.primary} /></View>;
  }

  // Course & Section picker
  if (phase === 'pick') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>QUIZ MODE</Text>
          <Text style={styles.headerTitle}>Test Your Knowledge</Text>
        </View>

        {/* Course picker */}
        <Text style={styles.sectionLabel}>Select a Course</Text>
        {courses.filter(c => c.processingStatus === 'done' || c.processingStatus === 'done_with_errors').map((course) => (
          <Pressable
            key={course._id}
            style={[styles.pickerItem, selectedCourse?._id === course._id && styles.pickerItemActive]}
            onPress={() => setSelectedCourse(course)}
          >
            <Text style={[
              styles.pickerText,
              selectedCourse?._id === course._id && styles.pickerTextActive,
            ]}>{course.name}</Text>
            {selectedCourse?._id === course._id && (
              <MaterialCommunityIcons name="check" size={18} color={M3.secondary} />
            )}
          </Pressable>
        ))}

        {/* Section picker */}
        {selectedCourse && Object.keys(sections).length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Select a Section</Text>
            {Object.entries(sections).map(([name, problems]) => (
              <Pressable
                key={name}
                style={[styles.pickerItem, selectedSection === name && styles.pickerItemActive]}
                onPress={() => {
                  setSelectedSection(name);
                  pickRandomProblem(name);
                }}
              >
                <View style={{ flexShrink: 1 }}>
                  <Text style={[
                    styles.pickerText,
                    selectedSection === name && styles.pickerTextActive,
                  ]}>{name}</Text>
                  <Text style={styles.pickerSub}>{problems.length} problems</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={M3.outlineVariant} />
              </Pressable>
            ))}
          </>
        )}

        {courses.filter(c => c.processingStatus === 'done' || c.processingStatus === 'done_with_errors').length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="school-outline" size={48} color={M3.outlineVariant} />
            <Text style={styles.emptyText}>No courses ready for quizzing</Text>
            <Text style={styles.emptySub}>Process some courses first</Text>
          </View>
        )}
      </ScrollView>
    );
  }

  // Answer phase
  if (phase === 'answer' && currentProblem) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Pressable onPress={() => setPhase('pick')} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={M3.primary} />
            </Pressable>
            <Text style={styles.headerTitle}>Quiz Mode</Text>
          </View>

          {/* Problem statement */}
          <View style={styles.problemCard}>
            <Text style={styles.problemStatement}>{currentProblem.problemStatement}</Text>
          </View>

          {/* Answer input */}
          <Text style={styles.answerLabel}>Your Approach</Text>
          <TextInput
            style={styles.answerInput}
            multiline
            placeholder="Describe your algorithm or approach..."
            placeholderTextColor={`${M3.outline}99`}
            value={userAnswer}
            onChangeText={setUserAnswer}
            textAlignVertical="top"
          />

          {/* Submit */}
          <Pressable
            style={[styles.primaryBtn, grading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={grading || !userAnswer.trim()}
          >
            {grading ? (
              <ActivityIndicator color={M3.onPrimary} />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Submit Answer</Text>
                <MaterialCommunityIcons name="send" size={18} color={M3.onPrimary} />
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Result phase
  if (phase === 'result' && currentProblem && result) {
    const grade = GradeColors[result.grade] ?? GradeColors.incorrect;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => setPhase('pick')} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={M3.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Result</Text>
        </View>

        {/* Grade badge */}
        <View style={styles.gradeRow}>
          <View style={[styles.gradeBadge, { backgroundColor: grade.bg }]}>
            <MaterialCommunityIcons
              name={result.grade === 'correct' ? 'check-circle' : result.grade === 'almost' ? 'alert-circle' : 'close-circle'}
              size={18}
              color={grade.text}
            />
            <Text style={[styles.gradeText, { color: grade.text }]}>
              {result.grade.charAt(0).toUpperCase() + result.grade.slice(1)}
            </Text>
          </View>
        </View>

        {/* Feedback */}
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackText}>{result.feedback}</Text>
        </View>

        {/* Model answer (if not fully correct) */}
        {result.grade !== 'correct' && result.explanation && (
          <View style={styles.modelAnswer}>
            <View style={styles.modelAnswerHeader}>
              <MaterialCommunityIcons name="auto-fix" size={18} color={M3.primary} />
              <Text style={styles.modelAnswerTitle}>Standard Explanation</Text>
            </View>
            <Text style={styles.modelAnswerText}>{result.explanation}</Text>
          </View>
        )}

        {/* Also show stored approaches if not correct */}
        {result.grade !== 'correct' && currentProblem.approaches?.[0] && (
          <View style={styles.modelAnswer}>
            <Text style={styles.modelAnswerTitle}>Stored Approach: {currentProblem.approaches[0].name}</Text>
            <Text style={styles.modelAnswerText}>{currentProblem.approaches[0].explanation}</Text>
          </View>
        )}

        {/* Next */}
        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>Next Problem</Text>
          <MaterialCommunityIcons name="chevron-double-right" size={20} color={M3.primary} />
        </Pressable>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M3.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: M3.surface },
  content: { paddingHorizontal: 24, paddingBottom: 120 },

  header: { paddingTop: 60, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, color: M3.onSurfaceVariant, letterSpacing: 2 },
  headerTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 28, color: M3.primary, letterSpacing: -0.5 },
  backBtn: { padding: 4 },

  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: M3.onSurfaceVariant,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: M3.surfaceContainerLowest,
    borderRadius: 12,
    marginBottom: 8,
  },
  pickerItemActive: { backgroundColor: `${M3.secondaryFixed}50` },
  pickerText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: M3.onSurface },
  pickerTextActive: { color: M3.secondary, fontFamily: 'Inter_600SemiBold' },
  pickerSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: M3.onSurfaceVariant, marginTop: 2 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: M3.onSurfaceVariant },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: M3.outline },

  problemCard: {
    backgroundColor: M3.surfaceContainerLow,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  problemStatement: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 18,
    color: M3.onSurface,
    lineHeight: 26,
  },

  answerLabel: { fontFamily: 'Manrope_700Bold', fontSize: 18, color: M3.onSurface, marginBottom: 12 },
  answerInput: {
    minHeight: 200,
    backgroundColor: M3.surfaceContainerHighest,
    borderRadius: 12,
    padding: 20,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: M3.onSurface,
    lineHeight: 22,
    marginBottom: 20,
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: M3.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: M3.onPrimary },

  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  gradeText: { fontFamily: 'Manrope_700Bold', fontSize: 15 },

  feedbackCard: {
    backgroundColor: M3.surfaceContainerLowest,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  feedbackText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: M3.onSurface, lineHeight: 22 },

  modelAnswer: {
    backgroundColor: M3.inverseSurface,
    padding: 20,
    borderRadius: 12,
    borderTopRightRadius: 24,
    marginBottom: 16,
  },
  modelAnswerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  modelAnswerTitle: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: M3.inverseOnSurface },
  modelAnswerText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: M3.outlineVariant, lineHeight: 20 },

  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: M3.surfaceContainerHighest,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  nextBtnText: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: M3.primary },
});
