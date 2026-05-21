# Frontend Redesign — Design Spec

## Goal

Redesign the React frontend from a basic two-column layout into a professional dark-sidebar SaaS aesthetic, similar to Linear/Notion. All existing functionality is preserved — this is a visual overhaul only.

## Tech Stack

- React 18 + TypeScript (unchanged)
- Tailwind CSS v4 (unchanged)
- Inter font via Google Fonts (new)
- No new npm dependencies

---

## Layout

Single-page layout split into two regions:

```
┌─────────────────┬──────────────────────────────────┐
│   Sidebar       │         Main Content              │
│   (dark)        │         (light)                   │
│                 │                                   │
│  Logo + title   │   Document detail panel           │
│  Upload button  │   (tabs: Summary / Text / JSON)   │
│  Document list  │                                   │
│                 │   Empty state when none selected  │
└─────────────────┴──────────────────────────────────┘
```

- Sidebar: fixed width `w-72`, full viewport height, dark background `slate-900`
- Main content: fills remaining space, background `slate-50`
- On mobile (< md): sidebar stacks above main content

---

## Color Palette

| Token | Value | Usage |
|---|---|---|
| Sidebar bg | `slate-900` | Sidebar background |
| Sidebar border | `slate-700` | Dividers in sidebar |
| Sidebar text | `slate-300` | Secondary sidebar text |
| Sidebar text active | `white` | Active/hover text |
| Active item bg | `slate-800` | Selected document row |
| Accent | `indigo-500` | Buttons, active indicators |
| Accent hover | `indigo-600` | Button hover |
| Content bg | `slate-50` | Main area background |
| Card bg | `white` | Detail panel cards |
| Body text | `slate-800` | Primary text |
| Muted text | `slate-500` | Labels, secondary text |

---

## Typography

- Font: Inter (Google Fonts, weights 400/500/600)
- App title: `text-base font-semibold text-white`
- Section headings: `text-xs font-semibold uppercase tracking-wider text-slate-400`
- Document names: `text-sm font-medium text-white`
- Body/detail text: `text-sm text-slate-700`
- Code/pre blocks: `font-mono text-xs`

---

## Components

### `App.tsx`

Layout wrapper only — no logic changes. Renders sidebar + main content side by side.

```
<div class="flex h-screen overflow-hidden">
  <Sidebar />        ← new component
  <main>
    <DocumentDetail document={selectedDocument} />
  </main>
</div>
```

State management unchanged: `documents`, `selectedDocument`, `loading`, `fetchError`.

---

### `Sidebar.tsx` (new component)

Replaces the left column. Contains:

1. **Header** — app icon (document emoji or inline SVG) + "AI Document Analyzer" title
2. **Upload button** — full-width indigo button that opens a hidden file input. Shows drag-and-drop zone when expanded (click to open file picker, or drag a file onto the sidebar)
3. **Document list section** — "Documents" label + document list
4. **Loading/error states** inline in the sidebar

Props: `documents`, `selectedId`, `onSelect`, `onUploadComplete`, `loading`, `fetchError`

The `UploadForm` logic (file validation, upload API call, loading state) moves into `Sidebar.tsx`. The standalone `UploadForm.tsx` is removed.

---

### `UploadZone` (inline in Sidebar.tsx)

Replaces the plain file input. A styled drop zone:

```
┌──────────────────────────┐
│  ↑  Drop file here or    │
│     click to browse      │
│  PDF, PNG, JPG           │
└──────────────────────────┘
```

- Border: `border-2 border-dashed border-slate-600`
- Drag-over state: border changes to `border-indigo-400`, background `slate-800`
- Error message shown in red below the zone
- Loading: button/zone shows spinner + "Uploading…" and is disabled

File validation logic unchanged: `['application/pdf', 'image/png', 'image/jpeg']`

---

### `DocumentList.tsx`

Updated styling only — same props and logic.

Each row:
```
┌──────────────────────────────┐
│ 📄 filename.pdf    ● DONE   │
│    May 21, 2026              │
└──────────────────────────────┘
```

- Background: transparent, hover `slate-800`, selected `slate-800` with left `border-l-2 border-indigo-400`
- File name: `text-sm font-medium text-white truncate`
- Date: `text-xs text-slate-400`
- Status badge: pill with dot indicator (see Status Badges below)

---

### Status Badges

| Status | Dot color | Text color | Label |
|---|---|---|---|
| PENDING | `yellow-400` | `yellow-300` | Pending |
| PROCESSING | `blue-400` | `blue-300` | Processing |
| COMPLETED | `green-400` | `green-300` | Done |
| FAILED | `red-400` | `red-300` | Failed |

Badge format: `● LABEL` (colored dot + text, no background pill — keeps sidebar clean)

---

### `DocumentDetail.tsx`

Updated to use a tabbed layout with three tabs: **Summary**, **Extracted Text**, **Structured Data**.

- Tabs only shown when document is selected and status is COMPLETED
- FAILED status: shows a red alert card instead of tabs
- PENDING/PROCESSING: shows a subtle "Analysis in progress…" state with a spinner
- No document selected: centered empty state with icon and helper text

Tab content:
- **Summary** — `<p>` with `text-sm text-slate-700 leading-relaxed`
- **Extracted Text** — scrollable `<pre>` block, max height `400px`, monospace
- **Structured Data** — syntax-highlighted JSON in a `<pre>` block, same max height

Active tab indicator: bottom border `border-b-2 border-indigo-500`, text `text-indigo-600`

---

## Empty States

| State | Message |
|---|---|
| No document selected | "Select a document from the sidebar to view its analysis" |
| No documents uploaded yet | "No documents yet. Upload one to get started." |
| Loading documents | Skeleton shimmer rows (3 rows, animated pulse) |

---

## Drag and Drop

- Drag a file over the sidebar → highlight the upload zone
- Drop → trigger same validation + upload flow as clicking
- Uses `onDragOver`, `onDragLeave`, `onDrop` events on the upload zone div
- No external drag-and-drop library needed

---

## Files Changed

| File | Change |
|---|---|
| `src/App.tsx` | Layout rewrite — sidebar + main split |
| `src/components/Sidebar.tsx` | New component — contains upload zone + document list |
| `src/components/DocumentList.tsx` | Styling update only |
| `src/components/DocumentDetail.tsx` | Tabbed layout, status states |
| `src/components/UploadForm.tsx` | Deleted — logic absorbed into Sidebar.tsx |
| `src/index.css` | Add Inter font import |
| `src/components/UploadForm.test.tsx` | Updated — test upload logic via Sidebar |

---

## Testing

- `UploadForm.test.tsx` → `Sidebar.test.tsx`: test file validation, upload, error display
- `DocumentList.test.tsx`: update selectors for new class names, logic unchanged
- `DocumentDetail.test.tsx`: update for tabbed layout — click tab then assert content visible
- `App.test.tsx`: update for new layout structure
