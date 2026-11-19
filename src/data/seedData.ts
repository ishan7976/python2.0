import type { PlacePathState, RoadmapMilestone } from '../types/placepath';
import { addDaysIso, toIsoDate } from '../utils/calculations';

export const YEAR_PHASES: Record<1 | 2 | 3 | 4, string> = {
  1: 'Foundations',
  2: 'Development',
  3: 'Professional Growth',
  4: 'Placement and Career',
};

export function createDefaultRoadmap(todayIso: string): RoadmapMilestone[] {
  const raw: Array<{
    year: 1 | 2 | 3 | 4;
    title: string;
    description: string;
    completed?: boolean;
    deadlineOffset?: number;
  }> = [
    // Year 1 — Foundations
    { year: 1, title: 'Learn programming fundamentals', description: 'Master variables, control flow, functions, recursion, and debugging.', completed: true },
    { year: 1, title: 'Learn Python or C++', description: 'Build fluency in a primary engineering language and standard libraries.', completed: true },
    { year: 1, title: 'Understand basic problem solving', description: 'Solve 100+ beginner logic, math, and array problems systematically.', completed: true },
    { year: 1, title: 'Learn Git and GitHub', description: 'Practice branching, commits, pull requests, and repository documentation.', completed: true },
    { year: 1, title: 'Understand computer fundamentals', description: 'Grasp binary logic, memory model, operating basics, and CLI workflows.', completed: true },
    { year: 1, title: 'Complete beginner projects', description: 'Ship 2–3 small CLI or utility projects with READMEs on GitHub.', completed: true },
    // Year 2 — Development
    { year: 2, title: 'Learn Data Structures and Algorithms', description: 'Study arrays, linked lists, stacks, queues, trees, graphs, and sorting.', completed: true },
    { year: 2, title: 'Learn HTML and CSS', description: 'Build semantic, responsive layouts and accessible web interfaces.', completed: true },
    { year: 2, title: 'Learn JavaScript', description: 'Understand DOM manipulation, async workflows, APIs, and modern ES6+.', completed: true },
    { year: 2, title: 'Learn databases', description: 'Master relational design, SQL queries, joins, indexing, and SQLite/PostgreSQL.', completed: true },
    { year: 2, title: 'Build web development projects', description: 'Develop full-stack applications with persistent storage and clean architecture.', completed: true },
    { year: 2, title: 'Create a GitHub portfolio', description: 'Pin best repositories with screenshots, live links, and architecture notes.', completed: true },
    { year: 2, title: 'Start technical practice', description: 'Maintain a consistent weekly coding problem streak on practice platforms.', completed: true },
    // Year 3 — Professional Growth
    { year: 3, title: 'Advanced DSA', description: 'Master dynamic programming, graph algorithms, tries, and segment trees.', completed: true },
    { year: 3, title: 'Build advanced projects', description: 'Ship production-grade systems with tests, analytics, and deployment.', completed: true },
    { year: 3, title: 'Explore specialization', description: 'Dive deep into AI/ML, Systems, Cloud, Security, or Full-Stack Engineering.', completed: false, deadlineOffset: 18 },
    { year: 3, title: 'Internship preparation', description: 'Target summer engineering internships and tailor portfolio artifacts.', completed: false, deadlineOffset: 12 },
    { year: 3, title: 'Open-source contributions', description: 'Contribute bug fixes, docs, or features to established open-source repos.', completed: false, deadlineOffset: 28 },
    { year: 3, title: 'Resume preparation', description: 'Draft a crisp 1-page ATS-friendly engineering resume with measurable impact.', completed: true },
    { year: 3, title: 'Technical interview preparation', description: 'Review OS, DBMS, Computer Networks, OOP, and system design basics.', completed: false, deadlineOffset: 22 },
    // Year 4 — Placement and Career
    { year: 4, title: 'Aptitude preparation', description: 'Practice quantitative reasoning, logical puzzles, and verbal assessments.', completed: false },
    { year: 4, title: 'Advanced coding practice', description: 'Simulate timed online assessments with medium-to-hard DSA problems.', completed: false },
    { year: 4, title: 'Resume optimization', description: 'Refine project bullets, metrics, and role alignment after mentor reviews.', completed: false },
    { year: 4, title: 'Mock interviews', description: 'Complete peer and mentor mock technical & behavioral interviews.', completed: false },
    { year: 4, title: 'Company applications', description: 'Track target companies, referrals, deadlines, and assessment stages.', completed: false },
    { year: 4, title: 'Internship and placement preparation', description: 'Consolidate company-specific question banks and project deep-dives.', completed: false },
    { year: 4, title: 'Interview preparation', description: 'Prepare STAR behavioral stories, architecture explanations, and HR Q&A.', completed: false },
  ];

  return raw.map((item, idx) => ({
    id: `rm-${idx + 1}`,
    year: item.year,
    phase: YEAR_PHASES[item.year],
    title: item.title,
    description: item.description,
    deadline: item.deadlineOffset !== undefined ? addDaysIso(todayIso, item.deadlineOffset) : '',
    completed: Boolean(item.completed),
    notes: '',
    isCustom: false,
  }));
}

