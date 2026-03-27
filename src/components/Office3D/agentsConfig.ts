/**
 * Office 3D — Agent Configuration v2
 *
 * Redesigned layout: agents sit at fixed desks, walk to central round table when working.
 * The main agent is the supervisor at the back, never joins the round table.
 *
 * Agent names/emojis shown here are generic defaults.
 * The actual names and emojis are resolved at runtime from each agent's openclaw.json
 * (ui.emoji / ui.color / name fields).  These entries only supply fallback visuals
 * and 3-D positioning — they carry no personal identifying information.
 */

export interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  deskPosition: [number, number, number];   // desk furniture position
  seatPosition: [number, number, number];   // avatar idle position (in front of desk)
  tablePosition: [number, number, number];  // round table standing position (working)
  restPosition?: [number, number, number];  // lounge position for sleeping
  restRotation?: number;                    // lounge rotation when sleeping
  restPose?: 'sit' | 'lie';
  faceDirection: number;                     // idle rotation.y (face toward center)
  color: string;
  role: string;
  isMain?: boolean;
  scale?: number;                            // default 1, lobster 1.5
  // Keep legacy `position` as alias for deskPosition so AgentDesk doesn't break
  position: [number, number, number];
}

export const AGENTS: AgentConfig[] = [
  {
    id: "main",
    name: "Main Agent",
    emoji: "🤖",
    deskPosition: [0, 0, -8.8],
    seatPosition: [0, 1.0, -6.1],
    tablePosition: [0, 1.0, -2.0],   // center table — main agent also joins when working
    restPosition: [12.95, 0.42, 7.25],
    restRotation: -Math.PI / 2,
    restPose: 'lie',
    faceDirection: Math.PI, // face desk/monitor (-z direction)
    position: [0, 0, -8.8],
    color: "#8B0000",
    role: "Supervisor",
    isMain: true,
    scale: 1.5,
  },
  {
    id: "codev",
    name: "Developer",
    emoji: "💻",
    deskPosition: [-5.5, 0, -4],
    seatPosition: [-5.5, 0.62, -3.0],
    tablePosition: [-2.17, 0.6, -1.25],
    restPosition: [9.87, 0.79, 8.42],
    restRotation: Math.PI,
    restPose: 'sit',
    faceDirection: Math.atan2(5.5, 4),
    position: [-5.5, 0, -4],
    color: "#4CAF50",
    role: "Coding Agent",
  },
  {
    id: "linkedin",
    name: "Social Agent",
    emoji: "👩🏻‍💻",
    deskPosition: [5.5, 0, -4],
    seatPosition: [5.5, 0.62, -3.0],
    tablePosition: [2.17, 0.6, -1.25],
    restPosition: [11.05, 0.79, 8.42],
    restRotation: Math.PI,
    restPose: 'sit',
    faceDirection: Math.atan2(-5.5, 4),
    position: [5.5, 0, -4],
    color: "#0077B5",
    role: "Social Media",
  },
  {
    id: "baiwan",
    name: "Content Agent",
    emoji: "📣",
    deskPosition: [-5.5, 0, 3],
    seatPosition: [-5.5, 0.62, 4.0],
    tablePosition: [-2.5, 0.6, 0],
    restPosition: [12.23, 0.79, 8.42],
    restRotation: Math.PI,
    restPose: 'sit',
    faceDirection: Math.atan2(5.5, -3),
    position: [-5.5, 0, 3],
    color: "#E91E63",
    role: "Content Creator",
  },
  {
    id: "teacher",
    name: "Teacher",
    emoji: "👩🏫",
    deskPosition: [5.5, 0, 3],
    seatPosition: [5.5, 0.62, 4.0],
    tablePosition: [2.5, 0.6, 0],
    restPosition: [9.55, 0.62, 6.45],
    restRotation: 2.35,
    restPose: 'sit',
    faceDirection: Math.atan2(-5.5, -3),
    position: [5.5, 0, 3],
    color: "#9C27B0",
    role: "Teaching Agent",
  },
  {
    id: "screenshrimp",
    name: "Scanner",
    emoji: "🔍",
    deskPosition: [-3.5, 0, 6],
    seatPosition: [-3.5, 0.62, 7.0],
    tablePosition: [-1.25, 0.6, 2.17],
    restPosition: [11.1, 0.62, 5.48],
    restRotation: Math.PI,
    restPose: 'sit',
    faceDirection: Math.atan2(3.5, -6),
    position: [-3.5, 0, 6],
    color: "#FF5722",
    role: "Browse & Capture",
  },
  {
    id: "arch",
    name: "Architect",
    emoji: "🏗️",
    deskPosition: [3.5, 0, 6],
    seatPosition: [3.5, 0.62, 7.0],
    tablePosition: [1.25, 0.6, 2.17],
    restPosition: [12.85, 0.62, 6.35],
    restRotation: -2.35,
    restPose: 'sit',
    faceDirection: Math.atan2(-3.5, -6),
    position: [3.5, 0, 6],
    color: "#607D8B",
    role: "System Architecture",
  },
];

export type AgentStatus = "idle" | "working" | "thinking" | "sleeping" | "error";

export interface AgentState {
  id: string;
  status: AgentStatus;
  currentTask?: string;
  model?: string;
  sessionCount?: number;
  totalTokens?: number;
  totalMessages?: number;
  lastActivity?: string;
  recentSessions?: Array<{ id: string; task: string; time: string }>;
}
