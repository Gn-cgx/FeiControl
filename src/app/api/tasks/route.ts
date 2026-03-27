import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isConfigured(): boolean {
  return Boolean(process.env.GOOGLE_TASKS_SCRIPT);
}

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({
      tasks: [],
      lists: [],
      total: 0,
      pending: 0,
      completed: 0,
      configured: false,
      message:
        "Google Tasks integration is available. Set the GOOGLE_TASKS_SCRIPT environment variable to your Google Tasks script path to enable.",
    });
  }

  // Configured but no implementation yet — return empty result
  return NextResponse.json({
    tasks: [],
    lists: [],
    total: 0,
    pending: 0,
    completed: 0,
    configured: true,
    message: "Google Tasks configured but no tasks available yet.",
    lastUpdated: new Date().toISOString(),
  });
}

export async function PATCH() {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Google Tasks not configured" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: "Google Tasks update not implemented" },
    { status: 501 }
  );
}
