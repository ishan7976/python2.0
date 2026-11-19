"""
Pure analytics and academic calculations for PlacePath.

All dashboard KPIs, weighted CGPA, completion rates, overdue checks,
and upcoming deadlines are derived strictly from SQLite records.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class CGPAResult:
    cgpa: Optional[float]
    is_complete: bool
    status_message: str
    completed_semesters: int
    total_completed_credits: float
    total_planned_credits: float
    missing_credit_semesters: List[int]


def calculate_weighted_cgpa(semesters: List[Dict[str, Any]]) -> CGPAResult:
    """
    Calculate weighted CGPA using only completed semesters with valid records:
        CGPA = Sum(SGPA * Semester Credits) / Sum(Semester Credits)

    If any completed semester is missing valid credit data (> 0), clearly flag
    that CGPA is incomplete rather than inventing a value.
    """
    if not semesters:
        return CGPAResult(
            cgpa=None,
            is_complete=False,
            status_message="No semester records added yet.",
            completed_semesters=0,
            total_completed_credits=0.0,
            total_planned_credits=0.0,
            missing_credit_semesters=[],
        )

    total_planned_credits = sum(
        float(s["total_credits"]) for s in semesters if s.get("total_credits") is not None
    )
    completed = [s for s in semesters if s.get("status") == "Completed"]

    if not completed:
        return CGPAResult(
            cgpa=None,
            is_complete=False,
            status_message="No completed semesters yet.",
            completed_semesters=0,
            total_completed_credits=sum(
                float(s["completed_credits"])
                for s in semesters
                if s.get("completed_credits") is not None
            ),
            total_planned_credits=round(total_planned_credits, 2),
            missing_credit_semesters=[],
        )

    missing_credit_sems: List[int] = []
    weighted_sum = 0.0
    credit_sum = 0.0

    for sem in completed:
        sgpa = sem.get("sgpa")
        sem_credits = sem.get("completed_credits")
        if sem_credits is None or sem_credits == 0:
            sem_credits = sem.get("total_credits")

        if sgpa is None or sem_credits is None or float(sem_credits) <= 0:
            missing_credit_sems.append(int(sem["semester_number"]))
            continue

        weighted_sum += float(sgpa) * float(sem_credits)
        credit_sum += float(sem_credits)

    total_completed_credits = sum(
        float(s["completed_credits"])
        for s in semesters
        if s.get("completed_credits") is not None
    )

    if missing_credit_sems:
        sem_list = ", ".join(f"Sem {n}" for n in sorted(missing_credit_sems))
        return CGPAResult(
            cgpa=None,
            is_complete=False,
            status_message=f"Incomplete CGPA: missing valid SGPA or credits for {sem_list}.",
            completed_semesters=len(completed),
            total_completed_credits=round(total_completed_credits, 2),
            total_planned_credits=round(total_planned_credits, 2),
            missing_credit_semesters=sorted(missing_credit_sems),
        )

    if credit_sum <= 0:
        return CGPAResult(
            cgpa=None,
            is_complete=False,
            status_message="Incomplete CGPA: credit totals must be greater than zero.",
            completed_semesters=len(completed),
            total_completed_credits=round(total_completed_credits, 2),
            total_planned_credits=round(total_planned_credits, 2),
            missing_credit_semesters=[],
        )

    cgpa_val = round(weighted_sum / credit_sum, 2)
    return CGPAResult(
        cgpa=cgpa_val,
        is_complete=True,
        status_message=f"Weighted across {len(completed)} completed semester(s).",
        completed_semesters=len(completed),
        total_completed_credits=round(total_completed_credits, 2),
        total_planned_credits=round(total_planned_credits, 2),
        missing_credit_semesters=[],
    )


def calculate_profile_completion(profile: Dict[str, Any]) -> int:
    """Compute student profile completeness percentage across key fields."""
    fields = [
        "full_name",
        "email",
        "college_name",
        "branch",
        "target_role",
        "github_url",
        "linkedin_url",
    ]
    filled = sum(1 for key in fields if str(profile.get(key, "") or "").strip())
    if profile.get("current_year"):
        filled += 1
    if profile.get("current_semester"):
        filled += 1
    total = len(fields) + 2
    return round((filled / total) * 100)


def is_goal_overdue(goal: Dict[str, Any], reference_date: Optional[date] = None) -> bool:
    """Return True if a non-completed goal's target_date is strictly before today."""
    if goal.get("status") == "Completed":
        return False
    target_str = str(goal.get("target_date") or "").strip()
    if not target_str:
        return False
    try:
        target = date.fromisoformat(target_str)
    except ValueError:
        return False
    today = reference_date or date.today()
    return target < today


def summarize_goals(goals: List[Dict[str, Any]], reference_date: Optional[date] = None) -> Dict[str, Any]:
    total = len(goals)
    completed = sum(1 for g in goals if g.get("status") == "Completed")
    active = total - completed
    overdue = sum(1 for g in goals if is_goal_overdue(g, reference_date))
    completion_pct = round((completed / total) * 100, 1) if total else 0.0
    return {
        "total": total,
        "completed": completed,
        "active": active,
        "overdue": overdue,
        "completion_pct": completion_pct,
    }


def summarize_skills(skills: List[Dict[str, Any]]) -> Dict[str, int]:
    return {
        "total": len(skills),
        "Beginner": sum(1 for s in skills if s.get("proficiency") == "Beginner"),
        "Intermediate": sum(1 for s in skills if s.get("proficiency") == "Intermediate"),
        "Advanced": sum(1 for s in skills if s.get("proficiency") == "Advanced"),
    }


