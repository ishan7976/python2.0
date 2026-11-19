"""
Technical Skill Management module for PlacePath.
"""

from __future__ import annotations

import plotly.graph_objects as go
import streamlit as st

from database import PlacePathDB
from utils.calculations import summarize_skills
from utils.theme import (
    PROFICIENCY_COLOR_MAP,
    PROFICIENCY_LEVEL_MAP,
    render_page_header,
    style_plotly_figure,
)
from utils.validation import validate_required_text

SKILL_CATEGORIES = [
    "Programming",
    "Web Development",
    "Database",
    "Data Science",
    "AI/ML",
    "Tools",
    "Computer Science Fundamentals",
    "Other",
]

PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced"]


def render_skills(db: PlacePathDB) -> None:
    render_page_header(
        "Technical Skills",
        "Catalog your engineering stack, monitor proficiency growth, and spot skill gaps.",
    )

    skills = db.list_skills()
    stats = summarize_skills(skills)

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Skills", str(stats["total"]))
    c2.metric("Beginner", str(stats["Beginner"]))
    c3.metric("Intermediate", str(stats["Intermediate"]))
    c4.metric("Advanced", str(stats["Advanced"]))

    # Add Skill
    with st.expander("Add Technical Skill", expanded=len(skills) == 0):
        with st.form("add_skill_form", clear_on_submit=True):
            s1, s2, s3 = st.columns(3)
            s_name = s1.text_input("Skill Name", placeholder="e.g., Python, SQL, React, Docker")
            s_cat = s2.selectbox("Category", SKILL_CATEGORIES)
            s_prof = s3.selectbox("Proficiency Level", PROFICIENCY_LEVELS)
            s_notes = st.text_area("Notes", placeholder="Certifications, courses, or projects using this skill...")

            if st.form_submit_button("Add Skill", type="primary"):
                ok, msg = validate_required_text(s_name, "Skill name", max_length=100)
                if not ok:
                    st.error(msg)
                else:
                    db.add_skill(name=s_name, category=s_cat, proficiency=s_prof, notes=s_notes)
                    st.success(f"Added skill '{s_name}'.")
                    st.rerun()

    st.write("")

    # Skill Proficiency Chart
    if skills:
        with st.container(border=True):
            fig = go.Figure(
                data=[
                    go.Bar(
                        x=PROFICIENCY_LEVELS,
                        y=[stats[lvl] for lvl in PROFICIENCY_LEVELS],
                        marker_color=[PROFICIENCY_COLOR_MAP[lvl] for lvl in PROFICIENCY_LEVELS],
                        text=[str(stats[lvl]) for lvl in PROFICIENCY_LEVELS],
                        textposition="auto",
                    )
                ]
            )
            fig.update_yaxes(title="Skill Count", dtick=1)
            st.plotly_chart(
                style_plotly_figure(fig, height=260, title="Skills by Proficiency Level"),
                use_container_width=True,
            )

    st.write("")

    # Search and Filters
    f1, f2, f3 = st.columns([2, 1, 1])
    query = f1.text_input("Search skills", placeholder="Search skill name or notes...")
    cat_filter = f2.selectbox("Filter by Category", ["All"] + SKILL_CATEGORIES)
    prof_filter = f3.selectbox("Filter by Proficiency", ["All"] + PROFICIENCY_LEVELS)

    filtered = list(skills)
    if query.strip():
        q = query.strip().lower()
        filtered = [s for s in filtered if q in s["name"].lower() or q in s.get("notes", "").lower()]
    if cat_filter != "All":
        filtered = [s for s in filtered if s["category"] == cat_filter]
    if prof_filter != "All":
        filtered = [s for s in filtered if s["proficiency"] == prof_filter]

    if not filtered:
        st.info("No skills found matching your filters.")
        return

    # 2-column skill card grid
    cols = st.columns(2)
    for idx, skill in enumerate(filtered):
        with cols[idx % 2]:
            with st.container(border=True):
                st.subheader(skill["name"])
                st.caption(f"{skill['category']} · {skill['proficiency']} · Added {skill['date_added']}")
                pct = PROFICIENCY_LEVEL_MAP.get(skill["proficiency"], 35)
                st.progress(pct / 100.0)
                if skill.get("notes"):
                    st.write(skill["notes"])

                with st.expander("Edit / Delete"):
                    with st.form(f"edit_skill_{skill['id']}"):
                        en = st.text_input("Skill Name", value=skill["name"], key=f"sn_{skill['id']}")
                        ec = st.selectbox(
                            "Category",
                            SKILL_CATEGORIES,
                            index=SKILL_CATEGORIES.index(skill["category"]) if skill["category"] in SKILL_CATEGORIES else 0,
                            key=f"sc_{skill['id']}",
                        )
                        ep = st.selectbox(
                            "Proficiency",
                            PROFICIENCY_LEVELS,
                            index=PROFICIENCY_LEVELS.index(skill["proficiency"]) if skill["proficiency"] in PROFICIENCY_LEVELS else 0,
                            key=f"sp_{skill['id']}",
                        )
                        eno = st.text_area("Notes", value=skill.get("notes", ""), key=f"sno_{skill['id']}")
                        b1, b2 = st.columns(2)
                        upd = b1.form_submit_button("Update", type="primary")
                        del_chk = b2.checkbox("Confirm Delete", key=f"sdel_c_{skill['id']}")
                        del_btn = b2.form_submit_button("Delete")

                        if upd:
                            ok, msg = validate_required_text(en, "Skill name", max_length=100)
                            if not ok:
                                st.error(msg)
                            else:
                                db.update_skill(int(skill["id"]), en, ec, ep, eno)
                                st.success("Skill updated.")
                                st.rerun()
                        if del_btn:
                            if del_chk:
                                db.delete_skill(int(skill["id"]))
                                st.success("Skill deleted.")
                                st.rerun()
                            else:
                                st.warning("Check 'Confirm Delete' first.")
