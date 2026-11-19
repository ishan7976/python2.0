import {
  Briefcase,
  CalendarDays,
  CheckSquare,
  Code2,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Map,
  Settings,
  Target,
  X,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { PageId, StudentProfile } from '../types/placepath';

export interface NavItem {
  id: PageId;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'academics', label: 'Academics', icon: GraduationCap },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'skills', label: 'Skills', icon: Code2 },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'roadmap', label: 'Career Roadmap', icon: Map },
  { id: 'placement', label: 'Placement Preparation', icon: Briefcase },
  { id: 'weekly', label: 'Weekly Planner', icon: CalendarDays },
  { id: 'daily', label: 'Daily Tasks', icon: CheckSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  profile: StudentProfile;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activePage,
  onSelectPage,
  profile,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const content = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#DCEEFF] text-[#0369A1]">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-base font-bold tracking-tight text-[#1E293B]">
              PlacePath
            </div>
            <p className="text-[11px] leading-snug text-[#64748B]">
              Build Your Path. Achieve Your Goals.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="rounded-lg p-1.5 text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B] lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary navigation">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPage(item.id);
                    onCloseMobile();
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#DCEEFF] text-[#0C4A6E]'
                      : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? 'text-[#0284C7]' : 'text-[#64748B]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="rounded-xl bg-[#FCE4EC]/60 px-3.5 py-3">
          <div className="text-xs font-semibold text-[#9D174D] truncate">
            {profile.fullName || 'Engineering Student'}
          </div>
          <div className="mt-0.5 text-[11px] text-[#64748B] truncate">
            Year {profile.currentYear} · Semester {profile.currentSemester}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/35 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw]">{content}</aside>
        </div>
      )}
    </>
  );
}