def summarize_projects(projects: List[Dict[str, Any]]) -> Dict[str, int]:
    return {
        "total": len(projects),
        "Planned": sum(1 for p in projects if p.get("status") == "Planned"),
        "In Progress": sum(1 for p in projects if p.get("status") == "In Progress"),
        "Completed": sum(1 for p in projects if p.get("status") == "Completed"),
    }


def summarize_roadmap(milestones: List[Dict[str, Any]]) -> Dict[str, Any]:
    total = len(milestones)
    completed = sum(1 for m in milestones if bool(m.get("completed")))
    pending = total - completed
    pct = round((completed / total) * 100, 1) if total else 0.0
    by_year: Dict[int, Dict[str, Any]] = {}
    for yr in range(1, 5):
        yr_items = [m for m in milestones if int(m.get("year", 0)) == yr]
        yr_done = sum(1 for m in yr_items if bool(m.get("completed")))
        yr_total = len(yr_items)
        by_year[yr] = {
            "total": yr_total,
            "completed": yr_done,
            "pending": yr_total - yr_done,
            "pct": round((yr_done / yr_total) * 100, 1) if yr_total else 0.0,
        }
    return {
        "total": total,
        "completed": completed,
        "pending": pending,
        "pct": pct,
        "by_year": by_year,
    }


def summarize_placement(
    tasks: List[Dict[str, Any]],
    applications: List[Dict[str, Any]],
) -> Dict[str, Any]:
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.get("status") == "Completed")
    in_progress_tasks = sum(1 for t in tasks if t.get("status") == "In Progress")
    pct = round((completed_tasks / total_tasks) * 100, 1) if total_tasks else 0.0
    app_counts = {
        status: sum(1 for a in applications if a.get("status") == status)
        for status in ("Interested", "Applied", "Assessment", "Interview", "Offer", "Rejected")
    }
    return {
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "in_progress_tasks": in_progress_tasks,
        "progress_pct": pct,
        "total_applications": len(applications),
        "applications_by_status": app_counts,
    }


def summarize_weekly_productivity(
    weekly_tasks: List[Dict[str, Any]],
    daily_tasks: List[Dict[str, Any]],
    reference_date: Optional[date] = None,
) -> Dict[str, Any]:
    """Summarize tasks for the current ISO week (Monday–Sunday) and daily breakdown."""
    today = reference_date or date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    def in_current_week(date_str: str) -> bool:
        try:
            d = date.fromisoformat(date_str)
        except ValueError:
            return False
        return week_start <= d <= week_end

    combined = [
        {"date": t.get("task_date", ""), "status": t.get("status", "Pending")}
        for t in weekly_tasks
        if in_current_week(str(t.get("task_date", "")))
    ] + [
        {"date": t.get("task_date", ""), "status": t.get("status", "Pending")}
        for t in daily_tasks
        if in_current_week(str(t.get("task_date", "")))
    ]

    total = len(combined)
    completed = sum(1 for item in combined if item["status"] == "Completed")
    pending = total - completed
    pct = round((completed / total) * 100, 1) if total else 0.0

    daily_series = []
    for offset in range(7):
        day = week_start + timedelta(days=offset)
        iso = day.isoformat()
        day_items = [item for item in combined if item["date"] == iso]
        day_done = sum(1 for item in day_items if item["status"] == "Completed")
        day_pending = len(day_items) - day_done
        daily_series.append(
            {
                "day": day.strftime("%a"),
                "date": iso,
                "completed": day_done,
                "pending": day_pending,
            }
        )

    return {
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "total": total,
        "completed": completed,
        "pending": pending,
        "completion_pct": pct,
        "daily_series": daily_series,
    }


def collect_upcoming_deadlines(
    goals: List[Dict[str, Any]],
    projects: List[Dict[str, Any]],
    milestones: List[Dict[str, Any]],
    placement_tasks: List[Dict[str, Any]],
    reference_date: Optional[date] = None,
    days_ahead: int = 30,
) -> List[Dict[str, Any]]:
    """Aggregate pending deadlines across goals, projects, roadmap milestones, and placement tasks."""
    today = reference_date or date.today()
    cutoff = today + timedelta(days=days_ahead)
    items: List[Dict[str, Any]] = []

    def try_add(title: str, source: str, due_str: str, detail: str) -> None:
        cleaned = (due_str or "").strip()
        if not cleaned:
            return
        try:
            due = date.fromisoformat(cleaned)
        except ValueError:
            return
        if due <= cutoff:
            days_left = (due - today).days
            items.append(
                {
                    "title": title,
                    "source": source,
                    "due_date": cleaned,
                    "days_left": days_left,
                    "overdue": days_left < 0,
                    "detail": detail,
                }
            )

    for g in goals:
        if g.get("status") != "Completed":
            try_add(g["title"], "Goal", g.get("target_date", ""), f"{g.get('category')} · {g.get('priority')}")

    for p in projects:
        if p.get("status") != "Completed":
            try_add(p["title"], "Project", p.get("target_date", ""), f"{p.get('category')} · {p.get('status')}")

    for m in milestones:
        if not bool(m.get("completed")):
            try_add(m["title"], "Roadmap", m.get("deadline", ""), f"Year {m.get('year')} · {m.get('phase')}")

    for t in placement_tasks:
        if t.get("status") != "Completed":
            try_add(t["task_name"], "Placement", t.get("target_date", ""), f"{t.get('category')} · {t.get('status')}")

    items.sort(key=lambda x: (x["due_date"], x["title"]))
    return items
