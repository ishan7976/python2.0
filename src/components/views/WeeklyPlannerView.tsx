import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { PlacePathStore } from '../../hooks/usePlacePathStore';
import type { PlannerCategory, PriorityLevel, WeeklyTask } from '../../types/placepath';
import { addDaysIso, toIsoDate } from '../../utils/calculations';
import { validateRequiredText } from '../../utils/validation';
import { StackedBarChart } from '../Charts';

const CATEGORIES: PlannerCategory[] = [
  'College',
  'Coding',
  'DSA',
  'Project',
  'Placement',
  'Personal',
];
const PRIORITIES: PriorityLevel[] = ['Low', 'Medium', 'High'];

export function WeeklyPlannerView({ store }: { store: PlacePathStore }) {
  const { state, addWeeklyTask, updateWeeklyTask, toggleWeeklyTask, deleteWeeklyTask } = store;

  const today = toIsoDate(new Date());
  const [fromDate, setFromDate] = useState(() => addDaysIso(today, -3));
  const [toDate, setToDate] = useState(() => addDaysIso(today, 6));
  const [catFilter, setCatFilter] = useState('All');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState<PlannerCategory>('College');
  const [taskDate, setTaskDate] = useState(today);
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    return state.weeklyTasks
      .filter((t) => {
        if (fromDate && t.taskDate < fromDate) return false;
        if (toDate && t.taskDate > toDate) return false;
        if (catFilter !== 'All' && t.category !== catFilter) return false;
        return true;
      })
      .sort((a, b) => a.taskDate.localeCompare(b.taskDate));
  }, [state.weeklyTasks, fromDate, toDate, catFilter]);

  const total = filtered.length;
  const completed = filtered.filter((t) => t.status === 'Completed').length;
  const pending = total - completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const chartData = useMemo(() => {
    const dates = Array.from(new Set(filtered.map((t) => t.taskDate))).sort();
    return dates.map((d) => {
      const items = filtered.filter((t) => t.taskDate === d);
      const done = items.filter((t) => t.status === 'Completed').length;
      return { label: d.slice(5), primary: done, secondary: items.length - done };
    });
  }, [filtered]);

  const openCreate = () => {
    setEditingId(null);
    setTaskName('');
    setCategory('College');
    setTaskDate(today);
    setPriority('Medium');
    setNotes('');
    setError('');
    setShowForm(true);
  };

  const openEdit = (t: WeeklyTask) => {
    setEditingId(t.id);
    setTaskName(t.taskName);
    setCategory(t.category);
    setTaskDate(t.taskDate);
    setPriority(t.priority);
    setNotes(t.notes);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateRequiredText(taskName, 'Task name');
    if (!check.valid) {
      setError(check.error);
      return;
    }
    const existing = editingId ? state.weeklyTasks.find((t) => t.id === editingId) : undefined;
    const payload: Omit<WeeklyTask, 'id'> = {
      taskName: taskName.trim(),
      category,
      taskDate,
      priority,
      status: existing ? existing.status : 'Pending',
      notes: notes.trim(),
    };
    if (editingId) {
      updateWeeklyTask(editingId, payload);
    } else {
      addWeeklyTask(payload);
    }
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs text-[#64748B]">Tasks in Range</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#1E293B]">
            {total}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#D1FAE5]/55 p-5">
          <div className="text-xs text-[#065F46]">Completed</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#065F46]">
            {completed}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#FCE4EC]/55 p-5">
          <div className="text-xs text-[#9D174D]">Pending</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#9D174D]">
            {pending}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#DCEEFF]/55 p-5">
          <div className="text-xs text-[#0C4A6E]">Completion Rate</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#0C4A6E]">
            {rate}%
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-base font-semibold text-[#1E293B]">
            Weekly Progress Visualization
          </h3>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Weekly Task
          </button>
        </div>
        <StackedBarChart
          data={chartData}
          primaryLabel="Completed"
          secondaryLabel="Pending"
          emptyText="No weekly tasks scheduled in the chosen date window."
        />
      </section>

      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-[#1E293B]">
              {editingId ? 'Edit Weekly Task' : 'Add Weekly Task'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs font-medium text-[#64748B]"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label htmlFor="wk-name" className="block text-xs font-medium text-[#64748B] mb-1">
                Task Name
              </label>
              <input
                id="wk-name"
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              />
            </div>
            <div>
              <label htmlFor="wk-cat" className="block text-xs font-medium text-[#64748B] mb-1">
                Category
              </label>
              <select
                id="wk-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as PlannerCategory)}
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
              <label htmlFor="wk-date" className="block text-xs font-medium text-[#64748B] mb-1">
                Date
              </label>
              <input
                id="wk-date"
                type="date"
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#1E293B]"
              />
            </div>
            <div>
              <label htmlFor="wk-prio" className="block text-xs font-medium text-[#64748B] mb-1">
                Priority
              </label>
              <select
                id="wk-prio"
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
            <div className="sm:col-span-2">
              <label htmlFor="wk-notes" className="block text-xs font-medium text-[#64748B] mb-1">
                Notes
              </label>
              <input
                id="wk-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#0284C7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369A1]"
              >
                {editingId ? 'Update Task' : 'Save Task'}
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

      {/* Filter bar + list */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="wk-from" className="block text-xs font-medium text-[#64748B] mb-1">
              From Date
            </label>
            <input
              id="wk-from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#1E293B]"
            />
          </div>
          <div>
            <label htmlFor="wk-to" className="block text-xs font-medium text-[#64748B] mb-1">
              To Date
            </label>
            <input
              id="wk-to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#1E293B]"
            />
          </div>
          <div>
            <label htmlFor="wk-cat-filter" className="block text-xs font-medium text-[#64748B] mb-1">
              Category
            </label>
            <select
              id="wk-cat-filter"
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl bg-[#F8FAFC] py-8 text-center text-sm text-[#64748B]">
            No weekly tasks found in this range.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((task) => {
              const isDone = task.status === 'Completed';
              return (
                <li key={task.id} className="flex items-start justify-between gap-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <input
                      id={`wk-toggle-${task.id}`}
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleWeeklyTask(task.id)}
                      aria-label={`Toggle weekly task '${task.taskName}'`}
                      className="mt-1 h-4 w-4 rounded accent-[#059669] cursor-pointer"
                    />
                    <div>
                      <label
                        htmlFor={`wk-toggle-${task.id}`}
                        className={`text-sm font-semibold cursor-pointer ${
                          isDone ? 'line-through text-[#64748B]' : 'text-[#1E293B]'
                        }`}
                      >
                        {task.taskName}
                      </label>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[#64748B]">
                        <span className="font-mono tabular-nums">{task.taskDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>{task.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{task.priority} Priority</span>
                        {task.notes && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{task.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(task)}
                      aria-label={`Edit weekly task '${task.taskName}'`}
                      className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteWeeklyTask(task.id)}
                      aria-label={`Delete weekly task '${task.taskName}'`}
                      className="rounded-lg p-1.5 text-[#64748B] hover:bg-rose-50 hover:text-[#DC2626]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
