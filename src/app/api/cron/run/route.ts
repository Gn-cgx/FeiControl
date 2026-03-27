import { execFileSync, type ExecFileSyncOptions } from "child_process";
import { NextRequest, NextResponse } from "next/server";

async function createNotification(
  requestUrl: string,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "error" = "info"
) {
  try {
    const notificationsUrl = new URL("/api/notifications", requestUrl);
    await fetch(notificationsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, type }),
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

function isSafeJobId(id: string): boolean {
  return /^[A-Za-z0-9._:-]+$/.test(id);
}

export async function POST(request: NextRequest) {
  let id = "";

  try {
    const body = (await request.json()) as { id?: unknown; name?: unknown };
    id = typeof body.id === "string" ? body.id : "";
    const jobName = typeof body.name === "string" ? body.name : id;

    if (!id) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    if (!isSafeJobId(id)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    let output = "";
    try {
      output = execFileSync("openclaw", ["cron", "run", id], {
        timeout: 15000,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (execErr: unknown) {
      // execFileSync throws on non-zero exit codes, but the command may still
      // have produced valid JSON on stdout (e.g. {"ok":true,"ran":false,"reason":"already-running"}).
      const e = execErr as { stdout?: string; stderr?: string };
      output = (typeof e.stdout === "string" ? e.stdout : "") ||
               (typeof e.stderr === "string" ? e.stderr : "");
      if (!output.trim()) throw execErr; // truly failed
    }

    // Parse JSON output from openclaw cron run
    let result: { ok?: boolean; enqueued?: boolean; ran?: boolean; reason?: string } = {};
    try {
      result = JSON.parse(output.trim());
    } catch {
      // not JSON, treat raw output as success message
    }

    // Handle "already-running" gracefully
    if (result.ok === true && result.ran === false && result.reason === "already-running") {
      await createNotification(
        request.url,
        "Cron Job Already Running",
        `Job "${id}" is already running.`,
        "warning"
      );
      return NextResponse.json({
        success: true,
        jobId: id,
        message: "Job is already running",
        alreadyRunning: true,
      });
    }

    // --- Skip today's scheduled run: disable cron, schedule re-enable tomorrow 7am ---
    let skipped = false;
    try {
      // 1. Disable current cron so today's scheduled run is skipped
      execFileSync("openclaw", ["cron", "edit", id, "--disable"], {
        timeout: 10000,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      // 2. Compute tomorrow 7:00 AM PDT in ISO format
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      // Build an ISO-ish string with explicit offset for PDT (-07:00)
      // We need tomorrow's date in PDT. Use a fixed offset approach.
      const pdtOffset = -7 * 60; // PDT = UTC-7
      const utcTomorrow7am = new Date(
        Date.UTC(
          tomorrow.getFullYear(),
          tomorrow.getMonth(),
          tomorrow.getDate(),
          7 - pdtOffset / -60, // 7 + 7 = 14 UTC
          0,
          0
        )
      );
      // But we need to get the correct date in PDT context
      const pdtNow = new Date(now.getTime() + pdtOffset * 60000);
      const pdtTomorrow = new Date(pdtNow);
      pdtTomorrow.setUTCDate(pdtTomorrow.getUTCDate() + 1);
      const yyyy = pdtTomorrow.getUTCFullYear();
      const mm = String(pdtTomorrow.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(pdtTomorrow.getUTCDate()).padStart(2, "0");
      const atTime = `${yyyy}-${mm}-${dd}T07:00:00-07:00`;

      // 3. Create one-shot cron to re-enable tomorrow at 7am PDT
      execFileSync(
        "openclaw",
        [
          "cron", "add",
          "--name", `恢复 ${jobName}`,
          "--at", atTime,
          "--session", "isolated",
          "--timeout-seconds", "60",
          "--message", `openclaw cron edit ${id} --enable`,
          "--delete-after-run",
        ],
        {
          timeout: 10000,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        } as ExecFileSyncOptions
      );

      skipped = true;
    } catch (skipErr) {
      console.error("Failed to set up skip-today logic:", skipErr);
      // Non-fatal: the job was already triggered successfully
    }

    const toastMsg = skipped
      ? "触发成功，今天的定时执行已跳过"
      : "Job triggered successfully";

    await createNotification(
      request.url,
      "Cron Job Triggered",
      skipped
        ? `Job "${id}" 已手动执行，今天的定时执行已跳过，明天 7:00 AM 自动恢复。`
        : `Job "${id}" has been manually executed.`,
      "success"
    );

    return NextResponse.json({
      success: true,
      jobId: id,
      message: output.trim() || toastMsg,
      skipped,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to trigger job";
    console.error("Error triggering cron job:", error);

    await createNotification(
      request.url,
      "Cron Job Failed",
      `Failed to execute job "${id || "unknown"}": ${message}`,
      "error"
    );

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
