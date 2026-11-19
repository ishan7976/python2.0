import { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import type { PlacePathStore } from '../../hooks/usePlacePathStore';
import type { PageId } from '../../types/placepath';
import {
  calculateProfileCompletion,
  calculateWeightedCGPA,
  collectUpcomingDeadlines,
  summarizeGoals,
  summarizePlacement,
  summarizeProjects,
  summarizeRoadmap,
  summarizeSkills,
  summarizeWeeklyProductivity,
} from '../../utils/calculations';
import { SgpaLineChart, StackedBarChart } from '../Charts';

export function DashboardView({
  store,
  onNavigate,
}: {
  store: PlacePathStore;
  onNavigate: (page: PageId) => void;
}) {
  const { state, updateProfile } = store;
  const [editingProfile, setEditingProfile] = useState(false);
  const [draft, setDraft] = useState(state.profile);

  const cgpa = calculateWeightedCGPA(state.semesters);
  const profilePct = calculateProfileCompletion(state.profile);
  const goalStats = summarizeGoals(state.goals);
  const skillStats = summarizeSkills(state.skills);
  const projectStats = summarizeProjects(state.projects);
  const roadmapStats = summarizeRoadmap(state.roadmap);
  const placementStats = summarizePlacement(state.placementTasks, state.applications);
  const weeklyStats = summarizeWeeklyProductivity(state.weeklyTasks, state.dailyTasks);
  const deadlines = collectUpcomingDeadlines(
    state.goals,
    state.projects,
    state.roadmap,
    state.placementTasks
  );

  const sgpaData = state.semesters
    .filter((s) => s.sgpa !== null)
    .map((s) => ({ label: `Sem ${s.semesterNumber}`, value: s.sgpa as number }));

  const weeklyChartData = weeklyStats.dailySeries.map((d) => ({
    label: d.day,
    primary: d.completed,
    secondary: d.pending,
  }));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(draft);
    setEditingProfile(false);
  };

  return (
    <div className="space-y-6">
      {/* Student Overview */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#64748B]">
              <span>Year {state.profile.currentYear}</span>
              <span aria-hidden="true">·</span>
              <span>Semester {state.profile.currentSemester}</span>
              <span aria-hidden="true">·</span>
              <span>{state.profile.branch || 'Engineering'}</span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#1E293B]">
              {state.profile.fullName || 'Engineering Student'}
            </h2>
            <p className="text-sm text-[#64748B]">
              {state.profile.collegeName || 'Add your college name in profile'}
              {state.profile.targetRole ? ` — Target Role: ${state.profile.targetRole}` : ''}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div className="min-w-[170px] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#64748B]">Profile Completion</span>
                <span className="font-mono font-semibold tabular-nums text-[#1E293B]">
                  {profilePct}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                <div
                  className="h-full rounded-full bg-[#0284C7] transition-all duration-300"
                  style={{ width: `${profilePct}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDraft(state.profile);
                setEditingProfile((v) => !v);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-2 text-sm font-medium text-[#1E293B] transition-colors hover:bg-[#DCEEFF] whitespace-nowrap shrink-0"
            >
              {editingProfile ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {editingProfile ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {editingProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div>
              <label htmlFor="dash-name" className="block text-xs font-medium text-[#64748B] mb-1">
                Full Name
              </label>
              <input
                id="dash-name"
                type="text"
                value={draft.fullName}
                onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B] focus:border-[#0284C7] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="dash-college" className="block text-xs font-medium text-[#64748B] mb-1">
                College Name
              </label>
              <input
                id="dash-college"
                type="text"
                value={draft.collegeName}
                onChange={(e) => setDraft({ ...draft, collegeName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B] focus:border-[#0284C7] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="dash-branch" className="block text-xs font-medium text-[#64748B] mb-1">
                Branch
              </label>
              <input
                id="dash-branch"
                type="text"
                value={draft.branch}
                onChange={(e) => setDraft({ ...draft, branch: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B] focus:border-[#0284C7] focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="dash-year" className="block text-xs font-medium text-[#64748B] mb-1">
                Current Year
              </label>
              <select
                id="dash-year"
                value={draft.currentYear}
                onChange={(e) => setDraft({ ...draft, currentYear: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B] focus:border-[#0284C7] focus:bg-white focus:outline-none"
              >
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dash-sem" className="block text-xs font-medium text-[#64748B] mb-1">
                Current Semester
              </label>
              <select
                id="dash-sem"
                value={draft.currentSemester}
                onChange={(e) => setDraft({ ...draft, currentSemester: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B] focus:border-[#0284C7] focus:bg-white focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dash-role" className="block text-xs font-medium text-[#64748B] mb-1">
                Target Role
              </label>
              <input
                id="dash-role"
                type="text"
                value={draft.targetRole}
                onChange={(e) => setDraft({ ...draft, targetRole: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B] focus:border-[#0284C7] focus:bg-white focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-[#0284C7] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0369A1]"
              >
                Save Profile
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 8 KPI Cards */}
      <section aria-label="Key student performance metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Current CGPA',
            value: cgpa.cgpa !== null ? cgpa.cgpa.toFixed(2) : 'Incomplete',
            sub: cgpa.isComplete ? `${cgpa.totalCompletedCredits} credits` : cgpa.statusMessage,
            tint: 'bg-[#DCEEFF]/55',
            accent: 'text-[#0C4A6E]',
            page: 'academics' as PageId,
          },
          {
            label: 'Completed Semesters',
            value: `${cgpa.completedSemesters} / 8`,
            sub: `${Math.round((cgpa.completedSemesters / 8) * 100)}% of degree`,
            tint: 'bg-[#F8FAFC]',
            accent: 'text-[#1E293B]',
            page: 'academics' as PageId,
          },
          {
            label: 'Active Goals',
            value: String(goalStats.active),
            sub: goalStats.overdue > 0 ? `${goalStats.overdue} overdue` : 'On track',
            tint: 'bg-[#FCE4EC]/55',
            accent: 'text-[#9D174D]',
            page: 'goals' as PageId,
          },
          {
            label: 'Completed Goals',
            value: String(goalStats.completed),
            sub: `${goalStats.completionPct}% completion rate`,
            tint: 'bg-[#D1FAE5]/55',
            accent: 'text-[#065F46]',
            page: 'goals' as PageId,
          },
          {
            label: 'Technical Skills',
            value: String(skillStats.total),
            sub: `${skillStats.Advanced} advanced · ${skillStats.Intermediate} intermediate`,
            tint: 'bg-[#F8FAFC]',
            accent: 'text-[#1E293B]',
            page: 'skills' as PageId,
          },
          {
            label: 'Active Projects',
            value: String(projectStats['In Progress']),
            sub: `${projectStats.Planned} planned`,
            tint: 'bg-[#DCEEFF]/45',
            accent: 'text-[#0C4A6E]',
            page: 'projects' as PageId,
          },
          {
            label: 'Completed Projects',
            value: String(projectStats.Completed),
            sub: `${projectStats.total} total in portfolio`,
            tint: 'bg-[#D1FAE5]/45',
            accent: 'text-[#065F46]',
            page: 'projects' as PageId,
          },
          {
            label: 'Placement Prep',
            value: `${placementStats.progressPct}%`,
            sub: `${placementStats.totalApplications} company applications`,
            tint: 'bg-[#FCE4EC]/45',
            accent: 'text-[#9D174D]',
            page: 'placement' as PageId,
          },
        ].map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={() => onNavigate(kpi.page)}
            className={`group rounded-2xl border border-slate-200 ${kpi.tint} p-5 text-left transition-colors hover:border-slate-300`}
          >
            <div className="text-xs font-medium text-[#64748B]">{kpi.label}</div>
            <div className={`mt-2 font-mono text-2xl font-bold tabular-nums ${kpi.accent}`}>
              {kpi.value}
            </div>
            <div className="mt-1.5 text-xs text-[#64748B] truncate">{kpi.sub}</div>
          </button>
        ))}
      </section>

      {/* Main Charts: Academic Performance & Weekly Productivity */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-[#1E293B]">
                Academic Performance
              </h3>
              <p className="text-xs text-[#64748B]">
                Semester-wise SGPA progression and credit completion
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('academics')}
              className="text-xs font-semibold text-[#0284C7] hover:underline whitespace-nowrap"
            >
              Open Academics
            </button>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-3 border-b border-slate-100 pb-4 text-xs">
            <div>
              <div className="text-[#64748B]">Weighted CGPA</div>
              <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-[#1E293B]">
                {cgpa.cgpa !== null ? cgpa.cgpa.toFixed(2) : 'Incomplete'}
              </div>
            </div>
            <div>
              <div className="text-[#64748B]">Credits Completed</div>
              <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-[#1E293B]">
                {cgpa.totalCompletedCredits} / {cgpa.totalPlannedCredits}
              </div>
            </div>
            <div>
              <div className="text-[#64748B]">Completed Sems</div>
              <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-[#1E293B]">
                {cgpa.completedSemesters} / 8
              </div>
            </div>
          </div>
          <SgpaLineChart data={sgpaData} cgpaReference={cgpa.cgpa} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-[#1E293B]">
                Weekly Productivity
              </h3>
              <p className="text-xs text-[#64748B]">
                {weeklyStats.weekStart} to {weeklyStats.weekEnd}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('weekly')}
              className="text-xs font-semibold text-[#0284C7] hover:underline whitespace-nowrap"
            >
              Open Planner
            </button>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-3 border-b border-slate-100 pb-4 text-xs">
            <div>
              <div className="text-[#64748B]">Completed</div>
              <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-[#059669]">
                {weeklyStats.completed}
              </div>
            </div>
            <div>
              <div className="text-[#64748B]">Pending</div>
              <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-[#DB2777]">
                {weeklyStats.pending}
              </div>
            </div>
            <div>
              <div className="text-[#64748B]">Weekly Rate</div>
              <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-[#1E293B]">
                {weeklyStats.completionPct}%
              </div>
            </div>
          </div>
          <StackedBarChart
            data={weeklyChartData}
            primaryLabel="Completed"
            secondaryLabel="Pending"
            emptyText="Add tasks in Weekly Planner or Daily Tasks to track daily output."
          />
        </div>
      </section>

      {/* 4 Module Summaries: Goals, Skills, Projects, Roadmap */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-[#1E293B]">Goals Overview</h3>
            <span className="font-mono text-xs font-semibold tabular-nums text-[#0284C7]">
              {goalStats.completionPct}%
            </span>
          </div>
          <dl className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Total Goals</dt>
              <dd className="font-mono font-medium tabular-nums text-[#1E293B]">{goalStats.total}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Completed</dt>
              <dd className="font-mono font-medium tabular-nums text-[#059669]">{goalStats.completed}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Active</dt>
              <dd className="font-mono font-medium tabular-nums text-[#1E293B]">{goalStats.active}</dd>
            </div>
          </dl>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
            <div
              className="h-full rounded-full bg-[#059669]"
              style={{ width: `${goalStats.completionPct}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-[#1E293B]">Skills Overview</h3>
            <span className="font-mono text-xs font-semibold tabular-nums text-[#64748B]">
              {skillStats.total} total
            </span>
          </div>
          <dl className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Beginner</dt>
              <dd className="font-mono font-medium tabular-nums text-[#0284C7]">{skillStats.Beginner}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Intermediate</dt>
              <dd className="font-mono font-medium tabular-nums text-[#DB2777]">{skillStats.Intermediate}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Advanced</dt>
              <dd className="font-mono font-medium tabular-nums text-[#059669]">{skillStats.Advanced}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-[#1E293B]">Projects Overview</h3>
            <span className="font-mono text-xs font-semibold tabular-nums text-[#64748B]">
              {projectStats.total} total
            </span>
          </div>
          <dl className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Planned</dt>
              <dd className="font-mono font-medium tabular-nums text-[#64748B]">{projectStats.Planned}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">In Progress</dt>
              <dd className="font-mono font-medium tabular-nums text-[#0284C7]">{projectStats['In Progress']}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Completed</dt>
              <dd className="font-mono font-medium tabular-nums text-[#059669]">{projectStats.Completed}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-[#1E293B]">Career Roadmap</h3>
            <span className="font-mono text-xs font-semibold tabular-nums text-[#DB2777]">
              {roadmapStats.pct}%
            </span>
          </div>
          <dl className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Completed Milestones</dt>
              <dd className="font-mono font-medium tabular-nums text-[#059669]">{roadmapStats.completed}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">Pending Milestones</dt>
              <dd className="font-mono font-medium tabular-nums text-[#1E293B]">{roadmapStats.pending}</dd>
            </div>
          </dl>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
            <div
              className="h-full rounded-full bg-[#DB2777]"
              style={{ width: `${roadmapStats.pct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Upcoming Deadlines */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-[#1E293B]">
              Upcoming Deadlines
            </h3>
            <p className="text-xs text-[#64748B]">
              Pending goals, projects, roadmap milestones, and placement tasks due within 35 days
            </p>
          </div>
          <span className="font-mono text-xs text-[#64748B] tabular-nums">
            {deadlines.length} upcoming
          </span>
        </div>

        {deadlines.length === 0 ? (
          <div className="rounded-xl bg-[#F8FAFC] px-4 py-8 text-center text-sm text-[#64748B]">
            No upcoming deadlines in the next 35 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-medium text-[#64748B]">
                  <th className="py-2.5 pr-4">Item</th>
                  <th className="py-2.5 px-4">Module</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4 text-right">Due Date</th>
                  <th className="py-2.5 pl-4 text-right">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deadlines.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 pr-4 font-medium text-[#1E293B]">{item.title}</td>
                    <td className="py-3 px-4 text-xs text-[#64748B]">{item.source}</td>
                    <td className="py-3 px-4 text-xs text-[#64748B]">{item.detail}</td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-[#1E293B]">
                      {item.dueDate}
                    </td>
                    <td
                      className={`py-3 pl-4 text-right font-mono text-xs font-semibold tabular-nums ${
                        item.overdue
                          ? 'text-[#DC2626]'
                          : item.daysLeft <= 5
                          ? 'text-[#D97706]'
                          : 'text-[#059669]'
                      }`}
                    >
                      {item.overdue
                        ? `Overdue (${Math.abs(item.daysLeft)}d)`
                        : item.daysLeft === 0
                        ? 'Due today'
                        : `In ${item.daysLeft}d`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
