/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Download, Menu } from 'lucide-react';
import { NAV_ITEMS, Sidebar } from './components/Sidebar';
import { AcademicsView } from './components/views/AcademicsView';
import { DailyTasksView } from './components/views/DailyTasksView';
import { DashboardView } from './components/views/DashboardView';
import { GoalsView } from './components/views/GoalsView';
import { PlacementView } from './components/views/PlacementView';
import { ProjectsView } from './components/views/ProjectsView';
import { RoadmapView } from './components/views/RoadmapView';
import { SettingsView } from './components/views/SettingsView';
import { SkillsView } from './components/views/SkillsView';
import { WeeklyPlannerView } from './components/views/WeeklyPlannerView';
import { usePlacePathStore } from './hooks/usePlacePathStore';
import type { PageId } from './types/placepath';

export default function App() {
  const store = usePlacePathStore();
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeNav = NAV_ITEMS.find((item) => item.id === activePage) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B]">
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        profile={store.state.profile}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="lg:pl-64 flex min-h-screen flex-col">
        {/* Clean SaaS Top Bar: contextual breadcrumb on left, 1 primary action on right */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-lg p-2 text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-[#64748B] whitespace-nowrap">PlacePath</span>
              <span className="hidden sm:inline text-slate-300" aria-hidden="true">
                /
              </span>
              <h1 className="font-display text-base font-bold tracking-tight text-[#1E293B] truncate">
                {activeNav.label}
              </h1>
            </div>
          </div>

          <a
            href="/PlacePath.zip"
            download="PlacePath.zip"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0284C7] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0369A1] whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download Python Project (.zip)</span>
            <span className="sm:hidden">Python .zip</span>
          </a>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {activePage === 'dashboard' && (
            <DashboardView store={store} onNavigate={setActivePage} />
          )}
          {activePage === 'academics' && <AcademicsView store={store} />}
          {activePage === 'goals' && <GoalsView store={store} />}
          {activePage === 'skills' && <SkillsView store={store} />}
          {activePage === 'projects' && <ProjectsView store={store} />}
          {activePage === 'roadmap' && <RoadmapView store={store} />}
          {activePage === 'placement' && <PlacementView store={store} />}
          {activePage === 'weekly' && <WeeklyPlannerView store={store} />}
          {activePage === 'daily' && <DailyTasksView store={store} />}
          {activePage === 'settings' && <SettingsView store={store} />}
        </main>
      </div>
    </div>
  );
}
