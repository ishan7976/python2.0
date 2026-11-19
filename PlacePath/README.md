# PlacePath

**Build Your Path. Achieve Your Goals.**

PlacePath is a local-first, Python-only student career and academic command center built for engineering students using **Python**, **Streamlit**, **SQLite**, **Plotly**, and **Pandas**.

## Features

1. **Dashboard** — Live SQLite-backed student overview, 8 KPI cards, SGPA trend, weekly productivity chart, and upcoming deadlines across all modules.
2. **Academics** — Full 8-semester tracking, credit tracking, weighted CGPA (`Sum(SGPA × Credits) / Sum(Credits)`) over completed semesters only, and missing-credit detection.
3. **Goals** — Academic, Technical, Career, and Personal goal tracking with priorities, progress bars, overdue alerts, search, filters, and deadline sorting.
4. **Skills** — Technical skill catalog across 8 categories with Beginner/Intermediate/Advanced proficiency mapping and analytics.
5. **Projects** — Engineering portfolio with validated GitHub and live URLs, stack tags, dates, and status tracking.
6. **Career Roadmap** — Interactive 4-year engineering milestone roadmap (Foundations, Development, Professional Growth, Placement and Career) with custom milestones, deadlines, and notes.
7. **Placement Preparation** — 7-track preparation planner (Aptitude, DSA, Coding, Technical Interview, HR Interview, Resume, Communication) plus a Company Application Tracker.
8. **Weekly Planner** — Plan weekly College, Coding, DSA, Project, Placement, and Personal activities with completion rate visualizations.
9. **Daily Tasks** — Execute today's tasks by default, or inspect previous days and upcoming dates.
10. **Settings** — Editable student profile, per-module CSV exports, consistent SQLite `.db` backups, and confirmation-gated data reset.

## One-Click Launch

### Windows
Double-click `run.bat` (or run `run.bat` from Command Prompt).

### Linux / macOS
```bash
chmod +x run.sh
./run.sh
```

Both launchers automatically:
- Verify Python 3.10+ is installed
- Create a local `.venv` virtual environment if needed
- Install packages from `requirements.txt`
- Launch Streamlit and open PlacePath directly in your default browser

## Running Tests

```bash
python3 -m unittest discover -s tests -v
```

## Project Structure

```text
PlacePath/
├── app.py
├── database.py
├── requirements.txt
├── run.bat
├── run.sh
├── README.md
├── .streamlit/
│   └── config.toml
├── modules/
│   ├── dashboard.py
│   ├── academics.py
│   ├── goals.py
│   ├── skills.py
│   ├── projects.py
│   ├── roadmap.py
│   ├── placement.py
│   ├── weekly_planner.py
│   ├── daily_tasks.py
│   └── settings.py
├── utils/
│   ├── calculations.py
│   ├── validation.py
│   ├── exports.py
│   └── theme.py
└── tests/
    └── test_placepath.py
```

## Data Persistence

All records are stored locally in `data/placepath.db` (SQLite). Restarting PlacePath never deletes or resets your records.
