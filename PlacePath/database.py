"""
PlacePath SQLite database layer.

Handles automatic schema initialization, idempotent roadmap seeding,
parameterized CRUD operations for all 10 tables, backup support,
and controlled data reset without losing user records on restart.
"""

from __future__ import annotations

import os
import shutil
import sqlite3
from contextlib import contextmanager
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional, Sequence

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DEFAULT_DB_PATH = DATA_DIR / "placepath.db"

DEFAULT_ROADMAP_MILESTONES: List[Dict[str, Any]] = [
    # Year 1 — Foundations
    {"year": 1, "phase": "Foundations", "title": "Learn programming fundamentals", "description": "Master variables, control flow, functions, recursion, and debugging."},
    {"year": 1, "phase": "Foundations", "title": "Learn Python or C++", "description": "Build fluency in a primary engineering language and standard libraries."},
    {"year": 1, "phase": "Foundations", "title": "Understand basic problem solving", "description": "Solve 100+ beginner logic, math, and array problems systematically."},
    {"year": 1, "phase": "Foundations", "title": "Learn Git and GitHub", "description": "Practice branching, commits, pull requests, and clean repository documentation."},
    {"year": 1, "phase": "Foundations", "title": "Understand computer fundamentals", "description": "Grasp binary logic, memory model, operating basics, and CLI workflows."},
    {"year": 1, "phase": "Foundations", "title": "Complete beginner projects", "description": "Ship 2–3 small CLI or utility projects with READMEs on GitHub."},
    # Year 2 — Development
    {"year": 2, "phase": "Development", "title": "Learn Data Structures and Algorithms", "description": "Study arrays, linked lists, stacks, queues, trees, graphs, and sorting."},
    {"year": 2, "phase": "Development", "title": "Learn HTML and CSS", "description": "Build semantic, responsive layouts and accessible web interfaces."},
    {"year": 2, "phase": "Development", "title": "Learn JavaScript", "description": "Understand DOM manipulation, async workflows, APIs, and modern ES6+."},
    {"year": 2, "phase": "Development", "title": "Learn databases", "description": "Master relational design, SQL queries, joins, indexing, and SQLite/PostgreSQL."},
    {"year": 2, "phase": "Development", "title": "Build web development projects", "description": "Develop full-stack applications with persistent storage and clean architecture."},
    {"year": 2, "phase": "Development", "title": "Create a GitHub portfolio", "description": "Pin best repositories with screenshots, live links, and architecture notes."},
    {"year": 2, "phase": "Development", "title": "Start technical practice", "description": "Maintain a consistent weekly coding problem streak on practice platforms."},
    # Year 3 — Professional Growth
    {"year": 3, "phase": "Professional Growth", "title": "Advanced DSA", "description": "Master dynamic programming, graph algorithms, tries, and segment trees."},
    {"year": 3, "phase": "Professional Growth", "title": "Build advanced projects", "description": "Ship production-grade systems with tests, analytics, and deployment."},
    {"year": 3, "phase": "Professional Growth", "title": "Explore specialization", "description": "Dive deep into AI/ML, Systems, Cloud, Security, or Full-Stack Engineering."},
    {"year": 3, "phase": "Professional Growth", "title": "Internship preparation", "description": "Target summer engineering internships and tailor portfolio artifacts."},
    {"year": 3, "phase": "Professional Growth", "title": "Open-source contributions", "description": "Contribute bug fixes, docs, or features to established open-source repos."},
    {"year": 3, "phase": "Professional Growth", "title": "Resume preparation", "description": "Draft a crisp 1-page ATS-friendly engineering resume with measurable impact."},
    {"year": 3, "phase": "Professional Growth", "title": "Technical interview preparation", "description": "Review OS, DBMS, Computer Networks, OOP, and system design basics."},
    # Year 4 — Placement and Career
    {"year": 4, "phase": "Placement and Career", "title": "Aptitude preparation", "description": "Practice quantitative reasoning, logical puzzles, and verbal assessments."},
    {"year": 4, "phase": "Placement and Career", "title": "Advanced coding practice", "description": "Simulate timed online assessments with medium-to-hard DSA problems."},
    {"year": 4, "phase": "Placement and Career", "title": "Resume optimization", "description": "Refine project bullets, metrics, and role alignment after mentor reviews."},
    {"year": 4, "phase": "Placement and Career", "title": "Mock interviews", "description": "Complete peer and mentor mock technical & behavioral interviews."},
    {"year": 4, "phase": "Placement and Career", "title": "Company applications", "description": "Track target companies, referrals, deadlines, and assessment stages."},
    {"year": 4, "phase": "Placement and Career", "title": "Internship and placement preparation", "description": "Consolidate company-specific question banks and project deep-dives."},
    {"year": 4, "phase": "Placement and Career", "title": "Interview preparation", "description": "Prepare STAR behavioral stories, architecture explanations, and HR Q&A."},
]


