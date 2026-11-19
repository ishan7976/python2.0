import { useCallback, useEffect, useState } from 'react';
import type {
  CompanyApplication,
  DailyTask,
  GoalRecord,
  PlacePathState,
  PlacementTask,
  ProjectRecord,
  RoadmapMilestone,
  SemesterRecord,
  SkillRecord,
  StudentProfile,
  WeeklyTask,
} from '../types/placepath';
import { createEmptyResetState, createSeedState } from '../data/seedData';
import { toIsoDate } from '../utils/calculations';

const STORAGE_KEY = 'placepath_student_store_v1';

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadInitialState(): PlacePathState {
  if (typeof window === 'undefined') {
    return createSeedState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createSeedState();
    }
    const parsed = JSON.parse(raw) as Partial<PlacePathState>;
    if (!parsed || !parsed.profile || !Array.isArray(parsed.semesters)) {
      return createSeedState();
    }
    return {
      profile: parsed.profile,
      semesters: parsed.semesters ?? [],
      goals: parsed.goals ?? [],
      skills: parsed.skills ?? [],
      projects: parsed.projects ?? [],
      roadmap: parsed.roadmap ?? [],
      placementTasks: parsed.placementTasks ?? [],
      applications: parsed.applications ?? [],
      weeklyTasks: parsed.weeklyTasks ?? [],
      dailyTasks: parsed.dailyTasks ?? [],
    };
  } catch {
    return createSeedState();
  }
}

