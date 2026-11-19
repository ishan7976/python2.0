"""
Interactive 4-Year Engineering Career Roadmap module for PlacePath.
"""

from __future__ import annotations

from datetime import date

import streamlit as st

from database import PlacePathDB
from utils.calculations import summarize_roadmap
from utils.theme import render_page_header
from utils.validation import validate_required_text

YEAR_PHASES = {
    1: "Foundations",
    2: "Development",
    3: "Professional Growth",
    4: "Placement and Career",
}


def render_roadmap(db: PlacePathDB) -> None:
    render_page_header(
        "Career Roadmap",
        "Interactive 4-year engineering milestone tracker from Year 1 Foundations through Year 4 Placement.",
    )

    milestones = db.list_roadmap_milestones()
    stats = summarize_roadmap(milestones)

    # Overall Progress Summary
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Overall Roadmap", f"{stats['pct']}%")
    c2.metric("Completed Milestones", str(stats["completed"]))
    c3.metric("Pending Milestones", str(stats["pending"]))
    c4.metric("Total Milestones", str(stats["total"]))
    st.progress(stats["pct"] / 100.0)

    # Add Custom Milestone
    with st.expander("Add Custom Roadmap Milestone"):
        with st.form("add_milestone_form", clear_on_submit=True):
            mc1, mc2, mc3 = st.columns([1, 2, 1])
            m_year = mc1.selectbox(
                "Engineering Year",
                [1, 2, 3, 4],
                format_func=lambda y: f"Year {y} — {YEAR_PHASES[y]}",
            )
            m_title = mc2.text_input("Milestone Title", placeholder="e.g., Publish IEEE Research Paper")
            has_dl = mc3.checkbox("Set Deadline", value=False)
            m_dl = mc3.date_input("Deadline", value=date.today())
            m_desc = st.text_area("Description", placeholder="What does completing this milestone look like?")
            m_notes = st.text_input("Notes", placeholder="Resources, mentor feedback, or links...")

            if st.form_submit_button("Add Milestone", type="primary"):
                ok, msg = validate_required_text(m_title, "Milestone title")
                if not ok:
                    st.error(msg)
                else:
                    db.add_roadmap_milestone(
                        year=int(m_year),
                        phase=YEAR_PHASES[int(m_year)],
                        title=m_title,
                        description=m_desc,
                        deadline=m_dl.isoformat() if has_dl else "",
                        notes=m_notes,
                        completed=False,
                        is_custom=True,
                    )
                    st.success("Custom milestone added.")
                    st.rerun()

    st.write("")

    # Year-wise Interactive Tabs
    tabs = st.tabs([f"Year {yr} — {YEAR_PHASES[yr]}" for yr in range(1, 5)])

    for idx, yr in enumerate(range(1, 5)):
        with tabs[idx]:
            yr_stats = stats["by_year"][yr]
            st.subheader(f"Year {yr}: {YEAR_PHASES[yr]}")
            st.caption(f"{yr_stats['completed']} of {yr_stats['total']} milestones completed ({yr_stats['pct']}%)")
            st.progress(yr_stats["pct"] / 100.0)

            yr_milestones = [m for m in milestones if int(m["year"]) == yr]
            if not yr_milestones:
                st.info(f"No milestones for Year {yr}. Add a custom milestone above.")
                continue

            for m in yr_milestones:
                with st.container(border=True):
                    r1, r2 = st.columns([4, 1])
                    with r1:
                        checked = st.checkbox(
                            m["title"],
                            value=bool(m["completed"]),
                            key=f"rm_chk_{m['id']}",
                        )
                        if checked != bool(m["completed"]):
                            db.toggle_roadmap_milestone(int(m["id"]), checked)
                            st.rerun()
                        if m.get("description"):
                            st.write(m["description"])
                        meta_parts = [f"Year {m['year']} · {m['phase']}"]
                        if m.get("deadline"):
                            meta_parts.append(f"Deadline: {m['deadline']}")
                        if m.get("is_custom"):
                            meta_parts.append("Custom")
                        st.caption(" · ".join(meta_parts))
                        if m.get("notes"):
                            st.caption(f"Notes: {m['notes']}")
                    with r2:
                        st.write("**Done**" if m["completed"] else "Pending")

                    with st.expander("Edit / Delete Milestone"):
                        with st.form(f"edit_rm_{m['id']}"):
                            ec1, ec2 = st.columns([2, 1])
                            et = ec1.text_input("Title", value=m["title"], key=f"rmt_{m['id']}")
                            ey = ec2.selectbox(
                                "Year",
                                [1, 2, 3, 4],
                                index=max(0, min(3, int(m["year"]) - 1)),
                                key=f"rmy_{m['id']}",
                            )
                            ed = st.text_area("Description", value=m.get("description", ""), key=f"rmd_{m['id']}")
                            edl = st.text_input(
                                "Deadline (YYYY-MM-DD, optional)",
                                value=m.get("deadline", ""),
                                key=f"rmdl_{m['id']}",
                            )
                            eno = st.text_area("Notes", value=m.get("notes", ""), key=f"rmn_{m['id']}")
                            ecomp = st.checkbox("Completed", value=bool(m["completed"]), key=f"rmc_{m['id']}")

                            b1, b2 = st.columns([3, 1])
                            upd = b1.form_submit_button("Save Changes", type="primary")
                            del_chk = b2.checkbox("Confirm Delete", key=f"rmdel_c_{m['id']}")
                            del_btn = b2.form_submit_button("Delete")

                            if upd:
                                ok, msg = validate_required_text(et, "Milestone title")
                                if not ok:
                                    st.error(msg)
                                else:
                                    db.update_roadmap_milestone(
                                        milestone_id=int(m["id"]),
                                        year=int(ey),
                                        phase=YEAR_PHASES[int(ey)],
                                        title=et,
                                        description=ed,
                                        deadline=edl.strip(),
                                        completed=ecomp,
                                        notes=eno,
                                    )
                                    st.success("Milestone updated.")
                                    st.rerun()

                            if del_btn:
                                if del_chk:
                                    db.delete_roadmap_milestone(int(m["id"]))
                                    st.success("Milestone deleted.")
                                    st.rerun()
                                else:
                                    st.warning("Check 'Confirm Delete' first.")
