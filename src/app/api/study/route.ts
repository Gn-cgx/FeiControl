import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import os from "os";

export const dynamic = "force-dynamic";

const DATA_DIR = join(os.homedir(), ".config", "mission-control");
const STUDY_FILE = join(DATA_DIR, "study-completions.json");

interface StudyCompletions {
  [key: string]: boolean; // key format: "d{day}-{itemIdx}"
}

async function loadCompletions(): Promise<StudyCompletions> {
  try {
    const data = await readFile(STUDY_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveCompletions(completions: StudyCompletions): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STUDY_FILE, JSON.stringify(completions, null, 2));
}

// GET /api/study — return all completions
export async function GET() {
  try {
    const completions = await loadCompletions();
    return NextResponse.json({ completions });
  } catch (error) {
    console.error("Failed to load study completions:", error);
    return NextResponse.json({ error: "无法加载学习进度" }, { status: 500 });
  }
}

// PATCH /api/study — toggle a study item
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, completed } = body;

    if (typeof key !== "string" || typeof completed !== "boolean") {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    const completions = await loadCompletions();

    if (completed) {
      completions[key] = true;
    } else {
      delete completions[key];
    }

    await saveCompletions(completions);
    return NextResponse.json({ completions });
  } catch (error) {
    console.error("Failed to update study completion:", error);
    return NextResponse.json({ error: "无法更新学习进度" }, { status: 500 });
  }
}
