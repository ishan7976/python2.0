import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { PlacePathStore } from '../../hooks/usePlacePathStore';
import type { DailyTask, PlannerCategory, PriorityLevel } from '../../types/placepath';
import { toIsoDate } from '../../utils/calculations';
import { validateRequiredText } from '../../utils/validation';

const CATEGORIES: PlannerCategory[] = [
  'College',
  'Coding',
  'DSA',
  'Project',
  'Placement',
  'Personal',
];
const PRIORITIES: PriorityLevel[] = ['Low', 'Medium', 'High'];

type DailyScope = 'today' | 'previous' | 'upcoming' | 'specific';

export function DailyTasksView({ store }: { store: PlacePathStore }) {
  const { state, addDailyTask, updateDailyTask, toggleDailyTask, deleteDailyTask } = store;

  const today = toIsoDate(new Date());
  const [scope, setScope] = useState<DailyScope>('today');
  const [pickedDate, setPickedDate] = useState(today);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskDate, setTaskDate] = useState(today);
  const [category, setCategory] = useState<PlannerCategory>('DSA');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [error, setError] = useState('');

  const visibleTasks = useMemo(() => {
    if (scope === 'today') return state.dailyTasks.filter((t) => t.taskDate === today);
    if (scope === 'previous') return state.dailyTasks.filter((t) => t.taskDate < today);
    if (scope === 'upcoming') return state.dailyTasks.filter((t) => t.taskDate > today);
    return state.dailyTasks.filter((t) => t.taskDate === pickedDate);
  }, [state.dailyTasks, scope, today, pickedDate]);

  const total = visibleTasks.length;
  const completed = visibleTasks.filter((t) => t.status === 'Completed').length;
  const pending = total - completed;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const startEdit = (task: DailyTask) => {
    setEditingId(task.id);
    setTaskName(task.taskName);
    setTaskDate(task.taskDate);
    setCategory(task.category);
    setPriority(task.priority);
    setError('');
  };

  const resetForm = () => {
    setEditingId(null);
    setTaskName('');
    setTaskDate(scope === 'specific' ? pickedDate : today);
    setCategory('DSA');
    setPriority('High');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateRequiredText(taskName, 'Task name');
    if (!check.valid) {
      setError(check.error);
      return;
    }
    const existing = editingId ? state.dailyTasks.find((t) => t.id === editingId) : undefined;
    const payload: Omit<DailyTask, 'id'> = {
      taskName: taskName.trim(),
      taskDate,
      category,
      priority,
      status: existing ? existing.status : 'Pending',
    };
    if (editingId) {
      updateDailyTask(editingId, payload);
    } else {
      addDailyTask(payload);
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Counters */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs text-[#64748B]">Tasks in View</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#1E293B]">
            {total}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#D1FAE5]/55 p-5">
          <div className="text-xs text-[#065F46]">Completed</div>
          <div
            data-testid="daily-completed-count"
            className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#065F46]"
          >
            {completed}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#FCE4EC]/55 p-5">
          <div className="text-xs text-[#9D174D]">Pending</div>
          <div
            data-testid="daily-pending-count"
            className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#9D174D]"
          >
            {pending}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#DCEEFF]/55 p-5">
          <div className="text-xs text-[#0C4A6E]">Daily Progress</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#0C4A6E]">
            {pct}%
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[#0284C7]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </section>

      {/* Quick Add / Edit Daily Task */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-[#1E293B]">
            {editingId ? 'Edit Daily Task' : 'Add Daily Task'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-medium text-[#64748B] hover:text-[#1E293B]"
            >
              Cancel Edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="daily-name" className="block text-xs font-medium text-[#64748B] mb-1">
              Task Name
            </label>
            <input
              id="daily-name"
              type="text"
              placeholder="e.g., Solve 3 Sliding Window problems"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
            />
          </div>
          <div>
            <label htmlFor="daily-date" className="block text-xs font-medium text-[#64748B] mb-1">
              Date
            </label>
            <input
              id="daily-date"
              type="date"
              value={taskDate}
              onChange={(e) => setTaskDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#1E293B]"
            />
          </div>
          <div>
            <label htmlFor="daily-cat" className="block text-xs font-medium text-[#64748B] mb-1">
              Category
            </label>
            <select
              id="daily-cat"
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
            <label htmlFor="daily-prio" className="block text-xs font-medium text-[#64748B] mb-1">
              Priority
            </label>
            <select
              id="daily-prio"
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
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0284C7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              {editingId ? 'Update' : 'Add Task'}
            </button>
          </div>
          {error && (
            <p role="alert" className="sm:col-span-2 lg:col-span-6 text-xs font-medium text-[#DC2626]">
              {error}
            </p>
          )}
        </form>
      </section>

      {/* Scope Tabs & Task List */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 bg-[#F8FAFC] p-1" role="tablist">
            {(
              [
                ['today', `Today (${today})`],
                ['previous', 'Previous Days'],
                ['upcoming', 'Upcoming'],
                ['specific', 'Pick Date'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={scope === id}
                onClick={() => setScope(id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  scope === id
                    ? 'bg-white text-[#1E293B] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {scope === 'specific' && (
            <input
              type="date"
              aria-label="Pick specific date"
              value={pickedDate}
              onChange={(e) => setPickedDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 font-mono text-xs text-[#1E293B]"
            />
          )}
        </div>

        {visibleTasks.length === 0 ? (
          <div className="rounded-xl bg-[#F8FAFC] py-10 text-center text-sm text-[#64748B]">
            No daily tasks in this view. Add a task above to plan your execution.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visibleTasks.map((task) => {
              const isDone = task.status === 'Completed';
              return (
                <li key={task.id} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <input
                      id={`dt-toggle-${task.id}`}
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleDailyTask(task.id)}
                      aria-label={`Toggle daily task '${task.taskName}'`}
                      className="mt-1 h-4 w-4 rounded accent-[#059669] cursor-pointer"
                    />
                    <div>
                      <label
                        htmlFor={`dt-toggle-${task.id}`}
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
                        <span
                          className={
                            task.priority === 'High' ? 'font-semibold text-[#DB2777]' : ''
                          }
                        >
                          {task.priority} Priority
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className={isDone ? 'font-medium text-[#059669]' : ''}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(task)}
                      aria-label={`Edit daily task '${task.taskName}'`}
                      className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDailyTask(task.id)}
                      aria-label={`Delete daily task '${task.taskName}'`}
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
