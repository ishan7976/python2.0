"""
Weekly Planner module for PlacePath.
"""

from __future__ import annotations

from datetime import date, timedelta

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from database import PlacePathDB
from utils.theme import render_page_header, style_plotly_figure
from utils.validation import validate_required_text

WEEKLY_CATEGORIES = ["College", "Coding", "DSA", "Project", "Placement", "Personal"]
PRIORITIES = ["Low", "Medium", "High"]


def render_weekly_planner(db: PlacePathDB) -> None:
    render_page_header(
        "Weekly Planner",
        "Organize college lectures, coding blocks, DSA drills, and project milestones across your week.",
    )

    tasks = db.list_weekly_tasks()
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    # Filter options
    f1, f2, f3 = st.columns(3)
    start_filter = f1.date_input("From Date", value=week_start)
    end_filter = f2.date_input("To Date", value=week_end)
    cat_filter = f3.selectbox("Category", ["All"] + WEEKLY_CATEGORIES)

    in_range = [
        t for t in tasks
        if start_filter.isoformat() <= str(t.get("task_date", "")) <= end_filter.isoformat()
    ]
    if cat_filter != "All":
        in_range = [t for t in in_range if t["category"] == cat_filter]

    total = len(in_range)
    completed = sum(1 for t in in_range if t["status"] == "Completed")
    pending = total - completed
    rate = round((completed / total) * 100, 1) if total else 0.0

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Planned Tasks", str(total))
    m2.metric("Completed", str(completed))
    m3.metric("Pending", str(pending))
    m4.metric("Weekly Completion Rate", f"{rate}%")
    st.progress(rate / 100.0)

    # Add Weekly Task
    with st.expander("Add Weekly Task", expanded=len(tasks) == 0):
        with st.form("add_weekly_form", clear_on_submit=True):
            w1, w2, w3, w4 = st.columns([2, 1, 1, 1])
            w_name = w1.text_input("Task Name", placeholder="e.g., Finish DBMS Normalization Lab")
            w_cat = w2.selectbox("Category", WEEKLY_CATEGORIES)
            w_date = w3.date_input("Date", value=today)
            w_prio = w4.selectbox("Priority", PRIORITIES, index=1)
            w_notes = st.text_input("Notes", placeholder="Location, study partner, or deliverables...")

            if st.form_submit_button("Add Weekly Task", type="primary"):
                ok, msg = validate_required_text(w_name, "Task name")
                if not ok:
                    st.error(msg)
                else:
                    db.add_weekly_task(
                        task_name=w_name,
                        category=w_cat,
                        task_date=w_date.isoformat(),
                        priority=w_prio,
                        status="Pending",
                        notes=w_notes,
                    )
                    st.success("Weekly task added.")
                    st.rerun()

    st.write("")

    # Weekly Progress Visualization
    if in_range:
        with st.container(border=True):
            dates_sorted = sorted({t["task_date"] for t in in_range})
            done_counts = [
                sum(1 for t in in_range if t["task_date"] == d and t["status"] == "Completed")
                for d in dates_sorted
            ]
            pend_counts = [
                sum(1 for t in in_range if t["task_date"] == d and t["status"] != "Completed")
                for d in dates_sorted
            ]
            fig = go.Figure()
            fig.add_trace(go.Bar(name="Completed", x=dates_sorted, y=done_counts, marker_color="#6EE7B7"))
            fig.add_trace(go.Bar(name="Pending", x=dates_sorted, y=pend_counts, marker_color="#93C5FD"))
            fig.update_layout(barmode="stack")
            fig.update_yaxes(title="Tasks", dtick=1)
            st.plotly_chart(
                style_plotly_figure(fig, height=260, title="Weekly Completion Progress"),
                use_container_width=True,
            )

    st.write("")

    if not in_range:
        st.info("No weekly tasks in the selected date range and category.")
        return

    for t in in_range:
        with st.container(border=True):
            lcol, rcol = st.columns([4, 1])
            with lcol:
                done = st.checkbox(
                    t["task_name"],
                    value=(t["status"] == "Completed"),
                    key=f"wk_chk_{t['id']}",
                )
                if done != (t["status"] == "Completed"):
                    db.toggle_weekly_task_status(int(t["id"]), done)
                    st.rerun()
                st.caption(f"{t['task_date']} · {t['category']} · Priority: {t['priority']} · {t['status']}")
                if t.get("notes"):
                    st.write(t["notes"])
            with rcol:
                st.write("**Completed**" if t["status"] == "Completed" else "Pending")

            with st.expander("Edit / Delete Weekly Task"):
                with st.form(f"edit_wk_{t['id']}"):
                    en = st.text_input("Task Name", value=t["task_name"], key=f"wkn_{t['id']}")
                    ec1, ec2, ec3 = st.columns(3)
                    ec = ec1.selectbox(
                        "Category",
                        WEEKLY_CATEGORIES,
                        index=WEEKLY_CATEGORIES.index(t["category"]) if t["category"] in WEEKLY_CATEGORIES else 0,
                        key=f"wkc_{t['id']}",
                    )
                    ep = ec2.selectbox(
                        "Priority",
                        PRIORITIES,
                        index=PRIORITIES.index(t["priority"]) if t["priority"] in PRIORITIES else 1,
                        key=f"wkp_{t['id']}",
                    )
                    try:
                        parsed_d = date.fromisoformat(t["task_date"])
                    except ValueError:
                        parsed_d = today
                    ed = ec3.date_input("Date", value=parsed_d, key=f"wkd_{t['id']}")
                    eno = st.text_input("Notes", value=t.get("notes", ""), key=f"wkno_{t['id']}")
                    estat = st.selectbox(
                        "Status",
                        ["Pending", "Completed"],
                        index=1 if t["status"] == "Completed" else 0,
                        key=f"wks_{t['id']}",
                    )

                    b1, b2 = st.columns([3, 1])
                    upd = b1.form_submit_button("Update", type="primary")
                    del_chk = b2.checkbox("Confirm Delete", key=f"wkdel_c_{t['id']}")
                    del_btn = b2.form_submit_button("Delete")

                    if upd:
                        ok, msg = validate_required_text(en, "Task name")
                        if not ok:
                            st.error(msg)
                        else:
                            db.update_weekly_task(int(t["id"]), en, ec, ed.isoformat(), ep, estat, eno)
                            st.success("Weekly task updated.")
                            st.rerun()
                    if del_btn:
                        if del_chk:
                            db.delete_weekly_task(int(t["id"]))
                            st.success("Weekly task deleted.")
                            st.rerun()
                        else:
                            st.warning("Check 'Confirm Delete' first.")
