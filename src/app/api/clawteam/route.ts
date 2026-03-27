import { execFile as execFileCb } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { NextResponse } from 'next/server';

const execFile = promisify(execFileCb);

const CLAWTEAM_API = process.env.CLAWTEAM_API_URL || 'http://127.0.0.1:8080';
const CLAWTEAM_CACHE_TTL_MS = 5000;
const OPENCLAW_TEAM_PREFIXES = ['oc-coding-', 'oc-finance-'];

// Remote ClawTeam sources (read from env, fallback to empty)
interface RemoteSource {
  name: string;
  host: string;
  port: number;
  origin: string;
  originLabel: string;
  timeoutMs: number;
  sshUser?: string;
  sshPort?: number;
  sshBoardHost?: string;
}
const REMOTE_CLAWTEAM_SOURCES: RemoteSource[] = (() => {
  try { return JSON.parse(process.env.REMOTE_CLAWTEAM_SOURCES || '[]'); }
  catch { return []; }
})();

type SpawnRegistryEntry = {
  backend?: string;
  tmux_target?: string;
  pid?: number;
};

type LocalTeamConfig = {
  description?: string;
  createdAt?: string;
};

type ClawTeamResponse = {
  active: boolean;
  teams: ClawTeamData[];
  timestamp: number;
  error?: string;
};

type LocalTeamRuntime = {
  name: string;
  description: string;
  createdAt: string;
  liveMembers: Set<string>;
};

type RemoteTeamPayload = {
  team?: {
    description?: string;
    createdAt?: string;
  };
  members?: Array<Record<string, unknown>>;
  taskSummary?: ClawTeamData['taskSummary'];
  tasks?: ClawTeamData['tasks'];
};

let cachedResponse: ClawTeamResponse | null = null;
let cachedResponseExpiresAt = 0;
let cacheRefreshPromise: Promise<ClawTeamResponse> | null = null;

