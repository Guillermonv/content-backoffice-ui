# Content Backoffice UI

Internal admin panel for managing workflows, agents, steps, executions, and content reviews.

**Stack**: React 18 · Vite · React Router v6 · Single CSS file

---

## Setup

```bash
npm install
```

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_API_TOKEN=your_token_here
```

```bash
npm run dev      # development server
npm run build    # production build
npm run preview  # preview production build
```

---

## Pages

### Home
Welcome screen.

---

### Workflows
Manage workflow definitions — create, enable/disable, edit, delete.

![Workflows page](docs/screenshots/workflows.png)

**Features**
- Toggle enabled/disabled with optimistic update
- Inline edit (name, description, enabled flag)
- Create new workflow via inline form

---

### Agents
Manage AI agent credentials (provider + secret).

![Agents page](docs/screenshots/agents.png)

**Features**
- Secret masked as `••••••••••` in display mode
- Inline create and edit

---

### Steps
Configure workflow steps — operation type, agent, prompt.

![Steps page](docs/screenshots/steps.png)

**Features**
- Expandable row shows prompt text
- Inline edit with workflow and agent selects
- Create new step via inline form

---

### Executions
View grouped step execution history with status tracking.

![Executions page](docs/screenshots/executions.png)

**Features**
- Grouped by execution ID — expand to see individual step results
- Expand all / collapse all
- Filters: status, workflow, execution ID, date range
- Truncated output with click-to-expand per step

---

### Content Review
Review and moderate AI-generated content items.

![Content Review page](docs/screenshots/content-review.png)

**Features**
- Status flow: `PENDING` → ✅ `DONE` → 🚫 `CANCELLED` → ✅ `DONE`
- Inline edit (title, description, message, category, sub-category)
- Expandable row shows full message
- Filters: status, execution ID, category, date range

---

## Architecture

```
src/
  App.jsx              # Root layout — Sidebar + content area
  main.jsx             # Entry point
  style.css            # All styles (single file, CSS variables)
  components/
    Sidebar.jsx        # Collapsible sidebar with SVG icons
  pages/
    Home.jsx
    Workflows.jsx
    Agents.jsx
    Steps.jsx
    Executions.jsx
    ContentReview.jsx
```

### Sidebar
Collapsible — click the arrow to toggle between full (220px) and icon-only (64px) mode. State is local to the component, resets on refresh.

### Tables
All tables use resizable columns (`ResizableTH` — DOM-based, resets on refresh). Filter controls always render in a single row (`flex-wrap: nowrap`).

### Styling
Single `style.css` with CSS custom properties (`--primary`, `--bg`, `--border`, etc.). Font: Inter (Google Fonts). No external UI libraries.

---

## Adding screenshots

Place screenshots in `docs/screenshots/`:

```
docs/screenshots/
  workflows.png
  agents.png
  steps.png
  executions.png
  content-review.png
```

To regenerate them, run `npm run dev` and execute:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT="docs/screenshots"
for page in workflows agents steps executions; do
  "$CHROME" --headless --disable-gpu --window-size=1440,900 \
    --screenshot="$OUT/$page.png" "http://localhost:5173/$page"
done
"$CHROME" --headless --disable-gpu --window-size=1440,900 \
  --screenshot="$OUT/content-review.png" "http://localhost:5173/contentReview"
```
