#!/usr/bin/env bash
# ============================================================================
#  start.sh — Diverse Persona Generator Startup Script
# ============================================================================
#  Starts the Diverse Persona Generator Vite development server with dependency checks.
#
#  Works on: macOS, Linux (Ubuntu/Debian/Fedora/Arch), Windows (WSL/Git Bash)
#
#  Usage:
#    chmod +x start.sh    ← (first time only)
#    ./start.sh            ← run it
#
#  For Windows without WSL or Git Bash, see start.ps1
# ============================================================================

set -euo pipefail

# --- Configuration -----------------------------------------------------------
APP_NAME="Diverse Persona Generator"
APP_PORT=4321
APP_START_CMD="pnpm run dev"

# --- Colors & Formatting -----------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

step_num=0
step() {
    step_num=$((step_num + 1))
    echo ""
    echo -e "${BLUE}${BOLD}[Step ${step_num}]${NC} ${BOLD}$1${NC}"
    echo -e "${DIM}$(printf '%.0s─' {1..60})${NC}"
}

info()    { echo -e "  ${CYAN}ℹ${NC}  $1"; }
success() { echo -e "  ${GREEN}✓${NC}  $1"; }
warn()    { echo -e "  ${YELLOW}⚠${NC}  $1"; }
fail()    { echo -e "  ${RED}✗${NC}  $1"; exit 1; }

# --- Banner -------------------------------------------------------------------
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║${NC}  ${CYAN}${BOLD}${APP_NAME}${NC} — Startup Script                        ${BOLD}║${NC}"
echo -e "${BOLD}║${NC}  ${DIM}Research-to-Product: Persona Generators${NC}            ${BOLD}║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"

# --- Step 1: Detect OS --------------------------------------------------------
step "Detecting operating system"

OS="unknown"
ARCH="$(uname -m)"

case "$(uname -s)" in
    Linux*)
        if grep -qi microsoft /proc/version 2>/dev/null; then
            OS="wsl"
            info "Detected: Windows Subsystem for Linux (WSL)"
        else
            OS="linux"
            if [ -f /etc/os-release ]; then
                . /etc/os-release
                info "Detected: Linux ($NAME $VERSION_ID) — $ARCH"
            else
                info "Detected: Linux — $ARCH"
            fi
        fi
        ;;
    Darwin*)
        OS="macos"
        info "Detected: macOS — $ARCH"
        ;;
    CYGWIN*|MINGW*|MSYS*)
        OS="windows-bash"
        info "Detected: Windows (Git Bash/MSYS2) — $ARCH"
        ;;
    *)
        fail "Unsupported operating system: $(uname -s). Use WSL on Windows."
        ;;
esac

success "OS detection complete"

# --- Step 2: Check Node.js installation ----------------------------------------
step "Checking Node.js environment"

if command -v node &>/dev/null; then
    NODE_VERSION=$(node --version)
    success "Node.js found: $NODE_VERSION"

    # Check minimum version (Node 20+ recommended for Vite 8)
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 20 ]; then
        warn "Node.js $NODE_MAJOR detected. Vite 8 works best with Node 20+."
        warn "Consider upgrading: https://nodejs.org/"
    fi
else
    fail "Node.js not found. Please install Node.js 20+ from https://nodejs.org/"
fi

# --- Step 3: Install pnpm if missing ------------------------------------------
step "Checking package manager"

if command -v pnpm &>/dev/null; then
    success "pnpm found: $(pnpm --version)"
else
    info "pnpm not found. Installing..."
    if command -v corepack &>/dev/null; then
        corepack enable
        corepack prepare pnpm@latest --activate 2>/dev/null || npm install -g pnpm
    else
        npm install -g pnpm
    fi

    if command -v pnpm &>/dev/null; then
        success "pnpm installed: $(pnpm --version)"
    else
        fail "pnpm installation failed. Try: npm install -g pnpm"
    fi
fi

# --- Step 4: Install dependencies -----------------------------------------------
step "Installing dependencies"

if [ -f "pnpm-lock.yaml" ]; then
    info "Lock file found: pnpm-lock.yaml"
    pnpm install --frozen-lockfile 2>/dev/null || pnpm install
elif [ -f "package-lock.json" ]; then
    warn "package-lock.json found. Migrating to pnpm..."
    pnpm import 2>/dev/null || true
    pnpm install
    success "Migrated to pnpm. You can delete package-lock.json"
else
    info "No lock file found. Installing with pnpm..."
    pnpm install
    info "Generated pnpm-lock.yaml — commit this to version control"
fi

success "Dependencies installed"

# --- Step 5: Verify project structure -----------------------------------------
step "Verifying project structure"

REQUIRED_FILES=("index.html" "vite.config.ts" "src/App.tsx" "src/main.tsx")
MISSING=false

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        info "Found: $file"
    else
        fail "Missing required file: $file"
        MISSING=true
    fi
done

if [ "$MISSING" = false ]; then
    success "Project structure looks good"
fi

# --- Step 6: Check if port is already in use -----------------------------------
step "Checking port $APP_PORT"

if command -v lsof &>/dev/null; then
    PORT_PID=$(lsof -ti :"$APP_PORT" 2>/dev/null || true)
elif command -v ss &>/dev/null; then
    PORT_PID=$(ss -tlnp "sport = :$APP_PORT" 2>/dev/null | grep -oP 'pid=\K[0-9]+' || true)
elif command -v netstat &>/dev/null; then
    PORT_PID=$(netstat -ano 2>/dev/null | grep ":$APP_PORT" | grep "LISTENING" | awk '{print $5}' | head -1 || true)
fi

if [ -n "${PORT_PID:-}" ]; then
    warn "Port $APP_PORT is already in use (PID: $PORT_PID)"
    warn "Run ./stop.sh first, or the new server may fail to start"
    echo ""
    read -rp "Continue anyway? [y/N] " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        info "Aborting. Run ./stop.sh to free the port, then try again."
        exit 0
    fi
else
    success "Port $APP_PORT is available"
fi

# --- Step 7: Save runtime config for stop.sh ----------------------------------
step "Saving runtime configuration"

cat > .run.env << EOF
# Auto-generated by start.sh — do not edit manually
APP_PORT=${APP_PORT}
APP_NAME="${APP_NAME}"
APP_PID=$$
STARTED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PROJECT_TYPE=node
EOF

success "Runtime config saved to .run.env"
info "Add .run.env to your .gitignore"

# --- Step 8: Start the application --------------------------------------------
step "Starting ${APP_NAME}"

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║${NC}  ${GREEN}${BOLD}${APP_NAME} is starting...${NC}                          ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║${NC}  ${DIM}Command: ${APP_START_CMD}${NC}"
echo -e "${GREEN}${BOLD}║${NC}  ${DIM}Port:    http://localhost:${APP_PORT}${NC}"
echo -e "${GREEN}${BOLD}║${NC}  ${DIM}Stop:    ./stop.sh${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Run the app
exec $APP_START_CMD