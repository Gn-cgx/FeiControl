/**
 * Write file content endpoint
 * POST /api/files/write
 * Body: { workspace, path, content }
 */
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { logActivity } from '@/lib/activities-db';
import { resolveAndValidatePath } from '@/lib/workspace-resolver';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace, path: filePath, content } = body;

    if (!filePath || content === undefined) {
      return NextResponse.json({ error: 'Missing path or content' }, { status: 400 });
    }

    const resolved = resolveAndValidatePath(workspace || 'workspace', filePath);
    if (!resolved) {
      return NextResponse.json({ error: 'Unknown workspace or invalid path' }, { status: 400 });
    }

    // Create parent directories if needed
    await fs.mkdir(path.dirname(resolved.fullPath), { recursive: true });
    await fs.writeFile(resolved.fullPath, content, 'utf-8');

    const stat = await fs.stat(resolved.fullPath);

    logActivity('file_write', `Edited file: ${filePath}`, 'success', {
      metadata: { workspace, filePath, size: stat.size },
    });

    return NextResponse.json({ success: true, path: filePath, size: stat.size });
  } catch (error) {
    console.error('[write] Error:', error);
    return NextResponse.json({ error: 'Write failed' }, { status: 500 });
  }
}
