"""
PlacePath — Build Your Path. Achieve Your Goals.

Main Streamlit entry point. Launches directly into the Student Dashboard
with persistent SQLite storage and 10 integrated sidebar navigation modules.
"""

from __future__ import annotations

import streamlit as st

from database import get_db
from modules.academics import render_academics
from modules.daily_tasks import render_daily_tasks
from modules.dashboard import render_dashboard
from modules.goals import render_goals
from modules.placement import render_placement
from modules.projects import render_projects
from modules.roadmap import render_roadmap
from modules.settings import render_settings
from modules.skills import render_skills
from modules.weekly_planner import render_weekly_planner


def main() -> None:
    st.set_page_config(
        page_title="PlacePath — Student Career Command Center",
        page_icon="🎓",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    # Initialize persistent SQLite database (idempotent, never wipes user data on restart)
    db = get_db()

    # Sidebar Branding & Navigation
    with st.sidebar:
        st.title("🎓 PlacePath")
        st.caption("Build Your Path. Achieve Your Goals.")
        st.divider()

        nav_items = [
            ("Dashboard", ":material/dashboard:"),
            ("Academics", ":material/school:"),
            ("Goals", ":material/flag:"),
            ("Skills", ":material/code:"),
            ("Projects", ":material/folder_special:"),
            ("Career Roadmap", ":material/map:"),
            ("Placement Preparation", ":material/work:"),
            ("Weekly Planner", ":material/calendar_view_week:"),
            ("Daily Tasks", ":material/checklist:"),
            ("Settings", ":material/settings:"),
        ]

        if "active_page" not in st.session_state:
            st.session_state["active_page"] = "Dashboard"

        for page_name, icon in nav_items:
            is_active = st.session_state["active_page"] == page_name
            if st.button(
                page_name,
                icon=icon,
                key=f"nav_{page_name}",
                type="primary" if is_active else "secondary",
                use_container_width=True,
            ):
                st.session_state["active_page"] = page_name
                st.rerun()

        st.divider()
        profile = db.get_profile()
        student_label = profile.get("full_name") or "Engineering Student"
        sem_label = f"Year {profile.get('current_year', 1)} · Sem {profile.get('current_semester', 1)}"
        st.caption(f"{student_label}\n{sem_label}")

    # Dispatch active module directly (no login/welcome screen)
    active_page = st.session_state["active_page"]
    routes = {
        "Dashboard": render_dashboard,
        "Academics": render_academics,
        "Goals": render_goals,
        "Skills": render_skills,
        "Projects": render_projects,
        "Career Roadmap": render_roadmap,
        "Placement Preparation": render_placement,
        "Weekly Planner": render_weekly_planner,
        "Daily Tasks": render_daily_tasks,
        "Settings": render_settings,
    }
    routes[active_page](db)


if __name__ == "__main__":
    main()
