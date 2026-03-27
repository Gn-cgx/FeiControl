import { execFileSync } from "child_process";
import { NextResponse } from "next/server";
import os from "os";

export const dynamic = "force-dynamic";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  due?: string;
  parent?: string;
  indent: number;
}

interface TasksResult {
  tasks: Task[];
  total: number;
  pending: number;
  completed: number;
  lastUpdated: string;
}

function parseTasksOutput(output: string): Task[] {
  const lines = output.trim().split("\n").filter(Boolean);
  const tasks: Task[] = [];

  for (const line of lines) {
    const match = line.match(/^(\s*)(⬜|✅)\s+(.+?)\s+\[([^\]]+)\]$/);
    if (match) {
      const indent = Math.floor(match[1].length / 2);
      const completed = match[2] === "✅";
      const title = match[3].trim();
      const id = match[4];

      tasks.push({
        id,
        title,
        completed,
        indent,
      });
    }
  }

  return tasks;
}

// In-memory cache: Google Tasks API is ~0.5s per call, cache for 30s
let tasksCache: { data: TasksResult; ts: number } | null = null;
const CACHE_TTL = 30_000;

function getScriptConfig() {
  const home = os.homedir();

  return {
    home,
    scriptPath: `${home}/.config/mission-control/google-tasks.py`,
  };
}

function getProcessErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const processError = error as {
      message?: string;
      stderr?: string | Buffer;
      stdout?: string | Buffer;
    };

    const stderr =
      typeof processError.stderr === "string"
        ? processError.stderr
        : Buffer.isBuffer(processError.stderr)
          ? processError.stderr.toString("utf-8")
          : "";
    const stdout =
      typeof processError.stdout === "string"
        ? processError.stdout
        : Buffer.isBuffer(processError.stdout)
          ? processError.stdout.toString("utf-8")
          : "";
    const message = typeof processError.message === "string" ? processError.message : "";
    const candidate = [stderr, stdout, message].find((value) => value.trim().length > 0);

    if (candidate) {
      return candidate.trim().split("\n").find(Boolean) ?? candidate.trim();
    }
  }

  return "未知错误";
}

function runGoogleTasks(args: string[]): string {
  const { home, scriptPath } = getScriptConfig();

  return execFileSync("python3", [scriptPath, ...args], {
    encoding: "utf-8",
    timeout: 15000,
    env: { ...process.env, HOME: home },
  });
}

function buildTasksResult(tasks: Task[]): TasksResult {
  return {
    tasks,
    total: tasks.length,
    pending: tasks.filter((task) => !task.completed).length,
    completed: tasks.filter((task) => task.completed).length,
    lastUpdated: new Date().toISOString(),
  };
}

function loadTasksData(forceRefresh = false): TasksResult {
  if (!forceRefresh && tasksCache && Date.now() - tasksCache.ts < CACHE_TTL) {
    return tasksCache.data;
  }

  const output = runGoogleTasks(["list"]);
  const result = buildTasksResult(parseTasksOutput(output));
  tasksCache = { data: result, ts: Date.now() };

  return result;
}

export async function GET() {
  try {
    return NextResponse.json(loadTasksData());
  } catch (error) {
    console.error("Error fetching tasks:", error);
    const errorMessage = getProcessErrorMessage(error);
    return NextResponse.json(
      {
        error: `无法获取任务列表：${errorMessage}`,
        tasks: [],
        total: 0,
        pending: 0,
        completed: 0,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const taskId = typeof body?.taskId === "string" ? body.taskId.trim() : "";
    const completed = typeof body?.completed === "boolean" ? body.completed : null;

    if (!taskId || completed === null) {
      return NextResponse.json({ error: "请求参数无效" }, { status: 400 });
    }

    runGoogleTasks([completed ? "done" : "pending", taskId]);
    tasksCache = null;

    return NextResponse.json(loadTasksData(true));
  } catch (error) {
    tasksCache = null;
    console.error("Error updating task:", error);
    const errorMessage = getProcessErrorMessage(error);

    return NextResponse.json(
      { error: `无法同步 Google Tasks：${errorMessage}` },
      { status: 500 }
    );
  }
}
