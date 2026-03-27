import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import { join } from "path";

export const dynamic = "force-dynamic";

interface CalendarEvent {
  key: string;
  date: string;
  time: string;
  title: string;
  allDay: boolean;
}

type EventCompletionState = Record<string, boolean>;

const DATA_DIR = join(os.homedir(), ".config", "mission-control");
const CALENDAR_COMPLETIONS_FILE = join(DATA_DIR, "calendar-event-completions.json");

function buildEventKey(event: Omit<CalendarEvent, "key">): string {
  return `${event.date}|${event.time}|${event.allDay ? "1" : "0"}|${event.title}`;
}

function normalizeEventCompletions(payload: unknown): EventCompletionState {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const nextState: EventCompletionState = {};
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (typeof value === "boolean" && value) {
      nextState[key] = true;
    }
  }

  return nextState;
}

async function loadEventCompletions(): Promise<EventCompletionState> {
  try {
    const data = await readFile(CALENDAR_COMPLETIONS_FILE, "utf-8");
    return normalizeEventCompletions(JSON.parse(data));
  } catch {
    return {};
  }
}

async function saveEventCompletions(completions: EventCompletionState): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(CALENDAR_COMPLETIONS_FILE, JSON.stringify(completions, null, 2));
}

function decodeHtmlEntities(s: string): string {
  return s.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
          .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function parseKhalOutput(output: string): CalendarEvent[] {
  const lines = output.trim().split("\n").filter(Boolean);
  const events: CalendarEvent[] = [];
  const seen = new Set<string>();
  let currentDate = "";

  for (const line of lines) {
    // Date header: "Today, 03/22/26" or "Monday, 03/24/26" or "Tomorrow, 03/23/26"
    const dateMatch = line.match(/^[A-Za-z]+,?\s+(\d{2})\/(\d{2})\/(\d{2})$/);
    if (dateMatch) {
      currentDate = `20${dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]}`;
      continue;
    }

    // Skip raw datetime strings (e.g. " Mar 23 13:30:00 2026 ...")
    if (/^\s*[A-Z][a-z]{2}\s+\d/.test(line) && /\d{2}:\d{2}:\d{2}/.test(line)) continue;

    if (!currentDate) continue;

    // Event with time: "13:30-14:00 Terri Meeting ⏰"
    const eventMatch = line.match(/^(\d{1,2}:\d{2}(?:-\d{1,2}:\d{2})?)\s+(.+)$/);
    if (eventMatch) {
      const title = decodeHtmlEntities(eventMatch[2].replace(/[🔔⏰🔕⟳]/g, "").trim());
      const key = `${currentDate}|${eventMatch[1]}|${title}`;
      if (!seen.has(key)) {
        seen.add(key);
        events.push({
          key: buildEventKey({ date: currentDate, time: eventMatch[1], title, allDay: false }),
          date: currentDate,
          time: eventMatch[1],
          title,
          allDay: false,
        });
      }
      continue;
    }

    // All-day event (no time prefix, no raw datetime)
    const trimmed = line.trim();
    if (trimmed && !/\d{2}:\d{2}:\d{2}/.test(trimmed)) {
      const title = decodeHtmlEntities(trimmed.replace(/[🔔⏰🔕⟳]/g, "").trim());
      if (title) {
        const key = `${currentDate}|allday|${title}`;
        if (!seen.has(key)) {
          seen.add(key);
          events.push({
            key: buildEventKey({ date: currentDate, time: "全天", title, allDay: true }),
            date: currentDate,
            time: "全天",
            title,
            allDay: true,
          });
        }
      }
    }
  }

  return events;
}

function fmtDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${mm}/${dd}/${yy}`;
}

// In-memory cache: khal is ~0.7s per call, cache for 30s
let calendarCache:
  | {
      key: string;
      data: { events: CalendarEvent[]; today: string; lastUpdated: string };
      ts: number;
    }
  | null = null;
const CACHE_TTL = 30_000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const home = os.homedir();
    const env = { ...process.env, HOME: home };

    let fromStr: string, toStr: string;
    if (from && to) {
      const fd = new Date(from + "T00:00:00");
      const td = new Date(to + "T00:00:00");
      fromStr = fmtDate(fd);
      toStr = fmtDate(td);
    } else {
      fromStr = "today";
      toStr = "7d";
    }

    const cacheKey = `${fromStr}|${toStr}`;
    if (calendarCache && calendarCache.key === cacheKey && Date.now() - calendarCache.ts < CACHE_TTL) {
      const completions = await loadEventCompletions();
      return NextResponse.json({ ...calendarCache.data, completions });
    }

    let output = "";
    try {
      const khalConfig = `${home}/.local/share/khal/config`;
      // Ensure khal's install dir is on PATH (Next.js production server may lack user PATH entries)
      const khalEnv = {
        ...env,
        PATH: `${home}/.local/bin:${process.env.PATH || "/usr/local/bin:/usr/bin:/bin"}`,
      };
      output = execSync(`khal -c ${khalConfig} list ${fromStr} ${toStr}`, {
        encoding: "utf-8",
        timeout: 5000,
        env: khalEnv,
      });
    } catch {
      // khal not available
    }

    const events = parseKhalOutput(output);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const result = { events, today: todayStr, lastUpdated: new Date().toISOString() };
    calendarCache = { key: cacheKey, data: result, ts: Date.now() };

    const completions = await loadEventCompletions();
    return NextResponse.json({ ...result, completions });
  } catch (error) {
    console.error("Error fetching calendar:", error);
    return NextResponse.json({ error: "无法获取日程数据", events: [], today: "" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const completions = await loadEventCompletions();

    if (body && "completions" in body) {
      const mergedCompletions = {
        ...completions,
        ...normalizeEventCompletions(body.completions),
      };

      await saveEventCompletions(mergedCompletions);
      return NextResponse.json({ completions: mergedCompletions });
    }

    const key = typeof body?.key === "string" ? body.key.trim() : "";
    const completed = typeof body?.completed === "boolean" ? body.completed : null;

    if (!key || completed === null) {
      return NextResponse.json({ error: "请求参数无效" }, { status: 400 });
    }

    if (completed) {
      completions[key] = true;
    } else {
      delete completions[key];
    }

    await saveEventCompletions(completions);
    return NextResponse.json({ completions });
  } catch (error) {
    console.error("Error updating calendar completion:", error);
    return NextResponse.json({ error: "无法更新日程完成状态" }, { status: 500 });
  }
}
