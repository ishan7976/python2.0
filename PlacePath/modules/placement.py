"""
Placement Preparation & Company Application Tracker module for PlacePath.
"""

from __future__ import annotations

from datetime import date, timedelta

import plotly.graph_objects as go
import streamlit as st

from database import PlacePathDB
from utils.calculations import summarize_placement
from utils.theme import render_page_header, style_plotly_figure
from utils.validation import validate_required_text, validate_url

PREP_CATEGORIES = [
    "Aptitude",
    "DSA",
    "Coding",
    "Technical Interview",
    "HR Interview",
    "Resume",
    "Communication",
]
PREP_STATUSES = ["Not Started", "In Progress", "Completed"]
APP_STATUSES = ["Interested", "Applied", "Assessment", "Interview", "Offer", "Rejected"]


def render_placement(db: PlacePathDB) -> None:
    render_page_header(
        "Placement Preparation",
        "Track structured placement readiness across all 7 preparation tracks and manage company applications.",
    )

    tasks = db.list_placement_tasks()
    apps = db.list_company_applications()
    stats = summarize_placement(tasks, apps)

    k1, k2, k3, k4 = st.columns(4)
    k1.metric("Prep Progress", f"{stats['progress_pct']}%")
    k2.metric("Completed Prep Tasks", f"{stats['completed_tasks']} / {stats['total_tasks']}")
    k3.metric("Total Applications", str(stats["total_applications"]))
    k4.metric("Offers / Interviews", f"{stats['applications_by_status']['Offer']} / {stats['applications_by_status']['Interview']}")

    tab_prep, tab_apps = st.tabs(["Preparation Tasks", "Company Application Tracker"])

    # ------------------------------------------------------------------
    # TAB 1: Placement Preparation Tasks
    # ------------------------------------------------------------------
    with tab_prep:
        with st.expander("Add Preparation Task", expanded=len(tasks) == 0):
            with st.form("add_prep_form", clear_on_submit=True):
                p1, p2, p3 = st.columns([2, 1, 1])
                t_name = p1.text_input("Task Name", placeholder="e.g., Practice Dynamic Programming Patterns")
                t_cat = p2.selectbox("Category", PREP_CATEGORIES)
                t_status = p3.selectbox("Status", PREP_STATUSES)
                t_target = st.date_input("Target Date", value=date.today() + timedelta(days=14))
                t_desc = st.text_area("Description", placeholder="Resources, problem sets, or mock test details...")
                t_notes = st.text_input("Notes", placeholder="Weak areas or revision links...")

                if st.form_submit_button("Add Preparation Task", type="primary"):
                    ok, msg = validate_required_text(t_name, "Task name")
                    if not ok:
                        st.error(msg)
                    else:
                        db.add_placement_task(
                            task_name=t_name,
                            category=t_cat,
                            description=t_desc,
                            target_date=t_target.isoformat(),
                            status=t_status,
                            notes=t_notes,
                        )
                        st.success("Preparation task added.")
                        st.rerun()

        if tasks:
            with st.container(border=True):
                cat_done = [
                    sum(1 for t in tasks if t["category"] == c and t["status"] == "Completed")
                    for c in PREP_CATEGORIES
                ]
                cat_pend = [
                    sum(1 for t in tasks if t["category"] == c and t["status"] != "Completed")
                    for c in PREP_CATEGORIES
                ]
                fig_prep = go.Figure()
                fig_prep.add_trace(go.Bar(name="Completed", x=PREP_CATEGORIES, y=cat_done, marker_color="#6EE7B7"))
                fig_prep.add_trace(go.Bar(name="Remaining", x=PREP_CATEGORIES, y=cat_pend, marker_color="#93C5FD"))
                fig_prep.update_layout(barmode="stack")
                st.plotly_chart(
                    style_plotly_figure(fig_prep, height=270, title="Preparation Progress by Track"),
                    use_container_width=True,
                )

        f1, f2 = st.columns(2)
        cat_f = f1.selectbox("Filter Category", ["All"] + PREP_CATEGORIES, key="prep_cat_f")
        stat_f = f2.selectbox("Filter Status", ["All"] + PREP_STATUSES, key="prep_stat_f")

        filtered_tasks = list(tasks)
        if cat_f != "All":
            filtered_tasks = [t for t in filtered_tasks if t["category"] == cat_f]
        if stat_f != "All":
            filtered_tasks = [t for t in filtered_tasks if t["status"] == stat_f]

        if not filtered_tasks:
            st.info("No preparation tasks match your filters.")
        else:
            for t in filtered_tasks:
                with st.container(border=True):
                    tl, tr = st.columns([3, 1])
                    with tl:
                        st.subheader(t["task_name"])
                        st.caption(f"{t['category']} · {t['status']} · Target: {t.get('target_date') or '—'}")
                        if t.get("description"):
                            st.write(t["description"])
                        if t.get("notes"):
                            st.caption(f"Notes: {t['notes']}")
                    with tr:
                        if t["status"] != "Completed":
                            if st.button("Mark Completed", key=f"done_prep_{t['id']}", use_container_width=True):
                                db.mark_placement_task_completed(int(t["id"]))
                                st.rerun()

                    with st.expander("Edit / Delete Task"):
                        with st.form(f"edit_prep_{t['id']}"):
                            en = st.text_input("Task Name", value=t["task_name"], key=f"pn_{t['id']}")
                            ec1, ec2, ec3 = st.columns(3)
                            ec = ec1.selectbox(
                                "Category",
                                PREP_CATEGORIES,
                                index=PREP_CATEGORIES.index(t["category"]) if t["category"] in PREP_CATEGORIES else 0,
                                key=f"pc_{t['id']}",
                            )
                            es = ec2.selectbox(
                                "Status",
                                PREP_STATUSES,
                                index=PREP_STATUSES.index(t["status"]) if t["status"] in PREP_STATUSES else 0,
                                key=f"ps_{t['id']}",
                            )
                            edate = ec3.text_input("Target Date (YYYY-MM-DD)", value=t.get("target_date", ""), key=f"pd_{t['id']}")
                            edesc = st.text_area("Description", value=t.get("description", ""), key=f"pdesc_{t['id']}")
                            enotes = st.text_input("Notes", value=t.get("notes", ""), key=f"pno_{t['id']}")
                            b1, b2 = st.columns([3, 1])
                            upd = b1.form_submit_button("Update Task", type="primary")
                            del_chk = b2.checkbox("Confirm Delete", key=f"pdel_chk_{t['id']}")
                            del_btn = b2.form_submit_button("Delete")

                            if upd:
                                ok, msg = validate_required_text(en, "Task name")
                                if not ok:
                                    st.error(msg)
                                else:
                                    db.update_placement_task(
                                        int(t["id"]), en, ec, edesc, edate.strip(), es, enotes
                                    )
                                    st.success("Task updated.")
                                    st.rerun()
                            if del_btn:
                                if del_chk:
                                    db.delete_placement_task(int(t["id"]))
                                    st.success("Task deleted.")
                                    st.rerun()
                                else:
                                    st.warning("Check 'Confirm Delete' first.")

    # ------------------------------------------------------------------
    # TAB 2: Company Application Tracker
    # ------------------------------------------------------------------
    with tab_apps:
        with st.expander("Add Company Application", expanded=len(apps) == 0):
            with st.form("add_company_form", clear_on_submit=True):
                a1, a2, a3 = st.columns(3)
                comp_name = a1.text_input("Company Name", placeholder="e.g., Stripe, Atlassian, Microsoft")
                job_role = a2.text_input("Job Role", placeholder="e.g., Software Engineer Intern")
                app_status = a3.selectbox("Status", APP_STATUSES)
                a4, a5 = st.columns(2)
                app_date = a4.date_input("Application Date", value=date.today())
                app_link = a5.text_input("Application Link", placeholder="https://careers.company.com/job/123")
                job_desc = st.text_area("Job Description", placeholder="Key requirements, tech stack, compensation...")
                app_notes = st.text_input("Notes", placeholder="Referral contact, OA deadline, interview rounds...")

                if st.form_submit_button("Add Application", type="primary"):
                    ok_c, msg_c = validate_required_text(comp_name, "Company name")
                    ok_r, msg_r = validate_required_text(job_role, "Job role")
                    ok_u, msg_u = validate_url(app_link, "Application link")
                    for ok, msg in ((ok_c, msg_c), (ok_r, msg_r), (ok_u, msg_u)):
                        if not ok:
                            st.error(msg)
                            break
                    else:
                        db.add_company_application(
                            company_name=comp_name,
                            job_role=job_role,
                            application_date=app_date.isoformat(),
                            job_description=job_desc,
                            application_link=app_link,
                            status=app_status,
                            notes=app_notes,
                        )
                        st.success(f"Application for {comp_name} saved.")
                        st.rerun()

        if apps:
            scols = st.columns(len(APP_STATUSES))
            for idx, st_name in enumerate(APP_STATUSES):
                scols[idx].metric(st_name, str(stats["applications_by_status"][st_name]))

            with st.container(border=True):
                fig_app = go.Figure(
                    data=[
                        go.Bar(
                            x=APP_STATUSES,
                            y=[stats["applications_by_status"][s] for s in APP_STATUSES],
                            marker_color=["#E2E8F0", "#93C5FD", "#FDE68A", "#F9A8D4", "#6EE7B7", "#FCA5A5"],
                            text=[str(stats["applications_by_status"][s]) for s in APP_STATUSES],
                            textposition="auto",
                        )
                    ]
                )
                fig_app.update_yaxes(title="Applications", dtick=1)
                st.plotly_chart(
                    style_plotly_figure(fig_app, height=250, title="Application Pipeline"),
                    use_container_width=True,
                )

        af1, af2 = st.columns([2, 1])
        comp_search = af1.text_input("Search companies or roles", placeholder="Search company, role, or notes...")
        app_stat_f = af2.selectbox("Filter Application Status", ["All"] + APP_STATUSES)

        filtered_apps = list(apps)
        if comp_search.strip():
            q = comp_search.strip().lower()
            filtered_apps = [
                a for a in filtered_apps
                if q in a["company_name"].lower()
                or q in a["job_role"].lower()
                or q in a.get("notes", "").lower()
            ]
        if app_stat_f != "All":
            filtered_apps = [a for a in filtered_apps if a["status"] == app_stat_f]

        if not filtered_apps:
            st.info("No company applications match your filters.")
        else:
            for app in filtered_apps:
                with st.container(border=True):
                    al, ar = st.columns([3, 1])
                    with al:
                        st.subheader(f"{app['company_name']} — {app['job_role']}")
                        st.caption(f"Status: {app['status']} · Applied: {app.get('application_date') or '—'}")
                        if app.get("job_description"):
                            st.write(app["job_description"])
                        if app.get("notes"):
                            st.caption(f"Notes: {app['notes']}")
                    with ar:
                        if app.get("application_link"):
                            st.link_button("Open Job Link", app["application_link"], use_container_width=True)

                    with st.expander("Edit / Delete Application"):
                        with st.form(f"edit_app_{app['id']}"):
                            ea1, ea2, ea3 = st.columns(3)
                            ec_name = ea1.text_input("Company Name", value=app["company_name"], key=f"acn_{app['id']}")
                            ej_role = ea2.text_input("Job Role", value=app["job_role"], key=f"ajr_{app['id']}")
                            ea_stat = ea3.selectbox(
                                "Status",
                                APP_STATUSES,
                                index=APP_STATUSES.index(app["status"]) if app["status"] in APP_STATUSES else 0,
                                key=f"ast_{app['id']}",
                            )
                            ea4, ea5 = st.columns(2)
                            ea_date = ea4.text_input("Application Date", value=app.get("application_date", ""), key=f"adt_{app['id']}")
                            ea_link = ea5.text_input("Application Link", value=app.get("application_link", ""), key=f"alk_{app['id']}")
                            ea_jd = st.text_area("Job Description", value=app.get("job_description", ""), key=f"ajd_{app['id']}")
                            ea_notes = st.text_input("Notes", value=app.get("notes", ""), key=f"ano_{app['id']}")

                            b1, b2 = st.columns([3, 1])
                            upd = b1.form_submit_button("Update Application", type="primary")
                            del_chk = b2.checkbox("Confirm Delete", key=f"adel_c_{app['id']}")
                            del_btn = b2.form_submit_button("Delete")

                            if upd:
                                ok_c, msg_c = validate_required_text(ec_name, "Company name")
                                ok_r, msg_r = validate_required_text(ej_role, "Job role")
                                ok_u, msg_u = validate_url(ea_link, "Application link")
                                for ok, msg in ((ok_c, msg_c), (ok_r, msg_r), (ok_u, msg_u)):
                                    if not ok:
                                        st.error(msg)
                                        break
                                else:
                                    db.update_company_application(
                                        int(app["id"]),
                                        ec_name,
                                        ej_role,
                                        ea_date.strip(),
                                        ea_jd,
                                        ea_link,
                                        ea_stat,
                                        ea_notes,
                                    )
                                    st.success("Application updated.")
                                    st.rerun()

                            if del_btn:
                                if del_chk:
                                    db.delete_company_application(int(app["id"]))
                                    st.success("Application deleted.")
                                    st.rerun()
                                else:
                                    st.warning("Check 'Confirm Delete' first.")
