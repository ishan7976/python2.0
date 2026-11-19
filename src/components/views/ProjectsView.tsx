import { useMemo, useState } from 'react';
import { ExternalLink, Github, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { PlacePathStore } from '../../hooks/usePlacePathStore';
import type { ProjectRecord, ProjectStatus } from '../../types/placepath';
import { addDaysIso, summarizeProjects, toIsoDate } from '../../utils/calculations';
import { validateDateOrder, validateRequiredText, validateUrl } from '../../utils/validation';
import { SimpleBarChart } from '../Charts';

const PROJECT_STATUSES: ProjectStatus[] = ['Planned', 'In Progress', 'Completed'];
const PROJECT_CATEGORIES = [
  'Web Development',
  'AI/ML',
  'Data Science',
  'Systems',
  'Mobile',
  'Cloud / DevOps',
  'Embedded / IoT',
  'Other',
];

const STATUS_PROGRESS: Record<ProjectStatus, number> = {
  Planned: 15,
  'In Progress': 60,
  Completed: 100,
};

export function ProjectsView({ store }: { store: PlacePathStore }) {
  const { state, addProject, updateProject, deleteProject } = store;
  const stats = summarizeProjects(state.projects);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [technologies, setTechnologies] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Planned');
  const [startDate, setStartDate] = useState(() => toIsoDate(new Date()));
  const [targetDate, setTargetDate] = useState(() => addDaysIso(toIsoDate(new Date()), 45));
  const [completionDate, setCompletionDate] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCategory('Web Development');
    setTechnologies('');
    setStatus('Planned');
    setStartDate(toIsoDate(new Date()));
    setTargetDate(addDaysIso(toIsoDate(new Date()), 45));
    setCompletionDate('');
    setGithubUrl('');
    setLiveUrl('');
    setNotes('');
    setError('');
    setShowForm(true);
  };

  const openEdit = (p: ProjectRecord) => {
    setEditingId(p.id);
    setTitle(p.title);
    setDescription(p.description);
    setCategory(p.category);
    setTechnologies(p.technologies);
    setStatus(p.status);
    setStartDate(p.startDate);
    setTargetDate(p.targetDate);
    setCompletionDate(p.completionDate);
    setGithubUrl(p.githubUrl);
    setLiveUrl(p.liveUrl);
    setNotes(p.notes);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const checks = [
      validateRequiredText(title, 'Project title'),
      validateUrl(githubUrl, 'GitHub URL'),
      validateUrl(liveUrl, 'Live project URL'),
      validateDateOrder(startDate, targetDate),
    ];
    for (const c of checks) {
      if (!c.valid) {
        setError(c.error);
        return;
      }
    }

    const payload: Omit<ProjectRecord, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      category,
      technologies: technologies.trim(),
      status,
      startDate,
      targetDate,
      completionDate: status === 'Completed' ? completionDate || toIsoDate(new Date()) : completionDate,
      githubUrl: githubUrl.trim(),
      liveUrl: liveUrl.trim(),
      notes: notes.trim(),
    };

    if (editingId) {
      updateProject(editingId, payload);
    } else {
      addProject(payload);
    }
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.projects.filter((p) => {
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !p.technologies.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (catFilter !== 'All' && p.category !== catFilter) return false;
      return true;
    });
  }, [state.projects, search, statusFilter, catFilter]);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs text-[#64748B]">Total Projects</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#1E293B]">
            {stats.total}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#FCE4EC]/55 p-5">
          <div className="text-xs text-[#9D174D]">Planned</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#9D174D]">
            {stats.Planned}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#DCEEFF]/55 p-5">
          <div className="text-xs text-[#0C4A6E]">In Progress</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#0C4A6E]">
            {stats['In Progress']}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#D1FAE5]/55 p-5">
          <div className="text-xs text-[#065F46]">Completed</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#065F46]">
            {stats.Completed}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h3 className="font-display text-base font-semibold text-[#1E293B] mb-3">
            Portfolio Status Breakdown
          </h3>
          <SimpleBarChart
            data={[
              { label: 'Planned', value: stats.Planned, color: '#F9A8D4' },
              { label: 'In Progress', value: stats['In Progress'], color: '#93C5FD' },
              { label: 'Completed', value: stats.Completed, color: '#6EE7B7' },
            ]}
            emptyText="Add engineering projects to visualize your portfolio status."
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-[#1E293B]">Engineering Portfolio</h3>
            <p className="mt-1 text-xs text-[#64748B]">
              Document architecture, stacks, timelines, GitHub repositories, and live links.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0369A1]"
          >
            <Plus className="h-4 w-4" />
            Add Project
          </button>
        </div>
      </section>

      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-[#1E293B]">
              {editingId ? 'Edit Project' : 'Add New Project'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs font-medium text-[#64748B] hover:text-[#1E293B]"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="proj-title" className="block text-xs font-medium text-[#64748B] mb-1">
                Project Title
              </label>
              <input
                id="proj-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="proj-desc" className="block text-xs font-medium text-[#64748B] mb-1">
                Description
              </label>
              <textarea
                id="proj-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              />
            </div>
            <div>
              <label htmlFor="proj-cat" className="block text-xs font-medium text-[#64748B] mb-1">
                Category
              </label>
              <select
                id="proj-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              >
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="proj-status" className="block text-xs font-medium text-[#64748B] mb-1">
                Status
              </label>
              <select
                id="proj-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="proj-tech" className="block text-xs font-medium text-[#64748B] mb-1">
                Technologies Used
              </label>
              <input
                id="proj-tech"
                type="text"
                placeholder="Python, SQLite, Plotly..."
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              />
            </div>
            <div>
              <label htmlFor="proj-start" className="block text-xs font-medium text-[#64748B] mb-1">
                Start Date
              </label>
              <input
                id="proj-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#1E293B]"
              />
            </div>
            <div>
              <label htmlFor="proj-target" className="block text-xs font-medium text-[#64748B] mb-1">
                Target Date
              </label>
              <input
                id="proj-target"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#1E293B]"
              />
            </div>
            <div>
              <label htmlFor="proj-comp" className="block text-xs font-medium text-[#64748B] mb-1">
                Completion Date (optional)
              </label>
              <input
                id="proj-comp"
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#1E293B]"
              />
            </div>
            <div>
              <label htmlFor="proj-gh" className="block text-xs font-medium text-[#64748B] mb-1">
                GitHub URL
              </label>
              <input
                id="proj-gh"
                type="url"
                placeholder="https://github.com/user/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              />
            </div>
            <div>
              <label htmlFor="proj-live" className="block text-xs font-medium text-[#64748B] mb-1">
                Live URL
              </label>
              <input
                id="proj-live"
                type="url"
                placeholder="https://project.example.com"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              />
            </div>
            <div>
              <label htmlFor="proj-notes" className="block text-xs font-medium text-[#64748B] mb-1">
                Notes
              </label>
              <input
                id="proj-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between gap-4">
              {error ? (
                <p role="alert" className="text-xs font-medium text-[#DC2626]">
                  {error}
                </p>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="rounded-xl bg-[#0284C7] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0369A1]"
              >
                {editingId ? 'Update Project' : 'Save Project'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Search & Filter */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              aria-label="Search projects"
              placeholder="Search title, technologies, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-9 pr-3 py-2 text-sm text-[#1E293B]"
            />
          </div>
          <select
            aria-label="Filter projects by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
          >
            <option value="All">All Statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter projects by category"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
          >
            <option value="All">All Categories</option>
            {PROJECT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Portfolio Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-[#64748B]">
          No projects match your filters.
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((proj) => {
            const pct = STATUS_PROGRESS[proj.status];
            return (
              <article key={proj.id} className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-display text-base font-semibold text-[#1E293B]">
                        {proj.title}
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[#64748B]">
                        <span>{proj.category}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold ${
                            proj.status === 'Completed'
                              ? 'text-[#059669]'
                              : proj.status === 'In Progress'
                              ? 'text-[#0284C7]'
                              : 'text-[#DB2777]'
                          }`}
                        >
                          {proj.status}
                        </span>
                        {proj.targetDate && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">Target {proj.targetDate}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(proj)}
                        aria-label={`Edit project '${proj.title}'`}
                        className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProject(proj.id)}
                        aria-label={`Delete project '${proj.title}'`}
                        className="rounded-lg p-1.5 text-[#64748B] hover:bg-rose-50 hover:text-[#DC2626]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {proj.description && (
                    <p className="mt-3 text-sm text-[#64748B]">{proj.description}</p>
                  )}

                  {proj.technologies && (
                    <div className="mt-3 text-xs text-[#1E293B]">
                      <span className="font-semibold text-[#64748B]">Stack: </span>
                      {proj.technologies}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F1F5F9]">
                      <div
                        className={`h-full rounded-full ${
                          proj.status === 'Completed'
                            ? 'bg-[#059669]'
                            : proj.status === 'In Progress'
                            ? 'bg-[#0284C7]'
                            : 'bg-[#F472B6]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums text-[#64748B]">
                      {pct}%
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs">
                  <div className="flex items-center gap-4">
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-[#1E293B] hover:text-[#0284C7]"
                      >
                        <Github className="h-3.5 w-3.5" />
                        GitHub
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-[#0284C7] hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Live Demo
                      </a>
                    )}
                    {!proj.githubUrl && !proj.liveUrl && (
                      <span className="text-[#64748B]">No links attached yet</span>
                    )}
                  </div>
                  {proj.completionDate && (
                    <span className="font-mono text-[#059669] tabular-nums">
                      Shipped {proj.completionDate}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
