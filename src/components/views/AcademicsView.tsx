import { useState } from 'react';
import { CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import type { PlacePathStore } from '../../hooks/usePlacePathStore';
import type { SemesterRecord, SemesterStatus } from '../../types/placepath';
import { calculateWeightedCGPA } from '../../utils/calculations';
import { validateCredits, validateSgpa } from '../../utils/validation';
import { SgpaLineChart, StackedBarChart } from '../Charts';

const STATUSES: SemesterStatus[] = ['Planned', 'In Progress', 'Completed'];

export function AcademicsView({ store }: { store: PlacePathStore }) {
  const { state, addSemester, updateSemester, deleteSemester } = store;
  const cgpa = calculateWeightedCGPA(state.semesters);

  const existingNumbers = new Set(state.semesters.map((s) => s.semesterNumber));
  const availableNumbers = [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => !existingNumbers.has(n));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(state.semesters.length === 0);
  const [semesterNumber, setSemesterNumber] = useState<number>(availableNumbers[0] ?? 1);
  const [sgpaInput, setSgpaInput] = useState<string>('8.80');
  const [totalCreditsInput, setTotalCreditsInput] = useState<string>('22');
  const [completedCreditsInput, setCompletedCreditsInput] = useState<string>('22');
  const [status, setStatus] = useState<SemesterStatus>('Completed');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const openCreateForm = () => {
    setEditingId(null);
    setSemesterNumber(availableNumbers[0] ?? 1);
    setSgpaInput('8.80');
    setTotalCreditsInput('22');
    setCompletedCreditsInput('22');
    setStatus('Completed');
    setNotes('');
    setError('');
    setShowForm(true);
  };

  const openEditForm = (sem: SemesterRecord) => {
    setEditingId(sem.id);
    setSemesterNumber(sem.semesterNumber);
    setSgpaInput(sem.sgpa !== null ? String(sem.sgpa) : '');
    setTotalCreditsInput(sem.totalCredits !== null ? String(sem.totalCredits) : '');
    setCompletedCreditsInput(sem.completedCredits !== null ? String(sem.completedCredits) : '');
    setStatus(sem.status);
    setNotes(sem.notes);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSgpa = sgpaInput.trim() === '' ? null : Number(sgpaInput);
    const parsedTotal = totalCreditsInput.trim() === '' ? null : Number(totalCreditsInput);
    const parsedComp = completedCreditsInput.trim() === '' ? null : Number(completedCreditsInput);

    if (
      (parsedSgpa !== null && Number.isNaN(parsedSgpa)) ||
      (parsedTotal !== null && Number.isNaN(parsedTotal)) ||
      (parsedComp !== null && Number.isNaN(parsedComp))
    ) {
      setError('SGPA and credit values must be valid numbers.');
      return;
    }

    const sgpaCheck = validateSgpa(parsedSgpa, status);
    if (!sgpaCheck.valid) {
      setError(sgpaCheck.error);
      return;
    }
    const creditCheck = validateCredits(parsedTotal, parsedComp);
    if (!creditCheck.valid) {
      setError(creditCheck.error);
      return;
    }

    const payload: Omit<SemesterRecord, 'id'> = {
      semesterNumber,
      sgpa: parsedSgpa,
      totalCredits: parsedTotal,
      completedCredits: parsedComp,
      status,
      notes: notes.trim(),
    };

    if (editingId) {
      updateSemester(editingId, payload);
    } else {
      addSemester(payload);
    }
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const sgpaData = state.semesters
    .filter((s) => s.sgpa !== null)
    .map((s) => ({ label: `Sem ${s.semesterNumber}`, value: s.sgpa as number }));

  const creditChartData = state.semesters.map((s) => ({
    label: `Sem ${s.semesterNumber}`,
    primary: s.completedCredits ?? 0,
    secondary: Math.max(0, (s.totalCredits ?? 0) - (s.completedCredits ?? 0)),
  }));

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-[#DCEEFF]/55 p-5">
          <div className="text-xs font-medium text-[#64748B]">Weighted CGPA</div>
          <div
            data-testid="academics-cgpa"
            className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#0C4A6E]"
          >
            {cgpa.cgpa !== null ? cgpa.cgpa.toFixed(2) : 'Incomplete'}
          </div>
          <div className="mt-1 text-xs text-[#64748B]">{cgpa.statusMessage}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-[#64748B]">Completed Semesters</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#1E293B]">
            {cgpa.completedSemesters} / 8
          </div>
          <div className="mt-1 text-xs text-[#64748B]">
            {Math.round((cgpa.completedSemesters / 8) * 100)}% curriculum finished
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-[#64748B]">Credits Completed</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#059669]">
            {cgpa.totalCompletedCredits}
          </div>
          <div className="mt-1 text-xs text-[#64748B]">
            Out of {cgpa.totalPlannedCredits} recorded credits
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#FCE4EC]/50 p-5 flex flex-col justify-between">
          <div className="text-xs font-medium text-[#9D174D]">Formula Verification</div>
          <div className="mt-1 text-xs text-[#64748B]">
            Sum(SGPA × Credits) / Sum(Credits) across completed semesters only.
          </div>
          {availableNumbers.length > 0 && (
            <button
              type="button"
              onClick={openCreateForm}
              className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1E293B] px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Semester
            </button>
          )}
        </div>
      </section>

      {!cgpa.isComplete && state.semesters.length > 0 && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {cgpa.statusMessage}
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-[#1E293B]">
              {editingId ? `Edit Semester ${semesterNumber}` : 'Add Semester Record'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="text-xs font-medium text-[#64748B] hover:text-[#1E293B]"
            >
              Close
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label htmlFor="sem-number" className="block text-xs font-medium text-[#64748B] mb-1">
                Semester (1–8)
              </label>
              <select
                id="sem-number"
                disabled={Boolean(editingId)}
                value={semesterNumber}
                onChange={(e) => setSemesterNumber(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B] disabled:opacity-60"
              >
                {(editingId ? [semesterNumber] : availableNumbers).map((n) => (
                  <option key={n} value={n}>
                    Semester {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sem-status" className="block text-xs font-medium text-[#64748B] mb-1">
                Status
              </label>
              <select
                id="sem-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as SemesterStatus)}
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
              <label htmlFor="sem-sgpa" className="block text-xs font-medium text-[#64748B] mb-1">
                SGPA (0–10)
              </label>
              <input
                id="sem-sgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 9.10"
                value={sgpaInput}
                onChange={(e) => setSgpaInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#1E293B]"
              />
            </div>
            <div>
              <label htmlFor="sem-total-cr" className="block text-xs font-medium text-[#64748B] mb-1">
                Total Credits
              </label>
              <input
                id="sem-total-cr"
                type="number"
                step="0.5"
                min="0"
                placeholder="e.g. 22"
                value={totalCreditsInput}
                onChange={(e) => setTotalCreditsInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#1E293B]"
              />
            </div>
            <div>
              <label htmlFor="sem-comp-cr" className="block text-xs font-medium text-[#64748B] mb-1">
                Completed Credits
              </label>
              <input
                id="sem-comp-cr"
                type="number"
                step="0.5"
                min="0"
                placeholder="e.g. 22"
                value={completedCreditsInput}
                onChange={(e) => setCompletedCreditsInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#1E293B]"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label htmlFor="sem-notes" className="block text-xs font-medium text-[#64748B] mb-1">
                Notes
              </label>
              <input
                id="sem-notes"
                type="text"
                placeholder="Courses, honors, or exam highlights..."
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
                {editingId ? 'Update Semester' : 'Save Semester'}
              </button>
            </div>
            {error && (
              <p role="alert" className="sm:col-span-2 lg:col-span-5 text-xs font-medium text-[#DC2626]">
                {error}
              </p>
            )}
          </form>
        </section>
      )}

      {/* Charts */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-base font-semibold text-[#1E293B] mb-1">
            Semester-wise SGPA Trend
          </h3>
          <p className="text-xs text-[#64748B] mb-4">
            Dashed green line shows weighted CGPA benchmark
          </p>
          <SgpaLineChart data={sgpaData} cgpaReference={cgpa.cgpa} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-base font-semibold text-[#1E293B] mb-1">
            Credit Completion by Semester
          </h3>
          <p className="text-xs text-[#64748B] mb-4">
            Completed vs remaining credits across recorded semesters
          </p>
          <StackedBarChart
            data={creditChartData}
            primaryLabel="Completed Credits"
            secondaryLabel="Remaining Credits"
            primaryColor="#93C5FD"
            secondaryColor="#FBCFE8"
            emptyText="Add semester records to inspect credit distribution."
          />
        </div>
      </section>

      {/* Academic History Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-[#1E293B]">
            Academic History (Semesters 1–8)
          </h3>
          {availableNumbers.length > 0 && !showForm && (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#DCEEFF] px-3.5 py-2 text-xs font-semibold text-[#0C4A6E] hover:bg-[#BAE6FD]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Semester
            </button>
          )}
        </div>

        {state.semesters.length === 0 ? (
          <div className="rounded-xl bg-[#F8FAFC] px-4 py-10 text-center text-sm text-[#64748B]">
            No semesters recorded yet. Add your first semester to calculate CGPA.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-medium text-[#64748B]">
                  <th className="py-2.5 pr-4">Semester</th>
                  <th className="py-2.5 px-4 text-right">SGPA</th>
                  <th className="py-2.5 px-4 text-right">Credits</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Notes</th>
                  <th className="py-2.5 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.semesters.map((sem) => (
                  <tr key={sem.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 pr-4 font-semibold text-[#1E293B] whitespace-nowrap">
                      Semester {sem.semesterNumber}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#1E293B]">
                      {sem.sgpa !== null ? sem.sgpa.toFixed(2) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-[#64748B]">
                      {sem.completedCredits !== null ? sem.completedCredits : 'Missing'} /{' '}
                      {sem.totalCredits !== null ? sem.totalCredits : 'Missing'}
                    </td>
                    <td
                      className={`py-3 px-4 text-xs font-semibold whitespace-nowrap ${
                        sem.status === 'Completed'
                          ? 'text-[#059669]'
                          : sem.status === 'In Progress'
                          ? 'text-[#0284C7]'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {sem.status}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#64748B] max-w-xs truncate">
                      {sem.notes || '—'}
                    </td>
                    <td className="py-3 pl-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {sem.status !== 'Completed' && sem.sgpa !== null && (
                          <button
                            type="button"
                            onClick={() =>
                              updateSemester(sem.id, {
                                ...sem,
                                status: 'Completed',
                                completedCredits: sem.completedCredits ?? sem.totalCredits,
                              })
                            }
                            aria-label={`Mark Semester ${sem.semesterNumber} completed`}
                            title="Mark Completed"
                            className="rounded-lg p-1.5 text-[#059669] hover:bg-[#D1FAE5]/60"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditForm(sem)}
                          aria-label={`Edit Semester ${sem.semesterNumber}`}
                          className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSemester(sem.id)}
                          aria-label={`Delete Semester ${sem.semesterNumber}`}
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
  );
}
