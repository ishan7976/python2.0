"""
Settings module for PlacePath.

Provides student profile editing, CSV exports for all core modules,
consistent SQLite database backup download, and explicitly confirmed data reset.
"""

from __future__ import annotations

from datetime import datetime

import streamlit as st

from database import PlacePathDB
from utils.exports import records_to_csv_bytes
from utils.theme import render_page_header
from utils.validation import validate_url


def render_settings(db: PlacePathDB) -> None:
    render_page_header(
        "Settings",
        "Manage your student profile, export records to CSV, create SQLite backups, or reset data.",
    )

    profile = db.get_profile()

    # ------------------------------------------------------------------
    # Student Profile
    # ------------------------------------------------------------------
    with st.container(border=True):
        st.subheader("Student Profile & College Information")
        with st.form("settings_profile_form"):
            c1, c2 = st.columns(2)
            full_name = c1.text_input("Full Name", value=profile.get("full_name", ""))
            email = c2.text_input("Email Address", value=profile.get("email", ""))
            college_name = c1.text_input("College / University Name", value=profile.get("college_name", ""))
            branch = c2.text_input("Engineering Branch", value=profile.get("branch", ""))

            yr = int(profile.get("current_year") or 1)
            sem = int(profile.get("current_semester") or 1)
            current_year = c1.selectbox("Current Year", [1, 2, 3, 4], index=max(0, min(3, yr - 1)))
            current_semester = c2.selectbox("Current Semester", list(range(1, 9)), index=max(0, min(7, sem - 1)))

            target_role = c1.text_input("Target Career Role", value=profile.get("target_role", ""))
            github_url = c2.text_input("GitHub Profile URL", value=profile.get("github_url", ""))
            linkedin_url = st.text_input("LinkedIn Profile URL", value=profile.get("linkedin_url", ""))

            if st.form_submit_button("Save Profile Settings", type="primary"):
                ok_g, msg_g = validate_url(github_url, "GitHub URL")
                ok_l, msg_l = validate_url(linkedin_url, "LinkedIn URL")
                if not ok_g:
                    st.error(msg_g)
                elif not ok_l:
                    st.error(msg_l)
                else:
                    db.update_profile(
                        full_name=full_name,
                        email=email,
                        college_name=college_name,
                        branch=branch,
                        current_year=current_year,
                        current_semester=current_semester,
                        target_role=target_role,
                        github_url=github_url,
                        linkedin_url=linkedin_url,
                    )
                    st.success("Profile settings saved.")
                    st.rerun()

    st.write("")

    # ------------------------------------------------------------------
    # CSV Exports & SQLite Backup
    # ------------------------------------------------------------------
    ex_col, bk_col = st.columns(2)

    with ex_col:
        with st.container(border=True):
            st.subheader("CSV Data Exports")
            st.caption("Download your records as portable CSV spreadsheets.")
            timestamp = datetime.now().strftime("%Y%m%d")

            exports = [
                ("Academics (Semesters)", "placepath_semesters", db.list_semesters()),
                ("Goals", "placepath_goals", db.list_goals()),
                ("Skills", "placepath_skills", db.list_skills()),
                ("Projects", "placepath_projects", db.list_projects()),
                ("Career Roadmap", "placepath_roadmap", db.list_roadmap_milestones()),
                ("Placement Prep Tasks", "placepath_placement_tasks", db.list_placement_tasks()),
                ("Company Applications", "placepath_applications", db.list_company_applications()),
                ("Weekly Planner Tasks", "placepath_weekly_tasks", db.list_weekly_tasks()),
                ("Daily Tasks", "placepath_daily_tasks", db.list_daily_tasks()),
            ]

            for label, fname, rows in exports:
                csv_bytes = records_to_csv_bytes(rows)
                st.download_button(
                    label=f"Export {label} ({len(rows)} rows)",
                    data=csv_bytes,
                    file_name=f"{fname}_{timestamp}.csv",
                    mime="text/csv",
                    use_container_width=True,
                )

    with bk_col:
        with st.container(border=True):
            st.subheader("SQLite Database Backup")
            st.caption(f"Active database file: `{db.db_path}`")
            st.write(
                "Create a consistent binary backup of your entire PlacePath SQLite database. "
                "Keep backups in a safe folder so you never lose your college journey records."
            )
            backup_name = f"placepath_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
            db_bytes = db.get_database_bytes()
            st.download_button(
                label="Download SQLite Backup (.db)",
                data=db_bytes,
                file_name=backup_name,
                mime="application/x-sqlite3",
                type="primary",
                use_container_width=True,
            )

        st.write("")

        # Danger Zone: Data Reset with explicit confirmation
        with st.container(border=True):
            st.subheader("Reset Application Data")
            st.warning(
                "This permanently deletes all semesters, goals, skills, projects, placement records, "
                "weekly tasks, daily tasks, and profile information."
            )
            keep_roadmap = st.checkbox("Restore default 4-year Career Roadmap milestones after reset", value=True)
            ack = st.checkbox("I understand this action cannot be undone.")
            confirm_phrase = st.text_input("Type RESET PLACEPATH to confirm", placeholder="RESET PLACEPATH")

            if st.button("Reset All Data", type="secondary", use_container_width=True):
                if not ack or confirm_phrase.strip() != "RESET PLACEPATH":
                    st.error("Please check the acknowledgment box and type RESET PLACEPATH exactly.")
                else:
                    db.reset_all_data(keep_default_roadmap=keep_roadmap)
                    st.success("All PlacePath data has been reset cleanly.")
                    st.rerun()
