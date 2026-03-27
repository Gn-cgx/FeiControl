# FeiControl

> 💖 A cute little mission control for your [OpenClaw](https://openclaw.ai)  ~

FeiControl is a real-time dashboard that sits alongside your OpenClaw installation. It reads agents, sessions, memory, and logs straight from the filesystem — no extra backend needed! 

> Fork from [TenacitOS](https://github.com/carlosazaustre/tenacitOS) 🙏 — see [ATTRIBUTION.md](./ATTRIBUTION.md)

---

## 🚀 Quick Start

```bash
git clone https://github.com/your-org/feicontrol.git
cd feicontrol
npm install
cp .env.example .env.local   # edit with your password & secrets ✏️
```


Then run! 

```bash
npm run dev          # dev → http://localhost:3000
# or
npm run build && npm start   # production ✨
```

> 💡 Set `OPENCLAW_DIR` in `.env.local` if your OpenClaw isn't at the default `~/.openclaw`

---

## Screenshots

**🏠 Dashboard** — greeting, system health, agent team status & daily heartbeat

![Dashboard](./docs/screenshots/dashboard.png)

**📅 Calendar** — weekly view synced with Google Calendar & Tasks

![Calendar](./docs/screenshots/calendar.png)

**🏢 3D Office** — isometric office with cherry blossoms, agent desks & real-time activity feed

![3D Office](./docs/screenshots/office-3d.png)

**🏢 3D Office — Interior** — peek inside your agents' workspace~

![3D Office Interior](./docs/screenshots/office-3d-interior.png)

**🏢 3D Office — Overview** — full team overview with status dock

![3D Office Overview](./docs/screenshots/office-3d-overview.png)

**📝 Doc Viewer** — browse & edit agent memory files (SOUL.md, TOOLS.md, etc.)

![Doc Viewer](./docs/screenshots/doc-viewer.png)

**⏰ Cron Tasks** — manage scheduled jobs with run history & manual triggers

![Cron Tasks](./docs/screenshots/cron-tasks.png)

**💰 Cost Analysis** — daily cost trends, per-agent breakdown & budget tracking

![Cost Analysis](./docs/screenshots/cost-analysis.png)

---

## Requirements

- **Node.js** 18+ (tested with v22)
- **[OpenClaw](https://openclaw.ai)** running on the same host
- **PM2** or **systemd** for production 🌸

---

## Tech Stack

| | |
|---|---|
| 🧩 Framework | Next.js 15 (App Router) |
| 🎨 UI | React 19 + Tailwind CSS v4 |
| 🌸 3D | React Three Fiber + Drei |
| 📊 Charts | Recharts |
| 🗄️ Database | SQLite (better-sqlite3) |

---

## Contributing

1. Fork & create a feature branch
2. Keep secrets in `.env.local` (gitignored~)
3. Open a PR 💌

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details!

---

## License

MIT — see [LICENSE](./LICENSE)

---

## Links

- [OpenClaw](https://openclaw.ai) 
- [OpenClaw Docs](https://docs.openclaw.ai)
- [Issues](../../issues) — bugs & feature requests
- [ATTRIBUTION.md](./ATTRIBUTION.md) — upstream credits 
