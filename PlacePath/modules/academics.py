"""
Academic Management module for PlacePath.

Supports all 8 engineering semesters with full CRUD, accurate weighted CGPA
calculation over completed semesters, missing-credit detection, and Plotly charts.
"""

from __future__ import annotations

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from database import DatabaseError, PlacePathDB
from utils.calculations import calculate_weighted_cgpa
from utils.theme import PALETTE, render_page_header, style_plotly_figure
from utils.validation import validate_credits, validate_sgpa

SEMESTER_STATUSES = ["Planned", "In Progress", "Completed"]


def render_academics(db: PlacePathDB) -> None:
    render_page_header(
        "Academic Management",
        "Track all 8 engineering semesters, credits, and weighted CGPA calculations.",
    )

    semesters = db.list_semesters()
    cgpa_res = calculate_weighted_cgpa(semesters)

    # Top KPI summary
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Weighted CGPA", f"{cgpa_res.cgpa:.2f}" if cgpa_res.cgpa is not None else "Incomplete")
    c2.metric("Completed Semesters", f"{cgpa_res.completed_semesters} / 8")
    c3.metric("Completed Credits", f"{cgpa_res.total_completed_credits:g}")
    c4.metric("Planned Total Credits", f"{cgpa_res.total_planned_credits:g}")

    if cgpa_res.is_complete:
        st.success(cgpa_res.status_message)
    else:
        st.warning(cgpa_res.status_message)

    st.write("")

    # Add New Semester Record
    existing_numbers = {int(s["semester_number"]) for s in semesters}
    available_numbers = [n for n in range(1, 9) if n not in existing_numbers]

    with st.expander("Add Semester Record", expanded=len(semesters) == 0):
        if not available_numbers:
            st.info("All 8 engineering semesters are already recorded. Edit an existing semester below.")
        else:
            with st.form("add_semester_form", clear_on_submit=True):
                col1, col2, col3 = st.columns(3)
                sem_num = col1.selectbox("Semester Number", available_numbers)
                status = col2.selectbox("Status", SEMESTER_STATUSES, index=2)
                include_sgpa = col3.checkbox("Record SGPA now", value=True)

                col4, col5, col6 = st.columns(3)
                sgpa_val = col4.number_input("SGPA (0.00 - 10.00)", min_value=0.0, max_value=10.0, value=8.5, step=0.05)
                include_credits = col5.checkbox("Record Credits now", value=True)
                total_cr = col5.number_input("Total Credits", min_value=0.0, max_value=60.0, value=22.0, step=0.5)
                completed_cr = col6.number_input("Completed Credits", min_value=0.0, max_value=60.0, value=22.0, step=0.5)
                notes = st.text_area("Semester Notes", placeholder="Key courses, achievements, or backlog notes...")

                if st.form_submit_button("Save Semester", type="primary"):
                    final_sgpa = float(sgpa_val) if include_sgpa else None
                    final_total_cr = float(total_cr) if include_credits else None
                    final_comp_cr = float(completed_cr) if include_credits else None

                    ok_sgpa, msg_sgpa = validate_sgpa(final_sgpa, status)
                    ok_cr, msg_cr = validate_credits(final_total_cr, final_comp_cr)

                    if not ok_sgpa:
                        st.error(msg_sgpa)
                    elif not ok_cr:
                        st.error(msg_cr)
                    else:
                        try:
                            db.add_semester(
                                semester_number=int(sem_num),
                                sgpa=final_sgpa,
                                total_credits=final_total_cr,
                                completed_credits=final_comp_cr,
                                status=status,
                                notes=notes,
                            )
                            st.success(f"Semester {sem_num} saved.")
                            st.rerun()
                        except DatabaseError as exc:
                            st.error(str(exc))

    st.write("")

    # Academic Analytics Charts
    if semesters:
        ch1, ch2 = st.columns(2)
        sgpa_sems = [s for s in semesters if s.get("sgpa") is not None]

        with ch1:
            with st.container(border=True):
                if sgpa_sems:
                    fig_line = go.Figure()
                    fig_line.add_trace(
                        go.Scatter(
                            x=[f"Sem {s['semester_number']}" for s in sgpa_sems],
                            y=[float(s["sgpa"]) for s in sgpa_sems],
                            mode="lines+markers+text",
                            text=[f"{float(s['sgpa']):.2f}" for s in sgpa_sems],
                            textposition="top center",
                            line=dict(color=PALETTE["accent_blue"], width=3),
                            marker=dict(size=10, color=PALETTE["accent_pink"]),
                            name="SGPA",
                        )
                    )
                    if cgpa_res.cgpa is not None:
                        fig_line.add_hline(
                            y=cgpa_res.cgpa,
                            line_dash="dot",
                            line_color=PALETTE["accent_green"],
                            annotation_text=f"CGPA {cgpa_res.cgpa:.2f}",
                        )
                    fig_line.update_yaxes(range=[0, 10.5], title="SGPA")
                    st.plotly_chart(
                        style_plotly_figure(fig_line, height=300, title="Semester-wise SGPA & Trend"),
                        use_container_width=True,
                    )
                else:
                    st.info("Record SGPA values to view your performance curve.")

        with ch2:
            with st.container(border=True):
                fig_credits = go.Figure()
                labels = [f"Sem {s['semester_number']}" for s in semesters]
                fig_credits.add_trace(
                    go.Bar(
                        name="Completed Credits",
                        x=labels,
                        y=[float(s["completed_credits"] or 0) for s in semesters],
                        marker_color="#93C5FD",
                    )
                )
                fig_credits.add_trace(
                    go.Bar(
                        name="Total Credits",
                        x=labels,
                        y=[float(s["total_credits"] or 0) for s in semesters],
                        marker_color="#FBCFE8",
                    )
                )
                fig_credits.update_layout(barmode="group")
                st.plotly_chart(
                    style_plotly_figure(fig_credits, height=300, title="Credit Completion Comparison"),
                    use_container_width=True,
                )

        st.write("")
        st.subheader("Academic History")
        df_view = pd.DataFrame(
            [
                {
                    "Semester": f"Semester {s['semester_number']}",
                    "SGPA": f"{s['sgpa']:.2f}" if s.get("sgpa") is not None else "—",
                    "Completed Credits": s["completed_credits"] if s.get("completed_credits") is not None else "Missing",
                    "Total Credits": s["total_credits"] if s.get("total_credits") is not None else "Missing",
                    "Status": s["status"],
                    "Notes": s.get("notes", ""),
                }
                for s in semesters
            ]
        )
        st.dataframe(df_view, use_container_width=True, hide_index=True)

        st.write("")
        st.subheader("Manage Semester Records")
        for sem in semesters:
            sem_label = f"Semester {sem['semester_number']} — {sem['status']} (SGPA: {sem['sgpa'] if sem['sgpa'] is not None else 'N/A'})"
            with st.expander(sem_label):
                with st.form(f"edit_sem_{sem['id']}"):
                    e1, e2, e3 = st.columns(3)
                    e_status = e1.selectbox(
                        "Status",
                        SEMESTER_STATUSES,
                        index=SEMESTER_STATUSES.index(sem["status"]) if sem["status"] in SEMESTER_STATUSES else 0,
                        key=f"status_{sem['id']}",
                    )
                    has_sgpa = e2.checkbox(
                        "Has SGPA",
                        value=sem["sgpa"] is not None,
                        key=f"has_sgpa_{sem['id']}",
                    )
                    e_sgpa = e3.number_input(
                        "SGPA",
                        min_value=0.0,
                        max_value=10.0,
                        value=float(sem["sgpa"]) if sem["sgpa"] is not None else 8.0,
                        step=0.05,
                        key=f"sgpa_{sem['id']}",
                    )

                    e4, e5, e6 = st.columns(3)
                    has_credits = e4.checkbox(
                        "Has Credits",
                        value=sem["total_credits"] is not None or sem["completed_credits"] is not None,
                        key=f"has_cr_{sem['id']}",
                    )
                    e_total = e5.number_input(
                        "Total Credits",
                        min_value=0.0,
                        max_value=60.0,
                        value=float(sem["total_credits"]) if sem["total_credits"] is not None else 22.0,
                        step=0.5,
                        key=f"tot_cr_{sem['id']}",
                    )
                    e_comp = e6.number_input(
                        "Completed Credits",
                        min_value=0.0,
                        max_value=60.0,
                        value=float(sem["completed_credits"]) if sem["completed_credits"] is not None else 22.0,
                        step=0.5,
                        key=f"comp_cr_{sem['id']}",
                    )
                    e_notes = st.text_area("Notes", value=sem.get("notes", ""), key=f"notes_{sem['id']}")

                    b1, b2, b3 = st.columns([2, 2, 1])
                    save_clicked = b1.form_submit_button("Update Semester", type="primary")
                    mark_done = b2.form_submit_button("Mark Completed")
                    del_confirm = b3.checkbox("Confirm Delete", key=f"del_chk_{sem['id']}")
                    delete_clicked = b3.form_submit_button("Delete")

                    if save_clicked or mark_done:
                        target_status = "Completed" if mark_done else e_status
                        final_sgpa = float(e_sgpa) if has_sgpa else None
                        final_tot = float(e_total) if has_credits else None
                        final_cmp = float(e_comp) if has_credits else None
                        ok_s, msg_s = validate_sgpa(final_sgpa, target_status)
                        ok_c, msg_c = validate_credits(final_tot, final_cmp)
                        if not ok_s:
                            st.error(msg_s)
                        elif not ok_c:
                            st.error(msg_c)
                        else:
                            db.update_semester(
                                semester_id=int(sem["id"]),
                                semester_number=int(sem["semester_number"]),
                                sgpa=final_sgpa,
                                total_credits=final_tot,
                                completed_credits=final_cmp,
                                status=target_status,
                                notes=e_notes,
                            )
                            st.success(f"Semester {sem['semester_number']} updated.")
                            st.rerun()

                    if delete_clicked:
                        if del_confirm:
                            db.delete_semester(int(sem["id"]))
                            st.success(f"Semester {sem['semester_number']} deleted.")
                            st.rerun()
                        else:
                            st.warning("Check 'Confirm Delete' before deleting a semester record.")
    else:
        st.info("No academic records yet. Add your first semester above to compute CGPA and track credits.")
