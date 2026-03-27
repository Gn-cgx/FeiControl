/**
 * Dynamic workspace resolver.
 * Discovers all workspace directories under OPENCLAW_DIR instead of hardcoding.
 */
import fs from 'fs';
import { homedir } from 'os';
import path from 'path';

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || path.join(homedir(), '.openclaw');

/**
 * Resolve a workspace ID to its absolute filesystem path.
 * Supports:
 *  - "workspace" → OPENCLAW_DIR/workspace
 *  - "workspace-codev" → OPENCLAW_DIR/workspace-codev
 *  - "mission-control" → OPENCLAW_DIR/workspace/mission-control (subdir of main workspace)
 *  - Any other workspace-* directory that exists
 */
export function resolveWorkspace(workspaceId: string): string | null {
  if (!workspaceId) return null;

  // Direct workspace match
  if (workspaceId === 'workspace') {
    const p = path.join(OPENCLAW_DIR, 'workspace');
    return fs.existsSync(p) ? p : null;
  }

  // workspace-* match (e.g., workspace-codev, workspace-linkedin)
  if (workspaceId.startsWith('workspace-')) {
    const p = path.join(OPENCLAW_DIR, workspaceId);
    return fs.existsSync(p) ? p : null;
  }

  // Check if it's a subdirectory of the main workspace (e.g., mission-control, mission-control-v2)
  const subdir = path.join(OPENCLAW_DIR, 'workspace', workspaceId);
  if (fs.existsSync(subdir)) {
    return subdir;
  }

  return null;
}

/**
 * Validate that a resolved file path is within its workspace base.
 * Prevents path traversal attacks.
 */
export function resolveAndValidatePath(workspaceId: string, filePath: string): { base: string; fullPath: string } | null {
  const base = resolveWorkspace(workspaceId || 'workspace');
  if (!base) return null;

  const fullPath = path.resolve(base, filePath);
  if (!fullPath.startsWith(base)) return null; // path traversal check

  return { base, fullPath };
}
