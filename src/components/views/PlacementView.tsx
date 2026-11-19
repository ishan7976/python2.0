import { useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { PlacePathStore } from '../../hooks/usePlacePathStore';
import type {
  ApplicationStatus,
  CompanyApplication,
  PlacementCategory,
  PlacementTask,
  PlacementTaskStatus,
} from '../../types/placepath';
import {
  APPLICATION_STATUSES,
  addDaysIso,
  summarizePlacement,
  toIsoDate,
} from '../../utils/calculations';
import { validateRequiredText, validateUrl } from '../../utils/validation';
import { SimpleBarChart, StackedBarChart } from '../Charts';

const PREP_CATEGORIES: PlacementCategory[] = [
  'Aptitude',
  'DSA',
  'Coding',
  'Technical Interview',
  'HR Interview',
  'Resume',
  'Communication',
];
const PREP_STATUSES: PlacementTaskStatus[] = ['Not Started', 'In Progress', 'Completed'];

export function PlacementView({ store }: { store: PlacePathStore }) {
  const {
    state,
    addPlacementTask,
    updatePlacementTask,
    markPlacementTaskCompleted,
    deletePlacementTask,
    addApplication,
    updateApplication,
    deleteApplication,
  } = store;

  const stats = summarizePlacement(state.placementTasks, state.applications);
  const [activeTab, setActiveTab] = useState<'prep' | 'companies'>('prep');

  // Prep form state
  const [showPrepForm, setShowPrepForm] = useState(false);
  const [editPrepId, setEditPrepId] = useState<string | null>(null);
  const [taskName, setTaskName] = useState('');
  const [prepCat, setPrepCat] = useState<PlacementCategory>('DSA');
  const [prepStatus, setPrepStatus] = useState<PlacementTaskStatus>('Not Started');
  const [prepDate, setPrepDate] = useState(() => addDaysIso(toIsoDate(new Date()), 10));
  const [prepDesc, setPrepDesc] = useState('');
  const [prepNotes, setPrepNotes] = useState('');
  const [prepErr, setPrepErr] = useState('');
  const [prepCatFilter, setPrepCatFilter] = useState('All');
  const [prepStatusFilter, setPrepStatusFilter] = useState('All');

  // Company form state
  const [showAppForm, setShowAppForm] = useState(false);
  const [editAppId, setEditAppId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [appDate, setAppDate] = useState(() => toIsoDate(new Date()));
  const [jobDescription, setJobDescription] = useState('');
  const [applicationLink, setApplicationLink] = useState('');
  const [appStatus, setAppStatus] = useState<ApplicationStatus>('Applied');
  const [appNotes, setAppNotes] = useState('');
  const [appErr, setAppErr] = useState('');
  const [compSearch, setCompSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('All');

  const openPrepCreate = () => {
    setEditPrepId(null);
    setTaskName('');
    setPrepCat('DSA');
    setPrepStatus('Not Started');
    setPrepDate(addDaysIso(toIsoDate(new Date()), 10));
    setPrepDesc('');
    setPrepNotes('');
    setPrepErr('');
    setShowPrepForm(true);
  };

  const openPrepEdit = (t: PlacementTask) => {
    setEditPrepId(t.id);
    setTaskName(t.taskName);
    setPrepCat(t.category);
    setPrepStatus(t.status);
    setPrepDate(t.targetDate);
    setPrepDesc(t.description);
    setPrepNotes(t.notes);
    setPrepErr('');
    setShowPrepForm(true);
  };

  const handlePrepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateRequiredText(taskName, 'Task name');
    if (!check.valid) {
      setPrepErr(check.error);
      return;
    }
    const payload = {
      taskName: taskName.trim(),
      category: prepCat,
      description: prepDesc.trim(),
      targetDate: prepDate,
      status: prepStatus,
      notes: prepNotes.trim(),
    };
    if (editPrepId) {
      updatePlacementTask(editPrepId, payload);
    } else {
      addPlacementTask(payload);
    }
    setShowPrepForm(false);
    setEditPrepId(null);
    setPrepErr('');
  };

  const openAppCreate = () => {
    setEditAppId(null);
    setCompanyName('');
    setJobRole('');
    setAppDate(toIsoDate(new Date()));
    setJobDescription('');
    setApplicationLink('');
    setAppStatus('Applied');
    setAppNotes('');
    setAppErr('');
    setShowAppForm(true);
  };

  const openAppEdit = (a: CompanyApplication) => {
    setEditAppId(a.id);
    setCompanyName(a.companyName);
    setJobRole(a.jobRole);
    setAppDate(a.applicationDate);
    setJobDescription(a.jobDescription);
    setApplicationLink(a.applicationLink);
    setAppStatus(a.status);
    setAppNotes(a.notes);
    setAppErr('');
    setShowAppForm(true);
  };

  const handleAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const checks = [
      validateRequiredText(companyName, 'Company name'),
      validateRequiredText(jobRole, 'Job role'),
      validateUrl(applicationLink, 'Application link'),
    ];
    for (const c of checks) {
      if (!c.valid) {
        setAppErr(c.error);
        return;
      }
    }
    const payload: Omit<CompanyApplication, 'id'> = {
      companyName: companyName.trim(),
      jobRole: jobRole.trim(),
      applicationDate: appDate,
      jobDescription: jobDescription.trim(),
      applicationLink: applicationLink.trim(),
      status: appStatus,
      notes: appNotes.trim(),
    };
    if (editAppId) {
      updateApplication(editAppId, payload);
    } else {
      addApplication(payload);
    }
    setShowAppForm(false);
    setEditAppId(null);
    setAppErr('');
  };

  const filteredPrep = useMemo(() => {
    return state.placementTasks.filter((t) => {
      if (prepCatFilter !== 'All' && t.category !== prepCatFilter) return false;
      if (prepStatusFilter !== 'All' && t.status !== prepStatusFilter) return false;
      return true;
    });
  }, [state.placementTasks, prepCatFilter, prepStatusFilter]);

  const filteredApps = useMemo(() => {
    const q = compSearch.trim().toLowerCase();
    return state.applications.filter((a) => {
      if (
        q &&
        !a.companyName.toLowerCase().includes(q) &&
        !a.jobRole.toLowerCase().includes(q) &&
        !a.notes.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (appStatusFilter !== 'All' && a.status !== appStatusFilter) return false;
      return true;
    });
  }, [state.applications, compSearch, appStatusFilter]);

  const prepChartData = PREP_CATEGORIES.map((cat) => {
    const items = state.placementTasks.filter((t) => t.category === cat);
    const done = items.filter((t) => t.status === 'Completed').length;
    return { label: cat.split(' ')[0], primary: done, secondary: items.length - done };
  });

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-[#DCEEFF]/55 p-5">
          <div className="text-xs text-[#0C4A6E]">Prep Progress</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#0C4A6E]">
            {stats.progressPct}%
          </div>
          <div className="mt-1 text-xs text-[#64748B]">
            {stats.completedTasks} / {stats.totalTasks} prep tasks
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs text-[#64748B]">Total Applications</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#1E293B]">
            {stats.totalApplications}
          </div>
          <div className="mt-1 text-xs text-[#64748B]">
            {stats.applicationsByStatus.Applied} applied · {stats.applicationsByStatus.Assessment} OA
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#FCE4EC]/55 p-5">
          <div className="text-xs text-[#9D174D]">Interviews</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#9D174D]">
            {stats.applicationsByStatus.Interview}
          </div>
          <div className="mt-1 text-xs text-[#64748B]">Active interview loops</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#D1FAE5]/55 p-5">
          <div className="text-xs text-[#065F46]">Offers Received</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#065F46]">
            {stats.applicationsByStatus.Offer}
          </div>
          <div className="mt-1 text-xs text-[#64748B]">Confirmed offers</div>
        </div>
      </section>

      {/* Segmented Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'prep'}
            onClick={() => setActiveTab('prep')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'prep'
                ? 'bg-[#DCEEFF] text-[#0C4A6E]'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Preparation Tasks ({state.placementTasks.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'companies'}
            onClick={() => setActiveTab('companies')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'companies'
                ? 'bg-[#DCEEFF] text-[#0C4A6E]'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            Company Applications ({state.applications.length})
          </button>
        </div>

        <button
          type="button"
          onClick={activeTab === 'prep' ? openPrepCreate : openAppCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          {activeTab === 'prep' ? 'Add Prep Task' : 'Add Company Application'}
        </button>
      </div>

      {activeTab === 'prep' ? (
        <div className="space-y-6">
          {showPrepForm && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-[#1E293B]">
                  {editPrepId ? 'Edit Preparation Task' : 'Add Preparation Task'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPrepForm(false)}
                  className="text-xs font-medium text-[#64748B] hover:text-[#1E293B]"
                >
                  Cancel
                </button>
              </div>
              <form onSubmit={handlePrepSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <label htmlFor="prep-name" className="block text-xs font-medium text-[#64748B] mb-1">
                    Task Name
                  </label>
                  <input
                    id="prep-name"
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
                  />
                </div>
                <div>
                  <label htmlFor="prep-cat" className="block text-xs font-medium text-[#64748B] mb-1">
                    Category
                  </label>
                  <select
                    id="prep-cat"
                    value={prepCat}
                    onChange={(e) => setPrepCat(e.target.value as PlacementCategory)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
                  >
                    {PREP_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="prep-status" className="block text-xs font-medium text-[#64748B] mb-1">
                    Status
                  </label>
                  <select
                    id="prep-status"
                    value={prepStatus}
                    onChange={(e) => setPrepStatus(e.target.value as PlacementTaskStatus)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
                  >
                    {PREP_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="prep-date" className="block text-xs font-medium text-[#64748B] mb-1">
                    Target Date
                  </label>
                  <input
                    id="prep-date"
                    type="date"
                    value={prepDate}
                    onChange={(e) => setPrepDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#1E293B]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="prep-desc" className="block text-xs font-medium text-[#64748B] mb-1">
                    Description
                  </label>
                  <input
                    id="prep-desc"
                    type="text"
                    value={prepDesc}
                    onChange={(e) => setPrepDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
                  />
                </div>
                <div>
                  <label htmlFor="prep-notes" className="block text-xs font-medium text-[#64748B] mb-1">
                    Notes
                  </label>
                  <input
                    id="prep-notes"
                    type="text"
                    value={prepNotes}
                    onChange={(e) => setPrepNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between">
                  {prepErr ? (
                    <p role="alert" className="text-xs font-medium text-[#DC2626]">
                      {prepErr}
                    </p>
                  ) : (
                    <span />
                  )}
                  <button
                    type="submit"
                    className="rounded-xl bg-[#0284C7] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0369A1]"
                  >
                    {editPrepId ? 'Update Task' : 'Save Task'}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-display text-base font-semibold text-[#1E293B] mb-3">
              Preparation Progress by Category
            </h3>
            <StackedBarChart
              data={prepChartData}
              primaryLabel="Completed"
              secondaryLabel="Remaining"
              primaryColor="#6EE7B7"
              secondaryColor="#93C5FD"
              emptyText="Add preparation tasks to track readiness across categories."
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select
                aria-label="Filter prep tasks by category"
                value={prepCatFilter}
                onChange={(e) => setPrepCatFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              >
                <option value="All">All Categories</option>
                {PREP_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter prep tasks by status"
                value={prepStatusFilter}
                onChange={(e) => setPrepStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              >
                <option value="All">All Statuses</option>
                {PREP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {filteredPrep.length === 0 ? (
              <div className="rounded-xl bg-[#F8FAFC] py-8 text-center text-sm text-[#64748B]">
                No preparation tasks match your filters.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredPrep.map((t) => (
                  <li key={t.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold text-sm text-[#1E293B]">{t.taskName}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[#64748B]">
                        <span>{t.category}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            t.status === 'Completed'
                              ? 'font-semibold text-[#059669]'
                              : t.status === 'In Progress'
                              ? 'font-semibold text-[#0284C7]'
                              : 'text-[#64748B]'
                          }
                        >
                          {t.status}
                        </span>
                        {t.targetDate && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">Target {t.targetDate}</span>
                          </>
                        )}
                      </div>
                      {t.description && <p className="mt-1 text-xs text-[#64748B]">{t.description}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {t.status !== 'Completed' && (
                        <button
                          type="button"
                          onClick={() => markPlacementTaskCompleted(t.id)}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#D1FAE5] px-3 py-1.5 text-xs font-semibold text-[#065F46] hover:bg-emerald-200 whitespace-nowrap"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Complete
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openPrepEdit(t)}
                        aria-label={`Edit task '${t.taskName}'`}
                        className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePlacementTask(t.id)}
                        aria-label={`Delete task '${t.taskName}'`}
                        className="rounded-lg p-1.5 text-[#64748B] hover:bg-rose-50 hover:text-[#DC2626]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {showAppForm && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-[#1E293B]">
                  {editAppId ? 'Edit Company Application' : 'Add Company Application'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAppForm(false)}
                  className="text-xs font-medium text-[#64748B] hover:text-[#1E293B]"
                >
                  Cancel
                </button>
              </div>
              <form onSubmit={handleAppSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="app-company" className="block text-xs font-medium text-[#64748B] mb-1">
                    Company Name
                  </label>
                  <input
                    id="app-company"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
                  />
                </div>
                <div>
                  <label htmlFor="app-role" className="block text-xs font-medium text-[#64748B] mb-1">
                    Job Role
                  </label>
                  <input
                    id="app-role"
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
                  />
                </div>
                <div>
                  <label htmlFor="app-status" className="block text-xs font-medium text-[#64748B] mb-1">
                    Status
                  </label>
                  <select
                    id="app-status"
                    value={appStatus}
                    onChange={(e) => setAppStatus(e.target.value as ApplicationStatus)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="app-date" className="block text-xs font-medium text-[#64748B] mb-1">
                    Application Date
                  </label>
                  <input
                    id="app-date"
                    type="date"
                    value={appDate}
                    onChange={(e) => setAppDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#1E293B]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="app-link" className="block text-xs font-medium text-[#64748B] mb-1">
                    Application Link
                  </label>
                  <input
                    id="app-link"
                    type="url"
                    placeholder="https://careers.company.com/role"
                    value={applicationLink}
                    onChange={(e) => setApplicationLink(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="app-jd" className="block text-xs font-medium text-[#64748B] mb-1">
                    Job Description
                  </label>
                  <input
                    id="app-jd"
                    type="text"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
                  />
                </div>
                <div>
                  <label htmlFor="app-notes" className="block text-xs font-medium text-[#64748B] mb-1">
                    Notes
                  </label>
                  <input
                    id="app-notes"
                    type="text"
                    value={appNotes}
                    onChange={(e) => setAppNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between">
                  {appErr ? (
                    <p role="alert" className="text-xs font-medium text-[#DC2626]">
                      {appErr}
                    </p>
                  ) : (
                    <span />
                  )}
                  <button
                    type="submit"
                    className="rounded-xl bg-[#0284C7] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0369A1]"
                  >
                    {editAppId ? 'Update Application' : 'Save Application'}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-display text-base font-semibold text-[#1E293B] mb-3">
              Application Pipeline Statistics
            </h3>
            <SimpleBarChart
              data={[
                { label: 'Interested', value: stats.applicationsByStatus.Interested, color: '#CBD5E1' },
                { label: 'Applied', value: stats.applicationsByStatus.Applied, color: '#93C5FD' },
                { label: 'Assessment', value: stats.applicationsByStatus.Assessment, color: '#FCD34D' },
                { label: 'Interview', value: stats.applicationsByStatus.Interview, color: '#F472B6' },
                { label: 'Offer', value: stats.applicationsByStatus.Offer, color: '#34D399' },
                { label: 'Rejected', value: stats.applicationsByStatus.Rejected, color: '#FCA5A5' },
              ]}
              emptyText="Add company applications to view your placement pipeline."
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="relative sm:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
                <input
                  type="text"
                  aria-label="Search company applications"
                  placeholder="Search companies, roles, or notes..."
                  value={compSearch}
                  onChange={(e) => setCompSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-9 pr-3 py-2 text-sm text-[#1E293B]"
                />
              </div>
              <select
                aria-label="Filter applications by status"
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              >
                <option value="All">All Statuses</option>
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {filteredApps.length === 0 ? (
              <div className="rounded-xl bg-[#F8FAFC] py-8 text-center text-sm text-[#64748B]">
                No company applications match your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-medium text-[#64748B]">
                      <th className="py-2.5 pr-4">Company & Role</th>
                      <th className="py-2.5 px-4">Applied Date</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Notes</th>
                      <th className="py-2.5 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 pr-4">
                          <div className="font-semibold text-[#1E293B]">{app.companyName}</div>
                          <div className="text-xs text-[#64748B]">{app.jobRole}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs tabular-nums text-[#64748B] whitespace-nowrap">
                          {app.applicationDate || '—'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <select
                            aria-label={`Update status for ${app.companyName}`}
                            value={app.status}
                            onChange={(e) =>
                              updateApplication(app.id, {
                                ...app,
                                status: e.target.value as ApplicationStatus,
                              })
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#1E293B]"
                          >
                            {APPLICATION_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#64748B] max-w-xs truncate">
                          {app.notes || app.jobDescription || '—'}
                        </td>
                        <td className="py-3 pl-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {app.applicationLink && (
                              <a
                                href={app.applicationLink}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open job posting for ${app.companyName}`}
                                className="rounded-lg p-1.5 text-[#0284C7] hover:bg-[#DCEEFF]/50"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => openAppEdit(app)}
                              aria-label={`Edit application for ${app.companyName}`}
                              className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-100"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteApplication(app.id)}
                              aria-label={`Delete application for ${app.companyName}`}
                              className="rounded-lg p-1.5 text-[#64748B] hover:bg-rose-50 hover:text-[#DC2626]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
