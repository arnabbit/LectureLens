// EXPO_PUBLIC_ prefix makes it available in the client bundle
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json();
}

// Types

export interface Concept {
  name: string;
  explanation: string;
  keyTakeaways: string[];
  importance?: 'high' | 'medium' | 'low';
}

export interface Approach {
  name: string;
  complexity?: { time: string; space: string };
  optimisationScore?: number;
  explanation: string;
}

// Raw problem from GET /lectures (courseId is ObjectId string)
export interface Problem {
  _id: string;
  courseId: string | PopulatedCourse;
  lectureId: string;
  sectionName: string;
  lectureName: string;
  problemName?: string;
  problemStatement: string;
  approaches: Approach[];
  keyInsights: string[];
  category: string;
  // Generic content fields (populated for non-DSA categories)
  concepts?: Concept[];
}

// Populated course ref from GET /lectures/:id
export interface PopulatedCourse {
  _id: string;
  name: string;
  courseId: number;
  category: string;
}

// Derived course info for the course list screen
export interface CourseInfo {
  _id: string;         // MongoDB ObjectId of the Course doc
  name: string;
  courseId: number;
  category: string;
  problemCount: number;
  // These come from /process/:id/status
  lectureCount: number;
  processingStatus: string;
  processedCount: number;
  failedCount: number;
}

export interface SectionsResponse {
  sections: Record<string, Problem[]>;
  total: number;
}

export interface ProcessStatus {
  total: number;
  done: number;
  failed: number;
  status: string;
}

export interface FailedLecture {
  udemyLectureId: number;
  sectionName: string;
  lectureName: string;
  failReason: string;
}

export interface FailedResponse {
  total: number;
  lectures: FailedLecture[];
}

export interface GradeResult {
  grade: 'correct' | 'almost' | 'half' | 'incorrect';
  feedback: string;
  explanation?: string;
}

export interface RephraseResult {
  rephrased: string;
}

// API methods — only uses endpoints that exist on transcript-processor
export const api = {
  // Health
  health: () => request<{ status: string }>('/health'),

  // GET /lectures (no params) → all problems, grouped by section
  // GET /lectures?courseName=X → problems for one course
  getSections: (courseName?: string) => {
    const q = courseName ? `?courseName=${encodeURIComponent(courseName)}` : '';
    return request<SectionsResponse>(`/lectures${q}`);
  },

  // GET /lectures/:id → single problem with populated courseId & lectureId
  getProblem: (id: string) => request<Problem>(`/lectures/${id}`),

  // Derive course list by:
  //  1. GET /lectures → all problems
  //  2. For each unique courseId, GET /lectures/:firstProblemId → populated course info
  //  3. For each course, GET /process/:courseId/status → processing info
  getCourses: async (): Promise<CourseInfo[]> => {
    const { sections, total } = await api.getSections();

    // Flatten all problems, group by courseId string
    const allProblems: Problem[] = Object.values(sections).flat();
    const byCourse = new Map<string, Problem[]>();
    for (const p of allProblems) {
      const cid = typeof p.courseId === 'string' ? p.courseId : p.courseId._id;
      if (!byCourse.has(cid)) byCourse.set(cid, []);
      byCourse.get(cid)!.push(p);
    }

    // For each unique course, fetch one problem detail to get populated course info
    const courseInfos: CourseInfo[] = [];
    const entries = Array.from(byCourse.entries());

    await Promise.all(
      entries.map(async ([courseObjId, problems]) => {
        try {
          const detail = await api.getProblem(problems[0]._id);
          const course = detail.courseId as PopulatedCourse;

          // Fetch processing status
          let status: ProcessStatus = {
            total: 0, done: 0, failed: 0, status: 'done',
          };
          try {
            status = await api.getProcessStatus(courseObjId);
          } catch { /* course may not have status yet */ }

          courseInfos.push({
            _id: courseObjId,
            name: course.name,
            courseId: course.courseId,
            category: course.category || problems[0].category || 'other',
            problemCount: problems.length,
            lectureCount: status.total,
            processingStatus: status.status,
            processedCount: status.done,
            failedCount: status.failed,
          });
        } catch (e) {
          console.warn(`Failed to fetch course info for ${courseObjId}:`, e);
        }
      })
    );

    return courseInfos.sort((a, b) => a.name.localeCompare(b.name));
  },

  // Rephrase — quiz router is mounted at both /quiz and /rephrase
  // handler is router.get('/rephrase/:problemId')
  // → accessible at /quiz/rephrase/:problemId
  rephrase: (problemId: string, style?: string, context?: string, approachIndex?: number) => {
    const params = new URLSearchParams();
    if (style) params.set('style', style);
    if (context) params.set('context', context);
    if (approachIndex !== undefined) params.set('approachIndex', String(approachIndex));
    return request<RephraseResult>(`/quiz/rephrase/${problemId}?${params}`);
  },

  // Quiz grading — POST /quiz/grade
  gradeAnswer: (problemId: string, approachIndex: number, userAnswer: string) =>
    request<GradeResult>('/quiz/grade', {
      method: 'POST',
      body: JSON.stringify({ problemId, approachIndex, userAnswer }),
    }),

  // Processing status — GET /process/:courseId/status
  getProcessStatus: (courseId: string) =>
    request<ProcessStatus>(`/process/${courseId}/status`),

  // Failed lectures — GET /process/:courseId/failed
  getFailedLectures: (courseId: string) =>
    request<FailedResponse>(`/process/${courseId}/failed`),

  // Retry — POST /process/:courseId/retry-failed
  retryFailed: (courseId: string) =>
    request<{ status: string; retrying: number }>(`/process/${courseId}/retry-failed`, {
      method: 'POST',
    }),
};
