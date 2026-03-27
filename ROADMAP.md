# FeiControl — Roadmap

This document describes the planned feature development for FeiControl. Items are organized by theme and priority tier. Checked items are already implemented in the current release.

---

## ✅ Already Implemented

### Core Dashboard
- [x] Real-time host metrics (CPU, RAM, Disk, Network) + PM2/Docker status
- [x] Agent dashboard with status, model, session count, and token usage
- [x] Cost tracking with daily trends and per-agent breakdown (SQLite)
- [x] Activity feed with heatmap and chart views

### Cron Manager
- [x] List all scheduled jobs with status
- [x] Enable / disable individual jobs
- [x] Delete jobs with confirmation
- [x] Manually trigger a job ("Run Now")
- [x] Inline run history per job
- [x] Weekly timeline view — 7-day calendar with jobs positioned by time, interval jobs shown as recurring

### Session History
- [x] List all OpenClaw sessions (main, cron, sub-agent, direct)
- [x] Visual type badges and filter tabs
- [x] Token usage with context-window progress bar and color coding
- [x] Model badge display
- [x] Relative timestamps ("2 hours ago")
- [x] Transcript viewer with message bubbles (user / assistant / tool calls)
- [x] Search and filter by key / model
- [x] Stats summary cards

### Notifications
- [x] REST API for notification CRUD (`GET / POST / PATCH / DELETE /api/notifications`)
- [x] Bell icon with unread badge in top bar
- [x] Notification types: info, success, warning, error
- [x] Mark as read / mark all read / delete
- [x] Internal link support
- [x] Auto-refresh polling
- [x] Cron "Run Now" generates a notification

### 3D Office
- [x] 3D office environment with one desk per agent (React Three Fiber)
- [x] Colored voxel avatars, custom GLB support
- [x] Click desk → agent activity panel
- [x] Status indicator per desk (Working / Idle / Error)

### Auth & Security
- [x] Password-protected with rate-limited login (5 attempts → 15-min lockout)
- [x] Auth middleware on all routes
- [x] `httpOnly` + `secure` cookie in production
- [x] Terminal with strict command allowlist

---

## 🔜 Near-term (next release)

### Cron Manager — remaining items
- [ ] Visual cron builder: frequency selector, next-5-runs preview, timezone picker
- [ ] Pre-built job templates
- [ ] Filter run history by date and status
- [ ] Full output log for each run

### Memory Browser
- [ ] File tree view of `memory/*.md` and workspace files
- [ ] Markdown editor with live preview
- [ ] Create / rename / delete files
- [ ] Full-text search within files

### File Browser
- [ ] Full workspace file explorer
- [ ] File preview (code, markdown, JSON)
- [ ] Download and upload

### Activity Logger Integration
- [ ] `POST /api/activities` endpoint for agent-side event emission
- [ ] Structured fields: timestamp, type, description, status, duration, tokens used
- [ ] 30-day rolling retention

---

## 🗓️ Medium-term

### Analytics
- [ ] Token consumption charts per model (input / output / cache breakdown)
- [ ] Hourly activity heatmap (24 × 7 grid)
- [ ] Period-over-period comparison ("this week vs last week")
- [ ] Monthly cost projection

### Quick Actions Hub
- [ ] One-click buttons for common operations: workspace backup, dependency audit, integration test, gateway restart
- [ ] Last-run timestamp and next scheduled time per action
- [ ] Confirmation dialog before destructive actions

### Sub-Agent Dashboard
- [ ] Live list of active sub-agents with status (running / waiting / completed / failed)
- [ ] Per-agent task description and token consumption
- [ ] Spawn / completion timeline

---

## 🔭 Longer-term

### Real-time Updates
- [ ] Server-Sent Events (SSE) or WebSocket connection for live activity feed
- [ ] "Agent is working…" indicator
- [ ] Live toast notifications

### Knowledge Graph Viewer
- [ ] Visual graph of concepts and entities from agent memory files
- [ ] Interactive node/link exploration with topic clustering
- [ ] Full-text search within graph

### Model Playground
- [ ] Side-by-side prompt comparison across multiple models
- [ ] Token count and cost display per response
- [ ] Save and share experiment results

### Smart Suggestions
- [ ] Usage pattern analysis to surface optimization recommendations
- [ ] Dismissible suggestion cards with "apply" actions

### 3D Office — extensions
- [ ] Animated avatar states (typing, thinking, error)
- [ ] Sub-agent "visitor" appearances with parent–child trail
- [ ] Ambient sound (toggleable)
- [ ] Multi-floor building: main office, server room, archive, control tower
- [ ] Visual themes (modern, retro, cyberpunk)

### Collaboration (future)
- [ ] Shareable activity reports (PDF export, read-only link)
- [ ] Multi-user support with per-user permissions

---

## Tech Stack Direction

| Layer | Current | Future |
|---|---|---|
| Frontend | Next.js 15 + React 19 + Tailwind v4 | — |
| Charts | Recharts | + D3.js for advanced viz |
| 3D | React Three Fiber | — |
| Real-time | Polling | SSE → WebSocket |
| Storage | JSON files + SQLite | → PostgreSQL (multi-user) |
| Editor | — | Monaco (code) + TipTap (markdown) |
| PDF | — | jsPDF or Puppeteer |

---

## Priority Summary

| Tier | Focus |
|---|---|
| **Now** | Cron builder, Memory Browser, Activity Logger integration |
| **Next** | Analytics, Quick Actions, Sub-agent visibility |
| **Later** | Real-time, Knowledge Graph, 3D extensions |
| **Future** | Collaboration, multi-user |

---

*Have an idea or want to help? Open an issue or see [CONTRIBUTING.md](./CONTRIBUTING.md).*
