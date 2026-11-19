import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateProfileCompletion,
  calculateWeightedCGPA,
  collectUpcomingDeadlines,
  isGoalOverdue,
  recordsToCsv,
  summarizeGoals,
  summarizePlacement,
  summarizeRoadmap,
  summarizeWeeklyProductivity,
} from './calculations';
import { validateCredits, validateSgpa, validateUrl } from './validation';
import type {
  GoalRecord,
  PlacementTask,
  ProjectRecord,
  RoadmapMilestone,
  SemesterRecord,
} from '../types/placepath';

test('weighted CGPA computes strictly over completed semesters and flags missing credits', () => {
  const empty = calculateWeightedCGPA([]);
  assert.equal(empty.cgpa, null);
  assert.equal(empty.isComplete, false);

  const sems: SemesterRecord[] = [
    { id: '1', semesterNumber: 1, sgpa: 8.5, totalCredits: 20, completedCredits: 20, status: 'Completed', notes: '' },
    { id: '2', semesterNumber: 2, sgpa: 9.2, totalCredits: 24, completedCredits: 24, status: 'Completed', notes: '' },
    { id: '3', semesterNumber: 3, sgpa: 7.0, totalCredits: 22, completedCredits: 10, status: 'In Progress', notes: '' },
  ];
  const res = calculateWeightedCGPA(sems);
  assert.equal(res.isComplete, true);
  assert.equal(res.cgpa, 8.88);
  assert.equal(res.completedSemesters, 2);

  // Missing credits on a completed semester must report incomplete rather than inventing a CGPA
  const withMissing: SemesterRecord[] = [
    ...sems,
    { id: '4', semesterNumber: 4, sgpa: 9.0, totalCredits: null, completedCredits: null, status: 'Completed', notes: '' },
  ];
  const incomplete = calculateWeightedCGPA(withMissing);
  assert.equal(incomplete.isComplete, false);
  assert.equal(incomplete.cgpa, null);
  assert.deepEqual(incomplete.missingCreditSemesters, [4]);
});

test('overdue goal detection and goal summary work accurately', () => {
  const goals: GoalRecord[] = [
    {
      id: 'g1',
      title: 'Overdue goal',
      description: '',
      category: 'Academic',
      priority: 'High',
      createdDate: '2026-10-01',
      targetDate: '2026-11-10',
      status: 'In Progress',
      progress: 50,
    },
    {
      id: 'g2',
      title: 'Completed past goal',
      description: '',
      category: 'Career',
      priority: 'Medium',
      createdDate: '2026-10-01',
      targetDate: '2026-11-05',
      status: 'Completed',
      progress: 100,
    },
  ];
  assert.equal(isGoalOverdue(goals[0], '2026-11-18'), true);
  assert.equal(isGoalOverdue(goals[1], '2026-11-18'), false);
  const summary = summarizeGoals(goals, '2026-11-18');
  assert.equal(summary.overdue, 1);
  assert.equal(summary.completed, 1);
  assert.equal(summary.completionPct, 50);
});

test('validation helpers enforce SGPA, credits, and URL rules', () => {
  assert.equal(validateSgpa(10.5, 'Completed').valid, false);
  assert.equal(validateSgpa(null, 'Completed').valid, false);
  assert.equal(validateSgpa(8.9, 'Completed').valid, true);
  assert.equal(validateCredits(20, 22).valid, false);
  assert.equal(validateCredits(22, 20).valid, true);
  assert.equal(validateUrl('ftp://bad.example.com').valid, false);
  assert.equal(validateUrl('https://github.com/student/placepath').valid, true);
});

test('profile completion, roadmap, placement, weekly summary, deadlines, and CSV export', () => {
  const pct = calculateProfileCompletion({
    fullName: 'Aarav',
    email: 'a@b.edu',
    collegeName: 'NIT',
    branch: 'CSE',
    currentYear: 3,
    currentSemester: 5,
    targetRole: 'SDE',
    githubUrl: 'https://github.com/a',
    linkedinUrl: 'https://linkedin.com/in/a',
  });
  assert.equal(pct, 100);

  const roadmap: RoadmapMilestone[] = [
    { id: 'r1', year: 1, phase: 'Foundations', title: 'Git', description: '', deadline: '2026-11-25', completed: false, notes: '', isCustom: false },
    { id: 'r2', year: 1, phase: 'Foundations', title: 'Python', description: '', deadline: '', completed: true, notes: '', isCustom: false },
  ];
  assert.equal(summarizeRoadmap(roadmap).pct, 50);

  const placementTasks: PlacementTask[] = [
    { id: 'p1', taskName: 'DP Sheet', category: 'DSA', description: '', targetDate: '2026-11-22', status: 'In Progress', notes: '' },
  ];
  assert.equal(summarizePlacement(placementTasks, []).progressPct, 0);

  const projects: ProjectRecord[] = [];
  const deadlines = collectUpcomingDeadlines([], projects, roadmap, placementTasks, '2026-11-18', 30);
  assert.equal(deadlines.length, 2);
  assert.equal(deadlines[0].dueDate, '2026-11-22');

  const week = summarizeWeeklyProductivity(
    [{ id: 'w1', taskName: 'Lab', category: 'College', taskDate: '2026-11-18', priority: 'High', status: 'Completed', notes: '' }],
    [{ id: 'd1', taskName: 'DSA', taskDate: '2026-11-18', category: 'DSA', priority: 'Medium', status: 'Pending' }],
    new Date(2026, 10, 18)
  );
  assert.equal(week.completed, 1);
  assert.equal(week.pending, 1);

  const csv = recordsToCsv([{ title: 'Hello, World', status: 'Completed' }]);
  assert.ok(csv.includes('"Hello, World",Completed'));
});
