"""
Goal Management module for PlacePath.

Supports Academic, Technical, Career, and Personal goals with priorities,
progress percentages, overdue highlighting, search, filtering, sorting, and analytics.
"""

from __future__ import annotations

from datetime import date, timedelta

import plotly.graph_objects as go
import streamlit as st

from database import PlacePathDB
from utils.calculations import is_goal_overdue, summarize_goals
from utils.theme import PALETTE, render_page_header, style_plotly_figure
from utils.validation import validate_required_text

GOAL_CATEGORIES = ["Academic", "Technical", "Career", "Personal"]
GOAL_PRIORITIES = ["Low", "Medium", "High"]
GOAL_STATUSES = ["Not Started", "In Progress", "Completed"]


def render_goals(db: PlacePathDB) -> None:
    render_page_header(
        "Goal Management",
        "Set clear targets across academics, tech, career, and personal growth with deadline tracking.",
    )

    goals = db.list_goals()
    stats = summarize_goals(goals)

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Total Goals", str(stats["total"]))
    m2.metric("Completed", str(stats["completed"]))
    m3.metric("Active", str(stats["active"]))
    m4.metric("Overdue", str(stats["overdue"]))

    # Add New Goal
    with st.expander("Add New Goal", expanded=len(goals) == 0):
        with st.form("add_goal_form", clear_on_submit=True):
            g_title = st.text_input("Goal Title", placeholder="e.g., Solve 150 Blind/NeetCode DSA Problems")
            g_desc = st.text_area("Description", placeholder="Specific milestones or success criteria...")
            c1, c2, c3, c4 = st.columns(4)
            g_cat = c1.selectbox("Category", GOAL_CATEGORIES)
            g_prio = c2.selectbox("Priority", GOAL_PRIORITIES, index=1)
            g_status = c3.selectbox("Status", GOAL_STATUSES)
            g_target = c4.date_input("Target Date", value=date.today() + timedelta(days=30))
            g_prog = st.slider("Initial Progress (%)", 0, 100, 0)

            if st.form_submit_button("Add Goal", type="primary"):
                ok, msg = validate_required_text(g_title, "Goal title")
                if not ok:
                    st.error(msg)
                else:
                    db.add_goal(
                        title=g_title,
                        description=g_desc,
                        category=g_cat,
                        priority=g_prio,
                        target_date=g_target.isoformat(),
                        status=g_status,
                        progress=g_prog,
                    )
                    st.success("Goal added.")
                    st.rerun()

    st.write("")

    # Visual Goal Analytics
    if goals:
        ch1, ch2 = st.columns(2)
        with ch1:
            with st.container(border=True):
                status_counts = [
                    sum(1 for g in goals if g["status"] == s) for s in GOAL_STATUSES
                ]
                fig_status = go.Figure(
                    data=[
                        go.Pie(
                            labels=GOAL_STATUSES,
                            values=status_counts,
                            hole=0.55,
                            marker=dict(colors=["#E2E8F0", "#93C5FD", "#6EE7B7"]),
                        )
                    ]
                )
                st.plotly_chart(
                    style_plotly_figure(fig_status, height=260, title="Goal Completion Breakdown"),
                    use_container_width=True,
                )

        with ch2:
            with st.container(border=True):
                cat_avg = []
                for cat in GOAL_CATEGORIES:
                    items = [g for g in goals if g["category"] == cat]
                    avg_p = round(sum(int(g["progress"]) for g in items) / len(items), 1) if items else 0
                    cat_avg.append(avg_p)
                fig_cat = go.Figure(
                    data=[
                        go.Bar(
                            x=GOAL_CATEGORIES,
                            y=cat_avg,
                            marker_color=["#93C5FD", "#F9A8D4", "#6EE7B7", "#FDE68A"],
                        )
                    ]
                )
                fig_cat.update_yaxes(range=[0, 105], title="Avg Progress (%)")
                st.plotly_chart(
                    style_plotly_figure(fig_cat, height=260, title="Average Progress by Category"),
                    use_container_width=True,
                )

    st.write("")

    # Search, Filter & Sort Controls
    f1, f2, f3, f4, f5 = st.columns([2, 1, 1, 1, 1])
    search_q = f1.text_input("Search goals", placeholder="Search title or description...")
    cat_filter = f2.selectbox("Category", ["All"] + GOAL_CATEGORIES)
    prio_filter = f3.selectbox("Priority", ["All"] + GOAL_PRIORITIES)
    status_filter = f4.selectbox("Status", ["All"] + GOAL_STATUSES + ["Overdue"])
    sort_order = f5.selectbox("Sort by Deadline", ["Earliest First", "Latest First"])

    filtered = list(goals)
    if search_q.strip():
        q = search_q.strip().lower()
        filtered = [
            g for g in filtered
            if q in g["title"].lower() or q in g.get("description", "").lower()
        ]
    if cat_filter != "All":
        filtered = [g for g in filtered if g["category"] == cat_filter]
    if prio_filter != "All":
        filtered = [g for g in filtered if g["priority"] == prio_filter]
    if status_filter == "Overdue":
        filtered = [g for g in filtered if is_goal_overdue(g)]
    elif status_filter != "All":
        filtered = [g for g in filtered if g["status"] == status_filter]

    filtered.sort(key=lambda g: g.get("target_date", ""), reverse=(sort_order == "Latest First"))

    if not filtered:
        st.info("No goals match the current filters.")
        return

    for goal in filtered:
        overdue = is_goal_overdue(goal)
        with st.container(border=True):
            top_l, top_r = st.columns([3, 1])
            with top_l:
                title_prefix = "[OVERDUE] " if overdue else ""
                st.subheader(f"{title_prefix}{goal['title']}")
                st.caption(
                    f"{goal['category']} · Priority: {goal['priority']} · Status: {goal['status']} · Created: {goal['created_date']} · Target: {goal['target_date']}"
                )
                if goal.get("description"):
                    st.write(goal["description"])
            with top_r:
                st.metric("Progress", f"{goal['progress']}%")
                if goal["status"] != "Completed":
                    if st.button("Mark Completed", key=f"complete_goal_{goal['id']}", use_container_width=True):
                        db.mark_goal_completed(int(goal["id"]))
                        st.rerun()

            st.progress(int(goal["progress"]) / 100.0)
            if overdue:
                st.error(f"Overdue: target date was {goal['target_date']}.")

            with st.expander("Edit or Delete Goal"):
                with st.form(f"edit_goal_{goal['id']}"):
                    e_title = st.text_input("Title", value=goal["title"], key=f"gt_{goal['id']}")
                    e_desc = st.text_area("Description", value=goal.get("description", ""), key=f"gd_{goal['id']}")
                    ec1, ec2, ec3, ec4 = st.columns(4)
                    e_cat = ec1.selectbox(
                        "Category",
                        GOAL_CATEGORIES,
                        index=GOAL_CATEGORIES.index(goal["category"]) if goal["category"] in GOAL_CATEGORIES else 0,
                        key=f"gc_{goal['id']}",
                    )
                    e_prio = ec2.selectbox(
                        "Priority",
                        GOAL_PRIORITIES,
                        index=GOAL_PRIORITIES.index(goal["priority"]) if goal["priority"] in GOAL_PRIORITIES else 1,
                        key=f"gp_{goal['id']}",
                    )
                    e_status = ec3.selectbox(
                        "Status",
                        GOAL_STATUSES,
                        index=GOAL_STATUSES.index(goal["status"]) if goal["status"] in GOAL_STATUSES else 0,
                        key=f"gs_{goal['id']}",
                    )
                    try:
                        parsed_target = date.fromisoformat(goal["target_date"])
                    except ValueError:
                        parsed_target = date.today()
                    e_target = ec4.date_input("Target Date", value=parsed_target, key=f"gtd_{goal['id']}")
                    e_prog = st.slider("Progress (%)", 0, 100, int(goal["progress"]), key=f"gpr_{goal['id']}")

                    b1, b2 = st.columns([3, 1])
                    upd = b1.form_submit_button("Update Goal", type="primary")
                    del_chk = b2.checkbox("Confirm Delete", key=f"gdel_c_{goal['id']}")
                    delete_btn = b2.form_submit_button("Delete")

                    if upd:
                        ok, msg = validate_required_text(e_title, "Goal title")
                        if not ok:
                            st.error(msg)
                        else:
                            db.update_goal(
                                goal_id=int(goal["id"]),
                                title=e_title,
                                description=e_desc,
                                category=e_cat,
                                priority=e_prio,
                                target_date=e_target.isoformat(),
                                status=e_status,
                                progress=e_prog,
                            )
                            st.success("Goal updated.")
                            st.rerun()

                    if delete_btn:
                        if del_chk:
                            db.delete_goal(int(goal["id"]))
                            st.success("Goal deleted.")
                            st.rerun()
                        else:
                            st.warning("Check 'Confirm Delete' first.")
