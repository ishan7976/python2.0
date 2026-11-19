import { useMemo, useState } from 'react';
import { CheckCircle2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { PlacePathStore } from '../../hooks/usePlacePathStore';
import type { GoalCategory, GoalRecord, GoalStatus, PriorityLevel } from '../../types/placepath';
import { addDaysIso, isGoalOverdue, summarizeGoals, toIsoDate } from '../../utils/calculations';
import { validateRequiredText } from '../../utils/validation';
import { SimpleBarChart } from '../Charts';

const CATEGORIES: GoalCategory[] = ['Academic', 'Technical', 'Career', 'Personal'];
const PRIORITIES: PriorityLevel[] = ['Low', 'Medium', 'High'];
const STATUSES: GoalStatus[] = ['Not Started', 'In Progress', 'Completed'];

export function GoalsView({ store }: { store: PlacePathStore }) {
  const { state, addGoal, updateGoal, markGoalCompleted, deleteGoal } = store;
  const stats = summarizeGoals(state.goals);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Career');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [status, setStatus] = useState<GoalStatus>('Not Started');
  const [targetDate, setTargetDate] = useState(() => addDaysIso(toIsoDate(new Date()), 21));
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('All');
  const [prioFilter, setPrioFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortAsc, setSortAsc] = useState(true);

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCategory('Career');
    setPriority('High');
    setStatus('Not Started');
    setTargetDate(addDaysIso(toIsoDate(new Date()), 21));
    setProgress(0);
    setError('');
    setShowForm(true);
  };

  const openEdit = (g: GoalRecord) => {
    setEditingId(g.id);
    setTitle(g.title);
    setDescription(g.description);
    setCategory(g.category);
    setPriority(g.priority);
    setStatus(g.status);
    setTargetDate(g.targetDate);
    setProgress(g.progress);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateRequiredText(title, 'Goal title');
    if (!check.valid) {
      setError(check.error);
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      targetDate,
      status,
      progress,
    };
    if (editingId) {
      updateGoal(editingId, payload);
    } else {
      addGoal(payload);
    }
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.goals
      .filter((g) => {
        if (q && !g.title.toLowerCase().includes(q) && !g.description.toLowerCase().includes(q)) {
          return false;
        }
        if (catFilter !== 'All' && g.category !== catFilter) return false;
        if (prioFilter !== 'All' && g.priority !== prioFilter) return false;
        if (statusFilter === 'Overdue') return isGoalOverdue(g);
        if (statusFilter !== 'All' && g.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) =>
        sortAsc ? a.targetDate.localeCompare(b.targetDate) : b.targetDate.localeCompare(a.targetDate)
      );
  }, [state.goals, search, catFilter, prioFilter, statusFilter, sortAsc]);

  const categoryAvgData = CATEGORIES.map((cat, idx) => {
    const items = state.goals.filter((g) => g.category === cat);
    const avg = items.length ? Math.round(items.reduce((s, i) => s + i.progress, 0) / items.length) : 0;
    const colors = ['#93C5FD', '#F9A8D4', '#6EE7B7', '#FCD34D'];
    return { label: cat, value: avg, color: colors[idx] };
  });

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs text-[#64748B]">Total Goals</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#1E293B]">
            {stats.total}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#D1FAE5]/55 p-5">
          <div className="text-xs text-[#065F46]">Completed</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#065F46]">
            {stats.completed}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#DCEEFF]/55 p-5">
          <div className="text-xs text-[#0C4A6E]">Active</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#0C4A6E]">
            {stats.active}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#FCE4EC]/60 p-5">
          <div className="text-xs text-[#9D174D]">Overdue</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#DC2626]">
            {stats.overdue}
          </div>
        </div>
      </section>

      {/* Analytics + Action */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h3 className="font-display text-base font-semibold text-[#1E293B] mb-3">
            Average Progress by Goal Category
          </h3>
          <SimpleBarChart data={categoryAvgData} unit="%" emptyText="Add goals to view progress analytics." />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-[#1E293B]">Goal Completion</h3>
            <p className="mt-1 text-xs text-[#64748B]">
              {stats.completed} of {stats.total} goals achieved so far.
            </p>
            <div className="mt-4 font-mono text-3xl font-bold tabular-nums text-[#0284C7]">
              {stats.completionPct}%
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
              <div
                className="h-full rounded-full bg-[#0284C7]"
                style={{ width: `${stats.completionPct}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0369A1]"
          >
            <Plus className="h-4 w-4" />
            Add Goal
          </button>
        </div>
      </section>

      {/* Create / Edit Goal Form */}
      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-[#1E293B]">
              {editingId ? 'Edit Goal' : 'Create New Goal'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs font-medium text-[#64748B] hover:text-[#1E293B]"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-4">
              <label htmlFor="goal-title" className="block text-xs font-medium text-[#64748B] mb-1">
                Goal Title
              </label>
              <input
                id="goal-title"
                type="text"
                placeholder="e.g., Land Summer SWE Internship"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label htmlFor="goal-desc" className="block text-xs font-medium text-[#64748B] mb-1">
                Description
              </label>
              <textarea
                id="goal-desc"
                rows={2}
                placeholder="Define measurable milestones..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              />
            </div>
            <div>
              <label htmlFor="goal-cat" className="block text-xs font-medium text-[#64748B] mb-1">
                Category
              </label>
              <select
                id="goal-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="goal-prio" className="block text-xs font-medium text-[#64748B] mb-1">
                Priority
              </label>
              <select
                id="goal-prio"
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="goal-status" className="block text-xs font-medium text-[#64748B] mb-1">
                Status
              </label>
              <select
                id="goal-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="goal-target" className="block text-xs font-medium text-[#64748B] mb-1">
                Target Date
              </label>
              <input
                id="goal-target"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#1E293B]"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="goal-progress" className="block text-xs font-medium text-[#64748B] mb-1">
                Progress ({progress}%)
              </label>
              <input
                id="goal-progress"
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-[#0284C7]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#0284C7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369A1]"
              >
                {editingId ? 'Update Goal' : 'Save Goal'}
              </button>
            </div>
            {error && (
              <p role="alert" className="sm:col-span-2 lg:col-span-4 text-xs font-medium text-[#DC2626]">
                {error}
              </p>
            )}
          </form>
        </section>
      )}

      {/* Search & Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              aria-label="Search goals"
              placeholder="Search goals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-9 pr-3 py-2 text-sm text-[#1E293B]"
            />
          </div>
          <select
            aria-label="Filter goals by category"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter goals by priority"
            value={prioFilter}
            onChange={(e) => setPrioFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
          >
            <option value="All">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p} Priority
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              aria-label="Filter goals by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="Overdue">Overdue</option>
            </select>
            <button
              type="button"
              onClick={() => setSortAsc((v) => !v)}
              className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-xs font-medium text-[#1E293B] hover:bg-slate-100 whitespace-nowrap"
            >
              {sortAsc ? 'Due ↑' : 'Due ↓'}
            </button>
          </div>
        </div>
      </section>

      {/* Goals List */}
      <section className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-[#64748B]">
            No goals match the selected filters.
          </div>
        ) : (
          filtered.map((goal) => {
            const overdue = isGoalOverdue(goal);
            return (
              <article
                key={goal.id}
                className={`rounded-2xl border bg-white p-5 ${
                  overdue ? 'border-rose-300' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <h4 className="font-display text-base font-semibold text-[#1E293B]">
                      {goal.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748B]">
                      <span>{goal.category}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          goal.priority === 'High'
                            ? 'font-semibold text-[#DB2777]'
                            : 'text-[#64748B]'
                        }
                      >
                        {goal.priority} Priority
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          goal.status === 'Completed'
                            ? 'font-semibold text-[#059669]'
                            : 'text-[#0284C7]'
                        }
                      >
                        {goal.status}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Target {goal.targetDate}</span>
                      {overdue && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#DC2626]">Overdue</span>
                        </>
                      )}
                    </div>
                    {goal.description && (
                      <p className="pt-1 text-sm text-[#64748B]">{goal.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {goal.status !== 'Completed' && (
                      <button
                        type="button"
                        onClick={() => markGoalCompleted(goal.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#D1FAE5] px-3 py-1.5 text-xs font-semibold text-[#065F46] hover:bg-emerald-200 whitespace-nowrap"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Complete
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(goal)}
                      aria-label={`Edit goal '${goal.title}'`}
                      className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteGoal(goal.id)}
                      aria-label={`Delete goal '${goal.title}'`}
                      className="rounded-lg p-1.5 text-[#64748B] hover:bg-rose-50 hover:text-[#DC2626]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F1F5F9]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        goal.status === 'Completed'
                          ? 'bg-[#059669]'
                          : overdue
                          ? 'bg-[#DC2626]'
                          : 'bg-[#0284C7]'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs font-semibold tabular-nums text-[#1E293B] w-10 text-right">
                    {goal.progress}%
                  </span>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
