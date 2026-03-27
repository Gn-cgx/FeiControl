import { NextResponse } from "next/server";
import { readFileSync, statSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || join(homedir(), '.openclaw');

export const dynamic = "force-dynamic";

interface Agent {
  id: string;
  name?: string;
  emoji: string;
  color: string;
  model: string;
  workspace: string;
  dmPolicy?: string;
  allowAgents?: string[];
  allowAgentsDetails?: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
  }>;
  botToken?: string;
  role?: string;
  status: "online" | "offline";
  lastActivity?: string;
  activeSessions: number;
}

// Fallback config used when an agent doesn't define its own ui config in openclaw.json.
// The main agent reads name/emoji from env vars; all others fall back to generic defaults.
// Override via each agent's openclaw.json → ui.emoji / ui.color / name fields.
const DEFAULT_AGENT_CONFIG: Record<string, { emoji: string; color: string; name?: string; role?: string }> = {
  main: {
    emoji: process.env.NEXT_PUBLIC_AGENT_EMOJI || "🤖",
    color: "#ef4444",
    name: process.env.NEXT_PUBLIC_AGENT_NAME || "Main Agent",
    role: "Supervisor",
  },
  codev: {
    emoji: "💻",
    color: "#f97316",
    name: "Developer",
    role: "Coding",
  },
  linkedin: {
    emoji: "👩🏻‍💻",
    color: "#3b82f6",
    name: "Social Agent",
    role: "Social Media",
  },
  baiwan: {
    emoji: "📣",
    color: "#ec4899",
    name: "Content Agent",
    role: "Content Creation",
  },
  teacher: {
    emoji: "👩🏫",
    color: "#22c55e",
    name: "Teacher",
    role: "Education",
  },
  screenshrimp: {
    emoji: "🔍",
    color: "#eab308",
    name: "Scanner",
    role: "Security Scan",
  },
  arch: {
    emoji: "🏗️",
    color: "#a855f7",
    name: "Architect",
    role: "System Architecture",
  },
};

/**
 * Get agent display info (emoji, color, name) from openclaw.json or defaults
 */
function getAgentDisplayInfo(agentId: string, agentConfig: any): { emoji: string; color: string; name: string; role: string } {
  // First try to get from agent's own config in openclaw.json
  const configEmoji = agentConfig?.ui?.emoji;
  const configColor = agentConfig?.ui?.color;
  const configName = agentConfig?.name;

  // Then try defaults
  const defaults = DEFAULT_AGENT_CONFIG[agentId];

  return {
    emoji: configEmoji || defaults?.emoji || "🤖",
    color: configColor || defaults?.color || "#666666",
    name: configName || defaults?.name || agentId,
    role: defaults?.role || "",
  };
}

export async function GET() {
  try {
    // Read openclaw config
    const configPath = (process.env.OPENCLAW_DIR || join(homedir(), ".openclaw")) + "/openclaw.json";
    const config = JSON.parse(readFileSync(configPath, "utf-8"));

    // Get agents from config
    const agents: Agent[] = config.agents.list.map((agent: any) => {
      const agentInfo = getAgentDisplayInfo(agent.id, agent);

      // Get telegram account info
      const telegramAccount =
        config.channels?.telegram?.accounts?.[agent.id];
      const botToken = telegramAccount?.botToken;

      // Check if agent has recent activity by checking workspace memory and session files
      const agentWorkspace = agent.workspace || join(OPENCLAW_DIR, agent.id === 'main' ? 'workspace' : `workspace-${agent.id}`);
      const memoryPath = join(agentWorkspace, "memory");
      let lastActivity = undefined;
      let status: "online" | "offline" = "offline";

      try {
        const today = new Date().toISOString().split("T")[0];
        const memoryFile = join(memoryPath, `${today}.md`);
        const stat = statSync(memoryFile);
        lastActivity = stat.mtime.toISOString();
        // Consider online if activity within last 5 minutes
        status =
          Date.now() - stat.mtime.getTime() < 5 * 60 * 1000
            ? "online"
            : "offline";
      } catch {
        // No recent activity - try checking agent sessions dir
        try {
          const sessionsDir = join(OPENCLAW_DIR, 'agents', agent.id, 'sessions');
          const entries = readdirSync(sessionsDir).sort().reverse();
          if (entries.length > 0) {
            const latestSession = join(sessionsDir, entries[0]);
            const stat = statSync(latestSession);
            lastActivity = stat.mtime.toISOString();
            status = Date.now() - stat.mtime.getTime() < 5 * 60 * 1000 ? "online" : "offline";
          }
        } catch {
          // No session data either
        }
      }

      // Get details of allowed subagents
      const allowAgents = agent.subagents?.allowAgents || [];
      const allowAgentsDetails = allowAgents.map((subagentId: string) => {
        // Find subagent in config
        const subagentConfig = config.agents.list.find(
          (a: any) => a.id === subagentId
        );
        if (subagentConfig) {
          const subagentInfo = getAgentDisplayInfo(subagentId, subagentConfig);
          return {
            id: subagentId,
            name: subagentConfig.name || subagentInfo.name,
            emoji: subagentInfo.emoji,
            color: subagentInfo.color,
          };
        }
        // Fallback if subagent not found in config
        const fallbackInfo = getAgentDisplayInfo(subagentId, null);
        return {
          id: subagentId,
          name: fallbackInfo.name,
          emoji: fallbackInfo.emoji,
          color: fallbackInfo.color,
        };
      });

      return {
        id: agent.id,
        name: agentInfo.name,
        emoji: agentInfo.emoji,
        color: agentInfo.color,
        role: agentInfo.role,
        model:
          (typeof agent.model === 'string' ? agent.model : agent.model?.primary) ||
          (typeof config.agents.defaults.model === 'string' ? config.agents.defaults.model : config.agents.defaults.model?.primary) ||
          'unknown',
        workspace: agent.workspace,
        dmPolicy:
          telegramAccount?.dmPolicy ||
          config.channels?.telegram?.dmPolicy ||
          "pairing",
        allowAgents,
        allowAgentsDetails,
        botToken: botToken ? "configured" : undefined,
        status,
        lastActivity,
        activeSessions: 0, // TODO: get from sessions API
      };
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error reading agents:", error);
    return NextResponse.json(
      { error: "Failed to load agents" },
      { status: 500 }
    );
  }
}
