# Content Backoffice UI — Claude Context

## Stack

- **React 18** + **Vite** (no TypeScript)
- **React Router v6** — client-side routing
- **Single CSS file**: `src/style.css` — all styles live here, no CSS modules, no Tailwind
- **No external UI libraries** — everything custom
- **API**: REST, consumed via `fetch`. Base URL and token from env vars (`VITE_API_BASE_URL`, `VITE_API_TOKEN`)

## Project structure

```
src/
  App.jsx                  # Root layout: Sidebar + Routes
  main.jsx
  style.css                # Single source of truth for all styles
  components/
    Sidebar.jsx            # Collapsible sidebar with SVG icons
  pages/
    Home.jsx
    Workflows.jsx
    Agents.jsx
    Steps.jsx
    Executions.jsx
    ContentReview.jsx
```

## CSS conventions

- All colors use CSS variables defined in `:root` (see `style.css`)
- **Never add inline styles** for things already covered by a CSS class
- **Never duplicate** class definitions — check `style.css` before adding a new class
- Font: **Inter** (imported from Google Fonts)
- Design tokens: `--primary`, `--bg`, `--white`, `--border`, `--text`, `--text-muted`, `--radius`, `--shadow`, etc.

## Resizable columns — mandatory pattern

Every table must use `ResizableTH` for all data columns. The pattern is DOM-based (direct mutation, no React state), resets on page refresh. Copy this exactly — do not deviate:

```jsx
const startResize = (th) => (e) => {
  e.preventDefault()
  const startX = e.clientX
  const startWidth = th.offsetWidth
  const onMouseMove = (e) => {
    const newWidth = Math.max(60, startWidth + (e.clientX - startX))
    th.style.width = `${newWidth}px`
  }
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

const ResizableTH = ({ children, style }) => (
  <th style={style}>
    {children}
    <div className="col-resizer" onMouseDown={(e) => startResize(e.currentTarget.parentElement)(e)} />
  </th>
)
```

First column (expand toggle) stays as plain `<th style={{ width: '40px' }} />`.

## API patterns

- **Always send the full row** on PUT requests to avoid backend wiping fields:
  ```js
  body: JSON.stringify({ ...row, status: newStatus })
  ```
- **Merge server response with local state** when the server returns partial fields:
  ```js
  setRows(prev => {
    const prevMap = new Map(prev.map(r => [r.id, r]))
    return (json.data || []).map(r => ({ ...prevMap.get(r.id), ...r }))
  })
  ```

## Sidebar

- Collapsible: `useState(false)` in `Sidebar.jsx`, toggles `sidebar-collapsed` class
- Collapsed width: `64px` (icons only) — expanded: `220px` (icons + labels)
- Uses SVG icons inline, `NavLink` with `active` class

---

# Spec-Driven Development

## How we work with specs

All non-trivial features start as a spec **before** any code is written. The workflow is:

```
1. Write spec  →  2. Review & approve  →  3. Implement  →  4. Verify against spec
```

Never skip step 1 for anything that touches layout, a new page, a new filter, or a state flow change. Simple one-liner fixes don't need a spec.

## Spec file location

```
docs/specs/
  SPEC-001-filter-bar.md
  SPEC-002-content-review-status-flow.md
  SPEC-003-<slug>.md
```

Each spec lives in its own file. File name = `SPEC-NNN-short-slug.md`. Never put two specs in one file.

## Spec template

Every spec must follow this structure — no exceptions:

```markdown
# SPEC-NNN — Title

## Status
Draft | Ready | Implementing | Done

## Problem
One paragraph. What is broken or missing and why it matters.

## Goal
One sentence. What success looks like from the user's perspective.

## Requirements
Numbered list. Each item must be verifiable (yes/no testable).

1. ...
2. ...

## Out of scope
What this spec explicitly does NOT cover.

## Design notes
Wireframe, CSS class names, component changes, API contract — whatever is needed to implement without ambiguity.

## Acceptance criteria
Checklist. All items must be checked before marking spec as Done.

- [ ] ...
- [ ] ...
```

## Rules for writing specs

- **Requirements must be verifiable** — "looks good" is not a requirement; "filter bar renders in a single row at 1280px viewport" is
- **One concern per spec** — don't mix a layout fix with a new feature in the same spec
- **Design notes are mandatory** for anything touching CSS or component structure — include the exact class names and DOM structure expected
- **Out of scope is mandatory** — explicitly name what you're not doing to prevent scope creep
- **Status must be kept current** — update it as work progresses; a spec stuck on "Implementing" for more than one session needs a note explaining why

## Rules for implementing from a spec

- Read the full spec before touching any code
- If a requirement is ambiguous, clarify it in the spec first — don't interpret and implement
- Check every acceptance criterion before marking Done
- If implementation reveals the spec was wrong, update the spec and note the change with a comment — never silently deviate

## Spec status lifecycle

| Status | Meaning |
|--------|---------|
| `Draft` | Being written, not ready to implement |
| `Ready` | Approved, implementation can start |
| `Implementing` | In progress |
| `Done` | All acceptance criteria met |
| `Cancelled` | Won't be implemented — reason noted in spec |

---

# Specs

## UI Requirements

### 1. Filter bar — always single row
- All filter/pagination controls must fit in **one row** — no wrapping ever
- CSS rule: `.steps-header { flex-wrap: nowrap; overflow-x: auto; }`
- Keep filter controls compact: selects `min-width: 130px`, inputs `height: 30px`
- If adding new filters, ensure they remain in the same row; reduce widths if needed

### 2. Resizable columns
- Every page with a table must have resizable columns via `ResizableTH`
- Columns reset to default width on page refresh (DOM-based, not persisted)

### 3. Status display
- Use pill badges (`.status` + `.status-green/red/yellow`) — never plain text for status fields
- Status color mapping:
  - `PUBLISHED`, `SUCCESS`, `APPROVED` → green
  - `ERROR`, `FAILED`, `CANCELLED` → red
  - Everything else (including empty) → yellow / pending

### 4. ContentReview status flow
- `PENDING / ERROR / CANCELLED` → show ✅ button → sets status to `PUBLISHED`
- `PUBLISHED` → show 🚫 button → sets status to `CANCELLED`
- Filter dropdown must include: `All Status`, `PUBLISHED`, `ERROR`, `PENDING`, `CANCELLED`

### 5. Pagination
- Always: `«` first, `‹` prev, `›` next, `»` last + page size select + `page / total` info
- Changing page or page size must **not** lose row data (use merge strategy above)
- Pagination buttons use `.btn-primary` styled to match sidebar (dark navy)

### 6. Table rows
- Compact padding: `6px 12px` on `td`, `8px 12px` on `th`
- Hover: subtle `#f8fafc` background
- Active/selected row: `#eff6ff` (light blue)
- Editing row: `#fffbeb` (light yellow)

### 7. Editor / forms
- Use `.editor` class for inline edit forms
- Labels are uppercase, small, muted
- Inputs use `var(--bg)` background, switch to white on focus

## Out of scope / not to add
- No external component libraries (no MUI, no Ant Design, no Chakra)
- No TypeScript migration
- No CSS modules or styled-components
- No server-side rendering