// --- Runtime guard helpers ---
function safeString(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

function safeNumber(val: unknown, fallback = 0): number {
  return typeof val === 'number' && !Number.isNaN(val) ? val : fallback;
}

export interface ClawTeamMember {
  name: string;
  agentId: string;
  agentType: string;
  inboxCount: number;
  isAlive: boolean;
  origin?: string;
  originLabel?: string;
}

export interface ClawTeamTask {
  id: string;
  subject: string;
  status: string;
  owner: string;
  priority: string;
}

export interface ClawTeamData {
  teamName: string;
  description: string;
  members: ClawTeamMember[];
  taskSummary: { pending: number; in_progress: number; completed: number; blocked: number; total: number };
  tasks: { pending: ClawTeamTask[]; in_progress: ClawTeamTask[]; completed: ClawTeamTask[]; blocked: ClawTeamTask[] };
  createdAt: string;
  activeMemberCount: number;
  origin?: string;
  originLabel?: string;
}

function getClawTeamTeamsRoot() {
  return join(process.env.CLAWTEAM_DATA_DIR || join(homedir(), '.clawteam'), 'teams');
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function getLocalOrigin(): string {
  return process.env.CLAWTEAM_LOCAL_ORIGIN || 'mac';
}

function getLocalOriginLabel() {
  return process.env.CLAWTEAM_LOCAL_LABEL || '🍎';
}

function isPidAlive(pid: number | undefined) {
  if (!pid || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function isShellSafe(value: string): boolean {
  return /^[a-zA-Z0-9._:\/@\-]+$/.test(value);
}

async function isTmuxTargetAlive(target: string | undefined): Promise<boolean | null> {
  if (!target) {
    return false;
  }

  try {
    const { stdout } = await execFile(
      'tmux',
      ['list-panes', '-t', target, '-F', '#{pane_dead}'],
      { encoding: 'utf8' },
    );

    const lines = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return false;
    }

    // pane_current_command is not reliable for interactive CLIs launched
    // through wrapper shells like `zsh -c "claude ..."`.
    return lines.some((line) => line.trim() !== '1');
  } catch {
    return null;
  }
}

async function isRegistryEntryAlive(entry: SpawnRegistryEntry | undefined): Promise<boolean> {
  if (!entry) {
    return false;
  }

  if (entry.backend === 'tmux') {
    const tmuxAlive = await isTmuxTargetAlive(entry.tmux_target);
    if (tmuxAlive === true) {
      return true;
    }
    return isPidAlive(entry.pid);
  }

  if (entry.backend === 'subprocess') {
    return isPidAlive(entry.pid);
  }

  return false;
}

async function getLiveTeamRuntimes(): Promise<LocalTeamRuntime[]> {
  const teamsRoot = getClawTeamTeamsRoot();

  let dirEntries;
  try {
    dirEntries = (await readdir(teamsRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && OPENCLAW_TEAM_PREFIXES.some((prefix) => entry.name.startsWith(prefix)));
  } catch {
    return [];
  }

  const results: LocalTeamRuntime[] = [];
  for (const entry of dirEntries) {
    const teamRoot = join(teamsRoot, entry.name);
    const config = await readJsonFile<LocalTeamConfig>(join(teamRoot, 'config.json'));
    const registry = (await readJsonFile<Record<string, SpawnRegistryEntry>>(join(teamRoot, 'spawn_registry.json'))) || {};

    const aliveChecks = await Promise.all(
      Object.entries(registry).map(async ([memberName, spawnInfo]) => ({
        memberName,
        alive: await isRegistryEntryAlive(spawnInfo),
      })),
    );
    const liveMembers = new Set(aliveChecks.filter((e) => e.alive).map((e) => e.memberName));

    if (liveMembers.size > 0) {
      results.push({
        name: entry.name,
        description: config?.description || '',
        createdAt: config?.createdAt || '',
        liveMembers,
      });
    }
  }

  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function setCachedResponse(payload: ClawTeamResponse) {
  cachedResponse = payload;
  cachedResponseExpiresAt = Date.now() + CLAWTEAM_CACHE_TTL_MS;
}

async function fetchRemoteJson<T>(source: RemoteSource, path: string): Promise<T | null> {
  const baseUrl = `http://${source.host}:${source.port}`;

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(source.timeoutMs),
    });
    if (response.ok) {
      return await response.json() as T;
    }
  } catch {
    // Fall through to optional SSH fallback below.
  }

  if (!source.sshUser) {
    return null;
  }

  // Validate inputs to prevent command injection via shell metacharacters
  if (!isShellSafe(source.sshUser) || !isShellSafe(source.host) || !isShellSafe(path) || !isShellSafe(source.sshBoardHost || '127.0.0.1')) {
    console.error('[clawteam] SSH fallback rejected: unsafe characters in source config');
    return null;
  }

  const sshTimeoutSeconds = Math.max(1, Math.ceil(source.timeoutMs / 1000));
  const sshPort = source.sshPort || 22;
  const boardHost = source.sshBoardHost || '127.0.0.1';
  const remoteUrl = `http://${boardHost}:${source.port}${path}`;
  const sshTarget = `${source.sshUser}@${source.host}`;

  try {
    // Pass curl args separately — SSH joins them for the remote shell,
    // avoiding the need to construct a quoted shell command string.
    const { stdout } = await execFile(
      'ssh',
      [
        '-o', 'BatchMode=yes',
        '-o', `ConnectTimeout=${sshTimeoutSeconds}`,
        '-p', String(sshPort),
        sshTarget,
        'curl', '-fsSL', '--max-time', String(sshTimeoutSeconds), remoteUrl,
      ],
      {
        encoding: 'utf8',
        timeout: source.timeoutMs + 1000,
        maxBuffer: 1024 * 1024,
      },
    );

    if (!stdout.trim()) {
      return null;
    }

    return JSON.parse(stdout) as T;
  } catch (err) {
    console.error('[clawteam] SSH fallback failed', { source: source.name, path, error: String(err) });
    return null;
  }
}

/**
 * Fetch ClawTeam data from a remote source (e.g. PC via Tailscale).
 * Returns teams with origin markers. Silently returns [] on any failure.
 */
async function fetchRemoteClawTeams(): Promise<ClawTeamData[]> {
  const sourceResults = await Promise.allSettled(
    REMOTE_CLAWTEAM_SOURCES.map(async (source) => {
      // Step 1: Get team list from /api/overview
      const overview = await fetchRemoteJson<Array<{ name: string }>>(source, '/api/overview');
      if (!overview) return [];

      // Step 2: Filter to oc- prefixed teams and fetch details in parallel
      const ocTeams = overview.filter((t) =>
        OPENCLAW_TEAM_PREFIXES.some((prefix) => t.name.startsWith(prefix))
      );

      const teamResults = await Promise.allSettled(
        ocTeams.map((teamMeta) =>
          fetchRemoteJson<RemoteTeamPayload>(source, `/api/team/${teamMeta.name}`)
            .then((data) => data ? { teamMeta, data } : null)
        ),
      );

      const teams: ClawTeamData[] = [];
      for (const result of teamResults) {
        if (result.status !== 'fulfilled' || !result.value) continue;
        const { teamMeta, data } = result.value;

        const remoteMembers = Array.isArray(data.members) ? data.members : [];

        const members: ClawTeamMember[] = remoteMembers.map((m) => ({
          name: safeString(m.name, 'unknown'),
          agentId: safeString(m.agentId) || safeString(m.name, 'unknown'),
          agentType: safeString(m.agentType, 'worker'),
          inboxCount: safeNumber(m.inboxCount),
          isAlive: true, // If the remote API returns them, they're alive
          origin: source.origin,
          originLabel: source.originLabel,
        }));

        if (members.length > 0) {
          teams.push({
            teamName: teamMeta.name,
            description: data.team?.description || '',
            members,
            taskSummary: data.taskSummary || { pending: 0, in_progress: 0, completed: 0, blocked: 0, total: 0 },
            tasks: data.tasks || { pending: [], in_progress: [], completed: [], blocked: [] },
            createdAt: data.team?.createdAt || '',
            activeMemberCount: members.length,
            origin: source.origin,
            originLabel: source.originLabel,
          });
        }
      }
      return teams;
    }),
  );

  const results: ClawTeamData[] = [];
  for (const result of sourceResults) {
    if (result.status === 'fulfilled') {
      results.push(...result.value);
    } else {
      console.error('[clawteam] Remote source unreachable', { error: String(result.reason) });
    }
  }
  return results;
}

/**
 * Build team data directly from filesystem config when board server is down.
 * Reads config.json + tasks/ to construct a ClawTeamData without the HTTP API.
 */
async function getTeamDataFromFilesystem(runtime: LocalTeamRuntime): Promise<ClawTeamData | null> {
  const teamsRoot = getClawTeamTeamsRoot();
  const teamRoot = join(teamsRoot, runtime.name);

  // Read config.json for member info
  const config = await readJsonFile<{
    name: string;
    description?: string;
    createdAt?: string;
    leadAgentId?: string;
    members?: Array<{ name: string; agentId?: string; agentType?: string; user?: string }>;
  }>(join(teamRoot, 'config.json'));

  if (!config || !config.members) return null;

  const origin = getLocalOrigin();
  const originLabel = getLocalOriginLabel();

  const visibleMembers: ClawTeamMember[] = config.members
    .filter((m) => runtime.liveMembers.has(m.user ? `${m.user}_${m.name}` : m.name) || runtime.liveMembers.has(m.name))
    .map((m) => ({
      name: m.name,
      agentId: m.agentId || m.name,
      agentType: m.agentType || 'worker',
      inboxCount: 0,
      isAlive: true,
      origin,
      originLabel,
    }));

  if (visibleMembers.length === 0) return null;

  // Try to read tasks from tasks directory
  const dataDir = process.env.CLAWTEAM_DATA_DIR || join(homedir(), '.clawteam');
  const tasksDir = join(dataDir, 'tasks', runtime.name);
  const taskSummary = { pending: 0, in_progress: 0, completed: 0, blocked: 0, total: 0 };
  const tasks: { pending: ClawTeamTask[]; in_progress: ClawTeamTask[]; completed: ClawTeamTask[]; blocked: ClawTeamTask[] } = {
    pending: [], in_progress: [], completed: [], blocked: [],
  };

  try {
    const taskFiles = (await readdir(tasksDir)).filter((f) => f.endsWith('.json'));
    for (const tf of taskFiles) {
      const task = await readJsonFile<{ id?: string; subject?: string; status?: string; owner?: string; priority?: string }>(join(tasksDir, tf));
      if (!task) continue;
      const status = (task.status || 'pending') as keyof typeof tasks;
      if (status in tasks) {
        const taskEntry: ClawTeamTask = {
          id: task.id || tf.replace('.json', ''),
          subject: task.subject || '',
          status: task.status || 'pending',
          owner: task.owner || '',
          priority: task.priority || 'medium',
        };
        tasks[status].push(taskEntry);
        taskSummary[status]++;
        taskSummary.total++;
      }
    }
  } catch {
    // Tasks dir doesn't exist or unreadable — skip
  }

  return {
    teamName: runtime.name,
    description: config.description || runtime.description,
    members: visibleMembers,
    taskSummary,
    tasks,
    createdAt: config.createdAt || runtime.createdAt,
    activeMemberCount: visibleMembers.length,
    origin,
    originLabel,
  };
}

/**
 * Get local ClawTeam data with origin markers.
 * Tries board server API first, falls back to filesystem if unavailable.
 */
async function getLocalClawTeams(): Promise<ClawTeamData[]> {
  const liveTeamRuntimes = await getLiveTeamRuntimes();
  if (liveTeamRuntimes.length === 0) return [];

  const teamResults = await Promise.allSettled(
    liveTeamRuntimes.map(async (runtime) => {
      try {
        const teamRes = await fetch(`${CLAWTEAM_API}/api/team/${runtime.name}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(3000),
        });
        if (!teamRes.ok) throw new Error('Board API returned non-OK');

        const data = await teamRes.json();
        const visibleMembers: ClawTeamMember[] = (data.members || [])
          .map((member: Record<string, unknown>) => ({
            name: safeString(member.name, 'unknown'),
            agentId: safeString(member.agentId, 'unknown'),
            agentType: safeString(member.agentType, 'worker'),
            inboxCount: safeNumber(member.inboxCount),
            isAlive: runtime.liveMembers.has(safeString(member.name))
              || runtime.liveMembers.has(safeString(member.memberKey)),
            origin: getLocalOrigin(),
            originLabel: getLocalOriginLabel(),
          }))
          .filter((member: ClawTeamMember) => member.isAlive);

        if (visibleMembers.length === 0) {
          // Board API returned members but none match spawn_registry — try filesystem
          const fsTeam = await getTeamDataFromFilesystem(runtime);
          return fsTeam;
        }

        return {
          teamName: runtime.name,
          description: data.team?.description || runtime.description,
          members: visibleMembers,
          taskSummary: data.taskSummary || { pending: 0, in_progress: 0, completed: 0, blocked: 0, total: 0 },
          tasks: data.tasks || { pending: [], in_progress: [], completed: [], blocked: [] },
          createdAt: data.team?.createdAt || runtime.createdAt,
          activeMemberCount: visibleMembers.length,
          origin: getLocalOrigin(),
          originLabel: getLocalOriginLabel(),
        } as ClawTeamData;
      } catch (err) {
        console.error('[clawteam] Board API unreachable for team', { team: runtime.name, error: String(err) });
        // Board server unreachable — fall back to filesystem
        const fsTeam = await getTeamDataFromFilesystem(runtime);
        return fsTeam;
      }
    }),
  );

  const teams: ClawTeamData[] = [];
  for (const result of teamResults) {
    if (result.status === 'fulfilled' && result.value) {
      teams.push(result.value);
    }
  }
  return teams;
}

/**
 * Core data refresh logic — extracted for cache lock pattern.
 */
async function refreshClawTeamData(): Promise<ClawTeamResponse> {
  // Concurrently fetch local + remote
  const [localTeams, remoteTeams] = await Promise.all([
    getLocalClawTeams(),
    fetchRemoteClawTeams(),
  ]);

  const allTeams = [...localTeams, ...remoteTeams];

  allTeams.sort(
    (a, b) =>
      b.activeMemberCount - a.activeMemberCount ||
      b.createdAt.localeCompare(a.createdAt),
  );

  const payload: ClawTeamResponse = {
    active: allTeams.length > 0,
    teams: allTeams,
    timestamp: Date.now(),
  };
  setCachedResponse(payload);
  return payload;
}

/**
 * GET /api/clawteam
 * Return currently live ClawTeam teams from both local Mac and remote PC.
 */
export async function GET() {
  // Serve from cache if fresh
  if (cachedResponse && Date.now() < cachedResponseExpiresAt) {
    return NextResponse.json(cachedResponse);
  }

  // If another request is already refreshing, wait for it
  if (cacheRefreshPromise) {
    const result = await cacheRefreshPromise;
    return NextResponse.json(result);
  }

  // This request will refresh
  cacheRefreshPromise = refreshClawTeamData();
  try {
    const payload = await cacheRefreshPromise;
    return NextResponse.json(payload);
  } catch (err) {
    console.error('[clawteam] GET handler error', { error: String(err) });
    // Don't cache error responses — let next request retry immediately
    const payload: ClawTeamResponse = { active: false, teams: [], error: 'ClawTeam API unreachable', timestamp: Date.now() };
    return NextResponse.json(payload, { status: 503 });
  } finally {
    cacheRefreshPromise = null;
  }
}
