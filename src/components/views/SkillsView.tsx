import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { PlacePathStore } from '../../hooks/usePlacePathStore';
import type { ProficiencyLevel, SkillCategory, SkillRecord } from '../../types/placepath';
import { summarizeSkills } from '../../utils/calculations';
import { validateRequiredText } from '../../utils/validation';
import { SimpleBarChart } from '../Charts';

const SKILL_CATEGORIES: SkillCategory[] = [
  'Programming',
  'Web Development',
  'Database',
  'Data Science',
  'AI/ML',
  'Tools',
  'Computer Science Fundamentals',
  'Other',
];

const PROFICIENCIES: ProficiencyLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

const PROFICIENCY_STYLE: Record<ProficiencyLevel, { pct: number; bar: string; text: string }> = {
  Beginner: { pct: 35, bar: 'bg-[#93C5FD]', text: 'text-[#0284C7]' },
  Intermediate: { pct: 70, bar: 'bg-[#F472B6]', text: 'text-[#DB2777]' },
  Advanced: { pct: 100, bar: 'bg-[#34D399]', text: 'text-[#059669]' },
};

export function SkillsView({ store }: { store: PlacePathStore }) {
  const { state, addSkill, updateSkill, deleteSkill } = store;
  const stats = summarizeSkills(state.skills);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SkillCategory>('Programming');
  const [proficiency, setProficiency] = useState<ProficiencyLevel>('Intermediate');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [profFilter, setProfFilter] = useState('All');

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setCategory('Programming');
    setProficiency('Intermediate');
    setNotes('');
    setError('');
    setShowForm(true);
  };

  const openEdit = (sk: SkillRecord) => {
    setEditingId(sk.id);
    setName(sk.name);
    setCategory(sk.category);
    setProficiency(sk.proficiency);
    setNotes(sk.notes);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateRequiredText(name, 'Skill name', 100);
    if (!check.valid) {
      setError(check.error);
      return;
    }
    const payload = { name: name.trim(), category, proficiency, notes: notes.trim() };
    if (editingId) {
      updateSkill(editingId, payload);
    } else {
      addSkill(payload);
    }
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.skills.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q) && !s.notes.toLowerCase().includes(q)) {
        return false;
      }
      if (catFilter !== 'All' && s.category !== catFilter) return false;
      if (profFilter !== 'All' && s.proficiency !== profFilter) return false;
      return true;
    });
  }, [state.skills, search, catFilter, profFilter]);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs text-[#64748B]">Total Skills</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#1E293B]">
            {stats.total}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#DCEEFF]/55 p-5">
          <div className="text-xs text-[#0C4A6E]">Beginner</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#0C4A6E]">
            {stats.Beginner}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#FCE4EC]/55 p-5">
          <div className="text-xs text-[#9D174D]">Intermediate</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#9D174D]">
            {stats.Intermediate}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#D1FAE5]/55 p-5">
          <div className="text-xs text-[#065F46]">Advanced</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#065F46]">
            {stats.Advanced}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h3 className="font-display text-base font-semibold text-[#1E293B] mb-3">
            Proficiency Distribution
          </h3>
          <SimpleBarChart
            data={[
              { label: 'Beginner', value: stats.Beginner, color: '#93C5FD' },
              { label: 'Intermediate', value: stats.Intermediate, color: '#F472B6' },
              { label: 'Advanced', value: stats.Advanced, color: '#34D399' },
            ]}
            emptyText="Add your technical skills to visualize proficiency distribution."
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-[#1E293B]">Skill Inventory</h3>
            <p className="mt-1 text-xs text-[#64748B]">
              Maintain a structured catalog across programming, databases, CS fundamentals, and tools.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0369A1]"
          >
            <Plus className="h-4 w-4" />
            Add Skill
          </button>
        </div>
      </section>

      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-[#1E293B]">
              {editingId ? 'Edit Skill' : 'Add Technical Skill'}
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
              <label htmlFor="skill-name" className="block text-xs font-medium text-[#64748B] mb-1">
                Skill Name
              </label>
              <input
                id="skill-name"
                type="text"
                placeholder="e.g., Python, PostgreSQL, Docker"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              />
            </div>
            <div>
              <label htmlFor="skill-cat" className="block text-xs font-medium text-[#64748B] mb-1">
                Category
              </label>
              <select
                id="skill-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as SkillCategory)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              >
                {SKILL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="skill-prof" className="block text-xs font-medium text-[#64748B] mb-1">
                Proficiency
              </label>
              <select
                id="skill-prof"
                value={proficiency}
                onChange={(e) => setProficiency(e.target.value as ProficiencyLevel)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              >
                {PROFICIENCIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="skill-notes" className="block text-xs font-medium text-[#64748B] mb-1">
                Notes
              </label>
              <input
                id="skill-notes"
                type="text"
                placeholder="Projects, certifications, or depth notes..."
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
                {editingId ? 'Update Skill' : 'Save Skill'}
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

      {/* Search & Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              aria-label="Search skills"
              placeholder="Search skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-9 pr-3 py-2 text-sm text-[#1E293B]"
            />
          </div>
          <select
            aria-label="Filter skills by category"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
          >
            <option value="All">All Categories</option>
            {SKILL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter skills by proficiency"
            value={profFilter}
            onChange={(e) => setProfFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
          >
            <option value="All">All Proficiencies</option>
            {PROFICIENCIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Skill Cards Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-[#64748B]">
          No skills match the selected filters.
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((skill) => {
            const meta = PROFICIENCY_STYLE[skill.proficiency];
            return (
              <article key={skill.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-display text-base font-semibold text-[#1E293B]">
                      {skill.name}
                    </h4>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[#64748B]">
                      <span>{skill.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-semibold ${meta.text}`}>{skill.proficiency}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Added {skill.dateAdded}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(skill)}
                      aria-label={`Edit skill '${skill.name}'`}
                      className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSkill(skill.id)}
                      aria-label={`Delete skill '${skill.name}'`}
                      className="rounded-lg p-1.5 text-[#64748B] hover:bg-rose-50 hover:text-[#DC2626]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                  <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${meta.pct}%` }} />
                </div>
                {skill.notes && <p className="mt-3 text-xs text-[#64748B]">{skill.notes}</p>}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