export function usePlacePathStore() {
  const [state, setState] = useState<PlacePathState>(loadInitialState);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors in restricted preview sandboxes
    }
  }, [state]);

  // Profile
  const updateProfile = useCallback((profile: StudentProfile) => {
    setState((prev) => ({ ...prev, profile }));
  }, []);

  // Semesters
  const addSemester = useCallback((record: Omit<SemesterRecord, 'id'>) => {
    setState((prev) => ({
      ...prev,
      semesters: [...prev.semesters, { ...record, id: createId('sem') }].sort(
        (a, b) => a.semesterNumber - b.semesterNumber
      ),
    }));
  }, []);

  const updateSemester = useCallback((id: string, record: Omit<SemesterRecord, 'id'>) => {
    setState((prev) => ({
      ...prev,
      semesters: prev.semesters
        .map((s) => (s.id === id ? { ...record, id } : s))
        .sort((a, b) => a.semesterNumber - b.semesterNumber),
    }));
  }, []);

  const deleteSemester = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      semesters: prev.semesters.filter((s) => s.id !== id),
    }));
  }, []);

  // Goals
  const addGoal = useCallback((goal: Omit<GoalRecord, 'id' | 'createdDate'>) => {
    const progress = goal.status === 'Completed' ? 100 : Math.max(0, Math.min(100, goal.progress));
    const status = progress === 100 ? 'Completed' : goal.status;
    setState((prev) => ({
      ...prev,
      goals: [
        { ...goal, id: createId('goal'), createdDate: toIsoDate(new Date()), progress, status },
        ...prev.goals,
      ],
    }));
  }, []);

  const updateGoal = useCallback((id: string, patch: Omit<GoalRecord, 'id' | 'createdDate'>) => {
    const progress = patch.status === 'Completed' ? 100 : Math.max(0, Math.min(100, patch.progress));
    const status = progress === 100 ? 'Completed' : patch.status;
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, ...patch, progress, status } : g)),
    }));
  }, []);

  const markGoalCompleted = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === id ? { ...g, status: 'Completed', progress: 100 } : g
      ),
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  }, []);

  // Skills
  const addSkill = useCallback((skill: Omit<SkillRecord, 'id' | 'dateAdded'>) => {
    setState((prev) => ({
      ...prev,
      skills: [{ ...skill, id: createId('sk'), dateAdded: toIsoDate(new Date()) }, ...prev.skills],
    }));
  }, []);

  const updateSkill = useCallback((id: string, patch: Omit<SkillRecord, 'id' | 'dateAdded'>) => {
    setState((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const deleteSkill = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.id !== id),
    }));
  }, []);

  // Projects
  const addProject = useCallback((project: Omit<ProjectRecord, 'id'>) => {
    setState((prev) => ({
      ...prev,
      projects: [{ ...project, id: createId('proj') }, ...prev.projects],
    }));
  }, []);

  const updateProject = useCallback((id: string, patch: Omit<ProjectRecord, 'id'>) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...patch, id } : p)),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  }, []);

  // Roadmap
  const addMilestone = useCallback((milestone: Omit<RoadmapMilestone, 'id'>) => {
    setState((prev) => ({
      ...prev,
      roadmap: [...prev.roadmap, { ...milestone, id: createId('rm') }],
    }));
  }, []);

  const updateMilestone = useCallback((id: string, patch: Omit<RoadmapMilestone, 'id'>) => {
    setState((prev) => ({
      ...prev,
      roadmap: prev.roadmap.map((m) => (m.id === id ? { ...patch, id } : m)),
    }));
  }, []);

  const toggleMilestone = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      roadmap: prev.roadmap.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m)),
    }));
  }, []);

  const deleteMilestone = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      roadmap: prev.roadmap.filter((m) => m.id !== id),
    }));
  }, []);

  // Placement Tasks
  const addPlacementTask = useCallback((task: Omit<PlacementTask, 'id'>) => {
    setState((prev) => ({
      ...prev,
      placementTasks: [{ ...task, id: createId('pt') }, ...prev.placementTasks],
    }));
  }, []);

  const updatePlacementTask = useCallback((id: string, patch: Omit<PlacementTask, 'id'>) => {
    setState((prev) => ({
      ...prev,
      placementTasks: prev.placementTasks.map((t) => (t.id === id ? { ...patch, id } : t)),
    }));
  }, []);

  const markPlacementTaskCompleted = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      placementTasks: prev.placementTasks.map((t) =>
        t.id === id ? { ...t, status: 'Completed' } : t
      ),
    }));
  }, []);

  const deletePlacementTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      placementTasks: prev.placementTasks.filter((t) => t.id !== id),
    }));
  }, []);

  // Company Applications
  const addApplication = useCallback((app: Omit<CompanyApplication, 'id'>) => {
    setState((prev) => ({
      ...prev,
      applications: [{ ...app, id: createId('app') }, ...prev.applications],
    }));
  }, []);

  const updateApplication = useCallback((id: string, patch: Omit<CompanyApplication, 'id'>) => {
    setState((prev) => ({
      ...prev,
      applications: prev.applications.map((a) => (a.id === id ? { ...patch, id } : a)),
    }));
  }, []);

  const deleteApplication = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      applications: prev.applications.filter((a) => a.id !== id),
    }));
  }, []);

  // Weekly Tasks
  const addWeeklyTask = useCallback((task: Omit<WeeklyTask, 'id'>) => {
    setState((prev) => ({
      ...prev,
      weeklyTasks: [{ ...task, id: createId('wk') }, ...prev.weeklyTasks],
    }));
  }, []);

  const updateWeeklyTask = useCallback((id: string, patch: Omit<WeeklyTask, 'id'>) => {
    setState((prev) => ({
      ...prev,
      weeklyTasks: prev.weeklyTasks.map((t) => (t.id === id ? { ...patch, id } : t)),
    }));
  }, []);

  const toggleWeeklyTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      weeklyTasks: prev.weeklyTasks.map((t) =>
        t.id === id ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t
      ),
    }));
  }, []);

  const deleteWeeklyTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      weeklyTasks: prev.weeklyTasks.filter((t) => t.id !== id),
    }));
  }, []);

  // Daily Tasks
  const addDailyTask = useCallback((task: Omit<DailyTask, 'id'>) => {
    setState((prev) => ({
      ...prev,
      dailyTasks: [{ ...task, id: createId('dt') }, ...prev.dailyTasks],
    }));
  }, []);

  const updateDailyTask = useCallback((id: string, patch: Omit<DailyTask, 'id'>) => {
    setState((prev) => ({
      ...prev,
      dailyTasks: prev.dailyTasks.map((t) => (t.id === id ? { ...patch, id } : t)),
    }));
  }, []);

  const toggleDailyTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      dailyTasks: prev.dailyTasks.map((t) =>
        t.id === id ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t
      ),
    }));
  }, []);

  const deleteDailyTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      dailyTasks: prev.dailyTasks.filter((t) => t.id !== id),
    }));
  }, []);

  // Reset & Seed Restore
  const resetAllData = useCallback((keepDefaultRoadmap: boolean) => {
    setState(createEmptyResetState(keepDefaultRoadmap));
  }, []);

  const loadSampleData = useCallback(() => {
    setState(createSeedState());
  }, []);

  return {
    state,
    updateProfile,
    addSemester,
    updateSemester,
    deleteSemester,
    addGoal,
    updateGoal,
    markGoalCompleted,
    deleteGoal,
    addSkill,
    updateSkill,
    deleteSkill,
    addProject,
    updateProject,
    deleteProject,
    addMilestone,
    updateMilestone,
    toggleMilestone,
    deleteMilestone,
    addPlacementTask,
    updatePlacementTask,
    markPlacementTaskCompleted,
    deletePlacementTask,
    addApplication,
    updateApplication,
    deleteApplication,
    addWeeklyTask,
    updateWeeklyTask,
    toggleWeeklyTask,
    deleteWeeklyTask,
    addDailyTask,
    updateDailyTask,
    toggleDailyTask,
    deleteDailyTask,
    resetAllData,
    loadSampleData,
  };
}

export type PlacePathStore = ReturnType<typeof usePlacePathStore>;
