import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { logActivity } from '@/lib/activities-db';
import { resolveAndValidatePath } from '@/lib/workspace-resolver';

// Protected paths - never allow deletion
const PROTECTED = [
  'MEMORY.md', 'SOUL.md', 'USER.md', 'AGENTS.md', 'TOOLS.md',
  'package.json', 'tsconfig.json', '.env', '.env.local',
];

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace, path: filePath } = body;

    if (!filePath) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 });
    }

    const resolved = resolveAndValidatePath(workspace || 'workspace', filePath);
    if (!resolved) {
      return NextResponse.json({ error: 'Unknown workspace or invalid path' }, { status: 400 });
    }

    const filename = path.basename(resolved.fullPath);
    if (PROTECTED.includes(filename)) {
      return NextResponse.json({ error: `Cannot delete protected file: ${filename}` }, { status: 403 });
    }

    const stat = await fs.stat(resolved.fullPath);
    if (stat.isDirectory()) {
      await fs.rm(resolved.fullPath, { recursive: true });
    } else {
      await fs.unlink(resolved.fullPath);
    }

    logActivity('file_write', `Deleted ${stat.isDirectory() ? 'folder' : 'file'}: ${filePath}`, 'success', {
      metadata: { workspace, filePath },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[delete] Error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