export function createSeedState(referenceDate = new Date()): PlacePathState {
  const today = toIsoDate(referenceDate);

  return {
    profile: {
      fullName: 'Ananya Verma',
      email: 'ananya.verma@engcollege.edu',
      collegeName: 'National Institute of Technology',
      branch: 'Computer Science & Engineering',
      currentYear: 3,
      currentSemester: 6,
      targetRole: 'Software Development Engineer',
      githubUrl: 'https://github.com/ananyaverma-dev',
      linkedinUrl: 'https://linkedin.com/in/ananyaverma-cse',
    },
    semesters: [
      { id: 'sem-1', semesterNumber: 1, sgpa: 8.45, totalCredits: 20, completedCredits: 20, status: 'Completed', notes: 'Strong foundation in Calculus, Physics, and C Programming.' },
      { id: 'sem-2', semesterNumber: 2, sgpa: 8.72, totalCredits: 21, completedCredits: 21, status: 'Completed', notes: 'Top 10% in Data Structures lab and Digital Logic.' },
      { id: 'sem-3', semesterNumber: 3, sgpa: 8.95, totalCredits: 22, completedCredits: 22, status: 'Completed', notes: 'Completed OOP, Discrete Math, and Computer Architecture.' },
      { id: 'sem-4', semesterNumber: 4, sgpa: 9.12, totalCredits: 23, completedCredits: 23, status: 'Completed', notes: 'A+ in Operating Systems and Database Management Systems.' },
      { id: 'sem-5', semesterNumber: 5, sgpa: 9.28, totalCredits: 22, completedCredits: 22, status: 'Completed', notes: 'Computer Networks, Compiler Design, and Machine Learning elective.' },
      { id: 'sem-6', semesterNumber: 6, sgpa: null, totalCredits: 22, completedCredits: 12, status: 'In Progress', notes: 'Distributed Systems, Software Engineering, and Cloud Computing.' },
    ],
    goals: [
      {
        id: 'goal-1',
        title: 'Complete 150 Curated DSA Problems',
        description: 'Cover graphs, dynamic programming, trees, and sliding window patterns with written complexity notes.',
        category: 'Technical',
        priority: 'High',
        createdDate: addDaysIso(today, -35),
        targetDate: addDaysIso(today, 14),
        status: 'In Progress',
        progress: 72,
      },
      {
        id: 'goal-2',
        title: 'Maintain 9.0+ SGPA in Semester 6',
        description: 'Score 90%+ in Distributed Systems and Cloud Computing midterms and final project.',
        category: 'Academic',
        priority: 'High',
        createdDate: addDaysIso(today, -40),
        targetDate: addDaysIso(today, 25),
        status: 'In Progress',
        progress: 65,
      },
      {
        id: 'goal-3',
        title: 'Finalize Summer SWE Internship Applications',
        description: 'Submit tailored resume and referral outreach to 12 product engineering teams.',
        category: 'Career',
        priority: 'High',
        createdDate: addDaysIso(today, -20),
        targetDate: addDaysIso(today, -2),
        status: 'In Progress',
        progress: 80,
      },
      {
        id: 'goal-4',
        title: 'Publish Open-Source SQLite CLI Tool',
        description: 'Ship v1.0 with automated test suite, docs, and PyPI package.',
        category: 'Technical',
        priority: 'Medium',
        createdDate: addDaysIso(today, -50),
        targetDate: addDaysIso(today, -10),
        status: 'Completed',
        progress: 100,
      },
      {
        id: 'goal-5',
        title: 'Read 20 Pages Daily Before Sleep',
        description: 'Build a sustainable evening reading routine away from screens.',
        category: 'Personal',
        priority: 'Low',
        createdDate: addDaysIso(today, -15),
        targetDate: addDaysIso(today, 20),
        status: 'Not Started',
        progress: 15,
      },
    ],
    skills: [
      { id: 'sk-1', name: 'Python', category: 'Programming', proficiency: 'Advanced', dateAdded: addDaysIso(today, -180), notes: 'Primary language for automation, Streamlit dashboards, and DSA.' },
      { id: 'sk-2', name: 'SQL & SQLite', category: 'Database', proficiency: 'Advanced', dateAdded: addDaysIso(today, -140), notes: 'Schema modeling, indexing, joins, and query optimization.' },
      { id: 'sk-3', name: 'Data Structures & Algorithms', category: 'Computer Science Fundamentals', proficiency: 'Intermediate', dateAdded: addDaysIso(today, -120), notes: 'Strong in trees/graphs; refining DP state transitions.' },
      { id: 'sk-4', name: 'TypeScript & React', category: 'Web Development', proficiency: 'Intermediate', dateAdded: addDaysIso(today, -95), notes: 'Built 3 responsive portfolio interfaces.' },
      { id: 'sk-5', name: 'Pandas & Plotly', category: 'Data Science', proficiency: 'Advanced', dateAdded: addDaysIso(today, -90), notes: 'Interactive analytics pipelines and academic visualizations.' },
      { id: 'sk-6', name: 'Git & Linux CLI', category: 'Tools', proficiency: 'Advanced', dateAdded: addDaysIso(today, -210), notes: 'Daily workflow, shell scripting, and rebase hygiene.' },
      { id: 'sk-7', name: 'Scikit-Learn & PyTorch', category: 'AI/ML', proficiency: 'Beginner', dateAdded: addDaysIso(today, -45), notes: 'Semester 5 ML elective projects and feature engineering.' },
      { id: 'sk-8', name: 'Operating Systems & DBMS', category: 'Computer Science Fundamentals', proficiency: 'Intermediate', dateAdded: addDaysIso(today, -60), notes: 'Concurrency, scheduling, ACID transactions, and B+ trees.' },
    ],
    projects: [
      {
        id: 'proj-1',
        title: 'PlacePath Command Center',
        description: 'Local-first Python + Streamlit + SQLite academic and placement management suite with interactive Plotly analytics.',
        category: 'Web Development',
        technologies: 'Python, Streamlit, SQLite, Plotly, Pandas',
        status: 'Completed',
        startDate: addDaysIso(today, -65),
        targetDate: addDaysIso(today, -5),
        completionDate: addDaysIso(today, -7),
        githubUrl: 'https://github.com/ananyaverma-dev/placepath',
        liveUrl: 'https://placepath-demo.streamlit.app',
        notes: 'Featured in resume top project slot with 10-table schema.',
      },
      {
        id: 'proj-2',
        title: 'Distributed Log Indexer',
        description: 'High-throughput log ingestion and full-text query engine with inverted index compaction and latency benchmarks.',
        category: 'Systems',
        technologies: 'Python, Go, SQLite, Docker',
        status: 'In Progress',
        startDate: addDaysIso(today, -28),
        targetDate: addDaysIso(today, 16),
        completionDate: '',
        githubUrl: 'https://github.com/ananyaverma-dev/log-indexer',
        liveUrl: '',
        notes: 'Need to finish benchmark report and p99 latency charts.',
      },
      {
        id: 'proj-3',
        title: 'Campus Placement Insights ML',
        description: 'Predict skill-to-role readiness and highlight high-ROI interview topics from anonymized placement drives.',
        category: 'AI/ML',
        technologies: 'Python, Pandas, Scikit-Learn, Plotly',
        status: 'Planned',
        startDate: addDaysIso(today, 10),
        targetDate: addDaysIso(today, 55),
        completionDate: '',
        githubUrl: '',
        liveUrl: '',
        notes: 'Collect historical curriculum and interview topic dataset first.',
      },
    ],
    roadmap: createDefaultRoadmap(today),
    placementTasks: [
      { id: 'pt-1', taskName: 'Graph Algorithms & Shortest Paths Sheet', category: 'DSA', description: 'Solve Dijkstra, Bellman-Ford, topological sort, and union-find problems.', targetDate: addDaysIso(today, 5), status: 'In Progress', notes: '18/25 completed' },
      { id: 'pt-2', taskName: '1-Page ATS Engineering Resume Review', category: 'Resume', description: 'Quantify project impact metrics and review with 2 seniors.', targetDate: addDaysIso(today, -1), status: 'Completed', notes: 'Updated v3 PDF ready' },
      { id: 'pt-3', taskName: 'OS & DBMS Core Interview Revision', category: 'Technical Interview', description: 'Review deadlocks, virtual memory, indexing, and isolation levels.', targetDate: addDaysIso(today, 9), status: 'In Progress', notes: 'Focus on MVCC and locking' },
      { id: 'pt-4', taskName: 'Timed Quantitative & Logical Aptitude Mock #2', category: 'Aptitude', description: 'Complete 45-minute probability, permutation, and reasoning drill.', targetDate: addDaysIso(today, 7), status: 'Not Started', notes: '' },
      { id: 'pt-5', taskName: 'STAR Behavioral Story Bank', category: 'HR Interview', description: 'Write 6 crisp stories covering ownership, conflict, and ambiguity.', targetDate: addDaysIso(today, 15), status: 'Completed', notes: 'Practiced with peer mentor' },
      { id: 'pt-6', taskName: 'Timed Weekly Contest Simulation', category: 'Coding', description: 'Solve 4 unseen algorithmic problems in 90 minutes.', targetDate: addDaysIso(today, 3), status: 'Not Started', notes: 'Weekend drill' },
    ],
    applications: [
      {
        id: 'app-1',
        companyName: 'Atlassian',
        jobRole: 'Software Engineer Intern',
        applicationDate: addDaysIso(today, -14),
        jobDescription: 'Backend & platform engineering internship on Jira Cloud services.',
        applicationLink: 'https://www.atlassian.com/company/careers',
        status: 'Interview',
        notes: 'Cleared HackerRank OA; technical round scheduled next week.',
      },
      {
        id: 'app-2',
        companyName: 'Stripe',
        jobRole: 'SWE Intern — Core Payments',
        applicationDate: addDaysIso(today, -9),
        jobDescription: 'Build reliable payment APIs, reconciliation pipelines, and tests.',
        applicationLink: 'https://stripe.com/jobs',
        status: 'Assessment',
        notes: 'Practical debugging + API integration OA due in 4 days.',
      },
      {
        id: 'app-3',
        companyName: 'Microsoft',
        jobRole: 'Software Engineering Intern',
        applicationDate: addDaysIso(today, -18),
        jobDescription: 'Azure Developer Experience engineering team.',
        applicationLink: 'https://careers.microsoft.com',
        status: 'Applied',
        notes: 'Applied with alumni referral.',
      },
      {
        id: 'app-4',
        companyName: 'Datadog',
        jobRole: 'Systems Engineering Intern',
        applicationDate: addDaysIso(today, -3),
        jobDescription: 'Distributed telemetry ingestion and query indexing.',
        applicationLink: 'https://careers.datadoghq.com',
        status: 'Interested',
        notes: 'Finalize Distributed Log Indexer README before submitting.',
      },
    ],
    weeklyTasks: [
      { id: 'wk-1', taskName: 'Complete Distributed Systems Raft Lab', category: 'College', taskDate: addDaysIso(today, -2), priority: 'High', status: 'Completed', notes: 'Submitted report on LMS' },
      { id: 'wk-2', taskName: 'Solve 10 Dynamic Programming Mediums', category: 'DSA', taskDate: addDaysIso(today, -1), priority: 'High', status: 'Completed', notes: 'Knapsack & subsequence patterns' },
      { id: 'wk-3', taskName: 'Benchmark Log Indexer Compaction', category: 'Project', taskDate: today, priority: 'High', status: 'Pending', notes: 'Run 1M log line benchmark' },
      { id: 'wk-4', taskName: 'Mock Technical Interview with Peer', category: 'Placement', taskDate: addDaysIso(today, 1), priority: 'High', status: 'Pending', notes: '45 min DSA + 15 min DBMS' },
      { id: 'wk-5', taskName: 'Review Cloud Computing Lecture Notes', category: 'College', taskDate: addDaysIso(today, 2), priority: 'Medium', status: 'Pending', notes: 'Chapters 4–5' },
    ],
    dailyTasks: [
      { id: 'dt-1', taskName: 'Solve 2 Graph Shortest-Path Problems', taskDate: today, category: 'DSA', priority: 'High', status: 'Completed' },
      { id: 'dt-2', taskName: 'Review DBMS Indexing & B+ Tree Notes', taskDate: today, category: 'College', priority: 'Medium', status: 'Completed' },
      { id: 'dt-3', taskName: 'Write Unit Tests for Log Indexer Parser', taskDate: today, category: 'Project', priority: 'High', status: 'Pending' },
      { id: 'dt-4', taskName: 'Prepare Stripe OA Debugging Checklist', taskDate: today, category: 'Placement', priority: 'High', status: 'Pending' },
      { id: 'dt-5', taskName: 'Submit Compiler Design Assignment', taskDate: addDaysIso(today, -1), category: 'College', priority: 'High', status: 'Completed' },
      { id: 'dt-6', taskName: 'Timed Aptitude Practice Set #3', taskDate: addDaysIso(today, 1), category: 'Placement', priority: 'Medium', status: 'Pending' },
    ],
  };
}

export function createEmptyResetState(keepDefaultRoadmap: boolean): PlacePathState {
  const today = toIsoDate(new Date());
  return {
    profile: {
      fullName: '',
      email: '',
      collegeName: '',
      branch: 'Computer Science & Engineering',
      currentYear: 1,
      currentSemester: 1,
      targetRole: 'Software Engineer',
      githubUrl: '',
      linkedinUrl: '',
    },
    semesters: [],
    goals: [],
    skills: [],
    projects: [],
    roadmap: keepDefaultRoadmap ? createDefaultRoadmap(today) : [],
    placementTasks: [],
    applications: [],
    weeklyTasks: [],
    dailyTasks: [],
  };
}
