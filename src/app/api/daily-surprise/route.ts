import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const dynamic = "force-dynamic";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || path.join(os.homedir(), ".openclaw");
const SURPRISE_DIR = path.join(OPENCLAW_DIR, "workspace", "daily-surprise");

// GET /api/daily-surprise?date=YYYY-MM-DD
// If no date param, defaults to today (PST)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  // Default to today in PST
  const date = dateParam || getTodayPST();
  const filePath = path.join(SURPRISE_DIR, date, "index.html");

  // list mode: return available dates
  if (searchParams.get("list") === "true") {
    try {
      const entries = fs.readdirSync(SURPRISE_DIR, { withFileTypes: true });
      const dates = entries
        .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
        .map((e) => e.name)
        .sort()
        .reverse();
      return NextResponse.json({ dates });
    } catch {
      return NextResponse.json({ dates: [] });
    }
  }

  try {
    const html = fs.readFileSync(filePath, "utf-8");
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return new NextResponse(
      `<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui;background:#0a0a0a;color:#fff;font-size:1.5rem;">今日惊喜正在制作中 🎁 请稍后再来</body></html>`,
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}

function getTodayPST(): string {
  const now = new Date();
  const pst = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const y = pst.getFullYear();
  const m = String(pst.getMonth() + 1).padStart(2, "0");
  const d = String(pst.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
