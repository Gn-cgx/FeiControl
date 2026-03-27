# Attribution

## Upstream Project

**FeiControl** is adapted from **TenacitOS**, an open-source real-time dashboard for OpenClaw AI agent instances.

| Field | Details |
|---|---|
| Upstream project | TenacitOS |
| Original author | Carlos Azaustre |
| Upstream repository | https://github.com/carlosazaustre/tenacitOS |
| License | MIT |

---

## What Was Adapted

TenacitOS provides the core dashboard architecture and feature set. FeiControl builds on that foundation with the following areas of customization and evolution:

### Retained from upstream
- Overall application architecture (Next.js App Router, React 19, Tailwind CSS v4)
- Core dashboard modules: System Monitor, Agent Dashboard, Cost Tracking, Cron Manager, Activity Feed, Memory Browser, File Browser, Global Search, Notifications, 3D Office, Terminal, Auth
- API route structure and data-file conventions
- Branding abstraction via environment variables (`src/config/branding.ts`)
- Auth middleware pattern (rate-limited login, `httpOnly` cookie)

### Customized / evolved in this fork
- Project name, branding, and deployment identity adapted for a different operator context
- Deployment configuration generalized to remove host-specific paths and service names
- Documentation rewritten for general-audience open-source release (this README, CONTRIBUTING, SECURITY, ROADMAP)
- Roadmap priorities and feature emphasis adjusted to local use-case requirements
- Agent IDs, workspace names, and 3D avatar configuration adjusted to match the local agent setup

### What this fork does NOT change
- Source code logic, component implementations, and API handlers are substantially inherited from TenacitOS
- The data model and file layout conventions follow the upstream design

---

## License Acknowledgement

Both TenacitOS (upstream) and FeiControl (this project) are released under the **MIT License**.

The MIT License permits use, copying, modification, and distribution provided that the original copyright notice is included. A copy of the license is available in [LICENSE](./LICENSE).

We gratefully acknowledge Carlos Azaustre and all TenacitOS contributors for the upstream work that made this project possible.

---

## OpenClaw

Both projects depend on **[OpenClaw](https://openclaw.ai)** as the underlying AI agent runtime.

- OpenClaw website: https://openclaw.ai
- OpenClaw documentation: https://docs.openclaw.ai
- Community Discord: https://discord.com/invite/clawd

---

*If you are building your own fork of TenacitOS or FeiControl, please maintain this attribution chain and keep a reference to the upstream projects.*
