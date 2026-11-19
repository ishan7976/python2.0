"""
Project Portfolio module for PlacePath.

Supports full project CRUD, URL validation for GitHub and Live links,
search, filtering by status and category, portfolio cards, and status analytics.
"""

from __future__ import annotations

from datetime import date, timedelta

import plotly.graph_objects as go
import streamlit as st

from database import PlacePathDB
from utils.calculations import summarize_projects
from utils.theme import render_page_header, style_plotly_figure
from utils.validation import validate_date_order, validate_required_text, validate_url

PROJECT_STATUSES = ["Planned", "In Progress", "Completed"]
PROJECT_CATEGORIES = [
    "Web Development",
    "AI/ML",
    "Data Science",
    "Systems",
    "Mobile",
    "Cloud / DevOps",
    "Embedded / IoT",
    "Other",
]

STATUS_PROGRESS_MAP = {
    "Planned": 15,
    "In Progress": 60,
    "Completed": 100,
}


def render_projects(db: PlacePathDB) -> None:
    render_page_header(
        "Project Portfolio",
        "Plan, track, and showcase your engineering projects with validated GitHub and deployment links.",
    )

    projects = db.list_projects()
    stats = summarize_projects(projects)

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Total Projects", str(stats["total"]))
    m2.metric("Planned", str(stats["Planned"]))
    m3.metric("In Progress", str(stats["In Progress"]))
    m4.metric("Completed", str(stats["Completed"]))

    # Add Project Form
    with st.expander("Add New Project", expanded=len(projects) == 0):
        with st.form("add_project_form", clear_on_submit=True):
            p_title = st.text_input("Project Title", placeholder="e.g., Distributed Log Analyzer")
            p_desc = st.text_area("Description", placeholder="Architecture, problem solved, and measurable results...")
            c1, c2, c3 = st.columns(3)
            p_cat = c1.selectbox("Category", PROJECT_CATEGORIES)
            p_status = c2.selectbox("Status", PROJECT_STATUSES)
            p_tech = c3.text_input("Technologies Used", placeholder="Python, SQLite, Plotly, FastAPI")

            d1, d2, d3 = st.columns(3)
            p_start = d1.date_input("Start Date", value=date.today())
            p_target = d2.date_input("Target Date", value=date.today() + timedelta(days=45))
            has_comp = d3.checkbox("Completed?", value=False)
            p_comp = d3.date_input("Completion Date", value=date.today())

            u1, u2 = st.columns(2)
            p_github = u1.text_input("GitHub URL", placeholder="https://github.com/username/repo")
            p_live = u2.text_input("Live Project URL", placeholder="https://your-project.app")
            p_notes = st.text_area("Notes", placeholder="Next milestones, demo checklist, or interview talking points...")

            if st.form_submit_button("Add Project", type="primary"):
                ok_t, msg_t = validate_required_text(p_title, "Project title")
                ok_g, msg_g = validate_url(p_github, "GitHub URL")
                ok_l, msg_l = validate_url(p_live, "Live project URL")
                ok_d, msg_d = validate_date_order(p_start.isoformat(), p_target.isoformat())

                for ok, msg in ((ok_t, msg_t), (ok_g, msg_g), (ok_l, msg_l), (ok_d, msg_d)):
                    if not ok:
                        st.error(msg)
                        break
                else:
                    comp_str = p_comp.isoformat() if (has_comp or p_status == "Completed") else ""
                    db.add_project(
                        title=p_title,
                        description=p_desc,
                        category=p_cat,
                        technologies=p_tech,
                        status=p_status,
                        start_date=p_start.isoformat(),
                        target_date=p_target.isoformat(),
                        completion_date=comp_str,
                        github_url=p_github,
                        live_url=p_live,
                        notes=p_notes,
                    )
                    st.success(f"Project '{p_title}' added.")
                    st.rerun()

    st.write("")

    # Project Status Chart
    if projects:
        with st.container(border=True):
            fig = go.Figure(
                data=[
                    go.Bar(
                        x=PROJECT_STATUSES,
                        y=[stats[s] for s in PROJECT_STATUSES],
                        marker_color=["#FBCFE8", "#93C5FD", "#6EE7B7"],
                        text=[str(stats[s]) for s in PROJECT_STATUSES],
                        textposition="auto",
                    )
                ]
            )
            fig.update_yaxes(title="Projects", dtick=1)
            st.plotly_chart(
                style_plotly_figure(fig, height=250, title="Portfolio Status Breakdown"),
                use_container_width=True,
            )

    st.write("")

    # Search & Filters
    f1, f2, f3 = st.columns([2, 1, 1])
    query = f1.text_input("Search projects", placeholder="Search title, stack, or description...")
    status_filter = f2.selectbox("Filter by Status", ["All"] + PROJECT_STATUSES)
    cat_filter = f3.selectbox("Filter by Category", ["All"] + PROJECT_CATEGORIES)

    filtered = list(projects)
    if query.strip():
        q = query.strip().lower()
        filtered = [
            p for p in filtered
            if q in p["title"].lower()
            or q in p.get("technologies", "").lower()
            or q in p.get("description", "").lower()
        ]
    if status_filter != "All":
        filtered = [p for p in filtered if p["status"] == status_filter]
    if cat_filter != "All":
        filtered = [p for p in filtered if p["category"] == cat_filter]

    if not filtered:
        st.info("No projects match your filters.")
        return

    for proj in filtered:
        with st.container(border=True):
            head_l, head_r = st.columns([3, 1])
            with head_l:
                st.subheader(proj["title"])
                st.caption(
                    f"{proj['category']} · {proj['status']} · Start: {proj.get('start_date') or '—'} · Target: {proj.get('target_date') or '—'}"
                )
            with head_r:
                pct = STATUS_PROGRESS_MAP.get(proj["status"], 15)
                st.metric("Progress", f"{pct}%")

            st.progress(pct / 100.0)
            if proj.get("description"):
                st.write(proj["description"])
            if proj.get("technologies"):
                st.write(f"**Stack:** {proj['technologies']}")

            link_cols = st.columns([1, 1, 2])
            if proj.get("github_url"):
                link_cols[0].link_button("GitHub Repository", proj["github_url"], use_container_width=True)
            if proj.get("live_url"):
                link_cols[1].link_button("Live Deployment", proj["live_url"], use_container_width=True)
            if proj.get("completion_date"):
                link_cols[2].caption(f"Completed on {proj['completion_date']}")

            if proj.get("notes"):
                st.caption(f"Notes: {proj['notes']}")

            with st.expander("Edit or Delete Project"):
                with st.form(f"edit_proj_{proj['id']}"):
                    et = st.text_input("Title", value=proj["title"], key=f"pt_{proj['id']}")
                    ed = st.text_area("Description", value=proj.get("description", ""), key=f"pd_{proj['id']}")
                    ec1, ec2, ec3 = st.columns(3)
                    ecat = ec1.selectbox(
                        "Category",
                        PROJECT_CATEGORIES,
                        index=PROJECT_CATEGORIES.index(proj["category"]) if proj["category"] in PROJECT_CATEGORIES else 0,
                        key=f"pc_{proj['id']}",
                    )
                    estat = ec2.selectbox(
                        "Status",
                        PROJECT_STATUSES,
                        index=PROJECT_STATUSES.index(proj["status"]) if proj["status"] in PROJECT_STATUSES else 0,
                        key=f"ps_{proj['id']}",
                    )
                    etech = ec3.text_input("Technologies", value=proj.get("technologies", ""), key=f"ptech_{proj['id']}")

                    ed1, ed2, ed3 = st.columns(3)
                    e_start = ed1.text_input("Start Date (YYYY-MM-DD)", value=proj.get("start_date", ""), key=f"psd_{proj['id']}")
                    e_target = ed2.text_input("Target Date (YYYY-MM-DD)", value=proj.get("target_date", ""), key=f"ptd_{proj['id']}")
                    e_comp = ed3.text_input("Completion Date (YYYY-MM-DD)", value=proj.get("completion_date", ""), key=f"pcd_{proj['id']}")

                    eu1, eu2 = st.columns(2)
                    e_gh = eu1.text_input("GitHub URL", value=proj.get("github_url", ""), key=f"pgh_{proj['id']}")
                    e_live = eu2.text_input("Live URL", value=proj.get("live_url", ""), key=f"plive_{proj['id']}")
                    e_notes = st.text_area("Notes", value=proj.get("notes", ""), key=f"pn_{proj['id']}")

                    b1, b2 = st.columns([3, 1])
                    upd = b1.form_submit_button("Update Project", type="primary")
                    del_chk = b2.checkbox("Confirm Delete", key=f"pdel_c_{proj['id']}")
                    del_btn = b2.form_submit_button("Delete")

                    if upd:
                        ok_t, msg_t = validate_required_text(et, "Project title")
                        ok_g, msg_g = validate_url(e_gh, "GitHub URL")
                        ok_l, msg_l = validate_url(e_live, "Live URL")
                        ok_d, msg_d = validate_date_order(e_start, e_target)
                        for ok, msg in ((ok_t, msg_t), (ok_g, msg_g), (ok_l, msg_l), (ok_d, msg_d)):
                            if not ok:
                                st.error(msg)
                                break
                        else:
                            db.update_project(
                                project_id=int(proj["id"]),
                                title=et,
                                description=ed,
                                category=ecat,
                                technologies=etech,
                                status=estat,
                                start_date=e_start,
                                target_date=e_target,
                                completion_date=e_comp,
                                github_url=e_gh,
                                live_url=e_live,
                                notes=e_notes,
                            )
                            st.success("Project updated.")
                            st.rerun()

                    if del_btn:
                        if del_chk:
                            db.delete_project(int(proj["id"]))
                            st.success("Project deleted.")
                            st.rerun()
                        else:
                            st.warning("Check 'Confirm Delete' first.")
