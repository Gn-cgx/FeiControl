import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const dynamic = "force-dynamic";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || path.join(os.homedir(), ".openclaw");
const WORKSPACE_DIR = path.join(OPENCLAW_DIR, "workspace");

function safeRead(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function safeJson(filePath: string): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return {};
  }
}

/**
 * Get cron heartbeat status: which jobs ran today, any failures
 */
function getCronHeartbeat() {
  const jobs = safeJson(path.join(OPENCLAW_DIR, "cron", "jobs.json")) as { jobs?: Array<Record<string, unknown>> };
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const results = [];
  let totalRuns = 0;
  let totalFailures = 0;
  let ranToday = 0;

  for (const job of jobs.jobs || []) {
    const state = (job.state || {}) as Record<string, unknown>;
    const schedule = (job.schedule || {}) as Record<string, unknown>;
    const lastRunMs = state.lastRunAtMs as number | undefined;
    const nextRunMs = (state.nextRunAtMs as number) || 0;
    const didRunToday = lastRunMs ? lastRunMs >= todayStart : false;
    if (didRunToday) ranToday++;
    totalRuns += (state.totalRuns as number) || 0;
    totalFailures += (state.totalFailures as number) || 0;

    // Determine frequency for sorting: 0=daily cron, 1=weekly cron, 2=one-time (at)
    let freq = 2;
    if (schedule.kind === "cron") {
      const expr = (schedule.expr as string) || "";
      // Daily: ends with "* * *" (every day)
      if (/\*\s+\*\s+\*\s*$/.test(expr)) freq = 0;
      // Weekly or other periodic cron
      else freq = 1;
    } else if (schedule.kind === "every") {
      freq = 0;
    }

    results.push({
      name: job.name as string,
      enabled: job.enabled as boolean,
      lastRun: lastRunMs ? new Date(lastRunMs).toISOString() : null,
      didRunToday,
      failures: (state.totalFailures as number) || 0,
      freq,
      nextRunMs,
    });
  }

  // Sort: daily first, then weekly, then one-time; within same freq, by nextRunMs ascending
  results.sort((a, b) => a.freq !== b.freq ? a.freq - b.freq : a.nextRunMs - b.nextRunMs);

  return { jobs: results, totalJobs: results.length, ranToday, totalRuns, totalFailures };
}

/**
 * Get yesterday's daily summary from /workspace/diary/
 */
function parseSummarySections(content: string) {
  const sections: Array<{ title: string; items: string[] }> = [];
  let currentSection: { title: string; items: string[] } | null = null;

  for (const line of content.split("\n")) {
    if (line.startsWith("## ")) {
      if (currentSection && currentSection.items.length > 0) sections.push(currentSection);
      currentSection = { title: line.replace(/^##\s*/, "").trim(), items: [] };
      continue;
    }
    if (line.startsWith("---") || line.startsWith("_by")) continue;
    if (line.startsWith("<!--")) continue;
    if (currentSection && line.startsWith("- ") && line.trim().length > 2) {
      currentSection.items.push(line.replace(/^-\s*/, "").trim());
    }
  }
  if (currentSection && currentSection.items.length > 0) sections.push(currentSection);

  return sections;
}

function getYesterdayMemory() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  const summaryFile = path.join(WORKSPACE_DIR, "diary", `${dateStr}.md`);
  const content = safeRead(summaryFile);

  if (content) {
    return {
      requestedDate: dateStr,
      date: dateStr,
      available: true,
      isFallback: false,
      sections: parseSummarySections(content),
    };
  }

  return { requestedDate: dateStr, date: dateStr, available: false, isFallback: false, sections: [] };
}

/**
 * Get self-evolution status and morning briefing info
 */
function getEvolutionStatus() {
  const statusContent = safeRead(path.join(WORKSPACE_DIR, "memory", "evolution-status.md"));
  const heartbeat = safeJson(path.join(WORKSPACE_DIR, "memory", "heartbeat-state.json"));
  const skillGaps = safeRead(path.join(WORKSPACE_DIR, "memory", "skill-gaps.md"));

  // Parse improvement items from evolution-status.md
  const improvements: Array<{ title: string; priority: string }> = [];
  const recommendations: Array<{ name: string; type: string }> = [];

  if (statusContent) {
    const lines = statusContent.split("\n");
    let inImprovements = false;
    let inRecommendations = false;

    for (const line of lines) {
      // These keywords must match the section headers in your Markdown files
      if (line.includes("Improvements")) { inImprovements = true; inRecommendations = false; continue; }
      if (line.includes("Recommended Assets")) { inRecommendations = true; inImprovements = false; continue; }
      if (line.includes("Installed Records") || line.includes("Last Updated")) { inImprovements = false; inRecommendations = false; continue; }

      if (inImprovements) {
        const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s*—\s*(.+)/);
        if (match) {
          // Priority keywords must match those used in your Markdown files
          const priorityMatch = line.match(/Priority:\s*(High|Medium|Low)/i);
          improvements.push({ title: match[1], priority: priorityMatch ? priorityMatch[1] : "Medium" });
        }
      }

      if (inRecommendations) {
        const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s+\((\w+)\)/);
        if (match) {
          recommendations.push({ name: match[1], type: match[2] });
        }
      }
    }
  }

  // Count today's skill gaps
  const todayStr = new Date().toISOString().split("T")[0];
  const todayGaps = skillGaps.split("\n").filter((l) => l.includes(`[${todayStr}]`)).length;

  // Get installed skills
  const skillsDir = path.join(WORKSPACE_DIR, "skills");
  let skills: string[] = [];
  try {
    skills = fs.readdirSync(skillsDir).filter((d) => {
      try {
        return fs.statSync(path.join(skillsDir, d)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    // no skills dir
  }

  return {
    morningBriefDate: (heartbeat.morningBrief as string) || null,
    lastSignalCollection: (heartbeat.lastEvolutionSignal as string) || null,
    lastReview: (heartbeat.lastEvolutionReview as string) || null,
    improvements,
    recommendations,
    todayGaps,
    installedSkills: skills,
    skillCount: skills.length,
  };
}

export async function GET() {
  try {
    const cronData = getCronHeartbeat();
    const memoryData = getYesterdayMemory();
    const evolutionData = getEvolutionStatus();

    return NextResponse.json({
      cron: cronData,
      yesterdayMemory: memoryData,
      evolution: evolutionData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
