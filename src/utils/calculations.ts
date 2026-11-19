import type {
  ApplicationStatus,
  CompanyApplication,
  DailyTask,
  GoalRecord,
  PlacementTask,
  ProjectRecord,
  RoadmapMilestone,
  SemesterRecord,
  SkillRecord,
  StudentProfile,
  WeeklyTask,
} from '../types/placepath';

export interface CGPAResult {
  cgpa: number | null;
  isComplete: boolean;
  statusMessage: string;
  completedSemesters: number;
  totalCompletedCredits: number;
  totalPlannedCredits: number;
  missingCreditSemesters: number[];
}

export function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysIso(baseIso: string, offsetDays: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + offsetDays);
  return toIsoDate(dt);
}

export function diffDays(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  const utc1 = Date.UTC(y1, (m1 || 1) - 1, d1 || 1);
  const utc2 = Date.UTC(y2, (m2 || 1) - 1, d2 || 1);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export function calculateWeightedCGPA(semesters: SemesterRecord[]): CGPAResult {
  if (semesters.length === 0) {
    return {
      cgpa: null,
      isComplete: false,
      statusMessage: 'No semester records added yet.',
      completedSemesters: 0,
      totalCompletedCredits: 0,
      totalPlannedCredits: 0,
      missingCreditSemesters: [],
    };
  }

  const totalPlannedCredits = semesters.reduce(
    (sum, s) => sum + (s.totalCredits ?? 0),
    0
  );
  const totalCompletedCredits = semesters.reduce(
    (sum, s) => sum + (s.completedCredits ?? 0),
    0
  );
  const completed = semesters.filter((s) => s.status === 'Completed');

  if (completed.length === 0) {
    return {
      cgpa: null,
      isComplete: false,
      statusMessage: 'No completed semesters yet.',
      completedSemesters: 0,
      totalCompletedCredits: Number(totalCompletedCredits.toFixed(2)),
      totalPlannedCredits: Number(totalPlannedCredits.toFixed(2)),
      missingCreditSemesters: [],
    };
  }

  const missingCreditSemesters: number[] = [];
  let weightedSum = 0;
  let creditSum = 0;

  for (const sem of completed) {
    const semCredits =
      sem.completedCredits !== null && sem.completedCredits > 0
        ? sem.completedCredits
        : sem.totalCredits;

    if (sem.sgpa === null || semCredits === null || semCredits <= 0) {
      missingCreditSemesters.push(sem.semesterNumber);
      continue;
    }

    weightedSum += sem.sgpa * semCredits;
    creditSum += semCredits;
  }

  if (missingCreditSemesters.length > 0) {
    const sorted = [...missingCreditSemesters].sort((a, b) => a - b);
    const labels = sorted.map((n) => `Sem ${n}`).join(', ');
    return {
      cgpa: null,
      isComplete: false,
      statusMessage: `Incomplete CGPA: missing valid SGPA or credits for ${labels}.`,
      completedSemesters: completed.length,
      totalCompletedCredits: Number(totalCompletedCredits.toFixed(2)),
      totalPlannedCredits: Number(totalPlannedCredits.toFixed(2)),
      missingCreditSemesters: sorted,
    };
  }

  if (creditSum <= 0) {
    return {
      cgpa: null,
      isComplete: false,
      statusMessage: 'Incomplete CGPA: credit totals must be greater than zero.',
      completedSemesters: completed.length,
      totalCompletedCredits: Number(totalCompletedCredits.toFixed(2)),
      totalPlannedCredits: Number(totalPlannedCredits.toFixed(2)),
      missingCreditSemesters: [],
    };
  }

  return {
    cgpa: Number((weightedSum / creditSum).toFixed(2)),
    isComplete: true,
    statusMessage: `Weighted across ${completed.length} completed semester${completed.length === 1 ? '' : 's'}.`,
    completedSemesters: completed.length,
    totalCompletedCredits: Number(totalCompletedCredits.toFixed(2)),
    totalPlannedCredits: Number(totalPlannedCredits.toFixed(2)),
    missingCreditSemesters: [],
  };
}

export function calculateProfileCompletion(profile: StudentProfile): number {
  const textFields: (keyof StudentProfile)[] = [
    'fullName',
    'email',
    'collegeName',
    'branch',
    'targetRole',
    'githubUrl',
    'linkedinUrl',
  ];
  let filled = textFields.filter((key) => String(profile[key] ?? '').trim().length > 0).length;
  if (profile.currentYear >= 1) filled += 1;
  if (profile.currentSemester >= 1) filled += 1;
  return Math.round((filled / (textFields.length + 2)) * 100);
}

export function isGoalOverdue(goal: GoalRecord, todayIso = toIsoDate(new Date())): boolean {
  if (goal.status === 'Completed' || !goal.targetDate) {
    return false;
  }
  return goal.targetDate < todayIso;
}

export function summarizeGoals(goals: GoalRecord[], todayIso = toIsoDate(new Date())) {
  const total = goals.length;
  const completed = goals.filter((g) => g.status === 'Completed').length;
  const active = total - completed;
  const overdue = goals.filter((g) => isGoalOverdue(g, todayIso)).length;
  const completionPct = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;
  return { total, completed, active, overdue, completionPct };
}

export function summarizeSkills(skills: SkillRecord[]) {
  return {
    total: skills.length,
    Beginner: skills.filter((s) => s.proficiency === 'Beginner').length,
    Intermediate: skills.filter((s) => s.proficiency === 'Intermediate').length,
    Advanced: skills.filter((s) => s.proficiency === 'Advanced').length,
  };
}

export function summarizeProjects(projects: ProjectRecord[]) {
  return {
    total: projects.length,
    Planned: projects.filter((p) => p.status === 'Planned').length,
    'In Progress': projects.filter((p) => p.status === 'In Progress').length,
    Completed: projects.filter((p) => p.status === 'Completed').length,
  };
}

export function summarizeRoadmap(milestones: RoadmapMilestone[]) {
  const total = milestones.length;
  const completed = milestones.filter((m) => m.completed).length;
  const pending = total - completed;
  const pct = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;
  const byYear: Record<1 | 2 | 3 | 4, { total: number; completed: number; pending: number; pct: number }> = {
    1: { total: 0, completed: 0, pending: 0, pct: 0 },
    2: { total: 0, completed: 0, pending: 0, pct: 0 },
    3: { total: 0, completed: 0, pending: 0, pct: 0 },
    4: { total: 0, completed: 0, pending: 0, pct: 0 },
  };
  for (const yr of [1, 2, 3, 4] as const) {
    const items = milestones.filter((m) => m.year === yr);
    const done = items.filter((m) => m.completed).length;
    byYear[yr] = {
      total: items.length,
      completed: done,
      pending: items.length - done,
      pct: items.length > 0 ? Number(((done / items.length) * 100).toFixed(1)) : 0,
    };
  }
  return { total, completed, pending, pct, byYear };
}

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'Interested',
  'Applied',
  'Assessment',
  'Interview',
  'Offer',
  'Rejected',
];

