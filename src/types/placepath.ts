export type PageId =
  | 'dashboard'
  | 'academics'
  | 'goals'
  | 'skills'
  | 'projects'
  | 'roadmap'
  | 'placement'
  | 'weekly'
  | 'daily'
  | 'settings';

export interface StudentProfile {
  fullName: string;
  email: string;
  collegeName: string;
  branch: string;
  currentYear: number;
  currentSemester: number;
  targetRole: string;
  githubUrl: string;
  linkedinUrl: string;
}

export type SemesterStatus = 'Planned' | 'In Progress' | 'Completed';

export interface SemesterRecord {
  id: string;
  semesterNumber: number;
  sgpa: number | null;
  totalCredits: number | null;
  completedCredits: number | null;
  status: SemesterStatus;
  notes: string;
}

export type GoalCategory = 'Academic' | 'Technical' | 'Career' | 'Personal';
export type PriorityLevel = 'Low' | 'Medium' | 'High';
export type GoalStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface GoalRecord {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  priority: PriorityLevel;
  createdDate: string;
  targetDate: string;
  status: GoalStatus;
  progress: number;
}

export type SkillCategory =
  | 'Programming'
  | 'Web Development'
  | 'Database'
  | 'Data Science'
  | 'AI/ML'
  | 'Tools'
  | 'Computer Science Fundamentals'
  | 'Other';

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface SkillRecord {
  id: string;
  name: string;
  category: SkillCategory;
  proficiency: ProficiencyLevel;
  dateAdded: string;
  notes: string;
}

export type ProjectStatus = 'Planned' | 'In Progress' | 'Completed';

export interface ProjectRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  technologies: string;
  status: ProjectStatus;
  startDate: string;
  targetDate: string;
  completionDate: string;
  githubUrl: string;
  liveUrl: string;
  notes: string;
}

export interface RoadmapMilestone {
  id: string;
  year: 1 | 2 | 3 | 4;
  phase: string;
  title: string;
  description: string;
  deadline: string;
  completed: boolean;
  notes: string;
  isCustom: boolean;
}

export type PlacementCategory =
  | 'Aptitude'
  | 'DSA'
  | 'Coding'
  | 'Technical Interview'
  | 'HR Interview'
  | 'Resume'
  | 'Communication';

export type PlacementTaskStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface PlacementTask {
  id: string;
  taskName: string;
  category: PlacementCategory;
  description: string;
  targetDate: string;
  status: PlacementTaskStatus;
  notes: string;
}

export type ApplicationStatus =
  | 'Interested'
  | 'Applied'
  | 'Assessment'
  | 'Interview'
  | 'Offer'
  | 'Rejected';

export interface CompanyApplication {
  id: string;
  companyName: string;
  jobRole: string;
  applicationDate: string;
  jobDescription: string;
  applicationLink: string;
  status: ApplicationStatus;
  notes: string;
}

export type PlannerCategory =
  | 'College'
  | 'Coding'
  | 'DSA'
  | 'Project'
  | 'Placement'
  | 'Personal';

export type TaskStatus = 'Pending' | 'Completed';

export interface WeeklyTask {
  id: string;
  taskName: string;
  category: PlannerCategory;
  taskDate: string;
  priority: PriorityLevel;
  status: TaskStatus;
  notes: string;
}

export interface DailyTask {
  id: string;
  taskName: string;
  taskDate: string;
  category: PlannerCategory;
  priority: PriorityLevel;
  status: TaskStatus;
}

export interface PlacePathState {
  profile: StudentProfile;
  semesters: SemesterRecord[];
  goals: GoalRecord[];
  skills: SkillRecord[];
  projects: ProjectRecord[];
  roadmap: RoadmapMilestone[];
  placementTasks: PlacementTask[];
  applications: CompanyApplication[];
  weeklyTasks: WeeklyTask[];
  dailyTasks: DailyTask[];
}
