import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { YEAR_PHASES } from '../../data/seedData';
import type { PlacePathStore } from '../../hooks/usePlacePathStore';
import type { RoadmapMilestone } from '../../types/placepath';
import { summarizeRoadmap } from '../../utils/calculations';
import { validateRequiredText } from '../../utils/validation';

export function RoadmapView({ store }: { store: PlacePathStore }) {
  const { state, addMilestone, updateMilestone, toggleMilestone, deleteMilestone } = store;
  const stats = summarizeRoadmap(state.roadmap);

  const [selectedYear, setSelectedYear] = useState<1 | 2 | 3 | 4>(
    (Math.min(4, Math.max(1, state.profile.currentYear)) as 1 | 2 | 3 | 4) || 1
  );
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [year, setYear] = useState<1 | 2 | 3 | 4>(selectedYear);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  const openCreate = () => {
    setEditingId(null);
    setYear(selectedYear);
    setTitle('');
    setDescription('');
    setDeadline('');
    setNotes('');
    setCompleted(false);
    setError('');
    setShowForm(true);
  };

  const openEdit = (m: RoadmapMilestone) => {
    setEditingId(m.id);
    setYear(m.year);
    setTitle(m.title);
    setDescription(m.description);
    setDeadline(m.deadline);
    setNotes(m.notes);
    setCompleted(m.completed);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateRequiredText(title, 'Milestone title');
    if (!check.valid) {
      setError(check.error);
      return;
    }
    const payload: Omit<RoadmapMilestone, 'id'> = {
      year,
      phase: YEAR_PHASES[year],
      title: title.trim(),
      description: description.trim(),
      deadline,
      completed,
      notes: notes.trim(),
      isCustom: true,
    };
    if (editingId) {
      updateMilestone(editingId, payload);
    } else {
      addMilestone(payload);
    }
    setSelectedYear(year);
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const yearMilestones = state.roadmap.filter((m) => m.year === selectedYear);
  const yearStats = stats.byYear[selectedYear];

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1E293B]">
              4-Year Engineering Career Roadmap
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {stats.completed} of {stats.total} milestones completed · {stats.pending} pending
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-2xl font-bold tabular-nums text-[#DB2777]">
              {stats.pct}%
            </span>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Custom Milestone
            </button>
          </div>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
          <div
            className="h-full rounded-full bg-[#DB2777] transition-all duration-300"
            style={{ width: `${stats.pct}%` }}
          />
        </div>

        {/* Year Selector Cards */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4" role="tablist" aria-label="Engineering years">
          {([1, 2, 3, 4] as const).map((yr) => {
            const ys = stats.byYear[yr];
            const active = selectedYear === yr;
            return (
              <button
                key={yr}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedYear(yr)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? 'border-[#0284C7] bg-[#DCEEFF]/55'
                    : 'border-slate-200 bg-[#F8FAFC] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1E293B]">Year {yr}</span>
                  <span className="font-mono font-semibold tabular-nums text-[#0284C7]">
                    {ys.pct}%
                  </span>
                </div>
                <div className="mt-1 text-xs text-[#64748B] truncate">{YEAR_PHASES[yr]}</div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-[#0284C7]"
                    style={{ width: `${ys.pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Add / Edit Milestone Form */}
      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-[#1E293B]">
              {editingId ? 'Edit Roadmap Milestone' : 'Add Custom Milestone'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs font-medium text-[#64748B] hover:text-[#1E293B]"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="rm-year" className="block text-xs font-medium text-[#64748B] mb-1">
                Year
              </label>
              <select
                id="rm-year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value) as 1 | 2 | 3 | 4)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              >
                {([1, 2, 3, 4] as const).map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr} — {YEAR_PHASES[yr]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rm-title" className="block text-xs font-medium text-[#64748B] mb-1">
                Milestone Title
              </label>
              <input
                id="rm-title"
                type="text"
                placeholder="e.g., Contribute to Apache Open Source"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              />
            </div>
            <div>
              <label htmlFor="rm-deadline" className="block text-xs font-medium text-[#64748B] mb-1">
                Deadline (optional)
              </label>
              <input
                id="rm-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#1E293B]"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="rm-desc" className="block text-xs font-medium text-[#64748B] mb-1">
                Description
              </label>
              <input
                id="rm-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              />
            </div>
            <div>
              <label htmlFor="rm-notes" className="block text-xs font-medium text-[#64748B] mb-1">
                Notes
              </label>
              <input
                id="rm-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              />
            </div>
            <div className="sm:col-span-3 flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#1E293B]">
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                  className="h-4 w-4 rounded accent-[#059669]"
                />
                Mark as completed
              </label>
              <button
                type="submit"
                className="rounded-xl bg-[#0284C7] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0369A1]"
              >
                {editingId ? 'Save Changes' : 'Add Milestone'}
              </button>
            </div>
            {error && (
              <p role="alert" className="sm:col-span-3 text-xs font-medium text-[#DC2626]">
                {error}
              </p>
            )}
          </form>
        </section>
      )}

      {/* Selected Year Milestones */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-[#1E293B]">
              Year {selectedYear} — {YEAR_PHASES[selectedYear]}
            </h3>
            <p className="text-xs text-[#64748B]">
              {yearStats.completed} of {yearStats.total} milestones completed ({yearStats.pct}%)
            </p>
          </div>
        </div>

        {yearMilestones.length === 0 ? (
          <div className="rounded-xl bg-[#F8FAFC] py-10 text-center text-sm text-[#64748B]">
            No milestones for Year {selectedYear} yet. Add a custom milestone above.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {yearMilestones.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-4 py-4">
                <div className="flex items-start gap-3">
                  <input
                    id={`rm-toggle-${m.id}`}
                    type="checkbox"
                    checked={m.completed}
                    onChange={() => toggleMilestone(m.id)}
                    aria-label={`Toggle milestone '${m.title}'`}
                    className="mt-1 h-4 w-4 rounded accent-[#059669] cursor-pointer"
                  />
                  <div>
                    <label
                      htmlFor={`rm-toggle-${m.id}`}
                      className={`text-sm font-semibold cursor-pointer ${
                        m.completed ? 'line-through text-[#64748B]' : 'text-[#1E293B]'
                      }`}
                    >
                      {m.title}
                    </label>
                    {m.description && (
                      <p className="mt-0.5 text-xs text-[#64748B]">{m.description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[#64748B]">
                      <span className={m.completed ? 'font-medium text-[#059669]' : 'text-[#0284C7]'}>
                        {m.completed ? 'Completed' : 'Pending'}
                      </span>
                      {m.deadline && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">Deadline {m.deadline}</span>
                        </>
                      )}
                      {m.notes && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{m.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(m)}
                    aria-label={`Edit milestone '${m.title}'`}
                    className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B]"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMilestone(m.id)}
                    aria-label={`Delete milestone '${m.title}'`}
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
  );
}