export function summarizePlacement(tasks: PlacementTask[], applications: CompanyApplication[]) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const progressPct = totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(1)) : 0;
  const applicationsByStatus = APPLICATION_STATUSES.reduce(
    (acc, status) => {
      acc[status] = applications.filter((a) => a.status === status).length;
      return acc;
    },
    {} as Record<ApplicationStatus, number>
  );
  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    progressPct,
    totalApplications: applications.length,
    applicationsByStatus,
  };
}

export interface DailySeriesPoint {
  day: string;
  date: string;
  completed: number;
  pending: number;
}

export function summarizeWeeklyProductivity(
  weeklyTasks: WeeklyTask[],
  dailyTasks: DailyTask[],
  referenceDate = new Date()
) {
  const dayOfWeek = referenceDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + mondayOffset
  );
  const weekStart = toIsoDate(monday);
  const weekEnd = addDaysIso(weekStart, 6);

  const combined = [
    ...weeklyTasks
      .filter((t) => t.taskDate >= weekStart && t.taskDate <= weekEnd)
      .map((t) => ({ date: t.taskDate, status: t.status })),
    ...dailyTasks
      .filter((t) => t.taskDate >= weekStart && t.taskDate <= weekEnd)
      .map((t) => ({ date: t.taskDate, status: t.status })),
  ];

  const total = combined.length;
  const completed = combined.filter((i) => i.status === 'Completed').length;
  const pending = total - completed;
  const completionPct = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailySeries: DailySeriesPoint[] = dayNames.map((label, idx) => {
    const iso = addDaysIso(weekStart, idx);
    const items = combined.filter((i) => i.date === iso);
    const done = items.filter((i) => i.status === 'Completed').length;
    return {
      day: label,
      date: iso,
      completed: done,
      pending: items.length - done,
    };
  });

  return { weekStart, weekEnd, total, completed, pending, completionPct, dailySeries };
}

export interface DeadlineItem {
  id: string;
  title: string;
  source: 'Goal' | 'Project' | 'Roadmap' | 'Placement';
  dueDate: string;
  daysLeft: number;
  overdue: boolean;
  detail: string;
}

export function collectUpcomingDeadlines(
  goals: GoalRecord[],
  projects: ProjectRecord[],
  milestones: RoadmapMilestone[],
  placementTasks: PlacementTask[],
  todayIso = toIsoDate(new Date()),
  daysAhead = 35
): DeadlineItem[] {
  const cutoffIso = addDaysIso(todayIso, daysAhead);
  const items: DeadlineItem[] = [];

  const maybePush = (
    id: string,
    title: string,
    source: DeadlineItem['source'],
    dueDate: string,
    detail: string
  ) => {
    if (!dueDate || dueDate > cutoffIso) return;
    const daysLeft = diffDays(todayIso, dueDate);
    items.push({
      id,
      title,
      source,
      dueDate,
      daysLeft,
      overdue: daysLeft < 0,
      detail,
    });
  };

  for (const g of goals) {
    if (g.status !== 'Completed') {
      maybePush(`g-${g.id}`, g.title, 'Goal', g.targetDate, `${g.category} · ${g.priority}`);
    }
  }
  for (const p of projects) {
    if (p.status !== 'Completed') {
      maybePush(`p-${p.id}`, p.title, 'Project', p.targetDate, `${p.category} · ${p.status}`);
    }
  }
  for (const m of milestones) {
    if (!m.completed) {
      maybePush(`r-${m.id}`, m.title, 'Roadmap', m.deadline, `Year ${m.year} · ${m.phase}`);
    }
  }
  for (const t of placementTasks) {
    if (t.status !== 'Completed') {
      maybePush(`pl-${t.id}`, t.taskName, 'Placement', t.targetDate, `${t.category} · ${t.status}`);
    }
  }

  return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title));
}

export function recordsToCsv<T extends Record<string, unknown>>(records: T[]): string {
  if (records.length === 0) {
    return 'info\nNo records\n';
  }
  const headers = Object.keys(records[0]);
  const escapeCell = (value: unknown): string => {
    const str = value === null || value === undefined ? '' : String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [
    headers.map(escapeCell).join(','),
    ...records.map((row) => headers.map((h) => escapeCell(row[h])).join(',')),
  ];
  return lines.join('\n') + '\n';
}
