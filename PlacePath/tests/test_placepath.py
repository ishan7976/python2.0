"""
Comprehensive end-to-end test suite for PlacePath SQLite database,
weighted CGPA calculations, validation, exports, backup, and persistence.
"""

from __future__ import annotations

import os
import sys
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

# Ensure PlacePath root is importable
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from database import PlacePathDB  # noqa: E402
from utils.calculations import (  # noqa: E402
    calculate_profile_completion,
    calculate_weighted_cgpa,
    collect_upcoming_deadlines,
    is_goal_overdue,
    summarize_goals,
    summarize_placement,
    summarize_projects,
    summarize_roadmap,
    summarize_skills,
    summarize_weekly_productivity,
)
from utils.exports import records_to_csv_bytes  # noqa: E402
from utils.validation import (  # noqa: E402
    validate_credits,
    validate_date_order,
    validate_required_text,
    validate_sgpa,
    validate_url,
)


class TestPlacePathCore(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tmp_dir.name) / "test_placepath.db"
        self.db = PlacePathDB(db_path=self.db_path)

    def tearDown(self) -> None:
        self.tmp_dir.cleanup()

    def test_database_initialization_and_default_roadmap(self) -> None:
        profile = self.db.get_profile()
        self.assertEqual(profile["id"], 1)
        milestones = self.db.list_roadmap_milestones()
        self.assertEqual(len(milestones), 27)
        for yr in (1, 2, 3, 4):
            self.assertGreater(len(self.db.list_roadmap_milestones(year=yr)), 0)

    def test_academic_crud_and_weighted_cgpa(self) -> None:
        # Empty database condition
        empty_res = calculate_weighted_cgpa(self.db.list_semesters())
        self.assertIsNone(empty_res.cgpa)
        self.assertFalse(empty_res.is_complete)

        # Add 2 completed semesters and 1 in-progress semester
        s1 = self.db.add_semester(1, 8.5, 20.0, 20.0, "Completed", "Strong start")
        s2 = self.db.add_semester(2, 9.2, 24.0, 24.0, "Completed", "Dean list")
        self.db.add_semester(3, 8.0, 22.0, 10.0, "In Progress", "Ongoing")

        # Weighted CGPA uses ONLY completed semesters: (8.5*20 + 9.2*24) / (20+24) = 390.8 / 44 = 8.88
        res = calculate_weighted_cgpa(self.db.list_semesters())
        self.assertTrue(res.is_complete)
        self.assertEqual(res.cgpa, 8.88)
        self.assertEqual(res.completed_semesters, 2)

        # Edit semester 1 to missing credits -> must flag incomplete rather than inventing a value
        self.db.update_semester(s1, 1, 8.5, None, None, "Completed", "Missing credits")
        incomplete = calculate_weighted_cgpa(self.db.list_semesters())
        self.assertFalse(incomplete.is_complete)
        self.assertIsNone(incomplete.cgpa)
        self.assertIn(1, incomplete.missing_credit_semesters)

        # Delete semester 1 -> remaining completed semester is Sem 2 (9.2)
        self.db.delete_semester(s1)
        after_del = calculate_weighted_cgpa(self.db.list_semesters())
        self.assertTrue(after_del.is_complete)
        self.assertEqual(after_del.cgpa, 9.2)
        self.assertEqual(s2 > 0, True)

    def test_goals_crud_overdue_and_completion(self) -> None:
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        next_week = (date.today() + timedelta(days=7)).isoformat()

        g1 = self.db.add_goal("Finish OS Notes", "Chapters 1-5", "Academic", "High", yesterday, "In Progress", 40)
        g2 = self.db.add_goal("Build Portfolio", "Deploy live", "Career", "Medium", next_week, "Not Started", 0)

        goals = self.db.list_goals()
        self.assertEqual(len(goals), 2)
        overdue_map = {g["id"]: is_goal_overdue(g) for g in goals}
        self.assertTrue(overdue_map[g1])
        self.assertFalse(overdue_map[g2])

        self.db.mark_goal_completed(g1)
        stats = summarize_goals(self.db.list_goals())
        self.assertEqual(stats["completed"], 1)
        self.assertEqual(stats["active"], 1)
        self.assertEqual(stats["overdue"], 0)

        self.db.delete_goal(g2)
        self.assertEqual(len(self.db.list_goals()), 1)

    def test_skills_and_projects_crud(self) -> None:
        sk1 = self.db.add_skill("Python", "Programming", "Advanced", "Daily driver")
        self.db.add_skill("SQLite", "Database", "Intermediate", "Local apps")
        self.db.update_skill(sk1, "Python 3", "Programming", "Advanced", "Updated")
        sk_stats = summarize_skills(self.db.list_skills())
        self.assertEqual(sk_stats["total"], 2)
        self.assertEqual(sk_stats["Advanced"], 1)

        p1 = self.db.add_project(
            "PlacePath",
            "Student career app",
            "Web Development",
            "Python, Streamlit, SQLite",
            "In Progress",
            "2026-01-01",
            "2026-12-01",
            "",
            "https://github.com/student/placepath",
            "https://placepath.example.com",
            "Core portfolio project",
        )
        self.db.update_project(
            p1,
            "PlacePath",
            "Student career app",
            "Web Development",
            "Python, Streamlit, SQLite",
            "Completed",
            "2026-01-01",
            "2026-12-01",
            "2026-11-15",
            "https://github.com/student/placepath",
            "https://placepath.example.com",
            "Shipped",
        )
        p_stats = summarize_projects(self.db.list_projects())
        self.assertEqual(p_stats["Completed"], 1)

    def test_roadmap_placement_weekly_and_daily_tasks(self) -> None:
        milestones = self.db.list_roadmap_milestones(year=1)
        first_id = milestones[0]["id"]
        self.db.toggle_roadmap_milestone(first_id, True)
        custom_id = self.db.add_roadmap_milestone(3, "Professional Growth", "Publish Paper", "IEEE", "2026-11-25")
        rm_stats = summarize_roadmap(self.db.list_roadmap_milestones())
        self.assertEqual(rm_stats["completed"], 1)
        self.assertEqual(rm_stats["total"], 28)
        self.db.delete_roadmap_milestone(custom_id)

        pt1 = self.db.add_placement_task("Blind 75", "DSA", "Complete all medium problems", "2026-11-30", "In Progress")
        self.db.mark_placement_task_completed(pt1)
        app1 = self.db.add_company_application("Acme Tech", "SDE Intern", "2026-11-10", "Backend role", "https://acme.example.com/jobs/1", "Interview", "Round 2")
        pl_stats = summarize_placement(self.db.list_placement_tasks(), self.db.list_company_applications())
        self.assertEqual(pl_stats["progress_pct"], 100.0)
        self.assertEqual(pl_stats["applications_by_status"]["Interview"], 1)
        self.assertGreater(app1, 0)

        today_iso = date.today().isoformat()
        w1 = self.db.add_weekly_task("System Design Reading", "Placement", today_iso, "High", "Pending")
        self.db.toggle_weekly_task_status(w1, True)
        d1 = self.db.add_daily_task("Solve 2 Graph problems", today_iso, "DSA", "High", "Pending")
        self.db.toggle_daily_task_status(d1, True)

        wk_summary = summarize_weekly_productivity(self.db.list_weekly_tasks(), self.db.list_daily_tasks())
        self.assertEqual(wk_summary["completed"], 2)
        self.assertEqual(wk_summary["pending"], 0)

        # Upcoming deadlines collector
        deadlines = collect_upcoming_deadlines(
            self.db.list_goals(),
            self.db.list_projects(),
            self.db.list_roadmap_milestones(),
            self.db.list_placement_tasks(),
        )
        self.assertIsInstance(deadlines, list)

    def test_persistence_across_restart_exports_backup_and_validation(self) -> None:
        self.db.update_profile(
            "Aarav Mehta",
            "aarav@college.edu",
            "National Institute of Engineering",
            "Computer Science",
            3,
            5,
            "Backend Engineer",
            "https://github.com/aarav",
            "https://linkedin.com/in/aarav",
        )
        self.db.add_skill("Go", "Programming", "Intermediate")

        # Simulate full application restart by instantiating a brand new PlacePathDB on same file
        reopened = PlacePathDB(db_path=self.db_path)
        profile = reopened.get_profile()
        self.assertEqual(profile["full_name"], "Aarav Mehta")
        self.assertEqual(calculate_profile_completion(profile), 100)
        self.assertEqual(len(reopened.list_skills()), 1)

        # CSV Export
        csv_bytes = records_to_csv_bytes(reopened.list_skills())
        csv_text = csv_bytes.decode("utf-8")
        self.assertIn("Go", csv_text)
        self.assertIn("Programming", csv_text)

        # SQLite Backup
        backup_path = Path(self.tmp_dir.name) / "backup.db"
        reopened.create_backup_file(backup_path)
        self.assertTrue(backup_path.exists())
        self.assertGreater(os.path.getsize(backup_path), 0)

        # Validation helpers
        self.assertFalse(validate_required_text("   ", "Title")[0])
        self.assertFalse(validate_sgpa(10.5, "Completed")[0])
        self.assertFalse(validate_credits(20.0, 24.0)[0])
        self.assertFalse(validate_url("not-a-url")[0])
        self.assertTrue(validate_url("https://github.com/user/repo")[0])
        self.assertFalse(validate_date_order("2026-05-10", "2026-05-01")[0])


if __name__ == "__main__":
    unittest.main()
