"""
Daily Task Management module for PlacePath.

Defaults to today's tasks and supports browsing previous days and upcoming dates.
"""

from __future__ import annotations

from datetime import date

import streamlit as st

from database import PlacePathDB
from utils.theme import render_page_header
from utils.validation import validate_required_text

DAILY_CATEGORIES = ["College", "Coding", "DSA", "Project", "Placement", "Personal"]
PRIORITIES = ["Low", "Medium", "High"]


def render_daily_tasks(db: PlacePathDB) -> None:
    render_page_header(
        "Daily Tasks",
        "Execute your day with focus. View today's tasks by default, or inspect previous and upcoming days.",
    )

    today = date.today()
    today_iso = today.isoformat()

    view_mode = st.radio(
        "View",
        ["Today", "Previous Days", "Upcoming", "Pick Specific Date"],
        horizontal=True,
    )

    all_tasks = db.list_daily_tasks()
    selected_date = today

    if view_mode == "Today":
        visible_tasks = [t for t in all_tasks if t["task_date"] == today_iso]
        label = f"Today ({today_iso})"
    elif view_mode == "Previous Days":
        visible_tasks = [t for t in all_tasks if t["task_date"] < today_iso]
        label = "Previous Days"
    elif view_mode == "Upcoming":
        visible_tasks = [t for t in all_tasks if t["task_date"] > today_iso]
        label = "Upcoming Days"
    else:
        selected_date = st.date_input("Choose Date", value=today)
        visible_tasks = [t for t in all_tasks if t["task_date"] == selected_date.isoformat()]
        label = f"Tasks for {selected_date.isoformat()}"

    total = len(visible_tasks)
    completed = sum(1 for t in visible_tasks if t["status"] == "Completed")
    pending = total - completed
    progress = round((completed / total) * 100, 1) if total else 0.0

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Tasks in View", str(total))
    m2.metric("Completed", str(completed))
    m3.metric("Pending", str(pending))
    m4.metric("Daily Progress", f"{progress}%")
    st.progress(progress / 100.0)

    # Quick Add Daily Task
    with st.container(border=True):
        st.subheader("Add Daily Task")
        with st.form("add_daily_task_form", clear_on_submit=True):
            c1, c2, c3, c4 = st.columns([2, 1, 1, 1])
            d_name = c1.text_input("Task Name", placeholder="e.g., Solve 3 Binary Tree problems")
            d_date = c2.date_input("Date", value=selected_date)
            d_cat = c3.selectbox("Category", DAILY_CATEGORIES)
            d_prio = c4.selectbox("Priority", PRIORITIES, index=1)

            if st.form_submit_button("Add Task", type="primary"):
                ok, msg = validate_required_text(d_name, "Task name")
                if not ok:
                    st.error(msg)
                else:
                    db.add_daily_task(
                        task_name=d_name,
                        task_date=d_date.isoformat(),
                        category=d_cat,
                        priority=d_prio,
                        status="Pending",
                    )
                    st.success("Daily task added.")
                    st.rerun()

    st.write("")
    st.subheader(label)

    if not visible_tasks:
        st.info(f"No daily tasks found under '{label}'. Add a task above to get started.")
        return

    for task in visible_tasks:
        with st.container(border=True):
            lcol, rcol = st.columns([4, 1])
            with lcol:
                done = st.checkbox(
                    task["task_name"],
                    value=(task["status"] == "Completed"),
                    key=f"dt_chk_{task['id']}",
                )
                if done != (task["status"] == "Completed"):
                    db.toggle_daily_task_status(int(task["id"]), done)
                    st.rerun()
                st.caption(
                    f"{task['task_date']} · {task['category']} · Priority: {task['priority']} · {task['status']}"
                )
            with rcol:
                st.write("**Done**" if task["status"] == "Completed" else "Pending")

            with st.expander("Edit / Delete Task"):
                with st.form(f"edit_dt_{task['id']}"):
                    en = st.text_input("Task Name", value=task["task_name"], key=f"dtn_{task['id']}")
                    ec1, ec2, ec3, ec4 = st.columns(4)
                    try:
                        parsed_d = date.fromisoformat(task["task_date"])
                    except ValueError:
                        parsed_d = today
                    ed = ec1.date_input("Date", value=parsed_d, key=f"dtd_{task['id']}")
                    ec = ec2.selectbox(
                        "Category",
                        DAILY_CATEGORIES,
                        index=DAILY_CATEGORIES.index(task["category"]) if task["category"] in DAILY_CATEGORIES else 0,
                        key=f"dtc_{task['id']}",
                    )
                    ep = ec3.selectbox(
                        "Priority",
                        PRIORITIES,
                        index=PRIORITIES.index(task["priority"]) if task["priority"] in PRIORITIES else 1,
                        key=f"dtp_{task['id']}",
                    )
                    es = ec4.selectbox(
                        "Status",
                        ["Pending", "Completed"],
                        index=1 if task["status"] == "Completed" else 0,
                        key=f"dts_{task['id']}",
                    )

                    b1, b2 = st.columns([3, 1])
                    upd = b1.form_submit_button("Update", type="primary")
                    del_chk = b2.checkbox("Confirm Delete", key=f"dtdel_c_{task['id']}")
                    del_btn = b2.form_submit_button("Delete")

                    if upd:
                        ok, msg = validate_required_text(en, "Task name")
                        if not ok:
                            st.error(msg)
                        else:
                            db.update_daily_task(int(task["id"]), en, ed.isoformat(), ec, ep, es)
                            st.success("Daily task updated.")
                            st.rerun()
                    if del_btn:
                        if del_chk:
                            db.delete_daily_task(int(task["id"]))
                            st.success("Daily task deleted.")
                            st.rerun()
                        else:
                            st.warning("Check 'Confirm Delete' first.")
