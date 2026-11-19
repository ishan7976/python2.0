"""
Shared PlacePath visual palette and Plotly chart layout helpers.

Palette:
- Primary Blue:   #DCEEFF (Accent #0284C7)
- Pastel Pink:    #FCE4EC (Accent #DB2777)
- White:          #FFFFFF
- Background:     #F8FAFC
- Dark Text:      #1E293B
- Secondary Text: #64748B
- Soft Green:     #D1FAE5 (Accent #059669)
"""

from __future__ import annotations

import plotly.graph_objects as go
import streamlit as st

PALETTE = {
    "primary_blue": "#DCEEFF",
    "accent_blue": "#0284C7",
    "pastel_pink": "#FCE4EC",
    "accent_pink": "#DB2777",
    "white": "#FFFFFF",
    "background": "#F8FAFC",
    "dark_text": "#1E293B",
    "secondary_text": "#64748B",
    "soft_green": "#D1FAE5",
    "accent_green": "#059669",
    "amber": "#D97706",
    "crimson": "#DC2626",
    "border": "#E2E8F0",
}

PROFICIENCY_LEVEL_MAP = {
    "Beginner": 35,
    "Intermediate": 70,
    "Advanced": 100,
}

PROFICIENCY_COLOR_MAP = {
    "Beginner": "#93C5FD",
    "Intermediate": "#F472B6",
    "Advanced": "#34D399",
}


def style_plotly_figure(fig: go.Figure, height: int = 320, title: str = "") -> go.Figure:
    """Apply consistent pastel PlacePath styling to any Plotly figure."""
    fig.update_layout(
        title=dict(
            text=title,
            font=dict(size=15, color=PALETTE["dark_text"]),
            x=0.0,
            xanchor="left",
        )
        if title
        else None,
        height=height,
        margin=dict(l=16, r=16, t=42 if title else 20, b=24),
        paper_bgcolor=PALETTE["white"],
        plot_bgcolor=PALETTE["white"],
        font=dict(color=PALETTE["dark_text"], size=12),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1.0,
            bgcolor="rgba(255,255,255,0)",
        ),
        xaxis=dict(
            showgrid=False,
            linecolor=PALETTE["border"],
            tickfont=dict(color=PALETTE["secondary_text"]),
        ),
        yaxis=dict(
            gridcolor="#F1F5F9",
            zerolinecolor=PALETTE["border"],
            tickfont=dict(color=PALETTE["secondary_text"]),
        ),
    )
    return fig


def render_page_header(title: str, subtitle: str) -> None:
    """Render a clean, consistent native Streamlit page header."""
    st.title(title)
    st.caption(subtitle)
    st.divider()
