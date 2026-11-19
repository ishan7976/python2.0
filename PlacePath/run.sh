#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================================"
echo "  PlacePath — Student Career & Academic Command Center"
echo "  Build Your Path. Achieve Your Goals."
echo "============================================================"
echo ""

# 1. Detect Python 3
PYTHON_BIN=""
if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "[ERROR] Python 3.10+ is required but was not found."
  echo "Install Python 3 using your package manager (e.g., sudo apt install python3 python3-venv python3-pip)."
  exit 1
fi

echo "[OK] Using $($PYTHON_BIN --version)"

# Verify Python >= 3.10
if ! "$PYTHON_BIN" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)'; then
  echo "[ERROR] Python 3.10 or newer is required."
  exit 1
fi

# 2. Create virtual environment if missing
if [ ! -x ".venv/bin/python" ]; then
  echo "[INFO] Creating local virtual environment in .venv..."
  if ! "$PYTHON_BIN" -m venv .venv; then
    echo "[ERROR] Could not create virtual environment. On Debian/Ubuntu run: sudo apt install python3-venv"
    exit 1
  fi
fi

VENV_PY=".venv/bin/python"

# 3. Install dependencies if missing
if ! "$VENV_PY" -c "import streamlit, plotly, pandas" >/dev/null 2>&1; then
  echo "[INFO] Installing required dependencies from requirements.txt..."
  "$VENV_PY" -m pip install --upgrade pip >/dev/null 2>&1 || true
  "$VENV_PY" -m pip install -r requirements.txt
else
  echo "[OK] Dependencies already installed."
fi

# 4. Launch Streamlit and open browser automatically
echo ""
echo "[INFO] Starting PlacePath on http://localhost:8501 ..."
echo "[INFO] Press Ctrl+C to stop."
echo ""

# Attempt to open browser cleanly on Linux/macOS if Streamlit headless is suppressed
(
  sleep 2
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:8501" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open "http://localhost:8501" >/dev/null 2>&1 || true
  fi
) &

exec "$VENV_PY" -m streamlit run app.py --server.port=8501 --server.headless=true --browser.gatherUsageStats=false
