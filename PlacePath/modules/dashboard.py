"""
Dashboard module for PlacePath.

Displays live SQLite-derived student overview, 8 KPI cards,
academic performance charts, goal/skill/project/roadmap summaries,
weekly productivity chart, and upcoming deadlines.
"""

from __future__ import annotations

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from database import PlacePathDB
from utils.calculations import (
    calculate_profile_completion,
    calculate_weighted_cgpa,
    collect_upcoming_deadlines,
    summarize_goals,
    summarize_placement,
    summarize_projects,
    summarize_roadmap,
    summarize_skills,
    summarize_weekly_productivity,
)
from utils.theme import PALETTE, render_page_header, style_plotly_figure


def render_dashboard(db: PlacePathDB) -> None:
    render_page_header(
        "Student Command Center",
        "Build Your Path. Achieve Your Goals. — Live overview across academics, skills, projects, roadmap, and placement.",
    )

    profile = db.get_profile()
    semesters = db.list_semesters()
    goals = db.list_goals()
    skills = db.list_skills()
    projects = db.list_projects()
    milestones = db.list_roadmap_milestones()
    placement_tasks = db.list_placement_tasks()
    applications = db.list_company_applications()
    weekly_tasks = db.list_weekly_tasks()
    daily_tasks = db.list_daily_tasks()

    cgpa_res = calculate_weighted_cgpa(semesters)
    profile_pct = calculate_profile_completion(profile)
    goal_stats = summarize_goals(goals)
    skill_stats = summarize_skills(skills)
    project_stats = summarize_projects(projects)
    roadmap_stats = summarize_roadmap(milestones)
    placement_stats = summarize_placement(placement_tasks, applications)
    weekly_stats = summarize_weekly_productivity(weekly_tasks, daily_tasks)
    deadlines = collect_upcoming_deadlines(goals, projects, milestones, placement_tasks)

    # ------------------------------------------------------------------
    # Student Overview Card + Quick Editable Profile Expander
    # ------------------------------------------------------------------
    with st.container(border=True):
        ov_left, ov_right = st.columns([3, 1])
        student_name = profile.get("full_name") or "Engineering Student"
        college = profile.get("college_name") or "College not set yet"
        branch = profile.get("branch") or "Engineering"
        yr = profile.get("current_year", 1)
        sem = profile.get("current_semester", 1)
        target_role = profile.get("target_role") or "Target role not set"

        with ov_left:
            st.subheader(student_name)
            st.write(f"**{college}** · {branch}")
            st.caption(f"Year {yr} · Semester {sem} · Target Role: {target_role}")
        with ov_right:
            st.metric("Profile Completion", f"{profile_pct}%")
            st.progress(profile_pct / 100.0)

        with st.expander("Edit Student Profile", expanded=False):
            with st.form("dashboard_profile_form"):
                c1, c2 = st.columns(2)
                full_name = c1.text_input("Full Name", value=profile.get("full_name", ""))
                email = c2.text_input("Email", value=profile.get("email", ""))
                college_name = c1.text_input("College Name", value=profile.get("college_name", ""))
                branch_val = c2.text_input("Branch / Department", value=profile.get("branch", ""))
                current_year = c1.selectbox(
                    "Current Year",
                    [1, 2, 3, 4],
                    index=max(0, min(3, int(yr) - 1)),
                )
                current_semester = c2.selectbox(
                    "Current Semester",
                    list(range(1, 9)),
                    index=max(0, min(7, int(sem) - 1)),
                )
                role_val = c1.text_input("Target Role", value=profile.get("target_role", ""))
                github_val = c2.text_input("GitHub URL", value=profile.get("github_url", ""))
                linkedin_val = st.text_input("LinkedIn URL", value=profile.get("linkedin_url", ""))
                if st.form_submit_button("Save Profile", type="primary"):
                    db.update_profile(
                        full_name=full_name,
                        email=email,
                        college_name=college_name,
                        branch=branch_val,
                        current_year=current_year,
                        current_semester=current_semester,
                        target_role=role_val,
                        github_url=github_val,
                        linkedin_url=linkedin_val,
                    )
                    st.success("Student profile updated.")
                    st.rerun()

    st.write("")

    # ------------------------------------------------------------------
    # 8 KPI Cards (2 rows of 4)
    # ------------------------------------------------------------------
    cgpa_display = f"{cgpa_res.cgpa:.2f}" if cgpa_res.cgpa is not None else "Incomplete"
    row1 = st.columns(4)
    row1[0].metric("Current CGPA", cgpa_display, delta=None, help=cgpa_res.status_message)
    row1[1].metric("Completed Semesters", f"{cgpa_res.completed_semesters} / 8")
    row1[2].metric("Active Goals", str(goal_stats["active"]))
    row1[3].metric("Completed Goals", str(goal_stats["completed"]))

    row2 = st.columns(4)
    row2[0].metric("Technical Skills", str(skill_stats["total"]))
    row2[1].metric("Active Projects", str(project_stats["In Progress"]))
    row2[2].metric("Completed Projects", str(project_stats["Completed"]))
    row2[3].metric("Placement Prep Progress", f"{placement_stats['progress_pct']}%")

    if not cgpa_res.is_complete and semesters:
        st.info(cgpa_res.status_message)

    st.write("")

    # ------------------------------------------------------------------
    # Academic Performance & Weekly Productivity Charts
    # ------------------------------------------------------------------
    chart_col1, chart_col2 = st.columns(2)

    with chart_col1:
        with st.container(border=True):
            st.subheader("Academic Performance")
            ac1, ac2, ac3 = st.columns(3)
            ac1.metric("CGPA", cgpa_display)
            ac2.metric("Credits Earned", f"{cgpa_res.total_completed_credits:g}")
            ac3.metric("Degree Progress", f"{round((cgpa_res.completed_semesters / 8) * 100)}%")

            sgpa_rows = [s for s in semesters if s.get("sgpa") is not None]
            if sgpa_rows:
                fig_sgpa = go.Figure()
                fig_sgpa.add_trace(
                    go.Scatter(
                        x=[f"Sem {s['semester_number']}" for s in sgpa_rows],
                        y=[float(s["sgpa"]) for s in sgpa_rows],
                        mode="lines+markers+text",
                        text=[f"{float(s['sgpa']):.2f}" for s in sgpa_rows],
                        textposition="top center",
                        line=dict(color=PALETTE["accent_blue"], width=3),
                        marker=dict(size=9, color=PALETTE["accent_pink"]),
                        name="SGPA",
                    )
                )
                fig_sgpa.update_yaxes(range=[0, 10.5], title="SGPA")
                st.plotly_chart(
                    style_plotly_figure(fig_sgpa, height=280, title="Semester-wise SGPA Trend"),
                    use_container_width=True,
                )
            else:
                st.info("Add semester records in Academics to visualize your SGPA trend.")

    with chart_col2:
        with st.container(border=True):
            st.subheader("Weekly Productivity")
            wk1, wk2, wk3 = st.columns(3)
            wk1.metric("Completed This Week", str(weekly_stats["completed"]))
            wk2.metric("Pending", str(weekly_stats["pending"]))
            wk3.metric("Weekly Progress", f"{weekly_stats['completion_pct']}%")

            df_week = pd.DataFrame(weekly_stats["daily_series"])
            if not df_week.empty and (df_week["completed"].sum() > 0 or df_week["pending"].sum() > 0):
                fig_week = go.Figure()
                fig_week.add_trace(
                    go.Bar(
                        name="Completed",
                        x=df_week["day"],
                        y=df_week["completed"],
                        marker_color="#6EE7B7",
                    )
                )
                fig_week.add_trace(
                    go.Bar(
                        name="Pending",
                        x=df_week["day"],
                        y=df_week["pending"],
                        marker_color="#F9A8D4",
                    )
                )
                fig_week.update_layout(barmode="stack")
                st.plotly_chart(
                    style_plotly_figure(fig_week, height=280, title="Daily Activity (Current Week)"),
                    use_container_width=True,
                )
            else:
                st.info("Plan tasks in Weekly Planner or Daily Tasks to see your weekly activity chart.")

    st.write("")

    # ------------------------------------------------------------------
    # Goals, Skills, Projects, and Career Roadmap Overviews
    # ------------------------------------------------------------------
    ov1, ov2, ov3, ov4 = st.columns(4)

    with ov1:
        with st.container(border=True):
            st.subheader("Goals Overview")
            st.write(f"Total: **{goal_stats['total']}**")
            st.write(f"Completed: **{goal_stats['completed']}**")
            st.write(f"Active: **{goal_stats['active']}**")
            if goal_stats["overdue"] > 0:
                st.warning(f"{goal_stats['overdue']} overdue goal(s)")
            st.progress(goal_stats["completion_pct"] / 100.0)
            st.caption(f"{goal_stats['completion_pct']}% completion rate")

    with ov2:
        with st.container(border=True):
            st.subheader("Skills Overview")
            st.write(f"Total Skills: **{skill_stats['total']}**")
            st.write(f"Beginner: **{skill_stats['Beginner']}**")
            st.write(f"Intermediate: **{skill_stats['Intermediate']}**")
            st.write(f"Advanced: **{skill_stats['Advanced']}**")

    with ov3:
        with st.container(border=True):
            st.subheader("Projects Overview")
            st.write(f"Planned: **{project_stats['Planned']}**")
            st.write(f"In Progress: **{project_stats['In Progress']}**")
            st.write(f"Completed: **{project_stats['Completed']}**")
            proj_pct = (
                round((project_stats["Completed"] / project_stats["total"]) * 100)
                if project_stats["total"]
                else 0
            )
            st.progress(proj_pct / 100.0)
            st.caption(f"{proj_pct}% portfolio shipped")

    with ov4:
        with st.container(border=True):
            st.subheader("Career Roadmap")
            st.write(f"Completed: **{roadmap_stats['completed']} / {roadmap_stats['total']}**")
            st.write(f"Pending: **{roadmap_stats['pending']}**")
            st.progress(roadmap_stats["pct"] / 100.0)
            st.caption(f"{roadmap_stats['pct']}% overall roadmap")

    st.write("")

    # ------------------------------------------------------------------
    # Upcoming Deadlines
    # ------------------------------------------------------------------
    with st.container(border=True):
        st.subheader("Upcoming Deadlines (Next 30 Days & Overdue)")
        if deadlines:
            df_deadlines = pd.DataFrame(
                [
                    {
                        "Item": d["title"],
                        "Module": d["source"],
                        "Details": d["detail"],
                        "Due Date": d["due_date"],
                        "Status": (
                            f"Overdue ({abs(d['days_left'])}d)"
                            if d["overdue"]
                            else ("Due Today" if d["days_left"] == 0 else f"In {d['days_left']}d")
                        ),
                    }
                    for d in deadlines[:15]
                ]
            )
            st.dataframe(df_deadlines, use_container_width=True, hide_index=True)
        else:
            st.info("No upcoming deadlines in the next 30 days. Add target dates in Goals, Projects, Roadmap, or Placement Preparation.")