class DatabaseError(RuntimeError):
    """Raised when a SQLite operation fails."""


class PlacePathDB:
    """Persistent SQLite storage manager for PlacePath."""

    def __init__(self, db_path: Optional[Path | str] = None) -> None:
        self.db_path = Path(db_path) if db_path else DEFAULT_DB_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.initialize()

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(str(self.db_path), timeout=15)
        conn.row_factory = sqlite3.Row
        try:
            conn.execute("PRAGMA foreign_keys = ON;")
            yield conn
            conn.commit()
        except sqlite3.Error as exc:
            conn.rollback()
            raise DatabaseError(f"Database operation failed: {exc}") from exc
        finally:
            conn.close()

    def initialize(self) -> None:
        """Create all tables if they do not already exist and seed initial records idempotently."""
        with self.connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS student_profile (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    full_name TEXT NOT NULL DEFAULT '',
                    email TEXT NOT NULL DEFAULT '',
                    college_name TEXT NOT NULL DEFAULT '',
                    branch TEXT NOT NULL DEFAULT '',
                    current_year INTEGER NOT NULL DEFAULT 1,
                    current_semester INTEGER NOT NULL DEFAULT 1,
                    target_role TEXT NOT NULL DEFAULT '',
                    github_url TEXT NOT NULL DEFAULT '',
                    linkedin_url TEXT NOT NULL DEFAULT '',
                    updated_at TEXT NOT NULL DEFAULT ''
                );

                CREATE TABLE IF NOT EXISTS semesters (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    semester_number INTEGER NOT NULL UNIQUE CHECK (semester_number BETWEEN 1 AND 8),
                    sgpa REAL,
                    total_credits REAL,
                    completed_credits REAL,
                    status TEXT NOT NULL DEFAULT 'Planned',
                    notes TEXT NOT NULL DEFAULT '',
                    updated_at TEXT NOT NULL DEFAULT ''
                );

                CREATE TABLE IF NOT EXISTS goals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    category TEXT NOT NULL DEFAULT 'Academic',
                    priority TEXT NOT NULL DEFAULT 'Medium',
                    created_date TEXT NOT NULL,
                    target_date TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'Not Started',
                    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100)
                );

                CREATE TABLE IF NOT EXISTS skills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL DEFAULT 'Programming',
                    proficiency TEXT NOT NULL DEFAULT 'Beginner',
                    date_added TEXT NOT NULL,
                    notes TEXT NOT NULL DEFAULT ''
                );

                CREATE TABLE IF NOT EXISTS projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    category TEXT NOT NULL DEFAULT 'Web Development',
                    technologies TEXT NOT NULL DEFAULT '',
                    status TEXT NOT NULL DEFAULT 'Planned',
                    start_date TEXT NOT NULL DEFAULT '',
                    target_date TEXT NOT NULL DEFAULT '',
                    completion_date TEXT NOT NULL DEFAULT '',
                    github_url TEXT NOT NULL DEFAULT '',
                    live_url TEXT NOT NULL DEFAULT '',
                    notes TEXT NOT NULL DEFAULT ''
                );

                CREATE TABLE IF NOT EXISTS roadmap_milestones (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 4),
                    phase TEXT NOT NULL DEFAULT '',
                    title TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    deadline TEXT NOT NULL DEFAULT '',
                    completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
                    notes TEXT NOT NULL DEFAULT '',
                    is_custom INTEGER NOT NULL DEFAULT 0 CHECK (is_custom IN (0, 1))
                );

                CREATE TABLE IF NOT EXISTS placement_tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_name TEXT NOT NULL,
                    category TEXT NOT NULL DEFAULT 'DSA',
                    description TEXT NOT NULL DEFAULT '',
                    target_date TEXT NOT NULL DEFAULT '',
                    status TEXT NOT NULL DEFAULT 'Not Started',
                    notes TEXT NOT NULL DEFAULT ''
                );

                CREATE TABLE IF NOT EXISTS company_applications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company_name TEXT NOT NULL,
                    job_role TEXT NOT NULL,
                    application_date TEXT NOT NULL DEFAULT '',
                    job_description TEXT NOT NULL DEFAULT '',
                    application_link TEXT NOT NULL DEFAULT '',
                    status TEXT NOT NULL DEFAULT 'Interested',
                    notes TEXT NOT NULL DEFAULT ''
                );

                CREATE TABLE IF NOT EXISTS weekly_tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_name TEXT NOT NULL,
                    category TEXT NOT NULL DEFAULT 'College',
                    task_date TEXT NOT NULL,
                    priority TEXT NOT NULL DEFAULT 'Medium',
                    status TEXT NOT NULL DEFAULT 'Pending',
                    notes TEXT NOT NULL DEFAULT ''
                );

                CREATE TABLE IF NOT EXISTS daily_tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_name TEXT NOT NULL,
                    task_date TEXT NOT NULL,
                    category TEXT NOT NULL DEFAULT 'College',
                    priority TEXT NOT NULL DEFAULT 'Medium',
                    status TEXT NOT NULL DEFAULT 'Pending'
                );

                CREATE TABLE IF NOT EXISTS app_meta (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                """
            )

            # Ensure single student profile row exists
            existing_profile = conn.execute("SELECT id FROM student_profile WHERE id = 1").fetchone()
            if existing_profile is None:
                now_iso = datetime.now().isoformat(timespec="seconds")
                conn.execute(
                    """
                    INSERT INTO student_profile (
                        id, full_name, email, college_name, branch,
                        current_year, current_semester, target_role,
                        github_url, linkedin_url, updated_at
                    ) VALUES (1, '', '', '', 'Computer Science & Engineering', 1, 1, 'Software Engineer', '', '', ?)
                    """,
                    (now_iso,),
                )

            # Seed default 4-year roadmap milestones exactly once (never re-seed if user deleted them later)
            seeded = conn.execute(
                "SELECT value FROM app_meta WHERE key = 'roadmap_seeded'"
            ).fetchone()
            if seeded is None:
                for item in DEFAULT_ROADMAP_MILESTONES:
                    conn.execute(
                        """
                        INSERT INTO roadmap_milestones (
                            year, phase, title, description, deadline, completed, notes, is_custom
                        ) VALUES (?, ?, ?, ?, '', 0, '', 0)
                        """,
                        (item["year"], item["phase"], item["title"], item["description"]),
                    )
                conn.execute(
                    "INSERT INTO app_meta (key, value) VALUES ('roadmap_seeded', '1')"
                )

    def _fetchall(self, query: str, params: Sequence[Any] = ()) -> List[Dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(query, params).fetchall()
            return [dict(row) for row in rows]

    def _fetchone(self, query: str, params: Sequence[Any] = ()) -> Optional[Dict[str, Any]]:
        with self.connect() as conn:
            row = conn.execute(query, params).fetchone()
            return dict(row) if row is not None else None

    def _execute(self, query: str, params: Sequence[Any] = ()) -> int:
        with self.connect() as conn:
            cur = conn.execute(query, params)
            return int(cur.lastrowid or 0)

    # ------------------------------------------------------------------
    # Student Profile
    # ------------------------------------------------------------------
    def get_profile(self) -> Dict[str, Any]:
        row = self._fetchone("SELECT * FROM student_profile WHERE id = 1")
        if row is None:
            self.initialize()
            row = self._fetchone("SELECT * FROM student_profile WHERE id = 1")
        return row or {}

    def update_profile(
        self,
        full_name: str,
        email: str,
        college_name: str,
        branch: str,
        current_year: int,
        current_semester: int,
        target_role: str = "",
        github_url: str = "",
        linkedin_url: str = "",
    ) -> None:
        now_iso = datetime.now().isoformat(timespec="seconds")
        self._execute(
            """
            UPDATE student_profile
            SET full_name = ?, email = ?, college_name = ?, branch = ?,
                current_year = ?, current_semester = ?, target_role = ?,
                github_url = ?, linkedin_url = ?, updated_at = ?
            WHERE id = 1
            """,
            (
                full_name.strip(),
                email.strip(),
                college_name.strip(),
                branch.strip(),
                int(current_year),
                int(current_semester),
                target_role.strip(),
                github_url.strip(),
                linkedin_url.strip(),
                now_iso,
            ),
        )

    # ------------------------------------------------------------------
    # Semesters (Academics)
    # ------------------------------------------------------------------
    def list_semesters(self) -> List[Dict[str, Any]]:
        return self._fetchall("SELECT * FROM semesters ORDER BY semester_number ASC")

    def add_semester(
        self,
        semester_number: int,
        sgpa: Optional[float],
        total_credits: Optional[float],
        completed_credits: Optional[float],
        status: str,
        notes: str = "",
    ) -> int:
        now_iso = datetime.now().isoformat(timespec="seconds")
        return self._execute(
            """
            INSERT INTO semesters (
                semester_number, sgpa, total_credits, completed_credits, status, notes, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (semester_number, sgpa, total_credits, completed_credits, status, notes.strip(), now_iso),
        )

    def update_semester(
        self,
        semester_id: int,
        semester_number: int,
        sgpa: Optional[float],
        total_credits: Optional[float],
        completed_credits: Optional[float],
        status: str,
        notes: str = "",
    ) -> None:
        now_iso = datetime.now().isoformat(timespec="seconds")
        self._execute(
            """
            UPDATE semesters
            SET semester_number = ?, sgpa = ?, total_credits = ?,
                completed_credits = ?, status = ?, notes = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                semester_number,
                sgpa,
                total_credits,
                completed_credits,
                status,
                notes.strip(),
                now_iso,
                semester_id,
            ),
        )

    def delete_semester(self, semester_id: int) -> None:
        self._execute("DELETE FROM semesters WHERE id = ?", (semester_id,))

    # ------------------------------------------------------------------
    # Goals
    # ------------------------------------------------------------------
    def list_goals(self) -> List[Dict[str, Any]]:
        return self._fetchall("SELECT * FROM goals ORDER BY target_date ASC, id DESC")

    def add_goal(
        self,
        title: str,
        description: str,
        category: str,
        priority: str,
        target_date: str,
        status: str = "Not Started",
        progress: int = 0,
        created_date: Optional[str] = None,
    ) -> int:
        created = created_date or date.today().isoformat()
        final_progress = 100 if status == "Completed" else max(0, min(100, int(progress)))
        final_status = "Completed" if final_progress == 100 else status
        return self._execute(
            """
            INSERT INTO goals (
                title, description, category, priority, created_date, target_date, status, progress
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                title.strip(),
                description.strip(),
                category,
                priority,
                created,
                target_date,
                final_status,
                final_progress,
            ),
        )

    def update_goal(
        self,
        goal_id: int,
        title: str,
        description: str,
        category: str,
        priority: str,
        target_date: str,
        status: str,
        progress: int,
    ) -> None:
        final_progress = 100 if status == "Completed" else max(0, min(100, int(progress)))
        final_status = "Completed" if final_progress == 100 else status
        self._execute(
            """
            UPDATE goals
            SET title = ?, description = ?, category = ?, priority = ?,
                target_date = ?, status = ?, progress = ?
            WHERE id = ?
            """,
            (
                title.strip(),
                description.strip(),
                category,
                priority,
                target_date,
                final_status,
                final_progress,
                goal_id,
            ),
        )

    def mark_goal_completed(self, goal_id: int) -> None:
        self._execute(
            "UPDATE goals SET status = 'Completed', progress = 100 WHERE id = ?",
            (goal_id,),
        )

    def delete_goal(self, goal_id: int) -> None:
        self._execute("DELETE FROM goals WHERE id = ?", (goal_id,))

    # ------------------------------------------------------------------
    # Skills
    # ------------------------------------------------------------------
    def list_skills(self) -> List[Dict[str, Any]]:
        return self._fetchall("SELECT * FROM skills ORDER BY date_added DESC, id DESC")

    def add_skill(
        self,
        name: str,
        category: str,
        proficiency: str,
        notes: str = "",
        date_added: Optional[str] = None,
    ) -> int:
        added = date_added or date.today().isoformat()
        return self._execute(
            """
            INSERT INTO skills (name, category, proficiency, date_added, notes)
            VALUES (?, ?, ?, ?, ?)
            """,
            (name.strip(), category, proficiency, added, notes.strip()),
        )

    def update_skill(
        self,
        skill_id: int,
        name: str,
        category: str,
        proficiency: str,
        notes: str = "",
    ) -> None:
        self._execute(
            """
            UPDATE skills
            SET name = ?, category = ?, proficiency = ?, notes = ?
            WHERE id = ?
            """,
            (name.strip(), category, proficiency, notes.strip(), skill_id),
        )

    def delete_skill(self, skill_id: int) -> None:
        self._execute("DELETE FROM skills WHERE id = ?", (skill_id,))

    # ------------------------------------------------------------------
    # Projects
    # ------------------------------------------------------------------
    def list_projects(self) -> List[Dict[str, Any]]:
        return self._fetchall("SELECT * FROM projects ORDER BY id DESC")

    def add_project(
        self,
        title: str,
        description: str,
        category: str,
        technologies: str,
        status: str,
        start_date: str = "",
        target_date: str = "",
        completion_date: str = "",
        github_url: str = "",
        live_url: str = "",
        notes: str = "",
    ) -> int:
        return self._execute(
            """
            INSERT INTO projects (
                title, description, category, technologies, status,
                start_date, target_date, completion_date, github_url, live_url, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                title.strip(),
                description.strip(),
                category,
                technologies.strip(),
                status,
                start_date,
                target_date,
                completion_date,
                github_url.strip(),
                live_url.strip(),
                notes.strip(),
            ),
        )

    def update_project(
        self,
        project_id: int,
        title: str,
        description: str,
        category: str,
        technologies: str,
        status: str,
        start_date: str = "",
        target_date: str = "",
        completion_date: str = "",
        github_url: str = "",
        live_url: str = "",
        notes: str = "",
    ) -> None:
        self._execute(
            """
            UPDATE projects
            SET title = ?, description = ?, category = ?, technologies = ?, status = ?,
                start_date = ?, target_date = ?, completion_date = ?,
                github_url = ?, live_url = ?, notes = ?
            WHERE id = ?
            """,
            (
                title.strip(),
                description.strip(),
                category,
                technologies.strip(),
                status,
                start_date,
                target_date,
                completion_date,
                github_url.strip(),
                live_url.strip(),
                notes.strip(),
                project_id,
            ),
        )

    def delete_project(self, project_id: int) -> None:
        self._execute("DELETE FROM projects WHERE id = ?", (project_id,))

    # ------------------------------------------------------------------
    # Career Roadmap Milestones
    # ------------------------------------------------------------------
    def list_roadmap_milestones(self, year: Optional[int] = None) -> List[Dict[str, Any]]:
        if year is not None:
            return self._fetchall(
                "SELECT * FROM roadmap_milestones WHERE year = ? ORDER BY id ASC",
                (int(year),),
            )
        return self._fetchall("SELECT * FROM roadmap_milestones ORDER BY year ASC, id ASC")

    def add_roadmap_milestone(
        self,
        year: int,
        phase: str,
        title: str,
        description: str = "",
        deadline: str = "",
        notes: str = "",
        completed: bool = False,
        is_custom: bool = True,
    ) -> int:
        return self._execute(
            """
            INSERT INTO roadmap_milestones (
                year, phase, title, description, deadline, completed, notes, is_custom
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                int(year),
                phase.strip(),
                title.strip(),
                description.strip(),
                deadline,
                1 if completed else 0,
                notes.strip(),
                1 if is_custom else 0,
            ),
        )

    def update_roadmap_milestone(
        self,
        milestone_id: int,
        year: int,
        phase: str,
        title: str,
        description: str = "",
        deadline: str = "",
        completed: bool = False,
        notes: str = "",
    ) -> None:
        self._execute(
            """
            UPDATE roadmap_milestones
            SET year = ?, phase = ?, title = ?, description = ?,
                deadline = ?, completed = ?, notes = ?
            WHERE id = ?
            """,
            (
                int(year),
                phase.strip(),
                title.strip(),
                description.strip(),
                deadline,
                1 if completed else 0,
                notes.strip(),
                milestone_id,
            ),
        )

    def toggle_roadmap_milestone(self, milestone_id: int, completed: bool) -> None:
        self._execute(
            "UPDATE roadmap_milestones SET completed = ? WHERE id = ?",
            (1 if completed else 0, milestone_id),
        )

    def delete_roadmap_milestone(self, milestone_id: int) -> None:
        self._execute("DELETE FROM roadmap_milestones WHERE id = ?", (milestone_id,))

    # ------------------------------------------------------------------
    # Placement Preparation Tasks
    # ------------------------------------------------------------------
    def list_placement_tasks(self) -> List[Dict[str, Any]]:
        return self._fetchall("SELECT * FROM placement_tasks ORDER BY target_date ASC, id DESC")

    def add_placement_task(
        self,
        task_name: str,
        category: str,
        description: str = "",
        target_date: str = "",
        status: str = "Not Started",
        notes: str = "",
    ) -> int:
        return self._execute(
            """
            INSERT INTO placement_tasks (task_name, category, description, target_date, status, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (task_name.strip(), category, description.strip(), target_date, status, notes.strip()),
        )

    def update_placement_task(
        self,
        task_id: int,
        task_name: str,
        category: str,
        description: str = "",
        target_date: str = "",
        status: str = "Not Started",
        notes: str = "",
    ) -> None:
        self._execute(
            """
            UPDATE placement_tasks
            SET task_name = ?, category = ?, description = ?,
                target_date = ?, status = ?, notes = ?
            WHERE id = ?
            """,
            (task_name.strip(), category, description.strip(), target_date, status, notes.strip(), task_id),
        )

    def mark_placement_task_completed(self, task_id: int) -> None:
        self._execute("UPDATE placement_tasks SET status = 'Completed' WHERE id = ?", (task_id,))

    def delete_placement_task(self, task_id: int) -> None:
        self._execute("DELETE FROM placement_tasks WHERE id = ?", (task_id,))

    # ------------------------------------------------------------------
    # Company Applications
    # ------------------------------------------------------------------
    def list_company_applications(self) -> List[Dict[str, Any]]:
        return self._fetchall(
            "SELECT * FROM company_applications ORDER BY application_date DESC, id DESC"
        )

    def add_company_application(
        self,
        company_name: str,
        job_role: str,
        application_date: str = "",
        job_description: str = "",
        application_link: str = "",
        status: str = "Interested",
        notes: str = "",
    ) -> int:
        return self._execute(
            """
            INSERT INTO company_applications (
                company_name, job_role, application_date,
                job_description, application_link, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                company_name.strip(),
                job_role.strip(),
                application_date,
                job_description.strip(),
                application_link.strip(),
                status,
                notes.strip(),
            ),
        )

    def update_company_application(
        self,
        app_id: int,
        company_name: str,
        job_role: str,
        application_date: str = "",
        job_description: str = "",
        application_link: str = "",
        status: str = "Interested",
        notes: str = "",
    ) -> None:
        self._execute(
            """
            UPDATE company_applications
            SET company_name = ?, job_role = ?, application_date = ?,
                job_description = ?, application_link = ?, status = ?, notes = ?
            WHERE id = ?
            """,
            (
                company_name.strip(),
                job_role.strip(),
                application_date,
                job_description.strip(),
                application_link.strip(),
                status,
                notes.strip(),
                app_id,
            ),
        )

    def delete_company_application(self, app_id: int) -> None:
        self._execute("DELETE FROM company_applications WHERE id = ?", (app_id,))

    # ------------------------------------------------------------------
    # Weekly Tasks
    # ------------------------------------------------------------------
    def list_weekly_tasks(self) -> List[Dict[str, Any]]:
        return self._fetchall("SELECT * FROM weekly_tasks ORDER BY task_date ASC, id DESC")

    def add_weekly_task(
        self,
        task_name: str,
        category: str,
        task_date: str,
        priority: str = "Medium",
        status: str = "Pending",
        notes: str = "",
    ) -> int:
        return self._execute(
            """
            INSERT INTO weekly_tasks (task_name, category, task_date, priority, status, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (task_name.strip(), category, task_date, priority, status, notes.strip()),
        )

    def update_weekly_task(
        self,
        task_id: int,
        task_name: str,
        category: str,
        task_date: str,
        priority: str = "Medium",
        status: str = "Pending",
        notes: str = "",
    ) -> None:
        self._execute(
            """
            UPDATE weekly_tasks
            SET task_name = ?, category = ?, task_date = ?,
                priority = ?, status = ?, notes = ?
            WHERE id = ?
            """,
            (task_name.strip(), category, task_date, priority, status, notes.strip(), task_id),
        )

    def toggle_weekly_task_status(self, task_id: int, completed: bool) -> None:
        status = "Completed" if completed else "Pending"
        self._execute("UPDATE weekly_tasks SET status = ? WHERE id = ?", (status, task_id))

    def delete_weekly_task(self, task_id: int) -> None:
        self._execute("DELETE FROM weekly_tasks WHERE id = ?", (task_id,))

    # ------------------------------------------------------------------
    # Daily Tasks
    # ------------------------------------------------------------------
    def list_daily_tasks(self, task_date: Optional[str] = None) -> List[Dict[str, Any]]:
        if task_date is not None:
            return self._fetchall(
                "SELECT * FROM daily_tasks WHERE task_date = ? ORDER BY id DESC",
                (task_date,),
            )
        return self._fetchall("SELECT * FROM daily_tasks ORDER BY task_date DESC, id DESC")

    def add_daily_task(
        self,
        task_name: str,
        task_date: str,
        category: str = "College",
        priority: str = "Medium",
        status: str = "Pending",
    ) -> int:
        return self._execute(
            """
            INSERT INTO daily_tasks (task_name, task_date, category, priority, status)
            VALUES (?, ?, ?, ?, ?)
            """,
            (task_name.strip(), task_date, category, priority, status),
        )

    def update_daily_task(
        self,
        task_id: int,
        task_name: str,
        task_date: str,
        category: str,
        priority: str,
        status: str,
    ) -> None:
        self._execute(
            """
            UPDATE daily_tasks
            SET task_name = ?, task_date = ?, category = ?, priority = ?, status = ?
            WHERE id = ?
            """,
            (task_name.strip(), task_date, category, priority, status, task_id),
        )

    def toggle_daily_task_status(self, task_id: int, completed: bool) -> None:
        status = "Completed" if completed else "Pending"
        self._execute("UPDATE daily_tasks SET status = ? WHERE id = ?", (status, task_id))

    def delete_daily_task(self, task_id: int) -> None:
        self._execute("DELETE FROM daily_tasks WHERE id = ?", (task_id,))

    # ------------------------------------------------------------------
    # Backup & Reset
    # ------------------------------------------------------------------
    def create_backup_file(self, destination_path: Path | str) -> Path:
        """Create a consistent SQLite backup file at destination_path."""
        dest = Path(destination_path)
        dest.parent.mkdir(parents=True, exist_ok=True)
        src_conn = sqlite3.connect(str(self.db_path))
        dst_conn = sqlite3.connect(str(dest))
        try:
            src_conn.backup(dst_conn)
        finally:
            dst_conn.close()
            src_conn.close()
        return dest

    def get_database_bytes(self) -> bytes:
        """Return a consistent byte snapshot of the SQLite database."""
        temp_backup = self.db_path.parent / f".backup_{os.getpid()}.db"
        try:
            self.create_backup_file(temp_backup)
            return temp_backup.read_bytes()
        finally:
            if temp_backup.exists():
                temp_backup.unlink()

    def reset_all_data(self, keep_default_roadmap: bool = True) -> None:
        """Delete all student data and reinitialize schema cleanly."""
        with self.connect() as conn:
            for table in (
                "semesters",
                "goals",
                "skills",
                "projects",
                "roadmap_milestones",
                "placement_tasks",
                "company_applications",
                "weekly_tasks",
                "daily_tasks",
                "app_meta",
            ):
                conn.execute(f"DELETE FROM {table}")
            now_iso = datetime.now().isoformat(timespec="seconds")
            conn.execute(
                """
                UPDATE student_profile
                SET full_name = '', email = '', college_name = '', branch = 'Computer Science & Engineering',
                    current_year = 1, current_semester = 1, target_role = 'Software Engineer',
                    github_url = '', linkedin_url = '', updated_at = ?
                WHERE id = 1
                """,
                (now_iso,),
            )
            if keep_default_roadmap:
                for item in DEFAULT_ROADMAP_MILESTONES:
                    conn.execute(
                        """
                        INSERT INTO roadmap_milestones (
                            year, phase, title, description, deadline, completed, notes, is_custom
                        ) VALUES (?, ?, ?, ?, '', 0, '', 0)
                        """,
                        (item["year"], item["phase"], item["title"], item["description"]),
                    )
                conn.execute(
                    "INSERT INTO app_meta (key, value) VALUES ('roadmap_seeded', '1')"
                )
            else:
                conn.execute(
                    "INSERT INTO app_meta (key, value) VALUES ('roadmap_seeded', '1')"
                )


def get_db(db_path: Optional[Path | str] = None) -> PlacePathDB:
    """Factory returning an initialized PlacePathDB instance."""
    return PlacePathDB(db_path=db_path)
