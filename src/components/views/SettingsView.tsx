import { useState } from 'react';
import { Code2, Database, Download, FileSpreadsheet, RotateCcw } from 'lucide-react';
import pythonFilesData from '../../data/pythonProjectFiles.json';
import type { PlacePathStore } from '../../hooks/usePlacePathStore';
import { recordsToCsv, toIsoDate } from '../../utils/calculations';
import { validateUrl } from '../../utils/validation';

interface PythonFileEntry {
  path: string;
  size: number;
  lines: number;
  content: string;
}

const PYTHON_FILES = pythonFilesData as PythonFileEntry[];

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function SettingsView({ store }: { store: PlacePathStore }) {
  const { state, updateProfile, resetAllData, loadSampleData } = store;

  const [draft, setDraft] = useState(state.profile);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  const [keepRoadmap, setKeepRoadmap] = useState(true);
  const [ackReset, setAckReset] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const [selectedPyFile, setSelectedPyFile] = useState<string>(PYTHON_FILES[0]?.path ?? '');
  const activePyEntry = PYTHON_FILES.find((f) => f.path === selectedPyFile) ?? PYTHON_FILES[0];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const gh = validateUrl(draft.githubUrl, 'GitHub URL');
    const li = validateUrl(draft.linkedinUrl, 'LinkedIn URL');
    if (!gh.valid) {
      setProfileErr(gh.error);
      setProfileMsg('');
      return;
    }
    if (!li.valid) {
      setProfileErr(li.error);
      setProfileMsg('');
      return;
    }
    updateProfile(draft);
    setProfileErr('');
    setProfileMsg('Student profile saved.');
  };

  const handleReset = () => {
    if (!ackReset || confirmText.trim() !== 'RESET PLACEPATH') {
      setResetMsg('Please check the confirmation box and type RESET PLACEPATH exactly.');
      return;
    }
    resetAllData(keepRoadmap);
    setAckReset(false);
    setConfirmText('');
    setResetMsg('All data has been reset cleanly.');
  };

  const today = toIsoDate(new Date());

  const exportSets = [
    { label: 'Semesters', filename: `placepath_semesters_${today}.csv`, data: state.semesters },
    { label: 'Goals', filename: `placepath_goals_${today}.csv`, data: state.goals },
    { label: 'Skills', filename: `placepath_skills_${today}.csv`, data: state.skills },
    { label: 'Projects', filename: `placepath_projects_${today}.csv`, data: state.projects },
    { label: 'Career Roadmap', filename: `placepath_roadmap_${today}.csv`, data: state.roadmap },
    { label: 'Placement Tasks', filename: `placepath_placement_${today}.csv`, data: state.placementTasks },
    { label: 'Company Applications', filename: `placepath_applications_${today}.csv`, data: state.applications },
    { label: 'Weekly Tasks', filename: `placepath_weekly_${today}.csv`, data: state.weeklyTasks },
    { label: 'Daily Tasks', filename: `placepath_daily_${today}.csv`, data: state.dailyTasks },
  ];

  return (
    <div className="space-y-6">
      {/* Complete Python + Streamlit + SQLite Project Package */}
      <section className="rounded-2xl border border-[#BAE6FD] bg-[#DCEEFF]/35 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0C4A6E]">
              Complete Local Python Project (Streamlit + SQLite + Plotly)
            </h2>
            <p className="mt-1 text-sm text-[#1E293B]">
              Download the complete {PYTHON_FILES.length}-file Python project with one-click launchers (
              <code className="font-mono text-xs">run.bat</code> &amp;{' '}
              <code className="font-mono text-xs">run.sh</code>), SQLite persistence, and unit tests.
            </p>
          </div>
          <a
            href="/PlacePath.zip"
            download="PlacePath.zip"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0369A1] whitespace-nowrap shrink-0"
          >
            <Download className="h-4 w-4" />
            Download PlacePath.zip
          </a>
        </div>

        {/* Source Inspector */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3 max-h-72 overflow-y-auto">
            <div className="mb-2 flex items-center gap-1.5 px-2 text-xs font-semibold text-[#64748B]">
              <Code2 className="h-3.5 w-3.5" />
              Project Files ({PYTHON_FILES.length})
            </div>
            <ul className="space-y-0.5">
              {PYTHON_FILES.map((file) => {
                const active = file.path === activePyEntry?.path;
                return (
                  <li key={file.path}>
                    <button
                      type="button"
                      onClick={() => setSelectedPyFile(file.path)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-mono text-xs transition-colors ${
                        active
                          ? 'bg-[#DCEEFF] font-semibold text-[#0C4A6E]'
                          : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                      }`}
                    >
                      <span className="truncate">{file.path}</span>
                      <span className="ml-2 shrink-0 text-[10px] opacity-75">{file.lines}L</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-[#0F172A] p-4 lg:col-span-2 flex flex-col max-h-72">
            <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-2 text-xs text-slate-300 font-mono">
              <span>{activePyEntry?.path}</span>
              <span>
                {activePyEntry?.lines} lines · {activePyEntry?.size} bytes
              </span>
            </div>
            <pre className="flex-1 overflow-auto font-mono text-xs leading-relaxed text-slate-200">
              <code>{activePyEntry?.content}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Student Profile Editing */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-display text-base font-semibold text-[#1E293B] mb-4">
          Student Profile &amp; College Information
        </h3>
        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="set-name" className="block text-xs font-medium text-[#64748B] mb-1">
              Full Name
            </label>
            <input
              id="set-name"
              type="text"
              value={draft.fullName}
              onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
            />
          </div>
          <div>
            <label htmlFor="set-email" className="block text-xs font-medium text-[#64748B] mb-1">
              Email
            </label>
            <input
              id="set-email"
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
            />
          </div>
          <div>
            <label htmlFor="set-college" className="block text-xs font-medium text-[#64748B] mb-1">
              College Name
            </label>
            <input
              id="set-college"
              type="text"
              value={draft.collegeName}
              onChange={(e) => setDraft({ ...draft, collegeName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
            />
          </div>
          <div>
            <label htmlFor="set-branch" className="block text-xs font-medium text-[#64748B] mb-1">
              Branch
            </label>
            <input
              id="set-branch"
              type="text"
              value={draft.branch}
              onChange={(e) => setDraft({ ...draft, branch: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
            />
          </div>
          <div>
            <label htmlFor="set-year" className="block text-xs font-medium text-[#64748B] mb-1">
              Current Year
            </label>
            <select
              id="set-year"
              value={draft.currentYear}
              onChange={(e) => setDraft({ ...draft, currentYear: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
            >
              {[1, 2, 3, 4].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="set-sem" className="block text-xs font-medium text-[#64748B] mb-1">
              Current Semester
            </label>
            <select
              id="set-sem"
              value={draft.currentSemester}
              onChange={(e) => setDraft({ ...draft, currentSemester: Number(e.target.value) })}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="set-role" className="block text-xs font-medium text-[#64748B] mb-1">
              Target Role
            </label>
            <input
              id="set-role"
              type="text"
              value={draft.targetRole}
              onChange={(e) => setDraft({ ...draft, targetRole: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
            />
          </div>
          <div>
            <label htmlFor="set-gh" className="block text-xs font-medium text-[#64748B] mb-1">
              GitHub URL
            </label>
            <input
              id="set-gh"
              type="url"
              value={draft.githubUrl}
              onChange={(e) => setDraft({ ...draft, githubUrl: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
            />
          </div>
          <div>
            <label htmlFor="set-li" className="block text-xs font-medium text-[#64748B] mb-1">
              LinkedIn URL
            </label>
            <input
              id="set-li"
              type="url"
              value={draft.linkedinUrl}
              onChange={(e) => setDraft({ ...draft, linkedinUrl: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between">
            <div>
              {profileErr && (
                <p role="alert" className="text-xs font-medium text-[#DC2626]">
                  {profileErr}
                </p>
              )}
              {profileMsg && (
                <p role="status" className="text-xs font-medium text-[#059669]">
                  {profileMsg}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[#0284C7] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0369A1]"
            >
              Save Profile Settings
            </button>
          </div>
        </form>
      </section>

      {/* Exports & Backup + Reset */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="h-4 w-4 text-[#0284C7]" />
            <h3 className="font-display text-base font-semibold text-[#1E293B]">
              CSV Exports &amp; Database Backup
            </h3>
          </div>
          <p className="text-xs text-[#64748B] mb-4">
            Export any module to CSV or download a full backup snapshot of your workspace.
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {exportSets.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() =>
                  triggerDownload(
                    recordsToCsv(item.data as unknown as Record<string, unknown>[]),
                    item.filename,
                    'text/csv;charset=utf-8;'
                  )
                }
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-xs font-medium text-[#1E293B] hover:bg-[#DCEEFF]/50"
              >
                <span>{item.label}</span>
                <span className="font-mono text-[#64748B] tabular-nums">{item.data.length}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                triggerDownload(
                  JSON.stringify(state, null, 2),
                  `placepath_backup_${today}.json`,
                  'application/json'
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E293B] px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Database className="h-3.5 w-3.5" />
              Download Workspace Backup (.json)
            </button>
            <button
              type="button"
              onClick={loadSampleData}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#1E293B] hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore Sample Dataset
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-white p-6">
          <h3 className="font-display text-base font-semibold text-[#9D174D] mb-1">
            Reset Application Data
          </h3>
          <p className="text-xs text-[#64748B] mb-4">
            Permanently clears all semesters, goals, skills, projects, placement records, and tasks.
            Explicit confirmation is required.
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs text-[#1E293B]">
              <input
                type="checkbox"
                checked={keepRoadmap}
                onChange={(e) => setKeepRoadmap(e.target.checked)}
                className="h-4 w-4 rounded accent-[#0284C7]"
              />
              Keep default 4-year Career Roadmap milestones
            </label>
            <label className="flex items-center gap-2 text-xs text-[#1E293B]">
              <input
                type="checkbox"
                checked={ackReset}
                onChange={(e) => setAckReset(e.target.checked)}
                className="h-4 w-4 rounded accent-[#DC2626]"
              />
              I understand this action cannot be undone.
            </label>
            <div>
              <label htmlFor="reset-phrase" className="block text-xs font-medium text-[#64748B] mb-1">
                Type RESET PLACEPATH to confirm
              </label>
              <input
                id="reset-phrase"
                type="text"
                placeholder="RESET PLACEPATH"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#1E293B]"
              />
            </div>

            {resetMsg && (
              <p role="status" className="text-xs font-medium text-[#DC2626]">
                {resetMsg}
              </p>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-semibold text-[#DC2626] hover:bg-rose-100"
            >
              Reset All Data
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
